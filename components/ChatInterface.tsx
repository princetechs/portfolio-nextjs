"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
}

interface ChatInterfaceProps {
  onAiResponse?: (text: string) => void;
}

const QUICK_ACTIONS = [
  { label: "Tech Stack", message: "What's your tech stack?" },
  { label: "Experience", message: "Tell me about your work experience" },
  { label: "Projects", message: "What projects have you worked on?" },
  { label: "Availability", message: "Are you available for new opportunities?" },
  { label: "Schedule Meet", message: "I'd like to schedule a meeting with you" },
];

export default function ChatInterface({ onAiResponse }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm DevSan — Sandip's AI persona. Ask me anything about his experience, projects, or skills. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "user", content: trimmed },
      ]);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed }),
        });

        if (res.status === 429) {
          setRateLimited(true);
          const data = await res.json();
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "assistant",
              content: data.error ?? "Too many messages — please wait a moment before trying again.",
              isError: true,
            },
          ]);
          return;
        }

        if (!res.ok) throw new Error("Server error");

        const data = await res.json();
        const reply = data.response as string;
        setMessages((prev) => [...prev, { id: Date.now().toString(), role: "assistant", content: reply }]);
        onAiResponse?.(reply);
        setRateLimited(false);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: "Sorry, something went wrong. Please try again!",
            isError: true,
          },
        ]);
      } finally {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [loading, onAiResponse]
  );

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(input); };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <div className="w-full h-full flex flex-col rounded-2xl overflow-hidden border border-slate-200/60 shadow-xl shadow-slate-900/5 bg-white">

      {/* Gradient accent line */}
      <div className="h-0.5 bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500 shrink-0" />

      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 shrink-0 bg-white">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-md shadow-violet-500/20">
              DS
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 leading-none">DevSan AI</p>
            <p className="text-xs text-slate-400 mt-0.5 truncate">Sandip&apos;s AI persona · Full-Stack Dev</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-100 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-xs text-green-700 font-semibold">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 min-h-0 bg-slate-50/40">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-[10px] font-black shrink-0 mt-0.5 shadow-sm shadow-violet-500/20">
                DS
              </div>
            )}
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed chat-message ${
                msg.role === "user"
                  ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-sm shadow-md shadow-violet-500/20"
                  : msg.isError
                  ? "bg-red-50 text-red-700 border border-red-200 rounded-tl-sm"
                  : "bg-white text-slate-700 border border-slate-200/80 rounded-tl-sm shadow-sm"
              }`}
            >
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500 text-[10px] font-bold shrink-0 mt-0.5">
                You
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-[10px] font-black shrink-0 mt-0.5 shadow-sm shadow-violet-500/20">
              DS
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1.5 items-center h-4">
                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Rate limit notice */}
      {rateLimited && (
        <div className="mx-4 mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-center gap-2 shrink-0">
          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          Rate limit reached — please wait a moment before sending more messages.
        </div>
      )}

      {/* Quick actions */}
      <div
        ref={chipsRef}
        className="px-4 pt-3 pb-2 flex gap-2 overflow-x-auto shrink-0 scrollbar-none"
        style={{ scrollbarWidth: "none" }}
      >
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => sendMessage(action.message)}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-medium bg-white text-slate-600 border border-slate-200 rounded-full whitespace-nowrap hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50 transition-all duration-150 disabled:opacity-40 shrink-0 shadow-sm"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="px-4 pb-4 pt-1 flex gap-2.5 items-end shrink-0"
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything… (Enter to send)"
          rows={1}
          className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-300 focus:bg-white transition-all"
          style={{ minHeight: "44px", maxHeight: "120px" }}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25 hover:shadow-lg hover:shadow-violet-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-40 disabled:hover:translate-y-0 disabled:cursor-not-allowed shrink-0"
          aria-label="Send"
        >
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </form>
    </div>
  );
}
