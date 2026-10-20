import React from 'react';
import { Volume2, VolumeX, AlertTriangle, Flame, ShieldAlert, CheckCircle2, ChevronRight, BellRing } from 'lucide-react';
import { BaseThreatSummary, LanudBase } from '../types';

interface AlarmHUDProps {
  criticalSummaries: BaseThreatSummary[];
  warningSummaries: BaseThreatSummary[];
  isAlarmPlaying: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onTestAlarm: () => void;
  onSelectBase: (base: LanudBase) => void;
  onOpenReport: () => void;
}

export const AlarmHUD: React.FC<AlarmHUDProps> = ({
  criticalSummaries,
  warningSummaries,
  isAlarmPlaying,
  isMuted,
  onToggleMute,
  onTestAlarm,
  onSelectBase,
  onOpenReport,
}) => {
  const hasCritical = criticalSummaries.length > 0;
  const hasWarning = warningSummaries.length > 0;

  if (hasCritical) {
    const highestThreatBase = criticalSummaries[0];
    return (
      <div className="bg-red-950/90 border-b border-red-600/80 px-4 py-3 text-red-100 shadow-2xl relative overflow-hidden">
        {/* Subtle red flashing border cue */}
        <div className="absolute inset-0 bg-red-600/10 pointer-events-none animate-pulse" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-900/50 animate-bounce">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-red-600 text-white font-bold text-xs uppercase px-2 py-0.5 rounded tracking-wider">
                  ALARM RING 1 AKTIF
                </span>
                <span className="font-semibold text-sm text-red-200">
                  {criticalSummaries.length} Pangkalan/Obvit Dalam Zona Bahaya (&le; 5 KM)
                </span>
              </div>
              <p className="text-xs text-red-300 mt-0.5">
                Titik api terdeteksi mendekati <strong>{highestThreatBase.base.name}</strong> (jarak{' '}
                <span className="font-mono font-bold text-white">
                  {highestThreatBase.nearestHotspotDistanceKm} km
                </span>
                , radiasi daya <span className="font-mono">{highestThreatBase.maxFrpMw.toFixed(1)} MW</span>).
                Aktifkan protokol PKP-PK pangkalan!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            {/* Quick base focus button */}
            <button
              onClick={() => onSelectBase(highestThreatBase.base)}
              className="px-3 py-1.5 text-xs font-semibold bg-red-800/80 hover:bg-red-700 text-white rounded-md border border-red-600/60 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>Fokus {highestThreatBase.base.code}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Siren Mute / Unmute */}
            <button
              onClick={onToggleMute}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 border ${
                isMuted
                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  : 'bg-red-600 text-white border-red-500 hover:bg-red-500 shadow-md animate-pulse'
              }`}
              title={isMuted ? 'Nyalakan Sirene Audio' : 'Senyapkan Sirene'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-white" />}
              <span>{isMuted ? 'Sirene Disenyapkan' : 'Sirene Berbunyi'}</span>
            </button>

            {/* SITREP Report */}
            <button
              onClick={onOpenReport}
              className="px-3 py-1.5 text-xs font-medium bg-slate-900/80 hover:bg-slate-800 text-slate-200 rounded-md border border-slate-700 transition-colors"
            >
              Laporan Situasi (SITREP)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (hasWarning) {
    const warningBase = warningSummaries[0];
    return (
      <div className="bg-amber-950/70 border-b border-amber-600/60 px-4 py-2.5 text-amber-100 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-600/90 flex items-center justify-center text-white shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-600 text-slate-950 font-bold text-[11px] uppercase px-2 py-0.5 rounded tracking-wide">
                  PERINGATAN WASPADA
                </span>
                <span className="font-semibold text-xs text-amber-200">
                  {warningSummaries.length} Pangkalan Dalam Ring 2 (5 - 15 KM)
                </span>
              </div>
              <p className="text-xs text-amber-300 mt-0.5">
                Titik api aktif terdeteksi {warningBase.nearestHotspotDistanceKm} km dari{' '}
                <strong>{warningBase.base.name}</strong>. Waspadai arah sebaran asap terhadap arah landasan (runway).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <button
              onClick={() => onSelectBase(warningBase.base)}
              className="px-3 py-1.5 text-xs font-semibold bg-amber-700/80 hover:bg-amber-600 text-white rounded-md border border-amber-500/50 transition-colors flex items-center gap-1"
            >
              <span>Fokus {warningBase.base.code}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onTestAlarm}
              className="px-3 py-1.5 text-xs font-medium bg-slate-900/80 hover:bg-slate-800 text-slate-200 rounded-md border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-400" />
              <span>Uji Sirene</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Nominal Safe State
  return (
    <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 text-slate-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-slate-200 font-medium">
            STATUS OPERASIONAL: <strong className="text-emerald-400">SIAGA NORMAL</strong>
          </span>
          <span className="hidden sm:inline text-slate-500">·</span>
          <span className="hidden sm:inline text-slate-400">
            Seluruh pangkalan TNI AU aman dari kebakaran Ring 1 (&le; 5 km).
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onTestAlarm}
            className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 rounded border border-slate-700/60"
          >
            <BellRing className="w-3 h-3 text-amber-400" />
            <span>Tes Sirene Audio</span>
          </button>
          <button
            onClick={onOpenReport}
            className="text-[11px] text-slate-300 hover:text-white transition-colors bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 rounded border border-slate-700/60"
          >
            Buka SITREP
          </button>
        </div>
      </div>
    </div>
  );
};
