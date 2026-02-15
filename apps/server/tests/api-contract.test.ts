import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";

import {
  buildSurfaceUrlsFromPlan,
  type GbvPageType,
  type GbvVerificationArtifact,
  verifyReceipt,
} from "@gbv/core";
import { gbvConfig } from "@gbv/config";
import { POST as initRoute } from "../src/app/api/gbv/init/route";
import { POST as submitRoute } from "../src/app/api/gbv/submit/route";
import { expireSessionNow, resetMemoryStore } from "../src/lib/store/memoryStore";

interface InitResponse {
  ok: boolean;
  sessionId: string;
  provider: string;
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

function buildPages(
  init: InitResponse,
  options: {
    gradePercent: number;
    moduleCount?: number;
    certificateIdOverrideByPage?: Record<string, string>;
  },
) {
  const urls = buildSurfaceUrlsFromPlan({
    origin: gbvConfig.origins.syntheticClient,
    pagePlan: init.pagePlan as GbvPageType[],
    templates: gbvConfig.demo.surfacePathTemplates,
    artifact: init.artifact,
  });

  return urls.map((url, index) => {
    const pageType = init.pagePlan[index];
    const certificateId =
      options.certificateIdOverrideByPage?.[pageType] ?? init.artifact.certificateId;

    return {
      url,
      injectedNonce: init.pageNonces[index],
      html: createSemanticHtml({
        pageType,
        nonce: init.pageNonces[index],
        url,
        gradePercent: options.gradePercent,
        moduleCount: options.moduleCount ?? 5,
        courseName: init.artifact.title || "Synthetic Course",
        courseKey: init.artifact.publicCourseKey,
        courseSlug: "synthetic-slug",
        certificateId,
        courseId: init.artifact.courseId,
      }),
    };
  });
}

describe("GBV API contract", () => {
  beforeEach(() => {
    resetMemoryStore();
  });

  test("POST /api/gbv/init returns a session and nonce plan", async () => {
    const result = await postJson(initRoute, "/api/gbv/init", {
      artifact: demoArtifact,
    });

    assert.equal(result.status, 200);
    assert.equal(result.json.ok, true);
    assert.ok(result.json.sessionId);
    assert.equal(result.json.pagePlan.length, result.json.pageNonces.length);
    assert.equal(result.json.artifact.publicCourseKey, demoArtifact.publicCourseKey);
  });

  test("POST /api/gbv/init rejects invalid artifact", async () => {
    const result = await postJson(initRoute, "/api/gbv/init", {
      artifact: {
        courseId: 42,
        publicCourseKey: "missing-certificate-id",
      },
    });

    assert.equal(result.status, 400);
    assert.equal(result.json.ok, false);
    assert.equal(result.json.code, "INVALID_ARTIFACT");
  });

  test("POST /api/gbv/submit accepts coherent evidence", async () => {
    const init = await postJson(initRoute, "/api/gbv/init", {
      artifact: demoArtifact,
    });

    const initJson = init.json as InitResponse;
    const submit = await postJson(submitRoute, "/api/gbv/submit", {
      sessionId: initJson.sessionId,
      courseId: demoArtifact.courseId,
      provider: "synthetic",
      pages: buildPages(initJson, { gradePercent: 100, moduleCount: 5 }),
    });

    assert.equal(submit.status, 200);
    assert.equal(submit.json.ok, true);
    assert.equal(submit.json.accepted, true);
    assert.ok(submit.json.receipt);
    assert.ok(submit.json.merkleRoot);
    const receiptPayload = verifyReceipt(submit.json.receipt, gbvConfig.protocol.receiptHmacSecret);
    assert.equal(receiptPayload.sessionId, initJson.sessionId);
    assert.equal(receiptPayload.artifact.publicCourseKey, demoArtifact.publicCourseKey);
    assert.equal(submit.json.verificationLog.structure.ok, true);
    assert.equal(submit.json.verificationLog.semantic.ok, true);
  });

  test("POST /api/gbv/submit rejects semantic contradiction", async () => {
    const init = await postJson(initRoute, "/api/gbv/init", {
      artifact: demoArtifact,
    });

    const initJson = init.json as InitResponse;
    const submit = await postJson(submitRoute, "/api/gbv/submit", {
      sessionId: initJson.sessionId,
      courseId: demoArtifact.courseId,
      provider: "synthetic",
      pages: buildPages(initJson, {
        gradePercent: 100,
        certificateIdOverrideByPage: {
          proof: `${demoArtifact.certificateId}-ALT`,
        },
      }),
    });

    assert.equal(submit.status, 400);
    assert.equal(submit.json.ok, false);
    assert.equal(submit.json.code, "SEMANTIC_VERIFICATION_FAILED");
    assert.equal(submit.json.meta.verificationLog.semantic.ok, false);
    assert.ok(Array.isArray(submit.json.meta.failedInvariantIds));
  });

  test("POST /api/gbv/submit rejects nonce mismatch", async () => {
    const init = await postJson(initRoute, "/api/gbv/init", {
      artifact: demoArtifact,
    });

    const initJson = init.json as InitResponse;
    const pages = buildPages(initJson, { gradePercent: 100, moduleCount: 5 });
    pages[0] = { ...pages[0], injectedNonce: "wrong-nonce" };

    const submit = await postJson(submitRoute, "/api/gbv/submit", {
      sessionId: initJson.sessionId,
      courseId: demoArtifact.courseId,
      provider: "synthetic",
      pages,
    });

    assert.equal(submit.status, 400);
    assert.equal(submit.json.ok, false);
    assert.equal(submit.json.code, "INJECTED_NONCE_MISMATCH");
  });

  test("POST /api/gbv/submit rejects expired session", async () => {
    const init = await postJson(initRoute, "/api/gbv/init", {
      artifact: demoArtifact,
    });

    const initJson = init.json as InitResponse;
    expireSessionNow(initJson.sessionId);

    const submit = await postJson(submitRoute, "/api/gbv/submit", {
      sessionId: initJson.sessionId,
      courseId: demoArtifact.courseId,
      provider: "synthetic",
      pages: buildPages(initJson, { gradePercent: 100, moduleCount: 5 }),
    });

    assert.equal(submit.status, 403);
    assert.equal(submit.json.ok, false);
    assert.equal(submit.json.code, "SESSION_EXPIRED");
  });
});
