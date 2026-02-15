import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { buildMerkleRoot, sha256Hex, verifyMerkleProof } from "../src/merkle";

describe("merkle proofs", () => {
  test("accepts valid proof for a two-leaf tree", () => {
    const leaves = ["alpha", "beta"];
    const leafHashes = leaves.map((leaf) => sha256Hex(leaf));
    const root = buildMerkleRoot(leafHashes);

    const ok = verifyMerkleProof({
      leaf: leaves[0],
      index: 0,
      proof: [leafHashes[1]],
      expectedRoot: root,
    });

    assert.equal(ok, true);
  });

  test("rejects proof with wrong expected root", () => {
    const leaves = ["alpha", "beta"];
    const leafHashes = leaves.map((leaf) => sha256Hex(leaf));
    const root = buildMerkleRoot(leafHashes);

    const ok = verifyMerkleProof({
      leaf: leaves[0],
      index: 0,
      proof: [leafHashes[1]],
      expectedRoot: root.replace(/^./, "f"),
    });

    assert.equal(ok, false);
  });
});
