import React, { useState, useEffect } from 'react';
import { Train, Search, Globe, Eye, ZapOff, Sparkles, Layers } from 'lucide-react';
import { FtSegmentedControl } from './design-system/FtSegmentedControl';
import { FtToggle } from './web-components';
import { ViewMode, Language } from '../types';
import { TRANSLATIONS } from '../data/railData';
import { DataSourceMode, DataState } from '../store/railStore';
import { DataSourceBadge } from './DataSourceBadge';

export interface TopBarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  dataSourceMode: DataSourceMode;
  onDataSourceModeChange: (mode: DataSourceMode) => void;
  dataState: DataState;
  lastLiveSuccess: number;
  lastGpsTimestamp: string | null;
  focusMode: boolean;
  onFocusModeChange: (enabled: boolean) => void;
  reducedMotion: boolean;
  onReducedMotionChange: (enabled: boolean) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenSearch: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  viewMode,
  onViewModeChange,
  dataSourceMode,
  onDataSourceModeChange,
  dataState,
  lastLiveSuccess,
  lastGpsTimestamp,
  focusMode,
  onFocusModeChange,
  reducedMotion,
  onReducedMotionChange,
  language,
  onLanguageChange,
  onOpenSearch,
}) => {
  const t = TRANSLATIONS[language];
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString(language === 'fi' ? 'fi-FI' : 'en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
      setDateStr(
        now.toLocaleDateString(language === 'fi' ? 'fi-FI' : 'en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [language]);

  return (
    <header className="h-14 bg-[#16202A] border-b border-[#243444] px-4 flex items-center justify-between gap-3 select-none shrink-0 z-30">
      {/* 1. Left Zone: Train icon + Title + green "Live" dot + Data Source Toggle */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-[8px] bg-[#1C2836] border border-[#243444] flex items-center justify-center text-[#80BDFF]">
          <Train size={18} strokeWidth={2.2} aria-hidden="true" />
        </div>
        <div className="flex items-baseline gap-2">
          <h1 className="text-base font-bold text-[#F2F5F7] tracking-tight whitespace-nowrap">
            {t.appTitle}
          </h1>
          <DataSourceBadge
            state={dataState}
            lastLiveSuccess={lastLiveSuccess}
            lastGpsTimestamp={lastGpsTimestamp}
            language={language}
            reducedMotion={reducedMotion}
          />
        </div>

        {/* Data Source Mode Toggle: Scenario vs Digitraffic Live API */}
        <div role="group" aria-label={language === 'fi' ? 'Datalähde' : 'Data source'} className="hidden xl:flex items-center bg-[#0E141B] p-0.5 rounded-[6px] border border-[#243444] text-[11px] font-mono">
          <button
            type="button"
            onClick={() => onDataSourceModeChange('scenario')}
            aria-pressed={dataSourceMode === 'scenario'}
            className={`px-2 py-0.5 rounded-[4px] transition-colors ${
              dataSourceMode === 'scenario'
                ? 'bg-[#1C2836] text-[#F0A030] font-bold border border-[#F0A030]/40'
                : 'text-[#9BA9B8] hover:text-[#F2F5F7]'
            }`}
            title={language === 'fi' ? 'Koulutusskenaario: simuloitu IC 27 / Tampereen viiveketju' : 'Training scenario: simulated IC 27 / Tampere delay cascade'}
          >
            {language === 'fi' ? 'Skenaario' : 'Scenario'}
          </button>
          <button
            type="button"
            onClick={() => onDataSourceModeChange('live')}
            aria-pressed={dataSourceMode === 'live'}
            className={`px-2 py-0.5 rounded-[4px] transition-colors flex items-center gap-1 ${
              dataSourceMode === 'live'
                ? 'bg-[#1C2836] text-[#3FB950] font-bold border border-[#3FB950]/40'
                : 'text-[#9BA9B8] hover:text-[#F2F5F7]'
            }`}
            title={language === 'fi' ? 'Digitraffic train-locations: junien todelliset GPS-sijainnit' : 'Digitraffic train-locations: real train GPS positions'}
          >
            <span>Digitraffic live</span>
          </button>
        </div>
      </div>

      {/* 2. Center Zone: Centered search field with Ctrl+K hint */}
      <div className="flex-1 min-w-[200px] max-w-md mx-1">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-[8px] bg-[#0E141B] border border-[#243444] hover:border-[#4DA3FF]/70 text-[#9BA9B8] hover:text-[#F2F5F7] transition-all text-xs group cursor-pointer focus-visible:ring-2 focus-visible:ring-[#4DA3FF]"
          aria-keyshortcuts="Control+K"
        >
          <div className="flex items-center gap-2 truncate">
            <Search size={14} className="text-[#9BA9B8] group-hover:text-[#80BDFF]" aria-hidden="true" />
            <span className="truncate">{t.searchPlaceholder}</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[4px] bg-[#16202A] border border-[#243444] text-[10px] font-mono text-[#9BA9B8]">
            {t.searchHint}
          </kbd>
        </button>
      </div>

      {/* 3. Right Zone: Segmented control + Toggles + FI/EN + Clock */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Segmented control: 2D | 3D Elävä kartta */}
        <FtSegmentedControl<ViewMode>
          value={viewMode}
          onChange={onViewModeChange}
          options={[
            { value: '2D', label: t.twoD },
            {
              value: '3D',
              label: t.threeD,
              icon: <Layers size={13} className="text-[#80BDFF]" />,
            },
          ]}
          ariaLabel="Valitse karttanäkymä"
        />

        <div className="h-5 w-px bg-[#243444]" aria-hidden="true" />

        {/* Toggle: Fokustila */}
        <FtToggle
          label={t.focusMode}
          checked={focusMode}
          onToggleChange={(e: Event) => onFocusModeChange((e as CustomEvent<{ checked: boolean }>).detail.checked)}
        >
          <Eye slot="icon" size={13} />
        </FtToggle>

        {/* Toggle: Vähennä liikettä */}
        <FtToggle
          label={t.reduceMotion}
          checked={reducedMotion}
          onToggleChange={(e: Event) => onReducedMotionChange((e as CustomEvent<{ checked: boolean }>).detail.checked)}
        >
          <ZapOff slot="icon" size={13} />
        </FtToggle>

        <div className="h-5 w-px bg-[#243444]" aria-hidden="true" />

        {/* FI / EN switch */}
        <button
          type="button"
          onClick={() => onLanguageChange(language === 'fi' ? 'en' : 'fi')}
          className="flex items-center gap-1.5 px-2 py-1 rounded-[6px] text-xs font-mono font-medium text-[#9BA9B8] hover:text-[#F2F5F7] hover:bg-[#1C2836] border border-transparent hover:border-[#243444] transition-colors focus-visible:ring-2 focus-visible:ring-[#4DA3FF]"
          title="Vaihda kieltä / Switch language"
          aria-label={language === 'fi' ? 'Kieli: FI. Switch to English' : 'Language: EN. Vaihda suomeksi'}
        >
          <Globe size={13} aria-hidden="true" />
          <span className="font-semibold text-[#F2F5F7]">
            {language.toUpperCase()}
          </span>
        </button>

        <div className="h-5 w-px bg-[#243444]" aria-hidden="true" />

        {/* Lead Operator Badge: Sandeep Pariyar */}
        <div className="hidden 2xl:flex items-center gap-2 px-2 py-1 rounded-[6px] bg-[#111822] border border-[#243444] text-xs">
          <div className="w-5 h-5 rounded-full bg-[#4DA3FF]/20 border border-[#4DA3FF]/40 flex items-center justify-center text-[10px] font-bold text-[#80BDFF] font-mono">
            SP
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] font-semibold text-[#F2F5F7] whitespace-nowrap">Sandeep Pariyar</span>
            <span className="text-[9px] text-[#9BA9B8] font-mono">Pääoperaattori</span>
          </div>
        </div>

        <div className="hidden 2xl:block h-5 w-px bg-[#243444]" aria-hidden="true" />

        {/* Clock with Finnish/European format */}
        <div className="flex items-baseline gap-1.5 pl-1 font-mono tabular-nums text-xs">
          <span className="hidden 2xl:inline text-[#9BA9B8] text-[11px] capitalize">{dateStr}</span>
          <span className="text-[#F2F5F7] font-semibold text-sm bg-[#0E141B] px-2 py-0.5 rounded-[4px] border border-[#243444]">
            {timeStr}
          </span>
        </div>
      </div>
    </header>
  );
};
