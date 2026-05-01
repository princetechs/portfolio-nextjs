"use client";

/**
 * Live2D Avatar — CDN script loading (pixi.js v6 + pixi-live2d-display)
 *
 * Lip-sync: speak() -> Web Speech API onboundary -> vowelScore -> mouthTarget
 * -> LOW-priority PixiJS ticker lerps & writes ParamMouthOpenY each frame.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import config from "@/lib/config";

const PIXI_URL        = "https://cdn.jsdelivr.net/npm/pixi.js@6.5.10/dist/browser/pixi.min.js";
const CUBISM2_URL     = "https://cdn.jsdelivr.net/gh/dylanNew/live2d@master/webgl/Live2D/lib/live2d.min.js";
const CUBISM4_URL     = "https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js";
const LIVE2D_DISP_URL = "https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.4.0/dist/index.min.js";

const MODEL_URL = "/mark/Mark.model3.json";
const MOUTH_PARAM_ID = "ParamMouthOpenY";

function loadScript(src: string, alreadyLoaded?: () => boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    if (alreadyLoaded?.()) { resolve(); return; }
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.onload  = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.head.appendChild(s);
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function writeMouthParam(model: any, value: number) {
  if (!model) return;
  const v = Math.max(0, Math.min(1, value));
  const core = model?.internalModel?.coreModel;
  if (!core) return;

  if (typeof core.setParameterValueById === "function") {
    try { core.setParameterValueById(MOUTH_PARAM_ID, v); } catch { /**/ }
    return;
  }
  if (typeof core.setParamFloat === "function") {
    try { core.setParamFloat(MOUTH_PARAM_ID, v); } catch { /**/ }
    return;
  }
  if (typeof core.getParameterIndex === "function") {
    try {
      const idx: number = core.getParameterIndex(MOUTH_PARAM_ID);
      if (idx >= 0) core.setParameterValueByIndex(idx, v);
    } catch { /**/ }
  }
}

function vowelScore(word: string): number {
  const w = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
  if (!w.length) return 0.05;
  const vowels = (w.match(/[aeiou]/g) || []).length;
  return Math.min(0.95, 0.08 + (vowels / w.length) * 0.87);
}

export interface AvatarDisplayProps {
  onReady?: (speak: (text: string) => void) => void;
  darkMode?: boolean;
}

export default function AvatarDisplay({ onReady, darkMode }: AvatarDisplayProps) {
  const mountRef     = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const appRef       = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modelRef     = useRef<any>(null);
  const isSpeaking   = useRef(false);
  const mouthTarget  = useRef(0);
  const mouthSmooth  = useRef(0);
  const wordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [loading,  setLoading]  = useState(true);
  const [loadMsg,  setLoadMsg]  = useState("Initializing...");
  const [progress, setProgress] = useState(0);
  const [fallback, setFallback] = useState(false);
  const [errMsg,   setErrMsg]   = useState("");

  const stopSpeaking = useCallback(() => {
    isSpeaking.current  = false;
    mouthTarget.current = 0;
    if (wordTimerRef.current) { clearTimeout(wordTimerRef.current); wordTimerRef.current = null; }
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    stopSpeaking();

    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.9; utt.pitch = 0.95; utt.volume = 0.9;

    const voices = window.speechSynthesis.getVoices();
    const voice =
      voices.find((v) => v.lang.startsWith("en") && /male|man/i.test(v.name)) ??
      voices.find((v) => v.lang.startsWith("en-US")) ??
      voices.find((v) => v.lang.startsWith("en")) ??
      voices[0];
    if (voice) utt.voice = voice;

    utt.onboundary = (e: SpeechSynthesisEvent) => {
      if (e.name !== "word") return;
      if (wordTimerRef.current) clearTimeout(wordTimerRef.current);
      const word = text.slice(e.charIndex, e.charIndex + (e.charLength ?? 5));
      mouthTarget.current = vowelScore(word);
      const holdMs = Math.max(70, ((e.charLength ?? 4) * 55) / utt.rate);
      wordTimerRef.current = setTimeout(() => { mouthTarget.current = 0.04; }, holdMs);
    };

    utt.onstart = () => { isSpeaking.current = true; mouthTarget.current = 0.22; };
    utt.onend = utt.onerror = () => {
      isSpeaking.current = false; mouthTarget.current = 0;
      if (wordTimerRef.current) { clearTimeout(wordTimerRef.current); wordTimerRef.current = null; }
    };

    window.speechSynthesis.speak(utt);
  }, [stopSpeaking]);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const el = mountRef.current;
      if (!el) return;

      try {
        setLoadMsg("Loading PixiJS..."); setProgress(10);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await loadScript(PIXI_URL, () => !!(window as any).PIXI?.Application);
        if (cancelled) return;

        setLoadMsg("Loading Cubism 2..."); setProgress(25);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await loadScript(CUBISM2_URL, () => !!(window as any).Live2D);
        if (cancelled) return;

        setLoadMsg("Loading Cubism 4..."); setProgress(40);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await loadScript(CUBISM4_URL, () => !!(window as any).Live2DCubismCore);
        if (cancelled) return;

        setLoadMsg("Loading Live2D..."); setProgress(55);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await loadScript(LIVE2D_DISP_URL, () => !!(window as any).PIXI?.live2d?.Live2DModel);
        if (cancelled) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const PIXI = (window as any).PIXI;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Live2DModel = (window as any).PIXI?.live2d?.Live2DModel as any;
        if (!Live2DModel) throw new Error("pixi-live2d-display did not load");
        Live2DModel.registerTicker(PIXI.Ticker);

        setLoadMsg("Creating renderer..."); setProgress(65);

        const w = el.clientWidth  || 380;
        const h = el.clientHeight || 500;

        const app = new PIXI.Application({
          backgroundAlpha:   0,
          width: w, height: h,
          antialias: true,
          resolution: Math.min(window.devicePixelRatio ?? 1, 2),
          autoDensity: true,
        });

        el.innerHTML = "";
        el.appendChild(app.view);
        // Ensure the canvas fills the container and clips
        const canvas = app.view as HTMLCanvasElement;
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.objectFit = "contain";
        canvas.style.display = "block";

        appRef.current = app;
        if (cancelled) { app.destroy(true); return; }

        setLoadMsg("Loading model..."); setProgress(78);

        const model = await Live2DModel.from(MODEL_URL, { autoInteract: false });
        if (cancelled) { app.destroy(true); return; }

        setProgress(92);
        app.stage.addChild(model);

        // Scale model to fit, center it, with a bit of bottom bias for portraits
        const mw = model.width || 400;
        const mh = model.height || 600;
        const scale = Math.min(w / mw, h / mh) * 0.88;
        model.scale.set(scale);
        model.anchor.set(0.5, 0.5);
        model.position.set(w / 2, h / 2 + 10);

        el.addEventListener("pointermove", (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          model.focus(e.clientX - r.left, e.clientY - r.top);
        });

        modelRef.current = model;

        // Idle motion loop
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mm = model.internalModel.motionManager as any;
        const playIdle = () => { try { model.motion("Idle"); } catch { /**/ } };
        playIdle();
        mm.on?.("motionFinish", () => { if (!cancelled) playIdle(); });

        // Lip-sync ticker (LOW priority = runs after motion system)
        app.ticker.add(() => {
          const tgt = isSpeaking.current ? mouthTarget.current : 0;
          const lf = mouthSmooth.current < tgt ? 0.35 : 0.12;
          mouthSmooth.current += (tgt - mouthSmooth.current) * lf;
          if (isSpeaking.current || mouthSmooth.current > 0.005) {
            writeMouthParam(modelRef.current, mouthSmooth.current);
          }
        }, null, PIXI.UPDATE_PRIORITY.LOW);

        setProgress(100);
        setLoading(false);
        onReady?.(speak);

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[AvatarDisplay] init failed:", msg);
        if (!cancelled) { setErrMsg(msg); setFallback(true); setLoading(false); onReady?.(() => {}); }
      }
    }

    boot();
    return () => {
      cancelled = true; stopSpeaking();
      try { appRef.current?.destroy(true, { children: true, texture: true }); } catch { /**/ }
    };
  }, [onReady, speak, stopSpeaking]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Canvas mount — clipped to container */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{ display: loading || fallback ? "none" : "block" }}
      />

      {/* Fallback */}
      {fallback && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-slate-500/30 mb-4">
            {config.profile.initials}
          </div>
          <p className={`text-lg font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>{config.profile.name}</p>
          <p className={`text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>{config.profile.title}</p>
          {errMsg && <p className="text-[10px] text-red-400 mt-2 max-w-[200px] text-center">{errMsg}</p>}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className={`absolute inset-0 flex flex-col items-center justify-center z-20 ${
          darkMode ? "bg-[#071318]/80 backdrop-blur-sm" : "bg-white/90"
        }`}>
          <div className="relative mb-4">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke={darkMode ? "rgba(255,255,255,0.06)" : "#e8e5ff"} strokeWidth="6" />
              <circle
                cx="40" cy="40" r="34" fill="none"
                stroke="url(#ring-grad-av)" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 34 * progress / 100} 999`}
                className="transition-all duration-300"
              />
              <defs>
                <linearGradient id="ring-grad-av" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#475569" />
                  <stop offset="100%" stopColor="#64748b" />
                </linearGradient>
              </defs>
            </svg>
            <div className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${
              darkMode ? "text-slate-300" : "text-slate-700"
            }`}>{progress}%</div>
          </div>
          <p className={`text-xs font-semibold ${darkMode ? "text-slate-300/80" : "text-slate-600"}`}>{loadMsg}</p>
          <div className="mt-3 flex gap-1 items-end h-4">
            {[0.5, 0.8, 0.6, 1, 0.4].map((h, i) => (
              <span key={i} className="w-1 rounded-full bg-slate-400/70 animate-bounce"
                style={{ height: `${h * 12}px`, animationDelay: `${i * 0.06}s`, animationDuration: "0.6s" }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
