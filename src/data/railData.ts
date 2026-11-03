import { Station, TrackLine, Train, AlertCardItem, DisturbanceReport } from '../types';
import { geoStation, ROUTES, toPathD, snapToRoutes, pointAlong } from '../geo/network';

// Map coordinates are ETRS-TM35FIN (EPSG:3067) projected and normalised to map units
// (1 unit = 12 km, see src/geo/projection.ts). Station positions come from Digitraffic
// station metadata, track paths from Digitraffic infra-api geometry (scripts/build-geo.ts).
// Train list, delays and alerts below are EXAMPLE scenario data.

const RAW_STATIONS: Station[] = [
  { id: 'HKI', name: 'Helsinki', code: 'HKI', x: 44, y: 89, tracks: 19, delayIndex: 8, activeTrainsCount: 14 },
  { id: 'TKU', name: 'Turku', code: 'TKU', x: 26, y: 87, tracks: 7, delayIndex: 34, activeTrainsCount: 4 },
  { id: 'TPE', name: 'Tampere', code: 'TPE', x: 41, y: 74, tracks: 8, delayIndex: 68, activeTrainsCount: 9, isDelayHub: true },
  { id: 'JYV', name: 'Jyväskylä', code: 'JYV', x: 55, y: 65, tracks: 5, delayIndex: 14, activeTrainsCount: 5 },
  { id: 'KUO', name: 'Kuopio', code: 'KUO', x: 68, y: 55, tracks: 4, delayIndex: 9, activeTrainsCount: 4 },
  { id: 'OUL', name: 'Oulu', code: 'OUL', x: 46, y: 39, tracks: 6, delayIndex: 82, activeTrainsCount: 7 },
  { id: 'ROI', name: 'Rovaniemi', code: 'ROI', x: 49, y: 20, tracks: 4, delayIndex: 12, activeTrainsCount: 3 },
  // Key supporting network junctions
  { id: 'RI', name: 'Riihimäki', code: 'RI', x: 44, y: 82, tracks: 8, delayIndex: 15, activeTrainsCount: 4 },
  { id: 'LH', name: 'Lahti', code: 'LH', x: 53, y: 80, tracks: 6, delayIndex: 10, activeTrainsCount: 3 },
  { id: 'KV', name: 'Kouvola', code: 'KV', x: 64, y: 81, tracks: 9, delayIndex: 12, activeTrainsCount: 6 },
  { id: 'SK', name: 'Seinäjoki', code: 'SK', x: 38, y: 59, tracks: 7, delayIndex: 42, activeTrainsCount: 5 },
  { id: 'KEM', name: 'Kemi', code: 'KEM', x: 42, y: 28, tracks: 4, delayIndex: 25, activeTrainsCount: 2 },
];

const DIGITRAFFIC_CODE: Record<string, string> = { JYV: 'JY', OUL: 'OL' };
const OLD_POS = new Map(RAW_STATIONS.map((s) => [s.id, { x: s.x, y: s.y }]));

export const STATIONS: Station[] = RAW_STATIONS.map((s) => {
  const g = geoStation(DIGITRAFFIC_CODE[s.id] ?? s.code);
  return g ? { ...s, x: g.x, y: g.y } : s;
});

const RAW_TRACK_LINES: TrackLine[] = [
  // Päärata (Main line: Helsinki -> Riihimäki -> Tampere -> Seinäjoki -> Oulu -> Kemi -> Rovaniemi)
  { id: 'line-hki-ri', name: 'Päärata (HKI-RI)', from: 'HKI', to: 'RI', path: 'M 44 89 L 44 82', isDoubleTrack: true, status: 'normal' },
  { id: 'line-ri-tpe', name: 'Päärata (RI-TPE)', from: 'RI', to: 'TPE', path: 'M 44 82 Q 43 78 41 74', isDoubleTrack: true, status: 'delay_cascade' },
  { id: 'line-tpe-sk', name: 'Pohjanmaan rata (TPE-SK)', from: 'TPE', to: 'SK', path: 'M 41 74 Q 39 67 38 59', isDoubleTrack: true, status: 'delay_cascade' },
  { id: 'line-sk-oul', name: 'Pohjanmaan rata (SK-OUL)', from: 'SK', to: 'OUL', path: 'M 38 59 Q 42 49 46 39', isDoubleTrack: false, status: 'weather_alert' },
  { id: 'line-oul-kem', name: 'Perämeren rata (OUL-KEM)', from: 'OUL', to: 'KEM', path: 'M 46 39 L 42 28', isDoubleTrack: false, status: 'weather_alert' },
  { id: 'line-kem-roi', name: 'Lapin rata (KEM-ROI)', from: 'KEM', to: 'ROI', path: 'M 42 28 Q 45 24 49 20', isDoubleTrack: false, status: 'normal' },

  // Rantarata (Helsinki - Turku)
  { id: 'line-hki-tku', name: 'Rantarata (HKI-TKU)', from: 'HKI', to: 'TKU', path: 'M 44 89 Q 34 89 26 87', isDoubleTrack: false, status: 'delay_cascade' },
  // Turku - Toijala/Tampere
  { id: 'line-tku-tpe', name: 'Turku - Tampere', from: 'TKU', to: 'TPE', path: 'M 26 87 Q 33 80 41 74', isDoubleTrack: false, status: 'normal' },

  // Tampere - Jyväskylä
  { id: 'line-tpe-jyv', name: 'Tampere - Jyväskylä', from: 'TPE', to: 'JYV', path: 'M 41 74 Q 48 70 55 65', isDoubleTrack: false, status: 'delay_cascade' },
  // Jyväskylä - Kuopio
  { id: 'line-jyv-kuo', name: 'Jyväskylä - Kuopio', from: 'JYV', to: 'KUO', path: 'M 55 65 Q 61 60 68 55', isDoubleTrack: false, status: 'normal' },
  // Jyväskylä - Seinäjoki
  { id: 'line-jyv-sk', name: 'Jyväskylä - Seinäjoki', from: 'JYV', to: 'SK', path: 'M 55 65 L 38 59', isDoubleTrack: false, status: 'normal' },

  // Savo & Karjala lines
  { id: 'line-ri-lh', name: 'Riihimäki - Lahti', from: 'RI', to: 'LH', path: 'M 44 82 L 53 80', isDoubleTrack: true, status: 'normal' },
  { id: 'line-lh-kv', name: 'Lahti – Kouvola', from: 'LH', to: 'KV', path: 'M 53 80 L 64 81', isDoubleTrack: true, status: 'normal' },
  { id: 'line-kv-kuo', name: 'Savon rata (KV-KUO)', from: 'KV', to: 'KUO', path: 'M 64 81 Q 66 68 68 55', isDoubleTrack: false, status: 'normal' },
  { id: 'line-kuo-oul', name: 'Kuopio - Oulu', from: 'KUO', to: 'OUL', path: 'M 68 55 Q 58 46 46 39', isDoubleTrack: false, status: 'weather_alert' },
];

export const TRACK_LINES: TrackLine[] = RAW_TRACK_LINES.map((l) =>
  ROUTES[l.id] ? { ...l, path: toPathD(ROUTES[l.id]) } : l,
);

// Least-squares affine fit from the old schematic coordinates to real projected ones,
// used once to place the example trains, which are then snapped onto real track.
const affine = (() => {
  const pairs = STATIONS.map((s) => [OLD_POS.get(s.id)!, s] as const);
  const solve = (key: 'x' | 'y') => {
    // normal equations for v = a*x + b*y + c
    const M = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; const r = [0, 0, 0];
    pairs.forEach(([o, n]) => { const v = [o.x, o.y, 1]; for (let i = 0; i < 3; i++) { r[i] += v[i] * n[key]; for (let j = 0; j < 3; j++) M[i][j] += v[i] * v[j]; } });
    for (let i = 0; i < 3; i++) for (let k = i + 1; k < 3; k++) { const f = M[k][i] / M[i][i]; for (let j = 0; j < 3; j++) M[k][j] -= f * M[i][j]; r[k] -= f * r[i]; }
    const c = [0, 0, 0]; for (let i = 2; i >= 0; i--) { c[i] = (r[i] - M[i].slice(i + 1).reduce((s, m, j) => s + m * c[i + 1 + j], 0)) / M[i][i]; }
    return c;
  };
  const cx = solve('x'), cy = solve('y');
  return (x: number, y: number) => ({ x: cx[0] * x + cx[1] * y + cx[2], y: cy[0] * x + cy[1] * y + cy[2] });
})();

const RAW_TRAINS: Train[] = [
  {
    id: 'ic-27',
    type: 'IC',
    number: 'IC 27',
    route: 'Helsinki → Oulu',
    origin: 'Helsinki',
    destination: 'Oulu',
    scheduledTime: '13:42',
    estimatedTime: '13:54',
    delayMinutes: 12,
    status: 'delayed',
    currentStation: 'Tampere etelä',
    nextStation: 'Tampere',
    speedKmH: 148,
    passengers: 382,
    progressPercent: 32,
    x: 41.5,
    y: 77.2,
    headingDeg: 350,
    connectingTrains: ['S 365', 'HDM 324'],
    operatorNotes: 'Kulunvalvontahäiriö Hämeenlinnassa aiheutti 12 min myöhästymisen. Lähestyy Tamperetta raiteelle 3.'
  },
  {
    id: 'ic-35',
    type: 'IC',
    number: 'IC 35',
    route: 'Helsinki → Turku',
    origin: 'Helsinki',
    destination: 'Turku',
    scheduledTime: '13:30',
    estimatedTime: 'Peruttu',
    delayMinutes: 0,
    status: 'cancelled',
    currentStation: 'Peruttu (Salo)',
    nextStation: '-',
    speedKmH: 0,
    passengers: 240,
    progressPercent: 0,
    x: 35,
    y: 88,
    headingDeg: 260,
    operatorNotes: 'Vaihdevika Salon ratapihalla esti kulkutien. 240 matkustajaa ohjataan korvaaviin busseihin.'
  },
  {
    id: 's-365',
    type: 'S',
    number: 'S 365',
    route: 'Tampere → Vaasa',
    origin: 'Tampere',
    destination: 'Vaasa',
    scheduledTime: '13:55',
    estimatedTime: '13:58',
    delayMinutes: 3,
    status: 'delayed',
    currentStation: 'Tampere (Raide 4)',
    nextStation: 'Parkano',
    speedKmH: 0,
    passengers: 195,
    progressPercent: 0,
    x: 41,
    y: 73.8,
    headingDeg: 320,
    connectingTrains: ['IC 27'],
    operatorNotes: 'Odottaa vaihtoyhteyttä IC 27:stä. Suositeltu pito 3 min yhteyden turvaamiseksi.'
  },
  {
    id: 's-53',
    type: 'S',
    number: 'S 53',
    route: 'Helsinki → Oulu',
    origin: 'Helsinki',
    destination: 'Oulu',
    scheduledTime: '11:15',
    estimatedTime: '14:24',
    delayMinutes: 24,
    status: 'delayed',
    currentStation: 'Ylivieska',
    nextStation: 'Oulu',
    speedKmH: 128,
    passengers: 310,
    progressPercent: 78,
    x: 43.5,
    y: 45.2,
    headingDeg: 25,
    operatorNotes: 'Voimakas lumipyry Pohjanmaan radalla. Nopeus alennettu 140 km/h:iin turvallisuussyistä.'
  },
  {
    id: 'ic-47',
    type: 'IC',
    number: 'IC 47',
    route: 'Helsinki → Jyväskylä',
    origin: 'Helsinki',
    destination: 'Jyväskylä',
    scheduledTime: '14:02',
    estimatedTime: '14:02',
    delayMinutes: 0,
    status: 'on_time',
    currentStation: 'Orivesi',
    nextStation: 'Jämsä',
    speedKmH: 160,
    passengers: 275,
    progressPercent: 55,
    x: 47.8,
    y: 69.4,
    headingDeg: 45,
    operatorNotes: 'Kulkee täysin aikataulussa. Ratakapasiteetti normaali.'
  },
  {
    id: 'ic-63',
    type: 'IC',
    number: 'IC 63',
    route: 'Kouvola → Kuopio',
    origin: 'Kouvola',
    destination: 'Kuopio',
    scheduledTime: '14:10',
    estimatedTime: '14:10',
    delayMinutes: 0,
    status: 'on_time',
    currentStation: 'Mikkeli',
    nextStation: 'Pieksämäki',
    speedKmH: 155,
    passengers: 215,
    progressPercent: 48,
    x: 66,
    y: 66,
    headingDeg: 10,
    operatorNotes: 'Aikataulussa. Kaikki järjestelmät vihreällä.'
  },
  {
    id: 's-4',
    type: 'S',
    number: 'S 4',
    route: 'Oulu → Helsinki',
    origin: 'Oulu',
    destination: 'Helsinki',
    scheduledTime: '14:30',
    estimatedTime: '14:48',
    delayMinutes: 18,
    status: 'delayed',
    currentStation: 'Kokkola',
    nextStation: 'Seinäjoki',
    speedKmH: 135,
    passengers: 290,
    progressPercent: 40,
    x: 40.5,
    y: 52,
    headingDeg: 195,
    operatorNotes: 'Kohtaamisviivästys Ylivieskassa lumisateen vuoksi.'
  },
  {
    id: 'ic-23',
    type: 'IC',
    number: 'IC 23',
    route: 'Oulu → Rovaniemi',
    origin: 'Oulu',
    destination: 'Rovaniemi',
    scheduledTime: '14:45',
    estimatedTime: '14:45',
    delayMinutes: 0,
    status: 'on_time',
    currentStation: 'Kemi',
    nextStation: 'Tervola',
    speedKmH: 140,
    passengers: 180,
    progressPercent: 45,
    x: 44,
    y: 25,
    headingDeg: 35,
    operatorNotes: 'Aikataulussa. Arktinen kalusto toimii moitteetta.'
  },
  {
    id: 'hdm-324',
    type: 'HDM',
    number: 'HDM 324',
    route: 'Tampere → Keuruu',
    origin: 'Tampere',
    destination: 'Keuruu',
    scheduledTime: '14:05',
    estimatedTime: '14:11',
    delayMinutes: 6,
    status: 'delayed',
    currentStation: 'Tampere',
    nextStation: 'Vilppula',
    speedKmH: 0,
    passengers: 64,
    progressPercent: 5,
    x: 42,
    y: 72.5,
    headingDeg: 25,
    connectingTrains: ['IC 27'],
    operatorNotes: 'Odottaa IC 27:n jatkoyhteysmatkustajia.'
  },
  {
    id: 't-5214',
    type: 'T',
    number: 'T 5214',
    route: 'Kemi → Oulu (Rahti)',
    origin: 'Kemi',
    destination: 'Oulu',
    scheduledTime: '13:15',
    estimatedTime: '13:15',
    delayMinutes: 0,
    status: 'on_time',
    currentStation: 'Simo',
    nextStation: 'Ii',
    speedKmH: 95,
    passengers: 0,
    progressPercent: 60,
    x: 44.5,
    y: 33,
    headingDeg: 160,
    operatorNotes: 'Sellutehtaan raakapuukuljetus 3200t. Etuajo-oikeus matkustajajunille voimassa.'
  },
  {
    id: 'ic-168',
    type: 'IC',
    number: 'IC 168',
    route: 'Turku → Helsinki',
    origin: 'Turku',
    destination: 'Helsinki',
    scheduledTime: '13:58',
    estimatedTime: '13:58',
    delayMinutes: 0,
    status: 'on_time',
    currentStation: 'Karjaa',
    nextStation: 'Kirkkonummi',
    speedKmH: 160,
    passengers: 320,
    progressPercent: 68,
    x: 37,
    y: 89,
    headingDeg: 100,
    operatorNotes: 'Kiertää Salon häiriöalueen ajoissa ennen sulkua.'
  },
  {
    id: 't-4012',
    type: 'T',
    number: 'T 4012',
    route: 'Kouvola → Vuosaari (Rahti)',
    origin: 'Kouvola',
    destination: 'Helsinki',
    scheduledTime: '14:20',
    estimatedTime: '14:20',
    delayMinutes: 0,
    status: 'on_time',
    currentStation: 'Lahti',
    nextStation: 'Mäntsälä',
    speedKmH: 100,
    passengers: 0,
    progressPercent: 50,
    x: 49,
    y: 81,
    headingDeg: 240,
    operatorNotes: 'Konttikuljetus satamaan aikataulussa.'
  }
];

export const INITIAL_TRAINS: Train[] = RAW_TRAINS.map((t) => {
  const approx = affine(t.x, t.y);
  const { lineId, t: along } = snapToRoutes(approx.x, approx.y);
  const p = pointAlong(lineId, along);
  const dir = t.headingDeg > 90 && t.headingDeg < 270 ? 1 : -1;
  return { ...t, x: p.x, y: p.y, headingDeg: (p.headingDeg + (dir < 0 ? 180 : 0) + 360) % 360, lineId, along, travelDir: dir };
});

export const INITIAL_ALERTS: AlertCardItem[] = [
  {
    id: 'alert-1',
    rank: 1,
    variant: 'warning',
    iconType: 'amber-clock',
    title: 'IC 27 myöhässä 12 min',
    titleEn: 'IC 27 delayed 12 min',
    impact: '3 vaihtoyhteyttä vaarassa Tampereella',
    impactEn: '3 transfer connections at risk in Tampere',
    suggestedAction: 'Ehdota: pidä S 365 3 min',
    suggestedActionEn: 'Suggest: hold S 365 for 3 min',
    actionDone: false,
    trainId: 'ic-27',
    stationId: 'TPE'
  },
  {
    id: 'alert-2',
    rank: 2,
    variant: 'danger',
    iconType: 'red-x',
    title: 'IC 35 peruttu',
    titleEn: 'IC 35 cancelled',
    impact: 'n. 240 matkustajaa',
    impactEn: 'approx. 240 passengers affected',
    suggestedAction: 'Tilaa korvaavat bussit (2 kpl)',
    suggestedActionEn: 'Dispatch replacement buses (2)',
    actionDone: false,
    trainId: 'ic-35',
    stationId: 'TKU'
  },
  {
    id: 'alert-3',
    rank: 3,
    variant: 'info',
    iconType: 'blue-trend',
    title: 'Oulun radalla myöhästymiset 3× normaalia',
    titleEn: 'Oulu line delays 3× normal average',
    impact: 'Lumisade – FMI',
    impactEn: 'Heavy snowfall – FMI Alert',
    suggestedAction: 'Aseta talvinopeus 140 km/h',
    suggestedActionEn: 'Set winter speed limit 140 km/h',
    actionDone: false,
    trainId: 's-53',
    stationId: 'OUL'
  }
];

export const DISTURBANCES: DisturbanceReport[] = [
  {
    id: 'dist-1',
    section: 'Salo – Piikkiö (Rantarata)',
    cause: 'Vaihdelämmityksen vika & kytkimen lukitusongelma',
    impactMinutes: 65,
    severity: 'high',
    timestamp: '13:12',
    status: 'investigating'
  },
  {
    id: 'dist-2',
    section: 'Ylivieska – Ruukki (Pohjanmaan rata)',
    cause: 'Lumisade ja pöllyävä lumi tukkii vaihteita (FMI)',
    impactMinutes: 25,
    severity: 'medium',
    timestamp: '12:45',
    status: 'active'
  },
  {
    id: 'dist-3',
    section: 'Hämeenlinna – Parola (Päärata)',
    cause: 'Kulunvalvontakojeen lyhytaikainen häiriö (ratkaistu)',
    impactMinutes: 12,
    severity: 'low',
    timestamp: '13:20',
    status: 'resolving'
  }
];

export const TRANSLATIONS = {
  fi: {
    appTitle: 'Junaliikenne Live',
    appSubtitle: 'Rail Traffic Monitor',
    live: 'Live',
    searchPlaceholder: 'Hae junaa, asemaa tai kohdetta…',
    searchHint: 'Ctrl+K',
    twoD: '2D',
    threeD: '3D Elävä kartta',
    focusMode: 'Fokustila',
    reduceMotion: 'Vähennä liikettä',
    langToggle: 'FI / EN',
    huomioNyt: 'Huomio nyt',
    activeAlerts: 'aktiivista häiriötä',
    trafficStatus: 'Junaliikenteen tilanne',
    tabDelays: 'Myöhästymiset',
    tabStations: 'Asemat',
    tabDisturbances: 'Häiriöt',
    colTrain: 'Juna',
    colRoute: 'Reitti',
    colEstimate: 'Arvio',
    colStatus: 'Tila',
    statusOnTime: 'Ajallaan',
    statusCancelled: 'Peruttu',
    dayReplay: 'Päivän replay',
    replayHint: '-60 min … Nyt … +30 min ennuste',
    shiftSummaryTitle: 'Vuoron yhteenveto',
    aiBadge: 'Sääntöpohjainen',
    shiftSummaryText: 'Aamu rauhallinen, kaksi peruutusta Turun radalla.',
    legendTitle: 'Junatyypit',
    intercity: 'InterCity (IC)',
    pendolino: 'Pendolino (S)',
    commuter: 'Taajamajuna (HDM)',
    freight: 'Tavarajuna (T)',
    tampereHubNotice: 'Tampere: viivästysketju leviää jatkoyhteyksiin',
    speed: 'Nopeus',
    passengers: 'Matkustajia',
    nextStation: 'Seuraava asema',
    actionExecuted: 'Toimenpide lähetetty ohjaamolle!',
    busOrdered: 'Korvaavat linja-autot tilattu Salon asemalle.',
    speedLimitSet: 'Pohjanmaan radan talvinopeusrajoitus (140 km/h) aktivoitu.',
    stationArrivals: 'Saapuvat / Lähtevät',
    trackCount: 'Raiteet',
    delayIndex: 'Viiveindeksi',
    close: 'Sulje',
    legend: 'Karttamerkit',
    zoomIn: 'Lähennä',
    zoomOut: 'Loitonna',
    resetView: 'Palauta näkymä',
    locateTampere: 'Keskitä Tampere (viivekeskus)',
    exportShiftReport: 'Luo vuoronvaihtoraportti',
    reportCopied: 'Raportti kopioitu leikepöydälle!'
  },
  en: {
    appTitle: 'Rail Traffic Live',
    appSubtitle: 'Rail Traffic Monitor',
    live: 'Live',
    searchPlaceholder: 'Search train, station or track…',
    searchHint: 'Ctrl+K',
    twoD: '2D',
    threeD: '3D Live Map',
    focusMode: 'Focus Mode',
    reduceMotion: 'Reduce Motion',
    langToggle: 'FI / EN',
    huomioNyt: 'Attention Now',
    activeAlerts: 'active incidents',
    trafficStatus: 'Rail Traffic Overview',
    tabDelays: 'Delays',
    tabStations: 'Stations',
    tabDisturbances: 'Disturbances',
    colTrain: 'Train',
    colRoute: 'Route',
    colEstimate: 'Estimate',
    colStatus: 'Status',
    statusOnTime: 'On Time',
    statusCancelled: 'Cancelled',
    dayReplay: 'Daily Replay',
    replayHint: '-60 min … Now … +30 min forecast',
    shiftSummaryTitle: 'Shift Summary',
    aiBadge: 'Rule-based',
    shiftSummaryText: 'Morning calm, two cancellations on the Turku line.',
    legendTitle: 'Train Classes',
    intercity: 'InterCity (IC)',
    pendolino: 'Pendolino (S)',
    commuter: 'Regional (HDM)',
    freight: 'Freight (T)',
    tampereHubNotice: 'Tampere: delay ripple cascading to connections',
    speed: 'Speed',
    passengers: 'Passengers',
    nextStation: 'Next Station',
    actionExecuted: 'Action dispatched to dispatch console!',
    busOrdered: 'Replacement buses requested for Salo station.',
    speedLimitSet: 'Winter speed limit (140 km/h) enforced on Ostrobothnia corridor.',
    stationArrivals: 'Arrivals / Departures',
    trackCount: 'Tracks',
    delayIndex: 'Delay Index',
    close: 'Close',
    legend: 'Map Legend',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    resetView: 'Reset View',
    locateTampere: 'Center Tampere (Delay Hub)',
    exportShiftReport: 'Generate Handover Report',
    reportCopied: 'Report copied to clipboard!'
  }
};
