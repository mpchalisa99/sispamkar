import React, { useState } from 'react';
import { X, Flame, Shield, Compass, Wind, Radio, AlertTriangle, FileText, CheckCircle2, ChevronRight, Copy, Check } from 'lucide-react';
import { BaseThreatSummary, FireHotspot, LanudBase } from '../types';
import { getCompassDirection, formatFirmsUtcToWib } from '../utils/geoMath';

interface BaseThreatDetailModalProps {
  summary: BaseThreatSummary;
  onClose: () => void;
  dangerRadiusKm: number;
}

export const BaseThreatDetailModal: React.FC<BaseThreatDetailModalProps> = ({
  summary,
  onClose,
  dangerRadiusKm,
}) => {
  const [activeTab, setActiveTab] = useState<'hotspots' | 'sop' | 'notam'>('hotspots');
  const [copiedNotam, setCopiedNotam] = useState(false);
  const { base, threatLevel, recentHotspots, nearestHotspotDistanceKm, maxFrpMw } = summary;

  // Generate tactical NOTAM smoke haze advisory draft
  const notamText = `A) ${base.code.split('/')[1]?.trim() || base.code.trim()}
B) ${new Date().toISOString().slice(2, 10).replace(/-/g, '')}0600
C) PERM
E) TRIGGER NOTAM - WILDFIRE SMOKE AND HAZE ADVISORY WITHIN ${dangerRadiusKm * 2}KM RADIUS OF AERODROME.
FIRE HOTSPOTS DETECTED BY SATELLITE (NASA FIRMS) AT PROXIMITY ${nearestHotspotDistanceKm ?? 'N/A'} KM.
FLIGHT CREWS ARE ADVISED TO EXERCISE CAUTION DUE TO REDUCED VISIBILITY AND HAZE ON FINAL APPROACH.
FIRE FIGHTING CATEGORY CAT 7 READY ON RUNWAY STANDBY.`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(notamText);
    setCopiedNotam(true);
    setTimeout(() => setCopiedNotam(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0 mt-0.5 ${
                threatLevel === 'CRITICAL'
                  ? 'bg-red-600 shadow-md shadow-red-900/60'
                  : threatLevel === 'WARNING'
                  ? 'bg-amber-600 shadow-md shadow-amber-900/60'
                  : threatLevel === 'ADVISORY'
                  ? 'bg-blue-600 shadow-md shadow-blue-900/60'
                  : 'bg-emerald-600'
              }`}
            >
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">{base.name}</h3>
                <span className="font-mono text-xs text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">
                  {base.code}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {base.type} · {base.koopsud} · Prov. {base.province} ({base.city})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Threat Level Quick Metric Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4 bg-slate-950/40 border-b border-slate-800 text-xs">
          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-400">Status Ancaman</span>
            <div className="mt-1 font-bold text-sm flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  threatLevel === 'CRITICAL'
                    ? 'bg-red-500'
                    : threatLevel === 'WARNING'
                    ? 'bg-amber-500'
                    : threatLevel === 'ADVISORY'
                    ? 'bg-blue-500'
                    : 'bg-emerald-500'
                }`}
              />
              <span
                className={
                  threatLevel === 'CRITICAL'
                    ? 'text-red-400'
                    : threatLevel === 'WARNING'
                    ? 'text-amber-400'
                    : threatLevel === 'ADVISORY'
                    ? 'text-blue-400'
                    : 'text-emerald-400'
                }
              >
                {threatLevel === 'CRITICAL'
                  ? 'BAHAYA (Ring 1)'
                  : threatLevel === 'WARNING'
                  ? 'WASPADA (Ring 2)'
                  : threatLevel === 'ADVISORY'
                  ? 'SIAGA (Ring 3)'
                  : 'AMAN (Nominal)'}
              </span>
            </div>
          </div>

          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-400">Jarak Api Terdekat</span>
            <div className="mt-1 font-bold text-sm text-white font-mono-numbers">
              {nearestHotspotDistanceKm !== null ? `${nearestHotspotDistanceKm} km` : 'Tidak Ada'}
            </div>
          </div>

          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-400">Radiasi Daya (FRP Maks)</span>
            <div className="mt-1 font-bold text-sm text-amber-300 font-mono-numbers">
              {maxFrpMw > 0 ? `${maxFrpMw.toFixed(1)} MW` : '0 MW'}
            </div>
          </div>

          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-400">Total Titik Api (&le;30km)</span>
            <div className="mt-1 font-bold text-sm text-white font-mono-numbers">
              {summary.totalHotspotsNear} Titik
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-5 pt-3 gap-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('hotspots')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'hotspots'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Daftar Titik Api Terdeteksi ({recentHotspots.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('sop')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'sop'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>SOP PKP-PK Pangkalan</span>
          </button>
          <button
            onClick={() => setActiveTab('notam')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'notam'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Draft NOTAM Kabut Asap</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 text-slate-200 text-xs">
          {activeTab === 'hotspots' && (
            <div>
              {recentHotspots.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="font-semibold text-slate-200 text-sm">Tidak ada titik api terdeteksi</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Wilayah sekitar pangkalan radius 30 km berada dalam kondisi aman berdasarkan citra satelit NASA FIRMS terkini.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-mono-numbers">
                      <thead>
                        <tr className="border-b border-slate-800 text-[11px] text-slate-400 font-sans">
                          <th className="py-2 px-2.5">Jarak & Azimuth</th>
                          <th className="py-2 px-2.5">Tingkat Ancaman</th>
                          <th className="py-2 px-2.5 text-right">FRP (MW)</th>
                          <th className="py-2 px-2.5 text-right">Suhu Kecerahan</th>
                          <th className="py-2 px-2.5">Keyakinan</th>
                          <th className="py-2 px-2.5">Waktu Deteksi (WIB)</th>
                          <th className="py-2 px-2.5">Sumber & Klasifikasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-xs">
                        {recentHotspots.map((h, i) => {
                          const dirLabel = h.bearingDeg !== undefined ? getCompassDirection(h.bearingDeg) : '-';
                          const isCrit = h.threatLevel === 'CRITICAL';
                          const isWarn = h.threatLevel === 'WARNING';
                          return (
                            <tr key={i} className={`hover:bg-slate-800/40 ${h.isPeatland ? 'bg-amber-950/20' : ''}`}>
                              <td className="py-2.5 px-2.5">
                                <span className="font-bold text-white">{h.distanceKm} km</span>{' '}
                                <span className="text-[11px] text-slate-400 font-sans">
                                  ({h.bearingDeg}° {dirLabel})
                                </span>
                              </td>
                              <td className="py-2.5 px-2.5 font-sans">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                    isCrit
                                      ? 'bg-red-950 text-red-400 border border-red-800'
                                      : isWarn
                                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                      : 'bg-blue-950 text-blue-400 border border-blue-800'
                                  }`}
                                >
                                  {isCrit ? 'Ring 1 (Bahaya)' : isWarn ? 'Ring 2 (Waspada)' : 'Ring 3 (Siaga)'}
                                </span>
                              </td>
                              <td className="py-2.5 px-2.5 text-right font-bold text-amber-300">
                                {h.frp.toFixed(1)} MW
                              </td>
                              <td className="py-2.5 px-2.5 text-right text-slate-300">
                                {h.bright_ti4.toFixed(1)} K ({(h.bright_ti4 - 273.15).toFixed(1)}°C)
                              </td>
                              <td className="py-2.5 px-2.5 font-sans text-slate-300">
                                {h.confidence === 'h' ? 'Tinggi' : h.confidence === 'n' ? 'Nominal' : 'Rendah'}
                              </td>
                              <td className="py-2.5 px-2.5 text-sky-300 font-bold">
                                {formatFirmsUtcToWib(h.acq_date, h.acq_time).fullWibString}
                              </td>
                              <td className="py-2.5 px-2.5 text-slate-300 font-sans">
                                <div className="flex flex-col items-start gap-1">
                                  <span className="text-[11px] font-mono text-slate-300">
                                    {h.source === 'GFW' ? 'GFW VIIRS 375m' : h.satellite}
                                  </span>
                                  {h.isPeatland && (
                                    <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-700/80 px-1.5 py-0.2 rounded font-semibold flex items-center gap-1">
                                      <Flame className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                                      <span>Lahan Gambut</span>
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sop' && (
            <div className="space-y-4">
              <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800">
                <h4 className="font-bold text-sm text-sky-400 mb-1">
                  Protokol Operasi Kesiapsiagaan Penanggulangan Karhutla Pangkalan
                </h4>
                <p className="text-xs text-slate-400">
                  Instruksi Siaga Komando Operasi Udara terhadap pangkalan dan obyek vital TNI AU saat titik api terdeteksi dalam perimeter pertahanan.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-red-950 text-red-400 flex items-center justify-center font-bold text-xs shrink-0 border border-red-800">
                    1
                  </div>
                  <div>
                    <h5 className="font-semibold text-slate-100 text-xs">Aktivasi Posko Darurat PKP-PK Pangkalan</h5>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Siagakan unit Foam Tender Titan / Rosenbauer di runway standby points. Lakukan pemeriksaan ketersediaan suplai air dan retardant foam pemadam.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-amber-950 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-800">
                    2
                  </div>
                  <div>
                    <h5 className="font-semibold text-slate-100 text-xs">Penyekatan & Patroli Sektor Pertahanan Pangkalan (Hanlan)</h5>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Personel Satpomau dan Detasemen Hanlan bergerak menyisir batas pagar perimeter terluar pangkalan untuk membuat sekat bakar (firebreak) darurat jika api lahan mendekat.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-blue-950 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-800">
                    3
                  </div>
                  <div>
                    <h5 className="font-semibold text-slate-100 text-xs">Kesiapan Skadron Helikopter Bambi Bucket (Water Bombing)</h5>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Pangkalan aju yang didukung Skadron Udara 6 / 8 (Super Puma / Caracal) atau pesawat TMC (Teknologi Modifikasi Cuaca Skadron 4 C-212) bersiap menerima perintah serbuan udara.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                    4
                  </div>
                  <div>
                    <h5 className="font-semibold text-slate-100 text-xs">Koordinasi Puskodal Lanud dengan Satgas Karhutla BNPB / BPBD</h5>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Hubungi Puskodal Gabungan Karhutla Provinsi dan Manggala Agni untuk pengerahan tim darat terintegrasi.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-400 text-[11px] flex items-center justify-between">
                <span>Kontak Puskodal: <strong>{base.puskodalContact}</strong></span>
                <span>Unit PKP-PK: <strong>{base.pkpPkUnits || '2 Foam Tender Standby'}</strong></span>
              </div>
            </div>
          )}

          {activeTab === 'notam' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-white">Draft NOTAM (Notice to Airmen) Kebakaran & Kabut Asap</h4>
                  <p className="text-slate-400 text-[11px]">Format standar ICAO untuk advisori keselamatan operasi penerbangan pangkalan.</p>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-md flex items-center gap-1.5 transition-colors"
                >
                  {copiedNotam ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedNotam ? 'Tersalin' : 'Salin Teks NOTAM'}</span>
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-amber-300 whitespace-pre-wrap leading-relaxed">
                {notamText}
              </div>

              <p className="text-[11px] text-slate-500">
                Draft dapat langsung diteruskan oleh petugas Briefing Office / Pangkalan Udara ke AirNav Indonesia untuk penerbitan resmi.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div>
            Runway: <strong className="text-white">{base.runwayOrientation || 'Heliport / Radar Site'}</strong>
            {base.runwayLengthM ? ` (${base.runwayLengthM} m)` : ''} · Elevasi: {base.elevationMeters}m dpl
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors"
          >
            Tutup Lembar Pangkalan
          </button>
        </div>
      </div>
    </div>
  );
};
