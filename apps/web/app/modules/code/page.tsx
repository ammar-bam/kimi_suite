import { BackButton } from "../../_components/back-button";

export default function CodeModulePage() {
  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-5xl p-6 md:p-10 pt-4">
      <BackButton href="/dashboard" label="Back to modules" />
      <h1 className="mt-4 text-3xl font-bold">Code Assistant</h1>
      <p className="mt-2 text-slate-700">Explain, refactor, test-generate, and review code with AI assistance.</p>
    </main>
  );
}