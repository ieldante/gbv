export default function ActivityPanel({ course }) {
  const items = [
    [
      "Checkpoint completed",
      "Graded checkpoint recorded",
      "2 hours ago",
      "blue",
    ],
    ["Practice set", "New practice questions available", "yesterday", "sky"],
    ["Module progress", "Lesson items updated", "2 days ago", "indigo"],
    [
      "Sharing",
      course.hasLinkedIn ? "Sharing enabled" : "Sharing unavailable",
      "3 days ago",
      "slate",
    ],
  ];

  const dot = (tone) =>
    tone === "blue"
      ? "bg-blue-600"
      : tone === "sky"
      ? "bg-sky-500"
      : tone === "indigo"
      ? "bg-indigo-500"
      : "bg-slate-400";

  return (
    <div className="rounded-2xl border border-slate-200/40 bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold">Activity</div>
      <div className="mt-1 text-xs text-slate-500">Updates and reminders</div>

      <div className="mt-4 space-y-2">
        {items.map(([title, desc, when, tone]) => (
          <div
            key={title}
            className="flex items-start gap-3 rounded-xl border border-slate-200/40 bg-white p-3 hover:bg-slate-50"
          >
            <div className={`mt-1.5 h-2.5 w-2.5 rounded-full ${dot(tone)}`} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{title}</div>
              <div className="mt-0.5 text-xs text-slate-500">{desc}</div>
            </div>
            <div className="text-xs text-slate-500">{when}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl bg-sky-50 p-3 text-xs text-sky-800">
        Tip: finishing one module a day builds a strong streak.
      </div>
    </div>
  );
}
