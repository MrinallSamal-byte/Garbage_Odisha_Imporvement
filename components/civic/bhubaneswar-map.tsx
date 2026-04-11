"use client";

import { useEffect, useMemo } from "react";
import type { GeoJsonObject } from "geojson";
import { CircleMarker, GeoJSON, MapContainer, Popup, TileLayer, useMap, ZoomControl } from "react-leaflet";

import { BHUBANESWAR_CENTER, getSeverityColor } from "@/lib/civic/map-view";
import type { CivicMapReport, CivicMapWard } from "@/lib/civic/map-view";
import { cn } from "@/lib/utils/cn";

type LatLngTuple = [number, number];

type BhubaneswarMapProps = {
  reports: CivicMapReport[];
  wards: CivicMapWard[];
  height?: number | string;
  className?: string;
  muted?: boolean;
  interactive?: boolean;
};

function collectWardLatLngs(wards: CivicMapWard[]) {
  const points: LatLngTuple[] = [];

  for (const ward of wards) {
    for (const polygon of ward.boundaryGeojson.geometry.coordinates) {
      for (const ring of polygon) {
        for (const [lng, lat] of ring) {
          points.push([lat, lng]);
        }
      }
    }
  }

  return points;
}

function getBounds(points: LatLngTuple[]): [LatLngTuple, LatLngTuple] | null {
  if (!points.length) return null;

  let minLat = points[0][0];
  let maxLat = points[0][0];
  let minLng = points[0][1];
  let maxLng = points[0][1];

  for (const [lat, lng] of points) {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  }

  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
}

function FitBhubaneswarBounds({ wards }: { wards: CivicMapWard[] }) {
  const map = useMap();
  const bounds = useMemo(() => getBounds(collectWardLatLngs(wards)), [wards]);

  useEffect(() => {
    if (!bounds) {
      map.setView(BHUBANESWAR_CENTER, 12);
      return;
    }

    map.fitBounds(bounds, {
      animate: false,
      padding: [28, 28],
      maxZoom: 13,
    });
  }, [bounds, map]);

  return null;
}

export function BhubaneswarMap({
  reports,
  wards,
  height = 520,
  className,
  muted = false,
  interactive = true,
}: BhubaneswarMapProps) {
  return (
    <MapContainer
      center={BHUBANESWAR_CENTER}
      zoom={12}
      scrollWheelZoom={interactive}
      dragging={interactive}
      doubleClickZoom={interactive}
      zoomControl={false}
      attributionControl={interactive}
      style={{ height }}
      className={cn("h-full w-full !rounded-none", muted && "saturate-75", className)}
    >
      <FitBhubaneswarBounds wards={wards} />
      {interactive ? <ZoomControl position="bottomright" /> : null}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {wards.map((ward) => (
        <GeoJSON
          key={ward.id}
          data={ward.boundaryGeojson as GeoJsonObject}
          style={{
            color: "#ef4444",
            dashArray: "7 7",
            fillColor: "#ef4444",
            fillOpacity: muted ? 0.04 : 0.07,
            opacity: muted ? 0.45 : 0.7,
            weight: muted ? 1.1 : 1.4,
          }}
        />
      ))}
      {reports.map((report) => (
        <CircleMarker
          key={report.id}
          center={[report.lat, report.lng]}
          pathOptions={{
            color: "#ffffff",
            fillColor: getSeverityColor(report.severity),
            fillOpacity: muted ? 0.68 : 0.9,
            opacity: muted ? 0.7 : 1,
            weight: 2,
          }}
          radius={report.severity === "critical" ? 15 : report.severity === "severe" ? 13 : 10}
        >
          <Popup>
            <div className="w-60 space-y-2">
              <div className="text-sm font-black text-ink">{report.title}</div>
              <div className="text-xs leading-5 text-slateblue-700">{report.address}</div>
              <div className="text-xs font-semibold text-[#e60023]">
                {report.reporterCount} report{report.reporterCount === 1 ? "" : "s"} · {report.wardLabel}
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
