/**
 * @fileoverview
 * ARGON-V attestation core.
 *
 * This module acts as the **server-side registry and façade** for ARGON:
 * - Registers supported providers (mock, future real providers)
 * - Exposes provider lookup
 * - Exposes protocol-level constants
 *
 * IMPORTANT:
 * - Providers are **server-authoritative**
 * - Clients never define page plans or provider logic
 */

import MockProvider from "./providers/mock.js";

/**
 * Registry of supported attestation providers.
 *
 * Keys are lower-case provider IDs.
 * Values are provider implementations that conform to the ARGON provider interface.
 *
 * @type {Record<string, import("./providers/mock.js").default>}
 */
export const providers = {
  mock: MockProvider,
};

/**
 * Retrieve a provider implementation by name.
 *
 * Provider lookup is case-insensitive.
 *
 * @param {string} name Provider identifier (e.g. "mock")
 * @returns {Object | undefined} Provider implementation, if registered
 */
export function getProvider(name) {
  if (!name) return undefined;
  return providers[String(name).toLowerCase()];
}

/**
 * Protocol genesis identifier.
 *
 * This is a **fixed protocol constant**, not a user identifier.
 * It exists to anchor ARGON attestations in a stable namespace.
 *
 * @type {string}
 */
export const GENESIS_UID = "genesis_44414e54452049454c4345414e55";

/**
 * MongoDB client (server-only).
 *
 * Exposed here so API routes can import from a single ARGON entrypoint
 * without leaking DB logic into unrelated modules.
 *
 * @type {Promise<import("mongodb").MongoClient>}
 */
export { default as clientPromise } from "../../db/mongodb.js";

/**
 * Environment helpers (server-only).
 *
 * Includes things like:
 * - required env vars
 * - runtime guards
 * - configuration helpers
 */
export * from "../env.js";
