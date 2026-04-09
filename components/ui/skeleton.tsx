import { cn } from "@/lib/utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-slateblue-100/70",
        className,
      )}
    />
  );
}

export function ReportCardSkeleton() {
  return (
    <div className="surface-card grid gap-5 p-6 md:grid-cols-[220px_1fr]">
      <Skeleton className="min-h-[200px] rounded-[1.5rem]" />
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function MapSkeleton({ height = 320 }: { height?: number }) {
  return (
    <div
      className="skeleton-shimmer rounded-[1.5rem]"
      style={{ height }}
    />
  );
}
