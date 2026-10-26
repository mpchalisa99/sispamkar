import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { FireHotspot, LanudBase, BaseThreatSummary } from '../types';
import { formatFirmsUtcToWib, getBaseTacticalAbbr } from '../utils/geoMath';
import {
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ShieldAlert,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { MobileBaseDetailSheet } from './MobileBaseDetailSheet';

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
  isFullMap?: boolean;
  onToggleFullMap?: () => void;
  onOpenFilterDrawer?: () => void;
  onOpenDetailModal?: (summary: BaseThreatSummary) => void;
  showHotspotAlertLabels?: boolean;
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
  isFullMap = false,
  onToggleFullMap,
  onOpenFilterDrawer,
  onOpenDetailModal,
  showHotspotAlertLabels = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const bufferCirclesLayerRef = useRef<L.LayerGroup | null>(null);
  const fireMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [isLegendExpanded, setIsLegendExpanded] = useState<boolean>(false);

  // Map summaries lookup
  const summaryMap = useMemo(() => {
    const map = new Map<string, BaseThreatSummary>();
    threatSummaries.forEach((s) => map.set(s.base.id, s));
    return map;
  }, [threatSummaries]);

  // Selected base summary
  const selectedBaseSummary = useMemo(() => {
    if (!selectedBase) return null;
    return summaryMap.get(selectedBase.id) || null;
  }, [selectedBase, summaryMap]);

  // Critical bases for quick focus
  const criticalBases = useMemo(() => {
    return threatSummaries.filter((s) => s.threatLevel === 'CRITICAL');
  }, [threatSummaries]);

  // Initialize Map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;
    if (mapInstanceRef.current) return;

    if ((container as unknown as { _leaflet_id?: number | null })._leaflet_id) {
      (container as unknown as { _leaflet_id?: number | null })._leaflet_id = null;
    }

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

    // Initial responsive zoom based on device screen width
    const isMobile = window.innerWidth < 768;
    const initialZoom = isMobile ? 4.4 : 5.0;

    const map = L.map(container, {
      center: [-2.5, 118.0],
      zoom: initialZoom,
      minZoom: 3.5,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: true,
      bounceAtZoomLimits: false,
    });

    // Add scale bar in km
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

    mapInstanceRef.current = map;
    baseMarkersLayerRef.current = L.layerGroup().addTo(map);
    bufferCirclesLayerRef.current = L.layerGroup().addTo(map);
    fireMarkersLayerRef.current = L.layerGroup().addTo(map);

    const t1 = setTimeout(() => map.invalidateSize(), 60);
    const t2 = setTimeout(() => map.invalidateSize(), 300);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    // Orientation change listener for Android/Tablet
    const handleOrientationChange = () => {
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 200);
    };
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Invalidate map size when full map mode changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map) {
      setTimeout(() => map.invalidateSize(), 50);
      setTimeout(() => map.invalidateSize(), 200);
    }
  }, [isFullMap]);

  // Update Tile Layer
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

    newLayer.addTo(map);
    tileLayerRef.current = newLayer;
    map.invalidateSize();
  }, [mapStyle, cartoApiKey]);

  // Update Base Markers & Circles
  useEffect(() => {
    const map = mapInstanceRef.current;
    const baseLayer = baseMarkersLayerRef.current;
    const bufferLayer = bufferCirclesLayerRef.current;
    if (!map || !baseLayer || !bufferLayer) return;

    baseLayer.clearLayers();
    bufferLayer.clearLayers();

    bases.forEach((base) => {
      const summary = summaryMap.get(base.id);
      const threat = summary ? summary.threatLevel : 'SAFE';
      const isSelected = selectedBase?.id === base.id;

      let colorClass = '#38bdf8';
      let ringBorder = '#0284c7';

      if (threat === 'CRITICAL') {
        colorClass = '#ef4444';
        ringBorder = '#dc2626';
      } else if (threat === 'WARNING') {
        colorClass = '#f59e0b';
        ringBorder = '#d97706';
      } else if (threat === 'ADVISORY') {
        colorClass = '#3b82f6';
        ringBorder = '#2563eb';
      }

      const isAirbase = base.type.startsWith('Lanud');
      const isRadar = base.type === 'Satuan Radar';
      const isDepohar = base.type === 'Depo Pemeliharaan';

      let iconSvg = '';
      if (isAirbase) {
        iconSvg = `<path d="M12 2L9 9H3L1 11L9 13L11 21L13 22L14 15L22 13L20 11H14L12 2Z" fill="${colorClass}"/>`;
      } else if (isRadar) {
        iconSvg = `<circle cx="12" cy="12" r="9" stroke="${colorClass}" stroke-width="2" fill="none"/><path d="M12 12L18 6" stroke="${colorClass}" stroke-width="2"/><circle cx="12" cy="12" r="2.5" fill="${colorClass}"/>`;
      } else if (isDepohar) {
        iconSvg = `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" fill="${colorClass}"/>`;
      } else {
        iconSvg = `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="${colorClass}"/>`;
      }

      const pulseHtml =
        threat === 'CRITICAL'
          ? `<span class="absolute -inset-2 rounded-full bg-red-500/40 animate-ping"></span>`
          : '';

      const baseAbbr = getBaseTacticalAbbr(base);

      const markerHtml = `
        <div class="relative flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-110 ${isSelected ? 'scale-125 z-50' : ''}" style="width: 36px; height: 36px; margin: -4px 0 0 -4px;">
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

      marker.bindTooltip(baseAbbr, {
        permanent: true,
        direction: 'bottom',
        offset: [0, 8],
        className: `military-base-tooltip threat-${threat.toLowerCase()} ${isSelected ? 'selected' : ''}`,
      });

      marker.on('click', () => {
        onSelectBase(base);
      });

      baseLayer.addLayer(marker);

      const shouldDrawRings = isSelected || threat === 'CRITICAL' || threat === 'WARNING';
      if (shouldDrawRings) {
        const dangerCircle = L.circle([base.lat, base.lon], {
          radius: dangerRadiusKm * 1000,
          color: '#ef4444',
          weight: isSelected ? 2 : 1.5,
          fillColor: '#ef4444',
          fillOpacity: 0.12,
          dashArray: isSelected ? '4, 4' : undefined,
        });
        bufferLayer.addLayer(dangerCircle);

        const warningCircle = L.circle([base.lat, base.lon], {
          radius: warningRadiusKm * 1000,
          color: '#f59e0b',
          weight: 1,
          fillColor: '#f59e0b',
          fillOpacity: 0.05,
          dashArray: '5, 5',
        });
        bufferLayer.addLayer(warningCircle);

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
  }, [bases, summaryMap, selectedBase, dangerRadiusKm, warningRadiusKm, advisoryRadiusKm, onSelectBase]);

  // Update Fire Hotspots Layer
  useEffect(() => {
    const fireLayer = fireMarkersLayerRef.current;
    if (!fireLayer) return;

    fireLayer.clearLayers();

    hotspots.forEach((h) => {
      let fillColor = '#f97316';
      let radius = 4;
      let strokeColor = '#ea580c';
      let weight = 1;

      if (h.threatLevel === 'CRITICAL') {
        fillColor = '#ef4444';
        strokeColor = '#ffffff';
        radius = 7;
        weight = 2;
      } else if (h.threatLevel === 'WARNING') {
        fillColor = '#f59e0b';
        strokeColor = '#fed7aa';
        radius = 5.5;
        weight = 1.5;
      } else if (h.threatLevel === 'ADVISORY') {
        fillColor = '#3b82f6';
        radius = 4.5;
      } else {
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

      const nearestText = h.nearestBase
        ? `<div style="font-size: 11px; margin-top: 4px; padding-top: 4px; border-top: 1px solid #334155; color: #fca5a5;">
            <strong>Ancaman:</strong> ${h.distanceKm} km ke <strong>${h.nearestBase.name}</strong> (${h.bearingDeg}°)
           </div>`
        : '';

      const peatlandText = h.isPeatland
        ? `<div style="font-size: 11px; margin-top: 3px; color: #f59e0b; background: rgba(120, 53, 15, 0.4); padding: 2px 6px; border-radius: 4px; border: 1px solid #b45309;">
            <strong>⚠️ Lahan Gambut (is__peatland: true)</strong>
           </div>`
        : '';

      const sourceLabel = h.source === 'GFW' ? 'GFW VIIRS 375m' : h.satellite;

      const popupContent = `
        <div style="font-family: inherit; font-size: 12px; color: #f8fafc; min-width: 220px;">
          <div style="font-weight: 700; color: #f97316; font-size: 12px; margin-bottom: 4px; display: flex; align-items: center; justify-content: space-between;">
            <span>🔥 TITIK API SATELIT</span>
            <span style="font-size: 9px; background: #334155; padding: 1px 4px; border-radius: 3px; color: #cbd5e1;">${sourceLabel}</span>
          </div>
          <div><strong>Koordinat:</strong> ${h.latitude.toFixed(4)}, ${h.longitude.toFixed(4)}</div>
          <div><strong>FRP (Radiative Power):</strong> <span style="font-weight: 700; color: #fbbf24;">${h.frp.toFixed(1)} MW</span></div>
          <div><strong>Waktu Deteksi:</strong> <span style="color: #38bdf8; font-weight: 700;">${formatFirmsUtcToWib(h.acq_date, h.acq_time).fullWibString}</span></div>
          ${peatlandText}
          ${nearestText}
        </div>
      `;

      fireMarker.bindPopup(popupContent);

      // Permanent data annotation for hotspots in alert zones without clicking
      if (
        showHotspotAlertLabels &&
        (h.threatLevel === 'CRITICAL' ||
          h.threatLevel === 'WARNING' ||
          h.threatLevel === 'ADVISORY')
      ) {
        const baseAbbr = h.nearestBase ? getBaseTacticalAbbr(h.nearestBase) : 'LANUD';
        const distStr = h.distanceKm !== undefined ? `${h.distanceKm.toFixed(1)} km` : '';
        const frpStr = `${(h.frp || 0).toFixed(0)} MW`;
        const peatTag = h.isPeatland ? '<span style="color:#fbbf24; margin-left:3px;">🔥GB</span>' : '';
        const levelIcon = h.threatLevel === 'CRITICAL' ? '🔴' : h.threatLevel === 'WARNING' ? '🟠' : '🔵';

        const labelHtml = `
          <div style="display:flex; align-items:center; gap:3px; font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:700;">
            <span>${levelIcon} ${baseAbbr} ${distStr}</span>
            <span style="opacity:0.5;">·</span>
            <span>${frpStr}</span>
            ${peatTag}
          </div>
        `;

        fireMarker.bindTooltip(labelHtml, {
          permanent: true,
          direction: 'top',
          offset: [0, -radius - 3],
          className: `hotspot-alert-tooltip threat-${h.threatLevel.toLowerCase()}`,
        });
      }

      fireMarker.on('click', () => {
        if (onSelectHotspot) onSelectHotspot(h);
      });

      fireLayer.addLayer(fireMarker);
    });
  }, [hotspots, onSelectHotspot, showHotspotAlertLabels]);

  // Pan to selected base when it changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedBase) return;

    map.flyTo([selectedBase.lat, selectedBase.lon], 11, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [selectedBase]);

  // Zoom control helpers
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleResetIndonesia = () => {
    const isMobile = window.innerWidth < 768;
    mapInstanceRef.current?.flyTo([-2.5, 118.0], isMobile ? 4.4 : 5.0, {
      duration: 1,
    });
    onSelectBase(null);
  };

  const handleFocusCritical = () => {
    if (criticalBases.length > 0) {
      onSelectBase(criticalBases[0].base);
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-950 select-none">
      <div ref={mapContainerRef} className="w-full h-full z-0" style={{ minHeight: '100%' }} />

      {/* Floating Tactical Header Bar (Compact for mobile) */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-6 z-20 flex flex-wrap items-center gap-2 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-2.5 py-1.5 sm:px-3.5 sm:py-2 shadow-xl flex items-center gap-2 pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <div>
            <div className="text-[11px] sm:text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
              <span>PETA TAKTIS CARTO</span>
              <span className="text-[9px] sm:text-[10px] text-sky-400 bg-sky-950 px-1 py-0.2 rounded border border-sky-800">
                {mapStyle.toUpperCase()}
              </span>
            </div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 font-mono-numbers hidden sm:block">
              {bases.length} Lanud · {hotspots.length.toLocaleString()} Titik Api Aktif
            </div>
          </div>
        </div>

        {criticalBases.length > 0 && (
          <button
            onClick={handleFocusCritical}
            className="pointer-events-auto bg-red-950/95 hover:bg-red-900 active:bg-red-800 border border-red-600 text-red-200 text-[11px] sm:text-xs font-semibold px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl flex items-center gap-1.5 shadow-lg animate-pulse transition-all cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>Fokus {criticalBases.length} Lanud Bahaya</span>
          </button>
        )}
      </div>

      {/* Floating Tactical Touch Controls */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-6 z-20 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-2xl pointer-events-auto">
        {onToggleFullMap && (
          <button
            onClick={onToggleFullMap}
            className={`p-2.5 sm:p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
              isFullMap
                ? 'bg-sky-600 text-white font-bold shadow-md shadow-sky-900/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title={isFullMap ? 'Kembali ke Tampilan Normal' : 'Mode Layar Penuh'}
            aria-label="Layar Penuh"
          >
            {isFullMap ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        )}

        {onOpenFilterDrawer && (
          <button
            onClick={onOpenFilterDrawer}
            className="p-2.5 sm:p-2 text-sky-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
            title="Buka Filter & Sensor"
            aria-label="Filter"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        )}

        <div className="w-full h-px bg-slate-800 my-0.5" />

        <button
          onClick={handleZoomIn}
          className="p-2.5 sm:p-2 text-slate-300 hover:text-white hover:bg-slate-800 active:bg-slate-700 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
          title="Perbesar Peta (+)"
          aria-label="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={handleZoomOut}
          className="p-2.5 sm:p-2 text-slate-300 hover:text-white hover:bg-slate-800 active:bg-slate-700 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
          title="Perkecil Peta (-)"
          aria-label="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={handleResetIndonesia}
          className="p-2.5 sm:p-2 text-slate-300 hover:text-white hover:bg-slate-800 active:bg-slate-700 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
          title="Reset Wilayah Indonesia"
          aria-label="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile Tactical Base Detail Sheet */}
      {selectedBaseSummary && (
        <MobileBaseDetailSheet
          summary={selectedBaseSummary}
          onClose={() => onSelectBase(null)}
          onFocusBase={(base) => {
            mapInstanceRef.current?.flyTo([base.lat, base.lon], 12);
          }}
          onOpenModal={(summary) => {
            if (onOpenDetailModal) {
              onOpenDetailModal(summary);
            }
          }}
        />
      )}

      {/* Map Legend Overlay in bottom-left (Collapsible on Mobile) */}
      <div className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 z-20 pointer-events-auto">
        <button
          onClick={() => setIsLegendExpanded(!isLegendExpanded)}
          className="sm:hidden bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-[10px] text-slate-300 flex items-center gap-1.5 shadow-xl"
        >
          <Info className="w-3.5 h-3.5 text-sky-400" />
          <span>Legenda Perimeter</span>
          {isLegendExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>

        <div
          className={`${
            isLegendExpanded ? 'block' : 'hidden'
          } sm:block mt-1 sm:mt-0 bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-xl p-2.5 sm:p-3 text-xs text-slate-300 shadow-2xl max-w-[280px] sm:max-w-xs`}
        >
          <div className="font-semibold text-slate-100 text-[11px] sm:text-xs mb-1.5 flex items-center justify-between border-b border-slate-800 pb-1">
            <span>LEGENDA PERIMETER</span>
            <span className="font-mono text-[9px] sm:text-[10px] text-sky-400">CARTO/ESRI</span>
          </div>
          <div className="space-y-1 text-[10px] sm:text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-red-300 shadow-sm shrink-0"></span>
              <span>Ring 1: Bahaya (&le; {dangerRadiusKm} km) · Alarm Sirene</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-300 shrink-0"></span>
              <span>Ring 2: Waspada ({dangerRadiusKm} - {warningRadiusKm} km) · Patroli</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-blue-300 shrink-0"></span>
              <span>Ring 3: Siaga ({warningRadiusKm} - {advisoryRadiusKm} km)</span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0"></span>
              <span>Titik Api Satelit (VIIRS 375m)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full border border-amber-400 bg-amber-500/30 shrink-0"></span>
              <span>Lahan Gambut (is__peatland)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
