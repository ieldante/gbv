import { gbvConfig } from "@gbv/config";
import { syntheticProvider } from "@gbv/core/browser";
import { debugLog } from "./lib/log";
import type {
  CollectSurfaceMessage,
  CollectSurfaceResponse,
  PageCollectRequest,
  PageCollectResponse,
  PageSnapshot,
} from "./lib/messages";

const PAGE_BRIDGE_SCRIPT_ID = "__GBV_PAGE_BRIDGE__";
const PAGE_COLLECT_REQUEST_TYPE = "GBV_PAGE_COLLECT_REQUEST";
const PAGE_COLLECT_RESPONSE_TYPE = "GBV_PAGE_COLLECT_RESPONSE";
const PAGE_BRIDGE_TIMEOUT_MS = 350;

function pageBridgeMain() {
  const requestType = "GBV_PAGE_COLLECT_REQUEST";
  const responseType = "GBV_PAGE_COLLECT_RESPONSE";
  const guardKey = "__GBV_PAGE_BRIDGE_READY__";
  const globalWindow = window as typeof window & { [key: string]: unknown };

  if (globalWindow[guardKey]) return;
  globalWindow[guardKey] = true;

  window.addEventListener("message", (event: MessageEvent) => {
    if (event.source !== window) return;

    const data = event.data as { type?: string; requestId?: string; nonce?: string; nonceLeafId?: string };
    if (!data || data.type !== requestType) return;

    const requestId = String(data.requestId || "");
    const nonce = String(data.nonce || "");
    const nonceLeafId = String(data.nonceLeafId || "");

    try {
      if (!requestId) {
        throw new Error("Missing requestId");
      }
      if (!nonceLeafId) {
        throw new Error("Missing nonceLeafId");
      }

      const selector = `meta[${nonceLeafId}]`;
      let nonceNode = document.querySelector(selector) as HTMLMetaElement | null;
      if (!nonceNode) {
        nonceNode = document.createElement("meta");
        nonceNode.setAttribute(nonceLeafId, nonce);
        (document.head || document.documentElement).appendChild(nonceNode);
      } else {
        nonceNode.setAttribute(nonceLeafId, nonce);
      }

      const snapshot = {
        url: window.location.href,
        html: document.documentElement?.outerHTML || "",
        injectedNonce: nonceNode.getAttribute(nonceLeafId) || "",
      };

      window.postMessage(
        {
          type: responseType,
          requestId,
          ok: true,
          snapshot,
        },
        "*",
      );
    } catch (error) {
      window.postMessage(
        {
          type: responseType,
          requestId,
          ok: false,
          error: String((error as Error)?.message || error),
        },
        "*",
      );
    }
  });
}

/**
 * Inject a tiny page-context bridge so evidence capture happens in the page world.
 *
 * Spec Stage II.
 */
function installPageBridge(): void {
  if (document.getElementById(PAGE_BRIDGE_SCRIPT_ID)) return;

  const script = document.createElement("script");
  script.id = PAGE_BRIDGE_SCRIPT_ID;
  script.textContent = `;(${pageBridgeMain.toString()})();`;
  (document.head || document.documentElement).appendChild(script);
  script.remove();
  debugLog("[GBV][cs] page bridge installed", { url: window.location.href });
}

function requestSnapshotFromPage(message: CollectSurfaceMessage): Promise<PageSnapshot> {
  installPageBridge();

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      window.removeEventListener("message", onMessage);
      reject(new Error("Timed out waiting for page snapshot response"));
    }, PAGE_BRIDGE_TIMEOUT_MS);

    const onMessage = (event: MessageEvent) => {
      if (event.source !== window) return;

      const response = event.data as PageCollectResponse;
      if (!response || response.type !== PAGE_COLLECT_RESPONSE_TYPE) return;
      if (response.requestId !== message.requestId) return;

      clearTimeout(timeout);
      window.removeEventListener("message", onMessage);

      if (!response.ok) {
        reject(new Error(response.error || "Page snapshot collection failed"));
        return;
      }

      resolve(response.snapshot);
    };

    window.addEventListener("message", onMessage);

    const request: PageCollectRequest = {
      type: PAGE_COLLECT_REQUEST_TYPE,
      requestId: message.requestId,
      nonce: message.nonce,
      nonceLeafId: message.nonceLeafId,
    };
    window.postMessage(request, "*");
  });
}

function collectSnapshotDirectly(message: CollectSurfaceMessage): PageSnapshot {
  const selector = `meta[${message.nonceLeafId}]`;
  let nonceNode = document.querySelector(selector) as HTMLMetaElement | null;

  if (!nonceNode) {
    nonceNode = document.createElement("meta");
    nonceNode.setAttribute(message.nonceLeafId, message.nonce);
    (document.head || document.documentElement).appendChild(nonceNode);
  } else {
    nonceNode.setAttribute(message.nonceLeafId, message.nonce);
  }

  return {
    url: window.location.href,
    html: document.documentElement?.outerHTML || "",
    injectedNonce: nonceNode.getAttribute(message.nonceLeafId) || "",
  };
}

/**
 * Capture and canonicalize current surface evidence.
 *
 * Spec Stage II-IV.
 */
async function collectSurface(message: CollectSurfaceMessage): Promise<CollectSurfaceResponse> {
  try {
    debugLog("[GBV][cs] collectSurface request", {
      requestId: message.requestId,
      url: window.location.href,
      nonceLeafId: message.nonceLeafId,
    });
    const currentOrigin = new URL(window.location.href).origin;
    if (currentOrigin !== gbvConfig.origins.syntheticClient) {
      throw new Error(`Unexpected origin ${currentOrigin}; expected ${gbvConfig.origins.syntheticClient}`);
    }

    let snapshot: PageSnapshot;
    try {
      snapshot = await requestSnapshotFromPage(message);
      debugLog("[GBV][cs] page-bridge snapshot collected", {
        requestId: message.requestId,
      });
    } catch (bridgeError) {
      debugLog("[GBV][cs] page-bridge failed, using direct snapshot fallback", {
        requestId: message.requestId,
        error: String((bridgeError as Error)?.message || bridgeError),
      });
      snapshot = collectSnapshotDirectly(message);
    }
    if (!snapshot.html || !snapshot.url) {
      throw new Error("Collected snapshot is missing html/url");
    }
    if (snapshot.html.length > gbvConfig.protocol.maxHtmlChars) {
      throw new Error("Collected snapshot exceeds max html size limit");
    }
    if (!snapshot.injectedNonce) {
      throw new Error("Injected nonce is missing from collected page");
    }

    const canonicalLeaves = syntheticProvider.canonicalize({
      html: snapshot.html,
      url: snapshot.url,
      nonceLeafId: message.nonceLeafId,
    });

    return {
      ok: true,
      surface: {
        url: snapshot.url,
        html: snapshot.html,
        injectedNonce: snapshot.injectedNonce,
        pageType: syntheticProvider.detectPageType(snapshot.url),
        canonicalLeaves,
        nonceMetadata: {
          id: message.nonceLeafId,
          value: snapshot.injectedNonce,
        },
        observedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    debugLog("[GBV][cs] collectSurface error", {
      requestId: message.requestId,
      error: String((error as Error)?.message || error),
      url: window.location.href,
    });
    return {
      ok: false,
      error: String((error as Error)?.message || error),
    };
  }
}

chrome.runtime.onMessage.addListener(
  (
    message: CollectSurfaceMessage,
    _sender,
    sendResponse: (response: CollectSurfaceResponse) => void,
  ) => {
    if (message.type !== "GBV_COLLECT_SURFACE") {
      return false;
    }

    debugLog("[GBV][cs] runtime message received", {
      requestId: message.requestId,
      type: message.type,
      url: window.location.href,
    });
    collectSurface(message).then(sendResponse);
    return true;
  },
);

debugLog("[GBV][cs] content script loaded", { url: window.location.href });
installPageBridge();
