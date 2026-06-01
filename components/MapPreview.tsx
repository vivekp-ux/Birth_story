"use client";

import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

interface Props {
  lat: number;
  lng: number;
}

const mapContainerStyle = {
  width: "100%",
  height: "300px",
};

export default function MapPreview({ lat, lng }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  const { isLoaded, loadError } = useJsApiLoader({
    id: "ovum-google-map",
    googleMapsApiKey: apiKey,
  });

  if (!apiKey) {
    return (
      <div className="w-full h-[300px] rounded-xl border border-amber-200 bg-amber-50 flex items-center justify-center text-sm text-amber-800 px-4 text-center">
        Add <code className="mx-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to{" "}
        <code className="mx-1">.env.local</code> (Maps JavaScript API enabled).
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full h-[300px] rounded-xl border border-red-200 bg-red-50 flex items-center justify-center text-sm text-red-700 px-4 text-center">
        Could not load Google Maps. Check your API key and billing on Google Cloud.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-[300px] rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-sm text-gray-400">
        Loading map…
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={{ lat, lng }}
        zoom={15}
        options={{ scrollwheel: false }}
      >
        <Marker position={{ lat, lng }} />
      </GoogleMap>
    </div>
  );
}
