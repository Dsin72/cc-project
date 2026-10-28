"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  INITIAL_MAP_CENTER,
  INITIAL_MAP_ZOOM,
  OSM_ATTRIBUTION,
  OSM_TILE_URL,
} from "./map-config";
import {
  calculateCourse,
  DEMO_TICK_MS,
  DEMO_VESSELS,
  type Vessel,
} from "./vessel";

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

function createVesselIcon(vessel: Vessel) {
  const iconType = vessel.courseDeg === null ? "neutral" : "course";
  const rotation = vessel.courseDeg === null ? 0 : vessel.courseDeg;

  return L.divIcon({
    className: "vessel-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    html:
      iconType === "neutral"
        ? `<span class="vessel-marker vessel-marker--neutral" data-vessel-id="${vessel.id}" data-icon="neutral" aria-hidden="true"></span>`
        : `<span class="vessel-marker vessel-marker--course" data-vessel-id="${vessel.id}" data-icon="course" aria-hidden="true"><svg viewBox="0 0 24 24" style="transform: rotate(${rotation}deg)"><path d="M12 1 21 22 12 17 3 22z" /></svg></span>`,
  });
}

export default function MapClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef(new Map<string, L.Marker>());
  const routeIndexes = useRef(new Map<string, number>());
  const [vessels, setVessels] = useState<Vessel[]>(() => DEMO_VESSELS.map(({ vessel }) => ({ ...vessel })));
  const [selectedVesselId, setSelectedVesselId] = useState<string | null>(null);
  const selectedVessel = vessels.find((vessel) => vessel.id === selectedVesselId) ?? null;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = L.map(container).setView(INITIAL_MAP_CENTER, INITIAL_MAP_ZOOM);
    L.tileLayer(OSM_TILE_URL, {
      attribution: OSM_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    for (const { vessel } of DEMO_VESSELS) {
      const marker = L.marker([vessel.lat, vessel.lon], {
        icon: createVesselIcon(vessel),
        title: vessel.name ?? vessel.id,
      }).addTo(map);
      markerRefs.current.set(vessel.id, marker);
      marker.on("click", () => setSelectedVesselId(vessel.id));
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
      markerRefs.current.clear();
      map.remove();
    };
  }, []);

  useEffect(() => {
    for (const vessel of vessels) {
      const marker = markerRefs.current.get(vessel.id);
      if (!marker) continue;

      marker.setLatLng([vessel.lat, vessel.lon]);
      marker.setIcon(createVesselIcon(vessel));
    }
  }, [vessels]);

  useEffect(() => {
    routeIndexes.current = new Map(DEMO_VESSELS.map(({ vessel }) => [vessel.id, 0]));
    const startTimestamp = new Date().toISOString();
    setVessels((current) => current.map((vessel) => ({ ...vessel, timestamp: startTimestamp })));

    const interval = window.setInterval(() => {
      const timestamp = new Date().toISOString();
      const nextIndexes = new Map<string, number>();

      for (const { vessel, route } of DEMO_VESSELS) {
        const currentIndex = routeIndexes.current.get(vessel.id) ?? 0;
        if (currentIndex < route.length - 1) {
          nextIndexes.set(vessel.id, currentIndex + 1);
        }
      }

      if (nextIndexes.size === 0) return;
      for (const [id, index] of nextIndexes) routeIndexes.current.set(id, index);

      setVessels((current) =>
        current.map((vessel) => {
          const nextIndex = nextIndexes.get(vessel.id);
          if (nextIndex === undefined) return vessel;

          const route = DEMO_VESSELS.find((demo) => demo.vessel.id === vessel.id)?.route;
          if (!route) return vessel;

          const previousPoint = route[nextIndex - 1];
          const [lat, lon] = route[nextIndex];
          const arrived = nextIndex === route.length - 1;

          return {
            ...vessel,
            lat,
            lon,
            courseDeg: calculateCourse(previousPoint, route[nextIndex]),
            speedKnots: arrived ? 0 : vessel.speedKnots,
            timestamp,
          };
        }),
      );
    }, DEMO_TICK_MS);

    return () => window.clearInterval(interval);
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
