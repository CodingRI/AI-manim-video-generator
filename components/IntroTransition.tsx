"use client";

import { useEffect, useState } from "react";

const PHRASES = [
  "welcome to manim studio",
  "experience math, visually",
  "your video is waiting",
];

interface IntroTransitionProps {
  onDone: () => void;
}

export default function IntroTransition({ onDone }: IntroTransitionProps) {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");
  const [screenOut, setScreenOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setPhase("in");
    const h = setTimeout(() => setPhase("hold"), 700);
    const o = setTimeout(() => setPhase("out"), 1600);
    const n = setTimeout(() => {
      if (phraseIdx < PHRASES.length - 1) {
        setPhraseIdx((i) => i + 1);
      } else {
        setScreenOut(true);
        setTimeout(() => {
          sessionStorage.setItem("intro_seen", "true");
          onDone();
        }, 650);
      }
    }, 2300);
    return () => {
      clearTimeout(h);
      clearTimeout(o);
      clearTimeout(n);
    };
  }, [mounted, phraseIdx]);

  const textOpacity = phase === "out" ? "opacity-0" : "opacity-100";

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050508] transition-opacity duration-700 ${
        screenOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      <div className="flex items-center gap-2.5 mb-12 opacity-40">
        <div className="w-6 h-6 rounded-lg bg-[#7F77DD] flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z"
              stroke="white"
              strokeWidth="1.2"
              fill="none"
            />
            <circle cx="7" cy="7" r="1.5" fill="white" />
          </svg>
        </div>
        <span className="text-xs font-medium text-neutral-600 tracking-tight">
          Manim Studio
        </span>
      </div>

      <p
        className={`text-center px-6 transition-opacity duration-500 ${
          mounted ? textOpacity : "opacity-0"
        }`}
        style={{
          fontFamily: "'Crimson Pro', Georgia, serif",
          fontStyle: "italic",
          fontSize: "clamp(1.2rem, 4vw, 1.75rem)",
          fontWeight: 300,
          color: "#e5e3f8",
          letterSpacing: "-0.01em",
        }}
      >
        {PHRASES[phraseIdx]}
      </p>

      <div className="flex gap-2 mt-10">
        {PHRASES.map((_, i) => (
          <div
            key={i}
            className={`h-px rounded-full transition-all duration-500 ${
              i === phraseIdx
                ? "w-7 bg-[#7F77DD]"
                : i < phraseIdx
                ? "w-3 bg-neutral-700"
                : "w-3 bg-neutral-800"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
