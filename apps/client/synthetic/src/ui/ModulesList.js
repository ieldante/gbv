function Row({ idx, title, meta, done }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200/40 bg-white p-3 shadow-sm hover:bg-slate-50">
      <div
        className={[
          "h-8 w-8 rounded-lg flex items-center justify-center text-xs font-semibold",
          done ? "bg-emerald-600 text-white" : "bg-blue-50 text-blue-700",
        ].join(" ")}
      >
        {idx}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{title}</div>
        <div className="mt-0.5 text-xs text-slate-500">{meta}</div>
      </div>
      <div className="text-xs text-slate-500">{done ? "Done" : "Next"}</div>
    </div>
  );
}

export default function ModulesList({ course }) {
  const moduleTemplates = [
    ["Welcome and Setup", "Video | 6 min | checklist"],
    ["Core Concepts", "Reading | 12 min | notes"],
    ["Hands-on Lab", "Interactive | 25 min | graded"],
    ["Checkpoint Quiz", "Quiz | 10 questions | graded"],
    ["Wrap-up and Export", "Summary | share | proof"],
    ["Data Hygiene", "Lab | 15 min | graded"],
    ["Capstone Build", "Project | 30 min | graded"],
    ["Final Reflection", "Discussion | 10 min | ungraded"],
  ];

  const configuredCount = Number(course?.semanticProfile?.moduleCountByPage?.default || 5);
  const moduleCount = Math.max(1, Math.min(moduleTemplates.length, configuredCount));
  const modules = moduleTemplates.slice(0, moduleCount);

  const seed = course.platformCourseId.charCodeAt(0) % modules.length;

  return (
    <div className="rounded-2xl border border-slate-200/40 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Modules</div>
          <div className="mt-1 text-xs text-slate-500">
            Structured lessons with realistic rows
          </div>
        </div>
        <div className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
          Count: {moduleCount}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {modules.map(([title, meta], index) => (
          <Row key={title} idx={index + 1} title={title} meta={meta} done={index <= seed} />
        ))}
      </div>
    </div>
  );
}
