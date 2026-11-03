import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Station, TrackLine, Train, Language } from '../../types';
import { RAIL_NETWORK, ROUTES, MAP_BOUNDS, pointAlong } from '../../geo/network';
import { buildTerrain, elevation } from './terrain';
import { TRAIN_COLORS } from './RailMap2D';

export interface ThreeDLiveMapProps {
  stations: Station[];
  tracks: TrackLine[];
  trains: Train[];
  selectedTrainId: string | null;
  onSelectTrain: (train: Train) => void;
  selectedStationId: string | null;
  onSelectStation: (station: Station) => void;
  reducedMotion: boolean;
  language: Language;
}

type Preset = 'overview' | 'tampere' | 'oulu';
const CX = MAP_BOUNDS.minX + MAP_BOUNDS.width / 2;
const CZ = MAP_BOUNDS.minY + MAP_BOUNDS.height / 2;
const LIFT = 0.12;
const world = (x: number, y: number, lift = LIFT) => new THREE.Vector3(x - CX, elevation(x, y) + lift, y - CZ);

const STATUS_HEX: Record<NonNullable<TrackLine['status']>, number> = { normal: 0x7fa6cc, weather_alert: 0x4da3ff, delay_cascade: 0xf0a030 };

// Faceted terrain: per-fragment flat normal from screen-space derivatives.
const terrainVert = /* glsl */ `
  varying vec3 vWorld; varying float vH;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz; vH = position.y;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;
const terrainFrag = /* glsl */ `
  uniform vec3 uSunDir; uniform vec3 uSun; uniform vec3 uSky; uniform vec3 uGround;
  uniform vec3 uLow; uniform vec3 uHigh; uniform vec3 uFog; uniform float uFogNear; uniform float uFogFar;
  varying vec3 vWorld; varying float vH;
  void main() {
    vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
    if (n.y < 0.0) n = -n;
    vec3 base = mix(uLow, uHigh, smoothstep(0.0, 4.0, vH));
    float diff = max(dot(n, normalize(uSunDir)), 0.0);
    vec3 hemi = mix(uGround, uSky, n.y * 0.5 + 0.5);
    vec3 col = base * (hemi + uSun * diff);
    float d = length(cameraPosition - vWorld);
    col = mix(col, uFog, smoothstep(uFogNear, uFogFar, d));
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }`;

export const ThreeDLiveMap: React.FC<ThreeDLiveMapProps> = ({
  stations, tracks, trains, selectedTrainId, onSelectTrain, selectedStationId, onSelectStation, reducedMotion, language,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [preset, setPreset] = useState<Preset>('overview');
  const [webglError, setWebglError] = useState(false);
  const api = useRef<{ go: (p: Preset) => void; setTrains: (t: Train[]) => void; setReduced: (r: boolean) => void; setSel: (id: string | null) => void } | null>(null);
  const cb = useRef({ onSelectTrain, onSelectStation, trains, stations });
  cb.current = { onSelectTrain, onSelectStation, trains, stations };

  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch {
      setWebglError(true); return;
    }
    const W = () => el.clientWidth || 800, H = () => el.clientHeight || 600;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W(), H());
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');

    const labels = new CSS2DRenderer();
    labels.setSize(W(), H());
    Object.assign(labels.domElement.style, { position: 'absolute', inset: '0', pointerEvents: 'none' });
    labels.domElement.setAttribute('aria-hidden', 'true');
    el.appendChild(labels.domElement);

    const scene = new THREE.Scene();
    const FOG = new THREE.Color(0x0b1118);
    scene.background = FOG;

    const camera = new THREE.PerspectiveCamera(38, W() / H(), 0.5, 600);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !reducedMotion;
    controls.maxPolarAngle = Math.PI * 0.42;
    controls.minDistance = 12;
    controls.maxDistance = 180;
    controls.screenSpacePanning = false;

    const PRESETS: Record<Preset, { pos: THREE.Vector3; target: THREE.Vector3 }> = (() => {
      const tpe = stations.find((s) => s.id === 'TPE')!, oul = stations.find((s) => s.id === 'OUL')!;
      const t = world(tpe.x, tpe.y, 0), o = world(oul.x, oul.y, 0);
      return {
        overview: { pos: new THREE.Vector3(12, 62, 76), target: new THREE.Vector3(1, 0, 12) },
        tampere: { pos: t.clone().add(new THREE.Vector3(6, 16, 18)), target: t },
        oulu: { pos: o.clone().add(new THREE.Vector3(6, 18, 20)), target: o },
      };
    })();
    camera.position.copy(PRESETS.overview.pos);
    controls.target.copy(PRESETS.overview.target);
    let fly: { from: THREE.Vector3; to: THREE.Vector3; tf: THREE.Vector3; tt: THREE.Vector3; t: number } | null = null;

    // Sea plane + faint grid
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ color: 0x0d1620 }));
    sea.rotation.x = -Math.PI / 2; sea.position.y = -0.02; scene.add(sea);
    const grid = new THREE.GridHelper(240, 29, 0x16212c, 0x121b25); grid.position.y = -0.01; scene.add(grid);

    // Terrain
    const tm = buildTerrain(1.25);
    const tgeo = new THREE.BufferGeometry();
    const pos = tm.positions.slice();
    for (let i = 0; i < pos.length; i += 3) { pos[i] -= CX; pos[i + 2] -= CZ; }
    tgeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    tgeo.setIndex(new THREE.BufferAttribute(tm.index, 1));
    const tmat = new THREE.ShaderMaterial({
      vertexShader: terrainVert, fragmentShader: terrainFrag, side: THREE.DoubleSide,
      uniforms: {
        uSunDir: { value: new THREE.Vector3(-0.75, 0.35, 0.55) },
        uSun: { value: new THREE.Color(0xffb27a).multiplyScalar(1.7) },
        uSky: { value: new THREE.Color(0x34506e) },
        uGround: { value: new THREE.Color(0x0e1620) },
        uLow: { value: new THREE.Color(0x33495e) },
        uHigh: { value: new THREE.Color(0x8195a8) },
        uFog: { value: FOG }, uFogNear: { value: 90 }, uFogFar: { value: 220 },
      },
    });
    scene.add(new THREE.Mesh(tgeo, tmat));

    // Full rail network (thin, dim)
    const segs: number[] = [];
    RAIL_NETWORK.forEach((l) => { for (let i = 1; i < l.length; i++) { const a = world(l[i - 1][0], l[i - 1][1], 0.06), b = world(l[i][0], l[i][1], 0.06); segs.push(a.x, a.y, a.z, b.x, b.y, b.z); } });
    const netGeo = new THREE.BufferGeometry(); netGeo.setAttribute('position', new THREE.Float32BufferAttribute(segs, 3));
    scene.add(new THREE.LineSegments(netGeo, new THREE.LineBasicMaterial({ color: 0x5f7c98, transparent: true, opacity: 0.55 })));

    // Scenario routes: glowing tubes
    const disposables: { dispose: () => void }[] = [tgeo, tmat, netGeo];
    tracks.forEach((tr) => {
      const p = ROUTES[tr.id]; if (!p) return;
      const curve = new THREE.CatmullRomCurve3(p.map(([x, y]) => world(x, y)), false, 'centripetal', 0.2);
      const color = STATUS_HEX[tr.status ?? 'normal'];
      const segsN = Math.max(16, p.length * 4);
      const core = new THREE.TubeGeometry(curve, segsN, tr.isDoubleTrack ? 0.11 : 0.08, 5, false);
      const glow = new THREE.TubeGeometry(curve, segsN, 0.32, 6, false);
      const coreMat = new THREE.MeshBasicMaterial({ color });
      const glowMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: tr.status === 'normal' ? 0.08 : 0.22, blending: THREE.AdditiveBlending, depthWrite: false });
      scene.add(new THREE.Mesh(core, coreMat), new THREE.Mesh(glow, glowMat));
      disposables.push(core, glow, coreMat, glowMat);
    });

    // Stations
    const pickables: THREE.Object3D[] = [];
    const stMat = new THREE.MeshBasicMaterial({ color: 0xf2f5f7 });
    const hubMat = new THREE.MeshBasicMaterial({ color: 0xf0a030 });
    const stGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.5, 16);
    disposables.push(stMat, hubMat, stGeo);
    stations.forEach((s) => {
      const m = new THREE.Mesh(stGeo, s.isDelayHub ? hubMat : stMat);
      m.position.copy(world(s.x, s.y, 0.25)); m.userData = { station: s.id }; scene.add(m); pickables.push(m);
      const div = document.createElement('div');
      div.className = 'ft-3d-label' + (s.isDelayHub ? ' hub' : '');
      div.textContent = s.name;
      const lab = new CSS2DObject(div); lab.position.copy(world(s.x, s.y, 0.9)); scene.add(lab);
    });

    // Ripple at delay hub
    const hub = stations.find((s) => s.isDelayHub);
    const ripples: THREE.Mesh[] = [];
    if (hub) {
      const rg = new THREE.RingGeometry(0.92, 1, 64); rg.rotateX(-Math.PI / 2); disposables.push(rg);
      for (let i = 0; i < 3; i++) {
        const m = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color: 0xf0a030, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
        m.position.copy(world(hub.x, hub.y, 0.2)); m.userData.phase = i / 3; scene.add(m); ripples.push(m);
      }
    }

    // Trains
    const trainGroup = new THREE.Group(); scene.add(trainGroup);
    const trainGeo = new THREE.SphereGeometry(0.45, 16, 12);
    const haloGeo = new THREE.SphereGeometry(0.75, 16, 12);
    disposables.push(trainGeo, haloGeo);
    let trainObjs: { t: Train; mesh: THREE.Mesh; halo: THREE.Mesh }[] = [];
    let selId: string | null = selectedTrainId;
    const setTrains = (list: Train[]) => {
      trainObjs.forEach((o) => { trainGroup.remove(o.mesh, o.halo); pickables.splice(pickables.indexOf(o.mesh), 1); (o.mesh.material as THREE.Material).dispose(); (o.halo.material as THREE.Material).dispose(); });
      trainObjs = list.map((t) => {
        const cancelled = t.status === 'cancelled';
        const color = cancelled ? 0xf25555 : TRAIN_COLORS[t.type];
        const mesh = new THREE.Mesh(trainGeo, new THREE.MeshBasicMaterial({ color }));
        const halo = new THREE.Mesh(haloGeo, new THREE.MeshBasicMaterial({ color: t.delayMinutes > 0 ? 0xf0a030 : color, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false }));
        mesh.userData = { train: t.id };
        trainGroup.add(mesh, halo); pickables.push(mesh);
        return { t, mesh, halo };
      });
      place(0);
    };
    const place = (elapsed: number) => {
      trainObjs.forEach(({ t, mesh, halo }) => {
        let x = t.x, y = t.y;
        if (t.lineId && t.along !== undefined && t.status !== 'cancelled' && !reducedFlag) {
          // visual motion: ~ speed-proportional drift along the route, ping-pong within ±8 %
          const s = (elapsed * (t.speedKmH / 160) * 0.004) % 0.32;
          const off = s < 0.16 ? s : 0.32 - s;
          const p = pointAlong(t.lineId, t.along + (t.travelDir ?? 1) * (off - 0.08));
          x = p.x; y = p.y;
        }
        const w = world(x, y, 0.45); mesh.position.copy(w); halo.position.copy(w);
        const sel = t.id === selId; halo.scale.setScalar(sel ? 1.6 : 1);
        (halo.material as THREE.MeshBasicMaterial).opacity = sel ? 0.5 : 0.25;
      });
    };
    let reducedFlag = reducedMotion;
    setTrains(trains);

    // Picking
    const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2();
    let down = { x: 0, y: 0 };
    const onDown = (e: PointerEvent) => { down = { x: e.clientX, y: e.clientY }; };
    const onUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) return;
      const r = renderer.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(pickables, false)[0]; if (!hit) return;
      const { train, station } = hit.object.userData;
      if (train) { const t = cb.current.trains.find((x) => x.id === train); if (t) cb.current.onSelectTrain(t); }
      if (station) { const s = cb.current.stations.find((x) => x.id === station); if (s) cb.current.onSelectStation(s); }
    };
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointerup', onUp);

    const onResize = () => { camera.aspect = W() / H(); camera.updateProjectionMatrix(); renderer.setSize(W(), H()); labels.setSize(W(), H()); render(); };
    const ro = new ResizeObserver(onResize); ro.observe(el);

    const clock = new THREE.Clock();
    let raf = 0;
    const render = () => { renderer.render(scene, camera); labels.render(scene, camera); };
    const tick = () => {
      const dt = clock.getDelta(); const el2 = clock.elapsedTime;
      if (fly) {
        fly.t = Math.min(1, fly.t + dt / 1.2); const k = 1 - Math.pow(1 - fly.t, 3);
        camera.position.lerpVectors(fly.from, fly.to, k); controls.target.lerpVectors(fly.tf, fly.tt, k);
        if (fly.t >= 1) fly = null;
      }
      controls.update();
      if (!reducedFlag) {
        ripples.forEach((m) => { const p = (el2 / 3 + m.userData.phase) % 1; m.scale.setScalar(0.6 + p * 5.5); (m.material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - p); });
        place(el2);
      } else {
        ripples.forEach((m, i) => { m.scale.setScalar(1.5 + i * 1.5); (m.material as THREE.MeshBasicMaterial).opacity = 0.35; });
      }
      render();
      raf = requestAnimationFrame(tick);
    };
    tick();

    api.current = {
      go: (p) => {
        const P = PRESETS[p];
        if (reducedFlag) { camera.position.copy(P.pos); controls.target.copy(P.target); controls.update(); return; }
        fly = { from: camera.position.clone(), to: P.pos.clone(), tf: controls.target.clone(), tt: P.target.clone(), t: 0 };
      },
      setTrains,
      setReduced: (r) => { reducedFlag = r; controls.enableDamping = !r; if (r) place(0); },
      setSel: (id) => { selId = id; },
    };

    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      trainObjs.forEach((o) => { (o.mesh.material as THREE.Material).dispose(); (o.halo.material as THREE.Material).dispose(); });
      ripples.forEach((m) => (m.material as THREE.Material).dispose());
      disposables.forEach((d) => d.dispose());
      renderer.dispose(); el.innerHTML = ''; api.current = null;
    };
    // scene is built once; dynamic data flows through api.current
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stations, tracks]);

  useEffect(() => { api.current?.setTrains(trains); }, [trains]);
  useEffect(() => { api.current?.setReduced(reducedMotion); }, [reducedMotion]);
  useEffect(() => { api.current?.setSel(selectedTrainId); }, [selectedTrainId]);

  const go = (p: Preset) => { setPreset(p); api.current?.go(p); };
  const fi = language === 'fi';
  const presets: [Preset, string][] = [['overview', fi ? 'Koko Suomi' : 'All Finland'], ['tampere', 'Tampere'], ['oulu', 'Oulu']];
  void selectedStationId;

  return (
    <div className="relative w-full h-full bg-[#0B1118] overflow-hidden">
      <div ref={containerRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />
      {webglError && (
        <p className="absolute inset-0 flex items-center justify-center text-sm text-[#C4CFDA] p-6 text-center">
          {fi ? 'WebGL ei ole käytettävissä. Käytä 2D-karttaa tai taulukkonäkymää.' : 'WebGL is not available. Use the 2D map or the table view.'}
        </p>
      )}
      <div className="absolute bottom-3 left-3 z-20 flex gap-1 p-1 rounded-[8px] bg-[#16202A]/90 border border-[#243444]" role="group" aria-label={fi ? 'Kameran esiasetukset' : 'Camera presets'}>
        {presets.map(([id, lab]) => (
          <button
            key={id} type="button" aria-pressed={preset === id} onClick={() => go(id)}
            className={`px-2.5 py-1 rounded-[6px] text-xs font-medium ${preset === id ? 'bg-[#4DA3FF] text-[#0E141B]' : 'text-[#F2F5F7] hover:bg-[#223242]'}`}
          >{lab}</button>
        ))}
      </div>
      <p className="absolute bottom-3 right-3 z-20 text-[11px] text-[#C4CFDA] bg-[#16202A]/80 px-2 py-1 rounded" aria-hidden="true">
        {fi ? 'Vedä: kierrä · Rulla: zoomaa · Oikea: siirrä' : 'Drag: orbit · Scroll: zoom · Right-drag: pan'}
      </p>
    </div>
  );
};
