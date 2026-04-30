"use client";

import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";

import "leaflet/dist/leaflet.css";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterOnSelection({
  latitude,
  longitude,
}: {
  latitude: number | null;
  longitude: number | null;
}) {
  const map = useMapEvents({});

  useEffect(() => {
    if (latitude == null || longitude == null) return;
    map.setView([latitude, longitude], 17, { animate: true });
  }, [latitude, longitude, map]);

  return null;
}

export default function VendorLocationMapInner({
  latitude,
  longitude,
  onPick,
}: {
  latitude: number | null;
  longitude: number | null;
  onPick: (lat: number, lng: number) => void;
}) {
  const center: [number, number] =
    latitude != null && longitude != null ? [latitude, longitude] : [22.9734, 78.6569];

  return (
    <MapContainer
      center={center}
      zoom={latitude != null ? 14 : 5}
      className="z-0 h-72 w-full rounded-xl border border-zinc-200 dark:border-zinc-700"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onPick={onPick} />
      <RecenterOnSelection latitude={latitude} longitude={longitude} />
      {latitude != null && longitude != null ? (
        <Marker position={[latitude, longitude]} icon={markerIcon} />
      ) : null}
    </MapContainer>
  );
}
