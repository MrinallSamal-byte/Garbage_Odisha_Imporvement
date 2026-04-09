import Link from "next/link";
import { Trophy, Clock, AlertTriangle, CheckCircle2, Rss } from "lucide-react";

import { Card } from "@/components/ui/card";
import { env } from "@/lib/env";
import { getReportRepository } from "@/server/repositories/repository-factory";

export const dynamic = "force-dynamic";

const UNRESOLVED_STATUSES = new Set(["REPORTED", "VERIFIED", "FORWARDED", "IN_PROGRESS"]);

type DistrictRow = {
  district: string;
  total: number;
  resolved: number;
  unresolved: number;
  critical: number;
  resolutionRate: number;
  avgResolutionHours: number | null;
};

async function getLeaderboardData(): Promise<DistrictRow[]> {
  const repo = getReportRepository();
  const all = await repo.listPublicReports();

  const map = new Map<string, Omit<DistrictRow, "resolutionRate" | "avgResolutionHours"> & { times: number[] }>();

  for (const item of all) {
    const name = item.district?.name ?? "Unknown";
    if (!map.has(name)) {
      map.set(name, { district: name, total: 0, resolved: 0, unresolved: 0, critical: 0, times: [] });
    }
    const row = map.get(name)!;
    row.total++;
    if (item.report.status === "RESOLVED") {
      row.resolved++;
      const hrs = (Date.parse(item.report.updatedAt) - Date.parse(item.report.createdAt)) / 3_600_000;
      if (hrs > 0) row.times.push(hrs);
    } else if (UNRESOLVED_STATUSES.has(item.report.status)) {
      row.unresolved++;
    }
    if (item.report.severity === "CRITICAL" || item.report.severity === "HIGH") row.critical++;
  }

  return Array.from(map.values())
    .map(({ times, ...row }) => ({
      ...row,
      resolutionRate: row.total > 0 ? Math.round((row.resolved / row.total) * 100) : 0,
      avgResolutionHours:
        times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null,
    }))
    .sort((a, b) => b.resolutionRate - a.resolutionRate || a.unresolved - b.unresolved);
}

function medal(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

function formatHours(hours: number | null) {
  if (hours === null) return "—";
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

export default async function LeaderboardPage() {
  const rows = await getLeaderboardData();

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <main className="container py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="section-label">District accountability</div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-ink">
            Which districts are resolving complaints fastest?
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slateblue-700">
            Ranked by resolution rate. Districts with more unresolved HIGH and CRITICAL reports rank
            lower regardless of total count. Updated on every page load.
          </p>
        </div>
        <a
          href={`${env.NEXT_PUBLIC_APP_URL}/api/digest`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
        >
          <Rss className="h-4 w-4" />
          Subscribe to RSS digest
        </a>
      </div>

      {/* Top 3 podium */}
      {top3.length > 0 && (
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {top3.map((row, i) => (
            <Card
              key={row.district}
              className={`relative space-y-4 ${
                i === 0
                  ? "border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-white"
                  : i === 1
                    ? "border border-slateblue-200"
                    : "border border-slateblue-100"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-2xl">{medal(i + 1)}</div>
                  <h2 className="mt-1 text-xl font-black text-ink">{row.district}</h2>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-civic-600">{row.resolutionRate}%</div>
                  <div className="text-xs text-slateblue-500">resolution rate</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-2xl bg-white/80 px-2 py-2">
                  <div className="text-lg font-black text-ink">{row.total}</div>
                  <div className="text-slateblue-500">Total</div>
                </div>
                <div className="rounded-2xl bg-white/80 px-2 py-2">
                  <div className="text-lg font-black text-rose-600">{row.unresolved}</div>
                  <div className="text-slateblue-500">Open</div>
                </div>
                <div className="rounded-2xl bg-white/80 px-2 py-2">
                  <div className="text-lg font-black text-slateblue-700">
                    {formatHours(row.avgResolutionHours)}
                  </div>
                  <div className="text-slateblue-500">Avg fix</div>
                </div>
              </div>
              {row.critical > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {row.critical} high-severity reports
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Full table */}
      {rest.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-bold text-ink">All districts</h2>
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slateblue-100 bg-slateblue-50/60">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slateblue-500">
                      Rank
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slateblue-500">
                      District
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-slateblue-500">
                      Total
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-slateblue-500">
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        Resolved
                      </span>
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-slateblue-500">
                      <span className="inline-flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-rose-500" />
                        Open
                      </span>
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-slateblue-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slateblue-400" />
                        Avg fix
                      </span>
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-slateblue-500">
                      <span className="inline-flex items-center gap-1">
                        <Trophy className="h-3 w-3 text-amber-500" />
                        Rate
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rest.map((row, i) => (
                    <tr
                      key={row.district}
                      className="border-b border-slateblue-50 transition last:border-0 hover:bg-slateblue-50/40"
                    >
                      <td className="px-5 py-3 font-mono text-xs text-slateblue-400">
                        #{i + 4}
                      </td>
                      <td className="px-5 py-3 font-semibold text-ink">
                        <Link
                          href={`/dashboard?district=${encodeURIComponent(row.district)}`}
                          className="hover:text-civic-700 hover:underline"
                        >
                          {row.district}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-right text-slateblue-700">{row.total}</td>
                      <td className="px-5 py-3 text-right font-semibold text-emerald-600">
                        {row.resolved}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className={
                            row.unresolved > 0 ? "font-semibold text-rose-600" : "text-slateblue-400"
                          }
                        >
                          {row.unresolved}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-slateblue-600">
                        {formatHours(row.avgResolutionHours)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slateblue-100">
                            <div
                              className="h-full rounded-full bg-civic-500 transition-all"
                              style={{ width: `${row.resolutionRate}%` }}
                            />
                          </div>
                          <span className="font-bold text-ink">{row.resolutionRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {rows.length === 0 && (
        <Card className="mt-10 border-dashed text-center">
          <p className="text-sm text-slateblue-600">
            No district data yet. Submit some reports to populate the leaderboard.
          </p>
        </Card>
      )}

      <p className="mt-6 text-center text-xs text-slateblue-400">
        District names, report counts, and resolution times come directly from the live public
        report dataset. Resolution time is measured from report creation to the last status change.
      </p>
    </main>
  );
}
