import { cn } from "@/lib/utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-2xl bg-slateblue-100/70", className)}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="surface-card p-5 space-y-3">
      <Skeleton className="h-4 w-24 rounded-full" />
      <Skeleton className="h-9 w-16" />
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("surface-card", className)} />;
}

export function ReportCardSkeleton() {
  return (
    <div className="surface-card grid gap-5 overflow-hidden p-0 md:grid-cols-[200px_1fr]">
      <Skeleton className="min-h-[180px] rounded-none md:h-full" />
      <div className="space-y-4 p-5">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
        </div>
        <div className="flex items-center justify-between border-t border-slateblue-50 pt-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-10" />
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
