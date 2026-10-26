import React from 'react';
import {
  Flame,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Eye,
  Radio,
  Compass,
} from 'lucide-react';
import { BaseThreatSummary, LanudBase } from '../types';

interface ThreatsListViewProps {
  threatSummaries: BaseThreatSummary[];
  onSelectBase: (base: LanudBase) => void;
  onOpenDetailModal: (summary: BaseThreatSummary) => void;
}

export const ThreatsListView: React.FC<ThreatsListViewProps> = ({
  threatSummaries,
  onSelectBase,
  onOpenDetailModal,
}) => {
  const activeThreats = threatSummaries.filter((s) => s.threatLevel !== 'SAFE');

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-white">Daftar Pangkalan & Obvit Dalam Status Ancaman Titik Api</h2>
          <p className="text-xs text-slate-400">
            Diurutkan berdasarkan tingkat keparahan ancaman dan jarak titik api terdekat dari perimeter pangkalan.
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-300 font-mono-numbers bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg self-start sm:self-auto">
          {activeThreats.length} Pangkalan Terdampak
        </span>
      </div>

      {/* Mobile Card List (< md) */}
      <div className="md:hidden space-y-3">
        {activeThreats.map((s) => {
          const isCrit = s.threatLevel === 'CRITICAL';
          const isWarn = s.threatLevel === 'WARNING';
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
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white">{s.base.name}</h3>
                    <span className="font-mono text-[10px] text-sky-400 bg-sky-950 px-1.5 py-0.2 rounded border border-sky-800">
                      {s.base.code}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {s.base.type} · {s.base.koopsud} · Prov. {s.base.province}
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

              {/* Metric stats */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-center font-mono-numbers">
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">Api Terdekat</span>
                  <span className={`text-xs font-bold ${isCrit ? 'text-red-400' : isWarn ? 'text-amber-400' : 'text-slate-200'}`}>
                    {s.nearestHotspotDistanceKm} km
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">FRP Maks</span>
                  <span className="text-xs font-bold text-amber-300">{s.maxFrpMw.toFixed(1)} MW</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">Total &le;30km</span>
                  <span className="text-xs font-bold text-sky-300">{s.totalHotspotsNear} Titik</span>
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
                <th className="py-3 px-4">Pangkalan / Obvit</th>
                <th className="py-3 px-4">Komando Operasi</th>
                <th className="py-3 px-4">Status Ancaman</th>
                <th className="py-3 px-4 text-right">Jarak Terdekat</th>
                <th className="py-3 px-4 text-right">FRP Maks (MW)</th>
                <th className="py-3 px-4 text-right">Titik Api &le;30km</th>
                <th className="py-3 px-4 text-right">Aksi Komando</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono-numbers">
              {activeThreats.map((s) => {
                const isCrit = s.threatLevel === 'CRITICAL';
                const isWarn = s.threatLevel === 'WARNING';
                return (
                  <tr
                    key={s.base.id}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                    onClick={() => onOpenDetailModal(s)}
                  >
                    <td className="py-3 px-4 font-sans">
                      <div className="font-bold text-white text-sm">{s.base.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {s.base.code} · {s.base.city}, {s.base.province}
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
                      {s.nearestHotspotDistanceKm} km
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-amber-400">
                      {s.maxFrpMw.toFixed(1)} MW
                    </td>
                    <td className="py-3 px-4 text-right text-slate-200">
                      {s.totalHotspotsNear} Titik
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
