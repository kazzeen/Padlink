"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon in Next.js/Webpack
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  className?: string;
  initialZoom?: number;
}

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function Map({ 
  address, 
  city, 
  state, 
  zipCode, 
  className = "h-[300px] w-full rounded-xl",
  initialZoom = 13 
}: MapProps) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Construct full address for geocoding
  const fullAddress = useMemo(() => {
    return [address, city, state, zipCode].filter(Boolean).join(", ");
  }, [address, city, state, zipCode]);

  useEffect(() => {
    let isMounted = true;

    const geocodeAddress = async () => {
      if (!fullAddress) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Use OpenStreetMap Nominatim for geocoding (Rate limited, suitable for demo/low volume)
        // In production, consider caching these results or using a paid service
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`
        );

        if (!response.ok) {
          throw new Error("Geocoding failed");
        }

        const data = await response.json();

        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          if (isMounted) {
            setPosition([parseFloat(lat), parseFloat(lon)]);
          }
        } else {
          if (isMounted) {
            setError("Location not found");
            // Default to NYC if not found, or handle gracefully
            // setPosition([40.7128, -74.0060]); 
          }
        }
      } catch (err) {
        console.error("Map error:", err);
        if (isMounted) {
          setError("Failed to load map location");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    geocodeAddress();

    return () => {
      isMounted = false;
    };
  }, [fullAddress]);

  if (loading) {
    return (
      <div className={`${className} bg-gray-800/20 animate-pulse flex items-center justify-center border border-[var(--glass-border)]`}>
        <span className="text-[var(--glass-text-muted)]">Loading map...</span>
      </div>
    );
  }

  if (error || !position) {
    return (
      <div className={`${className} bg-gray-800/20 flex items-center justify-center border border-[var(--glass-border)]`}>
        <span className="text-[var(--glass-text-muted)]">{error || "Location unavailable"}</span>
      </div>
    );
  }

  return (
    <MapContainer 
      center={position} 
      zoom={initialZoom} 
      scrollWheelZoom={false} 
      className={`${className} z-0`}
      style={{ height: "100%", width: "100%" }}
    >
      <ChangeView center={position} zoom={initialZoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position}>
        <Popup>
          {fullAddress}
        </Popup>
      </Marker>
    </MapContainer>
  );
}
