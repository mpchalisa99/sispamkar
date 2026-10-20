import { FireHotspot, LanudBase, ThreatLevel, BaseThreatSummary } from '../types';

const EARTH_RADIUS_KM = 6371;

/**
 * Calculates great-circle distance between two GPS coordinates using Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) *
      Math.cos(degreesToRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_KM * c * 100) / 100; // rounded to 2 decimals
}

/**
 * Calculates initial compass bearing in degrees (0° to 360°) from point 1 to point 2
 */
export function calculateBearingDeg(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const phi1 = degreesToRadians(lat1);
  const phi2 = degreesToRadians(lat2);
  const deltaLambda = degreesToRadians(lon2 - lon1);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const theta = Math.atan2(y, x);
  const bearing = (radiansToDegrees(theta) + 360) % 360;
  return Math.round(bearing);
}

export function degreesToRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radiansToDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function getCompassDirection(bearingDeg: number): string {
  const directions = [
    { label: 'U (Utara)', min: 337.5, max: 360 },
    { label: 'U (Utara)', min: 0, max: 22.5 },
    { label: 'TL (Timur Laut)', min: 22.5, max: 67.5 },
    { label: 'T (Timur)', min: 67.5, max: 112.5 },
    { label: 'TG (Tenggara)', min: 112.5, max: 157.5 },
    { label: 'S (Selatan)', min: 157.5, max: 202.5 },
    { label: 'BD (Barat Daya)', min: 202.5, max: 247.5 },
    { label: 'B (Barat)', min: 247.5, max: 292.5 },
    { label: 'BL (Barat Laut)', min: 292.5, max: 337.5 },
  ];

  const match = directions.find(
    (d) => bearingDeg >= d.min && bearingDeg < d.max
  );
  return match ? match.label : 'U (Utara)';
}

/**
 * Classifies a distance into threat levels according to Air Force perimeter rules:
 * - CRITICAL / BAHAYA (Red): <= dangerRadiusKm (default 5km) or high FRP <= 8km
 * - WARNING / WASPADA (Amber): dangerRadiusKm to warningRadiusKm (default 5-15km)
 * - ADVISORY / SIAGA (Blue): warningRadiusKm to advisoryRadiusKm (default 15-30km)
 * - SAFE / AMAN: > advisoryRadiusKm
 */
export function getThreatLevel(
  distanceKm: number,
  frpMw: number,
  dangerRadiusKm: number = 5,
  warningRadiusKm: number = 15,
  advisoryRadiusKm: number = 30
): ThreatLevel {
  if (distanceKm <= dangerRadiusKm || (distanceKm <= dangerRadiusKm * 1.6 && frpMw >= 25)) {
    return 'CRITICAL';
  }
  if (distanceKm <= warningRadiusKm) {
    return 'WARNING';
  }
  if (distanceKm <= advisoryRadiusKm) {
    return 'ADVISORY';
  }
  return 'SAFE';
}

/**
 * Computes threat summaries for each Lanud / Obvit against all detected hotspots
 */
export function evaluateBaseThreats(
  bases: LanudBase[],
  hotspots: FireHotspot[],
  dangerRadiusKm: number = 5,
  warningRadiusKm: number = 15,
  advisoryRadiusKm: number = 30
): BaseThreatSummary[] {
  return bases.map((base) => {
    // Find all hotspots within advisory radius
    const nearbyHotspotsWithDist = hotspots
      .map((h) => {
        const dist = calculateDistanceKm(base.lat, base.lon, h.latitude, h.longitude);
        return {
          ...h,
          distanceKm: dist,
          bearingDeg: calculateBearingDeg(base.lat, base.lon, h.latitude, h.longitude),
          nearestBase: base,
          threatLevel: getThreatLevel(dist, h.frp, dangerRadiusKm, warningRadiusKm, advisoryRadiusKm),
        };
      })
      .filter((h) => h.distanceKm! <= advisoryRadiusKm)
      .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

    const criticalCount = nearbyHotspotsWithDist.filter(
      (h) => h.threatLevel === 'CRITICAL'
    ).length;
    const warningCount = nearbyHotspotsWithDist.filter(
      (h) => h.threatLevel === 'WARNING'
    ).length;
    const advisoryCount = nearbyHotspotsWithDist.filter(
      (h) => h.threatLevel === 'ADVISORY'
    ).length;

    let overallThreat: ThreatLevel = 'SAFE';
    if (criticalCount > 0) {
      overallThreat = 'CRITICAL';
    } else if (warningCount > 0) {
      overallThreat = 'WARNING';
    } else if (advisoryCount > 0) {
      overallThreat = 'ADVISORY';
    }

    const nearestHotspot = nearbyHotspotsWithDist[0] || undefined;
    const maxFrp = nearbyHotspotsWithDist.reduce(
      (max, h) => Math.max(max, h.frp || 0),
      0
    );
    const peatlandHotspotsCount = nearbyHotspotsWithDist.filter((h) => h.isPeatland).length;

    return {
      base,
      threatLevel: overallThreat,
      totalHotspotsNear: nearbyHotspotsWithDist.length,
      criticalCount,
      warningCount,
      advisoryCount,
      nearestHotspotDistanceKm: nearestHotspot ? nearestHotspot.distanceKm! : null,
      maxFrpMw: maxFrp,
      nearestHotspot,
      recentHotspots: nearbyHotspotsWithDist,
      peatlandHotspotsCount,
    };
  });
}

/**
 * Converts NASA FIRMS UTC date and time into Indonesian Western Time (WIB / UTC+7)
 * e.g., acqDate: "2026-10-19", acqTime: "0421" -> "11:21 WIB"
 */
export function formatFirmsUtcToWib(
  acqDate: string,
  acqTime: string
): {
  wibTime: string;
  wibDate: string;
  fullWibString: string;
} {
  try {
    const rawTime = (acqTime || '0000').trim();
    const padded = rawTime.padStart(4, '0');
    const hoursUtc = parseInt(padded.substring(0, 2), 10) || 0;
    const minsUtc = parseInt(padded.substring(2, 4), 10) || 0;

    const [yearStr, monthStr, dayStr] = (acqDate || '').split('-');
    const year = parseInt(yearStr, 10) || new Date().getUTCFullYear();
    const month = (parseInt(monthStr, 10) || 1) - 1;
    const day = parseInt(dayStr, 10) || 1;

    // Create UTC Date and add 7 hours for WIB
    const dateUtc = new Date(Date.UTC(year, month, day, hoursUtc, minsUtc));
    const wibMs = dateUtc.getTime() + 7 * 60 * 60 * 1000;
    const dateWib = new Date(wibMs);

    const wibHours = String(dateWib.getUTCHours()).padStart(2, '0');
    const wibMins = String(dateWib.getUTCMinutes()).padStart(2, '0');
    const wibYear = dateWib.getUTCFullYear();
    const wibMonth = String(dateWib.getUTCMonth() + 1).padStart(2, '0');
    const wibDay = String(dateWib.getUTCDate()).padStart(2, '0');

    const wibTime = `${wibHours}:${wibMins} WIB`;
    const wibDate = `${wibDay}/${wibMonth}/${wibYear}`;
    return {
      wibTime,
      wibDate,
      fullWibString: `${wibDate} ${wibTime}`,
    };
  } catch {
    return {
      wibTime: `${acqTime} WIB`,
      wibDate: acqDate,
      fullWibString: `${acqDate} ${acqTime} WIB`,
    };
  }
}

/**
 * Formats a JavaScript Date object strictly in Indonesian Western Time (WIB / Asia/Jakarta UTC+7)
 * e.g., "14:25:30 WIB"
 */
export function formatToWib(date: Date | null | undefined): string {
  if (!date) return '- WIB';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date) + ' WIB';
  } catch {
    return date.toLocaleTimeString('id-ID') + ' WIB';
  }
}

/**
 * Formats a JavaScript Date object strictly in Indonesian Western Time (WIB / Asia/Jakarta UTC+7) with Date and Time
 * e.g., "19 Okt 2026, 14:25:30 WIB"
 */
export function formatFullWib(date: Date | null | undefined): string {
  if (!date) return '-';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date) + ' WIB';
  } catch {
    return date.toLocaleString('id-ID') + ' WIB';
  }
}

/**
 * Standard Indonesian Military abbreviation for display on map badges without click
 */
export function getBaseTacticalAbbr(base: LanudBase): string {
  if (base.type.startsWith('Lanud')) {
    return `LANUD ${base.shortCode}`;
  }
  if (base.type === 'Satuan Radar') {
    const num = base.shortCode.replace(/^STR-?/, '');
    return `SATRAD ${num}`;
  }
  if (base.type === 'Depo Pemeliharaan') {
    const num = base.shortCode.replace(/^DPH-?/, '');
    return `DEPOHAR ${num}`;
  }
  if (base.type === 'Kopasgat') {
    if (base.id === 'kopasgat-mako' || base.shortCode === 'MAKO-KPG') {
      return 'MAKO KOPASGAT';
    }
    if (base.shortCode.startsWith('YKO-')) {
      return `YONKO ${base.shortCode.replace('YKO-', '')}`;
    }
    if (base.shortCode.startsWith('DH-')) {
      return `DENHANUD ${base.shortCode.replace('DH-', '')}`;
    }
    if (base.shortCode.startsWith('DM-')) {
      return `DENMATRA ${base.shortCode.replace('DM-', '')}`;
    }
    if (base.shortCode === 'SB-90') {
      return 'SATBRAVO 90';
    }
    return base.shortCode;
  }
  if (base.type === 'Detasemen') {
    return `DET ${base.shortCode.replace(/^DET-?/, '')}`;
  }
  if (base.type === 'Air Weapon Range') {
    return `AWR ${base.shortCode.replace(/^AWR-?/, '')}`;
  }
  if (base.type === 'Satuan Rudal') {
    return `SATRUDAL ${base.shortCode.replace(/^RUDAL-?/, '')}`;
  }
  return base.shortCode;
}


