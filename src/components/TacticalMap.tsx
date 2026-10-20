import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { FireHotspot, LanudBase, BaseThreatSummary } from '../types';
import { formatFirmsUtcToWib, getBaseTacticalAbbr } from '../utils/geoMath';

export const DEFAULT_CARTO_API_KEY = 'cb1_4ovb_1_cda161407f013e7010dd86be';

interface TacticalMapProps {
  bases: LanudBase[];
  threatSummaries: BaseThreatSummary[];
  hotspots: FireHotspot[];
  selectedBase: LanudBase | null;
  onSelectBase: (base: LanudBase | null) => void;
  dangerRadiusKm: number;
  warningRadiusKm: number;
  advisoryRadiusKm: number;
  mapStyle: 'dark' | 'satellite' | 'topo';
  cartoApiKey?: string;
  onSelectHotspot?: (hotspot: FireHotspot) => void;
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  bases,
  threatSummaries,
  hotspots,
  selectedBase,
  onSelectBase,
  dangerRadiusKm,
  warningRadiusKm,
  advisoryRadiusKm,
  mapStyle,
  cartoApiKey = DEFAULT_CARTO_API_KEY,
  onSelectHotspot,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const bufferCirclesLayerRef = useRef<L.LayerGroup | null>(null);
  const fireMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize Map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;
    if (mapInstanceRef.current) return;

    // Prevent Leaflet error "Map container is already initialized"
    if ((container as unknown as { _leaflet_id?: number | null })._leaflet_id) {
      (container as unknown as { _leaflet_id?: number | null })._leaflet_id = null;
    }

    // Fix default Leaflet icon paths
    try {
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    } catch {
      // ignore
    }

    // Center on Indonesia Archipelago (Makassar Strait / Central Indonesia)
    const map = L.map(container, {
      center: [-2.5, 118.0],
      zoom: 5,
      minZoom: 4,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: true,
    });

    // Custom tactical zoom control on bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Add scale bar in km
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

    mapInstanceRef.current = map;
    baseMarkersLayerRef.current = L.layerGroup().addTo(map);
    bufferCirclesLayerRef.current = L.layerGroup().addTo(map);
    fireMarkersLayerRef.current = L.layerGroup().addTo(map);

    // Progressive resize invalidations to ensure tiles render immediately
    const t1 = setTimeout(() => map.invalidateSize(), 50);
    const t2 = setTimeout(() => map.invalidateSize(), 200);
    const t3 = setTimeout(() => map.invalidateSize(), 600);

    // ResizeObserver ensures map responds to container flex/grid resize
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when mapStyle or cartoApiKey changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const key = cartoApiKey || DEFAULT_CARTO_API_KEY;

    let tileUrl = `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?api_key=${key}`;
    let attribution = '&copy; <a href="https://carto.com/" target="_blank">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>';
    let subdomains = 'abcd';

    if (mapStyle === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Esri, Maxar, Earthstar Geographics';
      subdomains = 'abc';
    } else if (mapStyle === 'topo') {
      tileUrl = `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?api_key=${key}`;
      attribution = '&copy; <a href="https://carto.com/" target="_blank">CARTO</a> &copy; OpenStreetMap';
      subdomains = 'abcd';
    }

    const newLayer = L.tileLayer(tileUrl, {
      attribution,
      maxZoom: 19,
      subdomains,
      crossOrigin: true,
    });

    // In case CARTO tile fails or network error, fallback to OpenStreetMap
    newLayer.on('tileerror', () => {
      // tile error fallback handled gracefully
    });

    newLayer.addTo(map);
    tileLayerRef.current = newLayer;

    // Re-invalidate size after tile switch
    map.invalidateSize();
  }, [mapStyle, cartoApiKey]);

  // Update Base Markers & Perimeter Circles
  useEffect(() => {
    const map = mapInstanceRef.current;
    const baseLayer = baseMarkersLayerRef.current;
    const bufferLayer = bufferCirclesLayerRef.current;
    if (!map || !baseLayer || !bufferLayer) return;

    baseLayer.clearLayers();
    bufferLayer.clearLayers();

    // Map base summaries by base id for fast lookup
    const summaryMap = new Map<string, BaseThreatSummary>();
    threatSummaries.forEach((s) => summaryMap.set(s.base.id, s));

    bases.forEach((base) => {
      const summary = summaryMap.get(base.id);
      const threat = summary ? summary.threatLevel : 'SAFE';
      const isSelected = selectedBase?.id === base.id;

      // Color based on threat level
      let colorClass = '#38bdf8'; // Blue for nominal / safe
      let badgeLabel = 'AMAN';
      let ringBorder = '#0284c7';

      if (threat === 'CRITICAL') {
        colorClass = '#ef4444'; // Red
        badgeLabel = `BAHAYA (${summary?.criticalCount} Api)`;
        ringBorder = '#dc2626';
      } else if (threat === 'WARNING') {
        colorClass = '#f59e0b'; // Amber
        badgeLabel = `WASPADA (${summary?.warningCount} Api)`;
        ringBorder = '#d97706';
      } else if (threat === 'ADVISORY') {
        colorClass = '#3b82f6'; // Blue
        badgeLabel = `SIAGA (${summary?.advisoryCount} Api)`;
        ringBorder = '#2563eb';
      }

      // Custom SVG Marker Icon for military base
      const isAirbase = base.type.startsWith('Lanud');
      const isRadar = base.type === 'Satuan Radar';
      const isDepohar = base.type === 'Depo Pemeliharaan';

      let iconSvg = '';
      if (isAirbase) {
        // Wings / Aircraft symbol
        iconSvg = `<path d="M12 2L9 9H3L1 11L9 13L11 21L13 22L14 15L22 13L20 11H14L12 2Z" fill="${colorClass}"/>`;
      } else if (isRadar) {
        // Radar Dish
        iconSvg = `<circle cx="12" cy="12" r="9" stroke="${colorClass}" stroke-width="2" fill="none"/><path d="M12 12L18 6" stroke="${colorClass}" stroke-width="2"/><circle cx="12" cy="12" r="2.5" fill="${colorClass}"/>`;
      } else if (isDepohar) {
        // Wrench / Cog Maintenance
        iconSvg = `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" fill="${colorClass}"/>`;
      } else {
        // Shield / Kopasgat
        iconSvg = `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="${colorClass}"/>`;
      }

      const pulseHtml =
        threat === 'CRITICAL'
          ? `<span class="absolute -inset-2 rounded-full bg-red-500/40 animate-ping"></span>`
          : '';

      const baseAbbr = getBaseTacticalAbbr(base);

      const markerHtml = `
        <div class="relative flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-110 ${isSelected ? 'scale-125 z-50' : ''}">
          ${pulseHtml}
          <div style="background-color: #090d16; border: 2px solid ${isSelected ? '#ffffff' : ringBorder}; box-shadow: 0 0 12px ${colorClass}88;"
               class="w-7 h-7 rounded-full flex items-center justify-center shadow-lg">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
              ${iconSvg}
            </svg>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-military-marker',
        html: markerHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -16],
      });

      const marker = L.marker([base.lat, base.lon], { icon: customIcon });

      // Permanent abbreviation label on map without clicking
      marker.bindTooltip(baseAbbr, {
        permanent: true,
        direction: 'bottom',
        offset: [0, 8],
        className: `military-base-tooltip threat-${threat.toLowerCase()} ${isSelected ? 'selected' : ''}`,
      });

      // Build Rich Military Popup
      const popupContent = `
        <div style="font-family: inherit; font-size: 13px; color: #f8fafc; min-width: 260px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #334155; padding-bottom: 8px; margin-bottom: 8px;">
            <div>
              <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8;">${base.type} · ${base.koopsud}</span>
              <h4 style="font-size: 14px; font-weight: 700; margin: 2px 0 0 0; color: #ffffff;">${base.name}</h4>
              <span style="font-family: monospace; font-size: 11px; color: #38bdf8;">KODE: ${base.code}</span>
            </div>
            <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: ${colorClass}22; color: ${colorClass}; border: 1px solid ${colorClass}55;">
              ${badgeLabel}
            </span>
          </div>

          <div style="margin-bottom: 8px; font-size: 12px; color: #cbd5e1; line-height: 1.4;">
            <div><strong>Lokasi:</strong> ${base.city}, Prov. ${base.province}</div>
            ${base.runwayOrientation ? `<div><strong>Runway:</strong> ${base.runwayOrientation} (${base.runwayLengthM}m) · Elevasi: ${base.elevationMeters}m</div>` : ''}
            <div><strong>Satuan/Aset:</strong> ${base.assetsSummary}</div>
          </div>

          ${
            summary && summary.totalHotspotsNear > 0
              ? `
            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; padding: 8px; margin-bottom: 8px;">
              <div style="font-weight: 700; font-size: 11px; color: #fca5a5; margin-bottom: 4px;">RINGKASAN ANCAMAN TITIK API:</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px;">
                <div>Bahaya (<5km): <strong style="color: #ef4444;">${summary.criticalCount}</strong></div>
                <div>Waspada (5-15km): <strong style="color: #f59e0b;">${summary.warningCount}</strong></div>
                <div>Siaga (15-30km): <strong style="color: #3b82f6;">${summary.advisoryCount}</strong></div>
                <div>FRP Maks: <strong>${summary.maxFrpMw.toFixed(1)} MW</strong></div>
              </div>
              ${
                summary.nearestHotspotDistanceKm !== null
                  ? `<div style="margin-top: 4px; font-size: 11px; color: #fed7aa;">Api Terdekat: <strong>${summary.nearestHotspotDistanceKm} km</strong></div>`
                  : ''
              }
            </div>
            `
              : `<div style="font-size: 11px; color: #86efac; margin-bottom: 8px;">✓ Tidak terdeteksi titik api aktif dalam perimeter 30 km</div>`
          }

          <div style="font-size: 10px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 6px;">
            Puskodal: ${base.puskodalContact}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        onSelectBase(base);
      });

      baseLayer.addLayer(marker);

      // Draw Buffer Rings if base is selected OR if base has active threats
      const shouldDrawRings = isSelected || threat === 'CRITICAL' || threat === 'WARNING';
      if (shouldDrawRings) {
        // Danger Ring (e.g. 5 km)
        const dangerCircle = L.circle([base.lat, base.lon], {
          radius: dangerRadiusKm * 1000,
          color: '#ef4444',
          weight: isSelected ? 2 : 1.5,
          fillColor: '#ef4444',
          fillOpacity: 0.12,
          dashArray: isSelected ? '4, 4' : undefined,
        });
        dangerCircle.bindTooltip(`Zona Bahaya (${dangerRadiusKm} km) - ${base.code}`, {
          sticky: true,
          className: 'bg-slate-900 text-red-400 text-xs px-2 py-1 rounded border border-red-800',
        });
        bufferLayer.addLayer(dangerCircle);

        // Warning Ring (e.g. 15 km)
        const warningCircle = L.circle([base.lat, base.lon], {
          radius: warningRadiusKm * 1000,
          color: '#f59e0b',
          weight: 1,
          fillColor: '#f59e0b',
          fillOpacity: 0.05,
          dashArray: '5, 5',
        });
        bufferLayer.addLayer(warningCircle);

        // Advisory Ring (e.g. 30 km)
        if (isSelected) {
          const advisoryCircle = L.circle([base.lat, base.lon], {
            radius: advisoryRadiusKm * 1000,
            color: '#3b82f6',
            weight: 1,
            fillColor: '#3b82f6',
            fillOpacity: 0.03,
            dashArray: '6, 6',
          });
          bufferLayer.addLayer(advisoryCircle);
        }
      }
    });
  }, [bases, threatSummaries, selectedBase, dangerRadiusKm, warningRadiusKm, advisoryRadiusKm, onSelectBase]);

  // Update Fire Hotspots Layer
  useEffect(() => {
    const fireLayer = fireMarkersLayerRef.current;
    if (!fireLayer) return;

    fireLayer.clearLayers();

    hotspots.forEach((h) => {
      // Color and size by threat level and Fire Radiative Power (FRP)
      let fillColor = '#f97316'; // standard orange
      let radius = 4;
      let strokeColor = '#ea580c';
      let weight = 1;

      if (h.threatLevel === 'CRITICAL') {
        fillColor = '#ef4444'; // Bright Red
        strokeColor = '#ffffff';
        radius = 7;
        weight = 2;
      } else if (h.threatLevel === 'WARNING') {
        fillColor = '#f59e0b'; // Amber
        strokeColor = '#fed7aa';
        radius = 5.5;
        weight = 1.5;
      } else if (h.threatLevel === 'ADVISORY') {
        fillColor = '#3b82f6';
        radius = 4.5;
      } else {
        // Nominal hotspot background
        if (h.frp > 50) {
          fillColor = '#dc2626';
          radius = 5;
        } else if (h.frp > 20) {
          fillColor = '#ea580c';
          radius = 4;
        } else {
          fillColor = '#d97706';
          radius = 3;
        }
      }

      if (h.isPeatland) {
        strokeColor = '#fbbf24';
        weight = 2.5;
      }

      const fireMarker = L.circleMarker([h.latitude, h.longitude], {
        radius,
        fillColor,
        color: strokeColor,
        weight,
        fillOpacity: 0.85,
      });

      // Tooltip/Popup for Fire Hotspot
      const nearestText = h.nearestBase
        ? `<div style="font-size: 11px; margin-top: 4px; padding-top: 4px; border-top: 1px solid #334155; color: #fca5a5;">
            <strong>Ancaman:</strong> ${h.distanceKm} km ke <strong>${h.nearestBase.name}</strong> (${h.bearingDeg}°)
           </div>`
        : '';

      const peatlandText = h.isPeatland
        ? `<div style="font-size: 11px; margin-top: 3px; color: #f59e0b; background: rgba(120, 53, 15, 0.4); padding: 2px 6px; border-radius: 4px; border: 1px solid #b45309;">
            <strong>⚠️ Lahan Gambut (is__peatland: true)</strong> - Resiko asap pekat
           </div>`
        : '';

      const sourceLabel = h.source === 'GFW' ? 'GFW VIIRS 375m' : h.satellite;

      const popupContent = `
        <div style="font-family: inherit; font-size: 12px; color: #f8fafc; min-width: 230px;">
          <div style="font-weight: 700; color: #f97316; font-size: 13px; margin-bottom: 4px; display: flex; align-items: center; justify-content: space-between;">
            <span>🔥 TITIK API SATELIT</span>
            <span style="font-size: 10px; background: #334155; padding: 1px 5px; border-radius: 3px; color: #cbd5e1;">${sourceLabel}</span>
          </div>
          <div><strong>Koordinat:</strong> ${h.latitude.toFixed(4)}, ${h.longitude.toFixed(4)}</div>
          <div><strong>FRP (Radiative Power):</strong> <span style="font-weight: 700; color: #fbbf24;">${h.frp.toFixed(1)} MW</span></div>
          <div><strong>Kecerahan (Temp):</strong> ${h.bright_ti4.toFixed(1)} K (${(h.bright_ti4 - 273.15).toFixed(1)} °C)</div>
          <div><strong>Tingkat Keyakinan:</strong> ${h.confidence === 'h' ? 'Tinggi (High)' : h.confidence === 'n' ? 'Nominal' : 'Rendah (Low)'}</div>
          <div><strong>Waktu Deteksi:</strong> <span style="color: #38bdf8; font-weight: 700;">${formatFirmsUtcToWib(h.acq_date, h.acq_time).fullWibString}</span> (${h.daynight === 'D' ? 'Siang' : 'Malam'})</div>
          ${peatlandText}
          ${nearestText}
        </div>
      `;

      fireMarker.bindPopup(popupContent);

      fireMarker.on('click', () => {
        if (onSelectHotspot) onSelectHotspot(h);
      });

      fireLayer.addLayer(fireMarker);
    });
  }, [hotspots, onSelectHotspot]);

  // Pan to selected base when it changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedBase) return;

    map.flyTo([selectedBase.lat, selectedBase.lon], 11, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [selectedBase]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-950">
      <div ref={mapContainerRef} className="w-full h-full z-0" style={{ minHeight: '100%' }} />

      {/* Map Legend Overlay in bottom-left */}
      <div className="absolute bottom-6 left-6 z-10 bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-lg p-3 text-xs text-slate-300 shadow-xl max-w-xs pointer-events-auto">
        <div className="font-semibold text-slate-100 text-xs mb-2 flex items-center justify-between border-b border-slate-800 pb-1.5">
          <span>LEGENDA PERIMETER MILITER</span>
          <span className="font-mono text-[10px] text-sky-400">CARTO + FIRMS</span>
        </div>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 border border-red-300 shadow-sm shadow-red-500/50 shrink-0"></span>
            <span>Ring 1: Bahaya (&le; {dangerRadiusKm} km) · Alarm Sirene</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-300 shrink-0"></span>
            <span>Ring 2: Waspada ({dangerRadiusKm} - {warningRadiusKm} km) · Patroli</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 border border-blue-300 shrink-0"></span>
            <span>Ring 3: Siaga ({warningRadiusKm} - {advisoryRadiusKm} km) · Monitoring</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0"></span>
            <span>Titik Api Satelit (VIIRS 375m / MODIS 1km)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
