import React from 'react';
import { Language } from '../types';
import { DataState } from '../store/railStore';

const fmt = (ms: number, lang: Language) =>
  new Date(ms).toLocaleTimeString(lang === 'fi' ? 'fi-FI' : 'en-GB', { hour12: false });

const STYLE: Record<DataState, string> = {
  scenario: 'bg-[#F0A030]/15 border-[#F0A030]/45 text-[#F0A030]',
  connecting: 'bg-[#4DA3FF]/15 border-[#4DA3FF]/45 text-[#80BDFF]',
  live: 'bg-[#3FB950]/15 border-[#3FB950]/40 text-[#3FB950]',
  stale: 'bg-[#F0A030]/15 border-[#F0A030]/45 text-[#F0A030]',
  offline: 'bg-[#F25555]/15 border-[#F25555]/45 text-[#FF8080]',
};

export function dataStateLabel(state: DataState, lang: Language): string {
  const fi = lang === 'fi';
  switch (state) {
    case 'scenario': return fi ? 'Simuloitu' : 'Simulated';
    case 'connecting': return fi ? 'Yhdistetään…' : 'Connecting…';
    case 'live': return 'Live';
    case 'stale': return fi ? 'Vanhentunut' : 'Stale';
    case 'offline': return fi ? 'Ei yhteyttä' : 'Offline';
  }
}

/** Source + freshness badge shown in the top bar. Text + shape, never colour alone. */
export const DataSourceBadge: React.FC<{
  state: DataState;
  lastLiveSuccess: number;
  lastGpsTimestamp: string | null;
  language: Language;
  reducedMotion: boolean;
}> = ({ state, lastLiveSuccess, lastGpsTimestamp, language, reducedMotion }) => {
  const fi = language === 'fi';
  const updated = lastLiveSuccess ? fmt(lastLiveSuccess, language) : null;
  const title =
    state === 'scenario'
      ? fi ? 'Kaikki junat, viiveet ja häiriöt ovat keksittyä harjoitusdataa.' : 'All trains, delays and disruptions are invented training data.'
      : `${fi ? 'Lähde' : 'Source'}: rata.digitraffic.fi /train-locations/latest${updated ? ` · ${fi ? 'haettu' : 'fetched'} ${updated}` : ''}${lastGpsTimestamp ? ` · GPS ${fmt(Date.parse(lastGpsTimestamp), language)}` : ''}`;

  return (
    <div
      data-testid="data-source-badge"
      data-state={state}
      title={title}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] border text-[11px] font-semibold font-mono uppercase tracking-wider whitespace-nowrap ${STYLE[state]}`}
    >
      <span
        aria-hidden="true"
        className={`w-1.5 h-1.5 ${state === 'scenario' ? 'rotate-45 bg-[#F0A030]' : 'rounded-full bg-current'} ${
          state === 'live' && !reducedMotion ? 'animate-pulse' : ''
        }`}
      />
      <span className="sr-only">{fi ? 'Datalähde: ' : 'Data source: '}</span>
      <span>{dataStateLabel(state, language)}</span>
      {state !== 'scenario' && updated && (
        <span className="normal-case font-normal">
          · {updated}
        </span>
      )}
    </div>
  );
};

/** Banner for degraded live states. Live mode never silently substitutes demo data. */
export const DataStateBanner: React.FC<{
  state: DataState;
  lastLiveSuccess: number;
  liveError: string | null;
  language: Language;
  onRetry: () => void;
  onSwitchToScenario: () => void;
}> = ({ state, lastLiveSuccess, liveError, language, onRetry, onSwitchToScenario }) => {
  const fi = language === 'fi';
  if (state !== 'stale' && state !== 'offline') return null;
  const offline = state === 'offline';
  const ago = lastLiveSuccess ? Math.round((Date.now() - lastLiveSuccess) / 1000) : 0;
  const btn =
    'px-2.5 py-1 rounded-[6px] border text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DA3FF]';
  return (
    <div
      role={offline ? 'alert' : 'status'}
      data-testid="data-state-banner"
      className={`px-4 py-2 flex items-center justify-between gap-3 text-xs border-b shrink-0 ${
        offline ? 'bg-[#2A1418] border-[#F25555]/50 text-[#FFB3B3]' : 'bg-[#2A2114] border-[#F0A030]/50 text-[#FFD08A]'
      }`}
    >
      <p>
        <strong className="font-bold">
          {offline ? (fi ? 'Live-dataa ei saatavilla.' : 'Live data unavailable.') : fi ? 'Live-data on vanhentunutta.' : 'Live data is stale.'}
        </strong>{' '}
        {offline
          ? fi
            ? `Digitraffic-rajapintaan ei saatu yhteyttä${liveError ? ` (${liveError})` : ''}. Junia ei näytetä – mitään ei korvata simuloidulla datalla.`
            : `Could not reach the Digitraffic API${liveError ? ` (${liveError})` : ''}. No trains are shown – nothing is replaced with simulated data.`
          : fi
          ? `Viimeisin onnistunut päivitys ${new Date(lastLiveSuccess).toLocaleTimeString('fi-FI')} (${ago} s sitten). Sijainnit voivat olla vanhentuneita.`
          : `Last successful update ${new Date(lastLiveSuccess).toLocaleTimeString('en-GB')} (${ago} s ago). Positions may be out of date.`}
      </p>
      <div className="flex gap-2 shrink-0">
        <button type="button" onClick={onRetry} className={`${btn} border-current bg-transparent`}>
          {fi ? 'Yritä uudelleen' : 'Retry'}
        </button>
        <button type="button" onClick={onSwitchToScenario} className={`${btn} border-[#F0A030]/60 bg-[#0E141B] text-[#F0A030]`}>
          {fi ? 'Vaihda koulutusskenaarioon' : 'Switch to training scenario'}
        </button>
      </div>
    </div>
  );
};
