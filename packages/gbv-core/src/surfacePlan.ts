import type { GbvPageType, GbvVerificationArtifact } from "./types";

export type GbvSurfacePathTemplates = {
  hub: string;
  course: string;
  assignments: string;
  proof: string;
  certificate: string;
  milestones: string;
};

function applyArtifactTemplate(
  template: string,
  artifact: GbvVerificationArtifact,
): string {
  return template
    .replaceAll(":publicCourseKey", encodeURIComponent(artifact.publicCourseKey))
    .replaceAll(":certificateId", encodeURIComponent(artifact.certificateId))
    .replaceAll(":courseId", encodeURIComponent(String(artifact.courseId)));
}

function joinOriginAndPath(origin: string, path: string): string {
  const normalizedOrigin = origin.replace(/\/+$/g, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedOrigin}${normalizedPath}`;
}

/**
 * Build planned surface URLs from configured path templates and selected artifact metadata.
 */
export function buildSurfaceUrlsFromPlan({
  origin,
  pagePlan,
  templates,
  artifact,
}: {
  origin: string;
  pagePlan: GbvPageType[];
  templates: GbvSurfacePathTemplates;
  artifact: GbvVerificationArtifact;
}): string[] {
  return pagePlan.map((pageType) => {
    if (pageType === "unknown") {
      throw new Error("Cannot resolve URL template for unknown page type");
    }

    const pathTemplate = templates[pageType];
    if (!pathTemplate) {
      throw new Error(`Missing URL path template for page type '${pageType}'`);
    }

    const resolvedPath = applyArtifactTemplate(pathTemplate, artifact);
    return joinOriginAndPath(origin, resolvedPath);
  });
}
