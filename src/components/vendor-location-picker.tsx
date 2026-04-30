"use client";

import dynamic from "next/dynamic";
import { useCallback } from "react";

const MapInner = dynamic(() => import("@/components/vendor-location-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-500 dark:border-zinc-600 dark:bg-zinc-900">
      Loading map…
    </div>
  ),
});

export function VendorLocationPicker({
  latitude,
  longitude,
  onLatLngChange,
}: {
  latitude: string;
  longitude: string;
  onLatLngChange: (lat: string, lng: string) => void;
}) {
  const latNum = latitude.trim() === "" ? null : Number(latitude);
  const lngNum = longitude.trim() === "" ? null : Number(longitude);
  const validLat = latNum != null && !Number.isNaN(latNum) ? latNum : null;
  const validLng = lngNum != null && !Number.isNaN(lngNum) ? lngNum : null;

  const onPick = useCallback(
    (lat: number, lng: number) => {
      onLatLngChange(lat.toFixed(6), lng.toFixed(6));
    },
    [onLatLngChange],
  );

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onPick(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        /* user denied or error — silent */
      },
      { enableHighAccuracy: true, timeout: 12_000 },
    );
  }, [onPick]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={useMyLocation}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          Use my location
        </button>
        <span className="text-xs text-zinc-500">
          Or click the map to drop a pin. Location is optional but helps buyers find you.
        </span>
        {validLat != null && validLng != null ? (
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
            Selected: {validLat.toFixed(6)}, {validLng.toFixed(6)}
          </span>
        ) : null}
      </div>
      <MapInner latitude={validLat} longitude={validLng} onPick={onPick} />
    </div>
  );
}
