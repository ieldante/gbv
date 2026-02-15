import rawConfig from "../../../gbv.config";

/**
 * Runtime-validated GBV configuration.
 *
 * This module is the single source of truth consumed by all workspace apps.
 */
export const gbvConfig = (() => {
  const config = (rawConfig as unknown as { default?: typeof rawConfig }).default ?? rawConfig;

  if (!config.protocol?.providerId) {
    throw new Error("GBV config invalid: missing protocol.providerId");
  }
  if (!config.protocol?.nonceLeafId) {
    throw new Error("GBV config invalid: missing protocol.nonceLeafId");
  }
  if (!Number.isFinite(config.protocol?.sessionTtlMs)) {
    throw new Error("GBV config invalid: protocol.sessionTtlMs must be numeric");
  }
  if (!Array.isArray(config.demo?.pagePlan) || config.demo.pagePlan.length < 1) {
    throw new Error("GBV config invalid: demo.pagePlan must be non-empty");
  }
  if (!config.demo?.surfacePathTemplates) {
    throw new Error("GBV config invalid: demo.surfacePathTemplates must be provided");
  }
  if (!config.demo?.courseCatalogApiPath) {
    throw new Error("GBV config invalid: demo.courseCatalogApiPath must be provided");
  }
  if (!Array.isArray(config.extension?.hostPermissions) || config.extension.hostPermissions.length < 1) {
    throw new Error("GBV config invalid: extension.hostPermissions must be non-empty");
  }
  if (
    !Array.isArray(config.extension?.contentScriptMatches) ||
    config.extension.contentScriptMatches.length < 1
  ) {
    throw new Error("GBV config invalid: extension.contentScriptMatches must be non-empty");
  }

  return config;
})();

export type GbvConfig = typeof gbvConfig;

/**
 * Build canonical localhost origin from configured port.
 *
 * @param {number} port Port number.
 * @returns {string} Origin URL.
 */
export function localOrigin(port: number): string {
  return `http://localhost:${port}`;
}
