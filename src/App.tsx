import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { AttentionNowRow } from './components/AttentionNowRow';
import { RailMap } from './components/RailMap';
import { TrafficStatusPanel } from './components/TrafficStatusPanel';
import { TimelineReplay } from './components/TimelineReplay';
import { ShiftSummaryCard } from './components/ShiftSummaryCard';
import { QuickSearchModal } from './components/QuickSearchModal';
import { TrainDetailModal } from './components/TrainDetailModal';
import { ComponentStorybookModal } from './components/ComponentStorybookModal';
import { DataStateBanner } from './components/DataSourceBadge';
import { railStore } from './store/railStore';
import { Train, Station, AlertCardItem, ViewMode, Language, TrafficTab } from './types';
import { CheckCircle2, Layers } from 'lucide-react';

export default function App() {
  const [state, setState] = useState(railStore.getState());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isStorybookOpen, setIsStorybookOpen] = useState(false);
  const [inspectTrain, setInspectTrain] = useState<Train | null>(null);

  useEffect(() => {
    const handleStateChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setState(customEvent.detail);
    };

    railStore.addEventListener('state-changed', handleStateChange);
    // Global Ctrl/⌘+K toggles quick search
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    // The app starts in the training scenario; live data is fetched only after the user selects live mode.

    return () => {
      railStore.removeEventListener('state-changed', handleStateChange);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  // Keep an already-open detail dialog in sync with live data (never auto-open on load)
  useEffect(() => {
    setInspectTrain((cur) => (cur ? state.trains.find((t) => t.id === cur.id) ?? cur : cur));
  }, [state.trains]);

  // Keep <html lang> in sync with the UI language (WCAG 3.1.1)
  useEffect(() => {
    document.documentElement.lang = state.language;
  }, [state.language]);

  const handleSelectTrain = (train: Train) => {
    railStore.setSelectedTrain(train.id);
    setInspectTrain(train);
  };

  const handleSelectStation = (station: Station) => {
    railStore.setSelectedStation(station.id);
    railStore.setActiveTab('stations');
  };

  const handleSelectAlert = (alert: AlertCardItem) => {
    railStore.setSelectedAlert(alert.id);
    if (alert.trainId) {
      const t = state.trains.find((tr) => tr.id === alert.trainId);
      if (t) setInspectTrain(t);
    }
  };

  return (
    <div className={`w-screen h-screen bg-[#0E141B] text-[#F2F5F7] flex flex-col overflow-hidden font-sans select-none ${state.reducedMotion ? 'reduce-motion' : ''}`}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-3 focus:py-2 focus:rounded-[6px] focus:bg-[#4DA3FF] focus:text-[#0E141B] focus:font-semibold"
      >
        {state.language === 'fi' ? 'Siirry pääsisältöön' : 'Skip to main content'}
      </a>

      {/* 1. Top Bar */}
      <TopBar
        viewMode={state.viewMode}
        onViewModeChange={(m: ViewMode) => railStore.setViewMode(m)}
        dataSourceMode={state.dataSourceMode}
        onDataSourceModeChange={(d) => railStore.setDataSourceMode(d)}
        dataState={state.dataState}
        lastLiveSuccess={state.lastLiveSuccess}
        lastGpsTimestamp={state.lastGpsTimestamp}
        focusMode={state.focusMode}
        onFocusModeChange={(f: boolean) => railStore.setFocusMode(f)}
        reducedMotion={state.reducedMotion}
        onReducedMotionChange={(r: boolean) => railStore.setReducedMotion(r)}
        language={state.language}
        onLanguageChange={(l: Language) => railStore.setLanguage(l)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      <DataStateBanner
        state={state.dataState}
        lastLiveSuccess={state.lastLiveSuccess}
        liveError={state.liveError}
        language={state.language}
        onRetry={() => railStore.retryLive()}
        onSwitchToScenario={() => railStore.setDataSourceMode('scenario')}
      />

      {/* 2. "Huomio nyt" Row (attention now) with 3 ranked alert cards */}
      <AttentionNowRow
        dataState={state.dataState}
        alerts={state.alerts}
        selectedAlertId={state.selectedAlertId}
        onSelectAlert={handleSelectAlert}
        onExecuteAction={(id) => railStore.executeAlertAction(id)}
        language={state.language}
      />

      {/* Main Split View: Left (60%) Map | Right (40%) Traffic Status Panel */}
      <main id="main-content" tabIndex={-1} className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Area (60%): Finland Rail Network Map */}
        <section
          aria-label="Rataverkkokartta"
          className="w-[60%] h-full flex flex-col relative"
        >
          <RailMap
            isLive={state.dataSourceMode === 'live'}
            viewMode={state.viewMode}
            stations={state.stations}
            tracks={state.tracks}
            trains={state.trains}
            selectedTrainId={state.selectedTrainId}
            onSelectTrain={handleSelectTrain}
            selectedStationId={state.selectedStationId}
            onSelectStation={handleSelectStation}
            focusMode={state.focusMode}
            reducedMotion={state.reducedMotion}
            language={state.language}
          />
        </section>

        {/* Right Area (40%): Traffic Status Panel ("Junaliikenteen tilanne") */}
        <section
          aria-label="Junaliikenteen tilannepaneeli"
          className="w-[40%] h-full flex flex-col bg-[#16202A]"
        >
          <TrafficStatusPanel
            isLive={state.dataSourceMode === 'live'}
            activeTab={state.activeTab}
            onTabChange={(tab: TrafficTab) => railStore.setActiveTab(tab)}
            trains={state.trains}
            stations={state.stations}
            disturbances={state.disturbances}
            selectedTrainId={state.selectedTrainId}
            onSelectTrain={handleSelectTrain}
            selectedStationId={state.selectedStationId}
            onSelectStation={handleSelectStation}
            language={state.language}
          />
        </section>
      </main>

      {/* Bottom Bar: Left (60% width) Timeline Replay | Right (40% width) Shift Summary Card */}
      <footer className="h-28 bg-[#16202A] border-t border-[#243444] flex shrink-0 z-20">
        {/* 5. Bottom left: Timeline slider with play button */}
        <div className="w-[60%] h-full border-r border-[#243444]">
          <TimelineReplay
            disabled={state.dataSourceMode === 'live'}
            replayMinutes={state.replayMinutes}
            isPlaying={state.isReplayPlaying}
            onTogglePlay={() => railStore.toggleReplayPlay()}
            onSeek={(mins) => railStore.setReplayMinutes(mins)}
            language={state.language}
          />
        </div>

        {/* 6. Bottom right: "Vuoron yhteenveto" card */}
        <div className="w-[40%] h-full relative">
          <ShiftSummaryCard
            isLive={state.dataSourceMode === 'live'}
            language={state.language}
            trains={state.trains}
            disturbances={state.disturbances}
          />

          {/* Developer / Design System Storybook Trigger */}
          <button
            type="button"
            onClick={() => setIsStorybookOpen(true)}
            className="absolute top-2 right-2.5 p-1 rounded-[4px] hover:bg-[#1C2836] text-[#9BA9B8] hover:text-[#80BDFF] transition-colors text-[10px] font-mono flex items-center gap-1 border border-transparent hover:border-[#243444]"
            title="Avaa Web Components & Design System -dokumentaatio"
          >
            <Layers size={11} />
            <span>Design System</span>
          </button>
        </div>
      </footer>

      {/* Quick Search Modal (Ctrl+K) */}
      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        trains={state.trains}
        stations={state.stations}
        disturbances={state.disturbances}
        onSelectTrain={handleSelectTrain}
        onSelectStation={handleSelectStation}
        language={state.language}
      />

      {/* Detailed Train Diagnostics Modal (when clicking train or alert) */}
      <TrainDetailModal
        train={inspectTrain}
        onClose={() => setInspectTrain(null)}
        onHoldConnection={() => railStore.executeAlertAction('alert-1')}
        isScenario={state.dataSourceMode === 'scenario'}
        language={state.language}
      />

      {/* Storybook / Design System Modal */}
      <ComponentStorybookModal
        isOpen={isStorybookOpen}
        onClose={() => setIsStorybookOpen(false)}
      />

      {/* Operator notifications: live region is always mounted so screen readers announce updates */}
      <div role="status" aria-live="polite" aria-atomic="true" className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50">
        {state.toastMessage && (
          <div className="bg-[#16202A] border border-[#3FB950]/50 text-[#F2F5F7] px-4 py-2.5 rounded-[8px] shadow-2xl flex items-center gap-2.5 text-xs font-medium">
            <CheckCircle2 size={16} className="text-[#3FB950] shrink-0" aria-hidden="true" />
            <span>{state.toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
