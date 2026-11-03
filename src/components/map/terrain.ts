import Delaunator from 'delaunator';
import { FINLAND_POLYGONS, MAP_BOUNDS, Pt } from '../../geo/network';

function insideRing(x: number, y: number, r: Pt[]) {
  let c = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i], [xj, yj] = r[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
export const insideFinland = (x: number, y: number) => FINLAND_POLYGONS.some((r) => insideRing(x, y, r));

// deterministic value noise
const hash = (x: number, y: number) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
function noise(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

const coast: Pt[] = [];
FINLAND_POLYGONS.forEach((r) => r.forEach((p, i) => { if (i % 2 === 0) coast.push(p); }));
function coastDist(x: number, y: number) {
  let m = Infinity; for (const [cx, cy] of coast) { const d = (cx - x) ** 2 + (cy - y) ** 2; if (d < m) m = d; } return Math.sqrt(m);
}

/** Stylised, exaggerated elevation (map units). Rises towards Lapland fells. */
export function elevation(x: number, y: number) {
  const north = Math.max(0, (MAP_BOUNDS.minY + MAP_BOUNDS.height * 0.45 - y) / (MAP_BOUNDS.height * 0.45));
  const fell = Math.max(0, 1 - Math.hypot(x - 22, y - 8) / 18) * 1.6; // north-west "käsivarsi" fells
  const n = noise(x * 0.22, y * 0.22) * 0.65 + noise(x * 0.6, y * 0.6) * 0.25;
  const base = 0.3 + n * (0.7 + north * 1.6) + fell * 1.2;
  const cd = Math.min(1, coastDist(x, y) / 4); const coastFade = cd * cd * (3 - 2 * cd);
  return base * coastFade;
}

export interface TerrainMesh { positions: Float32Array; heights: Float32Array; index: Uint32Array }

export function buildTerrain(step = 1.3): TerrainMesh {
  const pts: Pt[] = [];
  FINLAND_POLYGONS.forEach((r) => {
    for (let i = 0; i < r.length; i++) {
      const [ax, ay] = r[i], [bx, by] = r[(i + 1) % r.length];
      const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / (step * 0.6)));
      for (let k = 0; k < n; k++) pts.push([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n]);
    }
  });
  for (let y = MAP_BOUNDS.minY; y < MAP_BOUNDS.maxY; y += step) {
    for (let x = MAP_BOUNDS.minX; x < MAP_BOUNDS.maxX; x += step) {
      const jx = x + (hash(x, y) - 0.5) * step * 0.7, jy = y + (hash(y, x) - 0.5) * step * 0.7;
      if (insideFinland(jx, jy) && coastDist(jx, jy) > step * 0.4) pts.push([jx, jy]);
    }
  }
  const d = Delaunator.from(pts);
  const tri: number[] = [];
  for (let i = 0; i < d.triangles.length; i += 3) {
    const a = pts[d.triangles[i]], b = pts[d.triangles[i + 1]], c = pts[d.triangles[i + 2]];
    if (insideFinland((a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3)) tri.push(d.triangles[i], d.triangles[i + 2], d.triangles[i + 1]);
  }
  const heights = new Float32Array(pts.length);
  const positions = new Float32Array(pts.length * 3);
  pts.forEach(([x, y], i) => { const h = elevation(x, y); heights[i] = h; positions.set([x, h, y], i * 3); });
  return { positions, heights, index: new Uint32Array(tri) };
}
