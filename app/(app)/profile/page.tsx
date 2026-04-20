"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Camera, Mail, Calendar, Video, Zap, ChevronRight,
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

  // 🔥 DATA STATE
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch("/api/jobs");
        const data = await res.json();
        setJobs(data.jobs || []);
      } catch (err) {
        console.error("Failed to fetch jobs", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // avatar logic
  const oauthAvatar = session?.user?.image ?? null;
  const activeSrc = avatarSrc ?? oauthAvatar;
  const email = session?.user?.email ?? "—";

  const initials = (displayName || email)
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarSrc(URL.createObjectURL(file));
  }

  function saveName() {
    setDisplayName(nameInput.trim() || displayName);
    setEditingName(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // 🔥 REAL DATA
  const videosCreated = jobs.length;

  const creditsUsed = jobs.length * 10; // adjust later

  const activity = jobs.slice(0, 5).map((job) => ({
    title: job.prompt || "Untitled video",
    date: new Date(job.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    status: job.status,
  }));

  const joined = "—"; // optional later

  return (
    <div className="min-h-screen bg-[#050508] text-white flex">
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-2xl mx-auto">

          {/* HEADER */}
          <div className="mb-8">
            <h1 className="text-lg font-medium text-neutral-100">Profile</h1>
            <p className="text-xs text-neutral-600">Manage your account</p>
          </div>

          {/* PROFILE CARD */}
          <div className="bg-[#0c0c10] border border-neutral-800 rounded-2xl p-6 mb-4">
            <div className="flex items-start gap-5">

              {/* Avatar */}
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                  {activeSrc ? (
                    <img src={activeSrc} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg text-[#9d98e8]">{initials}</span>
                  )}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-[#7F77DD] rounded-lg flex items-center justify-center"
                >
                  <Camera size={10} />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* NAME */}
              <div className="flex-1">
                {editingName ? (
                  <div className="flex gap-2">
                    <input
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="bg-neutral-900 px-2 py-1 rounded"
                    />
                    <button onClick={saveName}><Check size={12} /></button>
                    <button onClick={() => setEditingName(false)}><X size={12} /></button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <span>{displayName || "Unnamed user"}</span>
                    <button onClick={() => setEditingName(true)}>
                      <Pencil size={12} />
                    </button>
                    {saved && <span className="text-[10px] text-green-500">saved</span>}
                  </div>
                )}

                <div className="text-xs text-neutral-600 flex gap-1 mt-1">
                  <Mail size={10} />
                  {email}
                </div>

                <div className="text-xs text-neutral-700 flex gap-1 mt-2">
                  <Calendar size={10} />
                  Joined {joined}
                </div>
              </div>

              {/* ✅ KEEP FREE PLAN */}
              <div className="flex-shrink-0">
                <div className="px-2.5 py-1 bg-[#7F77DD]/10 border border-[#7F77DD]/20 rounded-lg text-[10px] text-[#9d98e8]">
                  Free plan
                </div>
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800">
              <p className="text-xs text-neutral-600">Videos created</p>
              <p className="text-xl">{loading ? "—" : videosCreated}</p>
            </div>

            <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800">
              <p className="text-xs text-neutral-600">Credits used</p>
              <p className="text-xl">{loading ? "—" : creditsUsed}</p>
            </div>
          </div>

          {/* ACTIVITY */}
          <div className="bg-[#0c0c10] border border-neutral-800 rounded-2xl mb-4">
            <div className="px-5 py-3 border-b border-neutral-800 flex justify-between">
              <p className="text-xs text-neutral-600">Recent activity</p>
              <button onClick={() => router.push("/dashboard")}>
                <ChevronRight size={12} />
              </button>
            </div>

            <div>
              {activity.map((item, i) => (
                <div key={i} className="px-5 py-3 border-b border-neutral-800 text-sm text-neutral-400">
                  {item.title}
                  <span className="float-right text-xs text-neutral-600">
                    {item.date}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ✅ KEEP ACCOUNT SECTION UNCHANGED */}
          <div className="bg-[#0c0c10] border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-neutral-800">
              <p className="text-xs text-neutral-600">Account</p>
            </div>

            {[
              { label: "Change password", sub: "Update your login credentials" },
              { label: "Connected accounts", sub: session?.user?.image ? "Google / GitHub connected" : "No OAuth connected" },
              { label: "Delete account", sub: "Permanently remove your data", danger: true },
            ].map((row, i) => (
              <button
                key={i}
                className={`w-full flex justify-between px-5 py-3 border-b border-neutral-800 text-left ${
                  row.danger ? "hover:bg-red-500/5" : "hover:bg-neutral-800/20"
                }`}
              >
                <div>
                  <p className={row.danger ? "text-red-400" : "text-neutral-400"}>
                    {row.label}
                  </p>
                  <p className="text-xs text-neutral-600">{row.sub}</p>
                </div>
                <ChevronRight size={12} />
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}