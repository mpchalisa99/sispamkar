import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldAlert,
  Flame,
  X,
  Compass,
  Radio,
  ExternalLink,
  Search,
  CheckCircle2,
  ChevronRight,
  Plane,
  AlertTriangle,
  FileText,
  Crosshair,
  Truck,
  MapPin,
  Clock,
} from 'lucide-react';
import { BaseThreatSummary, LanudBase } from '../types';
import { formatFirmsUtcToWib, getCompassDirection } from '../utils/geoMath';

interface Ring1AssetsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  ring1Summaries: BaseThreatSummary[];
  dangerRadiusKm: number;
  onSelectBase: (base: LanudBase) => void;
  onOpenDetailModal: (summary: BaseThreatSummary) => void;
  onOpenReport?: () => void;
  onShowAllThreats?: () => void;
}

export const Ring1AssetsDrawer: React.FC<Ring1AssetsDrawerProps> = ({
  isOpen,
  onClose,
  ring1Summaries,
  dangerRadiusKm,
  onSelectBase,
  onOpenDetailModal,
  onOpenReport,
  onShowAllThreats,
}) => {
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Ensure items are strictly sorted by nearest hotspot distance ascending
  const sortedRing1 = useMemo(() => {
    return [...ring1Summaries].sort(
      (a, b) => (a.nearestHotspotDistanceKm ?? 999) - (b.nearestHotspotDistanceKm ?? 999)
    );
  }, [ring1Summaries]);

  // Filtered by internal search keyword
  const filteredList = useMemo(() => {
    if (!searchFilter.trim()) return sortedRing1;
    const q = searchFilter.toLowerCase();
    return sortedRing1.filter(
      (s) =>
        s.base.name.toLowerCase().includes(q) ||
        s.base.code.toLowerCase().includes(q) ||
        s.base.city.toLowerCase().includes(q) ||
        s.base.province.toLowerCase().includes(q) ||
        s.base.assetsSummary.toLowerCase().includes(q) ||
        (s.base.pkpPkUnits && s.base.pkpPkUnits.toLowerCase().includes(q))
    );
  }, [sortedRing1, searchFilter]);

  // Key stats
  const totalBases = sortedRing1.length;
  const closestDistance = sortedRing1.length > 0 ? sortedRing1[0].nearestHotspotDistanceKm : null;
  const totalCriticalHotspots = sortedRing1.reduce((sum, s) => sum + s.criticalCount, 0);
  const maxFrp = sortedRing1.reduce((max, s) => Math.max(max, s.maxFrpMw), 0);
  const totalPeatland = sortedRing1.reduce((sum, s) => sum + (s.peatlandHotspotsCount || 0), 0);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ring1-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
    >
      {/* Click outside backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Slide-Over Drawer Container */}
      <div className="relative w-full max-w-2xl bg-slate-950 border-l border-red-700/80 shadow-2xl flex flex-col h-full h-[100dvh] z-10 overflow-hidden">
        {/* Header Section */}
        <div className="p-3.5 sm:p-5 bg-gradient-to-r from-red-950/95 via-slate-950 to-slate-950 border-b border-red-800/80 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-900/50 animate-pulse">
                <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 id="ring1-drawer-title" className="text-sm sm:text-base font-bold text-white tracking-wide">
                    DAFTAR SATUAN & ASET RING 1
                  </h2>
                  <span className="bg-red-600 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                    BAHAYA &le; {dangerRadiusKm} KM
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-red-200 mt-0.5">
                  Diurutkan otomatis dari <strong>titik api terdekat</strong> ke satuan/obyek vital TNI AU.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Tutup (Esc)"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Key Metrics Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3.5 text-xs">
            <div className="bg-slate-900/90 border border-red-900/80 rounded-xl p-2 flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Satuan Terancam</span>
              <span className="text-sm sm:text-base font-bold font-mono text-red-400">
                {totalBases} Satuan
              </span>
            </div>

            <div className="bg-slate-900/90 border border-red-900/80 rounded-xl p-2 flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Jarak Api Terdekat</span>
              <span className="text-sm sm:text-base font-bold font-mono text-white">
                {closestDistance !== null ? `${closestDistance} km` : '-'}
              </span>
            </div>

            <div className="bg-slate-900/90 border border-red-900/80 rounded-xl p-2 flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Hotspot Ring 1</span>
              <span className="text-sm sm:text-base font-bold font-mono text-amber-400">
                {totalCriticalHotspots} Titik
              </span>
            </div>

            <div className="bg-slate-900/90 border border-red-900/80 rounded-xl p-2 flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">FRP Maksimum</span>
              <span className="text-sm sm:text-base font-bold font-mono text-red-300">
                {maxFrp > 0 ? `${maxFrp.toFixed(1)} MW` : '-'}
              </span>
            </div>
          </div>

          {/* Peatland alert notice if any */}
          {totalPeatland > 0 && (
            <div className="mt-2.5 bg-amber-950/80 border border-amber-700/80 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-[11px] text-amber-200">
              <div className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  <strong>Perhatian Karhutla Gambut:</strong> {totalPeatland} titik api berada di lahan gambut (potensi asap pekat & gangguan jarak pandang runway).
                </span>
              </div>
            </div>
          )}

          {/* Quick Search & Filter */}
          <div className="mt-3 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Cari satuan, pangkalan, pesawat (F-16, Hawk), atau lokasi..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500 transition-colors"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content Body: Scrollable Card List */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3.5">
          {filteredList.length === 0 ? (
            <div className="py-12 px-4 text-center">
              {totalBases === 0 ? (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-950/70 border border-emerald-600/40 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white mb-1.5">
                    Tidak Ada Satuan Dalam Radius Ring 1
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mb-5 leading-relaxed">
                    Seluruh pangkalan, satuan radar, dan obyek vital TNI AU saat ini bebas dari titik api dalam radius bahaya (&le; {dangerRadiusKm} km).
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    {onShowAllThreats && (
                      <button
                        onClick={() => {
                          onClose();
                          onShowAllThreats();
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
                      >
                        Lihat Daftar Ancaman Semua Ring
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Search className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">
                    Tidak ada satuan Ring 1 yang cocok dengan kata kunci &ldquo;{searchFilter}&rdquo;.
                  </p>
                  <button
                    onClick={() => setSearchFilter('')}
                    className="mt-2 text-xs text-red-400 hover:underline cursor-pointer"
                  >
                    Reset Pencarian
                  </button>
                </>
              )}
            </div>
          ) : (
            filteredList.map((summary, index) => {
              const base = summary.base;
              const nearestHotspot = summary.nearestHotspot;
              const dist = summary.nearestHotspotDistanceKm;
              const bearing = nearestHotspot?.bearingDeg;
              const direction = bearing !== undefined ? getCompassDirection(bearing) : '';
              const rank = index + 1;

              return (
                <div
                  key={base.id}
                  className="bg-slate-900/90 border border-red-700/80 rounded-2xl p-3.5 sm:p-4 shadow-xl shadow-red-950/20 hover:border-red-500 transition-all space-y-3"
                >
                  {/* Card Header & Rank */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 min-w-0">
                      {/* Rank Badge */}
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                          rank === 1
                            ? 'bg-red-600 text-white shadow-md shadow-red-900/60 ring-2 ring-red-400'
                            : 'bg-red-950 text-red-300 border border-red-700'
                        }`}
                        title={`Urutan ke-${rank} terdekat dari titik api`}
                      >
                        #{rank}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-sm sm:text-base text-white truncate">
                            {base.name}
                          </h3>
                          <span className="font-mono text-[10px] text-sky-400 bg-sky-950/80 px-1.5 py-0.2 rounded border border-sky-800 shrink-0">
                            {base.code}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span>{base.type}</span>
                          <span>·</span>
                          <span>{base.koopsud}</span>
                          <span>·</span>
                          <span className="flex items-center gap-0.5 text-slate-300">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {base.city}, {base.province}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Nearest Distance Pill */}
                    <div className="text-right shrink-0">
                      <div className="inline-flex items-center gap-1 bg-red-600 text-white font-mono font-bold text-xs px-2.5 py-1 rounded-lg shadow-sm shadow-red-950">
                        <Flame className="w-3.5 h-3.5" />
                        <span>{dist} km</span>
                      </div>
                      <div className="text-[10px] text-red-300 font-semibold mt-0.5">
                        Ring 1 Bahaya
                      </div>
                    </div>
                  </div>

                  {/* VITAL ASSETS & UNITS BREAKDOWN (Highlighted Panel) */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 sm:p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="p-1 rounded-md bg-sky-950 border border-sky-800 text-sky-400 shrink-0 mt-0.5">
                        <Plane className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wide block">
                          Satuan &amp; Alutsista Utama:
                        </span>
                        <p className="text-xs font-semibold text-slate-100 leading-snug">
                          {base.assetsSummary}
                        </p>
                      </div>
                    </div>

                    {/* PKP-PK Fire Fighting Fleet */}
                    {base.pkpPkUnits && (
                      <div className="flex items-start gap-2 pt-1.5 border-t border-slate-900">
                        <div className="p-1 rounded-md bg-amber-950 border border-amber-800 text-amber-400 shrink-0 mt-0.5">
                          <Truck className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide block">
                            Armada Pemadam Pangkalan (PKP-PK):
                          </span>
                          <p className="text-[11px] text-slate-300 leading-snug">
                            {base.pkpPkUnits}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Emergency Puskodal Contact */}
                    <div className="flex items-center gap-2 pt-1.5 border-t border-slate-900 text-[11px]">
                      <Radio className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-400">Puskodal:</span>
                      <span className="font-mono text-slate-200 font-medium truncate">
                        {base.puskodalContact}
                      </span>
                    </div>
                  </div>

                  {/* Fire Threat Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2">
                      <div className="text-[10px] text-slate-400 uppercase font-medium flex items-center gap-1">
                        <Compass className="w-3 h-3 text-red-400" />
                        <span>Arah / Azimuth</span>
                      </div>
                      <div className="font-mono font-bold text-slate-200 text-[11px] sm:text-xs mt-0.5">
                        {bearing !== undefined ? `${bearing}° (${direction})` : '-'}
                      </div>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2">
                      <div className="text-[10px] text-slate-400 uppercase font-medium flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-400" />
                        <span>Hotspot Ring 1</span>
                      </div>
                      <div className="font-mono font-bold text-amber-300 text-[11px] sm:text-xs mt-0.5">
                        {summary.criticalCount} Titik Api
                      </div>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2 col-span-2 sm:col-span-1">
                      <div className="text-[10px] text-slate-400 uppercase font-medium flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-red-400" />
                        <span>Radiasi Panas (FRP)</span>
                      </div>
                      <div className="font-mono font-bold text-red-300 text-[11px] sm:text-xs mt-0.5">
                        {summary.maxFrpMw.toFixed(1)} MW
                      </div>
                    </div>
                  </div>

                  {/* Peatland / Gambut Warning Flag if applicable */}
                  {summary.peatlandHotspotsCount !== undefined && summary.peatlandHotspotsCount > 0 && (
                    <div className="bg-amber-950/60 border border-amber-800/80 rounded-lg px-2.5 py-1.5 text-[11px] text-amber-200 flex items-center gap-1.5 font-sans">
                      <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>
                        <strong>Lahan Gambut Aktif:</strong> {summary.peatlandHotspotsCount} titik api berada di atas gambut. Waspada asap tebal melintasi runway.
                      </span>
                    </div>
                  )}

                  {/* Nearest Hotspot Acquisition timestamp if available */}
                  {nearestHotspot && (
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>
                        Satelit {nearestHotspot.satellite} · Deteksi {formatFirmsUtcToWib(nearestHotspot.acq_date, nearestHotspot.acq_time).fullWibString}
                      </span>
                    </div>
                  )}

                  {/* Quick Tactical Action Buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                    <button
                      onClick={() => {
                        onClose();
                        onSelectBase(base);
                      }}
                      className="flex-1 py-1.5 sm:py-2 px-3 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-red-950 transition-colors cursor-pointer"
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                      <span>Fokus di Peta</span>
                    </button>

                    <button
                      onClick={() => {
                        onOpenDetailModal(summary);
                      }}
                      className="flex-1 py-1.5 sm:py-2 px-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-100 font-semibold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-sky-400" />
                      <span>Detail SOP &amp; NOTAM</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="text-[11px]">
            Sistem Peringatan Dini Karhutla Mabesau
          </span>
          <div className="flex items-center gap-2">
            {onOpenReport && (
              <button
                onClick={() => {
                  onClose();
                  onOpenReport();
                }}
                className="text-[11px] text-sky-400 hover:underline cursor-pointer"
              >
                Ekspor SITREP
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
