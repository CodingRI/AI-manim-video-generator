"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import VideoSkeleton from "@/components/ui/VideoSkeleton";
import IntroTransition from "@/components/IntroTransition";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Maximize2,
  Crown,
  ChevronDown,
  Sparkles,
  Cpu,
  Wand2,
  Video,
  Clock,
  Zap,
  Volume2,
  VolumeX,
} from "lucide-react";

export default function VideoGeneratorPage() {
  const [showIntro, setShowIntro] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState("30s");
  const [quality, setQuality] = useState("720p");
  const [openDropdown, setOpenDropdown] = useState<
    null | "duration" | "quality"
  >(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [videoTime, setVideoTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [enhanceActive, setEnhanceActive] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("DeepSeek Chat");

  const searchParams = useSearchParams();
  const jobIdFromUrl = searchParams.get("jobId");
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  // Check intro ONCE on mount — do NOT set sessionStorage here
  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = sessionStorage.getItem("intro_seen");
    if (!seen) {
      setShowIntro(true);
    } else {
      setIntroDone(true);
    }
  }, []);

  function handleIntroDone() {
    setShowIntro(false);
    setIntroDone(true);
    // sessionStorage is set inside IntroTransition after animation completes
  }

  useEffect(() => {
    const saved = localStorage.getItem("lastPrompt");
    if (saved) setPrompt(saved);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setVideoTime(v.currentTime);
    const onDur = () => setVideoDuration(v.duration);
    const onEnd = () => setIsPlaying(false);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onDur);
    v.addEventListener("ended", onEnd);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onDur);
      v.removeEventListener("ended", onEnd);
    };
  }, [videoUrl]);

  useEffect(() => {
    if (jobIdFromUrl) {
      setJobId(jobIdFromUrl);
      setIsGenerating(true);
    }
    if (!jobIdFromUrl && !jobId) {
      setIsInitialLoading(false);
    }
  }, [jobIdFromUrl]);

  useEffect(() => {
    const activeJobId = jobIdFromUrl || jobId;
    if (!activeJobId) return;
    let interval: NodeJS.Timeout;
    let attempts = 0;
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/job-status?id=${activeJobId}`);
        if (!res.ok) {
          attempts++;
          if (attempts > 10) clearInterval(interval);
          return;
        }
        const data = await res.json();
        const job = data.job;
        if (!job || !job.status) return;
        setIsInitialLoading(false);
        attempts = 0;
        if (job.prompt) setPrompt(job.prompt);
        if (job.videoUrl) setVideoUrl(job.videoUrl);
        if (job.status === "pending") {
          setProgress(20);
          setIsGenerating(true);
        }
        if (job.status === "processing") {
          setProgress(60);
          setIsGenerating(true);
        }
        if (job.status === "completed") {
          setProgress(100);
          setIsGenerating(false);
          setVideoUrl(job.videoUrl || "");
          clearInterval(interval);
          return;
        }
        if (job.status === "failed") {
          setIsGenerating(false);
          clearInterval(interval);
          return;
        }
      } catch {
        /* retry */
      }
    };
    const t = setTimeout(() => {
      fetchStatus();
      interval = setInterval(fetchStatus, 5000);
    }, 1000);
    return () => {
      clearTimeout(t);
      if (interval) clearInterval(interval);
    };
  }, [jobId]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setVideoUrl("");
    setProgress(0);
    if (jobIdFromUrl) {
      alert("Video already exists or is processing");
      return;
    }
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, duration, quality }),
    });
    if (!res.ok) {
      const e = await res.json();
      alert(e.error || "Failed");
      setIsGenerating(false);
      return;
    }
    const { jobId: newId } = await res.json();
    setJobId(newId);
    router.push(`/videoGeneration?jobId=${newId}`);
    localStorage.setItem("jobStatus", "pending");
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();
    setIsPlaying(!isPlaying);
  };
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };
  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !videoDuration) return;
    videoRef.current.currentTime =
      ((e.clientX - e.currentTarget.getBoundingClientRect().left) /
        e.currentTarget.getBoundingClientRect().width) *
      videoDuration;
  };
  const fmt = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60)
      .toString()
      .padStart(2, "0")}`;
  };

  const models = ["DeepSeek Chat", "DeepSeek Coder", "GPT-4o", "Claude Sonnet"];

  if (isInitialLoading && introDone) return <VideoSkeleton />;

  return (
    <>
      {showIntro && <IntroTransition onDone={handleIntroDone} />}
      <div
        className={`flex-1 flex flex-col px-4 md:px-8 py-8 min-w-0 overflow-y-auto transition-opacity duration-500 ${
          introDone ? "opacity-100" : "opacity-0"
        }`}
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        <div className="mb-6">
          <h1 className="text-lg font-medium text-neutral-100 tracking-tight mb-1">
            Create your video
          </h1>
          <p className="text-xs text-neutral-600">
            Describe a math concept and watch it come to life
          </p>
        </div>

        <div className="relative mb-5">
          {videoUrl && (
            <div className="absolute inset-0 rounded-2xl blur-2xl opacity-20 bg-[#7F77DD] scale-95 -z-10" />
          )}
          <div className="bg-[#0c0c10] border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="relative h-48 sm:h-64 md:h-72 bg-[#050508] flex items-center justify-center">
              {isGenerating && (
                <div className="flex flex-col items-center gap-4 w-full max-w-xs px-4">
                  <div className="flex gap-1.5">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-1 bg-[#7F77DD] rounded-full animate-pulse"
                        style={{
                          height: `${16 + Math.sin(i) * 8}px`,
                          animationDelay: `${i * 0.12}s`,
                          animationDuration: "1s",
                        }}
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
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-neutral-800 flex items-center justify-center text-neutral-700">
                    <Video size={20} />
                  </div>
                  <p className="text-[10px] text-neutral-700 tracking-widest uppercase">
                    no video yet
                  </p>
                </div>
              )}
              {videoUrl && !isGenerating && (
                <button
                  onClick={() => videoRef.current?.requestFullscreen()}
                  className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-black/60 transition-all"
                >
                  <Maximize2 size={12} />
                </button>
              )}
            </div>
            <div className="px-3 md:px-4 py-3 border-t border-neutral-800/60">
              <div
                className="w-full h-1 bg-neutral-800 rounded-full mb-3 cursor-pointer relative group"
                onClick={seek}
              >
                <div
                  className="absolute inset-y-0 left-0 bg-[#7F77DD] rounded-full transition-all"
                  style={{
                    width: videoDuration
                      ? `${(videoTime / videoDuration) * 100}%`
                      : "0%",
                  }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#7F77DD] border-2 border-[#050508] opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    left: videoDuration
                      ? `calc(${(videoTime / videoDuration) * 100}% - 5px)`
                      : "0",
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <button
                    onClick={() => {
                      if (videoRef.current) videoRef.current.currentTime -= 10;
                    }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-all"
                  >
                    <SkipBack size={13} />
                  </button>
                  <button
                    onClick={togglePlay}
                    className="w-8 h-8 rounded-lg bg-[#7F77DD]/15 border border-[#7F77DD]/25 flex items-center justify-center text-[#9d98e8] hover:bg-[#7F77DD]/25 transition-all"
                  >
                    {isPlaying ? (
                      <Pause size={13} />
                    ) : (
                      <Play size={13} className="ml-0.5" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (videoRef.current) videoRef.current.currentTime += 10;
                    }}
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
                  <span className="hidden sm:block text-[10px] text-neutral-600 ml-1 tabular-nums">
                    {fmt(videoTime)} / {fmt(videoDuration)}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-700 border border-neutral-800 rounded px-1.5 py-0.5">
                  {quality}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0c0c10] border border-neutral-800 rounded-2xl p-4 mb-4">
          <textarea
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              localStorage.setItem("lastPrompt", e.target.value);
            }}
            placeholder="Explain derivatives with a graph animation..."
            className="w-full h-20 md:h-24 bg-transparent outline-none resize-none text-sm text-neutral-200 placeholder-neutral-700 leading-relaxed"
            style={{ fontFamily: "inherit" }}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-neutral-800/60">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <button
                  onClick={() =>
                    setOpenDropdown(
                      openDropdown === "duration" ? null : "duration"
                    )
                  }
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-lg text-[11px] text-neutral-400 hover:text-neutral-200 transition-all"
                >
                  <Clock size={11} />
                  {duration}
                  <ChevronDown size={10} />
                </button>
                {openDropdown === "duration" && (
                  <div className="absolute bottom-full mb-2 left-0 w-28 bg-[#0c0c10] border border-neutral-800 rounded-xl p-1.5 z-20">
                    {["30s", "1m", "5m", "10m"].map((d) => (
                      <button
                        key={d}
                        onClick={() => {
                          setDuration(d);
                          setOpenDropdown(null);
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-all"
                      >
                        {d}
                        {d === "10m" && (
                          <Crown size={10} className="text-amber-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() =>
                    setOpenDropdown(
                      openDropdown === "quality" ? null : "quality"
                    )
                  }
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-lg text-[11px] text-neutral-400 hover:text-neutral-200 transition-all"
                >
                  <Zap size={11} />
                  {quality}
                  <ChevronDown size={10} />
                </button>
                {openDropdown === "quality" && (
                  <div className="absolute bottom-full mb-2 left-0 w-24 bg-[#0c0c10] border border-neutral-800 rounded-xl p-1.5 z-20">
                    {["480p", "720p", "1080p"].map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setQuality(q);
                          setOpenDropdown(null);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-all"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setEnhanceActive(!enhanceActive)}
                title="Enhance prompt"
                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                  enhanceActive
                    ? "bg-[#7F77DD]/15 border-[#7F77DD]/40 text-[#9d98e8]"
                    : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700"
                }`}
              >
                <Wand2 size={12} />
              </button>
              <div className="relative">
                <button
                  onClick={() => setModelOpen(!modelOpen)}
                  title="Choose model"
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-500 hover:text-neutral-300 transition-all"
                >
                  <Cpu size={12} />
                </button>
                {modelOpen && (
                  <div className="absolute bottom-full mb-2 left-0 w-44 bg-[#0c0c10] border border-neutral-800 rounded-xl p-1.5 z-20">
                    <p className="text-[9px] uppercase tracking-widest text-neutral-600 px-2.5 py-1.5">
                      Model
                    </p>
                    {models.map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          setSelectedModel(m);
                          setModelOpen(false);
                        }}
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

        <div>
          <p className="text-[10px] uppercase tracking-widest text-neutral-700 mb-2.5">
            Suggestions
          </p>
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
    </>
  );
}
