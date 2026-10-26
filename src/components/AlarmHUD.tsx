import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  AlertTriangle,
  Flame,
  ShieldAlert,
  CheckCircle2,
  ChevronRight,
  BellRing,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
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
  onOpenRing1List?: () => void;
  isFullMap?: boolean;
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
  onOpenRing1List,
  isFullMap = false,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const hasCritical = criticalSummaries.length > 0;
  const hasWarning = warningSummaries.length > 0;

  // In full map mode, if safe, hide completely to maximize full map
  if (isFullMap && !hasCritical && !hasWarning) {
    return null;
  }

  // Full Map Mode Floating Ticker for Threats
  if (isFullMap && (hasCritical || hasWarning)) {
    const highestThreatBase = hasCritical ? criticalSummaries[0] : warningSummaries[0];
    const isCrit = hasCritical;

    return (
      <div className="absolute top-14 left-2 right-2 sm:left-4 sm:right-auto sm:max-w-md z-30 pointer-events-auto">
        <div
          className={`backdrop-blur-md rounded-2xl p-2.5 sm:p-3 text-xs shadow-2xl border flex items-center justify-between gap-2.5 animate-pulse ${
            isCrit
              ? 'bg-red-950/95 border-red-600 text-red-100 shadow-red-950/60'
              : 'bg-amber-950/95 border-amber-600 text-amber-100 shadow-amber-950/60'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white ${
                isCrit ? 'bg-red-600' : 'bg-amber-600'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="font-bold text-[11px] uppercase tracking-wide truncate">
                {isCrit ? 'ALARM RING 1' : 'WASPADA RING 2'}: {highestThreatBase.base.name}
              </div>
              <div className="text-[10px] opacity-90 truncate">
                Jarak: <strong>{highestThreatBase.nearestHotspotDistanceKm} km</strong> · FRP: {highestThreatBase.maxFrpMw.toFixed(1)} MW
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenRing1List && isCrit && (
              <button
                onClick={onOpenRing1List}
                className="px-2.5 py-1 text-[11px] font-bold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                title="Daftar Satuan & Aset Ring 1 (Urut Terdekat)"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Satuan ({criticalSummaries.length})</span>
              </button>
            )}
            <button
              onClick={() => onSelectBase(highestThreatBase.base)}
              className="px-2.5 py-1 text-[11px] font-bold bg-white text-slate-950 rounded-lg hover:bg-slate-200 transition-colors shadow-xs"
            >
              Fokus
            </button>
            <button
              onClick={onToggleMute}
              className="p-1 rounded-lg bg-black/40 hover:bg-black/60 text-white"
              title={isMuted ? 'Nyalakan Sirene' : 'Senyapkan Sirene'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-300" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Standard Mode: Critical Threat Active
  if (hasCritical) {
    const highestThreatBase = criticalSummaries[0];
    return (
      <div className="bg-red-950/95 border-b border-red-600 px-3 sm:px-4 py-2 sm:py-3 text-red-100 shadow-2xl relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-red-600/10 pointer-events-none animate-pulse" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 relative z-10">
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-900/50 animate-bounce mt-0.5 sm:mt-0">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-red-600 text-white font-bold text-[10px] sm:text-xs uppercase px-1.5 sm:px-2 py-0.5 rounded tracking-wider">
                  ALARM RING 1 AKTIF
                </span>
                <span className="font-semibold text-xs sm:text-sm text-red-200">
                  {criticalSummaries.length} Pangkalan Dalam Zona Bahaya (&le; 5 KM)
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-red-300 mt-0.5 leading-tight">
                Titik api mendekati <strong>{highestThreatBase.base.name}</strong> (jarak{' '}
                <span className="font-mono font-bold text-white">
                  {highestThreatBase.nearestHotspotDistanceKm} km
                </span>
                , radiasi daya <span className="font-mono">{highestThreatBase.maxFrpMw.toFixed(1)} MW</span>).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto flex-wrap">
            {onOpenRing1List && (
              <button
                onClick={onOpenRing1List}
                className="px-2.5 sm:px-3 py-1.5 text-xs font-bold bg-white text-slate-950 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-md cursor-pointer animate-pulse"
                title="Daftar Satuan & Aset Ring 1 (Diurutkan dari Api Terdekat)"
              >
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <span>Daftar Satuan Ring 1 ({criticalSummaries.length})</span>
              </button>
            )}

            <button
              onClick={() => onSelectBase(highestThreatBase.base)}
              className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold bg-red-800 hover:bg-red-700 text-white rounded-lg border border-red-600/60 transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <span>Fokus {highestThreatBase.base.code}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onToggleMute}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 border cursor-pointer ${
                isMuted
                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  : 'bg-red-600 text-white border-red-500 hover:bg-red-500 shadow-md animate-pulse'
              }`}
              title={isMuted ? 'Nyalakan Sirene Audio' : 'Senyapkan Sirene'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-white" />}
              <span className="hidden xs:inline">{isMuted ? 'Sirene Senyap' : 'Sirene Berbunyi'}</span>
            </button>

            <button
              onClick={onOpenReport}
              className="hidden sm:inline-block px-3 py-1.5 text-xs font-medium bg-slate-900/80 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              SITREP
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Standard Mode: Warning Threat Active
  if (hasWarning) {
    const warningBase = warningSummaries[0];
    return (
      <div className="bg-amber-950/80 border-b border-amber-600/60 px-3 sm:px-4 py-2 sm:py-2.5 text-amber-100 shadow-md shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-600/90 flex items-center justify-center text-white shrink-0">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-amber-600 text-slate-950 font-bold text-[10px] sm:text-[11px] uppercase px-1.5 py-0.5 rounded tracking-wide">
                  PERINGATAN WASPADA
                </span>
                <span className="font-semibold text-xs text-amber-200">
                  {warningSummaries.length} Pangkalan Dalam Ring 2 (5 - 15 KM)
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-amber-300 mt-0.5 leading-tight">
                Titik api aktif terdeteksi {warningBase.nearestHotspotDistanceKm} km dari{' '}
                <strong>{warningBase.base.name}</strong>. Waspadai arah sebaran asap.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <button
              onClick={() => onSelectBase(warningBase.base)}
              className="px-2.5 py-1.5 text-xs font-semibold bg-amber-700 hover:bg-amber-600 text-white rounded-lg border border-amber-500/50 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Fokus {warningBase.base.code}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onTestAlarm}
              className="px-2.5 py-1.5 text-xs font-medium bg-slate-900/80 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xs:inline">Uji Sirene</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Nominal Safe State (hidden on small mobile screens to conserve map space, or visible as single line)
  return (
    <div className="hidden sm:block bg-slate-900/90 border-b border-slate-800 px-4 py-2 text-slate-300 shrink-0">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-slate-200 font-medium">
            STATUS OPERASIONAL: <strong className="text-emerald-400">SIAGA NORMAL</strong>
          </span>
          <span className="hidden md:inline text-slate-500">·</span>
          <span className="hidden md:inline text-slate-400">
            Seluruh pangkalan TNI AU aman dari kebakaran Ring 1 (&le; 5 km).
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onTestAlarm}
            className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700/60 cursor-pointer"
          >
            <BellRing className="w-3 h-3 text-amber-400" />
            <span>Tes Sirene</span>
          </button>
          <button
            onClick={onOpenReport}
            className="text-[11px] text-slate-300 hover:text-white transition-colors bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700/60 cursor-pointer"
          >
            SITREP
          </button>
        </div>
      </div>
    </div>
  );
};
