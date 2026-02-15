import type { GbvPageType, GbvVerificationArtifact } from "@gbv/core/browser";

export type GbvCourseOption = GbvVerificationArtifact & {
  slug?: string;
};

export type RunFlowMessage = {
  type: "GBV_RUN_FLOW";
  artifact: GbvVerificationArtifact;
};

export type PingMessage = {
  type: "GBV_PING";
};

export type CollectSurfaceMessage = {
  type: "GBV_COLLECT_SURFACE";
  requestId: string;
  nonce: string;
  nonceLeafId: string;
};

export type PageCollectRequest = {
  type: "GBV_PAGE_COLLECT_REQUEST";
  requestId: string;
  nonce: string;
  nonceLeafId: string;
};

export type PageSnapshot = {
  url: string;
  html: string;
  injectedNonce: string;
};

export type PageCollectResponse =
  | {
      type: "GBV_PAGE_COLLECT_RESPONSE";
      requestId: string;
      ok: true;
      snapshot: PageSnapshot;
    }
  | {
      type: "GBV_PAGE_COLLECT_RESPONSE";
      requestId: string;
      ok: false;
      error: string;
    };

export type CanonicalizedSurface = {
  url: string;
  html: string;
  injectedNonce: string;
  pageType: GbvPageType;
  canonicalLeaves: string[];
  nonceMetadata: { id: string; value: string };
  observedAt: string;
};

export type CollectSurfaceResponse =
  | {
      ok: true;
      surface: CanonicalizedSurface;
    }
  | {
      ok: false;
      error: string;
    };

export type RunFlowResult = {
  status: number;
  body: GbvSubmitResponsePayload;
  artifact: GbvVerificationArtifact;
  observationCount: number;
  canonicalLeafCount: number;
  sessionId: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
};

export type RunFlowResponse =
  | {
      ok: true;
      result: RunFlowResult;
    }
  | {
      ok: false;
      error: string;
    };

export type PingResponse = {
  ok: true;
  serviceWorker: "ready";
  ts: string;
};

export type GbvTraceSummaryStages = {
  parseMs?: number;
  canonicalizeMs?: number;
  structureMs?: number;
  semanticMs?: number;
  commitMs?: number;
  [key: string]: unknown;
};

export type GbvTraceSummary = {
  requestId?: string;
  durationMs?: number;
  stages?: GbvTraceSummaryStages;
  [key: string]: unknown;
};

export type GbvSemanticFindings = {
  errors?: string[];
  warnings?: string[];
  info?: string[];
  [key: string]: unknown;
};

export type GbvSemanticInvariant = {
  id?: string;
  status?: "pass" | "fail" | "warn";
  detail?: string;
  [key: string]: unknown;
};

export type GbvSemanticReport = {
  ok?: boolean;
  score?: number;
  findings?: GbvSemanticFindings;
  invariants?: GbvSemanticInvariant[];
  [key: string]: unknown;
};

export type GbvVerificationLog = {
  semantic?: GbvSemanticReport;
  [key: string]: unknown;
};

export type GbvSubmitSuccessPayload = {
  ok: true;
  requestId?: string;
  resultCode?: string;
  sessionId?: string;
  provider?: string;
  evidenceHash?: string;
  merkleRoot?: string;
  receiptId?: string;
  receipt?: string;
  verifiedAt?: string;
  challengeNonce?: string;
  protocolVersion?: string;
  traceSummary?: GbvTraceSummary;
  verificationLog?: GbvVerificationLog;
  failedInvariantIds?: string[];
  code?: string;
  meta?: Record<string, unknown>;
  [key: string]: unknown;
};

export type GbvSubmitFailureMeta = {
  sessionId?: string;
  traceSummary?: GbvTraceSummary;
  verificationLog?: GbvVerificationLog;
  failedInvariantIds?: string[];
  [key: string]: unknown;
};

export type GbvSubmitFailurePayload = {
  ok: false;
  requestId?: string;
  code?: string;
  resultCode?: string;
  error?: string;
  meta?: GbvSubmitFailureMeta;
  [key: string]: unknown;
};

export type GbvSubmitResponsePayload =
  | GbvSubmitSuccessPayload
  | GbvSubmitFailurePayload
  | Record<string, unknown>;
