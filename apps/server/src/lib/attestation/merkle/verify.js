import crypto from "crypto";

/**
 * Compute a SHA-256 digest of the provided input.
 *
 * This helper is the canonical hashing primitive used throughout ARGON-V
 * (leaf hashing, Merkle tree construction, and proof verification).
 *
 * @param {string | Buffer} data - Input data to hash.
 * @returns {string} Lowercase hex-encoded SHA-256 digest.
 */
export function sha256Hex(data) {
  if (typeof data === "string") data = Buffer.from(data, "utf8");
  return crypto.createHash("sha256").update(data).digest("hex").toLowerCase();
}

/**
 * Compute a Merkle root from an ordered list of leaf hashes.
 *
 * - Leaves must already be SHA-256 hashes encoded as hex strings.
 * - When a layer has an odd number of nodes, the final node is duplicated
 *   (standard Merkle tree padding).
 *
 * This function is deterministic and order-sensitive.
 *
 * @param {string[]} leafHashes - Array of hex-encoded SHA-256 leaf hashes.
 * @returns {string} Hex-encoded Merkle root, or an empty string if no leaves.
 */
export function buildMerkleRoot(leafHashes = []) {
  if (!leafHashes.length) return "";

  let level = leafHashes.map((h) => Buffer.from(h, "hex"));

  while (level.length > 1) {
    const nextLevel = [];

    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] || left; // duplicate if odd
      const combined = Buffer.concat([left, right]);
      nextLevel.push(crypto.createHash("sha256").update(combined).digest());
    }

    level = nextLevel;
  }

  return level[0].toString("hex");
}

/**
 * Verify a Merkle inclusion proof against an expected root.
 *
 * The function reconstructs the path from the target leaf to the root using
 * the provided sibling hashes and verifies that the computed root matches
 * the expected value.
 *
 * All inputs are strictly validated. Any malformed value causes verification
 * to fail deterministically.
 *
 * @param {Object} params
 * @param {string} params.leaf - Canonical leaf value or pre-hashed hex string.
 * @param {number} params.index - Index of the leaf in the original tree.
 * @param {string[]} params.proof - Ordered list of sibling hashes (hex).
 * @param {string} params.expectedRoot - Expected Merkle root (hex).
 * @param {boolean} [params.isHashed=false] - Whether `leaf` is already hashed.
 * @returns {boolean} True if the proof is valid; false otherwise.
 */
export function verifyMerkleProof({
  leaf,
  index,
  proof,
  expectedRoot,
  isHashed = false,
}) {
  if (!leaf || typeof index !== "number" || !Array.isArray(proof)) {
    return false;
  }

  const root = String(expectedRoot || "").toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(root)) {
    return false;
  }

  const leafHex = isHashed ? String(leaf).toLowerCase() : sha256Hex(leaf);
  if (!/^[0-9a-f]{64}$/.test(leafHex)) {
    return false;
  }

  let node = Buffer.from(leafHex, "hex");

  for (const sibHexRaw of proof) {
    const sibHex = String(sibHexRaw || "").toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(sibHex)) {
      return false;
    }

    const sibling = Buffer.from(sibHex, "hex");
    const isRightNode = index % 2 === 1;

    const combined = isRightNode
      ? Buffer.concat([sibling, node])
      : Buffer.concat([node, sibling]);

    node = crypto.createHash("sha256").update(combined).digest();
    index = Math.floor(index / 2);
  }

  return node.toString("hex") === root;
}

/**
 * Compute a Merkle root directly from raw leaf strings.
 *
 * Each leaf is first hashed using SHA-256, then assembled into a Merkle tree.
 * This helper is useful when working with canonicalized data prior to hashing.
 *
 * @param {string[]} leaves - Canonical leaf strings.
 * @returns {string} Hex-encoded Merkle root.
 */
export function buildMerkleRootFromStrings(leaves = []) {
  const leafHashes = leaves.map((leaf) => sha256Hex(leaf));
  return buildMerkleRoot(leafHashes);
}
