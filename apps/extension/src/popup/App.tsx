import { useEffect, useMemo, useState } from "react";
import { gbvConfig } from "@gbv/config";
import type { GbvCourseOption, RunFlowResponse, RunFlowResult } from "../lib/messages";
import { normalizeVerifierResult, type NormalizedVerifierResult } from "./normalizeVerifierResult";

type CatalogResponse =
  | {
      ok: true;
      courses: GbvCourseOption[];
    }
  | {
      ok: false;
      error: string;
    };

function useCourseCatalog() {
  const [courses, setCourses] = useState<GbvCourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${gbvConfig.origins.syntheticClient}${gbvConfig.demo.courseCatalogApiPath}`,
        );
        const json = (await response.json()) as CatalogResponse;

        if (!response.ok || !json.ok) {
          throw new Error((json as { error?: string }).error || "Failed to fetch courses");
        }
        if (!Array.isArray(json.courses) || !json.courses.length) {
          throw new Error("No courses were returned from synthetic catalog");
        }

        if (!cancelled) {
          setCourses(json.courses);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(String((fetchError as Error)?.message || fetchError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { courses, loading, error };
}

function toText(value: unknown): string {
  if (value === undefined || value === null) return "-";
  return String(value);
}

function metricCard(label: string, value: string, tone = "#0f172a") {
  return (
    <div
      key={label}
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        padding: 8,
        background: "#f8fafc",
      }}
    >
      <div style={{ fontSize: 11, color: "#64748b" }}>{label}</div>
      <div style={{ marginTop: 4, fontSize: 12, fontWeight: 700, color: tone }}>{value}</div>
    </div>
  );
}

function section(title: string, rows: Array<{ label: string; value: string }>) {
  return (
    <section
      key={title}
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        padding: 10,
        background: "#ffffff",
        marginTop: 10,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{title}</div>
      <div style={{ display: "grid", gap: 6 }}>
        {rows.map((row) => (
          <div
            key={`${title}-${row.label}`}
            style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: 8 }}
          >
            <div style={{ fontSize: 11, color: "#64748b" }}>{row.label}</div>
            <div style={{ fontSize: 12, color: "#0f172a", wordBreak: "break-word" }}>
              {row.value}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function commitDisplayValue(normalized: NormalizedVerifierResult, value: unknown): string {
  if (normalized.commitStageExecuted) {
    return toText(value);
  }
  return `Not executed (run terminated at ${normalized.terminationStage})`;
}

function formatCourseOptionLabel(course: GbvCourseOption): string {
  const key = String(course.publicCourseKey || "").trim();
  return key || "Unnamed course";
}

export default function App() {
  const { courses, loading, error: catalogError } = useCourseCatalog();
  const [selectedCourseKey, setSelectedCourseKey] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunFlowResult | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!selectedCourseKey && courses.length > 0) {
      setSelectedCourseKey(courses[0].publicCourseKey);
    }
  }, [courses, selectedCourseKey]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.publicCourseKey === selectedCourseKey) || null,
    [courses, selectedCourseKey],
  );

  const normalized = useMemo(
    () => (result ? normalizeVerifierResult(result) : null),
    [result],
  );

  const runFlow = () => {
    if (!selectedCourse) return;

    setRunning(true);
    setError("");
    setResult(null);

    chrome.runtime.sendMessage(
      { type: "GBV_RUN_FLOW", artifact: selectedCourse },
      (response: RunFlowResponse) => {
        setRunning(false);

        if (chrome.runtime.lastError) {
          setError(chrome.runtime.lastError.message ?? "Chrome runtime error");
          return;
        }

        if (!response?.ok) {
          setError(response?.error || "Unknown extension error");
          return;
        }

        setResult(response.result);
      },
    );
  };

  const resolvedError = error || catalogError;
  const decisionState = !normalized
    ? ""
    : normalized.httpStatus === 200
      ? "Verified"
      : normalized.terminationStage === "semantic"
        ? "Mismatch"
        : "Error";
  const decisionTone =
    decisionState === "Verified" ? "#166534" : decisionState === "Mismatch" ? "#991b1b" : "#9a3412";

  return (
    <main style={{ width: 420, padding: 16, fontFamily: "Segoe UI, Arial, sans-serif", background: "#f8fafc" }}>
      <h1 style={{ margin: "0 0 12px", fontSize: 18 }}>GBV Verifier Inspector</h1>

      <label style={{ display: "block", marginBottom: 8 }}>Course Artifact</label>
      <select
        value={selectedCourseKey}
        disabled={loading || !courses.length}
        onChange={(event) => setSelectedCourseKey(event.target.value)}
        style={{ width: "100%", marginBottom: 12, padding: 8 }}
      >
        {courses.map((course) => (
          <option key={course.publicCourseKey} value={course.publicCourseKey}>
            {formatCourseOptionLabel(course)}
          </option>
        ))}
      </select>

      <button
        onClick={runFlow}
        disabled={running || loading || !selectedCourse}
        style={{ width: "100%", padding: 10, fontWeight: 700 }}
      >
        {running ? "Running GBV flow..." : "Verify Selected Artifact"}
      </button>

      {resolvedError ? (
        <pre
          style={{
            marginTop: 12,
            padding: 12,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            fontSize: 12,
            whiteSpace: "pre-wrap",
          }}
        >
          {resolvedError}
        </pre>
      ) : null}

      {normalized ? (
        <div style={{ marginTop: 12 }}>
          <section
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              background: "#ffffff",
              padding: 10,
            }}
          >
            <div style={{ fontSize: 11, color: "#64748b" }}>Verification Summary</div>
            <div style={{ marginTop: 6, fontSize: 17, fontWeight: 700, color: decisionTone }}>
              {decisionState}
            </div>
            <div style={{ marginTop: 10, display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
              {metricCard("HTTP Status", toText(normalized.httpStatus))}
              {metricCard("Decision Code", normalized.decisionCode)}
              {metricCard("Score", toText(normalized.score))}
              {metricCard("Execution", `${toText(normalized.durationMs)} ms`)}
              {metricCard("Session ID", normalized.sessionId)}
              {metricCard("Request ID", normalized.requestId)}
            </div>
          </section>

          {section("Challenge / Session", [
            { label: "Artifact Key", value: normalized.artifact.publicCourseKey },
            { label: "Course ID", value: toText(normalized.artifact.courseId) },
            { label: "Session ID", value: normalized.sessionId },
            { label: "Request ID", value: normalized.requestId },
            { label: "Started", value: normalized.startedAt },
            { label: "Finished", value: normalized.finishedAt },
            { label: "Termination Stage", value: normalized.terminationStage },
          ])}

          {section("Pipeline Stages", [
            {
              label: "Parse",
              value: `${normalized.stages.parse.executed} (${toText(normalized.stages.parse.durationMs)} ms)`,
            },
            {
              label: "Canonicalize",
              value: `${normalized.stages.canonicalize.executed} (${toText(normalized.stages.canonicalize.durationMs)} ms)`,
            },
            {
              label: "Structure",
              value: `${normalized.stages.structure.executed} (${toText(normalized.stages.structure.durationMs)} ms)`,
            },
            {
              label: "Semantic",
              value: `${normalized.stages.semantic.executed} (${toText(normalized.stages.semantic.durationMs)} ms)`,
            },
            {
              label: "Commit",
              value: `${normalized.stages.commit.executed} (${toText(normalized.stages.commit.durationMs)} ms)`,
            },
          ])}

          {section("Evidence / Commitments", [
            { label: "Observation Count", value: toText(normalized.observationCount) },
            { label: "Canonical Leaf Count", value: toText(normalized.canonicalLeafCount) },
            { label: "Evidence Hash", value: commitDisplayValue(normalized, normalized.evidenceHash) },
            { label: "Merkle Root", value: commitDisplayValue(normalized, normalized.merkleRoot) },
            { label: "Receipt ID", value: commitDisplayValue(normalized, normalized.receiptId) },
          ])}

          {section("Semantic Findings", [
            { label: "Semantic Executed", value: toText(normalized.semantic.executed) },
            { label: "Semantic OK", value: toText(normalized.semantic.ok) },
            { label: "Score", value: toText(normalized.semantic.score) },
            { label: "Result Code", value: normalized.decisionCode },
            {
              label: "Failed Checks",
              value:
                normalized.semantic.failedInvariantIds.length > 0
                  ? normalized.semantic.failedInvariantIds.join(" | ")
                  : "-",
            },
            {
              label: "Semantic Errors",
              value:
                normalized.semantic.findings.errors.length > 0
                  ? normalized.semantic.findings.errors.join(" | ")
                  : "-",
            },
          ])}

          {section("Receipt / Protocol Metadata", [
            { label: "Provider", value: toText(normalized.provider) },
            { label: "Verified At", value: commitDisplayValue(normalized, normalized.verifiedAt) },
            { label: "Challenge Nonce", value: toText(normalized.challengeNonce) },
            { label: "Protocol Version", value: toText(normalized.protocolVersion) },
            { label: "Receipt Token", value: commitDisplayValue(normalized, normalized.receipt) },
          ])}

          <details
            style={{
              marginTop: 10,
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              background: "#ffffff",
              padding: 10,
            }}
          >
            <summary style={{ cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
              Raw Response (verbatim server payload)
            </summary>
            <pre
              style={{
                marginTop: 8,
                padding: 10,
                background: "#0f172a",
                color: "#e2e8f0",
                borderRadius: 6,
                fontSize: 11,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {JSON.stringify(normalized.rawResponse, null, 2)}
            </pre>
          </details>
        </div>
      ) : null}
    </main>
  );
}
