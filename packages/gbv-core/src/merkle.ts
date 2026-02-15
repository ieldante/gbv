import crypto from "node:crypto";

/**
 * Spec §Stage V: hash canonical evidence leaves with SHA-256.
 *
 * @param {string | Buffer} data Leaf or node payload.
 * @returns {string} Lowercase hex SHA-256 digest.
 */
export function sha256Hex(data: string | Buffer): string {
  const payload = typeof data === "string" ? Buffer.from(data, "utf8") : data;
  return crypto.createHash("sha256").update(payload).digest("hex").toLowerCase();
}

/**
 * Spec §Stage V: deterministic Merkle root over ordered leaf hashes.
 *
 * @param {string[]} leafHashes Ordered leaf hashes.
 * @returns {string} Root hash in hex format.
 */
export function buildMerkleRoot(leafHashes: string[]): string {
  if (!leafHashes.length) return "";

  let level: Uint8Array[] = leafHashes.map((hash) => Buffer.from(hash, "hex"));

  while (level.length > 1) {
    const next: Uint8Array[] = [];

    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] ?? left;
      const combined = Buffer.concat([left, right]);
      next.push(crypto.createHash("sha256").update(combined).digest());
    }

    level = next;
  }

  return Buffer.from(level[0]).toString("hex");
}

/**
 * Verify a Merkle proof against a known root hash.
 *
 * @param {object} params Proof data.
 * @param {string} params.leaf Leaf value.
 * @param {number} params.index Leaf index.
 * @param {string[]} params.proof Sibling path.
 * @param {string} params.expectedRoot Expected Merkle root.
 * @param {boolean} [params.isHashed=false] Whether leaf is already hashed.
 * @returns {boolean} True when proof is valid.
 */
export function verifyMerkleProof({
  leaf,
  index,
  proof,
  expectedRoot,
  isHashed = false,
}: {
  leaf: string;
  index: number;
  proof: string[];
  expectedRoot: string;
  isHashed?: boolean;
}): boolean {
  if (!leaf || !Number.isInteger(index) || !Array.isArray(proof)) return false;

  const normalizedRoot = String(expectedRoot || "").toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(normalizedRoot)) return false;

  const leafHash = isHashed ? String(leaf).toLowerCase() : sha256Hex(leaf);
  if (!/^[0-9a-f]{64}$/.test(leafHash)) return false;

  let cursor = Buffer.from(leafHash, "hex");
  let cursorIndex = index;

  for (const siblingHexRaw of proof) {
    const siblingHex = String(siblingHexRaw || "").toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(siblingHex)) return false;

    const sibling = Buffer.from(siblingHex, "hex");
    const isRight = cursorIndex % 2 === 1;
    const combined = isRight
      ? Buffer.concat([sibling, cursor])
      : Buffer.concat([cursor, sibling]);

    cursor = crypto.createHash("sha256").update(combined).digest();
    cursorIndex = Math.floor(cursorIndex / 2);
  }

  return cursor.toString("hex") === normalizedRoot;
}
