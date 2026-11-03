import { Station, TrackLine, Train, AlertCardItem, DisturbanceReport, ViewMode, Language, TrafficTab } from '../types';
import { STATIONS, TRACK_LINES, INITIAL_TRAINS, INITIAL_ALERTS, DISTURBANCES } from '../data/railData';

/**
 * RailStore: Lightweight EventTarget reactive store
 * Standards-based, zero-heavy-framework state container.
 */
export type DataSourceMode = 'scenario' | 'live';

class RailStore extends EventTarget {
  private trains: Train[] = [...INITIAL_TRAINS];
  private liveTrains: Train[] = [];
  private stations: Station[] = [...STATIONS];
  private tracks: TrackLine[] = [...TRACK_LINES];
  private alerts: AlertCardItem[] = [...INITIAL_ALERTS];
  private disturbances: DisturbanceReport[] = [...DISTURBANCES];

  private dataSourceMode: DataSourceMode = 'scenario'; // 'scenario' | 'live'
  private lastSyncTime: string = '';
  private livePollTimer: number | null = null;

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
  getState() {
    return {
      trains: this.dataSourceMode === 'live' && this.liveTrains.length > 0 ? this.liveTrains : this.trains,
      stations: this.stations,
      tracks: this.tracks,
      alerts: this.alerts,
      disturbances: this.disturbances,
      dataSourceMode: this.dataSourceMode,
      lastSyncTime: this.lastSyncTime,
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

  executeAlertAction(alertId: string) {
    this.alerts = this.alerts.map((alert) => {
      if (alert.id === alertId) {
        return { ...alert, actionDone: true };
      }
      return alert;
    });

    if (alertId === 'alert-1') {
      this.setToast('Toimenpide hyväksytty: S 365 pitoaikaa jatkettu 3 min Tampereella.');
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
      this.setToast('Korvaavat linja-autot (2 kpl) tilattu Salon asemalle.');
    } else if (alertId === 'alert-3') {
      this.setToast('Pohjanmaan radan talvinopeusrajoitus (140 km/h) aktivoitu.');
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
      const movementDelta = (minuteOffset * 0.05);
      const newY = Math.max(15, Math.min(92, train.y + (train.headingDeg > 180 ? movementDelta : -movementDelta)));

      return {
        ...train,
        delayMinutes: delay,
        y: newY,
      };
    });
  }

  // --- Data Source Mode (Scenario vs Real Live Digitraffic API) ---
  setDataSourceMode(mode: DataSourceMode) {
    this.dataSourceMode = mode;
    if (mode === 'live') {
      this.fetchLiveDigitrafficData();
      if (!this.livePollTimer) {
        // Poll every 15 seconds
        this.livePollTimer = window.setInterval(() => {
          if (this.dataSourceMode === 'live') {
            this.fetchLiveDigitrafficData();
          }
        }, 15000);
      }
      this.setToast('Yhdistetty Fintraffic Digitraffic API:in. Ladataan reaaliaikaiset GPS-sijainnit...');
    } else {
      if (this.livePollTimer) {
        clearInterval(this.livePollTimer);
        this.livePollTimer = null;
      }
      this.setToast('Koulutusskenaario aktivoitu: IC 27 & Tampereen viiveketju.');
    }
    this.notify();
  }

  // --- Real Digitraffic Open API Fetcher ---
  async fetchLiveDigitrafficData() {
    try {
      // 1. Fetch real-time GPS locations of all active trains in Finland
      const res = await fetch('https://rata.digitraffic.fi/api/v1/train-locations/latest', {
        headers: { 'Accept': 'application/json' },
      });

      if (!res.ok) throw new Error('Digitraffic API error');

      const locations: Array<{
        trainNumber: number;
        speed: number;
        timestamp: string;
        location: { coordinates: [number, number] }; // [lon, lat]
      }> = await res.json();

      if (Array.isArray(locations) && locations.length > 0) {
        // Map raw GPS [lon, lat] to Finland screen coordinates (0..100)
        // Finland GPS bounds: Lon ~21.0 to 30.5, Lat ~60.0 to 67.5
        const parsedLiveTrains: Train[] = locations
          .filter((loc) => loc.location?.coordinates && loc.speed >= 0)
          .slice(0, 35) // Take top active trains
          .map((loc, idx) => {
            const [lon, lat] = loc.location.coordinates;
            // GPS projection math:
            const x = Math.max(15, Math.min(85, ((lon - 21.0) / 9.5) * 65 + 18));
            const y = Math.max(15, Math.min(92, 90 - ((lat - 60.0) / 7.5) * 72));

            const trainNum = loc.trainNumber;
            let type: 'IC' | 'S' | 'HDM' | 'T' = 'IC';
            let prefix = 'IC';
            if (trainNum < 70) {
              type = 'IC';
              prefix = 'IC';
            } else if (trainNum < 150) {
              type = 'S';
              prefix = 'S';
            } else if (trainNum < 1000) {
              type = 'HDM';
              prefix = 'HL';
            } else {
              type = 'T';
              prefix = 'T';
            }

            // Estimate nearest station
            let nearestStation = 'Rataosuudella';
            let minDist = 999;
            this.stations.forEach((st) => {
              const d = Math.hypot(st.x - x, st.y - y);
              if (d < minDist && d < 12) {
                minDist = d;
                nearestStation = `${st.name} alueella`;
              }
            });

            return {
              id: `live-${trainNum}`,
              type,
              number: `${prefix} ${trainNum}`,
              route: `Juna ${trainNum} (GPS Live)`,
              origin: 'Fintraffic',
              destination: nearestStation,
              scheduledTime: 'Reaaliaika',
              estimatedTime: loc.speed > 0 ? `${loc.speed} km/h` : 'Pysähdyksissä',
              delayMinutes: loc.speed < 40 && loc.speed > 0 ? 5 : 0,
              status: 'on_time' as const,
              currentStation: nearestStation,
              nextStation: '-',
              speedKmH: loc.speed,
              passengers: type === 'T' ? 0 : Math.round(100 + (trainNum % 250)),
              progressPercent: 50,
              x,
              y,
              headingDeg: 180,
              operatorNotes: `Reaaliaikainen GPS-signaali vastaanotettu: ${new Date(loc.timestamp).toLocaleTimeString('fi-FI')}. Tarkkuus normaali.`
            };
          });

        this.liveTrains = parsedLiveTrains;
        this.lastSyncTime = new Date().toLocaleTimeString('fi-FI');
        this.setToast(`Digitraffic API: ${parsedLiveTrains.length} reaaliaikaista junaa päivitetty.`);
        this.notify();
      }
    } catch (err) {
      console.warn('Digitraffic API fetch failed, maintaining scenario:', err);
    }
  }
}

export const railStore = new RailStore();
