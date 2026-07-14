"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BackButton } from "../../_components/back-button";

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
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await res.json();
      setResult(data.text ?? data.error ?? "No response");
    } catch (error) {
      setResult(String(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl p-6 md:p-10">
      <BackButton href="/" label="Back to home" />
      <h1 className="mt-4 text-2xl font-bold">KIMI Debug Page</h1>
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

      {result && (
        <article className="mt-6 rounded-lg border border-slate-200 bg-white p-6 text-slate-800 shadow-sm">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: (props) => <h1 className="mt-4 mb-3 text-2xl font-bold" {...props} />,
              h2: (props) => <h2 className="mt-4 mb-2 text-xl font-semibold" {...props} />,
              h3: (props) => <h3 className="mt-3 mb-2 text-lg font-semibold" {...props} />,
              p: (props) => <p className="my-3 leading-relaxed" {...props} />,
              ul: (props) => <ul className="my-3 list-disc pl-6" {...props} />,
              ol: (props) => <ol className="my-3 list-decimal pl-6" {...props} />,
              li: (props) => <li className="my-1" {...props} />,
              strong: (props) => <strong className="font-semibold" {...props} />,
              em: (props) => <em className="italic" {...props} />,
              a: (props) => <a className="text-brand underline" target="_blank" rel="noreferrer" {...props} />,
              blockquote: (props) => (
                <blockquote className="my-3 border-l-4 border-slate-300 pl-4 italic text-slate-700" {...props} />
              ),
              hr: () => <hr className="my-4 border-slate-200" />,
              table: (props) => (
                <div className="my-3 overflow-x-auto">
                  <table className="w-full border-collapse text-sm" {...props} />
                </div>
              ),
              th: (props) => (
                <th className="border border-slate-300 bg-slate-100 px-3 py-2 text-left font-semibold" {...props} />
              ),
              td: (props) => <td className="border border-slate-200 px-3 py-2 align-top" {...props} />,
              code: ({ className, children, ...props }) => {
                const isBlock = className?.includes("language-");
                if (isBlock) {
                  return (
                    <code className={`${className} block`} {...props}>
                      {children}
                    </code>
                  );
                }
                return (
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em]" {...props}>
                    {children}
                  </code>
                );
              },
              pre: (props) => (
                <pre
                  className="my-3 overflow-x-auto rounded-md bg-slate-900 p-4 font-mono text-sm text-slate-100"
                  {...props}
                />
              )
            }}
          >
            {result}
          </ReactMarkdown>
        </article>
      )}
    </main>
  );
}
