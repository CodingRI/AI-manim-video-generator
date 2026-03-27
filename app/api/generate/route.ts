import { videoQueue } from "@/lib/queue";
import {prisma} from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.prompt) {
    return Response.json({ error: "Prompt required" }, { status: 400 });
  }
  const job = await prisma.videoJob.create({
    data: {
      prompt: body.prompt,
      status: "pending",
    },
  });

  await videoQueue.add("generate-video", {
    jobId: job.id,
    prompt: body.prompt,
    duration: body.duration,
    quality: body.quality,
  });

  return Response.json({
    jobId: job.id,
  });
}
