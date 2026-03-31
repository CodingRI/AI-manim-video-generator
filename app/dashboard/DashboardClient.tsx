"use client";

import { useEffect, useRef, useState } from "react";
import { Play, TriangleAlert } from "lucide-react";

type Job = {
  id: string;
  prompt: string;
  status: string;
  videoUrl: string | null;
  createdAt: string;
};

type Stats = {
  total: number;
  done: number;
  pending: number;
  failed: number;
  successRate: number;
};

export default function DashboardClient({
  jobs,
  stats,
}: {
  jobs: Job[];
  stats: Stats;
}) {
  const [filter, setFilter] = useState<"all" | "done" | "pending" | "failed">(
    "all"
  );
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  const filtered =
    filter === "all" ? jobs : jobs.filter((j) => j.status === filter);

  // Build last-10-days usage data from jobs
  const usageData = (() => {
    const days: { label: string; credits: number; videos: number }[] = [];
    for (let i = 9; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const dayJobs = jobs.filter((j) => {
        const jd = new Date(j.createdAt);
        return (
          jd.getDate() === d.getDate() &&
          jd.getMonth() === d.getMonth() &&
          jd.getFullYear() === d.getFullYear()
        );
      });
      days.push({
        label,
        credits: dayJobs.length * 50,
        videos: dayJobs.filter((j) => j.status === "done").length,
      });
    }
    return days;
  })();

  useEffect(() => {
    if (!chartRef.current) return;
    if (typeof window === "undefined") return;

    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    script.onload = () => {
      const Chart = (window as any).Chart;
      if (chartInstance.current) chartInstance.current.destroy();
      chartInstance.current = new Chart(chartRef.current, {
        type: "line",
        data: {
          labels: usageData.map((d) => d.label),
          datasets: [
            {
              label: "Credits",
              data: usageData.map((d) => d.credits),
              borderColor: "#7F77DD",
              backgroundColor: "transparent",
              pointBackgroundColor: "#7F77DD",
              pointRadius: 3,
              pointHoverRadius: 5,
              borderWidth: 1.5,
              tension: 0.4,
              yAxisID: "y",
            },
            {
              label: "Videos",
              data: usageData.map((d) => d.videos),
              borderColor: "#1D9E75",
              backgroundColor: "transparent",
              pointBackgroundColor: "#1D9E75",
              pointRadius: 3,
              pointHoverRadius: 5,
              borderWidth: 1.5,
              tension: 0.4,
              yAxisID: "y1",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { mode: "index", intersect: false },
          },
          scales: {
            x: {
              ticks: { font: { size: 10 }, color: "#888780" },
              grid: { display: false },
              border: { display: false },
            },
            y: {
              position: "left",
              ticks: { font: { size: 10 }, color: "#888780", maxTicksLimit: 5 },
              grid: { color: "rgba(136,135,128,0.1)" },
              border: { display: false },
            },
            y1: {
              position: "right",
              ticks: {
                font: { size: 10 },
                color: "#1D9E75",
                stepSize: 1,
              },
              grid: { display: false },
              border: { display: false },
              min: 0,
              max: Math.max(4, ...usageData.map((d) => d.videos + 1)),
            },
          },
        },
      });
    };
    document.head.appendChild(script);
    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, []);

  const creditsUsed = stats.done * 50;
  const creditsTotal = 1000;
  const creditsPct = Math.min(
    100,
    Math.round((creditsUsed / creditsTotal) * 100)
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-white px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-lg font-medium text-white">Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Your generated math videos
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Total videos",
            value: stats.total,
            sub: `${stats.done} completed`,
          },
          {
            label: "Credits used",
            value: creditsUsed,
            sub: `of ${creditsTotal}`,
          },
          { label: "Pending", value: stats.pending, sub: "in queue" },
          {
            label: "Success rate",
            value: `${stats.successRate}%`,
            sub: "scenes rendered",
          },
        ].map((m) => (
          <div
            key={m.label}
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-4"
          >
            <p className="text-xs text-neutral-500 mb-1">{m.label}</p>
            <p className="text-2xl font-medium text-white">{m.value}</p>
            <p className="text-xs text-neutral-600 mt-1">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {/* Line chart */}
        <div className="col-span-3 bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <p className="text-sm font-medium text-white mb-1">
            Usage this month
          </p>
          <p className="text-xs text-neutral-500 mb-3">
            Credits & videos per day
          </p>
          <div className="flex gap-4 mb-3">
            <span className="flex items-center gap-2 text-xs text-neutral-400">
              <span className="block w-4 h-px bg-[#7F77DD]" />
              Credits
            </span>
            <span className="flex items-center gap-2 text-xs text-neutral-400">
              <span className="block w-4 h-px bg-[#1D9E75]" />
              Videos
            </span>
          </div>
          <div className="relative h-44">
            <canvas ref={chartRef} />
          </div>
        </div>

        {/* Credits card */}
        <div className="col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-white mb-1">Credits</p>
            <p className="text-xs text-neutral-500 mb-4">
              Pro plan · resets monthly
            </p>

            <div className="mb-4">
              <div className="flex justify-between text-xs text-neutral-400 mb-2">
                <span>Used</span>
                <span>
                  {creditsUsed} / {creditsTotal}
                </span>
              </div>
              <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#7F77DD] transition-all"
                  style={{ width: `${creditsPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-neutral-400 mb-2">
                <span>Completed scenes</span>
                <span>{stats.done * 4} est.</span>
              </div>
              <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#1D9E75]"
                  style={{ width: `${Math.min(100, stats.done * 7)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-neutral-800 mt-4">
            {[
              { val: creditsTotal - creditsUsed, lbl: "remaining" },
              { val: stats.total, lbl: "videos" },
              { val: stats.failed, lbl: "failed" },
            ].map((s) => (
              <div key={s.lbl} className="text-center">
                <p className="text-base font-medium text-white">{s.val}</p>
                <p className="text-xs text-neutral-600 mt-0.5">{s.lbl}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Video list */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-600">
          Your videos
        </p>
        <div className="flex gap-2">
          {(["all", "done", "pending", "failed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                filter === f
                  ? "bg-neutral-800 border-neutral-700 text-white"
                  : "border-neutral-800 text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-neutral-600">
            No videos in this category
          </div>
        )}
        {filtered.map((job) => (
          <div
            key={job.id}
            className="flex items-center gap-4 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 hover:border-neutral-700 transition-colors"
          >
            {/* Thumb */}
            <div className="w-11 h-8 rounded bg-neutral-800 flex items-center justify-center flex-shrink-0">
              {job.status === "done" && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <polygon points="1,0 10,5 1,10" fill="#7F77DD" />
                </svg>
              )}
              {job.status === "pending" && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle
                    cx="6"
                    cy="6"
                    r="5"
                    stroke="#888780"
                    strokeWidth="1.2"
                    strokeDasharray="3 2"
                  />
                </svg>
              )}
              {job.status === "failed" && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <line
                    x1="1"
                    y1="1"
                    x2="9"
                    y2="9"
                    stroke="#E24B4A"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1="9"
                    y1="1"
                    x2="1"
                    y2="9"
                    stroke="#E24B4A"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>

            {/* Title + date */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {job.prompt}
              </p>
              <p className="text-xs text-neutral-600 mt-0.5">
                {new Date(job.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>

            {/* Status icon */}
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {job.status === "completed" && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle
                    cx="8"
                    cy="8"
                    r="7"
                    stroke="#1D9E75"
                    strokeWidth="1"
                  />
                  <polyline
                    points="4.5,8 7,10.5 11.5,5.5"
                    stroke="#1D9E75"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              )}

              {job.status === "pending" && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-50" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
              )}

              {job.status === "failed" && (
                <TriangleAlert size={15} className="text-red-500" />
              )}
            </div>

            {/* Play button */}
            <div className="flex-shrink-0 w-8">
              {job.status === "completed" && job.videoUrl && (
                <a
                  href={job.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full border border-neutral-700 flex items-center justify-center hover:border-neutral-500 hover:bg-neutral-800 transition-colors"
                >
                  <Play size={12} className="text-[#7F77DD] ml-0.5" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
