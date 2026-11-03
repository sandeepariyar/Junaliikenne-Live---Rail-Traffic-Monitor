import finland from '../data/geo/finland.json';
import railNetwork from '../data/geo/rail-network.json';
import stationsGeo from '../data/geo/stations.json';
import routes from '../data/geo/routes.json';

export type Pt = [number, number];
export interface GeoStation { code: string; name: string; x: number; y: number }

export const FINLAND_POLYGONS = finland as unknown as Pt[][];
export const RAIL_NETWORK = railNetwork as unknown as Pt[][];
export const GEO_STATIONS = stationsGeo as unknown as GeoStation[];
export const ROUTES = routes as unknown as Record<string, Pt[]>;

/** Bounding box of the Finland outline in map units. */
export const MAP_BOUNDS = (() => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  FINLAND_POLYGONS.forEach((r) => r.forEach(([x, y]) => {
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }));
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
})();

export const geoStation = (code: string) => GEO_STATIONS.find((s) => s.code === code);

export const toPathD = (pts: Pt[], close = false) =>
  pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ') + (close ? ' Z' : '');

const lengths = new Map<string, number[]>();
function cumulative(id: string): number[] {
  let c = lengths.get(id);
  if (!c) {
    const p = ROUTES[id]; c = [0];
    for (let i = 1; i < p.length; i++) c.push(c[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
    lengths.set(id, c);
  }
  return c;
}

/** Point and heading (deg, 0 = north, clockwise) at fraction t (0..1) along a route. */
export function pointAlong(id: string, t: number): { x: number; y: number; headingDeg: number } {
  const p = ROUTES[id]; const c = cumulative(id);
  const target = Math.max(0, Math.min(1, t)) * c[c.length - 1];
  let i = 1; while (i < c.length - 1 && c[i] < target) i++;
  const seg = c[i] - c[i - 1] || 1; const k = (target - c[i - 1]) / seg;
  const [ax, ay] = p[i - 1], [bx, by] = p[i];
  return { x: ax + (bx - ax) * k, y: ay + (by - ay) * k, headingDeg: (Math.atan2(bx - ax, -(by - ay)) * 180) / Math.PI };
}

/** Snap an arbitrary map point to the closest position on any scenario route. */
export function snapToRoutes(x: number, y: number): { lineId: string; t: number } {
  let best = { lineId: Object.keys(ROUTES)[0], t: 0, d: Infinity };
  for (const id of Object.keys(ROUTES)) {
    const p = ROUTES[id]; const c = cumulative(id); const L = c[c.length - 1];
    for (let i = 1; i < p.length; i++) {
      const [ax, ay] = p[i - 1], [bx, by] = p[i];
      const dx = bx - ax, dy = by - ay; const len2 = dx * dx + dy * dy || 1;
      const k = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / len2));
      const d = Math.hypot(ax + dx * k - x, ay + dy * k - y);
      if (d < best.d) best = { lineId: id, t: (c[i - 1] + (c[i] - c[i - 1]) * k) / L, d };
    }
  }
  return { lineId: best.lineId, t: best.t };
}
