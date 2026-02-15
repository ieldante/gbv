import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { signReceipt, verifyReceipt } from "../src/receipt";
import type { GbvReceiptPayload } from "../src/types";

const secret = "unit-test-secret";

const payload: GbvReceiptPayload = {
  receiptId: "rid-1",
  sessionId: "sid-1",
  artifact: {
    courseId: 1,
    publicCourseKey: "csk_test",
    certificateId: "cert-1",
  },
  provider: "synthetic",
  merkleRoot: "a".repeat(64),
  evidenceHash: "b".repeat(64),
  issuedAt: "2026-02-14T00:00:00.000Z",
  protocolVersion: "0.71",
};

describe("receipt signing", () => {
  test("verifies a valid signed receipt", () => {
    const token = signReceipt(payload, secret);
    const decoded = verifyReceipt(token, secret);
    assert.deepEqual(decoded, payload);
  });

  test("rejects a tampered receipt signature", () => {
    const token = signReceipt(payload, secret);
    const [body] = token.split(".");
    assert.throws(() => verifyReceipt(`${body}.tampered`, secret));
  });
});
