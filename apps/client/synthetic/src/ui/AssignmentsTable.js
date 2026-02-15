function assignmentRows() {
  return [
    ["Spreadsheet Basics", "Quiz", "10 questions", "100%"],
    ["Functions and Formulas", "Lab", "auto-graded", "96%"],
    ["Charts and Pivot Tables", "Lab", "peer-reviewed", "92%"],
    ["Final Checkpoint", "Quiz", "timed", "100%"],
    ["Optimization Drill", "Lab", "auto-graded", "95%"],
    ["Portfolio Reflection", "Discussion", "ungraded", "N/A"],
  ];
}

export default function AssignmentsTable({ course, view = null }) {
  const rows = assignmentRows();
  const configuredCount = Number(
    course?.semanticProfile?.moduleCountByPage?.assignments ??
      course?.semanticProfile?.moduleCountByPage?.default ??
      4,
  );
  const rowCount = Math.max(1, Math.min(rows.length, configuredCount));
  const visibleRows = rows.slice(0, rowCount);

  return (
    <div className="rounded-2xl border border-slate-200/40 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Assignments</div>
          <div className="mt-1 text-xs text-slate-500">
            Deadlines, scores, and feedback
          </div>
        </div>
        <div className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
          {view?.gradeText || course.gradeText}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500">
              <th className="border border-slate-200/40-b p-2">Item</th>
              <th className="border border-slate-200/40-b p-2">Type</th>
              <th className="border border-slate-200/40-b p-2">Rules</th>
              <th className="border border-slate-200/40-b p-2">Score</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row[0]} className="hover:bg-slate-50">
                <td className="border border-slate-200/40-b p-2 font-medium">{row[0]}</td>
                <td className="border border-slate-200/40-b p-2">{row[1]}</td>
                <td className="border border-slate-200/40-b p-2 text-slate-600">{row[2]}</td>
                <td className="border border-slate-200/40-b p-2">{row[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200/40 bg-slate-50 p-3 text-xs text-slate-700">
        Visible rows: {visibleRows.length}
      </div>
    </div>
  );
}
