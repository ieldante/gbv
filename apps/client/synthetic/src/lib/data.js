const BASE_COURSES = [
  {
    courseId: 101,
    publicCourseKey: "csk_7r2q9p",
    slug: "introduction-microsoft-excel",
    platformCourseId: "KDNGIJBDG",
    certificateId: "O04CRAKZMLZJ",
    title: "Getting Started with Microsoft Excel",
    description:
      "Learn the basics of Microsoft Excel, including formulas, functions, and data visualization.",
    org: "Synthetic",
    progressText: "100% complete",
    gradeText: "Grade Achieved: 100%",
    completedOn: "November 2 2025",
    durationText: "1 hours approximately",
    hasLinkedIn: true,
    semanticProfile: {
      moduleCountByPage: {
        default: 5,
      },
    },
  },
  {
    courseId: 202,
    publicCourseKey: "csk_0a81lm",
    slug: "data-structures-foundations",
    platformCourseId: "PZ91KQ2RM",
    certificateId: "744DP2JRWJDS",
    title: "Data Structures Foundations",
    description:
      "Understand the fundamental concepts of data structures, including arrays, linked lists, and trees.",
    org: "Synthetic",
    progressText: "88% complete",
    gradeText: "Grade Achieved: 96%",
    completedOn: "October 14 2025",
    durationText: "18 hours approximately",
    hasLinkedIn: false,
    semanticProfile: {
      moduleCountByPage: {
        default: 6,
        assignments: 4,
      },
    },
  },
  {
    courseId: 303,
    publicCourseKey: "csk_3z19tt",
    slug: "applied-ml-systems",
    platformCourseId: "QW0N9X8AA",
    certificateId: "C9T-81F2Z0G1",
    title: "Applied ML Systems",
    description: "Explore the application of machine learning techniques in real-world systems.",
    org: "Synthetic",
    progressText: "91% complete",
    gradeText: "Grade Achieved: 94%",
    completedOn: "September 8 2025",
    durationText: "24 hours approximately",
    hasLinkedIn: true,
    semanticProfile: {
      moduleCountByPage: {
        default: 7,
      },
      certificateIdByPage: {
        default: "C9T-81F2Z0G1",
        proof: "C9T-81F2Z0G1-ALT",
      },
    },
  },
  {
    courseId: 404,
    publicCourseKey: "csk_t1mix",
    slug: "secure-evidence-practicum",
    platformCourseId: "MIXTIER1A",
    certificateId: "MIX-7Q1Z-442K",
    title: "Secure Evidence Practicum",
    description:
      "Practice artifact consistency analysis across provider surfaces and verification checkpoints.",
    org: "Synthetic",
    progressText: "100% complete",
    gradeText: "Grade Achieved: 100%",
    completedOn: "January 9 2026",
    durationText: "12 hours approximately",
    hasLinkedIn: false,
    semanticProfile: {
      moduleCountByPage: {
        default: 6,
        assignments: 4,
      },
      certificateIdByPage: {
        default: "MIX-7Q1Z-442K",
        proof: "MIX-7Q1Z-442K-PROOF",
      },
      gradePercentByPage: {
        default: 100,
        assignments: 50,
      },
      progressPercentByPage: {
        default: 100,
        assignments: 52,
      },
      courseKeyByPage: {
        default: "csk_t1mix",
        assignments: "csk_t1mix-shadow",
      },
    },
  },
];

function parsePercent(text) {
  const match = String(text || "").match(/(\d+(?:\.\d+)?)\s*%/);
  return match ? Number.parseFloat(match[1]) : null;
}

function cloneCourse(course) {
  return JSON.parse(JSON.stringify(course));
}

function formatPercentValue(value) {
  if (!Number.isFinite(value)) return "";
  return Number.isInteger(value) ? String(value) : String(Number(value).toFixed(1));
}

function formatGradeText(percent, fallback) {
  const normalized = formatPercentValue(percent);
  return normalized ? `Grade Achieved: ${normalized}%` : String(fallback || "");
}

function formatProgressText(percent, fallback) {
  const normalized = formatPercentValue(percent);
  return normalized ? `${normalized}% complete` : String(fallback || "");
}

function resolveByPage(course, pageType, key, fallback) {
  const byPage = course?.semanticProfile?.[key] || {};
  return byPage[pageType] ?? byPage.default ?? fallback;
}

function resolveGradePercent(course, pageType) {
  const fallback = parsePercent(course?.gradeText);
  const resolved = resolveByPage(course, pageType, "gradePercentByPage", fallback);
  return Number.isFinite(resolved) ? Number(resolved) : fallback;
}

function resolveProgressPercent(course, pageType) {
  const fallback = parsePercent(course?.progressText);
  const resolved = resolveByPage(course, pageType, "progressPercentByPage", fallback);
  return Number.isFinite(resolved) ? Number(resolved) : fallback;
}

function resolveModuleCount(course, pageType) {
  const resolved = resolveByPage(course, pageType, "moduleCountByPage", null);
  return Number.isFinite(resolved) ? Number(resolved) : null;
}

function resolveCertificateId(course, pageType) {
  return String(
    resolveByPage(course, pageType, "certificateIdByPage", course?.certificateId || ""),
  );
}

function resolveCourseKey(course, pageType) {
  return String(resolveByPage(course, pageType, "courseKeyByPage", course?.publicCourseKey || ""));
}

function resolveCourseName(course, pageType) {
  return String(resolveByPage(course, pageType, "courseNameByPage", course?.title || ""));
}

function resolveCourseSlug(course, pageType) {
  return String(resolveByPage(course, pageType, "courseSlugByPage", course?.slug || ""));
}

export function getSurfaceView(course, pageType) {
  const gradePercent = resolveGradePercent(course, pageType);
  const progressPercent = resolveProgressPercent(course, pageType);
  const moduleCount = resolveModuleCount(course, pageType);
  const certificateId = resolveCertificateId(course, pageType);
  const courseKey = resolveCourseKey(course, pageType);
  const courseName = resolveCourseName(course, pageType);
  const courseSlug = resolveCourseSlug(course, pageType);

  return {
    gradePercent,
    progressPercent,
    moduleCount,
    certificateId,
    courseKey,
    courseName,
    courseSlug,
    gradeText: formatGradeText(gradePercent, course?.gradeText),
    progressText: formatProgressText(progressPercent, course?.progressText),
  };
}

export function getCourses() {
  return BASE_COURSES.map(cloneCourse);
}

export function getCourseByCert(certificateId) {
  return getCourses().find((course) => course.certificateId === certificateId) || null;
}

export function getCourseByKey(publicCourseKey) {
  return getCourses().find((course) => course.publicCourseKey === publicCourseKey) || null;
}

export function getCourseCatalog() {
  return getCourses().map((course) => ({
    courseId: course.courseId,
    publicCourseKey: course.publicCourseKey,
    certificateId: course.certificateId,
    title: course.title,
    slug: course.slug,
  }));
}

export function getSemanticAttrs(course, pageType) {
  const view = getSurfaceView(course, pageType);

  return {
    "data-gbv-semantic": "true",
    "data-gbv-course-id": String(course?.courseId || ""),
    "data-gbv-course-name": view.courseName,
    "data-gbv-course-key": view.courseKey,
    "data-gbv-course-slug": view.courseSlug,
    "data-gbv-certificate-id": view.certificateId,
    "data-gbv-grade-percent": view.gradePercent ?? "",
    "data-gbv-progress-percent": view.progressPercent ?? "",
    "data-gbv-module-count": view.moduleCount ?? "",
  };
}
