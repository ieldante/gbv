import crypto from "node:crypto";
import {
  buildMerkleRoot,
  type GbvPageBundle,
  type GbvPageType,
  type GbvReceiptPayload,
  type GbvSemanticReport,
  type GbvVerificationArtifact,
  sha256Hex,
  signReceipt,
  syntheticProvider,
  verifyProviderConsistency,
  verifyStructureBoundNonces,
} from "@gbv/core";
import { gbvConfig } from "@gbv/config";
import { logDebug, logError, logInfo } from "./logger";
import {
  getReceipt,
  getSession,
  insertReceipt,
  markSessionUsed,
  upsertSession,
  type GbvSessionRecord,
} from "./store/memoryStore";

type VerificationLog = {
  structure: { ok: boolean; error?: string; details?: Record<string, unknown> };
  semantic?: GbvSemanticReport;
};

type TraceSummary = {
  requestId: string;
  durationMs: number;
  stages: {
    parseMs: number;
    canonicalizeMs: number;
    structureMs: number;
    semanticMs: number;
    commitMs: number;
  };
};

class GbvServiceError extends Error {
  status: number;
  code: string;
  meta?: Record<string, unknown>;

  constructor(
    status: number,
    code: string,
    message: string,
    meta?: Record<string, unknown>,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.meta = meta;
  }
}

function parseBody(body: unknown): Record<string, unknown> {
  if (body && typeof body === "object") {
    return body as Record<string, unknown>;
  }
  return {};
}

function parseArtifact(rawArtifact: unknown): GbvVerificationArtifact {
  const artifact = rawArtifact as Record<string, unknown>;
  const courseId = Number(artifact?.courseId);
  const publicCourseKey = String(artifact?.publicCourseKey || "").trim();
  const certificateId = String(artifact?.certificateId || "").trim();
  const title = String(artifact?.title || "").trim();

  if (!Number.isFinite(courseId)) {
    throw new GbvServiceError(400, "INVALID_ARTIFACT", "artifact.courseId must be numeric");
  }
  if (!publicCourseKey) {
    throw new GbvServiceError(400, "INVALID_ARTIFACT", "artifact.publicCourseKey is required");
  }
  if (!certificateId) {
    throw new GbvServiceError(400, "INVALID_ARTIFACT", "artifact.certificateId is required");
  }

  return {
    courseId,
    publicCourseKey,
    certificateId,
    ...(title ? { title } : {}),
  };
}

function parseSubmitPages(rawPages: unknown): Array<{ url: string; html: string; injectedNonce: string }> {
  if (!Array.isArray(rawPages) || rawPages.length === 0) {
    throw new GbvServiceError(400, "INVALID_PAGES", "pages[] must be a non-empty array");
  }

  if (rawPages.length > gbvConfig.protocol.maxPages) {
    throw new GbvServiceError(400, "TOO_MANY_PAGES", "Too many pages submitted", {
      maxPages: gbvConfig.protocol.maxPages,
      actual: rawPages.length,
    });
  }

  return rawPages.map((entry, index) => {
    const page = entry as Record<string, unknown>;
    const url = String(page?.url || "").trim();
    const html = String(page?.html || "");
    const injectedNonce = String(page?.injectedNonce || "").trim();

    if (!url || !html || !injectedNonce) {
      throw new GbvServiceError(
        400,
        "INVALID_PAGE_ENTRY",
        "Each page must contain url, html and injectedNonce",
        { index },
      );
    }

    if (html.length > gbvConfig.protocol.maxHtmlChars) {
      throw new GbvServiceError(400, "HTML_TOO_LARGE", "Page html exceeds configured size limit", {
        index,
        maxHtmlChars: gbvConfig.protocol.maxHtmlChars,
      });
    }

    return { url, html, injectedNonce };
  });
}

function canonicalizePages(
  pages: Array<{ url: string; html: string; injectedNonce: string }>,
): GbvPageBundle[] {
  return pages.map((page, index) => {
    const pageType = syntheticProvider.detectPageType(page.url);
    const leaves = syntheticProvider.canonicalize({
      html: page.html,
      url: page.url,
      nonceLeafId: gbvConfig.protocol.nonceLeafId,
    });

    return {
      index,
      pageType,
      url: page.url,
      html: page.html,
      injectedNonce: page.injectedNonce,
      leaves,
    };
  });
}

function commitEvidence(bundles: GbvPageBundle[]): {
  canonicalLeaves: string[];
  evidenceHash: string;
  merkleRoot: string;
} {
  const canonicalLeaves = [...new Set(bundles.flatMap((bundle) => bundle.leaves))].sort();

  if (!canonicalLeaves.length) {
    throw new GbvServiceError(400, "NO_CANONICAL_LEAVES", "No canonical leaves produced");
  }

  const leafHashes = canonicalLeaves.map((leaf) => sha256Hex(leaf));
  const merkleRoot = buildMerkleRoot(leafHashes);
  const evidenceHash = sha256Hex(JSON.stringify(canonicalLeaves));

  return { canonicalLeaves, evidenceHash, merkleRoot };
}

function requireSession(sessionId: string): GbvSessionRecord {
  const session = getSession(sessionId);
  if (!session) {
    throw new GbvServiceError(404, "SESSION_NOT_FOUND", "Unknown sessionId");
  }

  if (session.used) {
    throw new GbvServiceError(409, "SESSION_USED", "Session was already consumed");
  }

  if (Date.now() > Date.parse(session.expiresAt)) {
    throw new GbvServiceError(403, "SESSION_EXPIRED", "Session has expired");
  }

  return session;
}

function errorResponse(error: unknown, requestId?: string): {
  status: number;
  body: {
    ok: false;
    requestId: string;
    code: string;
    resultCode: string;
    error: string;
    meta?: Record<string, unknown>;
  };
} {
  const resolvedRequestId = requestId || crypto.randomUUID();
  if (error instanceof GbvServiceError) {
    logInfo("request.failed", {
      requestId: resolvedRequestId,
      code: error.code,
      status: error.status,
    });
    return {
      status: error.status,
      body: {
        ok: false,
        requestId: resolvedRequestId,
        code: error.code,
        resultCode: error.code,
        error: error.message,
        meta: error.meta,
      },
    };
  }

  logError("request.unhandled_error", {
    requestId: resolvedRequestId,
  });
  return {
    status: 500,
    body: {
      ok: false,
      requestId: resolvedRequestId,
      code: "INTERNAL_ERROR",
      resultCode: "INTERNAL_ERROR",
      error: "Unexpected GBV server error",
    },
  };
}

/** Spec Stage I: challenge issuance with verifier-side blindness to dataset validity. */
export function initGbvSession(rawBody: unknown): {
  status: number;
  body: Record<string, unknown>;
} {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  try {
    const body = parseBody(rawBody);
    const artifact = parseArtifact(body.artifact);
    const pagePlan = [...gbvConfig.demo.pagePlan] as GbvPageType[];
    const pageNonces = pagePlan.map(() => crypto.randomUUID());
    const sessionId = crypto.randomUUID();
    const challengeNonce = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + gbvConfig.protocol.sessionTtlMs).toISOString();

    const record: GbvSessionRecord = {
      sessionId,
      challengeNonce,
      provider: gbvConfig.protocol.providerId,
      artifact,
      pagePlan,
      pageNonces,
      nonceLeafId: gbvConfig.protocol.nonceLeafId,
      expiresAt,
      used: false,
    };

    upsertSession(record);
    const durationMs = Date.now() - startedAt;
    logInfo("stage.init.completed", {
      requestId,
      durationMs,
      sessionId,
      artifactKey: artifact.publicCourseKey,
    });

    return {
      status: 200,
      body: {
        ok: true,
        requestId,
        resultCode: "SESSION_INITIALIZED",
        sessionId,
        challengeNonce,
        provider: record.provider,
        artifact,
        pagePlan,
        pageNonces,
        nonceLeafId: record.nonceLeafId,
        expiresAt,
        timing: { totalMs: durationMs },
      },
    };
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

/** Spec Stage II-V: verify only from observed surfaces and issued nonce plan. */
export function submitGbvEvidence(rawBody: unknown): {
  status: number;
  body: Record<string, unknown>;
} {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  try {
    const parseStart = Date.now();
    const body = parseBody(rawBody);
    const sessionId = String(body.sessionId || "").trim();
    const provider = String(body.provider || "").trim().toLowerCase();
    const courseId = Number(body.courseId);
    const pages = parseSubmitPages(body.pages);
    const parseMs = Date.now() - parseStart;

    if (!sessionId) {
      throw new GbvServiceError(400, "MISSING_SESSION_ID", "sessionId is required");
    }
    if (!provider) {
      throw new GbvServiceError(400, "MISSING_PROVIDER", "provider is required");
    }
    if (!Number.isFinite(courseId)) {
      throw new GbvServiceError(400, "INVALID_COURSE_ID", "courseId must be numeric");
    }

    const session = requireSession(sessionId);
    if (provider !== session.provider) {
      throw new GbvServiceError(
        400,
        "PROVIDER_MISMATCH",
        "Provider does not match issued session",
        {
          expected: session.provider,
          provider,
        },
      );
    }
    if (courseId !== session.artifact.courseId) {
      throw new GbvServiceError(
        400,
        "COURSE_MISMATCH",
        "courseId does not match issued session artifact",
      );
    }
    if (pages.length !== session.pagePlan.length) {
      throw new GbvServiceError(
        400,
        "PAGE_COUNT_MISMATCH",
        "Submitted page count does not match the issued plan",
        {
          expected: session.pagePlan.length,
          actual: pages.length,
        },
      );
    }

    logDebug("stage.submit.input_validated", {
      requestId,
      sessionId,
      provider,
      courseId,
      pageCount: pages.length,
    });

    const canonicalizeStart = Date.now();
    const bundles = canonicalizePages(pages);
    const canonicalizeMs = Date.now() - canonicalizeStart;
    const verificationLog: VerificationLog = {
      structure: { ok: true },
    };

    const structureStart = Date.now();
    const structure = verifyStructureBoundNonces({
      bundles,
      pagePlan: session.pagePlan,
      pageNonces: session.pageNonces,
      nonceLeafId: session.nonceLeafId,
    });
    const structureMs = Date.now() - structureStart;

    if (!structure.ok) {
      verificationLog.structure = {
        ok: false,
        error: structure.error,
        details: structure.details,
      };
      const traceSummary: TraceSummary = {
        requestId,
        durationMs: Date.now() - startedAt,
        stages: {
          parseMs,
          canonicalizeMs,
          structureMs,
          semanticMs: 0,
          commitMs: 0,
        },
      };
      throw new GbvServiceError(
        400,
        structure.error,
        "Structure-bound nonce verification failed",
        { verificationLog, traceSummary, sessionId },
      );
    }

    const semanticStart = Date.now();
    const semantic = verifyProviderConsistency({
      provider,
      bundles,
      minGradePercent: gbvConfig.protocol.minGradePercent,
      expectedNonces: session.pageNonces.map((value) => ({
        id: session.nonceLeafId,
        value,
      })),
    });
    const semanticMs = Date.now() - semanticStart;
    verificationLog.semantic = semantic;

    if (!semantic.ok) {
      const failedInvariantIds = semantic.invariants
        .filter((entry) => entry.status === "fail")
        .map((entry) => entry.id);
      const traceSummary: TraceSummary = {
        requestId,
        durationMs: Date.now() - startedAt,
        stages: {
          parseMs,
          canonicalizeMs,
          structureMs,
          semanticMs,
          commitMs: 0,
        },
      };
      throw new GbvServiceError(
        400,
        "SEMANTIC_VERIFICATION_FAILED",
        "Semantic verification failed",
        { verificationLog, failedInvariantIds, traceSummary, sessionId },
      );
    }

    const commitStart = Date.now();
    const { canonicalLeaves, evidenceHash, merkleRoot } = commitEvidence(bundles);
    const commitMs = Date.now() - commitStart;
    const receiptId = crypto.randomUUID();
    const issuedAt = new Date().toISOString();
    const durationMs = Date.now() - startedAt;

    const payload: GbvReceiptPayload = {
      receiptId,
      sessionId,
      artifact: session.artifact,
      provider,
      merkleRoot,
      evidenceHash,
      issuedAt,
      protocolVersion: gbvConfig.versions.protocol,
    };

    const token = signReceipt(payload, gbvConfig.protocol.receiptHmacSecret);
    insertReceipt(receiptId, { token, payload });
    markSessionUsed(sessionId);
    const failedInvariantIds = verificationLog.semantic?.invariants
      .filter((entry) => entry.status === "fail")
      .map((entry) => entry.id) || [];
    const traceSummary: TraceSummary = {
      requestId,
      durationMs,
      stages: {
        parseMs,
        canonicalizeMs,
        structureMs,
        semanticMs,
        commitMs,
      },
    };

    logInfo("stage.submit.completed", {
      requestId,
      sessionId,
      status: 200,
      leafCount: canonicalLeaves.length,
      durationMs,
    });

    return {
      status: 200,
      body: {
        ok: true,
        requestId,
        resultCode: "VERIFICATION_ACCEPTED",
        accepted: true,
        sessionId,
        receiptId,
        receipt: token,
        provider,
        artifact: session.artifact,
        evidenceHash,
        merkleRoot,
        leafCount: canonicalLeaves.length,
        verifiedAt: issuedAt,
        verificationLog,
        failedInvariantIds,
        traceSummary,
        timing: { totalMs: durationMs },
      },
    };
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

/** Retrieve verifier receipt by ID. */
export function getGbvReceipt(receiptId: string): {
  status: number;
  body: Record<string, unknown>;
} {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  try {
    const normalizedId = String(receiptId || "").trim();
    if (!normalizedId) {
      throw new GbvServiceError(400, "MISSING_RECEIPT_ID", "receiptId is required");
    }

    const receipt = getReceipt(normalizedId);
    if (!receipt) {
      throw new GbvServiceError(404, "RECEIPT_NOT_FOUND", "Receipt not found");
    }
    const durationMs = Date.now() - startedAt;
    logInfo("stage.receipt.completed", {
      requestId,
      receiptId: normalizedId,
      durationMs,
    });

    return {
      status: 200,
      body: {
        ok: true,
        requestId,
        resultCode: "RECEIPT_RETRIEVED",
        receiptId: normalizedId,
        receipt: receipt.token,
        payload: receipt.payload,
        timing: { totalMs: durationMs },
      },
    };
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
