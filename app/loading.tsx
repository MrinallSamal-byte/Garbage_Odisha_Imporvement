import { StatCardSkeleton, ReportCardSkeleton, CardSkeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <main className="pb-16">
      {/* Hero skeleton */}
      <section className="border-b border-white/50 bg-hero-wash">
        <div className="container grid gap-10 py-16 md:grid-cols-[1.05fr_0.95fr] md:py-24">
          <div className="space-y-7">
            <div className="h-6 w-48 animate-pulse rounded-full bg-civic-100" />
            <div className="space-y-3">
              <div className="h-14 w-full animate-pulse rounded-2xl bg-slateblue-100/60" />
              <div className="h-10 w-4/5 animate-pulse rounded-2xl bg-slateblue-100/60" />
            </div>
            <div className="flex gap-3">
              <div className="h-11 w-32 animate-pulse rounded-full bg-civic-200/60" />
              <div className="h-11 w-36 animate-pulse rounded-full bg-slateblue-100/60" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
          </div>
          <CardSkeleton className="h-[420px]" />
        </div>
      </section>

      {/* Recent reports skeleton */}
      <section className="container py-16 space-y-6">
        <div className="h-8 w-64 animate-pulse rounded-2xl bg-slateblue-100/60" />
        <ReportCardSkeleton />
        <ReportCardSkeleton />
      </section>
    </main>
  );
}
