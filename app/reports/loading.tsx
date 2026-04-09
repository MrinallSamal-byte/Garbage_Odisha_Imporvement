import { CardSkeleton, ReportCardSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function ReportsLoading() {
  return (
    <main className="container py-12 space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-1/2" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <CardSkeleton className="h-64" />
          <div className="grid gap-4">
            <ReportCardSkeleton />
            <ReportCardSkeleton />
          </div>
        </div>
        <CardSkeleton className="h-48" />
      </div>
    </main>
  );
}
