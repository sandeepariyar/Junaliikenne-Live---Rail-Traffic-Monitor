import { useModalA11y } from '../hooks/useModalA11y';
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Train as TrainIcon, Building2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Train, Station, DisturbanceReport, Language } from '../types';
import { FtStatusBadge } from './design-system/FtStatusBadge';

export interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  trains: Train[];
  stations: Station[];
  disturbances: DisturbanceReport[];
  onSelectTrain: (train: Train) => void;
  onSelectStation: (station: Station) => void;
  language: Language;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  trains,
  stations,
  disturbances,
  onSelectTrain,
  onSelectStation,
  language,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);


  const dialogRef = useModalA11y<HTMLDivElement>(!!isOpen, onClose);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const matchingTrains = trains.filter(
    (t) =>
      t.number.toLowerCase().includes(q) ||
      t.route.toLowerCase().includes(q) ||
      t.destination.toLowerCase().includes(q)
  );

  const matchingStations = stations.filter(
    (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
  );

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Pikahaku"
      className="fixed inset-0 z-50 bg-[#0E141B]/80 backdrop-blur-sm flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#16202A] border border-[#243444] rounded-[10px] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-3 border-b border-[#243444] flex items-center gap-3 bg-[#111822]">
          <Search size={18} className="text-[#80BDFF]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hae junaa (esim. IC 27), asemaa tai reittiä..."
            aria-label={language === 'fi' ? 'Hae junaa, asemaa tai reittiä' : 'Search train, station or route'}
            className="flex-1 bg-transparent border-none text-[#F2F5F7] text-sm focus:outline-none placeholder-[#93A3B4]"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-[#16202A] border border-[#243444] text-[10px] font-mono text-[#9BA9B8]">
            ESC
          </kbd>
          <button
            type="button"
            onClick={onClose}
            aria-label={language === 'fi' ? 'Sulje haku' : 'Close search'}
            className="p-1 rounded text-[#9BA9B8] hover:text-[#F2F5F7]"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-[#243444]/40">
          {/* Trains Section */}
          {matchingTrains.length > 0 && (
            <div className="py-2">
              <div className="text-[11px] font-bold text-[#9BA9B8] uppercase px-2 mb-1.5 tracking-wider">
                Junat ({matchingTrains.length})
              </div>
              <div className="space-y-1">
                {matchingTrains.map((tr) => (
                  <button
                    key={tr.id}
                    type="button"
                    onClick={() => {
                      onSelectTrain(tr);
                      onClose();
                    }}
                    className="w-full p-2 rounded-[6px] hover:bg-[#1C2836] flex items-center justify-between text-left group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-[6px] bg-[#111822] border border-[#243444] flex items-center justify-center text-[#80BDFF]">
                        <TrainIcon size={14} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#F2F5F7]">
                            {tr.number}
                          </span>
                          <span className="text-xs text-[#9BA9B8]">{tr.route}</span>
                        </div>
                        <div className="text-[11px] text-[#9BA9B8]">
                          {tr.currentStation} · {tr.speedKmH} km/h
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FtStatusBadge
                        variant={tr.status === 'cancelled' ? 'danger' : tr.delayMinutes > 0 ? 'warning' : 'ok'}
                        delayMinutes={tr.delayMinutes}
                        text={tr.status === 'cancelled' ? 'Peruttu' : undefined}
                        size="sm"
                      />
                      <ArrowRight size={14} className="text-[#9BA9B8] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stations Section */}
          {matchingStations.length > 0 && (
            <div className="py-2">
              <div className="text-[11px] font-bold text-[#9BA9B8] uppercase px-2 mb-1.5 tracking-wider">
                Asemat ({matchingStations.length})
              </div>
              <div className="space-y-1">
                {matchingStations.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      onSelectStation(st);
                      onClose();
                    }}
                    className="w-full p-2 rounded-[6px] hover:bg-[#1C2836] flex items-center justify-between text-left group transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Building2 size={15} className="text-[#80BDFF]" />
                      <span className="text-sm font-semibold text-[#F2F5F7]">{st.name}</span>
                      <span className="text-xs font-mono text-[#9BA9B8]">({st.code})</span>
                    </div>
                    <div className="text-xs font-mono text-[#9BA9B8]">
                      {st.tracks} raidetta · Viive: {st.delayIndex}/100
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {matchingTrains.length === 0 && matchingStations.length === 0 && (
            <div className="p-8 text-center text-xs text-[#9BA9B8]">
              Ei tuloksia haulle "{query}". Kokeile "IC 27", "Tampere" tai "Oulu".
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
