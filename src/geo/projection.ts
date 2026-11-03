/**
 * ETRS-TM35FIN (EPSG:3067) forward projection + normalisation to map units.
 * Map units: 0..100 on the vertical axis covers ~1200 km (1 unit = 12 km),
 * x uses the same scale so shapes are not distorted.
 */
const a = 6378137;
const f = 1 / 298.257222101;
const k0 = 0.9996;
const lon0 = (27 * Math.PI) / 180;
const FE = 500000;
const n = f / (2 - f);
const A1 = (a / (1 + n)) * (1 + n * n / 4 + n ** 4 / 64);
const e = Math.sqrt(f * (2 - f));
const h1 = n / 2 - (2 / 3) * n * n + (5 / 16) * n ** 3;
const h2 = (13 / 48) * n * n - (3 / 5) * n ** 3;
const h3 = (61 / 240) * n ** 3;

export function toTM35FIN(lon: number, lat: number): [number, number] {
  const phi = (lat * Math.PI) / 180;
  const lam = (lon * Math.PI) / 180 - lon0;
  const Q = Math.asinh(Math.tan(phi)) - e * Math.atanh(e * Math.sin(phi));
  const beta = Math.atan(Math.sinh(Q));
  const eta0 = Math.atanh(Math.cos(beta) * Math.sin(lam));
  const xi0 = Math.asin(Math.sin(beta) * Math.cosh(eta0));
  let xi = xi0;
  let eta = eta0;
  [h1, h2, h3].forEach((h, i) => {
    const k = 2 * (i + 1);
    xi += h * Math.sin(k * xi0) * Math.cosh(k * eta0);
    eta += h * Math.cos(k * xi0) * Math.sinh(k * eta0);
  });
  return [FE + k0 * A1 * eta, k0 * A1 * xi];
}

export const MAP_SCALE_M = 1_200_000; // metres per 100 map units
export const MAP_E0 = 40_000;
export const MAP_N1 = 7_800_000;

/** lon/lat (WGS84) -> map units {x, y} (y grows southwards like SVG). */
export function project(lon: number, lat: number): { x: number; y: number } {
  const [E, N] = toTM35FIN(lon, lat);
  return { x: ((E - MAP_E0) / MAP_SCALE_M) * 100, y: ((MAP_N1 - N) / MAP_SCALE_M) * 100 };
}
