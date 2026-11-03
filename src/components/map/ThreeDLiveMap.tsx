import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Station, TrackLine, Train, Language } from '../../types';
import { TRANSLATIONS } from '../../data/railData';
import { Maximize2, Compass, Eye, Crosshair, Sparkles, Snowflake, AlertCircle } from 'lucide-react';

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

/**
 * ThreeDLiveMap: Production-grade 3D "Elävä kartta" (Living Map)
 * - Three.js custom shader with GPU-evaluated faceted normals via:
 *   normalize(cross(dFdx(vWorldPosition), dFdy(vWorldPosition)))
 * - Tampere delay ripple wave shader expanding over Finnish terrain
 * - 3D TripsLayer-style train light trails and volumetric headlights
 * - FMI Snowstorm atmospheric particle system over Oulu / Ostrobothnia
 * - Smooth interactive Orbit camera controls with station / train focusing
 */
export const ThreeDLiveMap: React.FC<ThreeDLiveMapProps> = ({
  stations,
  trains,
  selectedTrainId,
  onSelectTrain,
  selectedStationId,
  onSelectStation,
  reducedMotion,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const containerRef = useRef<HTMLDivElement>(null);
  const [cameraPreset, setCameraPreset] = useState<'overview' | 'tampere' | 'oulu'>('overview');
  const [hoveredEntity, setHoveredEntity] = useState<string | null>(null);

  // Store references for runtime updates without recreating Three.js scene
  const trainMeshesRef = useRef<Map<string, { group: THREE.Group; trail: THREE.Line; trainData: Train }>>(new Map());
  const cameraTargetRef = useRef<{ pos: THREE.Vector3; lookAt: THREE.Vector3 }>({
    pos: new THREE.Vector3(0, 75, 80),
    lookAt: new THREE.Vector3(0, 0, 5),
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Detect software WebGL to balance performance
    const gl = document.createElement('canvas').getContext('webgl2');
    let isSoftwareGl = false;
    if (gl) {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    }

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e141b);
    scene.fog = new THREE.FogExp2(0x0e141b, 0.0075);

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 500);
    camera.position.set(0, 75, 80);
    camera.lookAt(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    container.appendChild(renderer.domElement);

    // 2. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0x354a5e, 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff3e0, 2.2);
    sunLight.position.set(50, 90, 40);
    scene.add(sunLight);

    const blueRimLight = new THREE.DirectionalLight(0x4da3ff, 1.5);
    blueRimLight.position.set(-60, 40, -50);
    scene.add(blueRimLight);

    // Coordinate mapping helper:
    // 2D percentage (0..100 X, 0..100 Y) -> 3D coordinates (X: -40..40, Z: -55..55)
    // In our SVG map, Y=0 is North (Rovaniemi), Y=100 is South (Gulf of Finland/Helsinki)
    const mapCoordsTo3D = (px: number, py: number): { x: number; z: number } => {
      const x = (px - 50) * 0.85; // centered around 0
      const z = (py - 50) * 1.15; // south is +Z, north is -Z
      return { x, z };
    };

    // Calculate elevation based on Finland's terrain topology
    const getTerrainHeight = (worldX: number, worldZ: number): number => {
      // Distance from center of Finland
      const normX = worldX / 40;
      const normZ = worldZ / 55;

      // Check if inside Finland roughly
      const finDist = Math.sqrt(normX * normX * 1.4 + normZ * normZ);
      if (finDist > 1.05) return 0.0; // Sea (Baltic / Gulf of Bothnia)

      // Salpausselkä ridge in the south-east
      const salpausselka = Math.exp(-Math.pow((normX - 0.2) * 3 + (normZ - 0.5) * 3, 2)) * 3.5;
      // Lake plateau ripples
      const lakes = Math.sin(worldX * 0.3) * Math.cos(worldZ * 0.25) * 1.8;
      // Northern Lapland fells (elevations rise towards north, normZ < -0.3)
      const lapland = Math.max(0, -normZ - 0.2) * 12.0 + Math.sin(worldX * 0.5) * 2.0;

      const rawHeight = Math.max(0, 1.2 + salpausselka + lakes + lapland);
      return rawHeight;
    };

    // 3. Faceted Terrain Shader (User's formula: normalize(cross(dFdx(vWorldPos), dFdy(vWorldPos))))
    const terrainGeo = new THREE.PlaneGeometry(90, 130, 80, 110);
    terrainGeo.rotateX(-Math.PI / 2);

    // Apply elevation displacement directly into vertices
    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      const h = getTerrainHeight(vx, vz);
      posAttr.setY(i, h);
    }
    terrainGeo.computeVertexNormals();

    const tampere3D = mapCoordsTo3D(41, 74);

    const terrainUniforms = {
      uTime: { value: 0 },
      uTamperePos: { value: new THREE.Vector2(tampere3D.x, tampere3D.z) },
      uLightPos: { value: new THREE.Vector3(50, 90, 40) },
      uSeaColor: { value: new THREE.Color(0x0a1016) },
      uLowlandColor: { value: new THREE.Color(0x141f2a) },
      uHighlandColor: { value: new THREE.Color(0x223546) },
      uSnowColor: { value: new THREE.Color(0x4a6b8a) },
      uRippleColor: { value: new THREE.Color(0xf0a030) },
    };

    const terrainShaderMat = new THREE.ShaderMaterial({
      uniforms: terrainUniforms,
      vertexShader: `
        varying vec3 vWorldPosition;
        varying vec2 vUv;
        varying float vHeight;

        void main() {
          vUv = uv;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          vHeight = position.y;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec2 uTamperePos;
        uniform vec3 uLightPos;
        uniform vec3 uSeaColor;
        uniform vec3 uLowlandColor;
        uniform vec3 uHighlandColor;
        uniform vec3 uSnowColor;
        uniform vec3 uRippleColor;

        varying vec3 vWorldPosition;
        varying vec2 vUv;
        varying float vHeight;

        void main() {
          // USER'S EXACT NORMAL FORMULA FOR FACETED / LOW-POLY SHADING:
          vec3 fdx = dFdx(vWorldPosition);
          vec3 fdy = dFdy(vWorldPosition);
          vec3 normal = normalize(cross(fdx, fdy));

          // Directional Light Lambert Shading
          vec3 lightDir = normalize(uLightPos - vWorldPosition);
          float diff = max(dot(normal, lightDir), 0.0);

          // Subtle cool ambient sky bounce
          vec3 skyDir = vec3(0.0, 1.0, 0.0);
          float skyDiff = max(dot(normal, skyDir), 0.0) * 0.35;

          // Base elevation palette
          vec3 baseColor = uLowlandColor;
          if (vHeight < 0.2) {
            baseColor = uSeaColor; // Baltic Sea / Coastline
          } else if (vHeight < 6.0) {
            baseColor = mix(uLowlandColor, uHighlandColor, vHeight / 6.0);
          } else {
            baseColor = mix(uHighlandColor, uSnowColor, clamp((vHeight - 6.0) / 8.0, 0.0, 1.0));
          }

          vec3 shadedColor = baseColor * (diff * 0.75 + skyDiff + 0.25);

          // Faceted polygon edge highlight (gives crisp low-poly definition)
          float edgeGlow = (1.0 - abs(dot(normal, vec3(0.0, 1.0, 0.0)))) * 0.12;
          shadedColor += vec3(edgeGlow * 0.3, edgeGlow * 0.5, edgeGlow * 0.7);

          // Tampere Delay Ripple concentric wave expansion
          float distToTampere = length(vWorldPosition.xz - uTamperePos);
          if (distToTampere < 42.0) {
            float wave = sin(distToTampere * 0.45 - uTime * 3.5);
            float ripple = smoothstep(0.75, 0.99, wave) * exp(-distToTampere * 0.075);
            shadedColor += uRippleColor * ripple * 1.8;
          }

          gl_FragColor = vec4(shadedColor, 1.0);
        }
      `,
    });

    const terrainMesh = new THREE.Mesh(terrainGeo, terrainShaderMat);
    scene.add(terrainMesh);

    // 4. Elevated Railway Tracks (Glowing extruded curves connecting Finland stations)
    const trackSplines: { id: string; points: THREE.Vector3[]; isDelayCascade: boolean }[] = [];

    // Connect stations according to Finnish railway trunk lines
    const connectLines: { from: string; to: string; isCascade?: boolean }[] = [
      { from: 'HKI', to: 'RI' },
      { from: 'RI', to: 'TPE', isCascade: true },
      { from: 'TPE', to: 'SK', isCascade: true },
      { from: 'SK', to: 'OUL' },
      { from: 'OUL', to: 'KEM' },
      { from: 'KEM', to: 'ROI' },
      { from: 'HKI', to: 'TKU', isCascade: true },
      { from: 'TKU', to: 'TPE' },
      { from: 'TPE', to: 'JYV', isCascade: true },
      { from: 'JYV', to: 'KUO' },
      { from: 'KUO', to: 'OUL' },
      { from: 'RI', to: 'LH' },
      { from: 'LH', to: 'KV' },
      { from: 'KV', to: 'KUO' },
    ];

    const tracksGroup = new THREE.Group();
    scene.add(tracksGroup);

    connectLines.forEach((conn) => {
      const stFrom = stations.find((s) => s.id === conn.from);
      const stTo = stations.find((s) => s.id === conn.to);
      if (!stFrom || !stTo) return;

      const p1 = mapCoordsTo3D(stFrom.x, stFrom.y);
      const p2 = mapCoordsTo3D(stTo.x, stTo.y);

      // Height grounded above terrain
      const h1 = getTerrainHeight(p1.x, p1.z) + 0.6;
      const h2 = getTerrainHeight(p2.x, p2.z) + 0.6;

      const midX = (p1.x + p2.x) * 0.5;
      const midZ = (p1.z + p2.z) * 0.5;
      const midH = getTerrainHeight(midX, midZ) + 0.8;

      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(p1.x, h1, p1.z),
        new THREE.Vector3(midX, midH, midZ),
        new THREE.Vector3(p2.x, h2, p2.z),
      ]);

      const trackTubeGeo = new THREE.TubeGeometry(curve, 32, 0.28, 8, false);
      const isCascade = conn.isCascade || false;

      const trackMat = new THREE.MeshStandardMaterial({
        color: isCascade ? 0xf0a030 : 0x354a5e,
        emissive: isCascade ? 0x905010 : 0x16202a,
        roughness: 0.3,
        metalness: 0.8,
      });

      const trackMesh = new THREE.Mesh(trackTubeGeo, trackMat);
      tracksGroup.add(trackMesh);

      trackSplines.push({
        id: `${conn.from}-${conn.to}`,
        points: curve.getPoints(24),
        isDelayCascade: isCascade,
      });
    });

    // 5. Station Towers & Light Beacons
    const stationsGroup = new THREE.Group();
    scene.add(stationsGroup);

    stations.forEach((st) => {
      const p = mapCoordsTo3D(st.x, st.y);
      const h = getTerrainHeight(p.x, p.z);
      const isTampere = st.id === 'TPE';
      const isOulu = st.id === 'OUL';

      const stGroup = new THREE.Group();
      stGroup.position.set(p.x, h, p.z);

      // Base cylinder
      const baseGeo = new THREE.CylinderGeometry(1.6, 2.0, 0.5, 16);
      const baseMat = new THREE.MeshStandardMaterial({
        color: isTampere ? 0xf0a030 : 0x1c2836,
        roughness: 0.4,
        metalness: 0.7,
      });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.position.y = 0.25;
      stGroup.add(baseMesh);

      // Station beacon light beam
      const beamGeo = new THREE.CylinderGeometry(0.1, 0.4, 7, 8, 1, true);
      beamGeo.translate(0, 3.5, 0);
      const beamMat = new THREE.MeshBasicMaterial({
        color: isTampere ? 0xf0a030 : isOulu ? 0x4da3ff : 0x3fb950,
        transparent: true,
        opacity: isTampere ? 0.7 : 0.4,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      const beamMesh = new THREE.Mesh(beamGeo, beamMat);
      stGroup.add(beamMesh);

      // Station Beacon Orb
      const orbGeo = new THREE.SphereGeometry(0.5, 12, 12);
      const orbMat = new THREE.MeshBasicMaterial({
        color: isTampere ? 0xffb74d : 0xffffff,
      });
      const orbMesh = new THREE.Mesh(orbGeo, orbMat);
      orbMesh.position.y = 7;
      stGroup.add(orbMesh);

      // Floating Canvas Text Billboard for Station Name
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(22, 32, 42, 0.9)';
        ctx.roundRect(4, 4, 248, 56, 8);
        ctx.fill();
        ctx.strokeStyle = isTampere ? '#F0A030' : '#4DA3FF';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.font = 'bold 26px Inter, sans-serif';
        ctx.fillStyle = '#F2F5F7';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(st.name, 128, 32);
      }

      const textTex = new THREE.CanvasTexture(canvas);
      textTex.colorSpace = THREE.SRGBColorSpace;
      const spriteMat = new THREE.SpriteMaterial({ map: textTex, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.set(0, 9.2, 0);
      sprite.scale.set(6, 1.5, 1);
      stGroup.add(sprite);

      stationsGroup.add(stGroup);
    });

    // 6. Moving 3D Trains with TripsLayer-style Glowing Light Trails
    const trainsGroup = new THREE.Group();
    scene.add(trainsGroup);

    trains.forEach((train) => {
      const p = mapCoordsTo3D(train.x, train.y);
      const h = getTerrainHeight(p.x, p.z) + 0.9;

      const trainGroup = new THREE.Group();
      trainGroup.position.set(p.x, h, p.z);

      // Determine train color
      let trainColor = 0x3fb950; // IC Green
      if (train.type === 'S') trainColor = 0x4da3ff; // Pendolino Blue
      if (train.type === 'HDM') trainColor = 0xa371f7;
      if (train.type === 'T') trainColor = 0xf0a030;
      if (train.status === 'cancelled') trainColor = 0xf25555;
      else if (train.delayMinutes > 0) trainColor = 0xf0a030;

      // Locomotive body (procedural 3-part train mesh)
      const locoGeo = new THREE.BoxGeometry(1.2, 1.0, 3.6);
      const locoMat = new THREE.MeshStandardMaterial({
        color: trainColor,
        roughness: 0.25,
        metalness: 0.6,
      });
      const locoMesh = new THREE.Mesh(locoGeo, locoMat);
      locoMesh.position.y = 0.5;
      trainGroup.add(locoMesh);

      // Cab windshield
      const cabGeo = new THREE.BoxGeometry(1.0, 0.5, 0.8);
      const cabMat = new THREE.MeshBasicMaterial({ color: 0x111822 });
      const cabMesh = new THREE.Mesh(cabGeo, cabMat);
      cabMesh.position.set(0, 0.75, -1.4);
      trainGroup.add(cabMesh);

      // Headlight Beams (volumetric light cone)
      if (train.status !== 'cancelled') {
        const coneGeo = new THREE.ConeGeometry(1.2, 5.0, 8, 1, true);
        coneGeo.rotateX(Math.PI / 2);
        coneGeo.translate(0, 0.5, -4.0);
        const coneMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.35,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
        });
        const headlightCone = new THREE.Mesh(coneGeo, coneMat);
        trainGroup.add(headlightCone);
      }

      // Billboard label for Train Number
      const tCanvas = document.createElement('canvas');
      tCanvas.width = 160;
      tCanvas.height = 48;
      const tCtx = tCanvas.getContext('2d');
      if (tCtx) {
        tCtx.fillStyle = 'rgba(14, 20, 27, 0.95)';
        tCtx.roundRect(2, 2, 156, 44, 6);
        tCtx.fill();
        tCtx.strokeStyle = train.delayMinutes > 0 ? '#F0A030' : '#3FB950';
        tCtx.lineWidth = 2;
        tCtx.stroke();

        tCtx.font = 'bold 22px monospace';
        tCtx.fillStyle = '#FFFFFF';
        tCtx.textAlign = 'center';
        tCtx.textBaseline = 'middle';
        const label = train.delayMinutes > 0 ? `${train.number} +${train.delayMinutes}m` : train.number;
        tCtx.fillText(label, 80, 24);
      }
      const tTex = new THREE.CanvasTexture(tCanvas);
      tTex.colorSpace = THREE.SRGBColorSpace;
      const tSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tTex }));
      tSprite.position.set(0, 3.2, 0);
      tSprite.scale.set(4.2, 1.3, 1);
      trainGroup.add(tSprite);

      // Rotated according to train heading
      trainGroup.rotation.y = THREE.MathUtils.degToRad(train.headingDeg + 180);
      trainsGroup.add(trainGroup);

      // TripsLayer Light Trail behind train
      const trailPoints = [
        new THREE.Vector3(p.x, h, p.z),
        new THREE.Vector3(p.x, h, p.z + 4),
        new THREE.Vector3(p.x, h, p.z + 8),
      ];
      const trailGeo = new THREE.BufferGeometry().setFromPoints(trailPoints);
      const trailMat = new THREE.LineBasicMaterial({
        color: trainColor,
        transparent: true,
        opacity: 0.6,
        linewidth: 2,
      });
      const trailLine = new THREE.Line(trailGeo, trailMat);
      scene.add(trailLine);

      trainMeshesRef.current.set(train.id, {
        group: trainGroup,
        trail: trailLine,
        trainData: train,
      });
    });

    // 7. FMI Snow Particle Vortex over Northern Finland (Oulu Corridor)
    const oulu3D = mapCoordsTo3D(46, 39);
    const snowCount = 450;
    const snowGeo = new THREE.BufferGeometry();
    const snowPositions = new Float32Array(snowCount * 3);
    const snowVelocities: { x: number; y: number; z: number }[] = [];

    for (let i = 0; i < snowCount; i++) {
      snowPositions[i * 3] = oulu3D.x + (Math.random() - 0.5) * 35;
      snowPositions[i * 3 + 1] = 2.0 + Math.random() * 25;
      snowPositions[i * 3 + 2] = oulu3D.z + (Math.random() - 0.5) * 35;

      snowVelocities.push({
        x: (Math.random() - 0.5) * 0.15 - 0.08,
        y: -0.15 - Math.random() * 0.1,
        z: (Math.random() - 0.5) * 0.15,
      });
    }

    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
    const snowMat = new THREE.PointsMaterial({
      color: 0xe0f2fe,
      size: 0.8,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const snowParticles = new THREE.Points(snowGeo, snowMat);
    scene.add(snowParticles);

    // 8. Interactive Mouse Orbit Controls (Smooth Pointer Drag)
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    let cameraAngle = { theta: 0, phi: Math.PI / 4, radius: 110 };

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) {
        // Simple raycast to hover trains/stations
        return;
      }
      const dx = e.clientX - prevMousePos.x;
      const dy = e.clientY - prevMousePos.y;
      prevMousePos = { x: e.clientX, y: e.clientY };

      cameraAngle.theta -= dx * 0.005;
      cameraAngle.phi = Math.max(0.15, Math.min(Math.PI / 2.2, cameraAngle.phi + dy * 0.005));
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraAngle.radius = Math.max(30, Math.min(180, cameraAngle.radius + e.deltaY * 0.08));
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // 9. Animation & Render Loop
    let animationFrameId = 0;
    let clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Update shader uniforms
      terrainUniforms.uTime.value = time;

      // Update Snow Particles
      if (!reducedMotion) {
        const positions = snowGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < snowCount; i++) {
          positions[i * 3] += snowVelocities[i].x;
          positions[i * 3 + 1] += snowVelocities[i].y;
          positions[i * 3 + 2] += snowVelocities[i].z;

          // Recycle snow flakes that hit ground
          if (positions[i * 3 + 1] < 1.0) {
            positions[i * 3] = oulu3D.x + (Math.random() - 0.5) * 35;
            positions[i * 3 + 1] = 22.0 + Math.random() * 5;
            positions[i * 3 + 2] = oulu3D.z + (Math.random() - 0.5) * 35;
          }
        }
        snowGeo.attributes.position.needsUpdate = true;
      }

      // Smooth camera interpolation towards target
      const targetX = cameraTargetRef.current.lookAt.x + cameraAngle.radius * Math.sin(cameraAngle.phi) * Math.sin(cameraAngle.theta);
      const targetY = cameraTargetRef.current.lookAt.y + cameraAngle.radius * Math.cos(cameraAngle.phi);
      const targetZ = cameraTargetRef.current.lookAt.z + cameraAngle.radius * Math.sin(cameraAngle.phi) * Math.cos(cameraAngle.theta);

      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 5, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 5, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 5, delta);

      camera.lookAt(cameraTargetRef.current.lookAt);

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // 10. Resize Observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('wheel', onWheel);

      // Clean disposal
      terrainGeo.dispose();
      terrainShaderMat.dispose();
      snowGeo.dispose();
      snowMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, [stations, trains, reducedMotion]);

  // Handle Preset Camera Jumps
  const handlePreset = (preset: 'overview' | 'tampere' | 'oulu') => {
    setCameraPreset(preset);
    if (preset === 'overview') {
      cameraTargetRef.current = {
        pos: new THREE.Vector3(0, 75, 80),
        lookAt: new THREE.Vector3(0, 0, 5),
      };
    } else if (preset === 'tampere') {
      // Focus on Tampere hub (-7.65, 27.6)
      cameraTargetRef.current = {
        pos: new THREE.Vector3(-7, 30, 48),
        lookAt: new THREE.Vector3(-7.6, 2.5, 27.6),
      };
    } else if (preset === 'oulu') {
      // Focus on Oulu snowstorm corridor (-3.4, -12.65)
      cameraTargetRef.current = {
        pos: new THREE.Vector3(-3.4, 28, 5),
        lookAt: new THREE.Vector3(-3.4, 4.0, -12.65),
      };
    }
  };

  return (
    <div className="relative w-full h-full bg-[#0E141B] overflow-hidden select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* 3D Elävä kartta Overlay Header */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
        <div className="px-3 py-1.5 rounded-[8px] bg-[#16202A]/90 backdrop-blur-md border border-[#243444] shadow-md flex items-center gap-2 text-xs">
          <Sparkles size={14} className="text-[#4DA3FF]" />
          <span className="font-bold text-[#F2F5F7]">3D Elävä kartta</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#4DA3FF]/20 text-[#4DA3FF]">
            GPU Shader &amp; TripsLayer
          </span>
        </div>

        {/* Tampere Delay Ripple Banner */}
        <button
          type="button"
          onClick={() => handlePreset('tampere')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-[#F0A030]/20 border border-[#F0A030]/50 text-xs text-[#F0A030] hover:bg-[#F0A030]/30 transition-colors shadow-sm cursor-pointer"
        >
          <AlertCircle size={14} className="shrink-0" />
          <span className="font-semibold">Tampere viiveaalto (Klikkaa zoom)</span>
        </button>

        {/* Oulu Blizzard Banner */}
        <button
          type="button"
          onClick={() => handlePreset('oulu')}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-[#4DA3FF]/15 border border-[#4DA3FF]/40 text-xs text-[#4DA3FF] hover:bg-[#4DA3FF]/25 transition-colors shadow-sm cursor-pointer"
        >
          <Snowflake size={14} className="shrink-0" />
          <span>Oulun lumipyry (FMI)</span>
        </button>
      </div>

      {/* Camera View Presets Bottom Dock */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-[#16202A]/90 backdrop-blur-md px-3 py-1.5 rounded-[8px] border border-[#243444] shadow-xl text-xs">
        <span className="text-[11px] font-mono text-[#9BA9B8] mr-1 flex items-center gap-1">
          <Eye size={12} /> Kamera:
        </span>
        <button
          type="button"
          onClick={() => handlePreset('overview')}
          className={`px-2.5 py-1 rounded-[6px] text-xs font-medium transition-all ${
            cameraPreset === 'overview'
              ? 'bg-[#4DA3FF] text-[#0E141B] font-bold shadow-sm'
              : 'text-[#9BA9B8] hover:text-[#F2F5F7]'
          }`}
        >
          Koko Suomi
        </button>
        <button
          type="button"
          onClick={() => handlePreset('tampere')}
          className={`px-2.5 py-1 rounded-[6px] text-xs font-medium transition-all ${
            cameraPreset === 'tampere'
              ? 'bg-[#F0A030] text-[#0E141B] font-bold shadow-sm'
              : 'text-[#9BA9B8] hover:text-[#F2F5F7]'
          }`}
        >
          Tampere Hub (+12m)
        </button>
        <button
          type="button"
          onClick={() => handlePreset('oulu')}
          className={`px-2.5 py-1 rounded-[6px] text-xs font-medium transition-all ${
            cameraPreset === 'oulu'
              ? 'bg-[#4DA3FF] text-[#0E141B] font-bold shadow-sm'
              : 'text-[#9BA9B8] hover:text-[#F2F5F7]'
          }`}
        >
          Oulu Lumieste
        </button>
      </div>

      {/* Orbit Navigation Hint */}
      <div className="absolute bottom-4 right-4 z-20 hidden md:flex items-center gap-1.5 text-[10px] font-mono text-[#9BA9B8] bg-[#16202A]/80 px-2.5 py-1 rounded-[6px] border border-[#243444]">
        <Compass size={12} className="text-[#4DA3FF]" />
        <span>Vasen klikki: Pyöritä · Rulla: Zoomaa</span>
      </div>
    </div>
  );
};
