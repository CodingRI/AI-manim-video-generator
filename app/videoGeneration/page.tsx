"use client"

import { useState, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, Maximize, Crown, ChevronDown } from "lucide-react";

export default function VideoGeneratorPage() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const [duration, setDuration] = useState("30s");
  const [quality, setQuality] = useState("720p");

  const [openDropdown, setOpenDropdown] = useState<null | "duration" | "quality">(null);

  const videoRef = useRef<any>(null);
  const [videoUrl, setVideoUrl] = useState("")

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
    
    const interval = setInterval(async () => {
      const statusRes = await fetch(`/api/job-status?id=${jobId}`);
      const job = await statusRes.json();
  
      console.log("JOB STATUS:", job.status);
      
      setProgress((prev) => Math.min(prev + 10, 120));

      if (job.status === "completed") {
        setVideoUrl(job.result.videoUrl);
        setIsGenerating(false);
        clearInterval(interval);
      }
  
      if (job.status === "failed") {
        setIsGenerating(false);
        clearInterval(interval);
      }
    }, 2000);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-4xl">

        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Create your video</h1>
          <p className="text-gray-500 text-sm">Describe your idea and generate a clean mathematical animation.</p>
        </div>

        {/* VIDEO PLAYER */}
        <div className="w-full bg-black rounded-2xl mb-6 border border-white/10 overflow-hidden">
          <div className="relative h-72 flex items-center justify-center">

            {isGenerating ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-400">Generating video... {progress}%</p>
              </div>
            ) : videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                />
              ) : (
                <button
                  onClick={togglePlay}
                  className="flex items-center justify-center w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 transition"
                >
                  {isPlaying ? <Pause /> : <Play />}
                </button>
              )}
            </div>

          {/* CONTROLS BAR */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 text-gray-300 text-sm">
            <div className="flex items-center gap-3">
              <button onClick={() => videoRef.current && (videoRef.current.currentTime -= 10)}>
                <SkipBack size={18} />
              </button>
              <button onClick={togglePlay}>{isPlaying ? <Pause size={18}/> : <Play size={18}/>}</button>
              <button onClick={() => videoRef.current && (videoRef.current.currentTime += 10)}>
                <SkipForward size={18} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => videoRef.current?.requestFullscreen()}>
                <Maximize size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* PROMPT */}
        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur mb-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Explain derivatives with a graph animation..."
            className="w-full h-28 bg-transparent outline-none resize-none text-base placeholder-gray-500"
          />

          <div className="flex justify-between items-center mt-4">

            {/* DROPDOWNS */}
            <div className="flex gap-3 relative">

              {/* Duration Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === "duration" ? null : "duration")}
                  className="flex items-center gap-2 px-3 py-1 border border-white/10 rounded-lg text-sm text-gray-300"
                >
                  {duration}
                  <ChevronDown size={14} />
                </button>

                {openDropdown === "duration" && (
                  <div className="absolute mt-2 w-32 bg-neutral-900 border border-white/10 rounded-xl p-2 space-y-1 z-10">
                    {["30s", "1m", "5m", "10m"].map((d) => (
                      <button
                        key={d}
                        onClick={() => {
                          setDuration(d);
                          setOpenDropdown(null);
                        }}
                        className="w-full text-left px-2 py-1 rounded hover:bg-white/10 text-sm flex items-center justify-between"
                      >
                        {d}
                        {d === "10m" && <Crown size={12} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quality Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === "quality" ? null : "quality")}
                  className="flex items-center gap-2 px-3 py-1 border border-white/10 rounded-lg text-sm text-gray-300"
                >
                  {quality}
                  <ChevronDown size={14} />
                </button>

                {openDropdown === "quality" && (
                  <div className="absolute mt-2 w-32 bg-neutral-900 border border-white/10 rounded-xl p-2 space-y-1 z-10">
                    {["480p", "720p", "1080p"].map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setQuality(q);
                          setOpenDropdown(null);
                        }}
                        className="w-full text-left px-2 py-1 rounded hover:bg-white/10 text-sm"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Generate */}
            <button
              onClick={handleGenerate}
              className="px-5 py-2 bg-white text-black rounded-lg text-sm hover:opacity-90 transition"
            >
              Generate
            </button>
          </div>
        </div>

        {/* Suggestions */}
        <div>
          <p className="text-gray-500 mb-2 text-sm">Suggestions</p>
          <div className="flex flex-wrap gap-2">
            {["Explain sine waves visually","Visualize Pythagoras theorem","Show derivative of x^2 graph"].map((item, i) => (
              <button
                key={i}
                onClick={() => setPrompt(item)}
                className="px-3 py-1 text-sm bg-white/5 border border-white/10 rounded-lg hover:bg-white/10"
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
