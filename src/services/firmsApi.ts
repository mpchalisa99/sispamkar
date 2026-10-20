import { FireHotspot } from '../types';

export const DEFAULT_NASA_MAP_KEY = '5fd5ee14c079e4fef3ae7e1c8fc6434a';

// Bounding box for Indonesia: West 95°E, South 11°S, East 141°E, North 6°N
export const INDONESIA_BBOX = '95,-11,141,6';

export type SatelliteSensor = 'VIIRS_SNPP_NRT' | 'VIIRS_NOAA20_NRT' | 'VIIRS_NOAA21_NRT' | 'MODIS_NRT';

interface CacheEntry {
  timestamp: number;
  data: FireHotspot[];
  source: string;
}

const CACHE_KEY_PREFIX = 'tni_au_firms_cache_';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache to preserve mapkey quota

/**
 * Parses CSV string from NASA FIRMS into FireHotspot objects
 */
export function parseFirmsCsv(csvText: string): FireHotspot[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headerLine = lines[0].toLowerCase();
  if (headerLine.includes('invalid') || headerLine.includes('error') || headerLine.includes('<!doctype')) {
    throw new Error(lines[0] || 'Invalid response from NASA FIRMS API');
  }

  const headers = lines[0].split(',').map((h) => h.trim());
  const latIdx = headers.indexOf('latitude');
  const lonIdx = headers.indexOf('longitude');
  const bright4Idx = headers.indexOf('bright_ti4');
  const scanIdx = headers.indexOf('scan');
  const trackIdx = headers.indexOf('track');
  const acqDateIdx = headers.indexOf('acq_date');
  const acqTimeIdx = headers.indexOf('acq_time');
  const satelliteIdx = headers.indexOf('satellite');
  const instrumentIdx = headers.indexOf('instrument');
  const confidenceIdx = headers.indexOf('confidence');
  const frpIdx = headers.indexOf('frp');
  const daynightIdx = headers.indexOf('daynight');
  const bright5Idx = headers.indexOf('bright_ti5');

  if (latIdx === -1 || lonIdx === -1) {
    throw new Error('CSV missing required latitude/longitude headers');
  }

  const hotspots: FireHotspot[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(',');
    const lat = parseFloat(cols[latIdx]);
    const lon = parseFloat(cols[lonIdx]);

    if (isNaN(lat) || isNaN(lon)) continue;

    hotspots.push({
      id: `firms-${i}-${lat.toFixed(4)}-${lon.toFixed(4)}`,
      latitude: lat,
      longitude: lon,
      bright_ti4: bright4Idx !== -1 ? parseFloat(cols[bright4Idx]) || 300 : 300,
      scan: scanIdx !== -1 ? parseFloat(cols[scanIdx]) || 0.4 : 0.4,
      track: trackIdx !== -1 ? parseFloat(cols[trackIdx]) || 0.4 : 0.4,
      acq_date: acqDateIdx !== -1 ? cols[acqDateIdx] : new Date().toISOString().split('T')[0],
      acq_time: acqTimeIdx !== -1 ? cols[acqTimeIdx] : '0000',
      satellite: satelliteIdx !== -1 ? cols[satelliteIdx] : 'VIIRS',
      instrument: instrumentIdx !== -1 ? cols[instrumentIdx] : 'VIIRS',
      confidence: confidenceIdx !== -1 ? cols[confidenceIdx] : 'n',
      frp: frpIdx !== -1 ? parseFloat(cols[frpIdx]) || 0 : 0,
      daynight: daynightIdx !== -1 && cols[daynightIdx]?.toUpperCase() === 'N' ? 'N' : 'D',
      bright_ti5: bright5Idx !== -1 ? parseFloat(cols[bright5Idx]) : undefined,
    });
  }

  return hotspots;
}

/**
 * Fetches active fire hotspots from NASA FIRMS
 */
export async function fetchLiveFirmsData(
  mapKey: string = DEFAULT_NASA_MAP_KEY,
  source: SatelliteSensor = 'VIIRS_SNPP_NRT',
  dayRange: number = 1,
  forceRefresh: boolean = false
): Promise<{ data: FireHotspot[]; isCached: boolean; fetchedAt: Date }> {
  const cacheKey = `${CACHE_KEY_PREFIX}${source}_${dayRange}_${mapKey}`;

  // Check local cache if not force refresh
  if (!forceRefresh) {
    try {
      const cachedStr = localStorage.getItem(cacheKey);
      if (cachedStr) {
        const cached: CacheEntry = JSON.parse(cachedStr);
        if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
          return {
            data: cached.data,
            isCached: true,
            fetchedAt: new Date(cached.timestamp),
          };
        }
      }
    } catch (e) {
      console.warn('Cache read error:', e);
    }
  }

  const cleanKey = mapKey.trim() || DEFAULT_NASA_MAP_KEY;
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${cleanKey}/${source}/${INDONESIA_BBOX}/${dayRange}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'text/csv',
    },
  });

  if (!response.ok) {
    throw new Error(`NASA FIRMS HTTP Error: ${response.status} ${response.statusText}`);
  }

  const csvText = await response.text();
  const hotspots = parseFirmsCsv(csvText);

  // Store in cache
  try {
    const entry: CacheEntry = {
      timestamp: Date.now(),
      data: hotspots,
      source,
    };
    localStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch (e) {
    console.warn('Failed to cache FIRMS data (localStorage quota?):', e);
  }

  return {
    data: hotspots,
    isCached: false,
    fetchedAt: new Date(),
  };
}

