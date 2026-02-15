import AppShell from "@/ui/AppShell";
import CourseCard from "@/ui/CourseCard";
import { getCourses } from "@/lib/data";

export default function Hub({ courses }) {
  return (
    <AppShell title="Hub" subtitle="Your courses and progress">
      <div className="grid gap-6">
        <div className="rounded-2xl border border-slate-200/40 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xl font-semibold">Welcome back</div>
              <div className="mt-1 text-sm text-slate-600">
                Pick up where you left off.
              </div>
            </div>
            <div className="flex gap-2">
              <select className="rounded-xl border border-slate-200/40 px-3 py-2 text-sm">
                <option>All</option>
                <option>Completed</option>
                <option>In progress</option>
              </select>
              <button className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Explore
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-blue-50 p-4">
              <div className="text-xs text-blue-700">Courses</div>
              <div className="mt-1 text-2xl font-semibold text-blue-900">
                {courses.length}
              </div>
              <div className="mt-1 text-xs text-blue-700/80">
                In this workspace
              </div>
            </div>
            <div className="rounded-2xl bg-sky-50 p-4">
              <div className="text-xs text-sky-800">Streak</div>
              <div className="mt-1 text-2xl font-semibold text-sky-900">
                5 days
              </div>
              <div className="mt-1 text-xs text-sky-800/80">Keep it going</div>
            </div>
            <div className="rounded-2xl bg-indigo-50 p-4">
              <div className="text-xs text-indigo-800">Next milestone</div>
              <div className="mt-1 text-2xl font-semibold text-indigo-900">
                2 modules
              </div>
              <div className="mt-1 text-xs text-indigo-800/80">
                Until your next badge
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {courses.map((c) => (
            <CourseCard key={c.certificateId} c={c} />
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
