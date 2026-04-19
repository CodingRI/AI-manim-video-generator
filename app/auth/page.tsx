"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { redirect, useRouter } from "next/navigation";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();

  const handleSignup = async () => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (res.ok) {
      localStorage.setItem("loggedIn", "true");
      await signIn("credentials", {
        email,
        password,
        callbackUrl: "/videoGeneration",
      });
    }
  };
  const handleLogin = async () => {
    localStorage.setItem("loggedIn", "true");
    await signIn("credentials", {
      email,
      password,
      callbackUrl: "/videoGeneration",
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm animate-fade-up">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-7">
          <div className="w-7 h-7 rounded-lg bg-[#7F77DD] flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z"
                stroke="white"
                strokeWidth="1.2"
                fill="none"
              />
              <circle cx="7" cy="7" r="1.5" fill="white" />
            </svg>
          </div>
          <span className="text-sm font-medium text-neutral-200 tracking-tight">
            Manim Studio
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-xl font-medium text-neutral-100 tracking-tight mb-1">
          {isLogin ? "Welcome back" : "Create an account"}
        </h1>
        <p className="text-xs text-neutral-500 mb-6">
          {isLogin
            ? "Sign in to your account to continue"
            : "Start generating math videos today"}
        </p>

        {/* Form card */}
        <div className="bg-[#111111] border border-neutral-800 rounded-2xl p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              isLogin ? handleLogin() : handleSignup();
            }}
            className="flex flex-col gap-3"
          >
            {/* Name — animates in for signup */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                !isLogin ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="flex flex-col gap-1.5 pb-0.5">
                <label className="text-[10px] font-medium uppercase tracking-widest text-neutral-600">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-700 outline-none focus:border-[#7F77DD] transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-medium uppercase tracking-widest text-neutral-600">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-700 outline-none focus:border-[#7F77DD] transition-colors"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-medium uppercase tracking-widest text-neutral-600">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 pr-9 text-sm text-neutral-200 placeholder-neutral-700 outline-none focus:border-[#7F77DD] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full mt-1 bg-[#7F77DD] hover:bg-[#6e66cc] active:scale-[0.98] text-white rounded-lg py-2.5 text-sm font-medium tracking-tight transition-all"
            >
              {isLogin ? "Sign in" : "Create account"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-neutral-800" />
            <span className="text-[11px] text-neutral-600">or</span>
            <div className="flex-1 h-px bg-neutral-800" />
          </div>

          {/* OAuth */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => signIn("google")}
              className="w-full flex items-center justify-center gap-2.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 rounded-lg py-2.5 text-sm transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M13.3 7.15c0-.5-.04-1-.12-1.47H7v2.78h3.53a3.02 3.02 0 01-1.31 1.98v1.65h2.12c1.24-1.14 1.96-2.82 1.96-4.94z"
                  fill="#4285F4"
                />
                <path
                  d="M7 13.5c1.77 0 3.26-.59 4.34-1.59l-2.12-1.65c-.59.4-1.34.63-2.22.63-1.7 0-3.15-1.15-3.66-2.7H1.16v1.7A6.5 6.5 0 007 13.5z"
                  fill="#34A853"
                />
                <path
                  d="M3.34 8.19A3.9 3.9 0 013.13 7c0-.41.07-.82.2-1.19V4.11H1.16A6.5 6.5 0 00.5 7c0 1.05.25 2.04.66 2.89l2.18-1.7z"
                  fill="#FBBC05"
                />
                <path
                  d="M7 3.1c.96 0 1.82.33 2.5.97l1.87-1.87A6.45 6.45 0 007 .5 6.5 6.5 0 001.16 4.11l2.18 1.7C3.85 4.25 5.3 3.1 7 3.1z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>

            <button
              onClick={() => signIn("github")}
              className="w-full flex items-center justify-center gap-2.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 rounded-lg py-2.5 text-sm transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M7 0.5C3.41 0.5.5 3.41.5 7c0 2.88 1.87 5.32 4.47 6.18.33.06.45-.14.45-.31v-1.1c-1.82.4-2.2-.88-2.2-.88-.3-.76-.73-1-.73-1-.6-.4.04-.4.04-.4.66.05 1 .68 1 .68.59 1 1.54.71 1.91.54.06-.42.23-.71.42-.87-1.45-.16-2.98-.73-2.98-3.23 0-.71.25-1.3.68-1.75-.07-.17-.3-.83.06-1.73 0 0 .56-.18 1.83.68A6.37 6.37 0 017 3.73c.57 0 1.14.08 1.67.23 1.27-.86 1.83-.68 1.83-.68.36.9.13 1.56.06 1.73.42.45.68 1.04.68 1.75 0 2.5-1.53 3.07-2.99 3.23.24.2.45.6.45 1.21v1.8c0 .17.12.37.45.31C11.63 12.32 13.5 9.88 13.5 7c0-3.59-2.91-6.5-6.5-6.5z"
                  fill="currentColor"
                />
              </svg>
              Continue with GitHub
            </button>
          </div>
        </div>

        {/* Toggle */}
        <p className="text-xs text-center text-neutral-600 mt-5">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <span
            onClick={() => setIsLogin(!isLogin)}
            className="ml-1.5 text-[#7F77DD] hover:text-[#a09ae8] cursor-pointer transition-colors"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </span>
        </p>
      </div>
    </main>
  );
}
