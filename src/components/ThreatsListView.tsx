import React from 'react';
import { Flame, ShieldAlert, AlertTriangle, CheckCircle2, ChevronRight, Eye, Radio } from 'lucide-react';
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
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-950/60 border border-emerald-600/40 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-xl">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Seluruh Pangkalan TNI AU Berada Dalam Radius Aman</h3>
        <p className="text-xs text-slate-400 max-w-lg mx-auto mb-6 leading-relaxed">
          Berdasarkan data observasi satelit NASA FIRMS terkini, tidak ada titik api aktif terdeteksi dalam zona perimeter 30 km dari 107 pangkalan maupun obyek vital TNI AU di seluruh wilayah Indonesia.
        </p>
        <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-xs text-emerald-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>Sistem Pemantauan Otomatis Satelit NASA FIRMS Siaga Aktif</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Daftar Pangkalan & Obvit Dalam Status Ancaman Titik Api</h2>
          <p className="text-xs text-slate-400">
            Diurutkan berdasarkan tingkat keparahan ancaman dan jarak titik api terdekat dari perimeter pangkalan.
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-300 font-mono-numbers bg-slate-900 border border-slate-800 px-3 py-1 rounded-md">
          {activeThreats.length} Pangkalan Terdampak
        </span>
      </div>

      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 shadow-xl">
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
                          className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white rounded border border-slate-700 transition-colors flex items-center gap-1"
                          title="Tampilkan di Peta Situasi"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Peta</span>
                        </button>
                        <button
                          onClick={() => onOpenDetailModal(s)}
                          className="px-2.5 py-1 text-[11px] bg-sky-600 hover:bg-sky-500 text-white rounded font-medium transition-colors"
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
