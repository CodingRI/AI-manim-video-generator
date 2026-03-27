"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    if (res.ok) {
      await signIn("credentials", {
        email,
        password,
        callbackUrl: "/dashboard",
      });
    }
  };

  const handleLogin = async () => {
    await signIn("credentials", {
      email,
      password,
      callbackUrl: "/dashboard",
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-zinc-800">
        <h1 className="text-3xl font-bold mb-6 text-center">
          {isLogin ? "Welcome back" : "Create an account"}
        </h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            isLogin ? handleLogin() : handleSignup();
          }}
          className="flex flex-col gap-4"
        >
          {!isLogin && (
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="p-3 rounded-lg bg-zinc-800 outline-none"
            />
          )}
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 rounded-lg bg-zinc-800 outline-none"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 pr-10 rounded-lg bg-zinc-800 outline-none"
            />
            <button
              type="submit"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button
            type="submit"
            className="bg-white text-black py-3 rounded-lg"
          >
            {!isLogin ? "Sign In" : "Sign up"}
          </button>
        </form>

        <div className="flex items-center gap-2 my-6">
          <div className="flex-1 h-px bg-gray-700" />
          <span className="text-sm text-gray-400">OR</span>
          <div className="flex-1 h-px bg-gray-700" />
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => signIn("google")}
            className="bg-zinc-800 py-3 rounded-lg hover:bg-zinc-700 transition"
          >
            Continue with Google
          </button>
          <button
            onClick={() => signIn("github")}
            className="bg-zinc-800 py-3 rounded-lg hover:bg-zinc-700 transition"
          >
            Continue with GitHub
          </button>
        </div>

        {/* Toggle */}
        <p className="text-sm text-center text-gray-400 mt-6">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <span
            onClick={() => setIsLogin(!isLogin)}
            className="ml-2 text-blue-400 cursor-pointer"
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </span>
        </p>
      </div>
    </main>
  );
}
