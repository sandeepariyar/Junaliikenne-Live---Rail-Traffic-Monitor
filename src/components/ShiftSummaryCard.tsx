import React, { useState } from 'react';
import { FileText, Check, Copy } from 'lucide-react';
import { Language, Train, DisturbanceReport } from '../types';
import { summarizeShift } from '../lib/shiftSummary';
import { TRANSLATIONS } from '../data/railData';

export interface ShiftSummaryCardProps {
  language: Language;
  trains: Train[];
  disturbances: DisturbanceReport[];
  onOpenReportModal?: () => void;
  isLive?: boolean;
}

export const ShiftSummaryCard: React.FC<ShiftSummaryCardProps> = ({
  language,
  trains,
  disturbances,
  onOpenReportModal,
  isLive = false,
}) => {
  const t = TRANSLATIONS[language];
  const summary = isLive
    ? language === 'fi'
      ? { headline: `${trains.length} junaa GPS-seurannassa.`, detail: 'Täsmällisyyttä ei lasketa: train-locations-rajapinnassa ei ole aikataulu- tai viivetietoa.', punctuality: NaN }
      : { headline: `${trains.length} trains with a GPS position.`, detail: 'Punctuality is not calculated: the train-locations API has no timetable or delay data.', punctuality: NaN }
    : summarizeShift(trains, disturbances, language);
  void onOpenReportModal;
  const [copied, setCopied] = useState(false);

  const handleCopySummary = () => {
    const text = `JUNALIIKENNE LIVE – ${t.shiftSummaryTitle.toUpperCase()}
${new Date().toLocaleString(language === 'fi' ? 'fi-FI' : 'en-GB')}
${summary.headline}
${summary.detail}
(${isLive ? 'Digitraffic train-locations' : language === 'fi' ? 'Koulutusskenaario, simuloitu' : 'Training scenario, simulated'})`;
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
          <FileText size={15} className="text-[#80BDFF]" aria-hidden="true" />
          <h3 className="text-xs font-bold text-[#F2F5F7] tracking-tight uppercase">
            {t.shiftSummaryTitle}
          </h3>
        </div>

      </div>

      {/* Main Text Content: "Aamu rauhallinen, kaksi peruutusta Turun radalla." */}
      <div className="flex-1 flex flex-col justify-center">
        <p className="text-xs text-[#F2F5F7] font-medium leading-relaxed">
          {summary.headline}
        </p>
        <p className="text-[11px] text-[#9BA9B8] mt-0.5 leading-snug">
          {summary.detail}
        </p>
      </div>

      {/* Footer Quick Action: Copy handover note or expand */}
      <div className="flex items-center justify-between pt-1 border-t border-[#243444]/60 text-[11px]">
        <span className="text-[#9BA9B8] font-mono">
          {isLive
            ? language === 'fi' ? 'Sääntöpohjainen · Digitraffic GPS' : 'Rule-based · Digitraffic GPS'
            : language === 'fi' ? 'Sääntöpohjainen · simuloitu skenaario' : 'Rule-based · simulated scenario'}
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
              <span className="text-[#3FB950]">{language === 'fi' ? 'Kopioitu' : 'Copied'}</span>
            </>
          ) : (
            <>
              <Copy size={11} className="text-[#9BA9B8]" />
              <span>{language === 'fi' ? 'Kopioi raportti' : 'Copy report'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
