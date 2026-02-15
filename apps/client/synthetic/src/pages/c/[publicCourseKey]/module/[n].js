import AppShell from "@/ui/AppShell";
import CourseHero from "@/ui/CourseHero";
import ModulesList from "@/ui/ModulesList";
import { getCourseByKey, getSemanticAttrs } from "@/lib/data";

export default function Module({ course, n }) {
  if (!course) {
    return (
      <AppShell title="Module" subtitle="Not found">
        <div className="rounded-2xl border border-slate-200/40 bg-white p-6 shadow-sm">
          Course not found.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={`Module ${n}`} slug={course.slug}>
      <div className="grid gap-6">
        <div hidden {...getSemanticAttrs(course, "course")} />
        <CourseHero course={course} active="modules" />

        <div className="rounded-2xl border border-slate-200/40 bg-white p-6 shadow-sm">
          <div className="text-xs text-slate-500">Module {n}</div>
          <div className="mt-1 text-xl font-semibold">Lesson flow</div>
          <div className="mt-2 text-sm text-slate-600">
            This page simulates a real module view with structured content and
            consistent layout.
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-blue-50 p-4">
              <div className="text-xs text-blue-700">Recommended</div>
              <div className="mt-1 text-sm font-semibold text-blue-900">
                Finish the checkpoint quiz
              </div>
              <div className="mt-1 text-xs text-blue-700/80">
                Estimated time: 8 min
              </div>
            </div>
            <div className="rounded-2xl bg-sky-50 p-4">
              <div className="text-xs text-sky-800">Next up</div>
              <div className="mt-1 text-sm font-semibold text-sky-900">
                Review lab feedback
              </div>
              <div className="mt-1 text-xs text-sky-800/80">
                Estimated time: 6 min
              </div>
            </div>
          </div>
        </div>

        <ModulesList course={course} />
      </div>
    </AppShell>
  );
}

export async function getServerSideProps(ctx) {
  const course = getCourseByKey(ctx.params.publicCourseKey);
  return { props: { course, n: ctx.params.n } };
}
