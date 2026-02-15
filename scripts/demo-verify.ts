import { spawn, ChildProcess } from "node:child_process";
import process from "node:process";
import { launch as launchChrome } from "chrome-launcher";
import puppeteer, { type Browser } from "puppeteer-core";
import {
  buildSurfaceUrlsFromPlan,
  type GbvPageType,
  type GbvVerificationArtifact,
} from "@gbv/core";
import { gbvConfig } from "@gbv/config";

type InitResponse = {
  ok: boolean;
  sessionId: string;
  artifact: GbvVerificationArtifact;
  pagePlan: GbvPageType[];
  pageNonces: string[];
  nonceLeafId: string;
};

type CatalogResponse = {
  ok: boolean;
  courses: GbvVerificationArtifact[];
};

type Snapshot = {
  url: string;
  html: string;
  injectedNonce: string;
};

function assertCondition(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function spawnProcess(args: string[]): ChildProcess {
  return spawn("corepack", ["pnpm", ...args], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
}

function terminateProcess(child: ChildProcess): void {
  if (!child.pid) return;

  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore",
      shell: true,
    });
    return;
  }

  child.kill("SIGTERM");
}

async function waitForReady(url: string, timeoutMs = 90_000): Promise<void> {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // ignored while booting
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

async function launchHeadlessBrowser(): Promise<{ browser: Browser; stop: () => Promise<void> }> {
  const chrome = await launchChrome({
    chromeFlags: [
      "--headless",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
    ],
    logLevel: "error",
  });

  const browser = await puppeteer.connect({
    browserURL: `http://127.0.0.1:${chrome.port}`,
    defaultViewport: { width: 1280, height: 800 },
  });

  return {
    browser,
    stop: async () => {
      await browser.close();
      await chrome.kill();
    },
  };
}

async function captureSnapshotInBrowser(
  browser: Browser,
  url: string,
  nonceLeafId: string,
  nonce: string,
): Promise<Snapshot> {
  const page = await browser.newPage();

  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    const snapshot = await page.evaluate(
      ({ nonceLeafIdArg, nonceValue }) => {
        const selector = `meta[${nonceLeafIdArg}]`;
        let nonceNode = document.querySelector(selector) as HTMLMetaElement | null;

        if (!nonceNode) {
          nonceNode = document.createElement("meta");
          nonceNode.setAttribute(nonceLeafIdArg, nonceValue);
          (document.head || document.documentElement).appendChild(nonceNode);
        } else {
          nonceNode.setAttribute(nonceLeafIdArg, nonceValue);
        }

        return {
          url: window.location.href,
          html: document.documentElement?.outerHTML || "",
          injectedNonce: nonceNode.getAttribute(nonceLeafIdArg) || "",
        };
      },
      {
        nonceLeafIdArg: nonceLeafId,
        nonceValue: nonce,
      },
    );

    if (!snapshot.url || !snapshot.html || !snapshot.injectedNonce) {
      throw new Error(`Invalid surface snapshot for ${url}`);
    }

    return snapshot;
  } finally {
    await page.close();
  }
}

async function fetchCourseCatalog(): Promise<GbvVerificationArtifact[]> {
  const response = await fetch(
    `${gbvConfig.origins.syntheticClient}${gbvConfig.demo.courseCatalogApiPath}`,
  );
  const json = (await response.json()) as CatalogResponse;
  if (!response.ok || !json.ok || !Array.isArray(json.courses)) {
    throw new Error(`Failed to load synthetic course catalog: ${JSON.stringify(json)}`);
  }
  return json.courses;
}

async function runCourseVerification(
  browser: Browser,
  artifact: GbvVerificationArtifact,
): Promise<{ artifact: GbvVerificationArtifact; status: number; body: any }> {
  const initResponse = await fetch(`${gbvConfig.origins.server}/api/gbv/init`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ artifact }),
  });

  const initJson = (await initResponse.json()) as InitResponse;
  if (!initResponse.ok || !initJson.ok) {
    throw new Error(`Init failed for ${artifact.publicCourseKey}: ${JSON.stringify(initJson)}`);
  }

  const urls = buildSurfaceUrlsFromPlan({
    origin: gbvConfig.origins.syntheticClient,
    pagePlan: initJson.pagePlan,
    templates: gbvConfig.demo.surfacePathTemplates,
    artifact,
  });

  const pages = [];
  for (let i = 0; i < urls.length; i += 1) {
    const url = urls[i];
    const nonce = initJson.pageNonces[i];
    const snapshot = await captureSnapshotInBrowser(browser, url, initJson.nonceLeafId, nonce);

    pages.push({
      url: snapshot.url,
      injectedNonce: snapshot.injectedNonce,
      html: snapshot.html,
    });
  }

  const submitResponse = await fetch(`${gbvConfig.origins.server}/api/gbv/submit`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      sessionId: initJson.sessionId,
      courseId: artifact.courseId,
      provider: gbvConfig.protocol.providerId,
      pages,
    }),
  });

  const submitJson = await submitResponse.json();
  return {
    artifact,
    status: submitResponse.status,
    body: submitJson,
  };
}

function evaluateResult(result: { artifact: GbvVerificationArtifact; status: number; body: any }): void {
  const key = result.artifact.publicCourseKey;
  const body = result.body as Record<string, any>;

  if (key === gbvConfig.demo.verifierBaselineCourseKey) {
    assertCondition(result.status === 200, `Expected baseline status 200 for ${key}`);
    assertCondition(body.ok === true, `Expected baseline ok=true for ${key}`);
    assertCondition(body.accepted === true, `Expected baseline accepted=true for ${key}`);
    assertCondition(
      body?.verificationLog?.structure?.ok === true,
      `Expected baseline structure.ok=true for ${key}`,
    );
    assertCondition(
      body?.verificationLog?.semantic?.ok === true,
      `Expected baseline semantic.ok=true for ${key}`,
    );
    console.log(`${key}: ACCEPTED (strict checks passed)`);
    return;
  }

  if (key === gbvConfig.demo.verifierAdversarialCourseKey) {
    assertCondition(result.status === 400, `Expected adversarial status 400 for ${key}`);
    assertCondition(body.ok === false, `Expected adversarial ok=false for ${key}`);
    assertCondition(
      body.code === "SEMANTIC_VERIFICATION_FAILED",
      `Expected adversarial code=SEMANTIC_VERIFICATION_FAILED for ${key}`,
    );
    const failedInvariantIds: string[] =
      body?.meta?.failedInvariantIds || body?.failedInvariantIds || [];
    assertCondition(
      failedInvariantIds.includes("grade_threshold"),
      `Expected adversarial failure to include grade_threshold for ${key}`,
    );
    assertCondition(
      failedInvariantIds.includes("course_key_consistency"),
      `Expected adversarial failure to include course_key_consistency for ${key}`,
    );
    console.log(`${key}: REJECTED (strict checks passed)`);
    return;
  }

  throw new Error(`Unexpected verifier key in strict evaluation: ${key}`);
}

async function main() {
  const server = spawnProcess(["--filter", "@gbv/server", "dev"]);
  const client = spawnProcess(["--filter", "@gbv/synthetic-client", "dev"]);

  const cleanupProcesses = () => {
    terminateProcess(server);
    terminateProcess(client);
  };

  process.on("SIGINT", cleanupProcesses);
  process.on("SIGTERM", cleanupProcesses);

  let stopBrowser: (() => Promise<void>) | null = null;

  try {
    await waitForReady(`${gbvConfig.origins.server}/api/health`);
    await waitForReady(`${gbvConfig.origins.syntheticClient}/hub`);

    const browserRuntime = await launchHeadlessBrowser();
    stopBrowser = browserRuntime.stop;

    const catalog = await fetchCourseCatalog();
    const selectedKeys = new Set<string>([
      gbvConfig.demo.verifierBaselineCourseKey,
      gbvConfig.demo.verifierAdversarialCourseKey,
    ]);
    const selected = catalog.filter((course) => selectedKeys.has(course.publicCourseKey));

    assertCondition(
      selected.length === selectedKeys.size,
      `Expected ${selectedKeys.size} verifier courses, found ${selected.length}`,
    );

    const results = [];
    for (const artifact of selected) {
      const result = await runCourseVerification(browserRuntime.browser, artifact);
      results.push(result);
    }

    for (const result of results) {
      evaluateResult(result);
    }

    console.log("OVERALL: PASS (strict assertions)");
  } finally {
    if (stopBrowser) {
      await stopBrowser();
    }
    cleanupProcesses();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
