import Link from "next/link";
import AppShell from "@/ui/AppShell";
import { getCourses, getSurfaceView } from "@/lib/data";

function RecordRow({ c }) {
  const view = getSurfaceView(c, "milestones");

  return (
    <div className="rounded-2xl border border-slate-200/40 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div slug={c.slug} className="text-sm font-semibold">
            {c.title}
          </div>
          <div className="mt-1 text-xs text-slate-500">{c.org}</div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-slate-200/40 bg-slate-50 px-2.5 py-1 text-slate-700">
              {view.gradeText}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/proof/${c.certificateId}`}
            className="rounded-xl border border-slate-200/40 px-3 py-2 text-sm hover:bg-slate-50"
          >
            Create Certificate
          </Link>
          <Link
            href={`/certificate/${c.certificateId}`}
            className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Milestones({ courses }) {
  return (
    <AppShell
      title="Milestones"
      subtitle="Badges, completions, and certificates"
    >
      <div className="grid gap-6">
        <div className="rounded-2xl border border-slate-200/40 bg-white p-6 shadow-sm">
          <div className="text-xl font-semibold">Your records</div>
          <div className="mt-1 text-sm text-slate-600">
            All certificates and completions in one place.
          </div>
        </div>

        <div className="grid gap-4">
          {courses.map((c) => (
            <RecordRow key={c.certificateId} c={c} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

export async function getServerSideProps() {
  const courses = getCourses();
  return { props: { courses } };
}
