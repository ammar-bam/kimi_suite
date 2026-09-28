"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";

type MarkdownProps = {
  content: string;
  className?: string;
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      className="absolute top-2 right-2 text-xs px-2 py-1 rounded-md bg-slate-800/70 text-slate-100 hover:bg-slate-800 transition"
      aria-label="Copy code"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

const components: Components = {
  h1: ({ children }) => <h1 className="text-2xl font-bold mt-4 mb-2">{children}</h1>,
  h2: ({ children }) => <h2 className="text-xl font-bold mt-4 mb-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-lg font-semibold mt-3 mb-2">{children}</h3>,
  p: ({ children }) => <p className="my-2 leading-relaxed whitespace-pre-wrap break-words">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-6 my-2 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-6 my-2 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="text-brand underline underline-offset-2 hover:opacity-80"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-brand/40 pl-4 italic my-3 text-slate-600">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-slate-200" />,
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="min-w-full text-sm border border-slate-200">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-slate-200 bg-slate-50 px-2 py-1 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="border border-slate-200 px-2 py-1 align-top">{children}</td>,
  code({ className, children, ...props }) {
    const isBlock = /language-/.test(className ?? "");
    const text = String(children ?? "").replace(/\n$/, "");

    if (!isBlock) {
      return (
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.85em] font-mono text-slate-800">
          {children}
        </code>
      );
    }

    const language = /language-(\w+)/.exec(className ?? "")?.[1] ?? "code";
    return (
      <span className="relative block my-3">
        <span className="absolute top-2 left-3 text-[10px] uppercase tracking-wide text-slate-400">
          {language}
        </span>
        <CopyButton text={text} />
        <pre className="overflow-x-auto rounded-xl bg-slate-900 text-slate-100 px-4 pt-6 pb-3 text-xs leading-relaxed">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      </span>
    );
  }
};

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
