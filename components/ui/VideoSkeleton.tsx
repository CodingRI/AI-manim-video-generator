import Skeleton from "@/components/ui/Skeleton";

export default function VideoSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-3 w-64" />

      <Skeleton className="h-72 w-full rounded-2xl" />

      <Skeleton className="h-32 w-full rounded-2xl" />
    </div>
  );
}