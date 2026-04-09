import { StatCardSkeleton, ReportCardSkeleton, CardSkeleton, MapSkeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <main className="container py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <div className="h-5 w-32 animate-pulse rounded-full bg-civic-100" />
          <div className="h-10 w-2/3 animate-pulse rounded-2xl bg-slateblue-100/60" />
        </div>
        <div className="h-12 w-36 animate-pulse rounded-full bg-slateblue-100/60" />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
        <CardSkeleton className="h-64" />
        <div className="space-y-6">
          <MapSkeleton height={360} />
          <div className="grid gap-5">
            <ReportCardSkeleton />
            <ReportCardSkeleton />
            <ReportCardSkeleton />
          </div>
        </div>
      </div>
    </main>
  );
}
