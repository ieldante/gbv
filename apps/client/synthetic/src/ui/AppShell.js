import Link from "next/link";
import { useRouter } from "next/router";

function NavLink({ href, label }) {
  const r = useRouter();
  const active = r.pathname === href;
  return (
    <Link
      href={href}
      className={[
        "flex items-center justify-between rounded-xl px-3 py-2 text-sm",
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "text-slate-700 hover:bg-slate-100",
      ].join(" ")}
    >
      <span className="font-medium">{label}</span>
      <span className={active ? "text-white/70" : "text-slate-400"}>›</span>
    </Link>
  );
}

export default function AppShell({ children, title, subtitle, right }) {
  const r = useRouter();
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 border border-slate-200/40-b bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <div
            onClick={() => {
              r.push("/hub");
            }}
            className="h-9 w-9 cursor-pointer rounded-xl bg-gradient-to-br from-blue-500 to-sky-400 shadow-sm"
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">
              {title || "LearnSpace"}
            </div>
            <div className="truncate text-xs text-slate-500">
              {subtitle || "Your courses, progress, and certificates"}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 rounded-xl border border-slate-200/40 bg-white px-3 py-2 shadow-sm">
              <span className="text-xs text-slate-500">Search</span>
              <input
                className="w-64 p-0 text-sm outline-none placeholder:text-slate-400"
                placeholder="Search courses, certificates, modules…"
              />
              <kbd className="rounded-md border border-slate-200/40 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-600">
                /
              </kbd>
            </div>

            {right || (
              <button className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
                New
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            <div className="rounded-2xl border border-slate-200/40 bg-white p-3 shadow-sm">
              <div className="px-2 pb-2 text-xs font-semibold text-slate-500">
                Workspace
              </div>
              <div className="space-y-1">
                <NavLink href="/hub" label="Hub" />
                <NavLink href="/milestones" label="Milestones" />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/40 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold">Today</div>
              <div className="mt-3 space-y-2 text-xs text-slate-600">
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="font-medium text-slate-900">Quick tips</div>
                  <div className="mt-1">Keep learning streaks consistent.</div>
                  <div>Finish one module at a time.</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="font-medium text-slate-900">Updates</div>
                  <div className="mt-1">New practice sets available.</div>
                  <div>Certificates now support sharing.</div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
