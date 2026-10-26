"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import {
  INITIAL_MAP_CENTER,
  INITIAL_MAP_ZOOM,
  OSM_ATTRIBUTION,
  OSM_TILE_URL,
} from "./map-config";

export default function MapClient() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = L.map(container).setView(INITIAL_MAP_CENTER, INITIAL_MAP_ZOOM);
    L.tileLayer(OSM_TILE_URL, {
      attribution: OSM_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize({ pan: false });
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      map.remove();
    };
  }, []);

  return <div ref={containerRef} className="map-container" role="region" aria-label="Карта пролива Дувр" />;
}
