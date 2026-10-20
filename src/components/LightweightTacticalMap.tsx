import React, { useState, useRef, useEffect, useMemo } from 'react';
import { LanudBase, BaseThreatSummary, FireHotspot } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, Crosshair, Compass, ShieldAlert, AlertTriangle, Layers } from 'lucide-react';
import { calculateDistanceKm, getCompassDirection, formatFirmsUtcToWib, getBaseTacticalAbbr } from '../utils/geoMath';

// Geographic bounds of Indonesia archipelago
const MIN_LON = 94.0;
const MAX_LON = 142.0;
const MIN_LAT = -11.5;
const MAX_LAT = 6.5;

const SVG_WIDTH = 2400;
const SVG_HEIGHT = 1000;

// Convert GPS (lat, lon) to SVG Canvas (x, y)
function geoToSvg(lat: number, lon: number): { x: number; y: number } {
  const x = ((lon - MIN_LON) / (MAX_LON - MIN_LON)) * SVG_WIDTH;
  const y = ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * SVG_HEIGHT;
  return { x, y };
}

// Convert distance in km to SVG canvas pixel radius at latitude
function kmToSvgPixels(km: number, lat: number = -2): number {
  // At equator, 1 degree lon ≈ 111.32 km
  const kmPerLonDegree = 111.32 * Math.cos((lat * Math.PI) / 180);
  const degrees = km / kmPerLonDegree;
  const pixelsPerDegree = SVG_WIDTH / (MAX_LON - MIN_LON);
  return degrees * pixelsPerDegree;
}

// Simplified high-fidelity polygon paths for Indonesian archipelago
const INDONESIA_ISLAND_PATHS = [
  // SUMATRA
  "M 140 180 L 170 160 L 220 220 L 290 280 L 370 360 L 450 460 L 510 550 L 540 600 L 515 625 L 470 600 L 410 520 L 340 440 L 260 360 L 200 290 L 150 220 Z",
  // RIAU ISLANDS / BANGKA BELITUNG
  "M 490 380 L 510 375 L 505 395 Z M 570 540 L 590 535 L 595 560 L 575 565 Z M 630 570 L 645 565 L 650 585 Z",
  // JAVA
  "M 550 635 L 630 630 L 750 645 L 850 655 L 940 665 L 990 670 L 980 690 L 880 695 L 760 685 L 640 675 L 560 660 Z M 950 650 L 1010 655 L 1000 665 Z", // Madura
  // KALIMANTAN (BORNEO)
  "M 650 280 L 750 250 L 880 270 L 930 320 L 950 400 L 930 490 L 890 530 L 810 540 L 730 520 L 680 470 L 670 380 L 640 330 Z",
  // SULAWESI (CELEBES - 4 distinct arms)
  "M 1040 330 L 1150 280 L 1180 320 L 1120 370 L 1090 410 L 1150 440 L 1180 480 L 1130 510 L 1080 470 L 1070 560 L 1040 570 L 1030 480 L 1000 420 L 1020 350 Z",
  // BALI, LOMBOK, SUMBAWA, FLORES, TIMOR (NUSA TENGGARA)
  "M 1010 680 L 1030 675 L 1035 690 Z M 1050 680 L 1075 675 L 1070 690 Z M 1090 675 L 1150 670 L 1140 690 Z M 1160 675 L 1250 670 L 1240 690 Z M 1260 690 L 1330 680 L 1320 710 Z",
  // MALUKU (HALMAHERA, AMBON, SERAM)
  "M 1250 310 L 1280 280 L 1310 320 L 1270 380 Z M 1240 450 L 1320 440 L 1310 470 Z M 1260 510 L 1300 520 L 1280 540 Z M 1260 620 L 1290 640 L 1270 655 Z",
  // PAPUA (WEST PAPUA & PAPUA)
  "M 1370 370 L 1440 360 L 1520 400 L 1650 410 L 1800 420 L 1800 630 L 1740 640 L 1630 600 L 1540 550 L 1460 520 L 1400 470 L 1360 410 Z",
];

interface LightweightTacticalMapProps {
  bases: LanudBase[];
  threatSummaries: BaseThreatSummary[];
  hotspots: FireHotspot[];
  selectedBase: LanudBase | null;
  onSelectBase: (base: LanudBase | null) => void;
  dangerRadiusKm: number;
  warningRadiusKm: number;
  advisoryRadiusKm: number;
  onSelectHotspot?: (hotspot: FireHotspot) => void;
}

export const LightweightTacticalMap: React.FC<LightweightTacticalMapProps> = ({
  bases,
  threatSummaries,
  hotspots,
  selectedBase,
  onSelectBase,
  dangerRadiusKm,
  warningRadiusKm,
  advisoryRadiusKm,
  onSelectHotspot,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan and Zoom Transform state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Hover states
  const [hoveredBase, setHoveredBase] = useState<LanudBase | null>(null);
  const [hoveredHotspot, setHoveredHotspot] = useState<FireHotspot | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Map base summaries for O(1) lookup
  const summaryMap = useMemo(() => {
    const map = new Map<string, BaseThreatSummary>();
    threatSummaries.forEach((s) => map.set(s.base.id, s));
    return map;
  }, [threatSummaries]);

  // Find critical bases for focus button
  const criticalBases = useMemo(() => {
    return threatSummaries.filter((s) => s.threatLevel === 'CRITICAL');
  }, [threatSummaries]);

  // Center on selected base if chosen
  useEffect(() => {
    if (selectedBase && containerRef.current) {
      const { x, y } = geoToSvg(selectedBase.lat, selectedBase.lon);
      const containerRect = containerRef.current.getBoundingClientRect();
      const targetZoom = 3.5;

      const newPanX = containerRect.width / 2 - (x / SVG_WIDTH) * (containerRect.width * targetZoom);
      const newPanY = containerRect.height / 2 - (y / SVG_HEIGHT) * (containerRect.height * targetZoom);

      setZoom(targetZoom);
      setPan({ x: newPanX, y: newPanY });
    }
  }, [selectedBase]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.2 : 0.83;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.8), 8);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
      const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    }
  };

  const handleZoomIn = () => {
    setZoom((z) => Math.min(z * 1.35, 8));
  };

  const handleZoomOut = () => {
    setZoom((z) => Math.max(z * 0.74, 0.8));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    onSelectBase(null);
  };

  const handleFocusCritical = () => {
    if (criticalBases.length > 0) {
      onSelectBase(criticalBases[0].base);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      className="relative w-full h-full overflow-hidden bg-slate-950 select-none cursor-grab active:cursor-grabbing"
      style={{ touchAction: 'none' }}
    >
      {/* Tactical Canvas Header Bar */}
      <div className="absolute top-4 left-6 z-20 flex items-center gap-3 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg px-3.5 py-2 shadow-xl flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
              <span>RADAR TAKTIS KARHUTLA RI</span>
              <span className="text-[10px] text-sky-400 bg-sky-950 px-1 rounded border border-sky-800">
                OFFLINE VECTOR
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono-numbers">
              Area: 94°BT–142°BT · {bases.length} Lanud & Obvit Terpantau
            </div>
          </div>
        </div>

        {criticalBases.length > 0 && (
          <button
            onClick={handleFocusCritical}
            className="pointer-events-auto bg-red-950/90 hover:bg-red-900 border border-red-600/80 text-red-200 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-lg animate-pulse transition-colors"
          >
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>Fokus {criticalBases.length} Pangkalan Bahaya</span>
          </button>
        )}
      </div>

      {/* Controls Overlay (Top Right) */}
      <div className="absolute top-4 right-6 z-20 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-lg p-1.5 shadow-xl pointer-events-auto">
        <button
          onClick={handleZoomIn}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Perbesar Peta (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Perkecil Peta (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetView}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Reset Sudut Pandang Nusantara"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* SVG Vector Map Container with Smooth Pan & Zoom */}
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full h-full"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          transition: isDragging ? 'none' : 'transform 0.15s ease-out',
        }}
      >
        <defs>
          {/* Tactical Grid Pattern */}
          <pattern id="tacticalGrid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3,3" />
          </pattern>

          {/* Radar Radial Sweep Gradient */}
          <radialGradient id="radarScan" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
          </radialGradient>

          {/* Fire Glow Filter */}
          <filter id="fireGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ocean Background */}
        <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="#030712" />

        {/* Tactical Coordinate Grid Overlay */}
        <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#tacticalGrid)" />

        {/* Equator & Meridian Reference Lines */}
        <line
          x1={0}
          y1={geoToSvg(0, 94).y}
          x2={SVG_WIDTH}
          y2={geoToSvg(0, 142).y}
          stroke="#0284c7"
          strokeWidth="1"
          strokeDasharray="6, 6"
          opacity="0.4"
        />
        <text
          x={30}
          y={geoToSvg(0, 94).y - 6}
          fill="#38bdf8"
          fontSize="11"
          fontFamily="monospace"
          opacity="0.6"
        >
          GARIS KHATULISTIWA (0° LATITUDE)
        </text>

        {/* Indonesian Archipelago Vector Landmasses */}
        <g id="landmasses">
          {INDONESIA_ISLAND_PATHS.map((pathStr, i) => (
            <path
              key={i}
              d={pathStr}
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="1.5"
              className="transition-colors hover:fill-slate-800"
            />
          ))}
        </g>

        {/* Territorial Water Boundaries (ALKI / ZEE subtle styling) */}
        <g id="regions" opacity="0.3">
          <text x="320" y="240" fill="#64748b" fontSize="18" fontWeight="bold" fontFamily="monospace">
            WILAYAH KOOPSUD I
          </text>
          <text x="880" y="450" fill="#64748b" fontSize="18" fontWeight="bold" fontFamily="monospace">
            WILAYAH KOOPSUD II
          </text>
          <text x="1480" y="380" fill="#64748b" fontSize="18" fontWeight="bold" fontFamily="monospace">
            WILAYAH KOOPSUD III
          </text>
        </g>

        {/* Threat Buffer Rings Layer for Selected / Critical Airbases */}
        <g id="bufferRings">
          {bases.map((base) => {
            const summary = summaryMap.get(base.id);
            const threat = summary ? summary.threatLevel : 'SAFE';
            const isSelected = selectedBase?.id === base.id;

            if (!isSelected && threat !== 'CRITICAL' && threat !== 'WARNING') return null;

            const { x, y } = geoToSvg(base.lat, base.lon);
            const r5 = kmToSvgPixels(dangerRadiusKm, base.lat);
            const r15 = kmToSvgPixels(warningRadiusKm, base.lat);
            const r30 = kmToSvgPixels(advisoryRadiusKm, base.lat);

            return (
              <g key={`rings-${base.id}`}>
                {/* 30 km Advisory Ring */}
                {isSelected && (
                  <circle
                    cx={x}
                    cy={y}
                    r={r30}
                    fill="#3b82f6"
                    fillOpacity="0.04"
                    stroke="#3b82f6"
                    strokeWidth="1"
                    strokeDasharray="4, 4"
                  />
                )}
                {/* 15 km Warning Ring */}
                <circle
                  cx={x}
                  cy={y}
                  r={r15}
                  fill="#f59e0b"
                  fillOpacity="0.06"
                  stroke="#f59e0b"
                  strokeWidth="1.2"
                  strokeDasharray="4, 4"
                />
                {/* 5 km Danger Ring */}
                <circle
                  cx={x}
                  cy={y}
                  r={r5}
                  fill="#ef4444"
                  fillOpacity="0.14"
                  stroke="#ef4444"
                  strokeWidth="1.8"
                />
              </g>
            );
          })}
        </g>

        {/* Live Fire Hotspots Layer (NASA FIRMS & GFW) */}
        <g id="hotspots" filter="url(#fireGlow)">
          {hotspots.map((h) => {
            const { x, y } = geoToSvg(h.latitude, h.longitude);

            let color = '#f97316';
            let radius = 2.5;

            if (h.threatLevel === 'CRITICAL') {
              color = '#ef4444';
              radius = 5.5;
            } else if (h.threatLevel === 'WARNING') {
              color = '#f59e0b';
              radius = 4;
            } else if (h.threatLevel === 'ADVISORY') {
              color = '#38bdf8';
              radius = 3;
            } else {
              if (h.frp > 40) {
                color = '#ea580c';
                radius = 3.5;
              } else {
                color = '#d97706';
                radius = 2.5;
              }
            }

            return (
              <g
                key={h.id}
                className="cursor-pointer"
                onMouseEnter={(e) => {
                  setHoveredHotspot(h);
                  setTooltipPos({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredHotspot(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectHotspot) onSelectHotspot(h);
                }}
              >
                {/* Outer peatland indicator ring */}
                {h.isPeatland && (
                  <circle
                    cx={x}
                    cy={y}
                    r={radius * 2.8}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1.2"
                    strokeDasharray="2,2"
                    opacity="0.9"
                  />
                )}
                {h.threatLevel === 'CRITICAL' && (
                  <circle
                    cx={x}
                    cy={y}
                    r={radius * 2.2}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="1"
                    opacity="0.8"
                  />
                )}
                <circle cx={x} cy={y} r={radius} fill={color} opacity="0.9" />
              </g>
            );
          })}
        </g>

        {/* TNI AU Airbases & Vital Objects Markers */}
        <g id="bases">
          {bases.map((base) => {
            const { x, y } = geoToSvg(base.lat, base.lon);
            const summary = summaryMap.get(base.id);
            const threat = summary ? summary.threatLevel : 'SAFE';
            const isSelected = selectedBase?.id === base.id;

            let markerColor = '#38bdf8';
            if (threat === 'CRITICAL') markerColor = '#ef4444';
            else if (threat === 'WARNING') markerColor = '#f59e0b';
            else if (threat === 'ADVISORY') markerColor = '#3b82f6';

            return (
              <g
                key={base.id}
                transform={`translate(${x}, ${y})`}
                className="cursor-pointer transition-transform"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectBase(base);
                }}
                onMouseEnter={(e) => {
                  setHoveredBase(base);
                  setTooltipPos({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredBase(null)}
              >
                {/* Critical Pulse */}
                {threat === 'CRITICAL' && (
                  <circle r="18" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.7">
                    <animate attributeName="r" values="8;24;8" dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0;0.8" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Outer Ring */}
                <circle
                  r={isSelected ? 10 : 7}
                  fill="#090d16"
                  stroke={isSelected ? '#ffffff' : markerColor}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />

                {/* Inner Symbol */}
                <circle r={isSelected ? 4 : 3} fill={markerColor} />

                {/* Permanent Base Abbreviation Badge without clicking */}
                {(() => {
                  const baseAbbr = getBaseTacticalAbbr(base);
                  const badgeW = baseAbbr.length * 6.5 + 8;
                  return (
                    <g transform={`translate(-${badgeW / 2}, 10)`}>
                      <rect
                        x="0"
                        y="0"
                        width={badgeW}
                        height="16"
                        rx="3"
                        ry="3"
                        fill="#020617"
                        fillOpacity="0.94"
                        stroke={isSelected ? '#ffffff' : threat === 'CRITICAL' ? '#ef4444' : threat === 'WARNING' ? '#f59e0b' : '#334155'}
                        strokeWidth={isSelected || threat === 'CRITICAL' ? '1.5' : '1'}
                      />
                      <text
                        x={badgeW / 2}
                        y="11.5"
                        textAnchor="middle"
                        fill={isSelected ? '#ffffff' : threat === 'CRITICAL' ? '#fca5a5' : threat === 'WARNING' ? '#fde68a' : '#e2e8f0'}
                        fontSize="9.5"
                        fontWeight="bold"
                        fontFamily="'JetBrains Mono', monospace"
                        letterSpacing="0.02em"
                      >
                        {baseAbbr}
                      </text>
                    </g>
                  );
                })()}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating Tactical Base Tooltip */}
      {hoveredBase && (
        <div
          className="fixed z-50 pointer-events-none bg-slate-900/95 border border-slate-700 rounded-lg p-3 text-xs text-white shadow-2xl max-w-xs -translate-x-1/2 -translate-y-full mb-3"
          style={{ left: tooltipPos.x, top: tooltipPos.y - 12 }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-1.5">
            <div>
              <div className="font-bold text-white text-xs">{hoveredBase.name}</div>
              <div className="text-[10px] text-sky-400 font-mono">
                {hoveredBase.code} · {hoveredBase.type}
              </div>
            </div>
            {summaryMap.get(hoveredBase.id)?.threatLevel === 'CRITICAL' && (
              <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                BAHAYA
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-300 space-y-0.5">
            <div>Lokasi: {hoveredBase.city}, {hoveredBase.province}</div>
            {hoveredBase.runwayOrientation && (
              <div>Runway: {hoveredBase.runwayOrientation} ({hoveredBase.runwayLengthM}m)</div>
            )}
            {summaryMap.get(hoveredBase.id)?.nearestHotspotDistanceKm !== null ? (
              <div className="text-amber-400 font-semibold pt-1">
                Api Terdekat: {summaryMap.get(hoveredBase.id)?.nearestHotspotDistanceKm} km
              </div>
            ) : (
              <div className="text-emerald-400 pt-1">✓ Bebas Titik Api (&gt;30km)</div>
            )}
          </div>
        </div>
      )}

      {/* Floating Tactical Hotspot Tooltip */}
      {hoveredHotspot && (
        <div
          className="fixed z-50 pointer-events-none bg-slate-900/95 border border-slate-700 rounded-lg p-2.5 text-xs text-white shadow-2xl max-w-xs -translate-x-1/2 -translate-y-full mb-3"
          style={{ left: tooltipPos.x, top: tooltipPos.y - 10 }}
        >
          <div className="font-bold text-amber-400 text-xs flex items-center justify-between mb-1">
            <span>{hoveredHotspot.source === 'GFW' ? '🔥 TITIK API GFW (375M)' : '🔥 TITIK API NASA FIRMS'}</span>
            <span className="text-[10px] text-slate-400 font-mono">{hoveredHotspot.satellite}</span>
          </div>
          <div className="text-[11px] text-slate-300 space-y-0.5 font-mono-numbers">
            <div>Koordinat: {hoveredHotspot.latitude.toFixed(3)}, {hoveredHotspot.longitude.toFixed(3)}</div>
            <div>Waktu Deteksi: <span className="text-sky-300 font-bold">{formatFirmsUtcToWib(hoveredHotspot.acq_date, hoveredHotspot.acq_time).fullWibString}</span></div>
            <div>Daya Radiasi (FRP): <strong className="text-amber-300">{hoveredHotspot.frp.toFixed(1)} MW</strong></div>
            <div>Suhu: {(hoveredHotspot.bright_ti4 - 273.15).toFixed(1)}°C</div>
            {hoveredHotspot.isPeatland && (
              <div className="text-amber-400 font-bold pt-0.5 flex items-center gap-1 font-sans">
                <span>⚠️ Wilayah Lahan Gambut (is__peatland: true)</span>
              </div>
            )}
            {hoveredHotspot.nearestBase && (
              <div className="text-red-300 pt-0.5 font-sans">
                {hoveredHotspot.distanceKm} km ke {hoveredHotspot.nearestBase.name}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend & Instructions (Bottom Left) */}
      <div className="absolute bottom-6 left-6 z-10 bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-lg p-3 text-xs text-slate-300 shadow-xl max-w-xs pointer-events-auto">
        <div className="font-semibold text-slate-100 text-xs mb-2 flex items-center justify-between border-b border-slate-800 pb-1.5">
          <span>LEGENDA PERIMETER PERTAHANAN</span>
          <span className="font-mono text-[10px] text-sky-400">VEKTOR TAKTIS</span>
        </div>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 border border-red-300 shadow-sm shrink-0"></span>
            <span>Ring 1: Bahaya (&le; {dangerRadiusKm} km) · Sirene Siaga 1</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-300 shrink-0"></span>
            <span>Ring 2: Waspada ({dangerRadiusKm} - {warningRadiusKm} km) · Patroli</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 border border-blue-300 shrink-0"></span>
            <span>Ring 3: Siaga ({warningRadiusKm} - {advisoryRadiusKm} km) · Monitoring</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0"></span>
            <span>Titik Api Aktif ({hotspots.length.toLocaleString()})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border border-dashed border-amber-400 bg-amber-500/30 shrink-0"></span>
            <span>Titik Lahan Gambut (GFW Peatland)</span>
          </div>
        </div>
        <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
          <span>Tarik untuk geser · Scroll zoom</span>
          <span className="font-mono text-sky-400">Zoom: {zoom.toFixed(1)}x</span>
        </div>
      </div>
    </div>
  );
};
