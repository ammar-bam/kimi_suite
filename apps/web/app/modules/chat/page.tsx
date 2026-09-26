import { useState, useEffect, useRef } from "react";
import { BackButton } from "../../_components/back-button";
import { useParams, useRouter } from "next/navigation";
import { ChatMessage } from "@/lib/types";
import { useToast } from "@/app/_components/toast";

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
  const messagesEndRef = useRef(null);

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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedConversationId || isLoading) return;

    setIsLoading(true);
    setError(null);

    // Optimistically add user message
    const userMessage: ChatMessage = {
      role: "user",
      content: input
    };
    setMessages(prev => [...prev, userMessage]);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        })
      });

      if (!res.ok) throw new Error("Failed to send message");

      const data = await res.json();
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.data.text || ""
      };

      setMessages(prev => [...prev.filter(m => m !== userMessage), userMessage, assistantMessage]);

      // Update conversation title if it's still "New Conversation"
      if (selectedConversationId) {
        const conv = conversations.find(c => c.id === selectedConversationId);
        if (conv?.title === "New Conversation" && input.trim()) {
          // Update conversation title based on first user message
          const title = input.trim().split(" ").slice(0, 4).join(" ") +
                      (input.trim().split(" ").length > 4 ? "..." : "");
          await fetch(`/api/conversations/${selectedConversationId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title })
          });

          setConversations(prev =>
            prev.map(c =>
              c.id === selectedConversationId
                ? {...c, title}
                : c
            )
          );
        }
      }

      addToast("Message sent", "success");
    } catch (err) {
      setError("Failed to send message");
      console.error(err);
      // Remove optimistic message on error
      setMessages(prev => prev.slice(0, -1));
      addToast("Failed to send message", "error");
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
    <main className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-4xl p-4 md:p-6 pt-4 flex">
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
            <div key={conv.id} className="flex w-full items-start gap-3 p-3 rounded-lg border border-transparent
              ${selectedConversationId === conv.id
                ? "bg-brand/10 text-brand border-brand"
                : "hover:bg-slate-50 hover:text-slate-900"}
              transition">
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
          <div className="flex-1 overflow-y-auto pb-4">
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={msg.role + '-' + index}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} max-w-[80%]`}
                >
                  <div className={`px-4 py-2 rounded-xl max-w-[80%]
                    ${msg.role === "user"
                      ? "bg-brand text-white self-end"
                      : "bg-slate-100 text-slate-900 self-start"}
                    shadow-sm`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    {msg.role === "assistant" && index === messages.length - 1 && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                        <span>•</span>
                        <span>Typing...</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && messages.length > 0 && (
                <div className="flex justify-start max-w-[80%]">
                  <div className="px-4 py-2 rounded-xl bg-slate-100 text-slate-900 self-start shadow-sm animate-pulse">
                    <p className="whitespace-pre-wrap break-words">Thinking...</p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )
        } : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-slate-500">Select a conversation to start chatting</p>
          </div>
        )}

        {/* Message Input */}
        <form onSubmit={sendMessage} className="mt-4 flex gap-2">
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
            disabled={!input.trim() || !selectedConversationId || isLoading}
            className="px-4 py-3 rounded-xl bg-brand text-white font-medium hover:bg-brand/90 transition
                       flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M10.894 6.166a.75.75 0 00-1.06 0l-2 2.5a.75.75 0 101.06 1.06L10 8.94l1.894 2.367a.75.75 0 101.06-1.06l-1.894-2.367L12.894 8.666a.75.75 0 000-1.06l-2-2.5z" clipRule="evenodd"/>
            </svg>
            <span>Send</span>
          </button>
        </form>
      </div>
    </main>
  );
}