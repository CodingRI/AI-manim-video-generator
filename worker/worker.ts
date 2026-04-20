import { Worker } from "bullmq";
import { createRedisConnection } from "../lib/redis";
import { runPipeline } from "./pipeline";
import { prisma } from "../lib/prisma";

interface PipelineResult {
  videoUrl: string;
}

const worker = new Worker(
  "video-queue",
  async (job) => {
    const { jobId } = job.data;

    console.log("📥 Incoming job data:", job.data);
    console.log("🆔 BullMQ job.id:", job.id);
    console.log("🚀 Processing job:", jobId);

    if (!jobId) {
      console.error("❌ Missing jobId in job.data");
      throw new Error("INVALID_JOB_ID");
    }
    

    try {
      // 🔄 STEP 1: Set status → processing
      try {
        console.log("⏳ Updating status → processing:", jobId);

        await prisma.videoJob.update({
          where: { id: jobId },
          data: { status: "processing" },
        });

        console.log("✅ Status updated → processing");
      } catch (err) {
        console.error("❌ Failed to update processing status:", err);
        throw err;
      }

      // 🎬 STEP 2: Run pipeline with timeout
      const result = await Promise.race<PipelineResult>([
        runPipeline(job.data),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("⏰ Pipeline Timeout (240s)")), 240000)
        ),
      ]);

      console.log("🎥 Pipeline result:", result);

      if (!result?.videoUrl) {
        throw new Error("❌ Missing videoUrl from pipeline");
      }

      // ✅ STEP 3: Set status → completed
      try {
        console.log("📦 Updating status → completed:", jobId);

        await prisma.videoJob.update({
          where: { id: jobId },
          data: {
            status: "completed",
            videoUrl: result.videoUrl,
          },
        });

        console.log("✅ Status updated → completed");
      } catch (err) {
        console.error("❌ Failed to update completed status:", err);
        throw err;
      }

      console.log("🎉 Job completed successfully:", jobId);

    } catch (err) {
      console.error("🔥 Job failed:", jobId, err);

      // STEP 4: Set status → failed (safe)
      try {
        await prisma.videoJob.update({
          where: { id: jobId },
          data: { status: "failed" },
        });

        console.log("⚠️ Status updated → failed");
      } catch (updateErr) {
        console.error("❌ Failed to update failed status:", updateErr);
      }
    }
  },
  {  
    connection: createRedisConnection(),
    concurrency: 2,
    maxStalledCount: 1,
    drainDelay: 60, 
   }
);

console.log("👷 Worker started and listening to queue...");