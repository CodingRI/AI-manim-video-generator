"use client";

import { useRouter, usePathname } from "next/navigation";
import { Video, LayoutDashboard, User, Settings2 } from "lucide-react";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="w-56 h-full bg-[#0c0c10] border-r border-neutral-800/60 flex flex-col py-6 px-4">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10 px-1">
        <div className="w-7 h-7 rounded-lg bg-[#7F77DD] flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" stroke="white" strokeWidth="1.2"/>
            <circle cx="7" cy="7" r="1.5" fill="white" />
          </svg>
        </div>
        <span className="text-sm font-medium text-neutral-200">
          Manim Studio
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        <p className="text-[9px] uppercase tracking-widest text-neutral-600 px-2 mb-2">
          workspace
        </p>

        <button
          onClick={() => router.push("/videoGeneration")}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs ${
            pathname === "/videoGeneration"
              ? "bg-[#7F77DD]/10 border border-[#7F77DD]/20 text-[#9d98e8]"
              : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50"
          }`}
        >
          <Video size={13} />
          Generate
        </button>

        <button
          onClick={() => router.push("/dashboard")}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs ${
            pathname === "/dashboard"
              ? "bg-[#7F77DD]/10 border border-[#7F77DD]/20 text-[#9d98e8]"
              : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50"
          }`}
        >
          <LayoutDashboard size={13} />
          Dashboard
        </button>

        <button
          onClick={() => router.push("/profile")}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs ${
            pathname === "/profile"
              ? "bg-[#7F77DD]/10 border border-[#7F77DD]/20 text-[#9d98e8]"
              : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50"
          }`}
        >
          <User size={13} />
          Profile
        </button>

        <div className="my-3 border-t border-neutral-800/60" />

        <p className="text-[9px] uppercase tracking-widest text-neutral-600 px-2 mb-2">
          settings
        </p>

        <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50 text-xs">
          <Settings2 size={13} />
          Preferences
        </button>
      </nav>
    </div>
  );
}