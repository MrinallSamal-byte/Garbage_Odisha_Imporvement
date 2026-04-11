"use client";

import { useRouter } from "next/navigation";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

import { DelhiSeverityBadge, DelhiStatusBadge } from "@/components/delhi/severity-status-badges";
import { severityColors, wasteTypeLabels } from "@/lib/delhi/constants";
import type { DelhiReportCard } from "@/lib/delhi/types";

const delhiCenter: [number, number] = [28.6139, 77.209];

export function DelhiMap({
  reports,
  height = 520,
}: {
  reports: DelhiReportCard[];
  height?: number;
}) {
  const router = useRouter();

  return (
    <MapContainer
      center={delhiCenter}
      zoom={11}
      scrollWheelZoom={false}
      style={{ height }}
      className="w-full overflow-hidden"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {reports.map((report) => (
        <CircleMarker
          key={report.id}
          center={[report.latitude, report.longitude]}
          eventHandlers={{
            click: () => router.push(`/report/${report.id}`),
          }}
          pathOptions={{
            color: "#16324f",
            fillColor: severityColors[report.severity],
            fillOpacity: 0.88,
            weight: 2,
          }}
          radius={report.severity === "critical" ? 15 : report.severity === "severe" ? 13 : 11}
        >
          <Popup>
            <div className="w-64 space-y-3">
              <div className="flex flex-wrap gap-2">
                <DelhiSeverityBadge severity={report.severity} />
                <DelhiStatusBadge status={report.status} />
              </div>
              <div>
                <div className="font-bold text-ink">{report.title}</div>
                <div className="mt-1 text-sm text-slateblue-700">{report.addressText}</div>
              </div>
              <div className="text-xs text-slateblue-600">
                {wasteTypeLabels[report.wasteType]} - {report.reporterCount} report
                {report.reporterCount === 1 ? "" : "s"}
              </div>
              <button
                type="button"
                onClick={() => router.push(`/report/${report.id}`)}
                className="inline-flex h-9 items-center rounded-full bg-ink px-4 text-xs font-semibold text-white"
              >
                Open report
              </button>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
