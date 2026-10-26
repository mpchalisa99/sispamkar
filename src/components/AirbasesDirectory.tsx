import React, { useState } from 'react';
import { Search, MapPin, Plane, Radio, Wrench, Shield, ExternalLink, ChevronRight } from 'lucide-react';
import { LanudBase, BaseThreatSummary } from '../types';

interface AirbasesDirectoryProps {
  bases: LanudBase[];
  threatSummaries: BaseThreatSummary[];
  onSelectBase: (base: LanudBase) => void;
  onOpenDetailModal: (summary: BaseThreatSummary) => void;
}

export const AirbasesDirectory: React.FC<AirbasesDirectoryProps> = ({
  bases,
  threatSummaries,
  onSelectBase,
  onOpenDetailModal,
}) => {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const summaryMap = new Map<string, BaseThreatSummary>();
  threatSummaries.forEach((s) => summaryMap.set(s.base.id, s));

  const filteredBases = bases.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase()) ||
      b.city.toLowerCase().includes(search.toLowerCase()) ||
      b.province.toLowerCase().includes(search.toLowerCase());

    const matchesType =
      selectedType === 'ALL' ||
      (selectedType === 'LANUD' && b.type.startsWith('Lanud')) ||
      (selectedType === 'RADAR' && b.type === 'Satuan Radar') ||
      (selectedType === 'DEPOHAR' && b.type === 'Depo Pemeliharaan') ||
      (selectedType === 'KOPASGAT' && b.type === 'Kopasgat') ||
      (selectedType === 'DETASEMEN' && b.type === 'Detasemen') ||
      (selectedType === 'SATRUDAL' && b.type === 'Satuan Rudal') ||
      (selectedType === 'MABESAU' && b.type === 'Mabesau / Lemdik') ||
      (selectedType === 'AWR' && b.type === 'Air Weapon Range');

    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto p-3.5 sm:p-6 space-y-4 pb-24 md:pb-6">
      {/* Directory Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white">Direktori Pangkalan & Obyek Vital TNI AU</h2>
          <p className="text-xs text-slate-400">
            Daftar lengkap pangkalan udara Lanud Tipe A, B, C, Satuan Radar, Depohar, Kopasgat, Detasemen, dan AWR di seluruh wilayah Indonesia.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama pangkalan / kota..."
              className="w-full bg-slate-900 border border-slate-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">Semua Kategori ({bases.length})</option>
            <option value="LANUD">Pangkalan Udara / Lanud</option>
            <option value="RADAR">Satuan Radar (Satrad)</option>
            <option value="DEPOHAR">Depo Pemeliharaan (Depohar)</option>
            <option value="KOPASGAT">Kopasgat / Pasukan Khusus</option>
            <option value="DETASEMEN">Detasemen TNI AU</option>
            <option value="SATRUDAL">Satuan Rudal (Satrudal)</option>
            <option value="AWR">Air Weapon Range (AWR)</option>
            <option value="MABESAU">Mabesau & Lemdik</option>
          </select>
        </div>
      </div>

      {/* Grid of Bases */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredBases.map((base) => {
          const summary = summaryMap.get(base.id);
          const threat = summary ? summary.threatLevel : 'SAFE';

          const isCrit = threat === 'CRITICAL';
          const isWarn = threat === 'WARNING';
          const isAdvisory = threat === 'ADVISORY';

          return (
            <div
              key={base.id}
              className={`bg-slate-900/80 border rounded-xl p-4 transition-all hover:border-slate-600 flex flex-col justify-between ${
                isCrit
                  ? 'border-red-600/70 shadow-lg shadow-red-950/40 bg-red-950/10'
                  : isWarn
                  ? 'border-amber-600/60 bg-amber-950/10'
                  : 'border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      {base.type} · {base.koopsud}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-0.5">{base.name}</h3>
                    <span className="font-mono text-[11px] text-sky-400 font-semibold">{base.code}</span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isCrit
                        ? 'bg-red-950 text-red-400 border border-red-800 animate-pulse'
                        : isWarn
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : isAdvisory
                        ? 'bg-blue-950 text-blue-400 border border-blue-800'
                        : 'bg-emerald-950/80 text-emerald-400 border border-emerald-900'
                    }`}
                  >
                    {isCrit
                      ? '🔴 BAHAYA'
                      : isWarn
                      ? '🟠 WASPADA'
                      : isAdvisory
                      ? '🔵 SIAGA'
                      : '🟢 AMAN'}
                  </span>
                </div>

                <div className="space-y-1 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 mb-3">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>{base.city}, {base.province}</span>
                  </div>
                  {base.runwayOrientation && (
                    <div className="flex items-center gap-1.5">
                      <Plane className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>Runway: {base.runwayOrientation} ({base.runwayLengthM}m)</span>
                    </div>
                  )}
                  <div className="text-[11px] text-slate-400 line-clamp-2">
                    {base.assetsSummary}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="font-mono-numbers text-[11px]">
                  {summary && summary.nearestHotspotDistanceKm !== null ? (
                    <span className={isCrit ? 'text-red-400 font-bold' : 'text-slate-300'}>
                      Api: {summary.nearestHotspotDistanceKm} km
                    </span>
                  ) : (
                    <span className="text-slate-500">Bebas Api (&gt;30km)</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onSelectBase(base)}
                    className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-sky-400 rounded transition-colors"
                  >
                    Peta
                  </button>
                  {summary && (
                    <button
                      onClick={() => onOpenDetailModal(summary)}
                      className="px-2.5 py-1 text-[11px] bg-sky-600 hover:bg-sky-500 text-white font-medium rounded transition-colors"
                    >
                      Detail
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
