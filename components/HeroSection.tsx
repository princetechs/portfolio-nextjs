"use client";

import { useCallback, useRef } from "react";
import Link from "next/link";
import AvatarDisplay from "./AvatarDisplay";
import ChatInterface from "./ChatInterface";
import config from "@/lib/config";

const { profile, availability, hero } = config;

function cleanForSpeech(text: string) {
  return text
    .replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/[*_`#>~|]/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\n+/g, ". ")
    .replace(/\.{2,}/g, ".")
    .trim();
}

export default function HeroSection() {
  const speakFnRef = useRef<((text: string) => void) | null>(null);
  const indicatorRef = useRef<HTMLDivElement | null>(null);

  const handleAvatarReady = useCallback((speak: (text: string) => void) => {
    speakFnRef.current = speak;
    const greet = () => speak(hero.greeting);
    if (window.speechSynthesis.getVoices().length) {
      greet();
    } else {
      window.speechSynthesis.addEventListener("voiceschanged", greet, { once: true });
    }
  }, []);

  const handleAiResponse = useCallback((text: string) => {
    const cleaned = cleanForSpeech(text);
    if (!cleaned) return;
    const el = indicatorRef.current;
    if (el) el.style.opacity = "1";
    speakFnRef.current?.(cleaned);
    const ms = Math.max(2000, cleaned.length * 70);
    setTimeout(() => { if (el) el.style.opacity = "0"; }, ms);
  }, []);

  return (
    <div className="relative w-full overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-300/15 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-indigo-300/15 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-1/3 w-[450px] h-[450px] bg-purple-300/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 min-h-[calc(100vh-64px)] flex flex-col justify-center">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 w-full items-start">

          {/* ── Left: Avatar column ── */}
          <div className="w-full lg:w-[38%] flex flex-col order-2 lg:order-1">
            <div className="lg:sticky lg:top-28">

              {/* Avatar */}
              <div className="relative">
                <AvatarDisplay onReady={handleAvatarReady} />

                {/* Speaking indicator */}
                <div
                  ref={indicatorRef}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/55 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-medium whitespace-nowrap transition-opacity duration-500 pointer-events-none"
                  style={{ opacity: 0 }}
                >
                  <span className="flex gap-0.5 items-end h-4">
                    {[0.6, 1, 0.8, 1.2, 0.5].map((h, i) => (
                      <span
                        key={i}
                        className="w-1 rounded-full bg-emerald-400 animate-bounce"
                        style={{ height: `${h * 12}px`, animationDelay: `${i * 0.08}s`, animationDuration: "0.55s" }}
                      />
                    ))}
                  </span>
                  Speaking
                </div>
              </div>

              {/* Bio card */}
              <div className="mt-6 bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-bold text-slate-900 text-sm leading-none">{profile.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{profile.title} · {profile.company}, {profile.location.split(",")[0]}</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[11px] font-semibold text-emerald-700">{availability.badgeText}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {hero.skillPills.map((s) => (
                    <span key={s} className="px-2.5 py-1 bg-slate-50 text-slate-600 text-[11px] font-medium rounded-lg border border-slate-200">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <a
                    href={`mailto:${profile.email}`}
                    className="flex-1 text-center py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl hover:opacity-90 transition-opacity shadow-sm shadow-violet-500/20"
                  >
                    Hire Me
                  </a>
                  <Link
                    href="/projects"
                    className="flex-1 text-center py-2.5 text-xs font-semibold text-slate-700 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    View Projects
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Hero text + Chat ── */}
          <div className="w-full lg:w-[62%] flex flex-col order-1 lg:order-2 gap-6">

            {/* Hero intro text */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-200 rounded-full mb-4">
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                <span className="text-xs font-semibold text-violet-700">{availability.label}</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight tracking-tight">
                {hero.headline.replace(profile.firstName, "").trim()}{" "}
                <span className="bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
                  {profile.firstName}
                </span>
              </h1>
              <p className="mt-3 text-lg text-slate-500 leading-relaxed max-w-xl">
                {hero.subheadline}
              </p>
              <div className="flex flex-wrap gap-3 mt-5">
                <Link
                  href="/experience"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold shadow-md shadow-slate-900/10 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                >
                  View Experience
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <a
                  href={profile.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50 transition-all duration-200 shadow-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  GitHub
                </a>
              </div>
            </div>

            {/* Chat interface */}
            <div className="relative w-full" style={{ minHeight: "520px" }}>
              <ChatInterface onAiResponse={handleAiResponse} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
