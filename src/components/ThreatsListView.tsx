import React, { useState, useMemo } from 'react';
import {
  Flame,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Eye,
  Radio,
  Compass,
  Plane,
  Truck,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { BaseThreatSummary, LanudBase } from '../types';
import { getCompassDirection } from '../utils/geoMath';

interface ThreatsListViewProps {
  threatSummaries: BaseThreatSummary[];
  onSelectBase: (base: LanudBase) => void;
  onOpenDetailModal: (summary: BaseThreatSummary) => void;
  onOpenRing1Drawer?: () => void;
}

export const ThreatsListView: React.FC<ThreatsListViewProps> = ({
  threatSummaries,
  onSelectBase,
  onOpenDetailModal,
  onOpenRing1Drawer,
}) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'RING1' | 'RING2'>('ALL');

  // Filter out SAFE bases
  const activeThreats = useMemo(() => {
    return threatSummaries.filter((s) => s.threatLevel !== 'SAFE');
  }, [threatSummaries]);

  // Ring 1 threats sorted ascending by nearest hotspot distance
  const ring1Threats = useMemo(() => {
    return activeThreats
      .filter((s) => s.threatLevel === 'CRITICAL')
      .sort((a, b) => (a.nearestHotspotDistanceKm ?? 999) - (b.nearestHotspotDistanceKm ?? 999));
  }, [activeThreats]);

  // Ring 2 threats sorted ascending by nearest hotspot distance
  const ring2Threats = useMemo(() => {
    return activeThreats
      .filter((s) => s.threatLevel === 'WARNING')
      .sort((a, b) => (a.nearestHotspotDistanceKm ?? 999) - (b.nearestHotspotDistanceKm ?? 999));
  }, [activeThreats]);

  // Displayed list based on active filter mode
  const displayedThreats = useMemo(() => {
    if (filterMode === 'RING1') {
      return ring1Threats;
    }
    if (filterMode === 'RING2') {
      return ring2Threats;
    }
    // Default: Sort by severity (CRITICAL first, then WARNING, then ADVISORY) and then distance ascending
    return [...activeThreats].sort((a, b) => {
      const order = { CRITICAL: 0, WARNING: 1, ADVISORY: 2, SAFE: 3 };
      const diff = order[a.threatLevel] - order[b.threatLevel];
      if (diff !== 0) return diff;
      return (a.nearestHotspotDistanceKm ?? 999) - (b.nearestHotspotDistanceKm ?? 999);
    });
  }, [filterMode, ring1Threats, ring2Threats, activeThreats]);

  if (activeThreats.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 sm:py-16 px-4 text-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-950/60 border border-emerald-600/40 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-xl">
          <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-white mb-2">
          Seluruh Pangkalan TNI AU Berada Dalam Radius Aman
        </h3>
        <p className="text-xs text-slate-400 max-w-lg mx-auto mb-6 leading-relaxed">
          Berdasarkan data observasi satelit terkini, tidak ada titik api aktif terdeteksi dalam zona perimeter 30 km dari pangkalan maupun obyek vital TNI AU di seluruh wilayah Indonesia.
        </p>
        <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-xs text-emerald-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>Sistem Pemantauan Otomatis Siaga Aktif</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-3.5 sm:p-6 space-y-4 pb-20 md:pb-6">
      {/* Top Banner if Ring 1 Threats exist */}
      {ring1Threats.length > 0 && (
        <div className="bg-gradient-to-r from-red-950/95 via-red-900/50 to-slate-950 border border-red-600/80 rounded-2xl p-3.5 sm:p-4 text-red-100 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0 shadow-md animate-pulse">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-red-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  RING 1 BAHAYA AKTIF
                </span>
                <span className="font-bold text-sm text-white">
                  {ring1Threats.length} Satuan / Obyek Vital TNI AU
                </span>
              </div>
              <p className="text-xs text-red-200 mt-0.5">
                Titik api terdekat: <strong>{ring1Threats[0].base.name} ({ring1Threats[0].nearestHotspotDistanceKm} km)</strong>. Diurutkan dari yang terdekat ke terjauh.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenRing1Drawer && (
              <button
                onClick={onOpenRing1Drawer}
                className="px-3 py-1.5 bg-white hover:bg-slate-200 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                <span>Buka Rincian Satuan Ring 1</span>
              </button>
            )}
            <button
              onClick={() => setFilterMode(filterMode === 'RING1' ? 'ALL' : 'RING1')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                filterMode === 'RING1'
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-red-950/80 text-red-200 border-red-700 hover:bg-red-900'
              }`}
            >
              {filterMode === 'RING1' ? '✓ Filter Ring 1 Aktif' : 'Fokus Ring 1'}
            </button>
          </div>
        </div>
      )}

      {/* Main Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Daftar Satuan &amp; Pangkalan Terancam Karhutla</span>
          </h2>
          <p className="text-xs text-slate-400">
            Daftar satuan operasional, alutsista pesawat tempur/angkut/radar, dan jarak titik api terdekat dari perimeter pangkalan.
          </p>
        </div>

        {/* Filter Quick Pills */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              filterMode === 'ALL'
                ? 'bg-sky-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua ({activeThreats.length})
          </button>
          <button
            onClick={() => setFilterMode('RING1')}
            className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
              filterMode === 'RING1'
                ? 'bg-red-600 text-white font-bold'
                : 'text-red-400 hover:text-red-300'
            }`}
          >
            <span>Ring 1 Terdekat ({ring1Threats.length})</span>
          </button>
          <button
            onClick={() => setFilterMode('RING2')}
            className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
              filterMode === 'RING2'
                ? 'bg-amber-600 text-white font-bold'
                : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            <span>Ring 2 ({ring2Threats.length})</span>
          </button>
        </div>
      </div>

      {/* Mobile Card List (< md) */}
      <div className="md:hidden space-y-3.5">
        {displayedThreats.map((s, idx) => {
          const isCrit = s.threatLevel === 'CRITICAL';
          const isWarn = s.threatLevel === 'WARNING';
          const nearestHotspot = s.nearestHotspot;
          const bearing = nearestHotspot?.bearingDeg;
          const direction = bearing !== undefined ? getCompassDirection(bearing) : '';

          return (
            <div
              key={s.base.id}
              className={`bg-slate-900/90 border rounded-2xl p-4 shadow-xl flex flex-col gap-3 transition-colors ${
                isCrit
                  ? 'border-red-600/80 bg-red-950/20'
                  : isWarn
                  ? 'border-amber-600/70 bg-amber-950/15'
                  : 'border-blue-700/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {filterMode === 'RING1' && (
                      <span className="w-5 h-5 rounded-md bg-red-600 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                    )}
                    <h3 className="font-bold text-sm text-white truncate">{s.base.name}</h3>
                    <span className="font-mono text-[10px] text-sky-400 bg-sky-950 px-1.5 py-0.2 rounded border border-sky-800 shrink-0">
                      {s.base.code}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {s.base.type} · {s.base.koopsud} · {s.base.city}, {s.base.province}
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1 ${
                    isCrit
                      ? 'bg-red-950 text-red-300 border border-red-700 animate-pulse'
                      : isWarn
                      ? 'bg-amber-950 text-amber-300 border border-amber-700'
                      : 'bg-blue-950 text-blue-300 border border-blue-700'
                  }`}
                >
                  {isCrit ? 'RING 1 BAHAYA' : isWarn ? 'RING 2 WASPADA' : 'RING 3 SIAGA'}
                </span>
              </div>

              {/* Satuan & Aset Breakdown */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 text-xs space-y-1.5">
                <div className="flex items-start gap-1.5">
                  <Plane className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider block">
                      Satuan &amp; Alutsista:
                    </span>
                    <span className="text-slate-100 font-semibold leading-snug">
                      {s.base.assetsSummary}
                    </span>
                  </div>
                </div>

                {s.base.pkpPkUnits && (
                  <div className="flex items-start gap-1.5 pt-1 border-t border-slate-900 text-[11px]">
                    <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-slate-300">
                      <strong>PKP-PK:</strong> {s.base.pkpPkUnits}
                    </span>
                  </div>
                )}
              </div>

              {/* Metric stats */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-center font-mono-numbers">
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">Jarak Terdekat</span>
                  <span className={`text-xs font-bold ${isCrit ? 'text-red-400' : isWarn ? 'text-amber-400' : 'text-slate-200'}`}>
                    {s.nearestHotspotDistanceKm} km
                  </span>
                  {bearing !== undefined && (
                    <span className="text-[9px] text-slate-500 font-sans block mt-0.5">
                      {direction}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">FRP Maks</span>
                  <span className="text-xs font-bold text-amber-300">{s.maxFrpMw.toFixed(1)} MW</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">
                    {isCrit ? 'Titik Ring 1' : 'Total ≤30km'}
                  </span>
                  <span className="text-xs font-bold text-sky-300">
                    {isCrit ? `${s.criticalCount} Titik` : `${s.totalHotspotsNear} Titik`}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                <button
                  onClick={() => onSelectBase(s.base)}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Lihat di Peta</span>
                </button>
                <button
                  onClick={() => onOpenDetailModal(s)}
                  className="py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Detail SOP</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table (>= md) */}
      <div className="hidden md:block border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-800">
            <thead className="bg-slate-950 text-slate-400 text-[11px]">
              <tr>
                <th className="py-3 px-4">Pangkalan &amp; Satuan / Alutsista</th>
                <th className="py-3 px-4">Komando Operasi</th>
                <th className="py-3 px-4">Status Ancaman</th>
                <th className="py-3 px-4 text-right">Jarak Terdekat</th>
                <th className="py-3 px-4 text-right">FRP Maks (MW)</th>
                <th className="py-3 px-4 text-right">Titik Api</th>
                <th className="py-3 px-4 text-right">Aksi Komando</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono-numbers">
              {displayedThreats.map((s, idx) => {
                const isCrit = s.threatLevel === 'CRITICAL';
                const isWarn = s.threatLevel === 'WARNING';
                return (
                  <tr
                    key={s.base.id}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                    onClick={() => onOpenDetailModal(s)}
                  >
                    <td className="py-3 px-4 font-sans">
                      <div className="flex items-center gap-2">
                        {filterMode === 'RING1' && (
                          <span className="w-5 h-5 rounded bg-red-600 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                        )}
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-1.5">
                            <span>{s.base.name}</span>
                            <span className="font-mono text-[10px] text-sky-400 bg-sky-950 px-1 py-0.2 rounded border border-sky-800">
                              {s.base.code}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {s.base.city}, {s.base.province}
                          </div>
                          <div className="text-[11px] text-sky-300 font-semibold mt-1 flex items-center gap-1">
                            <Plane className="w-3 h-3 text-sky-400 shrink-0" />
                            <span>{s.base.assetsSummary}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300">
                      <div>{s.base.koopsud}</div>
                      <div className="text-[10px] text-slate-500">{s.base.type}</div>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 ${
                          isCrit
                            ? 'bg-red-950 text-red-300 border border-red-700/80 animate-pulse'
                            : isWarn
                            ? 'bg-amber-950 text-amber-300 border border-amber-700/80'
                            : 'bg-blue-950 text-blue-300 border border-blue-700/80'
                        }`}
                      >
                        {isCrit ? (
                          <>
                            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                            <span>BAHAYA (&le; 5 KM)</span>
                          </>
                        ) : isWarn ? (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            <span>WASPADA (5-15 KM)</span>
                          </>
                        ) : (
                          <span>SIAGA (15-30 KM)</span>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-white text-sm">
                      <span className={isCrit ? 'text-red-400' : isWarn ? 'text-amber-400' : 'text-white'}>
                        {s.nearestHotspotDistanceKm} km
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-amber-400">
                      {s.maxFrpMw.toFixed(1)} MW
                    </td>
                    <td className="py-3 px-4 text-right text-slate-200">
                      {isCrit ? `${s.criticalCount} Ring 1` : `${s.totalHotspotsNear} Titik`}
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectBase(s.base)}
                          className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white rounded border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Tampilkan di Peta Situasi"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Peta</span>
                        </button>
                        <button
                          onClick={() => onOpenDetailModal(s)}
                          className="px-2.5 py-1 text-[11px] bg-sky-600 hover:bg-sky-500 text-white rounded font-medium transition-colors cursor-pointer"
                        >
                          Detail SOP
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
