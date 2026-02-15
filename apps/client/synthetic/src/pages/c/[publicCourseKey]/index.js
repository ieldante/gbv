import AppShell from "@/ui/AppShell";
import CourseHero from "@/ui/CourseHero";
import ModulesList from "@/ui/ModulesList";
import ActivityPanel from "@/ui/ActivityPanel";
import { getCourseByKey, getSemanticAttrs, getSurfaceView } from "@/lib/data";

export default function CourseHome({ course }) {
  if (!course) {
    return (
      <AppShell title="Course" subtitle="Not found">
        <div className="rounded-2xl border border-slate-200/40 bg-white p-6 shadow-sm">
          Course not found.
        </div>
      </AppShell>
    );
  }

  const view = getSurfaceView(course, "course");

  return (
    <AppShell title="Course" slug={course.slug}>
      <div className="grid gap-6">
        <div hidden {...getSemanticAttrs(course, "course")} />
        <CourseHero course={course} view={view} active="overview" />

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="grid gap-6">
            <div className="rounded-2xl border border-slate-200/40 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold">Overview</div>
              <div className="mt-2 text-sm text-slate-600">
                Learn through short lessons, hands-on labs, and graded
                checkpoints. Your progress and scores update automatically.
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-blue-50 p-4">
                  <div className="text-xs text-blue-700">Progress</div>
                  <div className="mt-1 text-lg font-semibold text-blue-900">
                    {view.progressText}
                  </div>
                </div>
                <div className="rounded-2xl bg-sky-50 p-4">
                  <div className="text-xs text-sky-800">Grade</div>
                  <div className="mt-1 text-lg font-semibold text-sky-900">
                    {view.gradeText}
                  </div>
                </div>
                <div className="rounded-2xl bg-indigo-50 p-4">
                  <div className="text-xs text-indigo-800">Completed</div>
                  <div className="mt-1 text-lg font-semibold text-indigo-900">
                    {course.completedOn}
                  </div>
                </div>
              </div>
            </div>

            <ModulesList course={course} />
          </div>

          <div className="grid gap-6">
            <ActivityPanel course={course} />
            <div className="rounded-2xl border border-slate-200/40 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold">Upcoming</div>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <div className="rounded-xl bg-slate-50 p-3">
                  Finish the next checkpoint quiz
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  Review feedback on labs
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  Export your completion record
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export async function getServerSideProps(ctx) {
  const course = getCourseByKey(ctx.params.publicCourseKey);
  return { props: { course } };
}
