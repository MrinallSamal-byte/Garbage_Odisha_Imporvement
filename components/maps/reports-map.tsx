"use client";

import { MapContainer, Popup, TileLayer, CircleMarker } from "react-leaflet";

type MarkerItem = {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  subtitle?: string | null;
};

export function ReportsMap({
  markers,
  height = 320,
}: {
  markers: MarkerItem[];
  height?: number;
}) {
  const fallbackCenter: [number, number] = markers[0]
    ? [markers[0].latitude, markers[0].longitude]
    : [20.2961, 85.8245];

  return (
    <MapContainer
      center={fallbackCenter}
      zoom={markers.length > 1 ? 8 : 13}
      scrollWheelZoom={false}
      style={{ height }}
      className="w-full overflow-hidden"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((marker) => (
        <CircleMarker
          key={marker.id}
          center={[marker.latitude, marker.longitude]}
          pathOptions={{
            color: "#176f67",
            fillColor: "#fd7414",
            fillOpacity: 0.78,
            weight: 2,
          }}
          radius={11}
        >
          <Popup>
            <div className="space-y-1">
              <div className="font-semibold text-ink">{marker.title}</div>
              {marker.subtitle ? <div className="text-sm text-slateblue-700">{marker.subtitle}</div> : null}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
