/**
 * Environment variable loader for the ARGON-V OSS server.
 *
 * Exposes configuration values read from process.env with sensible defaults.
 * Throws an Error if the required MONGODB_URI is not provided.
 *
 * @module env
 *
 * @constant {string} MONGODB_URI
 * @description MongoDB connection string. Required; loaded from process.env.MONGODB_URI.
 * @throws {Error} If MONGODB_URI is not set.
 *
 * @constant {string} [NODE_ENV="development"]
 * @description Node.js environment mode, e.g. "development" or "production".
 *
 * @constant {string} [BASE_URL="http://localhost:3001"]
 * @description Base URL for the server.
 *
 * @constant {(string|null)} [ARGON_HMAC_SECRET=null]
 * @description Optional HMAC secret used by ARGON for signing/verification.
 *
 * @constant {string} [ARGON_GENESIS_UID="genesis_44414e54452049454c4345414e55"]
 * @description Default genesis UID used by ARGON when not provided via environment.
 */
export const MONGODB_URI = process.env.MONGODB_URI;
export const NODE_ENV = process.env.NODE_ENV || "development";
export const BASE_URL = process.env.BASE_URL || "http://localhost:3001";
export const ARGON_HMAC_SECRET = process.env.ARGON_HMAC_SECRET || null;
export const ARGON_GENESIS_UID =
  process.env.ARGON_GENESIS_UID || "genesis_44414e54452049454c4345414e55";

if (!MONGODB_URI) {
  throw new Error("Missing required env var: MONGODB_URI");
}
