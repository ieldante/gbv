import { gbvConfig } from "@gbv/config";
import {
  buildSurfaceUrlsFromPlan,
  type GbvPageType,
  type GbvVerificationArtifact,
} from "@gbv/core/browser";
import type {
  CanonicalizedSurface,
  CollectSurfaceMessage,
  CollectSurfaceResponse,
  GbvSubmitResponsePayload,
  RunFlowResult,
} from "./messages";
import { debugLog } from "./log";

type InitResponse = {
  ok: boolean;
  sessionId: string;
  challengeNonce: string;
  artifact: GbvVerificationArtifact;
  pagePlan: string[];
  pageNonces: string[];
  nonceLeafId: string;
};

/**
 * Wait for a tab to complete loading before sending collection commands.
 *
 * Spec Stage II.
 */
async function waitForTabReady(tabId: number, timeoutMs = 20_000): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const tab = await chrome.tabs.get(tabId);
    if (tab.status === "complete") return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Timed out waiting for tab ${tabId} to finish loading`);
}

async function openObservationTab(url: string): Promise<number> {
  debugLog("[GBV][bg] opening observation tab", { url });
  const tab = await chrome.tabs.create({ url, active: false });
  if (!tab.id) {
    throw new Error(`Failed to create observation tab for ${url}`);
  }
  debugLog("[GBV][bg] observation tab opened", { tabId: tab.id, url: tab.url });
  return tab.id;
}

async function closeTab(tabId: number): Promise<void> {
  try {
    debugLog("[GBV][bg] closing tab", { tabId });
    await chrome.tabs.remove(tabId);
  } catch {
    // ignored during cleanup when tabs are already closed
  }
}

/**
 * Ensure the content script is present in the tab before message-based collection.
 */
async function ensureContentScriptInjected(tabId: number): Promise<void> {
  try {
    debugLog("[GBV][bg] injecting content script", { tabId });
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["contentScript.js"],
    });
    debugLog("[GBV][bg] content script injected", { tabId });
  } catch (error) {
    const message = String((error as Error)?.message || error);
    debugLog("[GBV][bg] content script injection error", { tabId, message });
    // Ignore duplicate-injection failures and continue with message path.
    if (
      message.includes("Cannot access contents of the page") ||
      message.includes("The extensions gallery cannot be scripted")
    ) {
      throw new Error(`Cannot inject GBV content script into tab ${tabId}: ${message}`);
    }
  }
}

function sendCollectMessage(
  tabId: number,
  message: CollectSurfaceMessage,
): Promise<CanonicalizedSurface> {
  debugLog("[GBV][bg] sending collect message", {
    tabId,
    requestId: message.requestId,
    nonceLeafId: message.nonceLeafId,
  });
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response: CollectSurfaceResponse | undefined) => {
      if (chrome.runtime.lastError) {
        debugLog("[GBV][bg] sendMessage lastError", {
          tabId,
          error: chrome.runtime.lastError.message,
        });
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (!response?.ok) {
        debugLog("[GBV][bg] collect response failed", { tabId, response });
        reject(new Error(response?.error || "Surface collection failed"));
        return;
      }

      debugLog("[GBV][bg] collect response success", {
        tabId,
        url: response.surface.url,
        pageType: response.surface.pageType,
      });
      resolve(response.surface);
    });
  });
}

/**
 * Collect canonicalized evidence from content script with retries while the tab bootstraps.
 *
 * Spec Stage II-IV.
 */
async function collectSurfaceFromTab(
  tabId: number,
  nonce: string,
  nonceLeafId: string,
): Promise<CanonicalizedSurface> {
  const maxAttempts = 30;
  const requestId = crypto.randomUUID();
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      debugLog("[GBV][bg] collect attempt", { tabId, attempt, maxAttempts });
      if (attempt === 1) {
        await ensureContentScriptInjected(tabId);
      }
      return await sendCollectMessage(tabId, {
        type: "GBV_COLLECT_SURFACE",
        requestId,
        nonce,
        nonceLeafId,
      });
    } catch (error) {
      lastError = error;
      const message = String((error as Error)?.message || error);
      const likelyBootRace =
        message.includes("Could not establish connection") ||
        message.includes("Receiving end does not exist") ||
        message.includes("The message port closed");

      debugLog("[GBV][bg] collect attempt failed", {
        tabId,
        attempt,
        message,
        likelyBootRace,
      });

      if (!likelyBootRace || attempt === maxAttempts) {
        break;
      }

      await ensureContentScriptInjected(tabId);
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }

  throw new Error(
    `Unable to collect surface from tab ${tabId}: ${String(lastError || "unknown")}`,
  );
}

/**
 * Execute full GBV browser flow from background service worker.
 *
 * Spec Stage I-V: challenge issuance, multi-surface observation,
 * canonicalization, and submission.
 */
export async function runGbvFlow(artifact: GbvVerificationArtifact): Promise<RunFlowResult> {
  const startedAtMs = Date.now();
  const startedAt = new Date(startedAtMs).toISOString();
  debugLog("[GBV][bg] starting GBV flow", { artifact });
  const initResponse = await fetch(`${gbvConfig.origins.server}/api/gbv/init`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ artifact }),
  });

  const initJson = (await initResponse.json()) as InitResponse;
  if (!initResponse.ok || !initJson.ok) {
    throw new Error(`GBV init failed: ${JSON.stringify(initJson)}`);
  }
  debugLog("[GBV][bg] init success", {
    sessionId: initJson.sessionId,
    pagePlan: initJson.pagePlan,
  });

  const surfaceUrls = buildSurfaceUrlsFromPlan({
    origin: gbvConfig.origins.syntheticClient,
    pagePlan: initJson.pagePlan as GbvPageType[],
    templates: gbvConfig.demo.surfacePathTemplates,
    artifact,
  });

  const observations: CanonicalizedSurface[] = [];

  for (let index = 0; index < surfaceUrls.length; index += 1) {
    const url = surfaceUrls[index];
    const nonce = initJson.pageNonces[index];
    const tabId = await openObservationTab(url);

    try {
      await waitForTabReady(tabId);
      const surface = await collectSurfaceFromTab(tabId, nonce, initJson.nonceLeafId);
      observations.push(surface);
    } finally {
      await closeTab(tabId);
    }
  }

  const pages = observations.map((surface) => ({
    url: surface.url,
    html: surface.html,
    injectedNonce: surface.injectedNonce,
  }));

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

  const submitBody = (await submitResponse.json()) as GbvSubmitResponsePayload;
  debugLog("[GBV][bg] submit completed", {
    status: submitResponse.status,
    observationCount: observations.length,
  });
  const canonicalLeafCount = new Set(observations.flatMap((surface) => surface.canonicalLeaves))
    .size;
  const finishedAtMs = Date.now();

  return {
    status: submitResponse.status,
    body: submitBody,
    artifact,
    observationCount: observations.length,
    canonicalLeafCount,
    sessionId: initJson.sessionId,
    startedAt,
    finishedAt: new Date(finishedAtMs).toISOString(),
    durationMs: finishedAtMs - startedAtMs,
  };
}
