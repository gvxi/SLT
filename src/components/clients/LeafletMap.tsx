"use client";

/**
 * LocationPicker — shows a Leaflet map with a draggable pin.
 * Loaded dynamically (no SSR) to avoid window-is-not-defined errors.
 */

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default Leaflet marker icon path (webpack/Next.js asset handling)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Props {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

export default function LeafletMap({ lat, lng, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return; // already initialized

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 14,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      onChange(pos.lat, pos.lng);
    });

    // Also allow clicking the map to move the pin
    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onChange(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    // Force re-render after mount (needed in drawer/dialog contexts)
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external lat/lng → marker position (without re-centering on every change)
  useEffect(() => {
    if (!markerRef.current || !mapRef.current) return;
    const current = markerRef.current.getLatLng();
    if (Math.abs(current.lat - lat) > 0.0001 || Math.abs(current.lng - lng) > 0.0001) {
      markerRef.current.setLatLng([lat, lng]);
      mapRef.current.setView([lat, lng], mapRef.current.getZoom(), { animate: false });
    }
  }, [lat, lng]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
