import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col p-6 md:p-10 pt-4">
      <div className="rounded-2xl border border-black/10 bg-white/85 p-8 shadow-sm backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">KimiAI Suite</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight">One workspace for every AI productivity flow.</h1>
        <p className="mt-4 max-w-3xl text-slate-700">
          This scaffold includes modular routes, shared packages, and API placeholders for chat, summarization,
          translation, slides, speech, and code assistant.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white" href="/dashboard">
            Open Dashboard
          </Link>
          <Link className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium" href="/debug/llm">
            Test KIMI Connection
          </Link>
        </div>
      </div>
    </main>
  );
}