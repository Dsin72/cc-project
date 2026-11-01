export type Vessel = {
  id: string;
  name: string | null;
  lat: number;
  lon: number;
  speedKnots: number | null;
  courseDeg: number | null;
  timestamp: string;
  source: "demo" | "aisstream";
};

type DemoVesselConfig = {
  id: string;
  name: string;
  speedKnots: number;
  timestamp: string;
  route: [number, number][];
};

export const DEMO_TICK_MS = 2000;

export function calculateCourse([lat1, lon1]: [number, number], [lat2, lon2]: [number, number]) {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const startLat = toRadians(lat1);
  const endLat = toRadians(lat2);
  const deltaLon = toRadians(lon2 - lon1);
  const y = Math.sin(deltaLon) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(deltaLon);

  return (((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360;
}

const DEMO_VESSEL_CONFIGS: DemoVesselConfig[] = [
  {
    id: "demo-1",
    name: "Демо-судно 1",
    speedKnots: 12,
    timestamp: "2026-10-28T12:00:00.000Z",
    route: [
      [51.04, 1.18],
      [51.07, 1.25],
      [51.1, 1.33],
      [51.12, 1.42],
      [51.11, 1.47],
      [51.1, 1.52],
      [51.07, 1.62],
      [51.02, 1.72],
      [51.0, 1.76],
      [50.98, 1.8],
    ],
  },
  {
    id: "demo-2",
    name: "Демо-судно 2",
    speedKnots: 8,
    timestamp: "2026-10-28T12:00:00.000Z",
    route: [
      [51.0, 1.33],
      [51.005, 1.36],
      [51.01, 1.39],
      [51.015, 1.42],
      [51.02, 1.45],
      [51.025, 1.48],
      [51.03, 1.51],
      [51.035, 1.54],
      [51.04, 1.57],
      [51.045, 1.6],
    ],
  },
  {
    id: "demo-3",
    name: "Демо-судно 3",
    speedKnots: 14,
    timestamp: "2026-10-28T12:00:00.000Z",
    route: [
      [51.16, 1.64],
      [51.13, 1.58],
      [51.11, 1.5],
      [51.1, 1.46],
      [51.09, 1.42],
      [51.07, 1.34],
      [51.05, 1.26],
      [51.03, 1.18],
      [51.02, 1.14],
      [51.01, 1.1],
    ],
  },
];

export const DEMO_VESSELS = DEMO_VESSEL_CONFIGS.map(({ id, name, speedKnots, timestamp, route }) => {
  const [start, next] = route;

  return {
    vessel: {
      id,
      name,
      lat: start[0],
      lon: start[1],
      speedKnots,
      courseDeg: calculateCourse(start, next),
      timestamp,
      source: "demo" as const,
    },
    route,
  };
});
