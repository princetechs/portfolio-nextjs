"use client";

/**
 * Live2D Avatar — CDN script loading (pixi.js v6 + pixi-live2d-display)
 *
 * Script load order (each depends on the previous):
 *   1. pixi.js          → window.PIXI
 *   2. live2d.min.js    → window.Live2D  (Cubism 2 runtime)
 *   3. live2dcubismcore → window.Live2DCubismCore (Cubism 4 runtime)
 *   4. pixi-live2d-display → window.PIXI.live2d.Live2DModel
 *
 * Lip-sync architecture:
 *   - `speak()` sets mouthTarget ref based on word vowel density via onboundary
 *   - PixiJS LOW-priority ticker lerps mouthSmooth → mouthTarget each frame,
 *     then writes the result. LOW priority runs AFTER the motion system
 *     (NORMAL priority), so our write is the final one before each render.
 *   - This eliminates the race condition where setInterval writes get
 *     overwritten by the motion system mid-frame.
 */

import { useEffect, useRef, useState, useCallback } from "react";

const PIXI_URL        = "https://cdn.jsdelivr.net/npm/pixi.js@6.5.10/dist/browser/pixi.min.js";
const CUBISM2_URL     = "https://cdn.jsdelivr.net/gh/dylanNew/live2d@master/webgl/Live2D/lib/live2d.min.js";
const CUBISM4_URL     = "https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js";
const LIVE2D_DISP_URL = "https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.4.0/dist/index.min.js";

// Mark — official Live2D Cubism 4 adult male sample model (self-hosted)
const MODEL_URL = "/mark/Mark.model3.json";

const MOUTH_IDS = ["PARAM_MOUTH_OPEN_Y", "ParamMouthOpenY", "PARAM_MOUTH_OPEN"];

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
  const core = model?.internalModel?.coreModel;
  if (!core) return;
  const v = Math.max(0, Math.min(1, value));
  if (typeof core.setParameterValueById === "function") {
    for (const id of MOUTH_IDS) try { core.setParameterValueById(id, v); } catch { /**/ }
    return;
  }
  if (typeof core.setParamFloat === "function") {
    for (const id of MOUTH_IDS) try { core.setParamFloat(id, v); } catch { /**/ }
    return;
  }
  if (typeof core.getParameterIndex === "function") {
    for (const id of MOUTH_IDS) {
      try {
        const idx: number = core.getParameterIndex(id);
        if (idx >= 0) core.setParameterValueByIndex(idx, v);
      } catch { /**/ }
    }
  }
}

/** Estimate mouth openness from a word — higher vowel density = more open. */
function vowelScore(word: string): number {
  const w = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
  if (!w.length) return 0.05;
  const vowels = (w.match(/[aeiou]/g) || []).length;
  return Math.min(0.95, 0.08 + (vowels / w.length) * 0.87);
}

export interface AvatarDisplayProps {
  onReady?: (speak: (text: string) => void) => void;
}

export default function AvatarDisplay({ onReady }: AvatarDisplayProps) {
  const mountRef     = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const appRef       = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modelRef     = useRef<any>(null);
  const isSpeaking   = useRef(false);
  // Ticker reads these refs — speak() only writes them
  const mouthTarget  = useRef(0);   // desired mouth openness [0, 1]
  const mouthSmooth  = useRef(0);   // current smoothed value (what ticker writes)
  const wordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [loading,  setLoading]  = useState(true);
  const [loadMsg,  setLoadMsg]  = useState("Initializing…");
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

    const utt    = new SpeechSynthesisUtterance(text);
    utt.rate     = 0.9;
    utt.pitch    = 0.95;   // slightly lower pitch — male voice
    utt.volume   = 0.9;

    // Prefer a male English voice
    const voices = window.speechSynthesis.getVoices();
    const voice  =
      voices.find((v) => v.lang.startsWith("en") && /male|man/i.test(v.name)) ??
      voices.find((v) => v.lang.startsWith("en-US")) ??
      voices.find((v) => v.lang.startsWith("en")) ??
      voices[0];
    if (voice) utt.voice = voice;

    // onboundary fires per word in Chrome/Edge — use vowel density of each
    // word to drive how wide the mouth opens for that syllable group.
    utt.onboundary = (e: SpeechSynthesisEvent) => {
      if (e.name !== "word") return;
      if (wordTimerRef.current) clearTimeout(wordTimerRef.current);
      const word = text.slice(e.charIndex, e.charIndex + (e.charLength ?? 5));
      mouthTarget.current = vowelScore(word);
      // After the word finishes, relax to near-closed (natural breath gap)
      const holdMs = Math.max(70, ((e.charLength ?? 4) * 55) / utt.rate);
      wordTimerRef.current = setTimeout(() => {
        mouthTarget.current = 0.04;
      }, holdMs);
    };

    utt.onstart = () => {
      isSpeaking.current  = true;
      mouthTarget.current = 0.22; // pre-open as speech starts
    };

    utt.onend = utt.onerror = () => {
      isSpeaking.current  = false;
      mouthTarget.current = 0;
      if (wordTimerRef.current) { clearTimeout(wordTimerRef.current); wordTimerRef.current = null; }
    };

    window.speechSynthesis.speak(utt);
  }, [stopSpeaking]);

  /* ── init ── */
  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const el = mountRef.current;
      if (!el) return;

      try {
        setLoadMsg("Loading PixiJS…"); setProgress(10);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await loadScript(PIXI_URL, () => !!(window as any).PIXI?.Application);
        if (cancelled) return;

        setLoadMsg("Loading Cubism 2 runtime…"); setProgress(25);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await loadScript(CUBISM2_URL, () => !!(window as any).Live2D);
        if (cancelled) return;

        setLoadMsg("Loading Cubism 4 runtime…"); setProgress(40);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await loadScript(CUBISM4_URL, () => !!(window as any).Live2DCubismCore);
        if (cancelled) return;

        setLoadMsg("Loading Live2D display…"); setProgress(55);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await loadScript(LIVE2D_DISP_URL, () => !!(window as any).PIXI?.live2d?.Live2DModel);
        if (cancelled) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const PIXI      = (window as any).PIXI;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Live2DModel = (window as any).PIXI?.live2d?.Live2DModel as any;
        if (!Live2DModel) throw new Error("pixi-live2d-display did not expose window.PIXI.live2d.Live2DModel");

        Live2DModel.registerTicker(PIXI.Ticker);

        setLoadMsg("Creating renderer…"); setProgress(65);

        const w = el.clientWidth  || 400;
        const h = el.clientHeight || 600;

        const app = new PIXI.Application({
          backgroundAlpha:   0,
          clearBeforeRender: false,
          width:  w,
          height: h,
          antialias:   true,
          resolution:  Math.min(window.devicePixelRatio ?? 1, 2),
          autoDensity: true,
        });

        // Clear any orphaned canvas from previous mount (React StrictMode / HMR)
        el.innerHTML = "";
        el.appendChild(app.view);
        appRef.current = app;
        if (cancelled) { app.destroy(true); return; }

        setLoadMsg("Fetching model…"); setProgress(78);

        const model = await Live2DModel.from(MODEL_URL, { autoInteract: false });
        if (cancelled) { app.destroy(true); return; }

        setProgress(92);
        app.stage.addChild(model);

        // Guard: model dimensions must be valid
        const mw = model.width  || 400;
        const mh = model.height || 600;
        const scale = Math.min(w / mw, h / mh) * 0.92;
        model.scale.set(scale);
        model.anchor.set(0.5, 0.5);
        model.position.set(w / 2, h / 2);

        el.addEventListener("pointermove", (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          model.focus(e.clientX - r.left, e.clientY - r.top);
        });

        modelRef.current = model;

        // ── Idle motion loop ─────────────────────────────────────────────
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mm = model.internalModel.motionManager as any;
        const playIdle = () => { try { model.motion("Idle"); } catch { /**/ } };
        playIdle();
        mm.on?.("motionFinish", () => { if (!cancelled) playIdle(); });

        // ── Lip-sync: LOW-priority ticker ────────────────────────────────
        // Runs after the motion system each frame, writes smoothed mouth value.
        // Works for both Cubism 2 and Cubism 4 (pixi-live2d-display@0.4.0
        // calls coreModel.update() inside internalModel.update at NORMAL priority,
        // so our LOW write here is still the last write before the renderer).
        app.ticker.add(() => {
            const tgt = isSpeaking.current ? mouthTarget.current : 0;
            const lf  = mouthSmooth.current < tgt ? 0.32 : 0.10;
            mouthSmooth.current += (tgt - mouthSmooth.current) * lf;
            if (mouthSmooth.current > 0.005 || tgt > 0) {
              writeMouthParam(modelRef.current, mouthSmooth.current);
            }
          }, null, PIXI.UPDATE_PRIORITY.LOW);

        setProgress(100);
        setLoading(false);
        onReady?.(speak);

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[AvatarDisplay] init failed:", msg);
        if (!cancelled) {
          setErrMsg(msg);
          setFallback(true);
          setLoading(false);
          onReady?.(() => {});
        }
      }
    }

    boot();

    return () => {
      cancelled = true;
      stopSpeaking();
      try { appRef.current?.destroy(true, { children: true, texture: true }); } catch { /**/ }
    };
  }, [onReady, speak, stopSpeaking]);

  /* ── render ── */
  return (
    <div className="relative w-full aspect-[4/5] lg:aspect-auto lg:h-[600px] rounded-3xl overflow-hidden shadow-2xl shadow-violet-500/10 border border-white/50 bg-gradient-to-br from-violet-50/60 to-indigo-50/60 backdrop-blur-sm transition-all duration-500 hover:shadow-violet-500/20">

      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: loading || fallback ? "none" : "block" }}
      />

      {/* ── Fallback ── */}
      {fallback && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-violet-50 via-indigo-50 to-blue-50 p-6">
          <div className="relative mb-5">
            <div className="w-36 h-36 rounded-full bg-gradient-to-br from-violet-500 via-indigo-600 to-blue-600 flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-violet-500/40">
              SP
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">Sandip Parida</p>
          <p className="text-violet-600 font-semibold">Full-Stack Developer</p>
          <p className="text-slate-400 text-sm mt-0.5">BetaCraft · Pune, India</p>
          {errMsg && (
            <p className="text-xs text-red-400 mt-3 max-w-[240px] text-center break-words">⚠ {errMsg}</p>
          )}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 rounded-3xl z-20">
          <div className="relative mb-5">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#e8e5ff" strokeWidth="7" />
              <circle
                cx="40" cy="40" r="34" fill="none"
                stroke="url(#ring-grad)" strokeWidth="7" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 34 * progress / 100} 999`}
                className="transition-all duration-300"
              />
              <defs>
                <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#7c4dff" />
                  <stop offset="100%" stopColor="#4f8af8" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-violet-700 text-lg font-black">
              {progress}%
            </div>
          </div>
          <p className="text-sm font-bold text-slate-700 tracking-wide">Loading Avatar</p>
          <p className="text-xs text-slate-400 mt-1">{loadMsg}</p>
          <div className="mt-5 flex gap-1.5 items-end h-5">
            {[0.6, 1, 0.75, 1.1, 0.5, 0.9, 0.65].map((h, i) => (
              <span
                key={i}
                className="w-1.5 rounded-full bg-violet-400 animate-bounce"
                style={{ height: `${h * 18}px`, animationDelay: `${i * 0.07}s`, animationDuration: "0.7s" }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
