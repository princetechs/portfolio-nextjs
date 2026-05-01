"use client";

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import config from "@/lib/config";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
}

interface ChatInterfaceProps {
  onAiResponse?: (text: string) => void;
  embedded?: boolean;
  /** Live2D avatar element rendered beside the input (or centered before first message) */
  avatarSlot?: ReactNode;
  /** Callback fired when user sends the first message */
  onChatStarted?: () => void;
}

const { chat, nav } = config;

let msgCounter = 0;
function uid() { return `msg-${Date.now()}-${++msgCounter}`; }

export default function ChatInterface({ onAiResponse, embedded, avatarSlot, onChatStarted }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: chat.welcomeMessage },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsgId = uid();
      const assistantMsgId = uid();

      if (!chatStarted) {
        setChatStarted(true);
        onChatStarted?.();
      }

      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", content: trimmed },
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
            { id: assistantMsgId, role: "assistant", content: data.error ?? "Too many messages — please wait.", isError: true },
          ]);
          return;
        }

        if (!res.ok) throw new Error("Server error");

        if (res.body) {
          setMessages((prev) => [
            ...prev,
            { id: assistantMsgId, role: "assistant", content: "" },
          ]);
          setLoading(false);

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let fullText = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            fullText += chunk;
            const currentText = fullText;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId ? { ...msg, content: currentText } : msg
              )
            );
          }

          if (fullText) onAiResponse?.(fullText);
          setRateLimited(false);
        } else {
          const data = await res.json();
          setMessages((prev) => [
            ...prev,
            { id: assistantMsgId, role: "assistant", content: data.response },
          ]);
          onAiResponse?.(data.response);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { id: uid(), role: "assistant", content: "Sorry, something went wrong. Please try again!", isError: true },
        ]);
      } finally {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [loading, onAiResponse, chatStarted, onChatStarted]
  );

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(input); };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const px = embedded ? "px-5 lg:px-6" : "px-4";

  return (
    <div className={`w-full h-full flex flex-col ${
      embedded ? "bg-transparent" : "rounded-2xl overflow-hidden border border-slate-200/60 shadow-xl shadow-slate-900/5 bg-white"
    }`}>

      {/* ── Header (standalone mode only) ── */}
      {!embedded && (
        <div className="shrink-0 bg-white border-b border-slate-100 px-5 py-3.5">
          <div className="h-0.5 bg-gradient-to-r from-slate-600 via-slate-500 to-slate-400 -mx-5 -mt-3.5 mb-3.5" />
          <ChatHeader />
        </div>
      )}

      {/* ═══ Scrollable messages area ═══ */}
      <div className="flex-1 overflow-y-auto min-h-0 relative">
        <div className={`${px} py-4 space-y-3`}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-[10px] font-black shrink-0 mt-0.5 shadow-sm shadow-slate-500/20">
                  {nav.brandInitials}
                </div>
              )}
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-slate-800 text-white rounded-tr-sm shadow-md shadow-slate-500/15"
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
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-[10px] font-black shrink-0 mt-0.5 shadow-sm shadow-slate-500/20">
                {nav.brandInitials}
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1.5 items-center h-4">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Avatar: Centered floating state (before first message) ── */}
        {avatarSlot && !chatStarted && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="pointer-events-auto avatar-float-center">
              {avatarSlot}
              <p className="text-center text-[11px] text-slate-400 mt-1 font-medium">Ask me anything below!</p>
            </div>
          </div>
        )}
      </div>

      {/* Rate limit */}
      {rateLimited && (
        <div className={`${px} mt-1`}>
          <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-center gap-2">
            <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            Rate limit reached — please wait a moment.
          </div>
        </div>
      )}

      {/* ═══ Bottom bar: Quick actions + Avatar + Input ═══ */}
      <div className={`shrink-0 ${px} pb-3 pt-1`}>
        <div className="flex items-end gap-3">
          {/* Avatar — slides to bottom-left after first message */}
          {avatarSlot && chatStarted && (
            <div className="shrink-0 hidden sm:block avatar-slide-in">
              {avatarSlot}
            </div>
          )}

          {/* Input column: quick actions centered above input */}
          <div className="flex-1 min-w-0">
            {/* Quick actions — centered above input */}
            <div
              className="flex flex-wrap justify-center gap-2 pb-2.5 overflow-x-auto scrollbar-none"
              style={{ scrollbarWidth: "none" }}
            >
              {chat.quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => sendMessage(action.message)}
                  disabled={loading}
                  className="px-3 py-1.5 text-[11px] font-medium bg-white text-slate-600 border border-slate-200 rounded-full whitespace-nowrap hover:border-slate-300 hover:text-slate-900 hover:bg-slate-50 transition-all duration-150 disabled:opacity-40 shrink-0 shadow-sm"
                >
                  {action.label}
                </button>
              ))}
            </div>

            {/* Input row */}
            <form onSubmit={handleSubmit} className="flex gap-2.5 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything... (Enter to send)"
                rows={1}
                className="flex-1 resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-300 transition-all shadow-sm"
                style={{ minHeight: "42px", maxHeight: "100px" }}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="flex items-center justify-center w-[42px] h-[42px] rounded-xl bg-slate-800 text-white shadow-md shadow-slate-500/25 hover:shadow-lg hover:shadow-slate-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-40 disabled:hover:translate-y-0 disabled:cursor-not-allowed shrink-0"
                aria-label="Send"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Extracted header component (standalone mode only) ── */
function ChatHeader() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-[10px] font-black shadow-sm shadow-slate-500/20">
        {nav.brandInitials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900 leading-none">{chat.botName}</p>
        <p className="text-[11px] text-slate-400 mt-0.5 truncate">{chat.botSubtitle}</p>
      </div>
    </div>
  );
}
