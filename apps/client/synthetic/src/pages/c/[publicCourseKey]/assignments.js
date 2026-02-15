import AppShell from "@/ui/AppShell";
import CourseHero from "@/ui/CourseHero";
import AssignmentsTable from "@/ui/AssignmentsTable";
import ActivityPanel from "@/ui/ActivityPanel";
import { getCourseByKey, getSemanticAttrs, getSurfaceView } from "@/lib/data";

export default function Assignments({ course }) {
  if (!course) {
    return (
      <AppShell title="Assignments" subtitle="Not found">
        <div className="rounded-2xl border border-slate-200/40 bg-white p-6 shadow-sm">
          Course not found.
        </div>
      </AppShell>
    );
  }

  const view = getSurfaceView(course, "assignments");

  return (
    <AppShell title="Assignments" slug={course.slug}>
      <div className="grid gap-6">
        <div hidden {...getSemanticAttrs(course, "assignments")} />
        <CourseHero course={course} view={view} active="assignments" />

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <AssignmentsTable course={course} view={view} />
          <ActivityPanel course={course} />
        </div>
      </div>
    </AppShell>
  );
}

export async function getServerSideProps(ctx) {
  const course = getCourseByKey(ctx.params.publicCourseKey);
  return { props: { course } };
}
