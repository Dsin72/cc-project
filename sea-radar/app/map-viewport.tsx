"use client";

import dynamic from "next/dynamic";

const MapClient = dynamic(() => import("./map-client"), {
  ssr: false,
  loading: () => <div className="map-loading" aria-label="Загрузка карты" />,
});

export default function MapViewport() {
  return <MapClient />;
}
