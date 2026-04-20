"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import {
  Video, LayoutDashboard, User, Settings2,
  ChevronLeft, ChevronRight, Zap, LogOut
} from "lucide-react";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  const navItems = [
    { label: "Generate", icon: Video, path: "/videoGeneration" },
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Profile", icon: User, path: "/profile" },
  ];

  return (
    <>
      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Toggle button — always visible */}
      <button
        onClick={() => setOpen(!open)}
        className={`
          fixed top-1/2 -translate-y-1/2 z-40
          w-5 h-10 bg-neutral-800 border border-neutral-700
          rounded-r-lg flex items-center justify-center
          text-neutral-500 hover:text-neutral-300 hover:bg-neutral-700
          transition-all duration-300
        `}
        style={{ left: open ? "224px" : "0px" }}
      >
        {open ? <ChevronLeft size={11} /> : <ChevronRight size={11} />}
      </button>

      {/* Sidebar panel */}
      <div
        className={`
          fixed md:relative top-0 left-0 z-30
          h-full flex-shrink-0
          bg-[#0c0c10] border-r border-neutral-800/60
          flex flex-col py-6 px-4
          transition-all duration-300 ease-in-out
          ${open ? "w-56 translate-x-0" : "w-0 -translate-x-full md:-translate-x-0 md:w-0"}
          overflow-hidden
        `}
      >
        <div className="w-56 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-10 px-1 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-[#7F77DD] flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" stroke="white" strokeWidth="1.2" fill="none"/>
                <circle cx="7" cy="7" r="1.5" fill="white"/>
              </svg>
            </div>
            <span className="text-sm font-medium text-neutral-200 whitespace-nowrap">Manim Studio</span>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-1 flex-1">
            <p className="text-[9px] uppercase tracking-widest text-neutral-600 px-2 mb-2 whitespace-nowrap">
              workspace
            </p>

            {navItems.map(({ label, icon: Icon, path }) => (
              <button
                key={path}
                onClick={() => { router.push(path); setOpen(window.innerWidth >= 768); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                  pathname === path
                    ? "bg-[#7F77DD]/10 border border-[#7F77DD]/20 text-[#9d98e8]"
                    : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50"
                }`}
              >
                <Icon size={13} className="flex-shrink-0" />
                {label}
              </button>
            ))}

            <div className="my-3 border-t border-neutral-800/60" />
            <p className="text-[9px] uppercase tracking-widest text-neutral-600 px-2 mb-2 whitespace-nowrap">
              settings
            </p>
            <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50 text-xs whitespace-nowrap">
              <Settings2 size={13} className="flex-shrink-0" />
              Preferences
            </button>
          </nav>

          {/* Credits */}
          <div className="mt-auto flex-shrink-0">
            
            <button
              onClick={() => router.push("/auth")}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-500/70 hover:text-red-400 hover:bg-red-500/5 text-xs transition-colors whitespace-nowrap"
            >
              <LogOut size={13} className="flex-shrink-0" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}