import Sidebar from "@/components/layout/Sidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth");

  return (
    <div className="flex h-screen overflow-hidden bg-[#050508]">
      <Sidebar />
      {/* Main content — fills remaining space, sidebar overlay handles mobile */}
      <div className="flex-1 overflow-y-auto min-w-0">
        {children}
      </div>
    </div>
  );
}