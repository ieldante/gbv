import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2 bg-white">
      <h1 className="text-4xl font-bold text-black">
        Welcome to the Synthetic Learning Environment
      </h1>
      <p className="mt-4 text-lg text-gray-600">
        This is a public demo UI for verification. Not all features are
        available. Information is static.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          className="rounded-lg bg-white border border-slate-200/80 px-4 py-2 text-sm text-black"
          href="/hub"
        >
          Open
        </Link>
      </div>
    </div>
  );
}
