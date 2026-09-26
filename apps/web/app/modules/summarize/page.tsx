import { BackButton } from "../../_components/back-button";

export default function SummarizeModulePage() {
  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-5xl p-6 md:p-10 pt-4">
      <BackButton href="/dashboard" label="Back to modules" />
      <h1 className="mt-4 text-3xl font-bold">Document Summarizer</h1>
      <p className="mt-2 text-slate-700">Upload, summarize, and question long documents with citations.</p>
    </main>
  );
}