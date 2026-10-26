import React from 'react';
import {
  X,
  SlidersHorizontal,
  Flame,
  Sparkles,
  Layers,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Settings,
  Shield,
  RotateCcw,
  Tag,
} from 'lucide-react';
import { BaseType, DataSourceProvider, KoopsudRegion, ThreatLevel } from '../types';
import { SatelliteSensor } from '../services/firmsApi';

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedKoopsud: 'ALL' | KoopsudRegion;
  onChangeKoopsud: (k: 'ALL' | KoopsudRegion) => void;
  selectedBaseType: 'ALL' | BaseType;
  onChangeBaseType: (t: 'ALL' | BaseType) => void;
  selectedThreatLevel: 'ALL' | ThreatLevel;
  onChangeThreatLevel: (t: 'ALL' | ThreatLevel) => void;
  satelliteSource: SatelliteSensor;
  onChangeSatelliteSource: (s: SatelliteSensor) => void;
  dataSource: DataSourceProvider;
  onChangeDataSource: (d: DataSourceProvider) => void;
  peatlandOnly: boolean;
  onTogglePeatlandOnly: () => void;
  peatlandCount: number;
  searchQuery: string;
  onChangeSearchQuery: (q: string) => void;
  dangerRadiusKm: number;
  onChangeDangerRadius: (r: number) => void;
  mapMode: 'lightweight' | 'carto' | 'satellite';
  onChangeMapMode: (m: 'lightweight' | 'carto' | 'satellite') => void;
  alarmAudioEnabled: boolean;
  onToggleAlarmAudio: () => void;
  isFullMap: boolean;
  onToggleFullMap: () => void;
  onOpenSettings: () => void;
  showHotspotAlertLabels?: boolean;
  onToggleHotspotAlertLabels?: () => void;
}

export const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
  isOpen,
  onClose,
  selectedKoopsud,
  onChangeKoopsud,
  selectedBaseType,
  onChangeBaseType,
  selectedThreatLevel,
  onChangeThreatLevel,
  satelliteSource,
  onChangeSatelliteSource,
  dataSource,
  onChangeDataSource,
  peatlandOnly,
  onTogglePeatlandOnly,
  peatlandCount,
  searchQuery,
  onChangeSearchQuery,
  dangerRadiusKm,
  onChangeDangerRadius,
  mapMode,
  onChangeMapMode,
  alarmAudioEnabled,
  onToggleAlarmAudio,
  isFullMap,
  onToggleFullMap,
  onOpenSettings,
  showHotspotAlertLabels = true,
  onToggleHotspotAlertLabels,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-xs md:justify-center md:items-center p-0 md:p-4">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full md:max-w-xl max-h-[88dvh] bg-slate-900 border-t md:border border-slate-700 rounded-t-2xl md:rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-950 border border-sky-800 flex items-center justify-center text-sky-400">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Filter & Kontrol Peta Taktis</h3>
              <p className="text-[11px] text-slate-400">Optimalkan tampilan di HP & Tablet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 active:bg-slate-700 transition-colors"
            aria-label="Tutup Filter"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Options Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Quick Actions (Full Map & Audio Alarm) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onToggleFullMap();
              }}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-semibold transition-colors active:scale-95 ${
                isFullMap
                  ? 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-900/40'
                  : 'bg-slate-950 text-slate-200 border-slate-700 hover:border-slate-600'
              }`}
            >
              {isFullMap ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4 text-sky-400" />}
              <span>{isFullMap ? 'Layar Standar' : 'Mode Layar Penuh'}</span>
            </button>

            <button
              onClick={onToggleAlarmAudio}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-semibold transition-colors active:scale-95 ${
                alarmAudioEnabled
                  ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              {alarmAudioEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
              <span>{alarmAudioEnabled ? 'Sirene Aktif' : 'Sirene Senyap'}</span>
            </button>
          </div>

          {/* Search Input */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
              Pencarian Pangkalan / Wilayah:
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onChangeSearchQuery(e.target.value)}
              placeholder="Ketik Lanud (e.g. Halim, Iswahjudi, Roesmin)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Map Engine / Mode */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span>Pilihan Engine Tampilan Peta:</span>
              </span>
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => onChangeMapMode('lightweight')}
                className={`py-2 px-1 text-center rounded-lg font-medium transition-colors ${
                  mapMode === 'lightweight'
                    ? 'bg-sky-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div>Peta Ringan</div>
                <div className="text-[9px] opacity-80">Vektor Cepat</div>
              </button>
              <button
                onClick={() => onChangeMapMode('carto')}
                className={`py-2 px-1 text-center rounded-lg font-medium transition-colors ${
                  mapMode === 'carto'
                    ? 'bg-sky-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div>CARTO Dark</div>
                <div className="text-[9px] opacity-80">Tile Hitam</div>
              </button>
              <button
                onClick={() => onChangeMapMode('satellite')}
                className={`py-2 px-1 text-center rounded-lg font-medium transition-colors ${
                  mapMode === 'satellite'
                    ? 'bg-sky-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div>Satelit</div>
                <div className="text-[9px] opacity-80">Citra Esri</div>
              </button>
            </div>
          </div>

          {/* Data Source Selection */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
              Sumber Data Titik Api:
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => onChangeDataSource('COMBINED')}
                className={`py-2 px-1 text-center rounded-lg font-medium transition-colors ${
                  dataSource === 'COMBINED'
                    ? 'bg-amber-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Multi-Sensor</span>
                </div>
                <div className="text-[9px] opacity-80">FIRMS + GFW</div>
              </button>
              <button
                onClick={() => onChangeDataSource('GFW')}
                className={`py-2 px-1 text-center rounded-lg font-medium transition-colors ${
                  dataSource === 'GFW'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <Flame className="w-3 h-3 text-emerald-300" />
                  <span>GFW Presisi</span>
                </div>
                <div className="text-[9px] opacity-80">VIIRS 375m</div>
              </button>
              <button
                onClick={() => onChangeDataSource('FIRMS')}
                className={`py-2 px-1 text-center rounded-lg font-medium transition-colors ${
                  dataSource === 'FIRMS'
                    ? 'bg-sky-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div>NASA FIRMS</div>
                <div className="text-[9px] opacity-80">Standard NRT</div>
              </button>
            </div>
          </div>

          {/* Lahan Gambut Filter */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className={`w-4 h-4 ${peatlandOnly ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
              <div>
                <div className="font-semibold text-slate-200">Hanya Lahan Gambut (Peatland)</div>
                <div className="text-[10px] text-slate-400">
                  {peatlandCount > 0 ? `${peatlandCount} titik api gambut terdeteksi` : 'Resiko asap pekat & menyebar'}
                </div>
              </div>
            </div>
            <button
              onClick={onTogglePeatlandOnly}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                peatlandOnly ? 'bg-amber-500' : 'bg-slate-800'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                  peatlandOnly ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Keterangan Data Titik Api Alert (Tanpa Klik) */}
          {onToggleHotspotAlertLabels && (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className={`w-4 h-4 ${showHotspotAlertLabels ? 'text-red-400' : 'text-slate-500'}`} />
                <div>
                  <div className="font-semibold text-slate-200">Label Keterangan Titik Api Alert</div>
                  <div className="text-[10px] text-slate-400">
                    Tampilkan jarak Lanud & daya MW langsung tanpa klik
                  </div>
                </div>
              </div>
              <button
                onClick={onToggleHotspotAlertLabels}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  showHotspotAlertLabels ? 'bg-red-600' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    showHotspotAlertLabels ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Wilayah Komando Operasi Udara (Koopsud) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
              Wilayah Komando (Koopsud):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {(['ALL', 'Koopsud I', 'Koopsud II', 'Koopsud III', 'Mabesau'] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => onChangeKoopsud(k)}
                  className={`py-2 px-2.5 rounded-lg text-left text-xs font-medium border transition-colors ${
                    selectedKoopsud === k
                      ? 'bg-sky-950 text-sky-300 border-sky-600 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {k === 'ALL' ? 'Seluruh Wilayah RI' : k}
                </button>
              ))}
            </div>
          </div>

          {/* Status Ancaman */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
              Tingkat Status Ancaman:
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => onChangeThreatLevel('ALL')}
                className={`py-2 px-2.5 rounded-lg text-xs font-medium border text-left ${
                  selectedThreatLevel === 'ALL'
                    ? 'bg-slate-800 text-white border-slate-600 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                Semua Status
              </button>
              <button
                onClick={() => onChangeThreatLevel('CRITICAL')}
                className={`py-2 px-2.5 rounded-lg text-xs font-medium border text-left ${
                  selectedThreatLevel === 'CRITICAL'
                    ? 'bg-red-950 text-red-300 border-red-600 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                🔴 Bahaya (&le; {dangerRadiusKm} km)
              </button>
              <button
                onClick={() => onChangeThreatLevel('WARNING')}
                className={`py-2 px-2.5 rounded-lg text-xs font-medium border text-left ${
                  selectedThreatLevel === 'WARNING'
                    ? 'bg-amber-950 text-amber-300 border-amber-600 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                🟠 Waspada (5 - 15 km)
              </button>
              <button
                onClick={() => onChangeThreatLevel('ADVISORY')}
                className={`py-2 px-2.5 rounded-lg text-xs font-medium border text-left ${
                  selectedThreatLevel === 'ADVISORY'
                    ? 'bg-blue-950 text-blue-300 border-blue-600 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                🔵 Siaga (15 - 30 km)
              </button>
            </div>
          </div>

          {/* Tipe Satuan TNI AU */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
              Tipe Satuan TNI AU:
            </label>
            <select
              value={selectedBaseType}
              onChange={(e) => onChangeBaseType(e.target.value as 'ALL' | BaseType)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">Semua Tipe Satuan</option>
              <option value="Lanud Tipe A">Lanud Tipe A (Fighter / Heavy)</option>
              <option value="Lanud Tipe B">Lanud Tipe B</option>
              <option value="Lanud Tipe C">Lanud Tipe C (Forward Base)</option>
              <option value="Satuan Radar">Satuan Radar (Satrad)</option>
              <option value="Depo Pemeliharaan">Depohar (Koharmatau)</option>
              <option value="Kopasgat">Pasukan Khusus Kopasgat</option>
              <option value="Detasemen">Detasemen TNI AU</option>
              <option value="Satuan Rudal">Satuan Rudal (Satrudal)</option>
              <option value="Air Weapon Range">Air Weapon Range (AWR)</option>
              <option value="Mabesau / Lemdik">Mabesau / Lemdik</option>
            </select>
          </div>

          {/* Sensor Satelit (for FIRMS / COMBINED) */}
          {dataSource !== 'GFW' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                Sensor Satelit NASA FIRMS:
              </label>
              <select
                value={satelliteSource}
                onChange={(e) => onChangeSatelliteSource(e.target.value as SatelliteSensor)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
              >
                <option value="VIIRS_SNPP_NRT">VIIRS S-NPP (375m)</option>
                <option value="VIIRS_NOAA20_NRT">VIIRS NOAA-20 (375m)</option>
                <option value="VIIRS_NOAA21_NRT">VIIRS NOAA-21 (375m)</option>
                <option value="MODIS_NRT">MODIS Terra/Aqua (1km)</option>
              </select>
            </div>
          )}

          {/* Settings API Key shortcut */}
          <button
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="w-full py-2.5 px-3 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700/80 flex items-center justify-center gap-2 font-medium transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-sky-400" />
            <span>Pengaturan API Key Satelit & Perimeter</span>
          </button>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              onChangeKoopsud('ALL');
              onChangeBaseType('ALL');
              onChangeThreatLevel('ALL');
              onChangeSearchQuery('');
            }}
            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filter</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
          >
            Terapkan Filter
          </button>
        </div>
      </div>
    </div>
  );
};
