import type { GbvPageBundle, GbvPageType } from "../types";

/**
 * Spec §Stage III: enforce structure-bound nonces and plan coverage.
 */
export function verifyStructureBoundNonces({
  bundles,
  pagePlan,
  pageNonces,
  nonceLeafId,
}: {
  bundles: GbvPageBundle[];
  pagePlan: GbvPageType[];
  pageNonces: string[];
  nonceLeafId: string;
}): { ok: true } | { ok: false; error: string; details?: Record<string, unknown> } {
  if (!Array.isArray(pagePlan) || !Array.isArray(pageNonces) || pagePlan.length !== pageNonces.length) {
    return { ok: false, error: "INVALID_NONCE_PLAN" };
  }

  const expectedByType = new Map<string, string>();
  for (let i = 0; i < pagePlan.length; i += 1) {
    expectedByType.set(pagePlan[i], pageNonces[i]);
  }

  const seenTypes = new Set<string>();

  for (const bundle of bundles) {
    const expectedNonce = expectedByType.get(bundle.pageType);
    if (!expectedNonce) {
      return {
        ok: false,
        error: "UNEXPECTED_PAGE_TYPE",
        details: { pageType: bundle.pageType, url: bundle.url },
      };
    }

    if (seenTypes.has(bundle.pageType)) {
      return {
        ok: false,
        error: "DUPLICATE_PAGE_TYPE",
        details: { pageType: bundle.pageType },
      };
    }
    seenTypes.add(bundle.pageType);

    if (bundle.injectedNonce !== expectedNonce) {
      return {
        ok: false,
        error: "INJECTED_NONCE_MISMATCH",
        details: {
          pageType: bundle.pageType,
          injectedNonce: bundle.injectedNonce,
          expectedNonce,
        },
      };
    }

    const nonceLeaf = `nonce:id:${nonceLeafId}:value:${expectedNonce}`;
    if (!bundle.leaves.includes(nonceLeaf)) {
      return {
        ok: false,
        error: "NONCE_LEAF_MISSING",
        details: { pageType: bundle.pageType, nonceLeaf },
      };
    }
  }

  for (const expectedType of expectedByType.keys()) {
    if (!seenTypes.has(expectedType)) {
      return {
        ok: false,
        error: "MISSING_PAGE_TYPE",
        details: { pageType: expectedType },
      };
    }
  }

  return { ok: true };
}
