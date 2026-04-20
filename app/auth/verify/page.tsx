"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { ArrowLeft, RotateCcw } from "lucide-react";

export default function VerifyPage() {
  const params = useSearchParams();
  const router = useRouter();

  const email = params.get("email")!;
  const name = params.get("name")!;
  const password = params.get("password")!;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // countdown timer
  useEffect(() => {
    if (timer <= 0) { setCanResend(true); return; }
    const id = setTimeout(() => setTimer(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    setError("");
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...otp];
    pasted.split("").forEach((c, i) => { next[i] = c; });
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) { setError("Please enter the full 6-digit code"); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, name, password, otp: code }),
    });
    if (res.ok) {
      await signIn("credentials", { email, password, callbackUrl: "/videoGeneration" });
    } else {
      setError("Invalid code. Please try again.");
      setLoading(false);
    }
  };

  const handleResend = () => {
    setTimer(60);
    setCanResend(false);
    setOtp(["", "", "", "", "", ""]);
    setError("");
    inputRefs.current[0]?.focus();
    // wire to your resend API here
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      <div className="w-full max-w-sm animate-fade-up">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-7">
          <div className="w-7 h-7 rounded-lg bg-[#7F77DD] flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" stroke="white" strokeWidth="1.2" fill="none"/>
              <circle cx="7" cy="7" r="1.5" fill="white"/>
            </svg>
          </div>
          <span className="text-sm font-medium text-neutral-200 tracking-tight">Manim Studio</span>
        </div>

        {/* Heading */}
        <h1 className="text-xl font-medium text-neutral-100 tracking-tight mb-1">
          Check your email
        </h1>
        <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
          We sent a 6-digit code to{" "}
          <span className="text-neutral-300">{email}</span>
        </p>

        {/* Card */}
        <div className="bg-[#111111] border border-neutral-800 rounded-2xl p-6">

          {/* OTP inputs */}
          <div className="flex gap-2 justify-between mb-5" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onFocus={e => e.target.select()}
                className={`w-11 h-12 text-center text-base font-medium rounded-lg bg-neutral-900 border transition-all outline-none text-neutral-100 ${
                  digit
                    ? "border-[#7F77DD]/60 text-[#9d98e8]"
                    : "border-neutral-800 focus:border-[#7F77DD]/50"
                } ${error ? "border-red-500/40" : ""}`}
                style={{ fontFamily: "inherit" }}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <p className="text-[10px] text-red-400/80 mb-4 text-center">{error}</p>
          )}

          {/* Timer */}
          <div className="flex items-center justify-center mb-5">
            {canResend ? (
              <p className="text-[11px] text-neutral-600">Code expired</p>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#7F77DD] animate-pulse" />
                <p className="text-[11px] text-neutral-600 tabular-nums">
                  Code expires in{" "}
                  <span className="text-neutral-400">{fmt(timer)}</span>
                </p>
              </div>
            )}
          </div>

          {/* Verify button */}
          <button
            onClick={handleVerify}
            disabled={loading || otp.join("").length < 6}
            className="w-full bg-[#7F77DD] hover:bg-[#6e66cc] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-2.5 text-[11px] font-medium tracking-wide transition-all active:scale-[0.98]"
          >
            {loading ? "Verifying..." : "Verify email"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-neutral-800" />
          </div>

          {/* Resend */}
          <button
            onClick={handleResend}
            disabled={!canResend}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border text-[11px] transition-all ${
              canResend
                ? "border-neutral-700 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200 hover:bg-neutral-800/40"
                : "border-neutral-800 text-neutral-700 cursor-not-allowed"
            }`}
          >
            <RotateCcw size={11} />
            Resend code
          </button>
        </div>

        {/* Back to sign in */}
        <button
          onClick={() => router.push("/auth")}
          className="flex items-center gap-2 mt-5 mx-auto text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors"
        >
          <ArrowLeft size={11} />
          Back to sign in
        </button>

      </div>
    </main>
  );
}