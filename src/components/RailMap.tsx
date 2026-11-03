import React, { useState } from 'react';
import { Plus, Minus, RotateCcw, Crosshair, MapPin, AlertCircle, Info, Wind } from 'lucide-react';
import { Station, TrackLine, Train, ViewMode, Language, TrainType } from '../types';
import { TRANSLATIONS } from '../data/railData';
import { RailMapCanvas } from './map/RailMapCanvas';
import { ThreeDLiveMap } from './map/ThreeDLiveMap';

export interface RailMapProps {
  viewMode: ViewMode;
  stations: Station[];
  tracks: TrackLine[];
  trains: Train[];
  selectedTrainId: string | null;
  onSelectTrain: (train: Train) => void;
  selectedStationId: string | null;
  onSelectStation: (station: Station) => void;
  focusMode: boolean;
  reducedMotion: boolean;
  language: Language;
}

export const RailMap: React.FC<RailMapProps> = ({
  viewMode,
  stations,
  tracks,
  trains,
  selectedTrainId,
  onSelectTrain,
  selectedStationId,
  onSelectStation,
  focusMode,
  reducedMotion,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredTrain, setHoveredTrain] = useState<Train | null>(null);

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.25, 2.2));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.25, 0.75));
  const handleReset = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };
  const handleCenterTampere = () => {
    // Center Tampere (x: 41, y: 74)
    setZoomLevel(1.5);
    setPanOffset({ x: 6, y: -24 });
  };

  const getTrainTypeColor = (type: TrainType) => {
    switch (type) {
      case 'IC':
        return '#3FB950'; // Finnish VR green
      case 'S':
        return '#4DA3FF'; // Pendolino blue
      case 'HDM':
        return '#A371F7'; // Regional purple
      case 'T':
        return '#F0A030'; // Freight orange
    }
  };

  const tampereStation = stations.find((s) => s.id === 'TPE') || { x: 41, y: 74 };
  const ouluStation = stations.find((s) => s.id === 'OUL') || { x: 46, y: 39 };

  // 3D "Elävä kartta" mode using Three.js and custom faceted terrain shader
  if (viewMode === '3D') {
    return (
      <div className="relative w-full h-full bg-[#0E141B] overflow-hidden select-none flex flex-col border-r border-[#243444]">
        <ThreeDLiveMap
          stations={stations}
          tracks={tracks}
          trains={trains}
          selectedTrainId={selectedTrainId}
          onSelectTrain={onSelectTrain}
          selectedStationId={selectedStationId}
          onSelectStation={onSelectStation}
          reducedMotion={reducedMotion}
          language={language}
        />
        {/* Bottom Map Legend */}
        <div className="p-2.5 bg-[#16202A]/90 backdrop-blur-md border-t border-[#243444] z-20 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-[#9BA9B8] font-medium text-[11px] uppercase tracking-wider">
              {t.legendTitle}:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[3px] bg-[#3FB950]" aria-hidden="true" />
              <span className="text-[#F2F5F7] font-mono text-[11px]">{t.intercity}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[3px] bg-[#4DA3FF]" aria-hidden="true" />
              <span className="text-[#F2F5F7] font-mono text-[11px]">{t.pendolino}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[3px] bg-[#A371F7]" aria-hidden="true" />
              <span className="text-[#F2F5F7] font-mono text-[11px]">{t.commuter}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[3px] bg-[#F0A030]" aria-hidden="true" />
              <span className="text-[#F2F5F7] font-mono text-[11px]">{t.freight}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-[#9BA9B8]">
            <span className="text-[#F0A030]">● Tampere viivekeskus (Shader)</span>
            <span className="text-[#4DA3FF]">❄ FMI Lumipyry Oulu</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-[#0E141B] overflow-hidden select-none flex flex-col border-r border-[#243444]">
      {/* Map Header Overlay: Title + Quick Info */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
        <div className="px-3 py-1.5 rounded-[8px] bg-[#16202A]/90 backdrop-blur-md border border-[#243444] shadow-md flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-[#4DA3FF]" aria-hidden="true" />
          <span className="font-semibold text-[#F2F5F7]">Suomen rataverkko (2D)</span>
          <span className="text-[#9BA9B8] font-mono">({trains.length} aktiivista junaa)</span>
        </div>

        {/* Tampere Delay Ripple Banner */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-[#F0A030]/15 border border-[#F0A030]/40 text-xs text-[#F0A030]">
          <AlertCircle size={14} className="shrink-0" />
          <span className="font-medium truncate">{t.tampereHubNotice}</span>
        </div>
      </div>

      {/* Map Control Buttons: Zoom +/- and Locate */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 bg-[#16202A]/90 backdrop-blur-md p-1 rounded-[8px] border border-[#243444] shadow-md">
        <button
          type="button"
          onClick={handleZoomIn}
          title={t.zoomIn}
          aria-label={t.zoomIn}
          className="w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-[#223242] text-[#F2F5F7] transition-colors focus-visible:ring-2 focus-visible:ring-[#4DA3FF]"
        >
          <Plus size={15} />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          title={t.zoomOut}
          aria-label={t.zoomOut}
          className="w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-[#223242] text-[#F2F5F7] transition-colors focus-visible:ring-2 focus-visible:ring-[#4DA3FF]"
        >
          <Minus size={15} />
        </button>
        <div className="h-px bg-[#243444] mx-1 my-0.5" />
        <button
          type="button"
          onClick={handleCenterTampere}
          title={t.locateTampere}
          aria-label={t.locateTampere}
          className="w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-[#223242] text-[#F0A030] transition-colors focus-visible:ring-2 focus-visible:ring-[#4DA3FF]"
        >
          <Crosshair size={15} />
        </button>
        <button
          type="button"
          onClick={handleReset}
          title={t.resetView}
          aria-label={t.resetView}
          className="w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-[#223242] text-[#9BA9B8] transition-colors focus-visible:ring-2 focus-visible:ring-[#4DA3FF]"
        >
          <RotateCcw size={13} />
        </button>
      </div>

      {/* Main Map Canvas Area (2D Schematic GIS View) */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Procedural Shader / Ripple & Snow Canvas Overlay */}
        <RailMapCanvas
          viewMode="2D"
          reducedMotion={reducedMotion}
          tampereCoords={{ x: tampereStation.x, y: tampereStation.y }}
          ouluCoords={{ x: ouluStation.x, y: ouluStation.y }}
        />

        <div
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x}%, ${panOffset.y}%)`,
            transformOrigin: 'center center',
            transition: reducedMotion ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className="relative w-[92%] h-[92%] max-w-[720px] max-h-[760px] z-20"
        >

          <svg
            viewBox="0 0 100 100"
            className="w-full h-full overflow-visible drop-shadow-xl"
            role="img"
            aria-label="Suomen rataverkkokartta ja junien sijainnit"
          >
            <defs>
              {/* Glow filter for active tracks & delay cascades */}
              <filter id="glow-amber" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="1.2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-track" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="0.8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              {/* Station node gradients */}
              <radialGradient id="hub-gradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F0A030" stopOpacity="1" />
                <stop offset="100%" stopColor="#F0A030" stopOpacity="0.2" />
              </radialGradient>
            </defs>

            {/* 1. Subtle Geographic Contour of Finland */}
            <path
              d="M 28 88 C 22 84 18 78 20 70 C 22 62 30 52 34 44 C 36 36 34 26 38 18 C 42 12 56 10 62 14 C 68 18 70 26 68 34 C 66 42 74 48 78 54 C 82 60 84 70 76 78 C 70 84 56 86 48 90 C 38 92 32 90 28 88 Z"
              fill="#131B24"
              stroke="#1C2836"
              strokeWidth="0.8"
              strokeLinejoin="round"
            />

            {/* 2. Railway Track Network Lines */}
            {tracks.map((track) => {
              const isCascade = track.status === 'delay_cascade';
              const isWeather = track.status === 'weather_alert';

              return (
                <g key={track.id}>
                  {/* Outer track bed / shadow */}
                  <path
                    d={track.path}
                    fill="none"
                    stroke="#16202A"
                    strokeWidth={track.isDoubleTrack ? 2.4 : 1.8}
                    strokeLinecap="round"
                  />
                  {/* Main track line */}
                  <path
                    d={track.path}
                    fill="none"
                    stroke={
                      isCascade
                        ? '#F0A030'
                        : isWeather
                        ? '#4DA3FF'
                        : '#354A5E'
                    }
                    strokeWidth={track.isDoubleTrack ? 1.4 : 1.0}
                    strokeDasharray={isWeather ? '3 1.5' : undefined}
                    strokeOpacity={isCascade ? 0.9 : 0.7}
                    strokeLinecap="round"
                  />
                  {/* Subtle rail ties / sleepers simulation */}
                  <path
                    d={track.path}
                    fill="none"
                    stroke="#0E141B"
                    strokeWidth={0.5}
                    strokeDasharray="0.8 1.4"
                    strokeLinecap="butt"
                  />
                </g>
              );
            })}

            {/* 3. Amber Ripple Rings at Tampere (Delay Epicenter) */}
            <g transform={`translate(${tampereStation.x}, ${tampereStation.y})`}>
              {/* Outer wave 1 */}
              <circle
                r="7"
                fill="none"
                stroke="#F0A030"
                strokeWidth="0.75"
                opacity="0.8"
                className={reducedMotion ? '' : 'animate-ping origin-center'}
                style={{ animationDuration: '3s' }}
              />
              {/* Outer wave 2 */}
              <circle
                r="4.5"
                fill="none"
                stroke="#F0A030"
                strokeWidth="0.8"
                opacity="0.6"
              />
              {/* Halo glow */}
              <circle
                r="3"
                fill="#F0A030"
                opacity="0.25"
              />
            </g>

            {/* 4. Dashed Amber Line: Delay spreading from Tampere to IC 27 & S 365 */}
            {/* Delay cascade line: from Tampere (41, 74) to IC 27 (41.5, 77.2) and S 365 (41, 73.8) */}
            <path
              d="M 41.5 77.2 Q 41 75 41 74 T 41 73.8"
              fill="none"
              stroke="#F0A030"
              strokeWidth="1.2"
              strokeDasharray="2 1.5"
              filter="url(#glow-amber)"
              className={reducedMotion ? '' : 'animate-pulse'}
            />
            {/* Propagation vector arrow to connection line to Vaasa/Jyväskylä */}
            <path
              d="M 41 74 L 46 68"
              fill="none"
              stroke="#F0A030"
              strokeWidth="0.9"
              strokeDasharray="1.5 1.5"
              opacity="0.85"
            />

            {/* 5. Station Markers & Labels (Helsinki, Tampere, Turku, Oulu, Jyväskylä, Kuopio, Rovaniemi) */}
            {stations.map((st) => {
              const isSelected = selectedStationId === st.id;
              const isTampere = st.id === 'TPE';
              const isOulu = st.id === 'OUL';
              const isTurku = st.id === 'TKU';

              return (
                <g
                  key={st.id}
                  transform={`translate(${st.x}, ${st.y})`}
                  className="cursor-pointer group"
                  onClick={() => onSelectStation(st)}
                >
                  {/* Station node ring */}
                  <circle
                    r={isTampere ? 2.5 : isSelected ? 2.4 : 1.8}
                    fill={isTampere ? '#F0A030' : isTurku ? '#F25555' : isOulu ? '#4DA3FF' : '#16202A'}
                    stroke={isSelected ? '#4DA3FF' : '#F2F5F7'}
                    strokeWidth={isSelected ? 0.9 : 0.6}
                  />
                  <circle
                    r={isTampere ? 1.2 : 0.9}
                    fill={isTampere ? '#0E141B' : '#F2F5F7'}
                  />

                  {/* Station Label */}
                  <text
                    x={st.x > 60 ? -3 : 3.5}
                    y={st.id === 'ROI' ? -2.5 : 1}
                    textAnchor={st.x > 60 ? 'end' : 'start'}
                    fontSize="3.2"
                    fontWeight={isTampere || isSelected ? '700' : '600'}
                    fill={isTampere ? '#F0A030' : isSelected ? '#4DA3FF' : '#F2F5F7'}
                    className="select-none pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                    letterSpacing="0.02em"
                  >
                    {st.name}
                  </text>
                  {/* Secondary track / delay badge */}
                  {(isTampere || isOulu || isTurku) && (
                    <text
                      x={st.x > 60 ? -3 : 3.5}
                      y={4}
                      textAnchor={st.x > 60 ? 'end' : 'start'}
                      fontSize="2.1"
                      fontFamily="monospace"
                      fill={isTampere ? '#F0A030' : isTurku ? '#F25555' : '#4DA3FF'}
                      className="select-none pointer-events-none"
                    >
                      {isTampere ? 'VIIVEKESKUS (+12m)' : isTurku ? 'PERUUTUS (Salo)' : 'LUMISADE (3×)'}
                    </text>
                  )}
                </g>
              );
            })}

            {/* 6. Active Train Markers */}
            {trains.map((train) => {
              const isSelected = selectedTrainId === train.id;
              const color = getTrainTypeColor(train.type);
              const isDelayed = train.delayMinutes > 0;
              const isCancelled = train.status === 'cancelled';

              return (
                <g
                  key={train.id}
                  transform={`translate(${train.x}, ${train.y})`}
                  className="cursor-pointer group"
                  onClick={() => onSelectTrain(train)}
                  onMouseEnter={() => setHoveredTrain(train)}
                  onMouseLeave={() => setHoveredTrain(null)}
                >
                  {/* Pulse aura for delayed or selected train */}
                  {isSelected && (
                    <circle
                      r="4"
                      fill="none"
                      stroke="#4DA3FF"
                      strokeWidth="0.8"
                      className={reducedMotion ? '' : 'animate-ping origin-center'}
                    />
                  )}

                  {/* Train Body Symbol (Rotated according to heading) */}
                  <g transform={`rotate(${train.headingDeg})`}>
                    {/* Shadow */}
                    <rect
                      x="-1.6"
                      y="-2.8"
                      width="3.2"
                      height="5.6"
                      rx="1"
                      fill="#0E141B"
                      stroke="#16202A"
                      strokeWidth="0.4"
                    />
                    {/* Train Cab */}
                    <rect
                      x="-1.3"
                      y="-2.5"
                      width="2.6"
                      height="5"
                      rx="0.8"
                      fill={isCancelled ? '#F25555' : color}
                    />
                    {/* Direction Arrow Indicator */}
                    <polygon
                      points="0,-2.2 0.8,-0.5 -0.8,-0.5"
                      fill="#0E141B"
                    />
                  </g>

                  {/* Status Indicator Pip */}
                  {isDelayed && !isCancelled && (
                    <circle
                      cx="2"
                      cy="-2.2"
                      r="0.9"
                      fill="#F0A030"
                      stroke="#0E141B"
                      strokeWidth="0.3"
                    />
                  )}

                  {/* Train Code Callout */}
                  <text
                    x="3.2"
                    y="0"
                    fontSize="2.7"
                    fontFamily="monospace"
                    fontWeight="700"
                    fill={isSelected ? '#4DA3FF' : '#F2F5F7'}
                    className="select-none pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                  >
                    {train.number}
                  </text>
                  {/* Delay badge next to label */}
                  {isDelayed && (
                    <text
                      x="3.2"
                      y="2.6"
                      fontSize="2.2"
                      fontFamily="monospace"
                      fontWeight="bold"
                      fill="#F0A030"
                      className="select-none pointer-events-none"
                    >
                      +{train.delayMinutes}m
                    </text>
                  )}
                  {isCancelled && (
                    <text
                      x="3.2"
                      y="2.6"
                      fontSize="2.2"
                      fontFamily="monospace"
                      fontWeight="bold"
                      fill="#F25555"
                      className="select-none pointer-events-none"
                    >
                      PERUTTU
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Quick Hover Tooltip for Train Operator */}
          {hoveredTrain && (
            <div
              style={{
                left: `${hoveredTrain.x}%`,
                top: `${hoveredTrain.y - 10}%`,
              }}
              className="absolute z-40 transform -translate-x-1/2 -translate-y-full pointer-events-none bg-[#16202A] border border-[#243444] rounded-[6px] shadow-xl p-2 text-xs w-48"
            >
              <div className="flex items-center justify-between font-mono font-bold text-[#F2F5F7]">
                <span>{hoveredTrain.number}</span>
                <span className={hoveredTrain.delayMinutes > 0 ? 'text-[#F0A030]' : 'text-[#3FB950]'}>
                  {hoveredTrain.status === 'cancelled'
                    ? 'PERUTTU'
                    : hoveredTrain.delayMinutes > 0
                    ? `+${hoveredTrain.delayMinutes} min`
                    : 'Ajallaan'}
                </span>
              </div>
              <div className="text-[11px] text-[#9BA9B8] mt-0.5 truncate">
                {hoveredTrain.route}
              </div>
              <div className="flex items-center justify-between mt-1 text-[10px] text-[#9BA9B8] font-mono border-t border-[#243444] pt-1">
                <span>{hoveredTrain.speedKmH} km/h</span>
                <span>{hoveredTrain.passengers} matk.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Map Legend: Train types and Map symbols */}
      <div className="p-3 bg-[#16202A]/90 backdrop-blur-md border-t border-[#243444] z-20 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-[#9BA9B8] font-medium text-[11px] uppercase tracking-wider">
            {t.legendTitle}:
          </span>
          {/* IC */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[3px] bg-[#3FB950]" aria-hidden="true" />
            <span className="text-[#F2F5F7] font-mono text-[11px]">{t.intercity}</span>
          </div>
          {/* Pendolino */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[3px] bg-[#4DA3FF]" aria-hidden="true" />
            <span className="text-[#F2F5F7] font-mono text-[11px]">{t.pendolino}</span>
          </div>
          {/* Regional */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[3px] bg-[#A371F7]" aria-hidden="true" />
            <span className="text-[#F2F5F7] font-mono text-[11px]">{t.commuter}</span>
          </div>
          {/* Freight */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[3px] bg-[#F0A030]" aria-hidden="true" />
            <span className="text-[#F2F5F7] font-mono text-[11px]">{t.freight}</span>
          </div>
        </div>

        {/* Legend for Ripple Ring & Delay Spread */}
        <div className="hidden sm:flex items-center gap-4 text-[11px] text-[#9BA9B8]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border border-[#F0A030] bg-[#F0A030]/20 flex items-center justify-center">
              <span className="w-1 h-1 rounded-full bg-[#F0A030]" />
            </span>
            <span className="text-[#F0A030]">Viivekeskus (Tampere)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 border-b-2 border-dashed border-[#F0A030]" />
            <span>Viiveen ketjuuntuminen</span>
          </div>
        </div>
      </div>
    </div>
  );
};
