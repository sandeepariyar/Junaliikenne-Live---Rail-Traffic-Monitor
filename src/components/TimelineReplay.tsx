import React from 'react';
import { Play, Pause, RotateCcw, FastForward, Rewind } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data/railData';

export interface TimelineReplayProps {
  replayMinutes: number; // -60 to +30
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (minutes: number) => void;
  language: Language;
}

export const TimelineReplay: React.FC<TimelineReplayProps> = ({
  replayMinutes,
  isPlaying,
  onTogglePlay,
  onSeek,
  language,
}) => {
  const t = TRANSLATIONS[language];

  const getLabelForTime = (mins: number) => {
    if (mins === 0) return 'Nyt (Reaaliaika)';
    if (mins < 0) return `${mins} min`;
    return `+${mins} min ennuste`;
  };

  return (
    <div
      data-component="ft-timeline-replay"
      className="p-3 bg-[#16202A] border-t border-[#243444] flex flex-col justify-between gap-2.5 select-none h-full"
    >
      {/* Header: Title and Current Scrub Time Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#4DA3FF]" aria-hidden="true" />
          <h3 className="text-xs font-bold text-[#F2F5F7] tracking-tight uppercase">
            {t.dayReplay}
          </h3>
        </div>
        <div className="flex items-center gap-2 font-mono tabular-nums text-xs">
          <span className="text-[#9BA9B8] text-[11px]">Aikasiirtymä:</span>
          <span
            className={`px-2 py-0.5 rounded-[4px] font-bold ${
              replayMinutes === 0
                ? 'bg-[#3FB950]/20 text-[#3FB950] border border-[#3FB950]/40'
                : replayMinutes > 0
                ? 'bg-[#4DA3FF]/20 text-[#80BDFF] border border-[#4DA3FF]/40'
                : 'bg-[#F0A030]/20 text-[#F0A030] border border-[#F0A030]/40'
            }`}
          >
            {getLabelForTime(replayMinutes)}
          </span>
        </div>
      </div>

      {/* Control Buttons & Slider */}
      <div className="flex items-center gap-3">
        {/* Rewind 10 min */}
        <button
          type="button"
          onClick={() => onSeek(Math.max(-60, replayMinutes - 10))}
          title="Siirry 10 min taaksepäin"
          aria-label="Siirry 10 min taaksepäin"
          className="p-1.5 rounded-[6px] hover:bg-[#1C2836] text-[#9BA9B8] hover:text-[#F2F5F7] transition-colors focus-visible:ring-2 focus-visible:ring-[#4DA3FF]"
        >
          <Rewind size={14} />
        </button>

        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={onTogglePlay}
          title={isPlaying ? 'Pysäytä toisto' : 'Käynnistä toisto'}
          aria-label={isPlaying ? 'Pysäytä toisto' : 'Käynnistä toisto'}
          className="w-8 h-8 rounded-[8px] bg-[#4DA3FF] hover:bg-[#66b1ff] active:bg-[#3d91eb] text-[#0E141B] flex items-center justify-center font-bold transition-all shadow-md focus-visible:ring-2 focus-visible:ring-white shrink-0"
        >
          {isPlaying ? (
            <Pause size={15} strokeWidth={2.5} />
          ) : (
            <Play size={15} strokeWidth={2.5} className="ml-0.5" />
          )}
        </button>

        {/* FastForward 10 min */}
        <button
          type="button"
          onClick={() => onSeek(Math.min(30, replayMinutes + 10))}
          title="Siirry 10 min eteenpäin"
          aria-label="Siirry 10 min eteenpäin"
          className="p-1.5 rounded-[6px] hover:bg-[#1C2836] text-[#9BA9B8] hover:text-[#F2F5F7] transition-colors focus-visible:ring-2 focus-visible:ring-[#4DA3FF]"
        >
          <FastForward size={14} />
        </button>

        {/* Interactive Scrub Slider (-60 to +30) */}
        <div className="flex-1 relative flex items-center">
          <input
            type="range"
            min="-60"
            max="30"
            step="1"
            value={replayMinutes}
            onChange={(e) => onSeek(parseInt(e.target.value, 10))}
            aria-label="Päivän replay aikajana (-60 min - +30 min)"
            className="w-full h-2 bg-[#0E141B] rounded-lg appearance-none cursor-pointer accent-[#4DA3FF] focus:outline-none focus:ring-2 focus:ring-[#4DA3FF]"
          />
        </div>

        {/* Reset to Now (0 min) */}
        <button
          type="button"
          onClick={() => onSeek(0)}
          title="Palaa reaaliaikaan"
          className="px-2 py-1 rounded-[6px] text-xs font-mono font-medium text-[#9BA9B8] hover:text-[#F2F5F7] hover:bg-[#1C2836] border border-[#243444] transition-colors focus-visible:ring-2 focus-visible:ring-[#4DA3FF]"
        >
          Nyt
        </button>
      </div>

      {/* Axis Marker Labels: -60 min … Nyt … +30 min ennuste */}
      <div className="flex items-center justify-between text-[11px] font-mono text-[#9BA9B8] px-1">
        <button
          type="button"
          onClick={() => onSeek(-60)}
          className="hover:text-[#F2F5F7] cursor-pointer"
        >
          -60 min
        </button>
        <button
          type="button"
          onClick={() => onSeek(-30)}
          className="hover:text-[#F2F5F7] cursor-pointer hidden sm:inline"
        >
          -30 min
        </button>
        <button
          type="button"
          onClick={() => onSeek(0)}
          className="font-bold text-[#3FB950] hover:underline cursor-pointer"
        >
          Nyt
        </button>
        <button
          type="button"
          onClick={() => onSeek(15)}
          className="hover:text-[#F2F5F7] cursor-pointer hidden sm:inline"
        >
          +15 min
        </button>
        <button
          type="button"
          onClick={() => onSeek(30)}
          className="text-[#80BDFF] font-medium hover:text-[#F2F5F7] cursor-pointer"
        >
          +30 min ennuste
        </button>
      </div>
    </div>
  );
};
