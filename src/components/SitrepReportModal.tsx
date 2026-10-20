import React from 'react';
import { X, Printer, Download, Shield, FileCheck, AlertTriangle } from 'lucide-react';
import { BaseThreatSummary } from '../types';
import { formatToWib, formatFullWib } from '../utils/geoMath';

interface SitrepReportModalProps {
  threatSummaries: BaseThreatSummary[];
  onClose: () => void;
  totalHotspots: number;
  lastFetchedAt: Date | null;
  satelliteSource: string;
  dangerRadiusKm: number;
  warningRadiusKm: number;
}

export const SitrepReportModal: React.FC<SitrepReportModalProps> = ({
  threatSummaries,
  onClose,
  totalHotspots,
  lastFetchedAt,
  satelliteSource,
  dangerRadiusKm,
  warningRadiusKm,
}) => {
  const criticalList = threatSummaries.filter((s) => s.threatLevel === 'CRITICAL');
  const warningList = threatSummaries.filter((s) => s.threatLevel === 'WARNING');
  const advisoryList = threatSummaries.filter((s) => s.threatLevel === 'ADVISORY');

  const printReport = () => {
    window.print();
  };

  const downloadTextReport = () => {
    const lines = [
      '========================================================================',
      'MARKAS BESAR ANGKATAN UDARA - KOMANDO OPERASI UDARA NASIONAL',
      'LAPORAN SITUASI (SITREP) ANCAMAN KARHUTLA PANGKALAN & OBVIT TNI AU',
      `WAKTU PENERBITAN : ${formatFullWib(new Date())}`,
      `WAKTU OBSERVASI  : ${formatFullWib(lastFetchedAt)}`,
      `SUMBER DATA      : NASA FIRMS (${satelliteSource})`,
      '========================================================================',
      '',
      `1. REKAPITULASI NASIONAL:`,
      `   - Total Hotspot Terdeteksi di Seluruh Indonesia: ${totalHotspots} Titik`,
      `   - Pangkalan Status Bahaya (Ring 1 <= ${dangerRadiusKm}km): ${criticalList.length} Pangkalan/Obvit`,
      `   - Pangkalan Status Waspada (Ring 2 ${dangerRadiusKm}-${warningRadiusKm}km): ${warningList.length} Pangkalan/Obvit`,
      `   - Pangkalan Status Siaga (Ring 3): ${advisoryList.length} Pangkalan/Obvit`,
      '',
      '2. DAFTAR PANGKALAN TERDAMPAK:',
      ...threatSummaries
        .filter((s) => s.threatLevel !== 'SAFE')
        .map(
          (s, i) =>
            `   ${i + 1}. ${s.base.name} [${s.base.code}] (${s.threatLevel})\n` +
            `      - Lokasi: ${s.base.city}, ${s.base.province} (${s.base.koopsud})\n` +
            `      - Jarak Api Terdekat: ${s.nearestHotspotDistanceKm} km\n` +
            `      - FRP Maks: ${s.maxFrpMw.toFixed(1)} MW\n` +
            `      - Total Hotspot Sekitar (<30km): ${s.totalHotspotsNear} Titik\n` +
            `      - Kontak Puskodal: ${s.base.puskodalContact}`
        ),
      '',
      '3. REKOMENDASI DAN LANGKAH TINDAK LANJUT:',
      '   - Pangkalan status Bahaya mengaktifkan Tim Siaga PKP-PK dan Hanlan.',
      '   - Koordinasi dengan Satgas Karhutla BNPB/BPBD serta penyiapan Skadron Water Bombing.',
      '   - Pemantauan Runway Visual Range (RVR) untuk NOTAM kabut asap.',
      '========================================================================',
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SITREP_KARHUTLA_TNIAU_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-950 border border-sky-600/60 flex items-center justify-center text-sky-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Laporan Situasi Karhutla (SITREP)</h3>
              <p className="text-xs text-slate-400">
                Peringatan Dini Kebakaran Hutan & Lahan Pangkalan TNI AU
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadTextReport}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh TXT</span>
            </button>
            <button
              onClick={printReport}
              className="px-3 py-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-md flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak SITREP</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Document */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed space-y-6">
          {/* Header Mark */}
          <div className="text-center border-b border-slate-800 pb-4">
            <div className="text-sky-400 font-bold tracking-widest text-xs uppercase">
              TENTARA NASIONAL INDONESIA ANGKATAN UDARA
            </div>
            <div className="text-white font-bold text-sm tracking-wide mt-1">
              KOMANDO OPERASI UDARA NASIONAL (KOOPSUDNAS)
            </div>
            <div className="text-slate-400 text-xs mt-1">
              PUSAT KOMANDO DAN PENGENDALIAN OPERASI (PUSKODAL)
            </div>
            <div className="text-slate-500 text-[11px] mt-2 font-mono">
              NOMOR: SITREP / {new Date().getFullYear()} / KARHUTLA-LANUD /{' '}
              {new Date().toISOString().slice(5, 7)}
            </div>
          </div>

          {/* Section 1: Executive Overview */}
          <div className="space-y-2">
            <div className="font-bold text-sky-400 font-sans text-xs">
              I. REKAPITULASI SITUASI NASIONAL (NASA FIRMS)
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-sans">
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400">Total Hotspot RI</span>
                <div className="text-base font-bold text-white font-mono mt-0.5">
                  {totalHotspots.toLocaleString()} Titik
                </div>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg border border-red-900/60 bg-red-950/20">
                <span className="text-[11px] text-red-400">Ring 1 (Bahaya &le;5km)</span>
                <div className="text-base font-bold text-red-300 font-mono mt-0.5">
                  {criticalList.length} Pangkalan
                </div>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg border border-amber-900/60 bg-amber-950/20">
                <span className="text-[11px] text-amber-400">Ring 2 (Waspada 5-15km)</span>
                <div className="text-base font-bold text-amber-300 font-mono mt-0.5">
                  {warningList.length} Pangkalan
                </div>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400">Waktu Observasi</span>
                <div className="text-xs font-bold text-slate-300 font-mono mt-1">
                  {formatToWib(lastFetchedAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Affected Bases Table */}
          <div className="space-y-2">
            <div className="font-bold text-sky-400 font-sans text-xs flex items-center justify-between">
              <span>II. STATUS ANCAMAN PANGKALAN & OBVIT TNI AU</span>
              <span className="text-slate-500 text-[11px] font-normal">
                Filter: Semua yang memiliki titik api aktif dalam perimeter 30 km
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs divide-y divide-slate-800">
                <thead className="bg-slate-900 text-slate-400 text-[11px] font-sans">
                  <tr>
                    <th className="p-2.5">Pangkalan / Obvit</th>
                    <th className="p-2.5">Komando</th>
                    <th className="p-2.5">Status Ancaman</th>
                    <th className="p-2.5 text-right">Jarak Terdekat</th>
                    <th className="p-2.5 text-right">FRP Maks</th>
                    <th className="p-2.5 text-right">Total Hotspot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 bg-slate-950/80">
                  {threatSummaries.filter((s) => s.threatLevel !== 'SAFE').length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-500 font-sans">
                        Tidak ada pangkalan yang terancam api pada radius perimeter monitoring saat ini.
                      </td>
                    </tr>
                  ) : (
                    threatSummaries
                      .filter((s) => s.threatLevel !== 'SAFE')
                      .map((s, idx) => {
                        const isCrit = s.threatLevel === 'CRITICAL';
                        const isWarn = s.threatLevel === 'WARNING';
                        return (
                          <tr key={idx} className="hover:bg-slate-900/60 font-mono-numbers">
                            <td className="p-2.5 font-bold text-white font-sans">
                              {s.base.name} ({s.base.code})
                            </td>
                            <td className="p-2.5 text-slate-400 font-sans">{s.base.koopsud}</td>
                            <td className="p-2.5 font-sans">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  isCrit
                                    ? 'bg-red-950 text-red-400 border border-red-800'
                                    : isWarn
                                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                    : 'bg-blue-950 text-blue-400 border border-blue-800'
                                }`}
                              >
                                {isCrit ? 'BAHAYA (Ring 1)' : isWarn ? 'WASPADA (Ring 2)' : 'SIAGA (Ring 3)'}
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-bold text-white">
                              {s.nearestHotspotDistanceKm} km
                            </td>
                            <td className="p-2.5 text-right text-amber-400 font-bold">
                              {s.maxFrpMw.toFixed(1)} MW
                            </td>
                            <td className="p-2.5 text-right text-slate-300">
                              {s.totalHotspotsNear} Titik
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Recommended Actions */}
          <div className="space-y-2 font-sans">
            <div className="font-bold text-sky-400 text-xs">
              III. PETUNJUK TINDAKAN PIMPINAN (DIRECTIVE)
            </div>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300 text-xs leading-relaxed">
              <li>
                <strong>Pangkalan dalam Ring 1 (Bahaya):</strong> Melipatgandakan regu pemadam PKP-PK pangkalan
                dalam status Siaga 1, periksa kesiapan pompa portabel dan jalur suplai air pangkalan.
              </li>
              <li>
                <strong>Satpomau dan Hanlan:</strong> Koordinasi dengan Polsek/Koramil sekitar untuk menutup
                potensi penyebaran api dari pembakaran lahan terbuka di batas pagar perimeter pangkalan.
              </li>
              <li>
                <strong>Puskodal Komando Operasi Udara:</strong> Mempersiapkan rencana sorti pesawat Water Bombing
                (Super Puma / Caracal) atau pesawat TMC Skadron 4 bila kabut asap mengganggu keselamatan penerbangan tempur/sipil.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-xs font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
