import React from 'react';
import { Filter, Search, Layers, Radio, Volume2, VolumeX, SlidersHorizontal, Flame, Sparkles } from 'lucide-react';
import { BaseType, DataSourceProvider, KoopsudRegion, ThreatLevel } from '../types';
import { SatelliteSensor } from '../services/firmsApi';

interface FilterToolbarProps {
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
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
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
}) => {
  return (
    <div className="bg-slate-900/95 border-b border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Left side: Search & Selectors */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search Input */}
        <div className="relative w-52">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onChangeSearchQuery(e.target.value)}
            placeholder="Cari Lanud, Radar, Kota..."
            className="w-full bg-slate-950 border border-slate-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>

        {/* Data Source Selector (FIRMS / GFW / GABUNGAN) */}
        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-md p-0.5">
          <button
            onClick={() => onChangeDataSource('FIRMS')}
            className={`px-2 py-1 text-[11px] rounded transition-colors whitespace-nowrap font-medium ${
              dataSource === 'FIRMS'
                ? 'bg-sky-900/70 text-sky-300 font-semibold border border-sky-700/80 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Data titik api standar NASA FIRMS (MODIS & VIIRS NRT)"
          >
            NASA FIRMS
          </button>
          <button
            onClick={() => onChangeDataSource('GFW')}
            className={`px-2 py-1 text-[11px] rounded transition-colors whitespace-nowrap font-medium flex items-center gap-1 ${
              dataSource === 'GFW'
                ? 'bg-emerald-900/70 text-emerald-300 font-semibold border border-emerald-700/80 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Data Global Forest Watch (GFW Data API: VIIRS 375m & Lahan Gambut)"
          >
            <Flame className="w-3 h-3 text-emerald-400" />
            <span>GFW Presisi</span>
          </button>
          <button
            onClick={() => onChangeDataSource('COMBINED')}
            className={`px-2 py-1 text-[11px] rounded transition-colors whitespace-nowrap font-medium flex items-center gap-1 ${
              dataSource === 'COMBINED'
                ? 'bg-amber-900/70 text-amber-300 font-semibold border border-amber-700/80 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Multi-Sumber: Gabungan NASA FIRMS dan GFW untuk verifikasi silang maksimal"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Multi-Sumber</span>
          </button>
        </div>

        {/* Peatland Only Filter Toggle */}
        <button
          onClick={onTogglePeatlandOnly}
          className={`px-2.5 py-1 text-[11px] rounded-md border flex items-center gap-1.5 transition-colors cursor-pointer ${
            peatlandOnly
              ? 'bg-amber-950/80 text-amber-300 border-amber-700 shadow-xs'
              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
          title="Filter titik api yang berada di atas Lahan Gambut (is__peatland) dengan resiko asap pekat"
        >
          <Flame className={`w-3.5 h-3.5 ${peatlandOnly ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
          <span>Lahan Gambut</span>
          {peatlandCount > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
              peatlandOnly ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-300'
            }`}>
              {peatlandCount}
            </span>
          )}
        </button>

        {/* Koopsud Filter Buttons */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-md p-0.5">
          {(['ALL', 'Koopsud I', 'Koopsud II', 'Koopsud III', 'Mabesau'] as const).map((k) => (
            <button
              key={k}
              onClick={() => onChangeKoopsud(k)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap ${
                selectedKoopsud === k
                  ? 'bg-slate-800 text-sky-400 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {k === 'ALL' ? 'Semua Wilayah' : k}
            </button>
          ))}
        </div>

        {/* Threat Level Filter */}
        <div className="flex items-center gap-1.5">
          <label className="text-slate-500 text-[11px]">Status:</label>
          <select
            value={selectedThreatLevel}
            onChange={(e) => onChangeThreatLevel(e.target.value as 'ALL' | ThreatLevel)}
            className="bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">Semua Tingkat</option>
            <option value="CRITICAL">🔴 Bahaya (&le; {dangerRadiusKm} km)</option>
            <option value="WARNING">🟠 Waspada (5 - 15 km)</option>
            <option value="ADVISORY">🔵 Siaga (15 - 30 km)</option>
            <option value="SAFE">🟢 Aman</option>
          </select>
        </div>

        {/* Base Type Filter */}
        <div className="flex items-center gap-1.5">
          <select
            value={selectedBaseType}
            onChange={(e) => onChangeBaseType(e.target.value as 'ALL' | BaseType)}
            className="bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
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

        {/* Satellite Sensor (when FIRMS or COMBINED active) */}
        {dataSource !== 'GFW' && (
          <div className="flex items-center gap-1.5">
            <label className="text-slate-500 text-[11px]">Satelit FIRMS:</label>
            <select
              value={satelliteSource}
              onChange={(e) => onChangeSatelliteSource(e.target.value as SatelliteSensor)}
              className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
            >
              <option value="VIIRS_SNPP_NRT">VIIRS S-NPP (375m)</option>
              <option value="VIIRS_NOAA20_NRT">VIIRS NOAA-20 (375m)</option>
              <option value="VIIRS_NOAA21_NRT">VIIRS NOAA-21 (375m)</option>
              <option value="MODIS_NRT">MODIS Terra/Aqua (1km)</option>
            </select>
          </div>
        )}
      </div>

      {/* Right side: Map Mode, Sound Toggle */}
      <div className="flex items-center gap-2.5">

        {/* Map Engine / Mode Selector */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-md p-0.5">
          <button
            onClick={() => onChangeMapMode('lightweight')}
            className={`px-2.5 py-1 text-[11px] rounded transition-colors flex items-center gap-1 ${
              mapMode === 'lightweight'
                ? 'bg-sky-950 text-sky-400 font-bold border border-sky-800/80 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Peta Taktis Vektor Ringan (0ms load, offline, tanpa tile lambat)"
          >
            <span>Peta Ringan</span>
            <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1 rounded border border-emerald-800 font-normal">
              Cepat
            </span>
          </button>
          <button
            onClick={() => onChangeMapMode('carto')}
            className={`px-2 py-1 text-[11px] rounded transition-colors ${
              mapMode === 'carto' ? 'bg-slate-800 text-sky-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Peta Tile CARTO Basemaps Dark"
          >
            CARTO Dark
          </button>
          <button
            onClick={() => onChangeMapMode('satellite')}
            className={`px-2 py-1 text-[11px] rounded transition-colors ${
              mapMode === 'satellite' ? 'bg-slate-800 text-sky-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Citra Satelit Esri"
          >
            Satelit
          </button>
        </div>

        {/* Audio Siren Toggle */}
        <button
          onClick={onToggleAlarmAudio}
          className={`p-1.5 rounded-md border transition-colors ${
            alarmAudioEnabled
              ? 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700'
              : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
          }`}
          title={alarmAudioEnabled ? 'Sirene Audio Aktif (Klik untuk Senyapkan)' : 'Sirene Audio Disenyapkan'}
        >
          {alarmAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

