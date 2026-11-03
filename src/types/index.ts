export type TrainType = 'IC' | 'S' | 'HDM' | 'T';

export type TrainStatus = 'on_time' | 'delayed' | 'cancelled';

export interface Station {
  id: string;
  name: string;
  code: string;
  x: number; // map units (EPSG:3067 normalised, 1 unit = 12 km)
  y: number;
  tracks: number;
  delayIndex: number; // 0 - 100
  activeTrainsCount: number;
  isDelayHub?: boolean;
}

export interface TrackLine {
  id: string;
  name: string;
  from: string;
  to: string;
  path: string; // SVG path d
  isDoubleTrack?: boolean;
  status?: 'normal' | 'weather_alert' | 'delay_cascade';
}

export interface Train {
  id: string;
  type: TrainType;
  number: string;
  route: string;
  origin: string;
  destination: string;
  scheduledTime: string;
  estimatedTime: string;
  delayMinutes: number;
  status: TrainStatus;
  currentStation: string;
  nextStation: string;
  speedKmH: number;
  passengers: number;
  progressPercent: number; // 0 - 100 along route
  x: number;
  y: number;
  headingDeg: number;
  /** Scenario route the train runs on and its position (0..1) along it. */
  lineId?: string;
  along?: number;
  travelDir?: 1 | -1;
  connectingTrains?: string[];
  operatorNotes?: string;
}

export interface AlertCardItem {
  id: string;
  rank: number;
  variant: 'warning' | 'danger' | 'info';
  iconType: 'amber-clock' | 'red-x' | 'blue-trend';
  title: string;
  titleEn: string;
  impact: string;
  impactEn: string;
  suggestedAction?: string;
  suggestedActionEn?: string;
  actionDone?: boolean;
  trainId?: string;
  stationId?: string;
}

export interface DisturbanceReport {
  id: string;
  section: string;
  cause: string;
  impactMinutes: number;
  severity: 'high' | 'medium' | 'low';
  timestamp: string;
  status: 'active' | 'investigating' | 'resolving';
}

export type ViewMode = '2D' | '3D';
export type Language = 'fi' | 'en';
export type TrafficTab = 'delays' | 'stations' | 'disturbances';
