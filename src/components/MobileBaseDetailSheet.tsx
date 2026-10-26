import React from 'react';
import { X, Shield, ChevronRight, Flame, MapPin, Radio, Compass, ExternalLink } from 'lucide-react';
import { BaseThreatSummary, LanudBase } from '../types';

interface MobileBaseDetailSheetProps {
  summary: BaseThreatSummary | null;
  onClose: () => void;
  onOpenModal: (summary: BaseThreatSummary) => void;
  onFocusBase: (base: LanudBase) => void;
}

export const MobileBaseDetailSheet: React.FC<MobileBaseDetailSheetProps> = ({
  summary,
  onClose,
  onOpenModal,
  onFocusBase,
}) => {
  if (!summary) return null;

  const { base, threatLevel, nearestHotspotDistanceKm, maxFrpMw, totalHotspotsNear } = summary;

  const isCrit = threatLevel === 'CRITICAL';
  const isWarn = threatLevel === 'WARNING';
  const isAdvisory = threatLevel === 'ADVISORY';

  return (
    <div className="absolute bottom-2 sm:bottom-4 left-2 right-2 sm:left-4 sm:right-auto sm:w-96 z-40 bg-slate-900/95 backdrop-blur-md border border-slate-700/90 rounded-2xl p-3.5 sm:p-4 shadow-2xl text-xs text-white animate-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shrink-0 shadow-md ${
              isCrit
                ? 'bg-red-600 shadow-red-900/50 animate-pulse'
                : isWarn
                ? 'bg-amber-600'
                : isAdvisory
                ? 'bg-blue-600'
                : 'bg-emerald-600'
            }`}
          >
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-sm text-white leading-tight">{base.name}</h4>
              <span className="font-mono text-[10px] text-sky-400 bg-sky-950 px-1.5 py-0.2 rounded border border-sky-800">
                {base.code}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {base.type} · Prov. {base.province}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Threat Summary Status */}
      <div className="grid grid-cols-2 gap-2 mb-3 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
        <div>
          <span className="text-[10px] text-slate-400">Status Ancaman</span>
          <div className="font-bold text-xs flex items-center gap-1.5 mt-0.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isCrit ? 'bg-red-500 animate-ping' : isWarn ? 'bg-amber-500' : isAdvisory ? 'bg-blue-500' : 'bg-emerald-500'
              }`}
            />
            <span
              className={
                isCrit
                  ? 'text-red-400 font-extrabold'
                  : isWarn
                  ? 'text-amber-400 font-bold'
                  : isAdvisory
                  ? 'text-blue-400 font-bold'
                  : 'text-emerald-400 font-bold'
              }
            >
              {isCrit
                ? 'RING 1: BAHAYA'
                : isWarn
                ? 'RING 2: WASPADA'
                : isAdvisory
                ? 'RING 3: SIAGA'
                : 'ZONA AMAN'}
            </span>
          </div>
        </div>

        <div>
          <span className="text-[10px] text-slate-400">Titik Api Terdekat</span>
          <div className="font-bold text-xs mt-0.5 font-mono">
            {nearestHotspotDistanceKm !== null ? (
              <span className={isCrit ? 'text-red-400' : isWarn ? 'text-amber-400' : 'text-slate-200'}>
                {nearestHotspotDistanceKm} km
              </span>
            ) : (
              <span className="text-emerald-400">Bebas Api (&gt;30km)</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onFocusBase(base)}
          className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          <span>Fokus Peta</span>
        </button>

        <button
          onClick={() => onOpenModal(summary)}
          className="py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
        >
          <span>Detail SOP & NOTAM</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
