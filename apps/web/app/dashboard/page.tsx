import Link from "next/link";
import { modules } from "@kimi/shared";

export default function DashboardPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl p-6 md:p-10">
      <h1 className="text-3xl font-bold">Modules</h1>
      <p className="mt-2 text-slate-700">Each module follows the same plug-in structure and can ship independently.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <Link
            key={module.id}
            href={module.path}
            className="rounded-xl border border-black/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
          >
            <p className="text-xs uppercase tracking-wide text-slate-500">{module.tier}</p>
            <h2 className="mt-2 text-xl font-semibold">{module.label}</h2>
            <p className="mt-1 text-sm text-slate-600">Open {module.id} module</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
