import Link from "next/link";

function Pill({ children }) {
  return (
    <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs text-white ring-1 ring-white/20">
      {children}
    </span>
  );
}

export default function CourseHero({ course, view = null, active = "overview" }) {
  const certificateId = view?.certificateId || course.certificateId;
  const progressText = view?.progressText || course.progressText;
  const gradeText = view?.gradeText || course.gradeText;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/40 bg-white shadow-sm">
      <div className="border border-slate-200/40-b bg-gradient-to-r from-blue-700 to-sky-500 px-6 py-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs text-white/80">{course.org}</div>
            <h1 className="mt-1 truncate text-2xl font-semibold">{course.title}</h1>
            <div
              slug={course.slug}
              id={course.platformCourseId}
              className="mt-3 flex flex-wrap gap-2"
            >
              <Pill>{course.description}</Pill>
              <Pill>{course.durationText}</Pill>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/certificate/${course.certificateId}`}
              className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              Certificate
            </Link>
            <Link
              href={`/proof/${course.certificateId}`}
              className="rounded-xl border border-slate-200/40 border border-slate-200/40-white/30 bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
            >
              Verify
            </Link>
          </div>
        </div>
      </div>

      <div className="px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              ["overview", "Overview", `/c/${course.publicCourseKey}`],
              ["modules", "Modules", null],
              [
                "assignments",
                "Assignments",
                `/c/${course.publicCourseKey}/assignments`,
              ],
              ["grades", "Grades", null],
              ["discussion", "Discussion", null],
            ].map(([k, label, url]) => (
              <div
                key={k}
                onClick={() => url && (window.location.href = url)}
                className={[
                  "rounded-xl px-3 py-2 text-sm border border-slate-200/40",
                  active === k
                    ? "border border-slate-200/40-blue-600 bg-blue-600 text-white"
                    : !url
                      ? "bg-black/5 text-black/10 cursor-not-allowed"
                      : "cursor-pointer border border-slate-200/40-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                ].join(" ")}
              >
                {label}
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200/40 bg-slate-50 px-3 py-2 text-xs text-slate-700">
            Progress: {progressText} | {gradeText} | Cert {certificateId}
          </div>
        </div>
      </div>
    </div>
  );
}

