import React from 'react';
import { Map, AlertTriangle, Building2, FileText, SlidersHorizontal, Maximize2 } from 'lucide-react';

interface MobileNavBarProps {
  activeView: 'map' | 'bases' | 'threats';
  onChangeView: (view: 'map' | 'bases' | 'threats') => void;
  criticalBasesCount: number;
  warningBasesCount: number;
  onOpenReport: () => void;
  onOpenFilterDrawer: () => void;
  isFullMap: boolean;
  onToggleFullMap: () => void;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({
  activeView,
  onChangeView,
  criticalBasesCount,
  warningBasesCount,
  onOpenReport,
  onOpenFilterDrawer,
  isFullMap,
  onToggleFullMap,
}) => {
  // If in full map mode, we can show a minimal floating pill or hide the bottom bar so map is truly 100% full screen
  if (isFullMap) return null;

  return (
    <nav className="md:hidden bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shrink-0 z-30 select-none pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))]">
      {/* Tab 1: Peta Taktis */}
      <button
        onClick={() => onChangeView('map')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
          activeView === 'map'
            ? 'text-sky-400 font-bold bg-sky-950/70 border border-sky-800/80 shadow-xs'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Map className="w-4 h-4 mb-0.5" />
        <span className="text-[10px] tracking-tight">Peta</span>
      </button>

      {/* Tab 2: Ancaman */}
      <button
        onClick={() => onChangeView('threats')}
        className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
          activeView === 'threats'
            ? 'text-red-400 font-bold bg-red-950/70 border border-red-800/80 shadow-xs'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <AlertTriangle className="w-4 h-4 mb-0.5" />
          {criticalBasesCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[9px] font-mono font-bold px-1 rounded-full animate-pulse shadow-sm">
              {criticalBasesCount}
            </span>
          )}
        </div>
        <span className="text-[10px] tracking-tight">Ancaman</span>
      </button>

      {/* Tab 3: Pangkalan */}
      <button
        onClick={() => onChangeView('bases')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
          activeView === 'bases'
            ? 'text-sky-400 font-bold bg-sky-950/70 border border-sky-800/80 shadow-xs'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Building2 className="w-4 h-4 mb-0.5" />
        <span className="text-[10px] tracking-tight">Pangkalan</span>
      </button>

      {/* Tab 4: SITREP */}
      <button
        onClick={onOpenReport}
        className="flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
      >
        <FileText className="w-4 h-4 mb-0.5 text-slate-400" />
        <span className="text-[10px] tracking-tight">SITREP</span>
      </button>

      {/* Tab 5: Filter & Kontrol */}
      <button
        onClick={onOpenFilterDrawer}
        className="flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer relative"
      >
        <SlidersHorizontal className="w-4 h-4 mb-0.5 text-sky-400" />
        <span className="text-[10px] tracking-tight text-slate-300">Filter</span>
      </button>
    </nav>
  );
};
