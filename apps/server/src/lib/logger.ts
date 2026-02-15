import { gbvConfig } from "@gbv/config";

const debugEnabled = Boolean(gbvConfig.environment.debug);

export function logInfo(event: string, meta: Record<string, unknown>): void {
  console.log(
    JSON.stringify({
      level: "info",
      service: "gbv-server",
      event,
      ts: new Date().toISOString(),
      ...meta,
    }),
  );
}

export function logError(event: string, meta: Record<string, unknown>): void {
  console.error(
    JSON.stringify({
      level: "error",
      service: "gbv-server",
      event,
      ts: new Date().toISOString(),
      ...meta,
    }),
  );
}

export function logDebug(event: string, meta: Record<string, unknown>): void {
  if (!debugEnabled) return;
  console.debug(
    JSON.stringify({
      level: "debug",
      service: "gbv-server",
      event,
      ts: new Date().toISOString(),
      ...meta,
    }),
  );
}
