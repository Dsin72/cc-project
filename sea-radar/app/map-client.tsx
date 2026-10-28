"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import {
  INITIAL_MAP_CENTER,
  INITIAL_MAP_ZOOM,
  OSM_ATTRIBUTION,
  OSM_TILE_URL,
} from "./map-config";
import { DEMO_VESSEL } from "./vessel";

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

    const iconType = DEMO_VESSEL.courseDeg === null ? "neutral" : "course";
    const rotation = DEMO_VESSEL.courseDeg === null ? 0 : DEMO_VESSEL.courseDeg;
    const vesselIcon = L.divIcon({
      className: "vessel-icon",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      html:
        iconType === "neutral"
          ? `<span class="vessel-marker vessel-marker--neutral" data-vessel-id="${DEMO_VESSEL.id}" data-icon="neutral" aria-hidden="true"></span>`
          : `<span class="vessel-marker vessel-marker--course" data-vessel-id="${DEMO_VESSEL.id}" data-icon="course" aria-hidden="true"><svg viewBox="0 0 24 24" style="transform: rotate(${rotation}deg)"><path d="M12 1 21 22 12 17 3 22z" /></svg></span>`,
    });
    const marker = L.marker([DEMO_VESSEL.lat, DEMO_VESSEL.lon], {
      icon: vesselIcon,
      title: DEMO_VESSEL.name ?? DEMO_VESSEL.id,
    }).addTo(map);
    const tooltip = document.createElement("span");
    tooltip.textContent = DEMO_VESSEL.id;
    marker.bindTooltip(tooltip);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize({ pan: false });
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      map.remove();
    };
  }, []);

  return (
    <div className="map-shell">
      <div ref={containerRef} className="map-container" role="region" aria-label="Карта пролива Дувр" />
      <div className="map-source">Демонстрационные данные</div>
    </div>
  );
}
