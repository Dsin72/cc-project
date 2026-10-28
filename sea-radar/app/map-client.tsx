"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  INITIAL_MAP_CENTER,
  INITIAL_MAP_ZOOM,
  OSM_ATTRIBUTION,
  OSM_TILE_URL,
} from "./map-config";
import { DEMO_VESSELS, type Vessel } from "./vessel";

function formatSpeed(speed: number | null) {
  return speed === null ? "Нет данных" : `${speed.toFixed(1).replace(/\.0$/, "")} уз`;
}

function formatCourse(course: number | null) {
  return course === null ? "Нет данных" : `${Math.round(course) % 360}°`;
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Нет данных";

  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} UTC`;
}

function formatSource(source: Vessel["source"]) {
  return source === "demo" ? "Демонстрационные данные" : "AISStream";
}

export default function MapClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = L.map(container).setView(INITIAL_MAP_CENTER, INITIAL_MAP_ZOOM);
    L.tileLayer(OSM_TILE_URL, {
      attribution: OSM_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    for (const { vessel } of DEMO_VESSELS) {
      const iconType = vessel.courseDeg === null ? "neutral" : "course";
      const rotation = vessel.courseDeg === null ? 0 : vessel.courseDeg;
      const vesselIcon = L.divIcon({
        className: "vessel-icon",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        html:
          iconType === "neutral"
            ? `<span class="vessel-marker vessel-marker--neutral" data-vessel-id="${vessel.id}" data-icon="neutral" aria-hidden="true"></span>`
            : `<span class="vessel-marker vessel-marker--course" data-vessel-id="${vessel.id}" data-icon="course" aria-hidden="true"><svg viewBox="0 0 24 24" style="transform: rotate(${rotation}deg)"><path d="M12 1 21 22 12 17 3 22z" /></svg></span>`,
      });
      const marker = L.marker([vessel.lat, vessel.lon], {
        icon: vesselIcon,
        title: vessel.name ?? vessel.id,
      }).addTo(map);
      marker.on("click", () => setSelectedVessel(vessel));
      const tooltip = document.createElement("span");
      tooltip.textContent = vessel.id;
      marker.bindTooltip(tooltip);
    }

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
      <div className="map-panel">
        <div className="map-source">
          {selectedVessel ? formatSource(selectedVessel.source) : "Демонстрационные данные"}
        </div>
        {selectedVessel && (
          <section className="vessel-card" aria-label={`Карточка судна ${selectedVessel.id}`}>
            <h2>Судно</h2>
            <dl>
              <div>
                <dt>Идентификатор</dt>
                <dd>{selectedVessel.id}</dd>
              </div>
              <div>
                <dt>Название</dt>
                <dd>{selectedVessel.name || "Нет данных"}</dd>
              </div>
              <div>
                <dt>Координаты</dt>
                <dd>{`${selectedVessel.lat.toFixed(5)}, ${selectedVessel.lon.toFixed(5)}`}</dd>
              </div>
              <div>
                <dt>Скорость</dt>
                <dd>{formatSpeed(selectedVessel.speedKnots)}</dd>
              </div>
              <div>
                <dt>Курс</dt>
                <dd>{formatCourse(selectedVessel.courseDeg)}</dd>
              </div>
              <div>
                <dt>Время сообщения</dt>
                <dd>{formatTimestamp(selectedVessel.timestamp)}</dd>
              </div>
              <div>
                <dt>Источник</dt>
                <dd>{formatSource(selectedVessel.source)}</dd>
              </div>
            </dl>
          </section>
        )}
      </div>
    </div>
  );
}
