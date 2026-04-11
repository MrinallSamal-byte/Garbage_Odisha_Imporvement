import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { getDashboardData } from "@/server/services/report-query-service";
import { serializeReportListItem } from "@/server/services/report-presentation-service";

export const dynamic = "force-dynamic";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET(request: Request) {
  const { reports, stats } = await getDashboardData({ pageSize: 50 });
  const items = reports.map(serializeReportListItem);

  const unresolvedHigh = items.filter(
    (item) =>
      ["REPORTED", "VERIFIED", "FORWARDED", "IN_PROGRESS"].includes(item.report.status) &&
      (item.report.severity === "HIGH" || item.report.severity === "CRITICAL"),
  );

  const appUrl = env.NEXT_PUBLIC_APP_URL;
  const now = new Date().toISOString();

  const json = {
    title: "SafaOdisha Weekly Digest",
    description:
      "Top unresolved HIGH and CRITICAL cleanliness complaints across Odisha. Subscribe to stay informed.",
    homeUrl: appUrl,
    generatedAt: now,
    stats: {
      totalReports: stats.totalReports,
      unresolvedReports: stats.unresolvedReports,
      resolvedReports: stats.resolvedReports,
      highSeverityReports: stats.highSeverityReports,
    },
    items: unresolvedHigh.slice(0, 20).map((item) => ({
      id: item.report.id,
      reportCode: item.report.reportCode,
      title: item.report.description,
      url: `${appUrl}/reports/${item.report.id}`,
      status: item.report.status,
      severity: item.report.severity,
      category: item.report.category,
      address: item.report.addressLine,
      district: item.district?.name ?? null,
      assemblyConstituency: item.assemblyConstituency?.name ?? null,
      parliamentConstituency: item.parliamentConstituency?.name ?? null,
      mla: item.mla ? { name: item.mla.name, party: item.mla.partyName } : null,
      mp: item.mp ? { name: item.mp.name, party: item.mp.partyName } : null,
      trustScore: item.report.trustScore,
      votes: item.votes,
      comments: item.comments,
      reportedAt: item.report.createdAt,
    })),
  };

  const format = new URL(request.url).searchParams.get("format")?.toLowerCase();
  const cacheControl = "public, max-age=3600, s-maxage=3600";

  if (format === "json") {
    return NextResponse.json(json, {
      headers: {
        "Cache-Control": cacheControl,
        "X-SafaOdisha-Stats": JSON.stringify(json.stats),
      },
    });
  }

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>SafaOdisha – Unresolved High Priority Reports</title>
    <link>${appUrl}/dashboard</link>
    <description>Top unresolved HIGH and CRITICAL public cleanliness complaints in Odisha. ${stats.unresolvedReports} complaints currently unresolved.</description>
    <language>en-IN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${appUrl}/api/digest?format=rss" rel="self" type="application/rss+xml"/>
    ${unresolvedHigh
      .slice(0, 20)
      .map(
        (item) => `
    <item>
      <title>[${item.report.severity}] ${escapeXml(item.report.description)}</title>
      <link>${appUrl}/reports/${item.report.id}</link>
      <guid isPermaLink="true">${appUrl}/reports/${item.report.id}</guid>
      <description>${escapeXml(item.report.addressLine)} | MLA: ${escapeXml(item.mla?.name ?? "Unknown")} | MP: ${escapeXml(item.mp?.name ?? "Unknown")} | Status: ${item.report.status} | Trust: ${item.report.trustScore}</description>
      <pubDate>${new Date(item.report.createdAt).toUTCString()}</pubDate>
    </item>`,
      )
      .join("")}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": cacheControl,
      "X-SafaOdisha-Stats": JSON.stringify(json.stats),
    },
  });
}
