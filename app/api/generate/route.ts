import { videoQueue } from "@/lib/queue";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    //  Auth check
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    //Parse body
    const body = await req.json();

    if (!body.prompt || !body.prompt.trim()) {
      return Response.json({ error: "Prompt required" }, { status: 400 });
    }

    //probable caching!
    const existing = await prisma.videoJob.findFirst({
      where: {
        userId: session.user.id,
        prompt: body.prompt,
        status: "completed",
      },
    });
    
    if (existing) {
      return Response.json({ jobId: existing.id });
    }

    // ✅ 3. Limit check (NO transaction)
    const count = await prisma.videoJob.count({
      where: {
        userId: session.user.id,
        status: {
          in: ["pending", "processing", "completed"],
        },
      },
    });

    if (count >= 3) {
      return Response.json(
        { error: "You can only generate up to 3 videos." },
        { status: 403 }
      );
    }

    // ✅ 4. Create job
    const job = await prisma.videoJob.create({
      data: {
        prompt: body.prompt,
        status: "pending",
        userId: session.user.id,
      },
    });

    // ✅ 5. Add to queue
    await videoQueue.add(
      "generate-video",
      {
        jobId: job.id,
        prompt: body.prompt,
        duration: body.duration,
        quality: body.quality,
      },
      {
        jobId: job.id,
        attempts: 2,
        backoff: {
          type: "fixed",
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: true,
      }
    );

    // ✅ 6. Return response
    return Response.json({
      jobId: job.id,
    });

  } catch (err) {
    console.error("Generate API Error:", err);



    return Response.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
}