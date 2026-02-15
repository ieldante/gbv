import { gbvConfig } from "@gbv/config";

function enabled(): boolean {
  return Boolean(gbvConfig.environment.debug);
}

export function debugLog(message: string, payload?: unknown): void {
  if (!enabled()) return;
  if (payload === undefined) {
    console.debug(message);
    return;
  }
  console.debug(message, payload);
}
