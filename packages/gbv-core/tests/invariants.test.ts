import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { verifyStructureBoundNonces } from "../src/semantic/verifyStructureBoundNonces";
import type { GbvPageBundle } from "../src/types";

function bundle(pageType: "hub" | "course", nonceValue: string): GbvPageBundle {
  return {
    index: pageType === "hub" ? 0 : 1,
    pageType,
    url: `http://localhost/${pageType}`,
    html: "<html></html>",
    injectedNonce: nonceValue,
    leaves: [`nonce:id:data-gbv-nonce:value:${nonceValue}`],
  };
}

describe("structure-bound nonces", () => {
  test("rejects mismatched injected nonce", () => {
    const result = verifyStructureBoundNonces({
      bundles: [bundle("hub", "wrong"), bundle("course", "n2")],
      pagePlan: ["hub", "course"],
      pageNonces: ["n1", "n2"],
      nonceLeafId: "data-gbv-nonce",
    });

    assert.equal(result.ok, false);
    assert.equal(result.error, "INJECTED_NONCE_MISMATCH");
  });

  test("rejects missing expected page type", () => {
    const result = verifyStructureBoundNonces({
      bundles: [bundle("hub", "n1")],
      pagePlan: ["hub", "course"],
      pageNonces: ["n1", "n2"],
      nonceLeafId: "data-gbv-nonce",
    });

    assert.equal(result.ok, false);
    assert.equal(result.error, "MISSING_PAGE_TYPE");
  });
});
