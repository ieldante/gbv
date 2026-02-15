/** Supported GBV page types in the synthetic demo. */
export type GbvPageType =
  | "hub"
  | "course"
  | "assignments"
  | "proof"
  | "certificate"
  | "milestones"
  | "unknown";

/** Artifact selected by the verifier client for observation. */
export interface GbvVerificationArtifact {
  courseId: number;
  publicCourseKey: string;
  certificateId: string;
  title?: string;
}

/** Canonicalized evidence bundle for a single observed surface. */
export interface GbvPageBundle {
  index: number;
  pageType: GbvPageType;
  url: string;
  html: string;
  injectedNonce: string;
  leaves: string[];
}

/** Stage I session created by the verifier. */
export interface GbvSession {
  sessionId: string;
  challengeNonce: string;
  provider: string;
  artifact: GbvVerificationArtifact;
  pagePlan: GbvPageType[];
  pageNonces: string[];
  nonceLeafId: string;
  expiresAt: string;
  used: boolean;
}

/** Generic GBV API error response shape. */
export interface GbvApiError {
  ok: false;
  code: string;
  error: string;
  meta?: Record<string, unknown>;
}

/** Generic accepted verification response payload. */
export interface GbvVerificationSuccess {
  ok: true;
  accepted: true;
  sessionId: string;
  receiptId: string;
  receipt: string;
  provider: string;
  artifact: GbvVerificationArtifact;
  evidenceHash: string;
  merkleRoot: string;
  leafCount: number;
  verifiedAt: string;
  verificationLog: {
    structure: { ok: boolean; error?: string; details?: Record<string, unknown> };
    semantic: GbvSemanticReport;
  };
}

/** Semantic verification report returned by Stage III checks. */
export interface GbvSemanticReport {
  ok: boolean;
  score: number;
  invariants: Array<{
    id: string;
    status: "pass" | "fail" | "warn";
    detail: string;
  }>;
  findings: {
    errors: string[];
    warnings: string[];
    info: string[];
  };
  observed: {
    providers: string[];
    pageTypes: string[];
    courseNames: string[];
    certificateIds: string[];
    gradePercents: number[];
    nonces: Array<{ id: string; value: string }>;
  };
}

/** Detached receipt payload signed by the verifier. */
export interface GbvReceiptPayload {
  receiptId: string;
  sessionId: string;
  artifact: GbvVerificationArtifact;
  provider: string;
  merkleRoot: string;
  evidenceHash: string;
  issuedAt: string;
  protocolVersion: string;
}
