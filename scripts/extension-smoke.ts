import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

async function ensureBuildExists(buildPath: string): Promise<void> {
  await access(path.join(buildPath, "manifest.json"));
  await access(path.join(buildPath, "background.js"));
}

async function main(): Promise<void> {
  const extensionPath = path.resolve("apps/extension/build");
  await ensureBuildExists(extensionPath);

  const userDataDir = path.resolve(".tmp-extension-smoke-profile");
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      "--no-first-run",
      "--no-default-browser-check",
    ],
  });

  try {
    let worker = context.serviceWorkers()[0];
    if (!worker) {
      worker = await context.waitForEvent("serviceworker", { timeout: 15_000 });
    }
    assert.ok(worker, "extension service worker failed to start");

    const workerUrl = worker.url();
    assert.ok(workerUrl.startsWith("chrome-extension://"), "unexpected service worker URL");
    const extensionId = new URL(workerUrl).host;
    const extensionPage = await context.newPage();
    await extensionPage.goto(`chrome-extension://${extensionId}/index.html`);

    let payload: {
      response?: { ok?: boolean; serviceWorker?: string };
      lastError?: string | null;
    } | null = null;
    for (let attempt = 1; attempt <= 20; attempt += 1) {
      const ping = await extensionPage.evaluate(async () => {
        type RuntimeResponse = { ok?: boolean; serviceWorker?: string };
        type ChromeRuntime = {
          runtime: {
            sendMessage: (
              message: { type: string },
              callback: (response: RuntimeResponse | undefined) => void,
            ) => void;
            lastError?: { message?: string };
          };
        };
        const { chrome } = globalThis as typeof globalThis & { chrome: ChromeRuntime };
        return await new Promise((resolve) => {
          chrome.runtime.sendMessage({ type: "GBV_PING" }, (response) => {
            resolve({
              response,
              lastError: chrome.runtime.lastError?.message || null,
            });
          });
        });
      });
      payload = ping as {
        response?: { ok?: boolean; serviceWorker?: string };
        lastError?: string | null;
      };
      if (!payload.lastError && payload.response?.ok) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    assert.ok(payload, "missing ping payload");
    assert.equal(payload.lastError, null, `GBV_PING failed: ${payload.lastError}`);
    assert.equal(payload.response?.ok, true, "GBV_PING did not return ok=true");
    assert.equal(payload.response?.serviceWorker, "ready", "GBV_PING did not confirm readiness");
    await extensionPage.close();

    console.log("Extension smoke: PASS");
  } finally {
    await context.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
