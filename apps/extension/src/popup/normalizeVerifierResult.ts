import type {
  GbvSemanticInvariant,
  GbvSubmitFailurePayload,
  GbvSubmitResponsePayload,
  GbvSubmitSuccessPayload,
  GbvTraceSummary,
  RunFlowResult,
} from "../lib/messages";

export type PipelineStageName =
  | "parse"
  | "canonicalize"
  | "structure"
  | "semantic"
  | "commit";

export type TerminationStage = PipelineStageName | "unknown_pre_trace";

export type NormalizedStage = {
  executed: boolean;
  durationMs?: number;
};

export type NormalizedPipelineStages = {
  parse: NormalizedStage;
  canonicalize: NormalizedStage;
  structure: NormalizedStage;
  semantic: NormalizedStage;
  commit: NormalizedStage;
};

export type NormalizedSemanticStage = {
  executed: boolean;
  ok?: boolean;
  score?: number;
  findings: {
    errors: string[];
    warnings: string[];
    info: string[];
  };
  failedInvariantIds: string[];
};

export type NormalizedVerifierResult = {
  httpStatus: number;
  decisionCode: string;
  requestId: string;
  sessionId: string;
  durationMs?: number;
  score?: number;
  stages: NormalizedPipelineStages;
  semantic: NormalizedSemanticStage;
  commitStageExecuted: boolean;
  terminationStage: TerminationStage;
  artifact: RunFlowResult["artifact"];
  observationCount: number;
  canonicalLeafCount: number;
  startedAt: string;
  finishedAt: string;
  provider?: string;
  verifiedAt?: string;
  challengeNonce?: string;
  protocolVersion?: string;
  evidenceHash?: string;
  merkleRoot?: string;
  receiptId?: string;
  receipt?: string;
  rawResponse: GbvSubmitResponsePayload;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return Number.isFinite(value) ? Number(value) : undefined;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => String(entry));
}

function isFailurePayload(payload: GbvSubmitResponsePayload): payload is GbvSubmitFailurePayload {
  return asRecord(payload)?.ok === false;
}

function isSuccessPayload(payload: GbvSubmitResponsePayload): payload is GbvSubmitSuccessPayload {
  return asRecord(payload)?.ok === true;
}

function getTraceSummary(payload: GbvSubmitResponsePayload): GbvTraceSummary | undefined {
  const root = asRecord(payload);
  const rootTrace = asRecord(root?.traceSummary);
  if (rootTrace) return rootTrace as GbvTraceSummary;
  const meta = asRecord(root?.meta);
  const metaTrace = asRecord(meta?.traceSummary);
  if (metaTrace) return metaTrace as GbvTraceSummary;
  return undefined;
}

function stageFromPresence(stagesRaw: Record<string, unknown> | null, key: string): NormalizedStage {
  if (!stagesRaw) return { executed: false };
  const executed = Object.prototype.hasOwnProperty.call(stagesRaw, key);
  return {
    executed,
    ...(executed ? { durationMs: asNumber(stagesRaw[key]) } : {}),
  };
}

function deriveTerminationStage(stages: NormalizedPipelineStages): TerminationStage {
  if (stages.commit.executed) return "commit";
  if (stages.semantic.executed) return "semantic";
  if (stages.structure.executed) return "structure";
  if (stages.canonicalize.executed) return "canonicalize";
  if (stages.parse.executed) return "parse";
  return "unknown_pre_trace";
}

function extractSemanticReport(payload: GbvSubmitResponsePayload): Record<string, unknown> | null {
  const root = asRecord(payload);
  const rootLog = asRecord(root?.verificationLog);
  const rootSemantic = asRecord(rootLog?.semantic);
  if (rootSemantic) return rootSemantic;
  const meta = asRecord(root?.meta);
  const metaLog = asRecord(meta?.verificationLog);
  const metaSemantic = asRecord(metaLog?.semantic);
  return metaSemantic;
}

function extractFailedInvariantIds(
  payload: GbvSubmitResponsePayload,
  semanticReport: Record<string, unknown> | null,
): string[] {
  const root = asRecord(payload);
  const topLevel = asStringArray(root?.failedInvariantIds);
  if (topLevel.length > 0) return topLevel;

  const meta = asRecord(root?.meta);
  const metaLevel = asStringArray(meta?.failedInvariantIds);
  if (metaLevel.length > 0) return metaLevel;

  const invariants = Array.isArray(semanticReport?.invariants)
    ? (semanticReport?.invariants as GbvSemanticInvariant[])
    : [];
  return invariants
    .filter((entry) => entry?.status === "fail" && typeof entry?.id === "string")
    .map((entry) => String(entry.id));
}

export function normalizeVerifierResult(result: RunFlowResult): NormalizedVerifierResult {
  const payload = result.body;
  const payloadRecord = asRecord(payload);
  const traceSummary = getTraceSummary(payload);
  const traceSummaryRecord = asRecord(traceSummary);
  const traceStages = asRecord(traceSummaryRecord?.stages);

  const stages: NormalizedPipelineStages = {
    parse: stageFromPresence(traceStages, "parseMs"),
    canonicalize: stageFromPresence(traceStages, "canonicalizeMs"),
    structure: stageFromPresence(traceStages, "structureMs"),
    semantic: stageFromPresence(traceStages, "semanticMs"),
    commit: stageFromPresence(traceStages, "commitMs"),
  };

  const semanticReport = extractSemanticReport(payload);
  const findings = asRecord(semanticReport?.findings);
  const failedInvariantIds = extractFailedInvariantIds(payload, semanticReport);

  const semantic: NormalizedSemanticStage = {
    executed: stages.semantic.executed,
    ok: typeof semanticReport?.ok === "boolean" ? Boolean(semanticReport.ok) : undefined,
    score: asNumber(semanticReport?.score),
    findings: {
      errors: asStringArray(findings?.errors),
      warnings: asStringArray(findings?.warnings),
      info: asStringArray(findings?.info),
    },
    failedInvariantIds,
  };

  const meta = asRecord(payloadRecord?.meta);
  const requestId =
    asString(payloadRecord?.requestId) ??
    asString(traceSummaryRecord?.requestId) ??
    "-";
  const sessionId =
    asString(payloadRecord?.sessionId) ??
    asString(meta?.sessionId) ??
    result.sessionId;
  const durationMs = asNumber(traceSummaryRecord?.durationMs) ?? result.durationMs;
  const decisionCode =
    asString(payloadRecord?.resultCode) ??
    asString(payloadRecord?.code) ??
    (isSuccessPayload(payload) ? "VERIFICATION_ACCEPTED" : isFailurePayload(payload) ? "VERIFICATION_FAILED" : "UNKNOWN");

  return {
    httpStatus: result.status,
    decisionCode,
    requestId,
    sessionId,
    durationMs,
    score: semantic.score,
    stages,
    semantic,
    commitStageExecuted: stages.commit.executed,
    terminationStage: deriveTerminationStage(stages),
    artifact: result.artifact,
    observationCount: result.observationCount,
    canonicalLeafCount: result.canonicalLeafCount,
    startedAt: result.startedAt,
    finishedAt: result.finishedAt,
    provider: asString(payloadRecord?.provider),
    verifiedAt: asString(payloadRecord?.verifiedAt),
    challengeNonce: asString(payloadRecord?.challengeNonce),
    protocolVersion: asString(payloadRecord?.protocolVersion),
    evidenceHash: asString(payloadRecord?.evidenceHash),
    merkleRoot: asString(payloadRecord?.merkleRoot),
    receiptId: asString(payloadRecord?.receiptId),
    receipt: asString(payloadRecord?.receipt),
    rawResponse: payload,
  };
}
