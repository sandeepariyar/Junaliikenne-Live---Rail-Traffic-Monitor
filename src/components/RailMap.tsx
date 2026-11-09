import React, { useRef } from 'react';
import { Plus, Minus, RotateCcw, Crosshair, AlertCircle } from 'lucide-react';
import { Station, TrackLine, Train, ViewMode, Language } from '../types';
import { TRANSLATIONS } from '../data/railData';
import { RailMap2D, RailMap2DHandle, TRAIN_COLORS } from './map/RailMap2D';
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
  /** Hides scenario-only overlays in live mode. */
  isLive?: boolean;
}

const ctrlBtn =
  'w-8 h-8 flex items-center justify-center rounded-[6px] hover:bg-[#223242] text-[#F2F5F7] transition-colors';

export const RailMap: React.FC<RailMapProps> = (props) => {
  const { viewMode, stations, trains, language } = props;
  const t = TRANSLATIONS[language];
  const fi = language === 'fi';
  const map2d = useRef<RailMap2DHandle | null>(null);
  const tpe = stations.find((s) => s.id === 'TPE');

  return (
    <div className="relative w-full h-full bg-[#0E141B] overflow-hidden flex flex-col border-r border-[#243444]">
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 pointer-events-none">
        <div className="px-3 py-1.5 rounded-[8px] bg-[#16202A]/90 backdrop-blur-md border border-[#243444] shadow-md flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-[#4DA3FF]" aria-hidden="true" />
          <span className="font-semibold text-[#F2F5F7]">
            {viewMode === '3D' ? t.threeD : fi ? 'Suomen rataverkko' : 'Finnish rail network'}
          </span>
          <span className="text-[#C4CFDA] font-mono">
            {trains.length} {fi ? 'junaa' : 'trains'}
          </span>
        </div>
        {!props.isLive && (
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-[#2A2214]/95 border border-[#F0A030]/50 text-xs text-[#F0A030]">
            <AlertCircle size={14} className="shrink-0" aria-hidden="true" />
            <span className="font-medium truncate">{fi ? 'Skenaario' : 'Scenario'} · {t.tampereHubNotice}</span>
          </div>
        )}
      </div>

      <div className="relative flex-1 min-h-0">
        {viewMode === '3D' ? (
          <ThreeDLiveMap {...props} />
        ) : (
          <>
            <RailMap2D {...props} apiRef={map2d} />
            <div className="absolute top-3 right-3 z-20 flex flex-col gap-1 bg-[#16202A]/90 backdrop-blur-md p-1 rounded-[8px] border border-[#243444] shadow-md">
              <button type="button" onClick={() => map2d.current?.zoomBy(1.4)} title={t.zoomIn} aria-label={t.zoomIn} className={ctrlBtn}><Plus size={15} aria-hidden="true" /></button>
              <button type="button" onClick={() => map2d.current?.zoomBy(1 / 1.4)} title={t.zoomOut} aria-label={t.zoomOut} className={ctrlBtn}><Minus size={15} aria-hidden="true" /></button>
              <div className="h-px bg-[#243444] mx-1 my-0.5" />
              <button type="button" onClick={() => tpe && map2d.current?.focus(tpe.x, tpe.y, 18)} title={t.locateTampere} aria-label={t.locateTampere} className={`${ctrlBtn} text-[#F0A030]`}><Crosshair size={15} aria-hidden="true" /></button>
              <button type="button" onClick={() => map2d.current?.reset()} title={t.resetView} aria-label={t.resetView} className={ctrlBtn}><RotateCcw size={13} aria-hidden="true" /></button>
            </div>
          </>
        )}
      </div>

      <div className="px-3 py-2 bg-[#16202A] border-t border-[#243444] z-20 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px]">
        <ul className="flex flex-wrap items-center gap-3" aria-label={t.legendTitle}>
          {([['IC', t.intercity], ['S', t.pendolino], ['HDM', t.commuter], ['T', t.freight]] as const).map(([k, lab]) => (
            <li key={k} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: TRAIN_COLORS[k] }} aria-hidden="true" />
              <span className="text-[#F2F5F7]">{lab}</span>
            </li>
          ))}
        </ul>
        <ul className="flex flex-wrap items-center gap-3 text-[#C4CFDA]" aria-label={t.legend}>
          <li className="flex items-center gap-1.5"><span className="w-4 h-[3px] rounded bg-[#F0A030]" aria-hidden="true" />{fi ? 'Viiveketju' : 'Delay cascade'}</li>
          <li className="flex items-center gap-1.5"><span className="w-4 border-t-[3px] border-dashed border-[#4DA3FF]" aria-hidden="true" />{fi ? 'Sääriski' : 'Weather risk'}</li>
          <li className="flex items-center gap-1.5"><span className="w-4 h-[2px] bg-[#5B7A99]" aria-hidden="true" />{fi ? 'Rataverkko' : 'Rail network'}</li>
        </ul>
      </div>
    </div>
  );
};
