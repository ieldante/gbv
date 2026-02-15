import Link from "next/link";
import AppShell from "@/ui/AppShell";
import { getCourseByCert, getCourses, getSemanticAttrs, getSurfaceView } from "@/lib/data";

function SimilarCourses({ currentCert, courses }) {
  const others = courses.filter((course) => course.certificateId !== currentCert).slice(0, 3);

  return (
    <div className="rounded-2xl border border-slate-200/40 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Other records</div>
          <div className="mt-1 text-xs text-slate-500">Additional artifacts from the same platform.</div>
        </div>
        <Link href="/milestones" className="text-sm font-medium text-gray-700 hover:text-gray-800">
          View all
        </Link>
      </div>

      <div className="mt-4 space-y-2">
        {others.map((course) => (
          <Link
            key={course.certificateId}
            href={`/proof/${course.certificateId}`}
            className="block rounded-xl border border-slate-200/40 bg-white p-3 hover:bg-slate-50"
          >
            <div className="text-sm font-medium">{course.title}</div>
            <div className="mt-0.5 text-xs text-slate-500">
              {course.org} | cert {course.certificateId}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function ProofPage({ certificateId, course, courses }) {
  if (!course) {
    return (
      <AppShell title="Verify" subtitle="Record not found">
        <div className="rounded-2xl border border-slate-200/40 bg-white p-6 shadow-sm">
          <div className="text-xl font-semibold">Record not found</div>
          <div className="mt-2 text-sm text-slate-600">
            We could not find a certificate with ID <span className="font-medium">{certificateId}</span>.
          </div>
          <div className="mt-5 flex gap-2">
            <Link href="/milestones" className="rounded-xl bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
              Go to Milestones
            </Link>
            <Link href="/hub" className="rounded-xl border border-slate-200/40 px-4 py-2 text-sm hover:bg-slate-50">
              Back to Hub
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const view = getSurfaceView(course, "proof");

  return (
    <AppShell title="Verify" subtitle={`Certificate ${view.certificateId}`}>
      <div className="grid gap-6">
        <div hidden {...getSemanticAttrs(course, "proof")} />

        <div className="overflow-hidden rounded-2xl border border-slate-200/40 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-gray-700 to-gray-500 px-6 py-6 text-white">
            <div className="text-xs text-white/80">{course.org}</div>
            <div className="mt-1 truncate text-2xl font-semibold">Verification</div>
            <div className="mt-2 text-sm text-white/90">
              This surface confirms that the observed artifact data is coherent.
            </div>
          </div>

          <div className="px-6 py-5">
            <div hidden {...getSemanticAttrs(course, "proof")} />
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Course</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{course.title}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Grade</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{view.gradeText}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Completed</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{course.completedOn}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Certificate ID</div>
                <div className="mt-1 font-mono text-sm font-semibold">{view.certificateId}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="rounded-2xl border border-slate-200/40 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold">Record details</div>
            <div className="mt-2 text-sm text-slate-600">
              This synthetic page intentionally mirrors what a real provider would expose.
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Slug</div>
                <div className="mt-1 text-sm font-semibold">{course.slug}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Platform Course ID</div>
                <div className="mt-1 font-mono text-sm font-semibold">{course.platformCourseId}</div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Link href="/milestones" className="rounded-xl bg-gray-600 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700">
                Open milestones
              </Link>
              <Link href={`/c/${course.publicCourseKey}`} className="rounded-xl border border-slate-200/40 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Open course
              </Link>
              <Link href={`/certificate/${course.certificateId}`} className="rounded-xl border border-slate-200/40 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Certificate
              </Link>
            </div>
          </div>

          <SimilarCourses currentCert={course.certificateId} courses={courses} />
        </div>
      </div>
    </AppShell>
  );
}

export async function getServerSideProps(ctx) {
  const certificateId = ctx.params.certificateId;
  const course = getCourseByCert(certificateId);
  const courses = getCourses();
  return { props: { certificateId, course, courses } };
}
