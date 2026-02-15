import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";
import { buildSurfaceUrlsFromPlan, type GbvPageType, type GbvVerificationArtifact } from "@gbv/core";
import { gbvConfig } from "@gbv/config";
import { POST as initRoute } from "../src/app/api/gbv/init/route";
import { POST as submitRoute } from "../src/app/api/gbv/submit/route";
import { resetMemoryStore } from "../src/lib/store/memoryStore";

interface InitResponse {
  ok: boolean;
  sessionId: string;
  artifact: GbvVerificationArtifact;
  pagePlan: string[];
  pageNonces: string[];
}

const demoArtifact: GbvVerificationArtifact = {
  courseId: 101,
  publicCourseKey: "csk_7r2q9p",
  certificateId: "O04CRAKZMLZJ",
  title: "Getting Started with Microsoft Excel",
};

async function postJson(
  handler: (req: Request) => Promise<Response>,
  path: string,
  body: unknown,
): Promise<{ status: number; json: any }> {
  const req = new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const res = await handler(req);
  return {
    status: res.status,
    json: await res.json(),
  };
}

function createSemanticHtml(params: {
  pageType: string;
  nonce: string;
  url: string;
  gradePercent: number;
  moduleCount: number;
  courseName: string;
  courseKey: string;
  courseSlug: string;
  certificateId: string;
  courseId: number;
}): string {
  return `
<!doctype html>
<html>
  <head>
    <meta data-gbv-nonce="${params.nonce}" />
    <title>${params.pageType}</title>
  </head>
  <body>
    <div data-gbv-semantic="true"
      data-gbv-course-id="${params.courseId}"
      data-gbv-course-name="${params.courseName}"
      data-gbv-course-key="${params.courseKey}"
      data-gbv-course-slug="${params.courseSlug}"
      data-gbv-certificate-id="${params.certificateId}"
      data-gbv-progress-percent="100"
      data-gbv-grade-percent="${params.gradePercent}"
      data-gbv-module-count="${params.moduleCount}">
    </div>
    <h1>${params.pageType}</h1>
    <p>Grade Achieved: ${params.gradePercent}%</p>
    <p>URL: ${params.url}</p>
  </body>
</html>`;
}

function buildPages(init: InitResponse, gradePercent: number, moduleCount = 5) {
  const urls = buildSurfaceUrlsFromPlan({
    origin: gbvConfig.origins.syntheticClient,
    pagePlan: init.pagePlan as GbvPageType[],
    templates: gbvConfig.demo.surfacePathTemplates,
    artifact: init.artifact,
  });

  return urls.map((url, index) => ({
    url,
    injectedNonce: init.pageNonces[index],
    html: createSemanticHtml({
      pageType: init.pagePlan[index],
      nonce: init.pageNonces[index],
      url,
      gradePercent,
      moduleCount,
      courseName: init.artifact.title || "Synthetic Course",
      courseKey: init.artifact.publicCourseKey,
      courseSlug: "synthetic-slug",
      certificateId: init.artifact.certificateId,
      courseId: init.artifact.courseId,
    }),
  }));
}

describe("GBV attack regression", () => {
  beforeEach(() => {
    resetMemoryStore();
  });

  test("rejects mixed-grade tampering attack with multiple mutated leaves", async () => {
    const init = await postJson(initRoute, "/api/gbv/init", {
      artifact: demoArtifact,
    });
    const initJson = init.json as InitResponse;
    const pages = buildPages(initJson, 100, 5);

    const assignmentsIndex = initJson.pagePlan.indexOf("assignments");
    const proofIndex = initJson.pagePlan.indexOf("proof");
    assert.notEqual(assignmentsIndex, -1);
    assert.notEqual(proofIndex, -1);

    pages[assignmentsIndex] = {
      ...pages[assignmentsIndex],
      html: createSemanticHtml({
        pageType: "assignments",
        nonce: initJson.pageNonces[assignmentsIndex],
        url: pages[assignmentsIndex].url,
        gradePercent: 50,
        moduleCount: 9,
        courseName: initJson.artifact.title || "Synthetic Course",
        courseKey: `${initJson.artifact.publicCourseKey}-tampered`,
        courseSlug: "synthetic-slug",
        certificateId: initJson.artifact.certificateId,
        courseId: initJson.artifact.courseId,
      }),
    };

    pages[proofIndex] = {
      ...pages[proofIndex],
      html: createSemanticHtml({
        pageType: "proof",
        nonce: initJson.pageNonces[proofIndex],
        url: pages[proofIndex].url,
        gradePercent: 100,
        moduleCount: 5,
        courseName: initJson.artifact.title || "Synthetic Course",
        courseKey: initJson.artifact.publicCourseKey,
        courseSlug: "synthetic-slug",
        certificateId: `${initJson.artifact.certificateId}-ALT`,
        courseId: initJson.artifact.courseId,
      }),
    };

    const submit = await postJson(submitRoute, "/api/gbv/submit", {
      sessionId: initJson.sessionId,
      courseId: initJson.artifact.courseId,
      provider: "synthetic",
      pages,
    });

    assert.equal(submit.status, 400);
    assert.equal(submit.json.ok, false);
    assert.equal(submit.json.code, "SEMANTIC_VERIFICATION_FAILED");
    assert.ok(Array.isArray(submit.json.meta.failedInvariantIds));

    const invariants = submit.json.meta.verificationLog.semantic.invariants as Array<{
      id: string;
      status: "pass" | "fail" | "warn";
    }>;
    const failedIds = invariants
      .filter((invariant) => invariant.status === "fail")
      .map((invariant) => invariant.id);

    assert.ok(failedIds.includes("grade_threshold"));
    assert.ok(failedIds.includes("module_count_consistency"));
    assert.ok(failedIds.includes("course_key_consistency"));
    assert.ok(failedIds.includes("certificate_id_consistency"));
    assert.ok(submit.json.meta.failedInvariantIds.includes("grade_threshold"));
    assert.ok(submit.json.meta.failedInvariantIds.includes("course_key_consistency"));
  });
});
