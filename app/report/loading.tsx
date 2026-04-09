import { CardSkeleton } from "@/components/ui/skeleton";

export default function ReportLoading() {
  return (
    <main className="container py-12">
      <div className="mb-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-5">
          <div className="h-5 w-24 animate-pulse rounded-full bg-civic-100" />
          <div className="h-12 w-full animate-pulse rounded-2xl bg-slateblue-100/60" />
          <div className="h-5 w-3/4 animate-pulse rounded-xl bg-slateblue-100/40" />
          <div className="grid gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 w-full animate-pulse rounded-2xl bg-slateblue-50/80 border border-slateblue-100" />
            ))}
          </div>
        </div>
      </div>
      <CardSkeleton className="h-[480px]" />
    </main>
  );
}
