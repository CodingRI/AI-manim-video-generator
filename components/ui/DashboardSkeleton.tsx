import Skeleton from "@/components/ui/Skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-40" />

      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map(i => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}