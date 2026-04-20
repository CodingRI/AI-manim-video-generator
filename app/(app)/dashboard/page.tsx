import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const jobs = await prisma.videoJob.findMany({
    where: {
      userId: session?.user?.email || "anonymous",
    },
    orderBy: { createdAt: "desc" },
  });

  const total = jobs.length;
  const done = jobs.filter((j : any ) => j.status === "completed").length;
  const pending = jobs.filter((j : any) => j.status === "pending").length;
  const failed = jobs.filter((j : any) => j.status === "failed").length;
  const successRate =
    total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <DashboardClient
      jobs={jobs.map((j) => ({
        id: j.id,
        prompt: j.prompt,
        status: j.status,
        videoUrl: j.videoUrl ?? null,
        createdAt: j.createdAt.toISOString(),
      }))}
      stats={{ total, done, pending, failed, successRate }}
    />
  );
}