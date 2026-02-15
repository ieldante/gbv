import Link from "next/link";
import AppShell from "@/ui/AppShell";
import { getCourseByCert, getCourses, getSemanticAttrs, getSurfaceView } from "@/lib/data";

function OtherCertificates({ currentCert, courses }) {
  const others = courses.filter((course) => course.certificateId !== currentCert).slice(0, 3);

  return (
    <div className="rounded-2xl border border-slate-200/40 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Other certificates</div>
          <div className="mt-1 text-xs text-slate-500">Multiple artifacts are available.</div>
        </div>
        <Link href="/milestones" className="text-sm font-medium text-green-700 hover:text-green-800">
          All
        </Link>
      </div>

      <div className="mt-4 space-y-2">
        {others.map((course) => (
          <Link
            key={course.certificateId}
            href={`/certificate/${course.certificateId}`}
            className="block rounded-xl border border-slate-200/40 bg-white p-3 hover:bg-slate-50"
          >
            <div className="text-sm font-medium">{course.title}</div>
            <div className="mt-0.5 text-xs text-slate-500">{course.org}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function CertificatePage({ certificateId, course, courses }) {
  if (!course) {
    return (
      <AppShell title="Certificate" subtitle="Not found">
        <div className="rounded-2xl border border-slate-200/40 bg-white p-6 shadow-sm">
          <div className="text-xl font-semibold">Certificate not found</div>
          <div className="mt-2 text-sm text-slate-600">
            No certificate exists for ID <span className="font-medium">{certificateId}</span>.
          </div>
          <div className="mt-5 flex gap-2">
            <Link href="/milestones" className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
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

  const view = getSurfaceView(course, "certificate");

  return (
    <AppShell title="Certificate" subtitle={`Viewer | ${view.certificateId}`}>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div hidden {...getSemanticAttrs(course, "certificate")} />

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/40 bg-white shadow-sm">
          <div className="border border-slate-200/40-b bg-gradient-to-r from-green-700 to-green-500 px-6 py-6 text-white">
            <div className="text-xs text-white/80">{course.org}</div>
            <div className="mt-1 text-2xl font-semibold">Certificate of Completion</div>
            <div className="mt-2 text-sm text-white/90">
              This document certifies successful completion of the observed course.
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200/40 bg-gradient-to-br from-slate-50 to-white p-6">
              <div className="text-xs text-slate-500">Awarded for</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">{course.title}</div>
              <div className="mt-2 text-sm text-slate-600">
                Completion date: <span className="font-medium">{course.completedOn}</span>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <div className="text-xs text-slate-500">Certificate ID</div>
                  <div className="mt-1 font-mono text-sm font-semibold">{view.certificateId}</div>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <div className="text-xs text-slate-500">Result</div>
                  <div className="mt-1 text-sm font-semibold">{view.gradeText}</div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <button className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                  Download
                </button>
                <button className="rounded-xl border border-slate-200/40 px-4 py-2 text-sm hover:bg-slate-50">
                  Print
                </button>
                <Link href={`/proof/${course.certificateId}`} className="rounded-xl border border-slate-200/40 px-4 py-2 text-sm hover:bg-slate-50">
                  Verify
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-2xl border border-slate-200/40 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold">Quick links</div>
            <div className="mt-3 grid gap-2">
              <Link href={`/proof/${course.certificateId}`} className="rounded-xl border border-slate-200/40 px-3 py-2 text-sm hover:bg-slate-50">
                Verify record
              </Link>
              <Link href={`/c/${course.publicCourseKey}`} className="rounded-xl border border-slate-200/40 px-3 py-2 text-sm hover:bg-slate-50">
                Open course
              </Link>
              <Link href="/milestones" className="rounded-xl border border-slate-200/40 px-3 py-2 text-sm hover:bg-slate-50">
                Milestones
              </Link>
              <Link href="/hub" className="rounded-xl bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700">
                Hub
              </Link>
            </div>
          </div>

          <OtherCertificates currentCert={course.certificateId} courses={courses} />
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
