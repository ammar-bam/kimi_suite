import { BackButton } from "../../_components/back-button";

export default function TranslateModulePage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl p-6 md:p-10">
      <BackButton href="/dashboard" label="Back to modules" />
      <h1 className="mt-4 text-3xl font-bold">Translator + Rewriter</h1>
      <p className="mt-2 text-slate-700">Translate, paraphrase, and tone-shift text in a single flow.</p>
    </main>
  );
}
