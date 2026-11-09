import { Station, TrackLine, Train, AlertCardItem, DisturbanceReport, ViewMode, Language, TrafficTab } from '../types';
import { pointAlong } from '../geo/network';
import { project } from '../geo/projection';
import { STATIONS, TRACK_LINES, INITIAL_TRAINS, INITIAL_ALERTS, DISTURBANCES } from '../data/railData';

/**
 * RailStore: a small reactive store built on the platform's EventTarget.
 * Components subscribe to the 'state-changed' event (see App.tsx).
 *
 * Data provenance is explicit:
 *  - 'scenario'   simulated training data (bundled), clearly labelled
 *  - 'connecting' live mode selected, first response not yet received
 *  - 'live'       verified Digitraffic train-locations data, < STALE_AFTER_MS old
 *  - 'stale'      last good live data is older than STALE_AFTER_MS (timestamp shown)
 *  - 'offline'    live mode selected but no data could be fetched; nothing is substituted
 * Live mode never falls back to scenario data silently.
 */
export type DataSourceMode = 'scenario' | 'live';
export type DataState = 'scenario' | 'connecting' | 'live' | 'stale' | 'offline';

export const STALE_AFTER_MS = 60_000;
const POLL_MS = 15_000;
const LIVE_API = 'https://rata.digitraffic.fi/api/v1/train-locations/latest';

class RailStore extends EventTarget {
  private trains: Train[] = [...INITIAL_TRAINS];
  private liveTrains: Train[] = [];
  private stations: Station[] = [...STATIONS];
  private tracks: TrackLine[] = [...TRACK_LINES];
  private alerts: AlertCardItem[] = [...INITIAL_ALERTS];
  private disturbances: DisturbanceReport[] = [...DISTURBANCES];

  private liveStations: Station[] = STATIONS.map((s) => ({ ...s, isDelayHub: false, delayIndex: 0, activeTrainsCount: 0 }));
  private liveTracks: TrackLine[] = TRACK_LINES.map((t) => ({ ...t, status: 'normal' as const }));

  private dataSourceMode: DataSourceMode = 'scenario';
  /** Epoch ms of the last successful live fetch (0 = never). */
  private lastLiveSuccess = 0;
  /** Newest GPS timestamp contained in the last live response (ISO). */
  private lastGpsTimestamp: string | null = null;
  private liveError: string | null = null;
  private liveFetching = false;
  private livePollTimer: number | null = null;
  private staleTimer: number | null = null;

  private viewMode: ViewMode = '2D';
  private focusMode: boolean = false;
  private reducedMotion: boolean = false;
  private language: Language = 'fi';
  private activeTab: TrafficTab = 'delays';

  private selectedTrainId: string | null = 'ic-27';
  private selectedStationId: string | null = 'TPE';
  private selectedAlertId: string | null = 'alert-1';

  private replayMinutes: number = 0; // -60 to +30 (0 is current time / "Nyt")
  private isReplayPlaying: boolean = false;
  private replayTimer: number | null = null;
  private toastMessage: string | null = null;

  constructor() {
    super();
    // Check user's OS preference for reduced motion
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.reducedMotion = mediaQuery.matches;
    }
  }

  // --- Getters ---
  getDataState(): DataState {
    if (this.dataSourceMode === 'scenario') return 'scenario';
    if (!this.lastLiveSuccess) return this.liveError ? 'offline' : 'connecting';
    if (Date.now() - this.lastLiveSuccess > STALE_AFTER_MS) return 'stale';
    return 'live';
  }

  getState() {
    const isLive = this.dataSourceMode === 'live';
    return {
      // Live mode shows only live records — never scenario trains, alerts or disruptions.
      trains: isLive ? this.liveTrains : this.trains,
      // Scenario-only overlays (delay hubs, weather/cascade track states) are stripped in live mode.
      stations: isLive ? this.liveStations : this.stations,
      tracks: isLive ? this.liveTracks : this.tracks,
      alerts: isLive ? [] : this.alerts,
      disturbances: isLive ? [] : this.disturbances,
      dataSourceMode: this.dataSourceMode,
      dataState: this.getDataState(),
      lastLiveSuccess: this.lastLiveSuccess,
      lastGpsTimestamp: this.lastGpsTimestamp,
      liveError: this.liveError,
      viewMode: this.viewMode,
      focusMode: this.focusMode,
      reducedMotion: this.reducedMotion,
      language: this.language,
      activeTab: this.activeTab,
      selectedTrainId: this.selectedTrainId,
      selectedStationId: this.selectedStationId,
      selectedAlertId: this.selectedAlertId,
      replayMinutes: this.replayMinutes,
      isReplayPlaying: this.isReplayPlaying,
      toastMessage: this.toastMessage,
    };
  }

  private notify() {
    this.dispatchEvent(new CustomEvent('state-changed', { detail: this.getState() }));
  }

  // --- Actions ---
  setViewMode(mode: ViewMode) {
    this.viewMode = mode;
    this.notify();
  }

  setFocusMode(enabled: boolean) {
    this.focusMode = enabled;
    this.notify();
  }

  setReducedMotion(enabled: boolean) {
    this.reducedMotion = enabled;
    if (typeof document !== 'undefined') {
      if (enabled) {
        document.body.classList.add('reduce-motion');
      } else {
        document.body.classList.remove('reduce-motion');
      }
    }
    this.notify();
  }

  setLanguage(lang: Language) {
    this.language = lang;
    this.notify();
  }

  setActiveTab(tab: TrafficTab) {
    this.activeTab = tab;
    this.notify();
  }

  setSelectedTrain(trainId: string | null) {
    this.selectedTrainId = trainId;
    if (trainId) {
      const train = this.trains.find((t) => t.id === trainId);
      if (train) {
        this.selectedStationId = train.currentStation.includes('Tampere') ? 'TPE' : null;
      }
    }
    this.notify();
  }

  setSelectedStation(stationId: string | null) {
    this.selectedStationId = stationId;
    this.notify();
  }

  setSelectedAlert(alertId: string | null) {
    this.selectedAlertId = alertId;
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      if (alert.trainId) this.selectedTrainId = alert.trainId;
      if (alert.stationId) this.selectedStationId = alert.stationId;
    }
    this.notify();
  }

  /** Training-scenario actions only. They change simulated state, never real operations. */
  executeAlertAction(alertId: string) {
    if (this.dataSourceMode !== 'scenario') return;
    this.alerts = this.alerts.map((alert) => {
      if (alert.id === alertId) {
        return { ...alert, actionDone: true };
      }
      return alert;
    });

    if (alertId === 'alert-1') {
      this.setToast('Harjoitus: S 365 pitoaikaa jatkettu 3 min Tampereella (simuloitu, ei todellinen toimenpide).');
      // Update S 365 delay & notes
      this.trains = this.trains.map((train) => {
        if (train.id === 's-365') {
          return {
            ...train,
            estimatedTime: '14:01',
            operatorNotes: 'Pitoaika vahvistettu. Vaihtoyhteys IC 27:stä varmistettu 42 matkustajalle.',
          };
        }
        return train;
      });
    } else if (alertId === 'alert-2') {
      this.setToast('Harjoitus: korvaavien linja-autojen tilaus kirjattu skenaarioon (simuloitu, ei todellinen tilaus).');
    } else if (alertId === 'alert-3') {
      this.setToast('Harjoitus: nopeusrajoitus merkitty skenaarioon (simuloitu, ei todellinen toimenpide).');
    }

    this.notify();
  }

  setToast(msg: string | null) {
    this.toastMessage = msg;
    this.notify();
    if (msg) {
      setTimeout(() => {
        if (this.toastMessage === msg) {
          this.toastMessage = null;
          this.notify();
        }
      }, 4000);
    }
  }

  // --- Replay Scrubber Controls (-60 min ... 0 ... +30 min) ---
  setReplayMinutes(minutes: number) {
    this.replayMinutes = Math.max(-60, Math.min(30, minutes));
    this.updatePositionsForReplay(this.replayMinutes);
    this.notify();
  }

  toggleReplayPlay() {
    if (this.isReplayPlaying) {
      this.pauseReplay();
    } else {
      this.startReplay();
    }
  }

  private startReplay() {
    this.isReplayPlaying = true;
    this.notify();

    if (this.replayTimer) clearInterval(this.replayTimer);
    this.replayTimer = window.setInterval(() => {
      let next = this.replayMinutes + 2;
      if (next > 30) {
        next = -60;
      }
      this.setReplayMinutes(next);
    }, 400);
  }

  private pauseReplay() {
    this.isReplayPlaying = false;
    if (this.replayTimer) {
      clearInterval(this.replayTimer);
      this.replayTimer = null;
    }
    this.notify();
  }

  private updatePositionsForReplay(minuteOffset: number) {
    // Dynamic position offset based on minute offset to illustrate delay cascade
    this.trains = INITIAL_TRAINS.map((train) => {
      if (train.status === 'cancelled') return train;

      // Adjust delay based on replay time:
      // At -60 min, IC 27 had 0 delay. At -20 min delay accumulated. At +30 min it spreads!
      let delay = train.delayMinutes;
      if (train.id === 'ic-27') {
        if (minuteOffset <= -30) delay = 0;
        else if (minuteOffset < 0) delay = Math.round(12 * ((minuteOffset + 30) / 30));
        else delay = 12 + Math.round(minuteOffset * 0.2);
      } else if (train.id === 's-365') {
        if (minuteOffset <= 0) delay = 3;
        else delay = 3 + Math.round(minuteOffset * 0.3);
      }

      // Small geographic movement along route
      // Move along the real track geometry (approx. 2 km per replay minute)
      let pos = { x: train.x, y: train.y };
      if (train.lineId && train.along !== undefined) {
        const raw = train.travelDir ?? 1;
        pos = pointAlong(train.lineId, train.along + raw * minuteOffset * 0.004);
      }

      return {
        ...train,
        delayMinutes: delay,
        x: pos.x,
        y: pos.y,
      };
    });
  }

  // --- Data source mode (training scenario vs. Digitraffic live) ---
  setDataSourceMode(mode: DataSourceMode) {
    this.dataSourceMode = mode;
    if (mode === 'live') {
      this.pauseReplay();
      this.liveError = null;
      this.fetchLiveDigitrafficData();
      if (!this.livePollTimer) {
        this.livePollTimer = window.setInterval(() => this.fetchLiveDigitrafficData(), POLL_MS);
      }
      // Re-evaluate staleness even when no new response arrives.
      if (!this.staleTimer) {
        this.staleTimer = window.setInterval(() => this.notify(), 5_000);
      }
      this.setToast('Live-tila: haetaan junien GPS-sijainnit Digitraffic-rajapinnasta.');
    } else {
      if (this.livePollTimer) clearInterval(this.livePollTimer);
      if (this.staleTimer) clearInterval(this.staleTimer);
      this.livePollTimer = null;
      this.staleTimer = null;
      this.setToast('Koulutusskenaario: simuloitu data, ei todellisia toimenpiteitä.');
    }
    this.notify();
  }

  retryLive() {
    if (this.dataSourceMode === 'live') this.fetchLiveDigitrafficData();
  }

  /**
   * Fetches real-time GPS positions. Only fields present in the API response are used:
   * trainNumber, departureDate, speed, timestamp, location. Delay, train category,
   * origin/destination and passenger counts are NOT in this API and are shown as unavailable.
   */
  async fetchLiveDigitrafficData() {
    if (this.liveFetching) return;
    this.liveFetching = true;
    try {
      const res = await fetch(LIVE_API, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const locations: Array<{
        trainNumber: number;
        departureDate: string;
        speed: number;
        timestamp: string;
        location: { coordinates: [number, number] }; // [lon, lat]
      }> = await res.json();
      if (!Array.isArray(locations)) throw new Error('Unexpected response');
      if (this.dataSourceMode !== 'live') return;

      let newest = '';
      this.liveTrains = locations
        .filter((loc) => Array.isArray(loc.location?.coordinates))
        .map((loc) => {
          const [lon, lat] = loc.location.coordinates;
          const { x, y } = project(lon, lat);
          if (loc.timestamp > newest) newest = loc.timestamp;

          // Nearest station is derived from the real GPS position (within ~36 km).
          let near: Station | null = null;
          let minDist = 3;
          this.stations.forEach((st) => {
            const d = Math.hypot(st.x - x, st.y - y);
            if (d < minDist) { minDist = d; near = st; }
          });
          const nearName = near ? `lähellä: ${(near as Station).name}` : 'Rataosuudella';
          const fix = new Date(loc.timestamp).toLocaleTimeString('fi-FI');

          return {
            id: `live-${loc.departureDate}-${loc.trainNumber}`,
            type: 'GPS' as const,
            number: `${loc.trainNumber}`,
            route: `Juna ${loc.trainNumber} · ${loc.departureDate}`,
            origin: '—',
            destination: '—',
            scheduledTime: '—',
            estimatedTime: loc.speed > 0 ? `${loc.speed} km/h` : 'Pysähdyksissä',
            delayMinutes: null,
            status: 'on_time' as const,
            currentStation: nearName,
            nextStation: '—',
            speedKmH: loc.speed,
            passengers: null,
            progressPercent: 0,
            x,
            y,
            headingDeg: 180,
            source: 'live' as const,
            gpsTimestamp: loc.timestamp,
            operatorNotes: `GPS-sijainti Digitraffic-rajapinnasta, aikaleima ${fix}. Viive-, reitti- ja matkustajatietoja ei ole tässä rajapinnassa.`,
          } satisfies Train;
        });

      this.lastLiveSuccess = Date.now();
      this.lastGpsTimestamp = newest || null;
      this.liveError = null;
      this.notify();
    } catch (err) {
      // No silent fallback: keep last good live data (shown as stale) or show offline.
      this.liveError = err instanceof Error ? err.message : String(err);
      console.warn('Digitraffic fetch failed:', err);
      this.notify();
    } finally {
      this.liveFetching = false;
    }
  }
}

export const railStore = new RailStore();
