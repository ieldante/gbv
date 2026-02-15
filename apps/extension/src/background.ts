import { runGbvFlow } from "./lib/gbvFlow";
import { debugLog } from "./lib/log";
import type { PingMessage, PingResponse, RunFlowMessage, RunFlowResponse } from "./lib/messages";

/**
 * Background message router for GBV extension actions.
 */
chrome.runtime.onMessage.addListener(
  (
    message: RunFlowMessage | PingMessage,
    _sender,
    sendResponse: (response: RunFlowResponse | PingResponse) => void,
  ) => {
    if (message.type === "GBV_PING") {
      sendResponse({
        ok: true,
        serviceWorker: "ready",
        ts: new Date().toISOString(),
      });
      return false;
    }

    if (message.type !== "GBV_RUN_FLOW") {
      return false;
    }

    debugLog("[GBV][bg] popup requested run", { artifact: message.artifact });
    runGbvFlow(message.artifact)
      .then((result) => {
        debugLog("[GBV][bg] flow completed", { status: result.status });
        sendResponse({ ok: true, result });
      })
      .catch((error) =>
        (debugLog("[GBV][bg] flow failed", {
          error: String((error as Error)?.message || error),
        }),
        sendResponse({
          ok: false,
          error: String((error as Error)?.message || error),
        })),
      );

    return true;
  },
);
