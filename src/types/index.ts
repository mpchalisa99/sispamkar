export type KoopsudRegion = 'Koopsud I' | 'Koopsud II' | 'Koopsud III' | 'Mabesau';

export type BaseType =
  | 'Lanud Tipe A'
  | 'Lanud Tipe B'
  | 'Lanud Tipe C'
  | 'Satuan Radar'
  | 'Depo Pemeliharaan'
  | 'Kopasgat'
  | 'Detasemen'
  | 'Satuan Rudal'
  | 'Mabesau / Lemdik'
  | 'Air Weapon Range';

export type ThreatLevel = 'CRITICAL' | 'WARNING' | 'ADVISORY' | 'SAFE';

export interface LanudBase {
  id: string;
  name: string;
  code: string;
  shortCode: string; // Crisp abbreviation without ICAO, e.g. "RSN", "HLM", "STR-234"
  type: BaseType;
  koopsud: KoopsudRegion;
  province: string;
  city: string;
  lat: number;
  lon: number;
  elevationMeters: number;
  runwayOrientation?: string;
  runwayLengthM?: number;
  commander?: string;
  assetsSummary: string;
  puskodalContact: string;
  pkpPkUnits?: string;
}

export type DataSourceProvider = 'FIRMS' | 'GFW' | 'COMBINED';

export interface FireHotspot {
  id: string;
  latitude: number;
  longitude: number;
  bright_ti4: number; // Brightness temperature I-4 (Kelvin)
  scan: number;
  track: number;
  acq_date: string;
  acq_time: string;
  satellite: string;
  instrument: string;
  confidence: 'l' | 'n' | 'h' | string;
  version?: string;
  bright_ti5?: number;
  frp: number; // Fire Radiative Power (MW)
  daynight: 'D' | 'N';
  // Calculated threat attributes relative to nearest TNI AU base:
  nearestBase?: LanudBase;
  distanceKm?: number;
  bearingDeg?: number;
  threatLevel?: ThreatLevel;
  // Global Forest Watch (GFW) & high-precision attributes:
  source?: 'FIRMS' | 'GFW' | 'COMBINED';
  isPeatland?: boolean; // Lahan Gambut (critical for karhutla & airfield smoke visibility)
  countryIso?: string;
  adm1?: number;
  adm2?: number;
}

export interface BaseThreatSummary {
  base: LanudBase;
  threatLevel: ThreatLevel;
  totalHotspotsNear: number;
  criticalCount: number; // < 5 km
  warningCount: number;  // 5 - 15 km
  advisoryCount: number; // 15 - 30 km
  nearestHotspotDistanceKm: number | null;
  maxFrpMw: number;
  nearestHotspot?: FireHotspot;
  recentHotspots: FireHotspot[];
  peatlandHotspotsCount?: number;
}

export interface FilterConfig {
  koopsud: 'ALL' | KoopsudRegion;
  baseType: 'ALL' | BaseType;
  threatLevel: 'ALL' | ThreatLevel;
  satelliteSource: 'VIIRS_SNPP_NRT' | 'VIIRS_NOAA20_NRT' | 'VIIRS_NOAA21_NRT' | 'MODIS_NRT';
  dataSource: DataSourceProvider;
  dangerRadiusKm: number; // Default 5 km
  warningRadiusKm: number; // Default 15 km
  advisoryRadiusKm: number; // Default 30 km
  minFrp: number; // Min MW
  alarmAudioEnabled: boolean;
  searchQuery: string;
  mapKey: string;
  gfwApiKey: string;
  peatlandOnly: boolean;
}
