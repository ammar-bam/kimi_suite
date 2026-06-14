"use client";

import { useState } from "react";

export default function LlmDebugPage() {
  const [prompt, setPrompt] = useState("Say hello from KimiAI Suite");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          model: "moonshot-v1-32k"
        })
      });
      const text = await res.text();
      setResult(text);
    } catch (error) {
      setResult(String(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl p-6 md:p-10">
      <h1 className="text-2xl font-bold">KIMI Debug Page</h1>
      <textarea
        className="mt-4 min-h-32 w-full rounded-lg border border-slate-300 bg-white p-3"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button
        className="mt-3 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        onClick={run}
        disabled={loading}
      >
        {loading ? "Running..." : "Send Test Request"}
      </button>
      <pre className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white p-4 text-sm">{result}</pre>
    </main>
  );
}
