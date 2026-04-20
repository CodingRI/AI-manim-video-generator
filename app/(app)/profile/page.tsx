"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Camera, Mail, Calendar, Video, Zap, Clock,
  ChevronRight, LogOut, LayoutDashboard, Settings2,
  Check, Pencil, X
} from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(session?.user?.name ?? "");
  const [nameInput, setNameInput] = useState(session?.user?.name ?? "");
  const [saved, setSaved] = useState(false);

  // derive avatar: uploaded → oauth → initials
  const oauthAvatar = session?.user?.image ?? null;
  const activeSrc = avatarSrc ?? oauthAvatar;
  const email = session?.user?.email ?? "—";
  const initials = (displayName || email)
    .split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarSrc(url);
  }

  function saveName() {
    setDisplayName(nameInput.trim() || displayName);
    setEditingName(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const joined = "April 2026"; // swap with real createdAt from DB

  const stats = [
    { label: "Videos created", value: "14", icon: Video },
    { label: "Credits used", value: "680", icon: Zap },
    { label: "Avg render time", value: "2m 14s", icon: Clock },
  ];

  const activity = [
    { title: "Pythagorean theorem proof", date: "Mar 30", status: "done" },
    { title: "Derivatives & rate of change", date: "Mar 29", status: "done" },
    { title: "Neural network backprop", date: "Mar 29", status: "pending" },
    { title: "Fourier transform visualised", date: "Mar 28", status: "failed" },
    { title: "Linear algebra — matrices", date: "Mar 27", status: "done" },
  ];

  return (
    <div
      className="min-h-screen bg-[#050508] text-white flex overflow-hidden"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      {/* ── MAIN ── */}
      <div className="flex-1 overflow-y-auto px-8 py-8 min-w-0">
        <div className="max-w-2xl mx-auto">

          {/* header */}
          <div className="mb-8">
            <h1 className="text-lg font-medium text-neutral-100 tracking-tight mb-1">Profile</h1>
            <p className="text-xs text-neutral-600">Manage your account and preferences</p>
          </div>

          {/* ── AVATAR + NAME CARD ── */}
          <div className="bg-[#0c0c10] border border-neutral-800 rounded-2xl p-6 mb-4">
            <div className="flex items-start gap-5">

              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                  {activeSrc ? (
                    <img src={activeSrc} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-medium text-[#9d98e8]">{initials}</span>
                  )}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-lg bg-[#7F77DD] border border-[#050508] flex items-center justify-center hover:bg-[#6e66cc] transition-colors"
                  title="Upload photo"
                >
                  <Camera size={10} className="text-white" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>

              {/* Name + email */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={nameInput}
                        onChange={e => setNameInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                        className="bg-neutral-900 border border-[#7F77DD]/40 rounded-lg px-2.5 py-1 text-sm text-neutral-200 outline-none w-44"
                        style={{ fontFamily: "inherit" }}
                      />
                      <button onClick={saveName} className="w-6 h-6 rounded-lg bg-[#7F77DD]/15 border border-[#7F77DD]/30 flex items-center justify-center text-[#9d98e8] hover:bg-[#7F77DD]/25 transition-all">
                        <Check size={11} />
                      </button>
                      <button onClick={() => setEditingName(false)} className="w-6 h-6 rounded-lg flex items-center justify-center text-neutral-600 hover:text-neutral-400 hover:bg-neutral-800 transition-all">
                        <X size={11} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-100">
                        {displayName || "Unnamed user"}
                      </span>
                      <button
                        onClick={() => { setNameInput(displayName); setEditingName(true); }}
                        className="w-5 h-5 rounded flex items-center justify-center text-neutral-700 hover:text-neutral-400 transition-colors"
                      >
                        <Pencil size={10} />
                      </button>
                      {saved && <span className="text-[10px] text-[#1D9E75]">saved</span>}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-neutral-600 mb-3">
                  <Mail size={10} />
                  <span>{email}</span>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-neutral-700">
                  <Calendar size={10} />
                  <span>Joined {joined}</span>
                </div>
              </div>

              {/* Plan badge */}
              <div className="flex-shrink-0">
                <div className="px-2.5 py-1 bg-[#7F77DD]/10 border border-[#7F77DD]/20 rounded-lg text-[10px] text-[#9d98e8] tracking-wide">
                  Pro plan
                </div>
              </div>
            </div>
          </div>

          {/* ── STAT CARDS ── */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {stats.map(s => (
              <div key={s.label} className="bg-neutral-900 rounded-xl p-4 border border-neutral-800/60">
                <div className="flex items-center gap-2 mb-2">
                  <s.icon size={11} className="text-neutral-600" />
                  <span className="text-[10px] text-neutral-600 uppercase tracking-widest">{s.label}</span>
                </div>
                <p className="text-xl font-medium text-neutral-200">{s.value}</p>
              </div>
            ))}
          </div>

          {/* ── RECENT ACTIVITY ── */}
          <div className="bg-[#0c0c10] border border-neutral-800 rounded-2xl overflow-hidden mb-4">
            <div className="px-5 py-3.5 border-b border-neutral-800/60 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest text-neutral-600">Recent activity</p>
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-1 text-[10px] text-neutral-600 hover:text-neutral-400 transition-colors"
              >
                View all <ChevronRight size={10} />
              </button>
            </div>
            <div className="divide-y divide-neutral-800/40">
              {activity.map((item, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-neutral-800/20 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center flex-shrink-0">
                    {item.status === "done" && (
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <circle cx="5.5" cy="5.5" r="5" stroke="#1D9E75" strokeWidth="0.8"/>
                        <polyline points="3,5.5 5,7.5 8.5,4" stroke="#1D9E75" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      </svg>
                    )}
                    {item.status === "pending" && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-50" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                      </span>
                    )}
                    {item.status === "failed" && (
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <circle cx="5.5" cy="5.5" r="5" stroke="#E24B4A" strokeWidth="0.8"/>
                        <line x1="3.5" y1="3.5" x2="7.5" y2="7.5" stroke="#E24B4A" strokeWidth="1.1" strokeLinecap="round"/>
                        <line x1="7.5" y1="3.5" x2="3.5" y2="7.5" stroke="#E24B4A" strokeWidth="1.1" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="flex-1 text-xs text-neutral-400 truncate">{item.title}</span>
                  <span className="text-[10px] text-neutral-700 flex-shrink-0">{item.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── ACCOUNT SETTINGS ── */}
          <div className="bg-[#0c0c10] border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-neutral-800/60">
              <p className="text-[10px] uppercase tracking-widest text-neutral-600">Account</p>
            </div>
            {[
              { label: "Change password", sub: "Update your login credentials" },
              { label: "Notification preferences", sub: "Email alerts for completed videos" },
              { label: "Connected accounts", sub: session?.user?.image ? "Google / GitHub connected" : "No OAuth connected" },
              { label: "Delete account", sub: "Permanently remove your data", danger: true },
            ].map((row, i) => (
              <button
                key={i}
                className={`w-full flex items-center justify-between px-5 py-3.5 border-b border-neutral-800/40 last:border-0 transition-colors text-left ${row.danger ? "hover:bg-red-500/5" : "hover:bg-neutral-800/20"}`}
              >
                <div>
                  <p className={`text-xs ${row.danger ? "text-red-500/70" : "text-neutral-400"}`}>{row.label}</p>
                  <p className="text-[10px] text-neutral-700 mt-0.5">{row.sub}</p>
                </div>
                <ChevronRight size={12} className={row.danger ? "text-red-500/40" : "text-neutral-700"} />
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}