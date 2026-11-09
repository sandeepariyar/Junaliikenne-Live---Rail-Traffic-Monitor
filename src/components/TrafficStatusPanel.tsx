import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, AlertCircle, Building2, ShieldAlert } from 'lucide-react';
import { Train, Station, DisturbanceReport, TrafficTab, Language } from '../types';
import { FtTabs, FtStatusBadge } from './web-components';
import { trainStatus } from '../lib/trainStatus';
import { FtTableRow } from './design-system/FtTableRow';
import { TRANSLATIONS } from '../data/railData';

export interface TrafficStatusPanelProps {
  activeTab: TrafficTab;
  onTabChange: (tab: TrafficTab) => void;
  trains: Train[];
  stations: Station[];
  disturbances: DisturbanceReport[];
  selectedTrainId: string | null;
  onSelectTrain: (train: Train) => void;
  selectedStationId: string | null;
  onSelectStation: (station: Station) => void;
  language: Language;
  /** Live mode: scenario-only station metrics are hidden. */
  isLive?: boolean;
}

export const TrafficStatusPanel: React.FC<TrafficStatusPanelProps> = ({
  activeTab,
  onTabChange,
  trains,
  stations,
  disturbances,
  selectedTrainId,
  onSelectTrain,
  selectedStationId,
  onSelectStation,
  language,
  isLive = false,
}) => {
  const t = TRANSLATIONS[language];
  const [filterText, setFilterText] = useState('');
  const [sortField, setSortField] = useState<'number' | 'delay' | 'time'>('delay');
  const [sortAsc, setSortAsc] = useState(false);

  // Tab definitions
  const tabs = [
    { id: 'delays', label: t.tabDelays, count: isLive ? trains.length : trains.filter((tr) => (tr.delayMinutes ?? 0) > 0 || tr.status === 'cancelled').length },
    { id: 'stations', label: t.tabStations, count: stations.length },
    { id: 'disturbances', label: t.tabDisturbances, count: disturbances.length },
  ];

  // Filter & sort trains
  const filteredTrains = useMemo(() => {
    let result = trains.filter((tr) => {
      const q = filterText.toLowerCase();
      return (
        tr.number.toLowerCase().includes(q) ||
        tr.route.toLowerCase().includes(q) ||
        tr.destination.toLowerCase().includes(q)
      );
    });

    result.sort((a, b) => {
      if (sortField === 'delay') {
        const aVal = a.status === 'cancelled' ? 999 : a.delayMinutes ?? -1;
        const bVal = b.status === 'cancelled' ? 999 : b.delayMinutes ?? -1;
        return sortAsc ? aVal - bVal : bVal - aVal;
      }
      if (sortField === 'number') {
        return sortAsc ? a.number.localeCompare(b.number) : b.number.localeCompare(a.number);
      }
      return sortAsc ? a.scheduledTime.localeCompare(b.scheduledTime) : b.scheduledTime.localeCompare(a.scheduledTime);
    });

    return result;
  }, [trains, filterText, sortField, sortAsc]);

  const toggleSort = (field: 'number' | 'delay' | 'time') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <aside
      aria-label="Junaliikenteen tilannepaneeli"
      className="w-full h-full bg-[#16202A] flex flex-col overflow-hidden select-none"
    >
      {/* Panel Header */}
      <div className="px-3 pt-3 bg-[#16202A] shrink-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h2 className="text-sm font-bold text-[#F2F5F7] tracking-tight">
            {t.trafficStatus}
          </h2>
          <span className="text-[11px] font-mono text-[#9BA9B8]">
            {filteredTrains.length} / {trains.length} junaa
          </span>
        </div>

      </div>

      {/* <ft-tabs> Lit element via @lit/react; the active panel is slotted into its role="tabpanel". */}
      <FtTabs
        className="ft-panel-tabs flex-1 min-h-0"
        label={language === 'fi' ? 'Junaliikenteen tilanne välilehdet' : 'Traffic status tabs'}
        tabs={tabs}
        activeTabId={activeTab}
        onTabChange={(e: Event) => onTabChange((e as CustomEvent<{ activeId: string }>).detail.activeId as TrafficTab)}
      >
      {/* Tab Panel Content: Myöhästymiset (Delays) */}
      {activeTab === 'delays' && (
        <div
          className="flex-1 flex flex-col min-h-0"
        >
          {/* Quick Filter Bar */}
          <div className="px-3 py-2 border-b border-[#243444]/60 bg-[#111822]/60 flex items-center justify-between gap-2 shrink-0">
            <div className="relative flex-1">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9BA9B8]" />
              <input
                type="text"
                placeholder="Suodata taulukkoa..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full text-xs pl-7 pr-3 py-1 bg-[#16202A] border border-[#243444] rounded-[6px] text-[#F2F5F7] placeholder-[#6C7D8F] focus:outline-none focus:border-[#4DA3FF]"
              />
            </div>
            <button
              type="button"
              onClick={() => toggleSort('delay')}
              className="text-xs px-2 py-1 rounded-[6px] border border-[#243444] hover:bg-[#1C2836] text-[#9BA9B8] flex items-center gap-1 shrink-0 font-medium transition-colors"
              title="Järjestä viiveen mukaan"
            >
              <ArrowUpDown size={12} />
              <span>Järjestä</span>
            </button>
          </div>

          {/* Data Table with exact columns: Juna, Reitti, Arvio, Tila */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#16202A] border-b border-[#243444] z-10 text-[11px] font-semibold text-[#9BA9B8] uppercase tracking-wider">
                <tr>
                  <th scope="col" className="py-2 px-3">{t.colTrain}</th>
                  <th scope="col" className="py-2 px-3">{t.colRoute}</th>
                  <th scope="col" className="py-2 px-3 font-mono">{t.colEstimate}</th>
                  <th scope="col" className="py-2 px-3 text-right">{t.colStatus}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrains.map((train) => {
                  const isSelected = selectedTrainId === train.id;

                  return (
                    <FtTableRow
                      key={train.id}
                      isSelected={isSelected}
                      onClick={() => onSelectTrain(train)}
                      ariaLabel={`Juna ${train.number}, reitti ${train.route}, tila ${train.status}`}
                    >
                      {/* Column 1: Juna */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#F2F5F7]">
                            {train.number}
                          </span>
                          <span className="text-[10px] px-1 py-0.2 rounded font-mono bg-[#243444] text-[#9BA9B8]">
                            {train.type}
                          </span>
                        </div>
                      </td>

                      {/* Column 2: Reitti */}
                      <td className="py-2.5 px-3">
                        <div className="truncate max-w-[130px] text-[#F2F5F7] font-medium">
                          {train.route}
                        </div>
                        <div className="text-[11px] text-[#9BA9B8] truncate">
                          {train.currentStation}
                        </div>
                      </td>

                      {/* Column 3: Arvio */}
                      <td className="py-2.5 px-3 font-mono tabular-nums whitespace-nowrap">
                        <div className="text-[#F2F5F7] font-medium">
                          {train.estimatedTime}
                        </div>
                        {!isLive && (
                          <div className="text-[10px] text-[#9BA9B8]">
                            Aikataulu: {train.scheduledTime}
                          </div>
                        )}
                      </td>

                      {/* Column 4: Tila (Always icon + text, never color alone) */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <FtStatusBadge {...trainStatus(train, language)} size="sm" />
                      </td>
                    </FtTableRow>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Panel Content: Asemat (Stations) */}
      {activeTab === 'stations' && (
        <div
          className="flex-1 flex flex-col min-h-0 overflow-y-auto"
        >
          <div className="p-3 border-b border-[#243444]/60 bg-[#111822]/40 text-xs text-[#9BA9B8]">
            {isLive
              ? language === 'fi' ? 'Asemat (Digitraffic-metatiedot). Junamäärä ja viiveindeksi vain koulutusskenaariossa.' : 'Stations (Digitraffic metadata). Train count and delay index exist only in the training scenario.'
              : language === 'fi' ? 'Asemakapasiteetti ja ratapihan viiveindeksi (simuloitu)' : 'Station capacity and yard delay index (simulated)'}
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-[#16202A] border-b border-[#243444] z-10 text-[11px] font-semibold text-[#9BA9B8] uppercase tracking-wider">
              <tr>
                <th scope="col" className="py-2 px-3">Asema</th>
                <th scope="col" className="py-2 px-3 font-mono text-center">{t.trackCount}</th>
                <th scope="col" className="py-2 px-3 font-mono text-center">Junia</th>
                <th scope="col" className="py-2 px-3 text-right">{t.delayIndex}</th>
              </tr>
            </thead>
            <tbody>
              {stations.map((st) => {
                const isSelected = selectedStationId === st.id;
                return (
                  <FtTableRow
                    key={st.id}
                    isSelected={isSelected}
                    onClick={() => onSelectStation(st)}
                    ariaLabel={`Asema ${st.name}, ${st.tracks} raidetta`}
                  >
                    <td className="py-2.5 px-3 font-medium text-[#F2F5F7]">
                      <div className="flex items-center gap-1.5">
                        <Building2 size={13} className="text-[#80BDFF]" />
                        <span>{st.name}</span>
                        {st.isDelayHub && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-[#F0A030]/20 text-[#F0A030]">
                            Solmu
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-center text-[#9BA9B8]">
                      {st.tracks}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-center text-[#F2F5F7]">
                      {isLive ? '—' : st.activeTrainsCount}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {isLive ? <span className="text-[11px] text-[#B6C2CF]">{language === 'fi' ? 'Ei saatavilla' : 'Unavailable'}</span> : <span
                        className={`font-mono text-xs font-bold px-2 py-0.5 rounded-[4px] ${
                          st.delayIndex > 50
                            ? 'bg-[#F25555]/15 text-[#FF8080]'
                            : st.delayIndex > 20
                            ? 'bg-[#F0A030]/15 text-[#F0A030]'
                            : 'bg-[#3FB950]/15 text-[#3FB950]'
                        }`}
                      >
                        {st.delayIndex} / 100
                      </span>}
                    </td>
                  </FtTableRow>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Panel Content: Häiriöt (Disturbances) */}
      {activeTab === 'disturbances' && (
        <div
          className="flex-1 p-3 flex flex-col gap-2.5 min-h-0 overflow-y-auto"
        >
          {disturbances.length === 0 && (
            <p className="text-xs text-[#B6C2CF] p-2">
              {isLive
                ? language === 'fi' ? 'Live-tilassa ei ole kytketty häiriötietolähdettä. Häiriöitä ei keksitä.' : 'No disruption feed is connected in live mode. Disruptions are not invented.'
                : language === 'fi' ? 'Ei häiriöitä.' : 'No disruptions.'}
            </p>
          )}
          {disturbances.map((dist) => (
            <div
              key={dist.id}
              className="p-3 rounded-[8px] bg-[#0E141B] border border-[#243444] flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#F2F5F7] flex items-center gap-1.5">
                  <ShieldAlert size={14} className={dist.severity === 'high' ? 'text-[#FF8080]' : 'text-[#F0A030]'} />
                  <span>{dist.section}</span>
                </span>
                <span className="text-[11px] font-mono text-[#9BA9B8]">
                  {dist.timestamp}
                </span>
              </div>
              <p className="text-xs text-[#9BA9B8] leading-relaxed">
                {dist.cause}
              </p>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#243444]/60 font-mono">
                <span className="text-[#F0A030]">Arvioitu viive: +{dist.impactMinutes} min</span>
                <span className="text-[#80BDFF] uppercase">{dist.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      </FtTabs>
    </aside>
  );
};
