import type { GbvPageBundle, GbvSemanticReport } from "../types";

function valueSet(leaves: string[], prefix: string): Set<string> {
  const output = new Set<string>();
  const marker = `${prefix}:`;

  for (const leaf of leaves) {
    if (leaf.startsWith(marker)) {
      output.add(leaf.slice(marker.length));
    }
  }

  return output;
}

function parsePercent(input: string): number | null {
  const match = input.match(/(\d+(?:\.\d+)?)\s*%/);
  if (!match) return null;
  const parsed = Number.parseFloat(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseNumber(input: string): number | null {
  const parsed = Number.parseFloat(String(input || ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseNonceLeaves(leaves: string[]): Array<{ id: string; value: string }> {
  const result: Array<{ id: string; value: string }> = [];

  for (const leaf of leaves) {
    const segments = leaf.split(":");
    if (segments.length >= 5 && segments[0] === "nonce" && segments[1] === "id") {
      result.push({
        id: segments[2],
        value: segments.slice(4).join(":"),
      });
    }
  }

  return result;
}

/**
 * Spec Stage III: semantic coherence enforcement over merged canonical leaves.
 */
export function verifyProviderConsistency({
  provider,
  bundles,
  minGradePercent,
  expectedNonces,
}: {
  provider: string;
  bundles: GbvPageBundle[];
  minGradePercent: number;
  expectedNonces: Array<{ id: string; value: string }>;
}): GbvSemanticReport {
  const invariants: GbvSemanticReport["invariants"] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const info: string[] = [];

  const addInvariant = (
    id: string,
    status: "pass" | "fail" | "warn",
    detail: string,
  ) => {
    invariants.push({ id, status, detail });
    if (status === "fail") errors.push(`${id}: ${detail}`);
    if (status === "warn") warnings.push(`${id}: ${detail}`);
    if (status === "pass") info.push(`${id}: ${detail}`);
  };

  const leaves = bundles.flatMap((bundle) => bundle.leaves);
  const providers = [...valueSet(leaves, "provider")];
  const pageTypes = [...valueSet(leaves, "page:type")];
  const courseIds = [...valueSet(leaves, "course:id")];
  const courseKeys = [...valueSet(leaves, "course:key")];
  const courseSlugs = [...valueSet(leaves, "course:slug")];
  const courseNames = [...valueSet(leaves, "course:name")];
  const certificateIds = [...valueSet(leaves, "certificate:id")];
  const gradeLeaves = [...valueSet(leaves, "course:grade")];
  const moduleCountLeaves = [...valueSet(leaves, "course:module-count")];
  const gradePercents = gradeLeaves
    .map((leaf) => parsePercent(leaf))
    .filter((percent): percent is number => percent !== null);
  const moduleCounts = moduleCountLeaves
    .map((leaf) => parseNumber(leaf))
    .filter((count): count is number => count !== null);
  const observedNonces = parseNonceLeaves(leaves);

  if (providers.includes(provider)) {
    addInvariant("provider_id", "pass", `Observed provider '${provider}'`);
  } else {
    addInvariant(
      "provider_id",
      "fail",
      `Expected '${provider}', observed [${providers.join(", ")}]`,
    );
  }

  if (courseIds.length <= 1) {
    addInvariant("course_id_consistency", "pass", `Observed ${courseIds.length || 0} unique value`);
  } else {
    addInvariant(
      "course_id_consistency",
      "fail",
      `Multiple course IDs observed: [${courseIds.join(", ")}]`,
    );
  }

  if (courseKeys.length <= 1) {
    addInvariant("course_key_consistency", "pass", `Observed ${courseKeys.length || 0} unique value`);
  } else {
    addInvariant(
      "course_key_consistency",
      "fail",
      `Multiple course keys observed: [${courseKeys.join(", ")}]`,
    );
  }

  if (courseSlugs.length <= 1) {
    addInvariant("course_slug_consistency", "pass", `Observed ${courseSlugs.length || 0} unique value`);
  } else {
    addInvariant(
      "course_slug_consistency",
      "fail",
      `Multiple course slugs observed: [${courseSlugs.join(", ")}]`,
    );
  }

  if (courseNames.length <= 1) {
    addInvariant("course_name_consistency", "pass", `Observed ${courseNames.length || 0} unique value`);
  } else {
    addInvariant(
      "course_name_consistency",
      "fail",
      `Multiple course names observed: [${courseNames.join(", ")}]`,
    );
  }

  if (certificateIds.length <= 1) {
    addInvariant(
      "certificate_id_consistency",
      "pass",
      `Observed ${certificateIds.length || 0} unique value`,
    );
  } else {
    addInvariant(
      "certificate_id_consistency",
      "fail",
      `Multiple certificate IDs observed: [${certificateIds.join(", ")}]`,
    );
  }

  if (!moduleCounts.length) {
    addInvariant("module_count_consistency", "warn", "No module-count semantic fields were observed");
  } else {
    const uniqueModuleCounts = [...new Set(moduleCounts)];
    if (uniqueModuleCounts.length === 1) {
      addInvariant(
        "module_count_consistency",
        "pass",
        `Observed consistent module count ${uniqueModuleCounts[0]}`,
      );
    } else {
      addInvariant(
        "module_count_consistency",
        "fail",
        `Contradictory module counts observed: [${uniqueModuleCounts.join(", ")}]`,
      );
    }
  }

  if (!gradePercents.length) {
    addInvariant("grade_threshold", "fail", "No grade percentage observed in canonical leaves");
  } else {
    const minObserved = Math.min(...gradePercents);
    if (minObserved < minGradePercent) {
      addInvariant(
        "grade_threshold",
        "fail",
        `Observed minimum grade ${minObserved}% is below threshold ${minGradePercent}%`,
      );
    } else {
      addInvariant(
        "grade_threshold",
        "pass",
        `Observed minimum grade ${minObserved}% satisfies threshold ${minGradePercent}%`,
      );
    }
  }

  if (!expectedNonces.length) {
    addInvariant("nonce_presence", "warn", "No expected nonces were supplied to semantic verification");
  } else {
    const missingExpected = expectedNonces.filter(
      (expected) =>
        !observedNonces.some(
          (nonce) => nonce.id === expected.id && nonce.value === expected.value,
        ),
    );

    if (!missingExpected.length) {
      addInvariant("nonce_presence", "pass", "All expected challenge nonces were observed");
    } else {
      addInvariant(
        "nonce_presence",
        "fail",
        `Missing ${missingExpected.length} expected challenge nonce value(s)`,
      );
    }
  }

  const score = Math.max(0, 100 - errors.length * 15 - warnings.length * 3);

  return {
    ok: errors.length === 0,
    score,
    invariants,
    findings: { errors, warnings, info },
    observed: {
      providers,
      pageTypes,
      courseNames,
      certificateIds,
      gradePercents,
      nonces: observedNonces,
    },
  };
}
