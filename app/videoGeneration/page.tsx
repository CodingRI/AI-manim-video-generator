"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Play, Pause, SkipBack, SkipForward, Maximize2,
  Crown, ChevronDown, LayoutDashboard, User, LogOut,
  Sparkles, Cpu, Wand2, Settings2, ChevronLeft, ChevronRight,
  Video, Clock, Zap, X, Volume2, VolumeX
} from "lucide-react";

export default function VideoGeneratorPage() {
  const [loggedIn, setLoggedIn] = useState(true)
  const [jobId, setJobId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [sideOpen, setSideOpen] = useState(true);
  const [duration, setDuration] = useState("30s");
  const [quality, setQuality] = useState("720p");
  const [openDropdown, setOpenDropdown] = useState<null | "duration" | "quality">(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTime, setVideoTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [enhanceActive, setEnhanceActive] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("DeepSeek Chat");

  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setVideoTime(v.currentTime);
    const onDur = () => setVideoDuration(v.duration);
    const onEnded = () => setIsPlaying(false);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onDur);
    v.addEventListener("ended", onEnded);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onDur);
      v.removeEventListener("ended", onEnded);
    };
  }, [videoUrl]);


  useEffect(()=> {
    const storedLogin = localStorage.getItem("loggedIn")
    if(storedLogin === "true") {
      setLoggedIn(true)
    }
    const savedPrompt = localStorage.getItem("lastPrompt")
    if(savedPrompt) {
      setPrompt(savedPrompt)
    }
  },[])
  const handleGenerate = async () => {
    setIsGenerating(true);
    setVideoUrl("");
    setProgress(0);
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, duration, quality }),
    });
    const { jobId } = await res.json();
    setJobId(jobId);
    localStorage.setItem("activeJobId", jobId);
    localStorage.setItem("jobStatus", "pending");
    const interval = setInterval(async () => {
      const statusRes = await fetch(`/api/job-status?id=${jobId}`);
      const job = await statusRes.json();
      setProgress((prev) => Math.min(prev + 10, 90));
      if (job.status === "completed") {
        setVideoUrl(job.videoUrl);
        setProgress(100);
        setIsGenerating(false);
        clearInterval(interval);
      }
      if (job.status === "completed") {
        setVideoUrl(job.videoUrl);
        setProgress(100);
        setIsGenerating(false);
        localStorage.removeItem("activeJobId");
        localStorage.setItem("jobStatus", "done");
        clearInterval(interval);
      }
      if (job.status === "failed") {
        setIsGenerating(false);
        localStorage.removeItem("activeJobId");
        localStorage.setItem("jobStatus", "failed");
        clearInterval(interval);
      }
      if (job.status === "failed") {
        setIsGenerating(false);
        clearInterval(interval);
      }
    }, 2000);
  };

  useEffect(() => {
    const savedJob = localStorage.getItem("activeJobId");
    const savedStatus = localStorage.getItem("jobStatus");
  
    if (savedJob && savedStatus === "pending") {
      setIsGenerating(true);
      setProgress(30); 
  
      const interval = setInterval(async () => {
        const statusRes = await fetch(`/api/job-status?id=${savedJob}`);
        const job = await statusRes.json();
  
        setProgress((prev) => Math.min(prev + 5, 90));
  
        if (job.status === "completed") {
          setVideoUrl(job.videoUrl);
          setProgress(100);
          setIsGenerating(false);
          localStorage.removeItem("activeJobId");
          localStorage.setItem("jobStatus", "done");
          clearInterval(interval);
        }
  
        if (job.status === "failed") {
          setIsGenerating(false);
          localStorage.removeItem("activeJobId");
          localStorage.setItem("jobStatus", "failed");
          clearInterval(interval);
        }
      }, 2000);
    }
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) { videoRef.current.pause(); } else { videoRef.current.play(); }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !videoDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pct * videoDuration;
  };

  const fmt = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };
 
  const models = ["DeepSeek Chat", "DeepSeek Coder", "GPT-4o", "Claude Sonnet"];

  return (
    <div className="min-h-screen bg-[#050508] text-white flex overflow-hidden" style={{ fontFamily: "'JetBrains Mono', monospace" }}>

      {/* ── SIDE PANEL ── */}
      <div className={`relative flex-shrink-0 transition-all duration-300 ease-in-out ${sideOpen ? "w-56" : "w-0"} overflow-hidden`}>
        <div className="w-56 h-full bg-[#0c0c10] border-r border-neutral-800/60 flex flex-col py-6 px-4">

          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-10 px-1">
            <div className="w-7 h-7 rounded-lg bg-[#7F77DD] flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" stroke="white" strokeWidth="1.2" fill="none"/>
                <circle cx="7" cy="7" r="1.5" fill="white"/>
              </svg>
            </div>
            <span className="text-sm font-medium text-neutral-200 tracking-tight">Manim Studio</span>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-1 flex-1">
            <p className="text-[9px] uppercase tracking-widest text-neutral-600 px-2 mb-2">workspace</p>

            <button
              onClick={() => {}}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#7F77DD]/10 border border-[#7F77DD]/20 text-[#9d98e8] text-xs"
            >
              <Video size={13} />
              Generate
            </button>

            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50 text-xs transition-colors"
            >
              <LayoutDashboard size={13} />
              Dashboard
            </button>

            <button
              onClick={() => router.push("/profile")}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50 text-xs transition-colors"
            >
              <User size={13} />
              Profile
            </button>

            <div className="my-3 border-t border-neutral-800/60" />
            <p className="text-[9px] uppercase tracking-widest text-neutral-600 px-2 mb-2">settings</p>

            <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50 text-xs transition-colors">
              <Settings2 size={13} />
              Preferences
            </button>
          </nav>

          {/* Credits */}
          <div className="mt-auto">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 mb-4">
              <div className="flex justify-between text-[10px] text-neutral-500 mb-2">
                <span>Credits</span><span className="text-neutral-300">320 / 1000</span>
              </div>
              <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full w-[32%] bg-[#7F77DD] rounded-full" />
              </div>
            </div>

            <button
              onClick={() => { localStorage.removeItem("loggedIn"); router.push("/welcomePage"); }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-500/70 hover:text-red-400 hover:bg-red-500/5 text-xs transition-colors"
            >
              <LogOut size={13} />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* ── TOGGLE SIDE PANEL ── */}
      <button
        onClick={() => setSideOpen(!sideOpen)}
        className="absolute top-1/2 -translate-y-1/2 z-30 w-5 h-10 bg-neutral-800 border border-neutral-700 rounded-r-lg flex items-center justify-center text-neutral-500 hover:text-neutral-300 hover:bg-neutral-700 transition-all"
        style={{ left: sideOpen ? "224px" : "0px" }}
      >
        {sideOpen ? <ChevronLeft size={11} /> : <ChevronRight size={11} />}
      </button>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex flex-col px-8 py-8 min-w-0 overflow-y-auto">

        {/* Header */}
        <div className="mb-7">
          <h1 className="text-lg font-medium text-neutral-100 tracking-tight mb-1">Create your video</h1>
          <p className="text-xs text-neutral-600">Describe a math concept and watch it come to life</p>
        </div>

        {/* ── VIDEO PLAYER ── */}
        <div className="relative mb-6">
          {/* ambient glow */}
          {videoUrl && (
            <div className="absolute inset-0 rounded-2xl blur-2xl opacity-20 bg-[#7F77DD] scale-95 -z-10" />
          )}

          <div className="bg-[#0c0c10] border border-neutral-800 rounded-2xl overflow-hidden">

            {/* screen */}
            <div className="relative h-72 bg-[#050508] flex items-center justify-center">

              {isGenerating && (
                <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                  <div className="flex gap-1.5">
                    {[0,1,2,3,4].map(i => (
                      <div
                        key={i}
                        className="w-1 bg-[#7F77DD] rounded-full animate-pulse"
                        style={{ height: `${16 + Math.sin(i)*8}px`, animationDelay: `${i*0.12}s`, animationDuration: "1s" }}
                      />
                    ))}
                  </div>
                  <div className="w-full h-px bg-neutral-800 relative overflow-hidden rounded-full">
                    <div
                      className="absolute inset-y-0 left-0 bg-[#7F77DD] transition-all duration-500 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-neutral-600 tracking-widest uppercase">
                    generating &nbsp;{progress}%
                  </p>
                </div>
              )}

              {!isGenerating && videoUrl && (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-contain"
                />
              )}

              {!isGenerating && !videoUrl && (
                <div className="flex flex-col items-center gap-3 select-none">
                  <div className="w-14 h-14 rounded-full border border-neutral-800 flex items-center justify-center text-neutral-700">
                    <Video size={22} />
                  </div>
                  <p className="text-[10px] text-neutral-700 tracking-widest uppercase">no video yet</p>
                </div>
              )}

              {/* fullscreen btn */}
              {videoUrl && !isGenerating && (
                <button
                  onClick={() => videoRef.current?.requestFullscreen()}
                  className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-black/60 transition-all"
                >
                  <Maximize2 size={12} />
                </button>
              )}
            </div>

            {/* ── CONTROLS ── */}
            <div className="px-4 py-3 border-t border-neutral-800/60">

              {/* scrubber */}
              <div
                className="w-full h-1 bg-neutral-800 rounded-full mb-3 cursor-pointer relative group"
                onClick={seek}
              >
                <div
                  className="absolute inset-y-0 left-0 bg-[#7F77DD] rounded-full transition-all"
                  style={{ width: videoDuration ? `${(videoTime/videoDuration)*100}%` : "0%" }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#7F77DD] border-2 border-[#050508] opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: videoDuration ? `calc(${(videoTime/videoDuration)*100}% - 5px)` : "0" }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { if(videoRef.current) videoRef.current.currentTime -= 10; }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-all"
                  >
                    <SkipBack size={13} />
                  </button>

                  <button
                    onClick={togglePlay}
                    className="w-8 h-8 rounded-lg bg-[#7F77DD]/15 border border-[#7F77DD]/25 flex items-center justify-center text-[#9d98e8] hover:bg-[#7F77DD]/25 transition-all"
                  >
                    {isPlaying ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
                  </button>

                  <button
                    onClick={() => { if(videoRef.current) videoRef.current.currentTime += 10; }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-all"
                  >
                    <SkipForward size={13} />
                  </button>

                  <button
                    onClick={toggleMute}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-all"
                  >
                    {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                  </button>

                  <span className="text-[10px] text-neutral-600 ml-1 tabular-nums">
                    {fmt(videoTime)} / {fmt(videoDuration)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-neutral-700 border border-neutral-800 rounded px-1.5 py-0.5">{quality}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── PROMPT BOX ── */}
        <div className="bg-[#0c0c10] border border-neutral-800 rounded-2xl p-4 mb-4">

          <textarea
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value)
              localStorage.setItem("lastPrompt", e.target.value);
            }}
            placeholder="Explain derivatives with a graph animation..."
            className="w-full h-24 bg-transparent outline-none resize-none text-sm text-neutral-200 placeholder-neutral-700 leading-relaxed"
            style={{ fontFamily: "inherit" }}
          />

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-800/60">

            {/* Left controls */}
            <div className="flex items-center gap-2">

              {/* Duration */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === "duration" ? null : "duration")}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-lg text-[11px] text-neutral-400 hover:text-neutral-200 transition-all"
                >
                  <Clock size={11} />
                  {duration}
                  <ChevronDown size={10} />
                </button>
                {openDropdown === "duration" && (
                  <div className="absolute bottom-full mb-2 left-0 w-28 bg-[#0c0c10] border border-neutral-800 rounded-xl p-1.5 z-20">
                    {["30s","1m","5m","10m"].map((d) => (
                      <button
                        key={d}
                        onClick={() => { setDuration(d); setOpenDropdown(null); }}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-all"
                      >
                        {d}
                        {d === "10m" && <Crown size={10} className="text-amber-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quality */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === "quality" ? null : "quality")}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-lg text-[11px] text-neutral-400 hover:text-neutral-200 transition-all"
                >
                  <Zap size={11} />
                  {quality}
                  <ChevronDown size={10} />
                </button>
                {openDropdown === "quality" && (
                  <div className="absolute bottom-full mb-2 left-0 w-24 bg-[#0c0c10] border border-neutral-800 rounded-xl p-1.5 z-20">
                    {["480p","720p","1080p"].map((q) => (
                      <button
                        key={q}
                        onClick={() => { setQuality(q); setOpenDropdown(null); }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-all"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Enhance */}
              <button
                onClick={() => setEnhanceActive(!enhanceActive)}
                title="Enhance prompt with AI"
                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                  enhanceActive
                    ? "bg-[#7F77DD]/15 border-[#7F77DD]/40 text-[#9d98e8]"
                    : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700"
                }`}
              >
                <Wand2 size={12} />
              </button>

              {/* Model picker */}
              <div className="relative">
                <button
                  onClick={() => setModelOpen(!modelOpen)}
                  title="Choose model"
                  className="flex items-center gap-1.5 w-8 h-8 justify-center rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-500 hover:text-neutral-300 transition-all"
                >
                  <Cpu size={12} />
                </button>
                {modelOpen && (
                  <div className="absolute bottom-full mb-2 left-0 w-44 bg-[#0c0c10] border border-neutral-800 rounded-xl p-1.5 z-20">
                    <p className="text-[9px] uppercase tracking-widest text-neutral-600 px-2.5 py-1.5">Model</p>
                    {models.map((m) => (
                      <button
                        key={m}
                        onClick={() => { setSelectedModel(m); setModelOpen(false); }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-all flex items-center justify-between ${
                          selectedModel === m
                            ? "text-[#9d98e8] bg-[#7F77DD]/10"
                            : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                        }`}
                      >
                        {m}
                        {selectedModel === m && (
                          <div className="w-1.5 h-1.5 rounded-full bg-[#7F77DD]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-[#7F77DD] hover:bg-[#6e66cc] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-[11px] font-medium tracking-wide transition-all active:scale-95"
            >
              <Sparkles size={12} />
              {isGenerating ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>

        {/* Suggestions */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-neutral-700 mb-2.5">Suggestions</p>
          <div className="flex flex-wrap gap-2">
            {[
              "Explain sine waves visually",
              "Visualize Pythagoras theorem",
              "Show derivative of x² graph",
              "Animate Euler's identity",
            ].map((item) => (
              <button
                key={item}
                onClick={() => setPrompt(item)}
                className="px-3 py-1.5 text-[11px] bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:text-neutral-200 text-neutral-500 rounded-lg transition-all"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}