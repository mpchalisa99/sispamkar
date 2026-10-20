import React from 'react';
import { Shield, RefreshCw, Radio, Flame, Settings, Sparkles } from 'lucide-react';
import { formatToWib } from '../utils/geoMath';
import { DataSourceProvider } from '../types';

interface TopBarProps {
  onRefreshData: () => void;
  isLoading: boolean;
  isCached: boolean;
  lastFetchedAt: Date | null;
  totalHotspots: number;
  peatlandCount: number;
  dataSource: DataSourceProvider;
  criticalBasesCount: number;
  onOpenSettings: () => void;
  onOpenReport: () => void;
  activeView: 'map' | 'bases' | 'threats';
  onChangeView: (view: 'map' | 'bases' | 'threats') => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onRefreshData,
  isLoading,
  isCached,
  lastFetchedAt,
  totalHotspots,
  peatlandCount,
  dataSource,
  criticalBasesCount,
  onOpenSettings,
  onOpenReport,
  activeView,
  onChangeView,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between gap-8 shrink-0">
      {/* Zone 1: Single text wordmark with subtle military crest icon */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-sky-950 border border-sky-600/60 flex items-center justify-center text-sky-400 shadow-inner">
          <Shield className="w-5 h-5 text-sky-400" />
        </div>
        <div className="whitespace-nowrap">
          <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
            <span>Sispamkar TNI AU</span>
            {dataSource === 'GFW' ? (
              <span className="text-xs font-semibold text-emerald-300 border border-emerald-700 bg-emerald-950/80 px-1.5 py-0.5 rounded flex items-center gap-1">
                <Flame className="w-3 h-3 text-emerald-400" />
                <span>GFW VIIRS 375m</span>
              </span>
            ) : dataSource === 'COMBINED' ? (
              <span className="text-xs font-semibold text-amber-300 border border-amber-700 bg-amber-950/80 px-1.5 py-0.5 rounded flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>FIRMS + GFW Multi-Sensor</span>
              </span>
            ) : (
              <span className="text-xs font-normal text-sky-400 border border-sky-800/80 bg-sky-950/60 px-1.5 py-0.5 rounded">
                NASA FIRMS NRT
              </span>
            )}
          </h1>
          <p className="text-[11px] text-slate-400 leading-tight">
            Peringatan Dini Karhutla Pangkalan & Obyek Vital TNI AU
          </p>
        </div>
      </div>

      {/* Zone 2: 4-5 single-line clean navigation links / view tabs */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
        <button
          onClick={() => onChangeView('map')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
            activeView === 'map' ? 'border-sky-500 text-white font-semibold' : 'border-transparent text-slate-400'
          }`}
        >
          Peta Situasi
        </button>
        <button
          onClick={() => onChangeView('threats')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 flex items-center gap-1.5 ${
            activeView === 'threats' ? 'border-red-500 text-white font-semibold' : 'border-transparent text-slate-400'
          }`}
        >
          <span>Daftar Ancaman</span>
          {criticalBasesCount > 0 && (
            <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {criticalBasesCount}
            </span>
          )}
        </button>
        <button
          onClick={() => onChangeView('bases')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
            activeView === 'bases' ? 'border-sky-500 text-white font-semibold' : 'border-transparent text-slate-400'
          }`}
        >
          Daftar Pangkalan
        </button>
        <button
          onClick={onOpenReport}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 border-transparent text-slate-400"
        >
          SITREP Militer
        </button>
        <button
          onClick={onOpenSettings}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 border-transparent text-slate-400 flex items-center gap-1"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Pengaturan Key</span>
        </button>
      </nav>

      {/* Zone 3: 1 primary action button + sync metadata */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden lg:flex flex-col items-end text-[11px] text-slate-400 font-mono-numbers">
          <div className="flex items-center gap-2">
            <span className="text-slate-300">
              <strong>{totalHotspots.toLocaleString()}</strong> Titik Api Aktif
            </span>
            {peatlandCount > 0 && (
              <span className="text-[10px] bg-amber-950/80 text-amber-300 px-1.5 py-0.2 rounded border border-amber-700/80 font-sans font-bold flex items-center gap-0.5" title={`${peatlandCount} titik api di atas lahan gambut`}>
                <Flame className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                <span>{peatlandCount} Gambut</span>
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500">
            {lastFetchedAt ? `Update ${formatToWib(lastFetchedAt)}` : 'Belum sinkron'}
          </span>
        </div>

        <button
          onClick={onRefreshData}
          disabled={isLoading}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:bg-slate-800 disabled:text-slate-500 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 shadow-sm shadow-sky-900/40 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Mengambil Data...' : 'Sinkron Satelit'}</span>
        </button>
      </div>
    </header>
  );
};
