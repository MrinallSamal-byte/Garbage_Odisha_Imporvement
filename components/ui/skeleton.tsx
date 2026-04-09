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

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("surface-card p-6 space-y-4", className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="surface-card p-5 space-y-3">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-9 w-16" />
    </div>
  );
}

export function ReportCardSkeleton() {
  return (
    <div className="surface-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function MapSkeleton({ height = 320 }: { height?: number }) {
  return (
    <div
      className="animate-pulse rounded-[1.5rem] bg-slateblue-100/60 flex items-center justify-center"
      style={{ height }}
    >
      <span className="text-sm font-medium text-slateblue-400">Loading map…</span>
    </div>
  );
}
