import Link from "next/link";
import { getSurfaceView } from "@/lib/data";

function Badge({ children, tone = "blue" }) {
  const cls =
    tone === "blue"
      ? "bg-blue-50 text-blue-700 border border-slate-200/40-blue-100"
      : tone === "green"
      ? "bg-emerald-50 text-emerald-700 border border-slate-200/40-emerald-100"
      : "bg-slate-50 text-slate-700 border border-slate-200/40-slate-200";
  return (
    <span
      className={`rounded-full border border-slate-200/40 px-2.5 py-1 text-xs ${cls}`}
    >
      {children}
    </span>
  );
}

function ProgressBar({ percent }) {
  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div
        className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-sky-400"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export default function CourseCard({ c }) {
  const view = getSurfaceView(c, "hub");
  const pct = Math.max(0, Math.min(100, parseInt(view.progressText) || 0));
  const completed = pct >= 100;

  return (
    <div className="rounded-2xl border border-slate-200/40 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-slate-500">{c.org}</div>
          <div
            className="mt-1 truncate text-lg font-semibold"
            slug={c.slug}
            id={c.platformCourseId}
          >
            {c.title}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {completed ? (
              <Badge tone="green">Completed</Badge>
            ) : (
              <Badge>In progress</Badge>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>{view.progressText}</span>
              <span className="font-medium">{pct}%</span>
            </div>
            <ProgressBar percent={pct} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            className="rounded-xl border border-slate-200/40 px-3 py-2 text-sm hover:bg-slate-50"
            href={`/proof/${c.certificateId}`}
          >
            Verify
          </Link>
          <Link
            className="rounded-xl border border-slate-200/40 px-3 py-2 text-sm hover:bg-slate-50"
            href={`/c/${c.publicCourseKey}/assignments`}
          >
            Assignments
          </Link>
          <Link
            className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            href={`/c/${c.publicCourseKey}`}
          >
            Open
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Grade</div>
          <div className="mt-1 text-sm font-semibold">{view.gradeText}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Completed</div>
          <div className="mt-1 text-sm font-semibold">{c.completedOn}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Duration</div>
          <div className="mt-1 text-sm font-semibold">{c.durationText}</div>
        </div>
      </div>
    </div>
  );
}
