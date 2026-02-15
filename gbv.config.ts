const debugEnabled =
  typeof process !== "undefined" &&
  (process.env.GBV_DEBUG === "1" || process.env.GBV_DEBUG === "true");

const gbvConfig = {
  versions: {
    protocol: "0.71",
    implementation: "1.0.0",
  },
  environment: {
    nodeMajor: 22,
    mode: "development",
    debug: debugEnabled,
  },
  ports: {
    server: 3001,
    syntheticClient: 3000,
  },
  origins: {
    server: "http://localhost:3001",
    syntheticClient: "http://localhost:3000",
  },
  protocol: {
    providerId: "synthetic",
    nonceLeafId: "data-gbv-nonce",
    sessionTtlMs: 60_000,
    maxPages: 10,
    maxHtmlChars: 2_000_000,
    minGradePercent: 60,
    receiptHmacSecret: "gbv-local-dev-secret",
  },
  demo: {
    pagePlan: [
      "hub",
      "course",
      "assignments",
      "proof",
      "certificate",
      "milestones",
    ],
    surfacePathTemplates: {
      hub: "/hub",
      course: "/c/:publicCourseKey",
      assignments: "/c/:publicCourseKey/assignments",
      proof: "/proof/:certificateId",
      certificate: "/certificate/:certificateId",
      milestones: "/milestones",
    },
    courseCatalogApiPath: "/api/gbv/courses",
    verifierBaselineCourseKey: "csk_7r2q9p",
    verifierAdversarialCourseKey: "csk_t1mix",
  },
  extension: {
    name: "GBV Client",
    version: "1.0.0",
    buildDir: "apps/extension/build",
    hostPermissions: ["http://localhost:3000/*", "http://localhost:3001/*"],
    contentScriptMatches: ["http://localhost:3000/*"],
    permissions: ["storage", "tabs", "scripting"],
  },
} as const;

export default gbvConfig;
