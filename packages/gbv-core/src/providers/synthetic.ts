import * as cheerio from "cheerio";
import type { GbvPageType } from "../types";

function normalize(input: string): string {
  return String(input || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function parsePercent(input: string): number | null {
  const match = String(input || "").match(/(\d+(?:\.\d+)?)\s*%/);
  if (!match) return null;
  const value = Number.parseFloat(match[1]);
  return Number.isFinite(value) ? value : null;
}

function pathOf(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return String(url || "").split("?")[0].split("#")[0];
  }
}

/** Synthetic provider implementation for GBV OSS demo. */
export const syntheticProvider = {
  id: "synthetic",

  detectPageType(url: string): GbvPageType {
    const normalized = String(url || "");
    if (normalized.includes("/hub")) return "hub";
    if (/\/c\/[^/]+\/assignments/.test(normalized)) return "assignments";
    if (/\/c\/[^/]+$/.test(normalized) || normalized.includes("/c/")) return "course";
    if (normalized.includes("/proof/")) return "proof";
    if (normalized.includes("/certificate/")) return "certificate";
    if (normalized.includes("/milestones")) return "milestones";
    return "unknown";
  },

  canonicalize({
    html,
    url,
    nonceLeafId,
  }: {
    html: string;
    url: string;
    nonceLeafId: string;
  }): string[] {
    const $ = cheerio.load(String(html || ""));
    const pageType = this.detectPageType(url);
    const leaves: string[] = [];

    leaves.push("provider:synthetic");
    leaves.push(`page:type:${pageType}`);
    leaves.push(`page:path:${pathOf(url)}`);

    const semanticNodes = $("[data-gbv-semantic='true']");
    semanticNodes.each((_, node) => {
      const element = $(node);
      const courseName = normalize(element.attr("data-gbv-course-name") || "");
      const courseId = String(element.attr("data-gbv-course-id") || "").trim();
      const courseKey = String(element.attr("data-gbv-course-key") || "").trim();
      const courseSlug = String(element.attr("data-gbv-course-slug") || "").trim();
      const certificateId = String(element.attr("data-gbv-certificate-id") || "").trim();
      const gradePercent = Number.parseFloat(
        String(element.attr("data-gbv-grade-percent") || "NaN"),
      );
      const progressPercent = Number.parseFloat(
        String(element.attr("data-gbv-progress-percent") || "NaN"),
      );
      const moduleCount = Number.parseFloat(
        String(element.attr("data-gbv-module-count") || "NaN"),
      );

      if (courseName) leaves.push(`course:name:${courseName}`);
      if (courseId) leaves.push(`course:id:${courseId}`);
      if (courseKey) leaves.push(`course:key:${courseKey}`);
      if (courseSlug) leaves.push(`course:slug:${courseSlug}`);
      if (certificateId) leaves.push(`certificate:id:${certificateId}`);
      if (Number.isFinite(gradePercent)) leaves.push(`course:grade:${gradePercent}%`);
      if (Number.isFinite(progressPercent)) {
        leaves.push(`course:progress:${progressPercent}%`);
      }
      if (Number.isFinite(moduleCount)) {
        leaves.push(`course:module-count:${moduleCount}`);
      }
    });

    // Fallback extraction is restricted to artifact-specific pages. Listing pages
    // (hub/milestones) intentionally omit semantic tags and must stay neutral.
    if (!semanticNodes.length && !["hub", "milestones"].includes(pageType)) {
      const title = normalize($("h1").first().text() || "");
      if (title) leaves.push(`course:name:${title}`);

      const gradeText = normalize($.text().match(/grade achieved:\s*\d+(?:\.\d+)?%/i)?.[0] || "");
      const gradePercent = parsePercent(gradeText);
      if (gradePercent !== null) leaves.push(`course:grade:${gradePercent}%`);
    }

    $(`meta[${nonceLeafId}]`).each((_, node) => {
      const nonceValue = String($(node).attr(nonceLeafId) || "").trim();
      if (nonceValue) {
        leaves.push(`nonce:id:${nonceLeafId}:value:${nonceValue}`);
      }
    });

    return [...new Set(leaves)].sort();
  },
};
