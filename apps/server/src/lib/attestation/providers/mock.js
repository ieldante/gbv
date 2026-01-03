import { sha256Hex } from "../merkle/verify.js";

/**
 * Result returned by {@link Provider.generateLeafHashes}.
 *
 * @typedef {Object} LeafHashResult
 * @property {string[]} leaves Sorted, de-duplicated canonical leaves.
 * @property {string[]} hashes SHA-256 hex digests aligned 1:1 with {@link LeafHashResult.leaves}.
 */

/**
 * Provider interface used by the server attestation pipeline.
 *
 * A provider is responsible for:
 * - defining the required {@link Provider.pagePlan} (server-owned),
 * - classifying observed pages via {@link Provider.detectPageType},
 * - producing deterministic canonical leaves via {@link Provider.canonicalize},
 * - optionally producing leaf hashes via {@link Provider.generateLeafHashes}.
 *
 * @typedef {Object} Provider
 * @property {string} id Provider identifier (stable key).
 * @property {string} name Human-readable provider name.
 * @property {string[]} pagePlan Ordered list of required page types for this provider.
 * @property {(url: string) => string} detectPageType Maps a URL to a provider page type.
 * @property {(html: string, url: string, courseMeta?: Object) => string[]} canonicalize Produces deterministic, sortable leaves from an observed page.
 * @property {(html: string, url: string, courseMeta?: Object) => Promise<LeafHashResult>} generateLeafHashes Produces Merkle-ready leaf hashes.
 */

/**
 * Mock provider used for the OSS ARGON-V prototype.
 *
 * Route shape (3 pages):
 * - /mock/start
 * - /mock/proof
 * - /mock/certificate
 *
 * Canonicalization is intentionally minimal for v0:
 * it emits stable structural leaves and extracts injected nonce markers.
 *
 * @type {Provider}
 */
const MockVerifier = {
  id: "mock",
  name: "Mock Provider",

  /**
   * Required page types for this provider.
   *
   * The server uses this plan to:
   * - issue per-page nonces during init, and
   * - enforce that submissions include evidence for each required page type.
   *
   * @type {string[]}
   */
  pagePlan: ["start", "proof", "certificate"],

  /**
   * Determine which provider page type a URL corresponds to.
   *
   * @param {string} url The absolute URL of the observed page.
   * @returns {"start"|"proof"|"certificate"|"unknown"} Provider page type.
   */
  detectPageType(url) {
    const u = String(url || "");
    if (u.includes("/mock/start")) return "start";
    if (u.includes("/mock/proof")) return "proof";
    if (u.includes("/mock/certificate")) return "certificate";
    return "unknown";
  },

  /**
   * Convert an observed page into deterministic canonical leaves.
   *
   * The v0 mock canonicalizer intentionally emits only:
   * - provider id
   * - canonical page path (origin + pathname)
   * - detected page type
   * - any injected nonce markers found in the HTML
   *
   * @param {string} html Full HTML of the observed page.
   * @param {string} url Absolute URL of the observed page.
   * @param {Object} [courseMeta] Optional client-provided metadata (treated as hints only).
   * @returns {string[]} Sorted, de-duplicated canonical leaves.
   */
  canonicalize(html, url, courseMeta = {}) {
    void courseMeta;

    const pageType = this.detectPageType(url);
    const leaves = [];

    leaves.push("provider:mock");
    leaves.push(`page:path:${canonicalPath(url)}`);
    leaves.push(`page:type:${pageType}`);

    // Extract injected nonce markers (expected form: <meta data-oasis-nonce="...">)
    const text = String(html || "");
    const re = /<meta[^>]*data-oasis-nonce\s*=\s*["']([^"']+)["'][^>]*>/gi;

    for (const m of text.matchAll(re)) {
      const val = String(m?.[1] || "").trim();
      if (val) leaves.push(`nonce:id:data-oasis-nonce:value:${val}`);
    }

    return [...new Set(leaves)].sort();
  },

  /**
   * Produce SHA-256 hashes for canonical leaves (Merkle-ready).
   *
   * @param {string} html
   * @param {string} url
   * @param {Object} [courseMeta]
   * @returns {Promise<LeafHashResult>}
   */
  async generateLeafHashes(html, url, courseMeta) {
    const leaves = this.canonicalize(html, url, courseMeta);
    const hashes = await Promise.all(leaves.map((v) => sha256Hex(v)));
    return { leaves, hashes };
  },
};

/**
 * Convert a URL into a stable canonical path.
 * Query parameters and fragments are stripped.
 *
 * @param {string} url
 * @returns {string}
 */
function canonicalPath(url = "") {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  } catch {
    return String(url).split("?")[0].split("#")[0];
  }
}

export default MockVerifier;
