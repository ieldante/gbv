import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

import { getDb } from "@/db/mongodb";
import { getProvider } from "@/lib/attestation"; // <-- registry (mock, etc)

/**
 * Resolve the provider for a given courseId.
 *
 * Security note:
 * - The server must determine the provider for a courseId.
 * - Do not accept the provider from the client, because it would let a client
 *   select a weaker provider implementation.
 *
 * OSS demo note:
 * - This demo uses a single provider ("mock"). Replace this with a database
 *   lookup or a static map if you add more demo courses.
 *
 * @param {number} courseId
 * @returns {string|null} Provider key (e.g., "mock") or null if unknown.
 */
function resolveProviderForCourse(courseId) {
  void courseId; // demo uses a single provider
  return "mock";
}

/**
 * Create a consistent JSON error response for the attestation API.
 *
 * @param {number} status HTTP status code.
 * @param {string} code Stable, machine-readable error code.
 * @param {string} error Human-readable error message.
 * @param {Record<string, any>} [meta] Optional structured metadata.
 * @returns {NextResponse}
 */
function err(status, code, error, meta = {}) {
  return NextResponse.json({ ok: false, code, error, meta }, { status });
}

/**
 * Read a server-defined page plan from the provider module.
 * Provider is the source of truth for page plan in this prototype.
 *
 * @param {object} providerModule
 * @returns {string[]|null}
 */
function getPlanFromProvider(providerModule) {
  if (!providerModule) return null;

  // Option A: provider.pagePlan (simple + recommended)
  if (
    Array.isArray(providerModule.pagePlan) &&
    providerModule.pagePlan.length
  ) {
    return providerModule.pagePlan.map((t) => String(t));
  }

  // Option B: provider.getPagePlan() (if you ever want dynamic plans)
  if (typeof providerModule.getPagePlan === "function") {
    const plan = providerModule.getPagePlan();
    if (Array.isArray(plan) && plan.length) return plan.map((t) => String(t));
  }

  return null;
}

/**
 * Initialize an attestation session.
 *
 * POST /api/attestation/init
 *
 * This endpoint issues:
 * - a session nonce, and
 * - a set of per-page nonces bound to the server-defined page plan for the provider.
 *
 * It will reuse an existing, unexpired, unused nonce document when available.
 *
 * @param {Request} req
 * @returns {Promise<NextResponse>}
 */
export async function POST(req) {
  const body = await req.json().catch(() => ({}));

  const courseId = Number(body?.courseId);
  if (!Number.isFinite(courseId)) {
    return err(400, "BAD_COURSE_ID", "Invalid courseId");
  }

  const providerKey = String(
    resolveProviderForCourse(courseId) || ""
  ).toLowerCase();
  if (!providerKey) {
    return err(
      400,
      "MISSING_PROVIDER",
      "Unable to resolve provider for courseId",
      {
        courseId,
      }
    );
  }

  const provider = getProvider(providerKey);
  if (!provider) {
    return err(400, "UNKNOWN_PROVIDER", "Unknown provider", {
      provider: providerKey,
    });
  }

  const desiredPlan = getPlanFromProvider(provider);
  if (!Array.isArray(desiredPlan) || desiredPlan.length === 0) {
    return err(500, "BAD_PROVIDER_PLAN", "Provider has no valid pagePlan", {
      provider: providerKey,
    });
  }

  const db = await getDb();
  const nonces = db.collection("nonces");

  /**
   * OSS demo identity model:
   * This prototype intentionally omits authentication. To keep the API behavior
   * deterministic, all requests are treated as coming from a single demo user.
   *
   * Replace this with a real user id (e.g., from a session/JWT) in production.
   */
  const uid = "u18_44414e54452049454c4345414e55";

  // Do not issue new nonces if the attestation is already recorded.
  const existingCompletion = await db.collection("completions").findOne({
    uid,
    courseId,
  });

  if (existingCompletion) {
    return err(
      409,
      "COURSE_DONE",
      "Course already completed. Cannot re-initialize.",
      {
        courseId,
      }
    );
  }

  // Reuse an unexpired, unused nonce document when available.
  const now = new Date();
  const existing = await nonces.findOne({
    uid,
    courseId,
    provider: providerKey,
    used: false,
    expiresAt: { $gt: now },
  });

  if (existing) {
    let pagePlan = Array.isArray(existing.pagePlan) ? existing.pagePlan : null;
    let pageNonces = Array.isArray(existing.pageNonces)
      ? existing.pageNonces
      : null;

    const planMismatch =
      !pagePlan ||
      pagePlan.length !== desiredPlan.length ||
      pagePlan.join("|") !== desiredPlan.join("|");

    const noncesInvalid =
      !pageNonces ||
      pageNonces.length !== desiredPlan.length ||
      pageNonces.some((n) => !String(n || "").trim());

    const providerMismatch =
      String(existing.provider || "").toLowerCase() !== providerKey;

    if (planMismatch || noncesInvalid || providerMismatch) {
      pagePlan = desiredPlan;
      pageNonces = desiredPlan.map(() => uuid());

      await nonces.updateOne(
        { _id: existing._id },
        { $set: { provider: providerKey, pagePlan, pageNonces } }
      );
    }

    return NextResponse.json({
      ok: true,
      provider: providerKey,
      nonce: existing.nonce,
      expiresAt: existing.expiresAt,
      reused: true,
      pagePlan,
      pageNonces,
    });
  }

  // Create a new nonce document for this attestation session.
  const nonce = uuid();
  const createdAt = new Date();
  const expiresAt = new Date(Date.now() + 60 * 1000);

  const pagePlan = desiredPlan;
  const pageNonces = pagePlan.map(() => uuid());

  await nonces.insertOne({
    nonce,
    uid,
    courseId,
    provider: providerKey,
    createdAt,
    expiresAt,
    used: false,
    pagePlan,
    pageNonces,
  });

  return NextResponse.json({
    ok: true,
    provider: providerKey,
    nonce,
    expiresAt,
    reused: false,
    pagePlan,
    pageNonces,
  });
}
