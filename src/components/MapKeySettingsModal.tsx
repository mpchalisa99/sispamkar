import React, { useState } from 'react';
import { X, Key, Check, Info, Shield, RotateCcw, Map, Flame, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { DEFAULT_NASA_MAP_KEY } from '../services/firmsApi';
import { DEFAULT_CARTO_API_KEY } from './TacticalMap';
import { validateGfwApiKey } from '../services/gfwApi';

interface MapKeySettingsModalProps {
  currentMapKey: string;
  onSaveMapKey: (newKey: string) => void;
  currentCartoKey: string;
  onSaveCartoKey: (newKey: string) => void;
  currentGfwKey: string;
  onSaveGfwKey: (newKey: string) => void;
  dangerRadiusKm: number;
  onSaveDangerRadius: (r: number) => void;
  warningRadiusKm: number;
  onSaveWarningRadius: (r: number) => void;
  advisoryRadiusKm: number;
  onSaveAdvisoryRadius: (r: number) => void;
  onClose: () => void;
}

export const MapKeySettingsModal: React.FC<MapKeySettingsModalProps> = ({
  currentMapKey,
  onSaveMapKey,
  currentCartoKey,
  onSaveCartoKey,
  currentGfwKey,
  onSaveGfwKey,
  dangerRadiusKm,
  onSaveDangerRadius,
  warningRadiusKm,
  onSaveWarningRadius,
  advisoryRadiusKm,
  onSaveAdvisoryRadius,
  onClose,
}) => {
  const [keyInput, setKeyInput] = useState(currentMapKey);
  const [cartoKeyInput, setCartoKeyInput] = useState(currentCartoKey);
  const [gfwKeyInput, setGfwKeyInput] = useState(currentGfwKey);
  const [dangerR, setDangerR] = useState(dangerRadiusKm);
  const [warningR, setWarningR] = useState(warningRadiusKm);
  const [advisoryR, setAdvisoryR] = useState(advisoryRadiusKm);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // GFW Key Test Status
  const [isTestingGfw, setIsTestingGfw] = useState(false);
  const [gfwTestResult, setGfwTestResult] = useState<{ valid: boolean; message: string } | null>(null);

  const handleTestGfwKey = async () => {
    setIsTestingGfw(true);
    setGfwTestResult(null);
    try {
      const result = await validateGfwApiKey(gfwKeyInput);
      setGfwTestResult(result);
    } catch (e) {
      setGfwTestResult({
        valid: false,
        message: 'Gagal melakukan tes koneksi API GFW',
      });
    } finally {
      setIsTestingGfw(false);
    }
  };

  const handleSave = () => {
    onSaveMapKey(keyInput.trim() || DEFAULT_NASA_MAP_KEY);
    onSaveCartoKey(cartoKeyInput.trim() || DEFAULT_CARTO_API_KEY);
    onSaveGfwKey(gfwKeyInput.trim());
    onSaveDangerRadius(dangerR);
    onSaveWarningRadius(warningR);
    onSaveAdvisoryRadius(advisoryR);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    setKeyInput(DEFAULT_NASA_MAP_KEY);
    setCartoKeyInput(DEFAULT_CARTO_API_KEY);
    setGfwKeyInput('');
    setDangerR(5);
    setWarningR(15);
    setAdvisoryR(30);
    setGfwTestResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto text-slate-200 text-xs">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <Key className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-white text-sm">Konfigurasi API Key Satelit & Perimeter</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          {/* Global Forest Watch (GFW) API Key */}
          <div className="bg-emerald-950/30 border border-emerald-800/60 p-3.5 rounded-lg">
            <label className="block text-emerald-300 font-semibold mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-emerald-400" />
                <span>Global Forest Watch (GFW) API Key:</span>
              </span>
              <span className="text-[10px] bg-emerald-900/80 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-700">
                Resolusi 375m & Peatland
              </span>
            </label>
            <div className="flex gap-2 mt-1.5">
              <input
                type="text"
                value={gfwKeyInput}
                onChange={(e) => {
                  setGfwKeyInput(e.target.value);
                  setGfwTestResult(null);
                }}
                placeholder="Masukkan API Key GFW (UUID e.g. 14565c7b-...)"
                className="flex-1 bg-slate-950 border border-emerald-800/80 rounded-md px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleTestGfwKey}
                disabled={isTestingGfw || !gfwKeyInput.trim()}
                className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium rounded-md flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                title="Uji validitas API Key via endpoint GFW OpenAPI"
              >
                {isTestingGfw ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Uji Key</span>
              </button>
            </div>

            {/* Test result banner */}
            {gfwTestResult && (
              <div
                className={`mt-2 p-2 rounded text-[11px] flex items-start gap-1.5 border ${
                  gfwTestResult.valid
                    ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
                    : 'bg-red-950/80 border-red-800 text-red-200'
                }`}
              >
                {gfwTestResult.valid ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                )}
                <span>{gfwTestResult.message}</span>
              </div>
            )}

            <p className="text-[11px] text-emerald-200/80 mt-1.5 leading-relaxed">
              API GFW menyediakan deteksi titik api satelit VIIRS presisi tinggi dengan layer khusus <strong>Lahan Gambut (is__peatland)</strong> dan administrasi terperinci sesuai spesifikasi <code>openapi_14565c7b.json</code>.
            </p>
          </div>

          {/* NASA FIRMS Key */}
          <div className="border-t border-slate-800/80 pt-3">
            <label className="block text-slate-300 font-semibold mb-1">
              NASA FIRMS MAP KEY:
            </label>
            <div className="relative">
              <input
                type="text"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Masukkan 32-karakter Map Key"
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Kunci akses API aktif Anda dari Fire Information for Resource Management System (NASA FIRMS).
            </p>
          </div>

          {/* CARTO Basemaps Key */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <Map className="w-3.5 h-3.5 text-sky-400" />
              <span>CARTO Basemaps API Key:</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={cartoKeyInput}
                onChange={(e) => setCartoKeyInput(e.target.value)}
                placeholder="Masukkan Carto API Key"
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Kunci aktif: <span className="font-mono text-sky-300 font-semibold">{DEFAULT_CARTO_API_KEY}</span> untuk rendering peta taktis Carto Dark Matter dan Voyager.
            </p>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 flex items-start gap-2.5 text-[11px] text-slate-400">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              Map Key default <span className="font-mono text-slate-300">{DEFAULT_NASA_MAP_KEY}</span> memantau area teritori Indonesia (BBox: 95°BT - 141°BT, 11°LS - 6°LU).
            </div>
          </div>

          {/* Perimeter Alarm Radii */}
          <div className="border-t border-slate-800 pt-3">
            <h4 className="font-semibold text-white mb-2">Penyesuaian Radius Perimeter Alarm:</h4>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-red-400 font-medium">Ring 1: Zona Bahaya (Alarm Sirene)</span>
                  <span className="font-mono font-bold text-white">{dangerR} km</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="10"
                  step="1"
                  value={dangerR}
                  onChange={(e) => setDangerR(Number(e.target.value))}
                  className="w-full accent-red-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-amber-400 font-medium">Ring 2: Zona Waspada (Patroli Pangkalan)</span>
                  <span className="font-mono font-bold text-white">{warningR} km</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="25"
                  step="1"
                  value={warningR}
                  onChange={(e) => setWarningR(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-blue-400 font-medium">Ring 3: Zona Siaga Monitoring Satelit</span>
                  <span className="font-mono font-bold text-white">{advisoryR} km</span>
                </div>
                <input
                  type="range"
                  min="25"
                  max="60"
                  step="5"
                  value={advisoryR}
                  onChange={(e) => setAdvisoryR(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between sticky bottom-0 z-10 backdrop-blur-sm">
          <button
            onClick={handleReset}
            className="text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Standar</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-md flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5" /> : null}
              <span>{savedSuccess ? 'Tersimpan!' : 'Simpan Konfigurasi'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
