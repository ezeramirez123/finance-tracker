import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-9 w-52" />
      </div>

      <Skeleton className="h-24 w-full" />

      <Skeleton className="h-64 w-full" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>

      <Skeleton className="h-56 w-full" />
    </div>
  );
}
