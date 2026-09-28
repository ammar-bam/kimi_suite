"use client";

import { useState, useEffect, useRef } from "react";
import { BackButton } from "../../_components/back-button";
import { useParams, useRouter } from "next/navigation";
import { ChatMessage } from "@/lib/types";
import { useToast } from "@/app/_components/toast";
import { Markdown } from "@/app/_components/markdown";

type Attachment = { name: string; size: number; content: string; language: string };

const MAX_ATTACHMENT_BYTES = 500 * 1024;
const MAX_ATTACHMENTS = 5;
const TEXT_EXTENSIONS = new Set([
  "txt", "md", "markdown", "json", "csv", "tsv", "yml", "yaml", "xml", "html", "htm",
  "css", "scss", "less", "js", "mjs", "cjs", "ts", "tsx", "jsx", "vue", "svelte",
  "py", "rb", "go", "rs", "java", "kt", "kts", "c", "cc", "cpp", "cxx", "h", "hpp",
  "cs", "php", "sh", "bash", "zsh", "ps1", "bat", "sql", "toml", "ini", "env",
  "log", "conf", "cfg", "dockerfile", "gitignore", "editorconfig"
]);

function extensionOf(name: string) {
  const dot = name.lastIndexOf(".");
  if (dot === -1) return name.toLowerCase();
  return name.slice(dot + 1).toLowerCase();
}

export default function ChatModulePage() {
  const { convId } = useParams<{ convId?: string }>();
  const router = useRouter();
  const { addToast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Array<{id: string; title: string; createdAt: string}>>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();

    // If we have a convId from URL, select it
    if (convId) {
      setSelectedConversationId(convId);
      loadMessages(convId);
    }
  }, [convId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      if (!res.ok) throw new Error("Failed to load conversations");
      const data = await res.json();
      setConversations(data.data || []);
    } catch (err) {
      setError("Failed to load conversations");
      console.error(err);
      addToast("Failed to load conversations", "error");
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!res.ok) throw new Error("Failed to load messages");
      const data = await res.json();
      setMessages(data.data || []);
      setSelectedConversationId(conversationId);
    } catch (err) {
      setError("Failed to load messages");
      console.error(err);
      addToast("Failed to load messages", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const createNewConversation = async () => {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Conversation" })
      });
      if (!res.ok) throw new Error("Failed to create conversation");
      const data = await res.json();
      setConversations(prev => [data.data, ...prev]);
      setSelectedConversationId(data.data.id);
      router.push(`/modules/chat/${data.data.id}`);
      setMessages([]);
      addToast("New conversation created", "success");
    } catch (err) {
      setError("Failed to create conversation");
      console.error(err);
      addToast("Failed to create conversation", "error");
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      setDeletingId(id);
      const res = await fetch(`/api/conversations/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete conversation");

      // Remove from list
      setConversations(prev => prev.filter(conv => conv.id !== id));

      // If we deleted the currently selected conversation, go back to home or select another
      if (selectedConversationId === id) {
        setSelectedConversationId(null);
        setMessages([]);
        if (conversations.length > 1) {
          // Select the first conversation if available
          const firstConv = conversations.find(c => c.id !== id);
          if (firstConv) {
            setSelectedConversationId(firstConv.id);
            loadMessages(firstConv.id);
            router.push(`/modules/chat/${firstConv.id}`);
          } else {
            router.push("/modules/chat");
          }
        } else {
          router.push("/modules/chat");
        }
      }
      addToast("Conversation deleted", "success");
    } catch (err) {
      setError("Failed to delete conversation");
      console.error(err);
      addToast("Failed to delete conversation", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const incoming = Array.from(fileList);
    const room = MAX_ATTACHMENTS - attachments.length;
    if (room <= 0) {
      addToast(`Maximum ${MAX_ATTACHMENTS} attachments`, "error");
      return;
    }

    const accepted: Attachment[] = [];
    for (const file of incoming.slice(0, room)) {
      const ext = extensionOf(file.name);
      const isText = TEXT_EXTENSIONS.has(ext) || file.type.startsWith("text/");
      if (!isText) {
        addToast(`${file.name}: unsupported type`, "error");
        continue;
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        addToast(`${file.name}: exceeds ${Math.round(MAX_ATTACHMENT_BYTES / 1024)}KB`, "error");
        continue;
      }
      try {
        const content = await file.text();
        accepted.push({ name: file.name, size: file.size, content, language: ext || "text" });
      } catch (err) {
        console.error("read file failed", err);
        addToast(`${file.name}: failed to read`, "error");
      }
    }

    if (accepted.length > 0) {
      setAttachments(prev => [...prev, ...accepted]);
      addToast(`Attached ${accepted.length} file${accepted.length > 1 ? "s" : ""}`, "success");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || !selectedConversationId || isLoading) return;

    const typed = input.trim();
    setIsLoading(true);
    setError(null);

    const composed = [
      typed,
      ...attachments.map(
        (a) => `--- attached: ${a.name} ---\n\`\`\`${a.language}\n${a.content}\n\`\`\``
      )
    ]
      .filter(Boolean)
      .join("\n\n");

    const userMessage: ChatMessage = { role: "user", content: composed };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setAttachments([]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          conversationId: selectedConversationId
        })
      });

      if (!res.ok) {
        let message = `Chat request failed (${res.status})`;
        try {
          const errJson = await res.json();
          message = errJson?.error?.message || errJson?.error || message;
        } catch {
          /* body wasn't JSON */
        }
        throw new Error(typeof message === "string" ? message : JSON.stringify(message));
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (!res.body || contentType.includes("application/json")) {
        const data = await res.json();
        const text = data?.data?.text ?? "";
        setMessages(prev => [...prev, { role: "assistant", content: text }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "" }]);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setMessages(prev => {
            if (prev.length === 0) return prev;
            const copy = prev.slice();
            copy[copy.length - 1] = { role: "assistant", content: acc };
            return copy;
          });
        }
      }

      if (selectedConversationId) {
        const conv = conversations.find(c => c.id === selectedConversationId);
        if (conv?.title === "New Conversation" && typed) {
          const words = typed.split(" ");
          const title = words.slice(0, 4).join(" ") + (words.length > 4 ? "..." : "");
          await fetch(`/api/conversations/${selectedConversationId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title })
          });
          setConversations(prev =>
            prev.map(c => (c.id === selectedConversationId ? { ...c, title } : c))
          );
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send message";
      setError(message);
      console.error(err);
      addToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  if (isLoading && messages.length === 0) {
    return (
      <main className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-5xl p-6 md:p-10 pt-4 flex flex-col items-center justify-center">
        <BackButton href="/dashboard" label="Back to modules" />
        <h1 className="mt-4 text-3xl font-bold">Loading chat...</h1>
      </main>
    );
  }

  return (
    <main className="mx-auto h-[calc(100vh-4rem)] w-full max-w-4xl p-4 md:p-6 pt-4 flex gap-4 overflow-hidden">
      {/* Sidebar - Conversation List */}
      <aside className="w-64 bg-white/80 backdrop-blur-sm rounded-2xl border border-black/10 p-4 shadow-lg flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">Conversations</p>
          <button
            onClick={createNewConversation}
            className="px-3 py-1 rounded-md bg-brand text-white text-xs font-medium hover:bg-brand/90 transition"
          >
            New Chat
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {conversations.map(conv => (
            <div
              key={conv.id}
              className={`flex w-full items-start gap-3 p-3 rounded-lg border border-transparent transition ${
                selectedConversationId === conv.id
                  ? "bg-brand/10 text-brand border-brand"
                  : "hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="line-clamp-1 font-medium">{conv.title}</p>
                <p className="text-xs text-slate-500 line-clamp-1">
                  {new Date(conv.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-end space-x-2">
                <button
                  onClick={() => {
                    setSelectedConversationId(conv.id);
                    loadMessages(conv.id);
                    router.push(`/modules/chat/${conv.id}`);
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                  </svg>
                </button>
                {deletingId === conv.id ? (
                  <button
                    disabled
                    className="p-1 rounded-md text-slate-400 animate-pulse"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 animate-spin">
                      <path fillRule="evenodd" d="M10 0a10 10 0 100 20 10A10.011 10.011 0 0010 0zm1 15a3 3 0 110-6 3 3 0 010 6zm8.657-8.657a1 1 0 00-1.414-1.414L9 7.293V4a1 1 0 00-2 0v3.293L5.057 4.343a1 1 0 10-1.414-1.414l2 2a1 1 0 000 1.414l2.757-2.757a1 1 0 101.414 1.414L12 9.293v3.293a1 1 0 002 0v-3.293l-1.414 1.414z" clipRule="evenodd"/>
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                    aria-label="Delete conversation"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h10a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 01-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 002 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}

          {conversations.length === 0 && (
            <p className="text-center text-slate-500 py-4">
              No conversations yet. Start a new chat!
            </p>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white/85 backdrop-blur-sm rounded-2xl border border-black/10 p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Chat Workspace</h1>
          {selectedConversationId && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-slate-600">Online</span>
            </div>
          )}
        </div>

        {selectedConversationId ? (
          <div className="flex-1 overflow-y-auto pb-4 -mx-2 px-2">
            <div className="space-y-6">
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.role + "-" + index}
                    className={`flex w-full items-end gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && (
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-brand/10 text-brand flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                          <path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm0 19.5c-4.256 0-7.715-3.444-8.016-7.5h16.032c-.301 4.056-3.76 7.5-8.016 7.5z" />
                        </svg>
                      </div>
                    )}

                    <div
                      className={`group relative max-w-[75%] px-4 py-3 shadow-sm text-sm leading-relaxed ${
                        isUser
                          ? "bg-brand text-white rounded-2xl rounded-br-sm"
                          : "bg-white text-slate-900 border border-slate-200 rounded-2xl rounded-bl-sm"
                      }`}
                    >
                      <div className={`mb-1 text-[10px] uppercase tracking-wide ${isUser ? "text-white/70" : "text-slate-400"}`}>
                        {isUser ? "You" : "Assistant"}
                      </div>
                      {isUser ? (
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      ) : (
                        <Markdown content={msg.content} className="chat-markdown" />
                      )}
                    </div>

                    {isUser && (
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 8a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}

              {isLoading && (messages[messages.length - 1]?.role !== "assistant" || !messages[messages.length - 1]?.content) && (
                <div className="flex w-full items-end gap-3 justify-start">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-brand/10 text-brand flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25z" />
                    </svg>
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce"></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-slate-500">Select a conversation to start chatting</p>
          </div>
        )}

        {/* Message Input */}
        <form onSubmit={sendMessage} className="mt-4 flex flex-col gap-2">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((a, i) => (
                <span
                  key={`${a.name}-${i}`}
                  className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-slate-400">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V7.414A2 2 0 0017.414 6L14 2.586A2 2 0 0012.586 2H4zm7 1.5V7a1 1 0 001 1h2.5L11 4.5z" clipRule="evenodd"/>
                  </svg>
                  <span className="font-medium max-w-[160px] truncate">{a.name}</span>
                  <span className="text-slate-400">{(a.size / 1024).toFixed(1)}KB</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(i)}
                    className="text-slate-400 hover:text-red-500"
                    aria-label={`Remove ${a.name}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFilesSelected(e.target.files)}
              accept=".txt,.md,.markdown,.json,.csv,.tsv,.yml,.yaml,.xml,.html,.htm,.css,.scss,.less,.js,.mjs,.cjs,.ts,.tsx,.jsx,.vue,.svelte,.py,.rb,.go,.rs,.java,.kt,.kts,.c,.cc,.cpp,.cxx,.h,.hpp,.cs,.php,.sh,.bash,.zsh,.ps1,.bat,.sql,.toml,.ini,.env,.log,.conf,.cfg,text/*"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || attachments.length >= MAX_ATTACHMENTS}
              className="px-3 py-3 rounded-xl border border-slate-300 bg-white/90 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Attach file"
              title={`Attach text file (max ${Math.round(MAX_ATTACHMENT_BYTES / 1024)}KB, ${MAX_ATTACHMENTS} files)`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M13.803 3.197a2.828 2.828 0 00-4 0L3.518 9.482a4.243 4.243 0 106 6l6.011-6.011a.75.75 0 111.061 1.06l-6.011 6.011a5.743 5.743 0 01-8.122-8.121l6.286-6.286a4.328 4.328 0 016.121 6.122l-6.32 6.32a2.914 2.914 0 01-4.121-4.122l5.657-5.657a.75.75 0 111.06 1.061L4.482 11.516a1.414 1.414 0 002 2l6.32-6.32a2.828 2.828 0 000-4z" clipRule="evenodd"/>
              </svg>
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 min-h-[60px] px-4 py-3 rounded-xl border border-slate-300 bg-white/90 backdrop-blur-sm
                         focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20
                         resize-none text-sm/leading-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={(!input.trim() && attachments.length === 0) || !selectedConversationId || isLoading}
              className="px-4 py-3 rounded-xl bg-brand text-white font-medium hover:bg-brand/90 transition
                         flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M10.894 6.166a.75.75 0 00-1.06 0l-2 2.5a.75.75 0 101.06 1.06L10 8.94l1.894 2.367a.75.75 0 101.06-1.06l-1.894-2.367L12.894 8.666a.75.75 0 000-1.06l-2-2.5z" clipRule="evenodd"/>
              </svg>
              <span>Send</span>
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}