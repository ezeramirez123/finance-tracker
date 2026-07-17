import { Skeleton } from "@/components/ui/skeleton";

export default function TransactionsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-7 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      <Skeleton className="h-12 w-full" />

      <Skeleton className="h-96 w-full" />
    </div>
  );
}
