import React, { useState } from 'react';
import { Sparkles, FileText, Check, Copy } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data/railData';

export interface ShiftSummaryCardProps {
  language: Language;
  onOpenReportModal?: () => void;
}

export const ShiftSummaryCard: React.FC<ShiftSummaryCardProps> = ({
  language,
  onOpenReportModal,
}) => {
  const t = TRANSLATIONS[language];
  const [copied, setCopied] = useState(false);

  const handleCopySummary = () => {
    const text = `JUNALIIKENNE LIVE - VUORON YHTEENVETO
Aikaleima: ${new Date().toLocaleTimeString('fi-FI')}
Pääoperaattori: Sandeep Pariyar
Yhteenveto: Aamu rauhallinen, kaksi peruutusta Turun radalla (Salo vaihdevika).
Päärata: IC 27 viivästynyt 12 min (Tampere vaihtoyhteydet turvattu pitoaikaa pidentämällä).
Pohjanmaan rata: Lumisade 3x viiveet, talvinopeus 140 km/h aktivoitu.
Täsmällisyysaste: 94.2%`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      data-component="ft-shift-summary-card"
      className="p-3 bg-[#16202A] border-t border-[#243444] flex flex-col justify-between gap-2 select-none h-full"
    >
      {/* Top Header: Title + Tilanneanalyysi Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-[#4DA3FF]" aria-hidden="true" />
          <h3 className="text-xs font-bold text-[#F2F5F7] tracking-tight uppercase">
            {t.shiftSummaryTitle}
          </h3>
        </div>

        {/* Tilanneanalyysi Badge */}
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[#4DA3FF]/15 border border-[#4DA3FF]/30 text-[#4DA3FF] text-[10px] font-bold font-mono">
          <Sparkles size={11} aria-hidden="true" />
          <span>{t.aiBadge}</span>
        </div>
      </div>

      {/* Main Text Content: "Aamu rauhallinen, kaksi peruutusta Turun radalla." */}
      <div className="flex-1 flex flex-col justify-center">
        <p className="text-xs text-[#F2F5F7] font-medium leading-relaxed">
          {t.shiftSummaryText}
        </p>
        <p className="text-[11px] text-[#9BA9B8] mt-0.5 leading-snug">
          Päärata kulkee normaalisti Tampereen jatkoyhteyspidon jälkeen.
        </p>
      </div>

      {/* Footer Quick Action: Copy handover note or expand */}
      <div className="flex items-center justify-between pt-1 border-t border-[#243444]/60 text-[11px]">
        <span className="text-[#9BA9B8] font-mono">
          Pääoperaattori: Sandeep Pariyar · Vuoro B2
        </span>
        <button
          type="button"
          onClick={handleCopySummary}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#1C2836] border border-[#243444] hover:bg-[#223242] text-[#F2F5F7] text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[#4DA3FF]"
          title="Kopioi vuoronvaihtoraportti"
        >
          {copied ? (
            <>
              <Check size={11} className="text-[#3FB950]" />
              <span className="text-[#3FB950]">Kopioitu</span>
            </>
          ) : (
            <>
              <Copy size={11} className="text-[#9BA9B8]" />
              <span>Kopioi raportti</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
