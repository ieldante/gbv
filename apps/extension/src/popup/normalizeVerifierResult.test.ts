import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { RunFlowResult } from "../lib/messages";
import { normalizeVerifierResult } from "./normalizeVerifierResult";

function buildBaseResult(body: RunFlowResult["body"]): RunFlowResult {
  return {
    status: 400,
    body,
    artifact: {
      courseId: 404,
      publicCourseKey: "csk_t1mix",
      certificateId: "MIX-7Q1Z-442K",
      title: "Secure Evidence Practicum",
    },
    observationCount: 6,
    canonicalLeafCount: 31,
    sessionId: "fallback-session-id",
    startedAt: "2026-02-14T00:00:00.000Z",
    finishedAt: "2026-02-14T00:00:01.000Z",
    durationMs: 1000,
  };
}

describe("normalizeVerifierResult", () => {
  test("treats zero-duration present stages as executed on success", () => {
    const result = buildBaseResult({
      ok: true,
      requestId: "req-1",
      sessionId: "sess-1",
      resultCode: "VERIFICATION_ACCEPTED",
      verificationLog: {
        semantic: {
          ok: true,
          score: 100,
          findings: { errors: [], warnings: [], info: [] },
          invariants: [],
        },
      },
      traceSummary: {
        durationMs: 0,
        stages: {
          parseMs: 0,
          canonicalizeMs: 0,
          structureMs: 0,
          semanticMs: 0,
          commitMs: 0,
        },
      },
      evidenceHash: "abc",
      merkleRoot: "def",
      receiptId: "rid-1",
      receipt: "token",
    });
    result.status = 200;

    const normalized = normalizeVerifierResult(result);
    assert.equal(normalized.stages.parse.executed, true);
    assert.equal(normalized.stages.semantic.executed, true);
    assert.equal(normalized.stages.commit.executed, true);
    assert.equal(normalized.commitStageExecuted, true);
    assert.equal(normalized.terminationStage, "commit");
  });

  test("maps semantic-failure payload from meta and resolves semantic termination", () => {
    const result = buildBaseResult({
      ok: false,
      code: "SEMANTIC_VERIFICATION_FAILED",
      resultCode: "SEMANTIC_VERIFICATION_FAILED",
      requestId: "req-2",
      meta: {
        sessionId: "sess-2",
        traceSummary: {
          durationMs: 12,
          stages: {
            parseMs: 3,
            canonicalizeMs: 4,
            structureMs: 5,
            semanticMs: 0,
          },
        },
        verificationLog: {
          semantic: {
            ok: false,
            score: 55,
            findings: { errors: ["grade_threshold"], warnings: [], info: [] },
            invariants: [{ id: "grade_threshold", status: "fail" }],
          },
        },
        failedInvariantIds: ["grade_threshold"],
      },
    });

    const normalized = normalizeVerifierResult(result);
    assert.equal(normalized.sessionId, "sess-2");
    assert.equal(normalized.durationMs, 12);
    assert.equal(normalized.semantic.executed, true);
    assert.equal(normalized.semantic.ok, false);
    assert.deepEqual(normalized.semantic.failedInvariantIds, ["grade_threshold"]);
    assert.equal(normalized.commitStageExecuted, false);
    assert.equal(normalized.terminationStage, "semantic");
  });

  test("resolves structure termination when semantic stage not present", () => {
    const result = buildBaseResult({
      ok: false,
      code: "INJECTED_NONCE_MISMATCH",
      requestId: "req-3",
      meta: {
        traceSummary: {
          stages: {
            parseMs: 1,
            canonicalizeMs: 1,
            structureMs: 1,
          },
        },
      },
    });

    const normalized = normalizeVerifierResult(result);
    assert.equal(normalized.stages.semantic.executed, false);
    assert.equal(normalized.terminationStage, "structure");
    assert.equal(normalized.commitStageExecuted, false);
  });

  test("always emits semantic object even when report missing", () => {
    const result = buildBaseResult({
      ok: false,
      code: "SESSION_EXPIRED",
      requestId: "req-4",
      meta: {
        traceSummary: {
          stages: {
            parseMs: 1,
          },
        },
      },
    });

    const normalized = normalizeVerifierResult(result);
    assert.equal(normalized.semantic.executed, false);
    assert.deepEqual(normalized.semantic.findings.errors, []);
    assert.deepEqual(normalized.semantic.failedInvariantIds, []);
    assert.equal(normalized.terminationStage, "parse");
  });

  test("falls back to unknown_pre_trace when no stage map is available", () => {
    const result = buildBaseResult({
      ok: false,
      code: "INTERNAL_ERROR",
      requestId: "req-5",
    });

    const normalized = normalizeVerifierResult(result);
    assert.equal(normalized.terminationStage, "unknown_pre_trace");
    assert.equal(normalized.commitStageExecuted, false);
  });
});
