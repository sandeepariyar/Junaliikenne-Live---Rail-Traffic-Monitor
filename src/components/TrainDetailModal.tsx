import { useModalA11y } from '../hooks/useModalA11y';
import React from 'react';
import { X, Train as TrainIcon, Clock, Users, Gauge, ArrowRight, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Train, Language } from '../types';
import { FtStatusBadge } from './design-system/FtStatusBadge';
import { FtButton } from './design-system/FtButton';

export interface TrainDetailModalProps {
  train: Train | null;
  onClose: () => void;
  onHoldConnection?: (connectingTrainId: string) => void;
  language: Language;
}

export const TrainDetailModal: React.FC<TrainDetailModalProps> = ({
  train,
  onClose,
  onHoldConnection,
  language,
}) => {
  const dialogRef = useModalA11y<HTMLDivElement>(!!train, onClose);

  if (!train) return null;

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={`Junan ${train.number} tiedot`}
      className="fixed inset-0 z-50 bg-[#0E141B]/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#16202A] border border-[#243444] rounded-[10px] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#243444] bg-[#111822] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-[#1C2836] border border-[#243444] flex items-center justify-center text-[#80BDFF]">
              <TrainIcon size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#F2F5F7] font-mono">
                  {train.number}
                </h2>
                <FtStatusBadge
                  variant={train.status === 'cancelled' ? 'danger' : train.delayMinutes > 0 ? 'warning' : 'ok'}
                  delayMinutes={train.delayMinutes}
                  text={train.status === 'cancelled' ? 'Peruttu' : undefined}
                  size="sm"
                />
              </div>
              <p className="text-xs text-[#9BA9B8] mt-0.5">{train.route}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={language === 'fi' ? 'Sulje' : 'Close'}
            className="p-1 rounded-[6px] hover:bg-[#1C2836] text-[#9BA9B8] hover:text-[#F2F5F7] transition-colors focus-visible:ring-2 focus-visible:ring-[#4DA3FF]"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Body Stats Grid */}
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-[8px] bg-[#0E141B] border border-[#243444] flex flex-col">
              <span className="text-[10px] uppercase font-mono text-[#9BA9B8] flex items-center gap-1">
                <Gauge size={12} /> Nopeus
              </span>
              <span className="text-base font-bold text-[#F2F5F7] font-mono mt-1">
                {train.speedKmH} <span className="text-xs font-normal text-[#9BA9B8]">km/h</span>
              </span>
            </div>

            <div className="p-2.5 rounded-[8px] bg-[#0E141B] border border-[#243444] flex flex-col">
              <span className="text-[10px] uppercase font-mono text-[#9BA9B8] flex items-center gap-1">
                <Users size={12} /> Matkustajat
              </span>
              <span className="text-base font-bold text-[#F2F5F7] font-mono mt-1">
                {train.passengers} <span className="text-xs font-normal text-[#9BA9B8]">hlö</span>
              </span>
            </div>

            <div className="p-2.5 rounded-[8px] bg-[#0E141B] border border-[#243444] flex flex-col">
              <span className="text-[10px] uppercase font-mono text-[#9BA9B8] flex items-center gap-1">
                <Clock size={12} /> Viive
              </span>
              <span className={`text-base font-bold font-mono mt-1 ${train.delayMinutes > 0 ? 'text-[#F0A030]' : 'text-[#3FB950]'}`}>
                {train.status === 'cancelled' ? 'Peruttu' : `+${train.delayMinutes} min`}
              </span>
            </div>
          </div>

          {/* Current Position & Timetable */}
          <div className="p-3 rounded-[8px] bg-[#0E141B] border border-[#243444] space-y-2 text-xs">
            <div className="flex justify-between items-center text-[#9BA9B8]">
              <span>Nykyinen sijainti:</span>
              <span className="font-semibold text-[#F2F5F7]">{train.currentStation}</span>
            </div>
            <div className="flex justify-between items-center text-[#9BA9B8]">
              <span>Seuraava pysähdys:</span>
              <span className="font-semibold text-[#F2F5F7]">{train.nextStation}</span>
            </div>
            <div className="flex justify-between items-center text-[#9BA9B8]">
              <span>Arvioitu saapuminen:</span>
              <span className="font-mono font-bold text-[#F2F5F7]">{train.estimatedTime}</span>
            </div>
          </div>

          {/* Operator Dispatch Notes */}
          {train.operatorNotes && (
            <div className="p-3 rounded-[8px] bg-[#1C2836] border border-[#243444] text-xs space-y-1">
              <div className="font-semibold text-[#F2F5F7] flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-[#F0A030]" />
                <span>Ohjaamon tilannetieto</span>
              </div>
              <p className="text-[#9BA9B8] leading-relaxed">
                {train.operatorNotes}
              </p>
            </div>
          )}

          {/* Connecting Trains Risk */}
          {train.connectingTrains && train.connectingTrains.length > 0 && (
            <div className="p-3 rounded-[8px] bg-[#F0A030]/10 border border-[#F0A030]/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#F0A030] flex items-center gap-1.5">
                  <Clock size={14} />
                  <span>Vaarassa olevat vaihtoyhteydet ({train.connectingTrains.length})</span>
                </span>
                <span className="text-[10px] font-mono text-[#F0A030]">Tampere Raiteet 3 & 4</span>
              </div>
              <div className="flex items-center gap-2">
                {train.connectingTrains.map((ct) => (
                  <span key={ct} className="px-2 py-1 rounded bg-[#16202A] border border-[#F0A030]/40 text-xs font-mono font-semibold text-[#F2F5F7]">
                    {ct} (Vaasa)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-[#243444] bg-[#111822] flex items-center justify-between gap-2">
          <FtButton variant="subtle" size="sm" onClick={onClose}>
            Sulje
          </FtButton>
          {train.id === 'ic-27' && (
            <FtButton
              variant="primary"
              size="sm"
              onClick={() => {
                onHoldConnection?.('s-365');
                onClose();
              }}
            >
              Pidä vaihtojunaa S 365 3 min
            </FtButton>
          )}
        </div>
      </div>
    </div>
  );
};
