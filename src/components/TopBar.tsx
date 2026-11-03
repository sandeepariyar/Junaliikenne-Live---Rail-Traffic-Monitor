import React, { useState, useEffect } from 'react';
import { Train, Search, Globe, Eye, ZapOff, Sparkles, Layers } from 'lucide-react';
import { FtSegmentedControl } from './design-system/FtSegmentedControl';
import { FtToggle } from './design-system/FtToggle';
import { ViewMode, Language } from '../types';
import { TRANSLATIONS } from '../data/railData';
import { DataSourceMode } from '../store/railStore';

export interface TopBarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  dataSourceMode: DataSourceMode;
  onDataSourceModeChange: (mode: DataSourceMode) => void;
  lastSyncTime?: string;
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
  lastSyncTime,
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
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-[8px] bg-[#1C2836] border border-[#243444] flex items-center justify-center text-[#4DA3FF]">
          <Train size={18} strokeWidth={2.2} aria-hidden="true" />
        </div>
        <div className="flex items-baseline gap-2">
          <h1 className="text-base font-bold text-[#F2F5F7] tracking-tight whitespace-nowrap">
            {t.appTitle}
          </h1>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[#3FB950]/15 border border-[#3FB950]/30 text-[#3FB950] text-[11px] font-semibold font-mono uppercase tracking-wider">
            <span
              className={`w-1.5 h-1.5 rounded-full bg-[#3FB950] ${
                reducedMotion ? '' : 'animate-pulse'
              }`}
              aria-hidden="true"
            />
            <span>{t.live}</span>
          </div>
        </div>

        {/* Data Source Mode Toggle: Scenario vs Digitraffic Live API */}
        <div className="hidden xl:flex items-center bg-[#0E141B] p-0.5 rounded-[6px] border border-[#243444] text-[11px] font-mono">
          <button
            type="button"
            onClick={() => onDataSourceModeChange('scenario')}
            className={`px-2 py-0.5 rounded-[4px] transition-colors ${
              dataSourceMode === 'scenario'
                ? 'bg-[#1C2836] text-[#F0A030] font-bold border border-[#F0A030]/40'
                : 'text-[#9BA9B8] hover:text-[#F2F5F7]'
            }`}
            title="Harjoitusskenaario: IC 27 & Tampereen viiveketju"
          >
            Häiriöskenaario
          </button>
          <button
            type="button"
            onClick={() => onDataSourceModeChange('live')}
            className={`px-2 py-0.5 rounded-[4px] transition-colors flex items-center gap-1 ${
              dataSourceMode === 'live'
                ? 'bg-[#1C2836] text-[#3FB950] font-bold border border-[#3FB950]/40'
                : 'text-[#9BA9B8] hover:text-[#F2F5F7]'
            }`}
            title="Aito Digitraffic API: Reaaliaikaiset GPS-sijainnit Fintrafficilta"
          >
            <span>Digitraffic GPS Live</span>
            {lastSyncTime && <span className="text-[9px] opacity-75">({lastSyncTime})</span>}
          </button>
        </div>
      </div>

      {/* 2. Center Zone: Centered search field with Ctrl+K hint */}
      <div className="flex-1 max-w-md mx-2">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-[8px] bg-[#0E141B] border border-[#243444] hover:border-[#4DA3FF]/70 text-[#9BA9B8] hover:text-[#F2F5F7] transition-all text-xs group cursor-pointer focus-visible:ring-2 focus-visible:ring-[#4DA3FF]"
          aria-label={t.searchPlaceholder}
        >
          <div className="flex items-center gap-2 truncate">
            <Search size={14} className="text-[#9BA9B8] group-hover:text-[#4DA3FF]" aria-hidden="true" />
            <span className="truncate">{t.searchPlaceholder}</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[4px] bg-[#16202A] border border-[#243444] text-[10px] font-mono text-[#9BA9B8]">
            {t.searchHint}
          </kbd>
        </button>
      </div>

      {/* 3. Right Zone: Segmented control + Toggles + FI/EN + Clock */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Segmented control: 2D | 3D Elävä kartta */}
        <FtSegmentedControl<ViewMode>
          value={viewMode}
          onChange={onViewModeChange}
          options={[
            { value: '2D', label: t.twoD },
            {
              value: '3D',
              label: t.threeD,
              icon: <Layers size={13} className="text-[#4DA3FF]" />,
            },
          ]}
          ariaLabel="Valitse karttanäkymä"
        />

        <div className="h-5 w-px bg-[#243444]" aria-hidden="true" />

        {/* Toggle: Fokustila */}
        <FtToggle
          label={t.focusMode}
          checked={focusMode}
          onChange={onFocusModeChange}
          icon={<Eye size={13} />}
          id="toggle-focus-mode"
        />

        {/* Toggle: Vähennä liikettä */}
        <FtToggle
          label={t.reduceMotion}
          checked={reducedMotion}
          onChange={onReducedMotionChange}
          icon={<ZapOff size={13} />}
          id="toggle-reduce-motion"
        />

        <div className="h-5 w-px bg-[#243444]" aria-hidden="true" />

        {/* FI / EN switch */}
        <button
          type="button"
          onClick={() => onLanguageChange(language === 'fi' ? 'en' : 'fi')}
          className="flex items-center gap-1.5 px-2 py-1 rounded-[6px] text-xs font-mono font-medium text-[#9BA9B8] hover:text-[#F2F5F7] hover:bg-[#1C2836] border border-transparent hover:border-[#243444] transition-colors focus-visible:ring-2 focus-visible:ring-[#4DA3FF]"
          title="Vaihda kieltä / Switch language"
        >
          <Globe size={13} aria-hidden="true" />
          <span className="font-semibold text-[#F2F5F7]">
            {language.toUpperCase()}
          </span>
        </button>

        <div className="h-5 w-px bg-[#243444]" aria-hidden="true" />

        {/* Lead Operator Badge: Sandeep Pariyar */}
        <div className="hidden lg:flex items-center gap-2 px-2 py-1 rounded-[6px] bg-[#111822] border border-[#243444] text-xs">
          <div className="w-5 h-5 rounded-full bg-[#4DA3FF]/20 border border-[#4DA3FF]/40 flex items-center justify-center text-[10px] font-bold text-[#4DA3FF] font-mono">
            SP
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] font-semibold text-[#F2F5F7] whitespace-nowrap">Sandeep Pariyar</span>
            <span className="text-[9px] text-[#9BA9B8] font-mono">Pääoperaattori</span>
          </div>
        </div>

        <div className="h-5 w-px bg-[#243444]" aria-hidden="true" />

        {/* Clock with Finnish/European format */}
        <div className="flex items-baseline gap-1.5 pl-1 font-mono tabular-nums text-xs">
          <span className="text-[#9BA9B8] text-[11px] capitalize">{dateStr}</span>
          <span className="text-[#F2F5F7] font-semibold text-sm bg-[#0E141B] px-2 py-0.5 rounded-[4px] border border-[#243444]">
            {timeStr}
          </span>
        </div>
      </div>
    </header>
  );
};
