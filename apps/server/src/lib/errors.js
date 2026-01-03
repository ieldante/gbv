/**
 * @fileoverview
 * ARGON-V error helpers.
 *
 * Defines a small, explicit error surface used by:
 * - API routes
 * - Attestation logic
 * - Client-facing error translation
 *
 * Errors are:
 * - machine-readable (code)
 * - human-readable (message)
 * - structured (meta)
 */

/**
 * Create a structured ARGON error.
 *
 * This should be used internally (thrown) and can later be
 * serialized via {@link jsonError}.
 *
 * @param {string} code Stable, machine-readable error code
 * @param {string} [message] Optional human-readable message
 * @param {Object} [meta] Optional structured metadata
 * @returns {Error & { code: string, meta: Object }}
 */
export function argonError(code, message, meta = {}) {
  const err = new Error(message || code);
  err.code = String(code);
  err.meta = meta && typeof meta === "object" ? meta : {};
  return err;
}

/**
 * Convert an error into a JSON-safe ARGON response.
 *
 * This is intended for API responses only.
 * Never throw this — always return it.
 *
 * @param {string} code Stable, machine-readable error code
 * @param {string} [message] Optional human-readable message
 * @param {Object} [meta] Optional structured metadata
 * @returns {{ ok: false, code: string, error: string, meta: Object }}
 */
export function jsonError(code, message, meta = {}) {
  return {
    ok: false,
    code: String(code),
    error: message || code,
    meta: meta && typeof meta === "object" ? meta : {},
  };
}
