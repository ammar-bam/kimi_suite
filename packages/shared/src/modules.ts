export const modules = [
  { id: "chat", label: "Chat", icon: "message-square", path: "/modules/chat", tier: "free" },
  { id: "summarize", label: "Summarizer", icon: "file-text", path: "/modules/summarize", tier: "free" },
  { id: "translate", label: "Translate", icon: "languages", path: "/modules/translate", tier: "free" },
  { id: "slides", label: "Slide Creator", icon: "presentation", path: "/modules/slides", tier: "pro" },
  { id: "speech", label: "Speech", icon: "mic", path: "/modules/speech", tier: "pro" },
  { id: "code", label: "Code Helper", icon: "code-2", path: "/modules/code", tier: "free" }
] as const;

export type ModuleManifest = (typeof modules)[number];
