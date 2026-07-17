import { Skeleton } from "@/components/ui/skeleton";

export default function ExpensesLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-9 w-52" />
      </div>

      <Skeleton className="h-40 w-full" />

      <Skeleton className="h-80 w-full" />

      <Skeleton className="h-56 w-full" />
    </div>
  );
}
