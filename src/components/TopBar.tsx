import React from 'react';
import {
  Shield,
  RefreshCw,
  Radio,
  Flame,
  Settings,
  Sparkles,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  ShieldAlert,
} from 'lucide-react';
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
  isFullMap?: boolean;
  onToggleFullMap?: () => void;
  onOpenFilterDrawer?: () => void;
  onOpenRing1Drawer?: () => void;
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
  isFullMap = false,
  onToggleFullMap,
  onOpenFilterDrawer,
  onOpenRing1Drawer,
}) => {
  // If in full map mode, render a sleek floating mini-bar instead of full top header
  if (isFullMap) {
    return (
      <header className="absolute top-2 left-2 right-2 sm:left-4 sm:right-auto z-30 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3 py-2 flex items-center justify-between gap-3 shadow-2xl animate-in fade-in duration-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-950 border border-sky-600/60 flex items-center justify-center text-sky-400">
            <Shield className="w-4 h-4" />
          </div>
          <div className="leading-tight">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Sispamkar TNI AU</span>
              <span className="text-[9px] bg-sky-950 text-sky-400 px-1 py-0.2 rounded border border-sky-800">
                FULL MAP
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono-numbers">
              {totalHotspots.toLocaleString()} Titik Api Aktif
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {criticalBasesCount > 0 && onOpenRing1Drawer && (
            <button
              onClick={onOpenRing1Drawer}
              className="px-2 py-1 text-[11px] font-bold bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center gap-1 shadow-sm animate-pulse transition-colors cursor-pointer"
              title="Daftar Satuan & Aset Ring 1 Terdekat"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Ring 1 ({criticalBasesCount})</span>
            </button>
          )}

          {onOpenFilterDrawer && (
            <button
              onClick={onOpenFilterDrawer}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Filter & Sensor"
              aria-label="Filter"
            >
              <SlidersHorizontal className="w-4 h-4 text-sky-400" />
            </button>
          )}

          <button
            onClick={onRefreshData}
            disabled={isLoading}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Sinkron Satelit"
            aria-label="Sinkron"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
          </button>

          {onToggleFullMap && (
            <button
              onClick={onToggleFullMap}
              className="px-2.5 py-1 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
              title="Keluar dari Layar Penuh"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar Peta Penuh</span>
            </button>
          )}
        </div>
      </header>
    );
  }

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-3 sm:gap-6 shrink-0 z-20">
      {/* Zone 1: Wordmark & Military crest icon */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-sky-950 border border-sky-600/60 flex items-center justify-center text-sky-400 shadow-inner shrink-0">
          <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
        </div>
        <div className="whitespace-nowrap">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-white leading-tight">
              Sispamkar TNI AU
            </h1>
            {dataSource === 'GFW' ? (
              <span className="text-[10px] sm:text-xs font-semibold text-emerald-300 border border-emerald-700 bg-emerald-950/80 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400" />
                <span className="hidden sm:inline">GFW 375m</span>
              </span>
            ) : dataSource === 'COMBINED' ? (
              <span className="text-[10px] sm:text-xs font-semibold text-amber-300 border border-amber-700 bg-amber-950/80 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
                <span className="hidden sm:inline">Multi-Sensor</span>
              </span>
            ) : (
              <span className="text-[10px] sm:text-xs font-normal text-sky-400 border border-sky-800/80 bg-sky-950/60 px-1.5 py-0.2 rounded hidden sm:inline">
                NASA FIRMS
              </span>
            )}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 leading-tight hidden xs:block">
            Peringatan Dini Karhutla Lanud & Obvit TNI AU
          </p>
        </div>
      </div>

      {/* Zone 2: Navigation links / view tabs (Desktop & Tablet Landscape) */}
      <nav className="hidden md:flex items-center gap-5 lg:gap-6 text-sm font-medium text-slate-300">
        <button
          onClick={() => onChangeView('map')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 cursor-pointer ${
            activeView === 'map' ? 'border-sky-500 text-white font-semibold' : 'border-transparent text-slate-400'
          }`}
        >
          Peta Situasi
        </button>
        <button
          onClick={() => onChangeView('threats')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 flex items-center gap-1.5 cursor-pointer ${
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
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 cursor-pointer ${
            activeView === 'bases' ? 'border-sky-500 text-white font-semibold' : 'border-transparent text-slate-400'
          }`}
        >
          Daftar Pangkalan
        </button>
        <button
          onClick={onOpenReport}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 border-transparent text-slate-400 cursor-pointer"
        >
          SITREP Militer
        </button>
        <button
          onClick={onOpenSettings}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 border-transparent text-slate-400 flex items-center gap-1 cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Pengaturan Key</span>
        </button>
      </nav>

      {/* Zone 3: Actions + Full Map Button + Sync metadata */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Hotspots Summary indicator on tablet/desktop */}
        <div className="hidden lg:flex flex-col items-end text-[11px] text-slate-400 font-mono-numbers">
          <div className="flex items-center gap-2">
            <span className="text-slate-300">
              <strong>{totalHotspots.toLocaleString()}</strong> Titik Api Aktif
            </span>
            {peatlandCount > 0 && (
              <span
                className="text-[10px] bg-amber-950/80 text-amber-300 px-1.5 py-0.2 rounded border border-amber-700/80 font-sans font-bold flex items-center gap-0.5"
                title={`${peatlandCount} titik api di atas lahan gambut`}
              >
                <Flame className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                <span>{peatlandCount} Gambut</span>
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500">
            {lastFetchedAt ? `Update ${formatToWib(lastFetchedAt)}` : 'Belum sinkron'}
          </span>
        </div>

        {/* Ring 1 Threat Direct Button if critical bases exist */}
        {criticalBasesCount > 0 && onOpenRing1Drawer && (
          <button
            onClick={onOpenRing1Drawer}
            className="p-2 sm:px-3 sm:py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-red-950 animate-pulse cursor-pointer shrink-0"
            title="Buka Daftar Satuan & Aset Terancam Ring 1 (Diurutkan dari Api Terdekat)"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Satuan Ring 1</span>
            <span>({criticalBasesCount})</span>
          </button>
        )}

        {/* Fullscreen / Full Map dedicated toggle */}
        {onToggleFullMap && (
          <button
            onClick={onToggleFullMap}
            className="p-2 sm:px-3 sm:py-2 text-xs font-semibold text-sky-300 bg-sky-950/80 hover:bg-sky-900 border border-sky-700/80 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Tampilkan Full Map Maksimal di HP / Tablet"
          >
            <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Peta Penuh</span>
          </button>
        )}

        {/* Sync Button */}
        <button
          onClick={onRefreshData}
          disabled={isLoading}
          className="p-2 sm:px-3.5 sm:py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:bg-slate-800 disabled:text-slate-500 rounded-lg transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 shadow-sm shadow-sky-900/40 cursor-pointer"
          title="Sinkronisasi Data Satelit Terbaru"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden xs:inline">{isLoading ? 'Sinkron...' : 'Sinkron'}</span>
        </button>
      </div>
    </header>
  );
};
