"use client";

import { useEffect, useState } from "react";

const PHRASES = [
  "welcome to manim studio",
  "experience math, visually",
  "your video is waiting",
];

interface IntroTransitionProps {
  onDone: () => void;
  skip?: boolean; 
}

export default function IntroTransition({ onDone, skip }: IntroTransitionProps) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const [screenOut, setScreenOut] = useState(false);

  useEffect(() => {
    if (skip) { onDone(); return; }

    // tiny delay so first paint settles
    const start = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(start);
  }, []);

  useEffect(() => {
    if (!visible) return;

    // fade in → hold → fade out → next phrase / done
    setPhase("in");

    const holdTimer = setTimeout(() => setPhase("hold"), 700);
    const outTimer  = setTimeout(() => setPhase("out"), 1600);
    const nextTimer = setTimeout(() => {
      if (phraseIdx < PHRASES.length - 1) {
        setPhraseIdx((i) => i + 1);
      } else {
        // last phrase done — fade whole screen out then call onDone
        setScreenOut(true);
        setTimeout(onDone, 700);
      }
    }, 2300);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(outTimer);
      clearTimeout(nextTimer);
    };
  }, [visible, phraseIdx]);

  const opacity =
    phase === "in" ? "opacity-100" :
    phase === "hold" ? "opacity-100" :
    "opacity-0";

  return (
    <div
      className={`
        fixed inset-0 z-50 flex flex-col items-center justify-center
        bg-[#050508] transition-opacity duration-700
        ${screenOut ? "opacity-0" : "opacity-100"}
      `}
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      {/* Logo mark */}
      <div className="flex items-center gap-2.5 mb-12 opacity-60">
        <div className="w-6 h-6 rounded-lg bg-[#7F77DD] flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" stroke="white" strokeWidth="1.2" fill="none"/>
            <circle cx="7" cy="7" r="1.5" fill="white"/>
          </svg>
        </div>
        <span className="text-xs font-medium text-neutral-500 tracking-tight">Manim Studio</span>
      </div>

      {/* Phrase */}
      <p
        className={`
          text-2xl font-light text-neutral-200 tracking-tight
          transition-opacity duration-500 text-center px-6
          ${visible ? opacity : "opacity-0"}
        `}
        style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontStyle: "italic" }}
      >
        {PHRASES[phraseIdx]}
      </p>

      {/* Progress dots */}
      <div className="flex gap-1.5 mt-10">
        {PHRASES.map((_, i) => (
          <div
            key={i}
            className={`h-px transition-all duration-500 rounded-full ${
              i === phraseIdx
                ? "w-6 bg-[#7F77DD]"
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