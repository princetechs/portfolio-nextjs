"use client";

import { useCallback, useRef, useState } from "react";
import AvatarDisplay from "./AvatarDisplay";
import ChatInterface from "./ChatInterface";
import ExperiencePanel from "./ExperiencePanel";
import ProjectsPanel from "./ProjectsPanel";
import config from "@/lib/config";

type View = "home" | "experience" | "projects";

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
  const [activeView, setActiveView] = useState<View>("home");

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

  /* The avatar element — bounces in on load, then gently sways */
  const avatarElement = (
    <div className="relative w-[130px] h-[175px] lg:w-[150px] lg:h-[200px] avatar-entrance">
      <AvatarDisplay onReady={handleAvatarReady} darkMode={false} />

      {/* Ground shadow — makes avatar feel grounded */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[60%] h-2 bg-slate-900/[0.06] rounded-full blur-[3px]" />

      {/* Speaking indicator — badge above avatar's head */}
      <div
        ref={indicatorRef}
        className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-emerald-500 px-2.5 py-[3px] rounded-full text-white text-[9px] font-bold tracking-wider whitespace-nowrap transition-opacity duration-400 pointer-events-none z-10 shadow-md shadow-emerald-500/30"
        style={{ opacity: 0 }}
      >
        <span className="flex gap-[2px] items-end h-2">
          {[0.5, 0.9, 0.7, 1, 0.4].map((h, i) => (
            <span key={i} className="w-[2px] rounded-full bg-white animate-bounce"
              style={{ height: `${h * 7}px`, animationDelay: `${i * 0.07}s`, animationDuration: "0.5s" }} />
          ))}
        </span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full overflow-hidden">

      {/* ═══ Left Sidebar: Profile ═══ */}
      <div
        className="relative w-full lg:w-[280px] xl:w-[300px] shrink-0 flex flex-col overflow-hidden"
        style={{ background: "linear-gradient(165deg, #0c1a2b 0%, #0f172a 50%, #071318 100%)" }}
      >
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }}
        />
        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden hidden lg:block">
          <div className="absolute -top-20 -left-20 w-56 h-56 bg-slate-600/15 rounded-full blur-[80px]" />
          <div className="absolute bottom-10 -right-16 w-40 h-40 bg-slate-500/10 rounded-full blur-[60px]" />
        </div>

        {/* ── MOBILE: Compact bar + nav ── */}
        <div className="lg:hidden relative z-10 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-slate-900/40 shrink-0">
              {config.nav.brandInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-white leading-tight truncate">{profile.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{profile.title}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => setActiveView("experience")} className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${activeView === "experience" ? "text-white bg-slate-600/20" : "text-slate-400 hover:text-white hover:bg-white/[0.08]"}`}>Exp</button>
              <button onClick={() => setActiveView("projects")} className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${activeView === "projects" ? "text-white bg-slate-600/20" : "text-slate-400 hover:text-white hover:bg-white/[0.08]"}`}>Projects</button>
              <a href={profile.github} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* ── DESKTOP: Full profile sidebar ── */}
        <div className="hidden lg:flex flex-col flex-1 relative z-10 overflow-hidden">

          {/* ═══ Middle: Scrollable profile content ═══ */}
          <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-none" style={{ scrollbarWidth: "none" }}>

            {/* Identity */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-base font-black shadow-lg shadow-slate-900/40 shrink-0">
                {profile.initials}
              </div>
              <div className="min-w-0">
                <h2 className="text-[13px] font-bold text-white leading-tight truncate">{profile.name}</h2>
                <p className="text-[10px] text-slate-400 truncate">{profile.title}</p>
                <p className="text-[10px] text-slate-500 truncate">{profile.company} &middot; {profile.location.split(",")[0]}</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { val: "4+", label: "Years" },
                { val: "8", label: "Projects" },
                { val: "6+", label: "Stacks" },
              ].map((s) => (
                <div key={s.label} className="text-center py-2 bg-white/[0.04] rounded-lg border border-white/[0.06]">
                  <div className="text-[15px] font-bold text-white leading-none">{s.val}</div>
                  <div className="text-[9px] text-slate-500 mt-1 uppercase tracking-wider font-medium">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Skills */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {hero.skillPills.map((s) => (
                <span key={s} className="px-2 py-[3px] text-[10px] font-medium text-slate-300/80 bg-white/[0.05] rounded-md border border-white/[0.07]">
                  {s}
                </span>
              ))}
            </div>

            {/* Mini Terminal */}
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] overflow-hidden mb-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-white/[0.06]">
                <span className="w-[7px] h-[7px] rounded-full bg-red-400/60" />
                <span className="w-[7px] h-[7px] rounded-full bg-amber-400/60" />
                <span className="w-[7px] h-[7px] rounded-full bg-emerald-400/60" />
                <span className="text-[9px] text-slate-500 ml-1.5 font-mono">~/focus</span>
              </div>
              <div className="px-3 py-2.5 space-y-1.5 font-mono text-[10px]">
                <div className="text-slate-500">$ what-i-build</div>
                <div className="text-slate-300">AI-powered platforms</div>
                <div className="text-slate-300">Scalable web apps</div>
                <div className="text-slate-300">LLM integrations</div>
                <div className="flex items-center gap-1 text-slate-500 mt-1">
                  <span>$</span>
                  <span className="w-[5px] h-3 bg-slate-400/70 animate-pulse" />
                </div>
              </div>
            </div>

          </div>

          {/* ═══ Bottom: Nav dock + CTA ═══ */}
          <div className="shrink-0 px-5 pb-4 pt-2">
            {/* Icon dock nav */}
            <nav className="flex items-center justify-center gap-1 mb-3">
              {([
                { name: "Home", view: "home" as View, icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
                  </svg>
                )},
                { name: "Experience", view: "experience" as View, icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2" />
                  </svg>
                )},
                { name: "Projects", view: "projects" as View, icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                )},
              ] as const).map((item) => (
                <button
                  key={item.name}
                  onClick={() => setActiveView(item.view)}
                  className={`group relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 ${
                    activeView === item.view
                      ? "bg-slate-600/20 text-white shadow-sm shadow-slate-500/10"
                      : "text-slate-500 hover:text-white hover:bg-white/[0.08]"
                  }`}
                >
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-white text-slate-900 text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap shadow-lg pointer-events-none z-20">
                    {item.name}
                  </span>
                  {item.icon}
                </button>
              ))}
              {/* External links */}
              <a href={profile.github} target="_blank" rel="noopener noreferrer"
                className="group relative flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:text-white hover:bg-white/[0.08] transition-all duration-200">
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-white text-slate-900 text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap shadow-lg pointer-events-none z-20">GitHub</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a href={`mailto:${profile.email}`}
                className="group relative flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:text-white hover:bg-white/[0.08] transition-all duration-200">
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-white text-slate-900 text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap shadow-lg pointer-events-none z-20">Email</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
            </nav>

            <div className="h-px bg-white/[0.06] mb-3" />

            {/* Hire Me CTA */}
            <a
              href={`mailto:${profile.email}`}
              className="block text-center py-2.5 text-[12px] font-semibold text-white rounded-lg transition-all duration-200 shadow-lg shadow-slate-900/40 hover:shadow-slate-700/50 hover:brightness-110"
              style={{ background: "linear-gradient(135deg, #334155 0%, #0f172a 100%)" }}
            >
              Hire Me
            </a>
          </div>
        </div>
      </div>

      {/* ═══ Right Panel: Dynamic content based on active view ═══ */}
      <div className="flex-1 min-w-0 flex flex-col min-h-0 border-l border-slate-200/60 bg-gradient-to-br from-slate-50/80 via-white to-slate-50/20">

        {activeView === "home" && (
          <>
            {/* Hero intro banner — minimal */}
            <div className="shrink-0 px-5 lg:px-7 pt-4 lg:pt-5 pb-3 lg:pb-4 border-b border-slate-100 bg-white/70 backdrop-blur-sm">
              <h1 className="text-xl sm:text-2xl lg:text-[28px] font-black text-slate-900 leading-tight tracking-tight">
                {hero.headline.replace(profile.firstName, "").trim()}{" "}
                <span className="bg-gradient-to-r from-slate-700 to-slate-500 bg-clip-text text-transparent">{profile.firstName}</span>
              </h1>
              <p className="mt-1 text-xs lg:text-[13px] text-slate-500 leading-relaxed max-w-lg">{hero.subheadline}</p>
            </div>

            {/* Chat with embedded avatar */}
            <div className="flex-1 min-h-0 flex flex-col">
              <ChatInterface onAiResponse={handleAiResponse} embedded avatarSlot={avatarElement} />
            </div>
          </>
        )}

        {activeView === "experience" && <ExperiencePanel />}
        {activeView === "projects" && <ProjectsPanel />}
      </div>
    </div>
  );
}
