import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Station, TrackLine, Train, Language } from '../../types';
import { FINLAND_POLYGONS, RAIL_NETWORK, GEO_STATIONS, MAP_BOUNDS, toPathD } from '../../geo/network';

export const TRAIN_COLORS: Record<Train['type'], string> = {
  IC: '#3FB950',
  S: '#4DA3FF',
  HDM: '#A371F7',
  T: '#F0A030',
};

export interface ViewBox { x: number; y: number; w: number; h: number }

export interface RailMap2DHandle {
  zoomBy: (f: number) => void;
  reset: () => void;
  focus: (x: number, y: number, w: number) => void;
}

interface Props {
  stations: Station[];
  tracks: TrackLine[];
  trains: Train[];
  selectedTrainId: string | null;
  selectedStationId: string | null;
  onSelectTrain: (t: Train) => void;
  onSelectStation: (s: Station) => void;
  reducedMotion: boolean;
  focusMode: boolean;
  language: Language;
  apiRef?: React.MutableRefObject<RailMap2DHandle | null>;
}

const PAD = 1.5;
const HOME: ViewBox = {
  x: MAP_BOUNDS.minX - PAD,
  y: MAP_BOUNDS.minY - PAD,
  w: MAP_BOUNDS.width + PAD * 2,
  h: MAP_BOUNDS.height + PAD * 2,
};

const STATUS_COLOR: Record<NonNullable<TrackLine['status']>, string> = {
  normal: '#5B7A99',
  weather_alert: '#4DA3FF',
  delay_cascade: '#F0A030',
};

/** Clean SVG map in ETRS-TM35FIN (EPSG:3067) projection with zoom/pan. */
export const RailMap2D: React.FC<Props> = ({
  stations, tracks, trains, selectedTrainId, selectedStationId, onSelectTrain, onSelectStation,
  reducedMotion, focusMode, language, apiRef,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [vb, setVb] = useState<ViewBox>(HOME);
  const [size, setSize] = useState({ w: 600, h: 800 });
  const [hover, setHover] = useState<Train | null>(null);
  const drag = useRef<{ x: number; y: number; vb: ViewBox } | null>(null);

  useEffect(() => {
    const el = svgRef.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Effective units-per-pixel (preserveAspectRatio = meet)
  const k = Math.max(vb.w / size.w, vb.h / size.h);
  const px = (n: number) => n * k;

  const clampVb = (v: ViewBox): ViewBox => {
    const w = Math.min(Math.max(v.w, 6), HOME.w * 1.6);
    const h = (w / v.w) * v.h;
    return { x: v.x, y: v.y, w, h };
  };

  const zoomAt = useCallback((f: number, cx?: number, cy?: number) => {
    setVb((v) => {
      const ox = cx ?? v.x + v.w / 2, oy = cy ?? v.y + v.h / 2;
      const n = clampVb({ x: 0, y: 0, w: v.w / f, h: v.h / f });
      const r = n.w / v.w;
      return { ...n, x: ox - (ox - v.x) * r, y: oy - (oy - v.y) * r };
    });
  }, []);

  useEffect(() => {
    if (!apiRef) return;
    apiRef.current = {
      zoomBy: (f) => zoomAt(f),
      reset: () => setVb(HOME),
      focus: (x, y, w) => setVb({ x: x - w / 2, y: y - (w * HOME.h) / HOME.w / 2, w, h: (w * HOME.h) / HOME.w }),
    };
  }, [apiRef, zoomAt]);

  const toMap = (clientX: number, clientY: number) => {
    const r = svgRef.current!.getBoundingClientRect();
    const offX = (r.width - vb.w / k) / 2, offY = (r.height - vb.h / k) / 2;
    return { x: vb.x + (clientX - r.left - offX) * k, y: vb.y + (clientY - r.top - offY) * k };
  };
  const toScreen = (x: number, y: number) => ({
    left: (x - vb.x) / k + (size.w - vb.w / k) / 2,
    top: (y - vb.y) / k + (size.h - vb.h / k) / 2,
  });

  useEffect(() => {
    const el = svgRef.current; if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = toMap(e.clientX, e.clientY);
      zoomAt(e.deltaY < 0 ? 1.2 : 1 / 1.2, p.x, p.y);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  });

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as Element).closest('[data-hit]')) return;
    drag.current = { x: e.clientX, y: e.clientY, vb };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d) return;
    setVb({ ...d.vb, x: d.vb.x - (e.clientX - d.x) * k, y: d.vb.y - (e.clientY - d.y) * k });
  };
  const onPointerUp = () => { drag.current = null; };

  const finlandD = useMemo(() => FINLAND_POLYGONS.map((r) => toPathD(r, true)).join(' '), []);
  const networkD = useMemo(() => RAIL_NETWORK.map((l) => toPathD(l)).join(' '), []);
  const hub = stations.find((s) => s.isDelayHub);
  const zoomed = vb.w < HOME.w * 0.55;
  const majorCodes = new Set(stations.map((s) => s.code));
  const minorStations = zoomed ? GEO_STATIONS.filter((g) => !majorCodes.has(g.code) && !['JY', 'OL'].includes(g.code)) : [];
  const kmUnits = 100 / 12; // 100 km in map units
  const visibleTrains = focusMode ? trains.filter((t) => t.delayMinutes > 0 || t.status === 'cancelled' || t.id === selectedTrainId) : trains;

  const label = language === 'fi'
    ? 'Suomen rataverkko, asemat ja junien sijainnit. Sama tieto taulukkona Junaliikenteen tilanne -paneelissa.'
    : 'Finnish rail network, stations and train positions. The same data is available as a table in the Rail Traffic Overview panel.';

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full touch-none cursor-grab active:cursor-grabbing"
        role="group"
        aria-label={label}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <defs>
          <pattern id="ft-grid" width={kmUnits} height={kmUnits} patternUnits="userSpaceOnUse">
            <path d={`M ${kmUnits} 0 L 0 0 0 ${kmUnits}`} fill="none" stroke="#18232E" strokeWidth={px(1)} />
          </pattern>
          <filter id="ft-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={px(3)} result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="ft-hub" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F0A030" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#F0A030" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect x={HOME.x - 200} y={HOME.y - 200} width={HOME.w + 400} height={HOME.h + 400} fill="url(#ft-grid)" />

        {/* Land */}
        <path d={finlandD} fill="#131D27" stroke="#2C3E50" strokeWidth={px(1.2)} strokeLinejoin="round" fillRule="evenodd" />

        {/* Full rail network (Digitraffic infra-api) */}
        <path d={networkD} fill="none" stroke="#2A3B4C" strokeWidth={px(1.1)} strokeLinecap="round" strokeLinejoin="round" />

        {/* Scenario routes */}
        {tracks.map((tr) => {
          const c = STATUS_COLOR[tr.status ?? 'normal'];
          const hot = tr.status !== 'normal';
          return (
            <g key={tr.id}>
              <path d={tr.path} fill="none" stroke="#0E141B" strokeWidth={px(tr.isDoubleTrack ? 6 : 5)} strokeLinecap="round" strokeLinejoin="round" />
              <path
                d={tr.path} fill="none" stroke={c}
                strokeWidth={px(tr.isDoubleTrack ? 3 : 2.2)}
                strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray={tr.status === 'weather_alert' ? `${px(6)} ${px(4)}` : undefined}
                filter={hot ? 'url(#ft-glow)' : undefined}
                opacity={hot ? 1 : 0.85}
              />
            </g>
          );
        })}

        {/* Delay hub ripple */}
        {hub && (
          <g transform={`translate(${hub.x} ${hub.y})`} aria-hidden="true">
            <circle r={px(30)} fill="url(#ft-hub)" />
            {!reducedMotion && [0, 1, 2].map((i) => (
              <circle key={i} r={px(10)} fill="none" stroke="#F0A030" strokeWidth={px(1.5)} className="ft-ripple" style={{ animationDelay: `${i}s` }} />
            ))}
            {reducedMotion && <circle r={px(26)} fill="none" stroke="#F0A030" strokeWidth={px(1.5)} opacity={0.6} />}
          </g>
        )}

        {/* Minor stations when zoomed */}
        {minorStations.map((g) => (
          <g key={g.code} aria-hidden="true">
            <circle cx={g.x} cy={g.y} r={px(2)} fill="#9BA9B8" />
            {vb.w < HOME.w * 0.3 && (
              <text x={g.x + px(5)} y={g.y + px(3.5)} fontSize={px(10)} fill="#9BA9B8" className="ft-map-label">{g.name}</text>
            )}
          </g>
        ))}

        {/* Major stations */}
        {stations.map((s) => {
          const sel = s.id === selectedStationId;
          const left = ['TKU', 'SK', 'KEM', 'TPE', 'RI'].includes(s.id);
          const dy = s.id === 'LH' ? -6 : s.id === 'RI' ? 6 : s.id === 'TPE' ? -4 : 0;
          const r = s.isDelayHub ? 6 : s.tracks >= 7 ? 5 : 4;
          return (
            <g
              key={s.id}
              data-hit
              role="button"
              tabIndex={0}
              aria-label={`${s.name}, ${language === 'fi' ? 'viiveindeksi' : 'delay index'} ${s.delayIndex}`}
              aria-pressed={sel}
              className="cursor-pointer ft-map-target"
              onClick={() => onSelectStation(s)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectStation(s); } }}
            >
              <circle cx={s.x} cy={s.y} r={px(r + 6)} fill="transparent" />
              <circle cx={s.x} cy={s.y} r={px(r)} fill="#0E141B" stroke={s.isDelayHub ? '#F0A030' : sel ? '#4DA3FF' : '#F2F5F7'} strokeWidth={px(sel ? 2.5 : 1.8)} />
              <text
                x={s.x + px(left ? -(r + 5) : r + 5)} y={s.y + px(4 + dy)}
                textAnchor={left ? 'end' : 'start'}
                fontSize={px(s.tracks >= 7 ? 12.5 : 11.5)} fontWeight={600}
                fill={s.isDelayHub ? '#F0A030' : '#F2F5F7'}
                className="ft-map-label"
              >{s.name}</text>
            </g>
          );
        })}

        {/* Trains */}
        {visibleTrains.map((t) => {
          const sel = t.id === selectedTrainId;
          const c = TRAIN_COLORS[t.type];
          const cancelled = t.status === 'cancelled';
          const a = (t.headingDeg * Math.PI) / 180;
          return (
            <g
              key={t.id}
              data-hit
              role="button"
              tabIndex={0}
              aria-label={`${t.number} ${t.route}, ${cancelled ? (language === 'fi' ? 'peruttu' : 'cancelled') : t.delayMinutes > 0 ? `+${t.delayMinutes} min` : language === 'fi' ? 'ajallaan' : 'on time'}`}
              aria-pressed={sel}
              className="cursor-pointer ft-map-target"
              onClick={() => onSelectTrain(t)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectTrain(t); } }}
              onMouseEnter={() => setHover(t)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(t)}
              onBlur={() => setHover(null)}
              style={{ transition: reducedMotion ? 'none' : 'transform 0.4s ease' }}
              transform={`translate(${t.x} ${t.y})`}
            >
              <circle r={px(12)} fill="transparent" />
              {(t.delayMinutes > 0 || sel) && !cancelled && (
                <circle r={px(9)} fill="none" stroke={sel ? '#F2F5F7' : '#F0A030'} strokeWidth={px(1.5)} opacity={0.9} />
              )}
              {!cancelled && (
                <line x1={0} y1={0} x2={Math.sin(a) * px(10)} y2={-Math.cos(a) * px(10)} stroke={c} strokeWidth={px(2)} strokeLinecap="round" />
              )}
              <circle r={px(5.5)} fill={cancelled ? '#0E141B' : c} stroke={cancelled ? '#F25555' : '#0E141B'} strokeWidth={px(1.8)} />
              {cancelled && (
                <path d={`M ${-px(3)} ${-px(3)} L ${px(3)} ${px(3)} M ${px(3)} ${-px(3)} L ${-px(3)} ${px(3)}`} stroke="#F25555" strokeWidth={px(1.6)} />
              )}
              {(t.delayMinutes >= 5 || sel) && !cancelled && (
                <text x={px(11)} y={-px(8)} fontSize={px(10.5)} fontWeight={700} fill={t.delayMinutes > 0 ? '#F0A030' : '#F2F5F7'} className="ft-map-label font-mono">
                  {t.number}{t.delayMinutes > 0 ? ` +${t.delayMinutes}` : ''}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Scale bar */}
      <div className="absolute left-3 bottom-3 pointer-events-none text-[11px] font-mono text-[#C4CFDA]" aria-hidden="true">
        <div className="border-x border-b border-[#C4CFDA] h-1.5" style={{ width: `${kmUnits / k}px` }} />
        <span>100 km · EPSG:3067</span>
      </div>

      {hover && (
        <div
          className="absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-full bg-[#16202A] border border-[#243444] rounded-[6px] shadow-xl px-2.5 py-2 text-xs w-52"
          style={{ ...(() => { const p = toScreen(hover.x, hover.y); return { left: p.left, top: p.top - 16 }; })() }}
        >
          <div className="flex justify-between font-mono font-bold text-[#F2F5F7]">
            <span>{hover.number}</span>
            <span className={hover.status === 'cancelled' ? 'text-[#F25555]' : hover.delayMinutes > 0 ? 'text-[#F0A030]' : 'text-[#3FB950]'}>
              {hover.status === 'cancelled' ? (language === 'fi' ? 'Peruttu' : 'Cancelled') : hover.delayMinutes > 0 ? `+${hover.delayMinutes} min` : language === 'fi' ? 'Ajallaan' : 'On time'}
            </span>
          </div>
          <div className="text-[11px] text-[#C4CFDA] mt-0.5 truncate">{hover.route}</div>
          <div className="flex justify-between mt-1 pt-1 border-t border-[#243444] text-[11px] text-[#C4CFDA] font-mono">
            <span>{hover.speedKmH} km/h</span><span>{hover.currentStation}</span>
          </div>
        </div>
      )}
    </div>
  );
};
