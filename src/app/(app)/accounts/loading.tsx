import { Skeleton } from "@/components/ui/skeleton";

export default function AccountsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-7 w-24" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      <Skeleton className="h-40 w-full" />

      <Skeleton className="h-64 w-full" />
    </div>
  );
}
