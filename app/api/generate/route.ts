import { videoQueue } from "@/lib/queue";
import {prisma} from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const body = await req.json();
  if (!body.prompt) {
    return Response.json({ error: "Prompt required" }, { status: 400 });
  }
  const job = await prisma.videoJob.create({
    data: {
      prompt: body.prompt,
      status: "pending",
      userId: session?.user?.email || "anonymous",
    },
  });

  await videoQueue.add("generate-video", {
    jobId: job.id,
    prompt: body.prompt,
    duration: body.duration,
    quality: body.quality,
  }, {
    jobId: job.id, 
    attempts: 2,
    backoff: {
      type: "fixed",
      delay: 5000
    },
    removeOnComplete: true,
    removeOnFail: true,
  });

  return Response.json({
    jobId: job.id,
  });
}
