/**
 * Bakes static geodata for offline use:
 *  - Finland outline: Natural Earth 1:50m admin-0 (public domain)
 *  - Rail network geometry: Digitraffic infra-api radat.geojson (CC BY 4.0, Fintraffic / Väylävirasto)
 *  - Stations: Digitraffic /api/v1/metadata/stations (CC BY 4.0)
 * Usage: npx tsx scripts/build-geo.ts <ne_50m_admin_0_countries.geojson> <radat.geojson> <stations.json>
 */
import fs from 'node:fs';
import { project } from '../src/geo/projection';

type P = [number, number];
const [neFile, radatFile, stFile] = process.argv.slice(2);
const r2 = (v: number) => Math.round(v * 100) / 100;
const pr = ([lon, lat]: number[]): P => { const p = project(lon, lat); return [p.x, p.y]; };

function dp(pts: P[], tol: number): P[] {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [s, eIdx] = stack.pop()!;
    const [ax, ay] = pts[s], [bx, by] = pts[eIdx];
    const L = Math.hypot(bx - ax, by - ay) || 1e-9;
    let md = 0, mi = -1;
    for (let i = s + 1; i < eIdx; i++) {
      const d = Math.abs((bx - ax) * (ay - pts[i][1]) - (ax - pts[i][0]) * (by - ay)) / L;
      if (d > md) { md = d; mi = i; }
    }
    if (md > tol && mi > 0) { keep[mi] = 1; stack.push([s, mi], [mi, eIdx]); }
  }
  return pts.filter((_, i) => keep[i]);
}

// Finland outline
const ne = JSON.parse(fs.readFileSync(neFile, 'utf8'));
const fin = ne.features.find((f: any) => f.properties.ADMIN === 'Finland');
const area = (r: P[]) => Math.abs(r.reduce((s, p, i) => { const q = r[(i + 1) % r.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2);
const polygons: P[][] = fin.geometry.coordinates
  .map((poly: number[][][]) => { const r = poly[0].slice(0, -1).map(pr); const h = r.length >> 1; return [...dp(r.slice(0, h + 1), 0.04).slice(0, -1), ...dp(r.slice(h), 0.04)].map(([x, y]) => [r2(x), r2(y)] as P); })
  .filter((r: P[]) => area(r) > 0.3)
  .sort((p: P[], q: P[]) => area(q) - area(p));

// Rail network
const radat = JSON.parse(fs.readFileSync(radatFile, 'utf8'));
const lines: P[][] = [];
for (const f of radat.features) {
  const g = f.geometry; if (!g) continue;
  const parts = g.type === 'MultiLineString' ? g.coordinates : [g.coordinates];
  for (const part of parts) {
    const s = dp(part.map(pr), 0.02).map(([x, y]: P) => [r2(x), r2(y)] as P);
    if (s.length >= 2) lines.push(s);
  }
}

// Stations
const st = JSON.parse(fs.readFileSync(stFile, 'utf8'));
const stations = st
  .filter((s: any) => s.passengerTraffic && s.countryCode === 'FI')
  .map((s: any) => { const p = project(s.longitude, s.latitude); return { code: s.stationShortCode, name: s.stationName.replace(/ asema$/, ''), x: r2(p.x), y: r2(p.y) }; });

// Graph for routing between stations along the real network
const nodes: P[] = []; const key = new Map<string, number>();
const adj: Map<number, [number, number][]> = new Map();
const nodeId = (p: P) => { const k = `${p[0]},${p[1]}`; let id = key.get(k); if (id === undefined) { id = nodes.length; nodes.push(p); key.set(k, id); adj.set(id, []); } return id; };
const link = (u: number, v: number) => { const d = Math.hypot(nodes[u][0] - nodes[v][0], nodes[u][1] - nodes[v][1]); adj.get(u)!.push([v, d]); adj.get(v)!.push([u, d]); };
const densify = (l: P[]): P[] => { const out: P[] = [l[0]]; for (let i = 1; i < l.length; i++) { const [ax, ay] = l[i - 1], [bx, by] = l[i]; const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 0.08)); for (let k = 1; k <= n; k++) out.push([r2(ax + ((bx - ax) * k) / n), r2(ay + ((by - ay) * k) / n)]); } return out; };
for (const l0 of lines) { const l = densify(l0); for (let i = 1; i < l.length; i++) link(nodeId(l[i - 1]), nodeId(l[i])); }
// connect lines at junctions (vertices within ~1.2 km)
const G = 0.1; const grid = new Map<string, number[]>();
nodes.forEach((p, i) => { const k = `${Math.floor(p[0] / G)},${Math.floor(p[1] / G)}`; (grid.get(k) ?? grid.set(k, []).get(k)!).push(i); });
nodes.forEach((p, i) => {
  const gx = Math.floor(p[0] / G), gy = Math.floor(p[1] / G);
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (const j of grid.get(`${gx + dx},${gy + dy}`) ?? []) if (j > i && Math.hypot(nodes[j][0] - p[0], nodes[j][1] - p[1]) < G) link(i, j);
});
// bridge small gaps: link every line end to the closest node of another line within ~3.6 km
const lineOf = new Int32Array(200000).fill(-1);
lines.forEach((l0, li) => densify(l0).forEach((p) => { lineOf[key.get(`${p[0]},${p[1]}`)!] = li; }));
lines.forEach((l, li) => [l[0], l[l.length - 1]].forEach((p) => {
  const u = key.get(`${p[0]},${p[1]}`)!; let b = -1, bd = 0.3;
  nodes.forEach((q, j) => { if (lineOf[j] !== li) { const d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (d < bd) { bd = d; b = j; } } });
  if (b >= 0) link(u, b);
}));
const nearest = (x: number, y: number) => { let b = 0, bd = Infinity; nodes.forEach((p, i) => { const d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; b = i; } }); return b; };
function route(a: string, b: string): P[] {
  const sa = stations.find((s: any) => s.code === a), sb = stations.find((s: any) => s.code === b);
  const src = nearest(sa.x, sa.y), dst = nearest(sb.x, sb.y);
  const dist = new Float64Array(nodes.length).fill(Infinity); const prev = new Int32Array(nodes.length).fill(-1);
  dist[src] = 0; const heap: [number, number][] = [[0, src]];
  while (heap.length) {
    let mi = 0; for (let i = 1; i < heap.length; i++) if (heap[i][0] < heap[mi][0]) mi = i;
    const [d, u] = heap.splice(mi, 1)[0]; if (d > dist[u]) continue; if (u === dst) break;
    for (const [v, w] of adj.get(u)!) if (d + w < dist[v]) { dist[v] = d + w; prev[v] = u; heap.push([d + w, v]); }
  }
  if (prev[dst] === -1) console.error('UNREACHABLE', a, b, nodes[src], nodes[dst], sa, sb);
  const path: P[] = []; for (let u = dst; u !== -1; u = prev[u]) path.push(nodes[u]);
  return [[sb.x, sb.y] as P, ...path, [sa.x, sa.y] as P].reverse();
}
const PAIRS: [string, string, string][] = [
  ['line-hki-ri', 'HKI', 'RI'], ['line-ri-tpe', 'RI', 'TPE'], ['line-tpe-sk', 'TPE', 'SK'], ['line-sk-oul', 'SK', 'OL'],
  ['line-oul-kem', 'OL', 'KEM'], ['line-kem-roi', 'KEM', 'ROI'], ['line-hki-tku', 'HKI', 'TKU'], ['line-tku-tpe', 'TKU', 'TPE'],
  ['line-tpe-jyv', 'TPE', 'JY'], ['line-jyv-kuo', 'JY', 'KUO'], ['line-jyv-sk', 'JY', 'SK'], ['line-ri-lh', 'RI', 'LH'],
  ['line-lh-kv', 'LH', 'KV'], ['line-kv-kuo', 'KV', 'KUO'], ['line-kuo-oul', 'KUO', 'OL'],
];
const routes: Record<string, P[]> = {};
for (const [id, a, b] of PAIRS) routes[id] = dp(route(a, b), 0.03);

fs.writeFileSync('src/data/geo/finland.json', JSON.stringify(polygons));
fs.writeFileSync('src/data/geo/rail-network.json', JSON.stringify(lines));
fs.writeFileSync('src/data/geo/stations.json', JSON.stringify(stations));
fs.writeFileSync('src/data/geo/routes.json', JSON.stringify(routes));
console.log({ polygons: polygons.length, lines: lines.length, pts: lines.reduce((s, l) => s + l.length, 0), stations: stations.length, routes: Object.fromEntries(Object.entries(routes).map(([k, v]) => [k, v.length])) });
