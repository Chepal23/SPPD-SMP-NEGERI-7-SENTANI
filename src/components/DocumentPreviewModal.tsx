import React, { useState } from 'react';
import { KopSurat, Pegawai, SPTItem, SPPDItem, PejabatPenandatangan, DasarHukum, RapatItem } from '../types';
import { LOGO_ASSETS } from '../data/defaultData';
import { formatTanggalIndonesia, formatRupiah, terbilangRupiah } from '../utils/documentFormatter';
import { Printer, X, Download, Copy, Check, FileText, CheckCircle2, Users, Calendar } from 'lucide-react';

export type PreviewDocType = 
  | 'spt' 
  | 'sppd_lembar1' 
  | 'sppd_lembar2' 
  | 'sppd_kuitansi' 
  | 'sppd_lengkap'
  | 'notulen_rapat'
  | 'daftar_hadir';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: PreviewDocType;
  spt?: SPTItem;
  sppd?: SPPDItem;
  rapat?: RapatItem;
  kop: KopSurat;
  pegawaiMap: Record<string, Pegawai>;
  pejabatMap: Record<string, PejabatPenandatangan>;
  dasarHukumMap: Record<string, DasarHukum>;
  rapatMap?: Record<string, RapatItem>;
  sptList?: SPTItem[];
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  documentType: initialDocType,
  spt,
  sppd,
  rapat: propRapat,
  kop,
  pegawaiMap,
  pejabatMap,
  dasarHukumMap,
  rapatMap = {},
  sptList = [],
}) => {
  const [activeView, setActiveView] = useState<PreviewDocType>(initialDocType);
  const [copied, setCopied] = useState(false);

  // Sync active view when modal opens with new initialDocType
  React.useEffect(() => {
    setActiveView(initialDocType);
  }, [initialDocType, isOpen]);

  if (!isOpen) return null;

  // Resolve active rapat (either directly passed or attached to the active SPT)
  const resolvedRapat: RapatItem | undefined = propRapat || (spt?.rapatId ? rapatMap[spt.rapatId] : undefined);

  const getLogoSrc = () => {
    if (kop.logoType === 'custom' && kop.customLogoUrl) {
      return kop.customLogoUrl;
    }
    if (kop.logoType === 'garuda') return LOGO_ASSETS.garuda;
    if (kop.logoType === 'pemda') return LOGO_ASSETS.pemda;
    return LOGO_ASSETS.tutwuri;
  };

  const getLogoKananSrc = () => {
    if (!kop.logoKananType || kop.logoKananType === 'none') return null;
    if (kop.logoKananType === 'custom' && kop.customLogoKananUrl) return kop.customLogoKananUrl;
    if (kop.logoKananType === 'garuda') return LOGO_ASSETS.garuda;
    if (kop.logoKananType === 'pemda') return LOGO_ASSETS.pemda;
    if (kop.logoKananType === 'tutwuri') return LOGO_ASSETS.tutwuri;
    return null;
  };

  const renderRightLogo = (sizeClass = 'max-h-20 max-w-20', containerClass = 'w-20 h-20') => {
    const src = getLogoKananSrc();
    if (!src) return <div className="w-16 shrink-0"></div>;
    return (
      <div className={`${containerClass} shrink-0 flex items-center justify-center overflow-hidden`}>
        <img 
          src={src} 
          alt="Logo Pendamping Kanan" 
          referrerPolicy="no-referrer"
          className={`${sizeClass} object-contain`}
        />
      </div>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const el = document.getElementById('printable-area');
    if (el) {
      navigator.clipboard.writeText(el.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Resolve active SPT and SPPD relations
  const resolvedPegawaiUtama = spt ? pegawaiMap[spt.pegawaiUtamaId] : (sppd ? pegawaiMap[sppd.pegawaiId] : undefined);
  const resolvedPenandatanganSPT = spt ? pejabatMap[spt.penandatanganId] : undefined;
  const resolvedPenandatanganSPPD = sppd ? pejabatMap[sppd.penandatanganId] : undefined;

  // Selected Dasar Hukum
  const resolvedDasarHukum = spt?.dasarHukumIds
    .map(id => dasarHukumMap[id])
    .filter(Boolean) || [];

  // Rincian Biaya SPPD
  const rincian = sppd?.rincianBiaya || {
    uangHarianPerHari: 380000,
    transportPP: 250000,
    penginapanPerMalam: 550000,
    jumlahMalam: (sppd?.lamaHari || 2) - 1 > 0 ? (sppd?.lamaHari || 2) - 1 : 0,
    uangRepresentasi: 0,
    biayaLainnya: 50000,
    keteranganBiayaLain: 'Biaya Tol / Parkir Resmi',
  };

  const totalUangHarian = (rincian.uangHarianPerHari || 0) * (sppd?.lamaHari || 1);
  const totalPenginapan = (rincian.penginapanPerMalam || 0) * (rincian.jumlahMalam || 0);
  const totalBiayaSemua = totalUangHarian + (rincian.transportPP || 0) + totalPenginapan + (rincian.uangRepresentasi || 0) + (rincian.biayaLainnya || 0);

  // Meeting participants resolution
  const pimpinanRapat = resolvedRapat ? pegawaiMap[resolvedRapat.pimpinanRapatId] : undefined;
  const notulisRapat = resolvedRapat ? pegawaiMap[resolvedRapat.notulisId] : undefined;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Toolbar (Hidden during browser printing) */}
        <div className="no-print bg-slate-800 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-sm sm:text-base">
              Pratinjau Cetak Dokumen Resmi
            </h3>
          </div>

          {/* Document Sub-tabs */}
          <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg text-xs overflow-x-auto max-w-full">
            {spt && (
              <button
                onClick={() => setActiveView('spt')}
                className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${activeView === 'spt' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-300 hover:text-white'}`}
              >
                Surat Tugas (SPT)
              </button>
            )}

            {/* If SPT has linked Rapat, show Notulen Lampiran Tab! */}
            {resolvedRapat && (
              <>
                <button
                  onClick={() => setActiveView('notulen_rapat')}
                  className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${activeView === 'notulen_rapat' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-300 hover:text-white'}`}
                >
                  {spt?.rapatId ? 'Lampiran Notulen SPT' : 'Notulen Rapat'}
                </button>
                <button
                  onClick={() => setActiveView('daftar_hadir')}
                  className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${activeView === 'daftar_hadir' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-300 hover:text-white'}`}
                >
                  Daftar Hadir
                </button>
              </>
            )}

            {sppd && (
              <>
                <button
                  onClick={() => setActiveView('sppd_lembar1')}
                  className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${activeView === 'sppd_lembar1' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-300 hover:text-white'}`}
                >
                  SPPD Lembar 1
                </button>
                <button
                  onClick={() => setActiveView('sppd_lembar2')}
                  className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${activeView === 'sppd_lembar2' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-300 hover:text-white'}`}
                >
                  SPPD Visum
                </button>
                <button
                  onClick={() => setActiveView('sppd_kuitansi')}
                  className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${activeView === 'sppd_kuitansi' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-300 hover:text-white'}`}
                >
                  Kuitansi Biaya
                </button>
                <button
                  onClick={() => setActiveView('sppd_lengkap')}
                  className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${activeView === 'sppd_lengkap' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-300 hover:text-white'}`}
                >
                  Cetak Lengkap
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="px-2.5 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md transition-colors flex items-center gap-1.5"
              title="Salin Teks Dokumen"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin Teks'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Sekarang (Ctrl+P)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Document Container */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-slate-100 flex justify-center flex-1">
          <div 
            id="printable-area"
            className="printable-document bg-white shadow-md border border-slate-300 text-black font-document w-full max-w-[210mm] p-6 sm:p-10 leading-normal text-[11pt]"
            style={{ minHeight: '297mm' }}
          >
            
            {/* RENDER SPT */}
            {(activeView === 'spt' || (activeView === 'sppd_lengkap' && spt)) && spt && (
              <div className={activeView === 'sppd_lengkap' ? 'page-break-after mb-12' : ''}>
                {/* KOP SURAT */}
                <div className="flex items-center justify-between pb-3 mb-4 kop-double-line">
                  <div className="w-20 h-20 shrink-0 flex items-center justify-center overflow-hidden">
                    <img 
                      src={getLogoSrc()} 
                      alt="Logo Instansi" 
                      referrerPolicy="no-referrer"
                      className="max-h-20 max-w-20 object-contain"
                    />
                  </div>
                  <div className="flex-1 text-center px-2">
                    <h4 className="text-[12pt] font-bold tracking-wide uppercase leading-tight">
                      {kop.pemerintahInduk}
                    </h4>
                    <h3 className="text-[13pt] font-bold uppercase leading-tight">
                      {kop.instansiInduk}
                    </h3>
                    <h2 className="text-[14pt] font-extrabold uppercase leading-tight tracking-wider">
                      {kop.unitKerja}
                    </h2>
                    <p className="text-[9pt] leading-tight mt-1 text-slate-800">
                      {kop.alamat}, {kop.kota} - Kodepos: {kop.kodePos}
                    </p>
                    <p className="text-[8.5pt] leading-tight text-slate-700">
                      Telp: {kop.telepon} · Pos-el: {kop.email} · Laman: {kop.website}
                    </p>
                  </div>
                  {renderRightLogo('max-h-20 max-w-20', 'w-20 h-20')}
                </div>

                {/* JUDUL SURAT */}
                <div className="text-center my-4">
                  <h3 className="text-[13pt] font-bold underline uppercase tracking-wide">
                    SURAT PERINTAH TUGAS
                  </h3>
                  <p className="text-[10.5pt] mt-0.5">
                    Nomor : {spt.nomorSPT}
                  </p>
                </div>

                {/* DASAR HUKUM */}
                <div className="text-justify my-3 text-[10.5pt]">
                  <table className="w-full border-none">
                    <tbody>
                      <tr className="align-top">
                        <td className="w-20 font-bold py-1">Dasar</td>
                        <td className="w-4 py-1">:</td>
                        <td className="py-1">
                          <ol className="list-decimal pl-4 space-y-1">
                            {resolvedDasarHukum.map((dh) => (
                              <li key={dh.id}>
                                {dh.nomor} {dh.tentang ? `tentang ${dh.tentang}` : ''}
                              </li>
                            ))}
                            {spt.dasarHukumCustom && (
                              <li>{spt.dasarHukumCustom}</li>
                            )}
                            {/* If meeting is linked, add meeting as formal mandate basis */}
                            {resolvedRapat && (
                              <li>
                                Hasil {resolvedRapat.judulRapat} Nomor {resolvedRapat.nomorRapat} tanggal {formatTanggalIndonesia(resolvedRapat.hariTanggal)}.
                              </li>
                            )}
                          </ol>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* MEMERINTAHKAN */}
                <div className="text-center my-3 font-bold tracking-widest text-[11pt]">
                  MEMERINTAHKAN:
                </div>

                {/* KEPADA */}
                <div className="my-2 text-[10.5pt]">
                  <table className="w-full border-none">
                    <tbody>
                      <tr className="align-top">
                        <td className="w-20 font-bold py-1">Kepada</td>
                        <td className="w-4 py-1">:</td>
                        <td className="py-1">
                          {resolvedPegawaiUtama ? (
                            <table className="w-full border border-black text-[10pt] mb-2">
                              <thead>
                                <tr className="bg-slate-50 font-bold border-b border-black text-center">
                                  <th className="border-r border-black p-1.5 w-8">No</th>
                                  <th className="border-r border-black p-1.5">Nama / NIP</th>
                                  <th className="border-r border-black p-1.5">Pangkat / Gol.</th>
                                  <th className="p-1.5">Jabatan</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="border-b border-black">
                                  <td className="border-r border-black p-1.5 text-center">1</td>
                                  <td className="border-r border-black p-1.5 font-bold">
                                    {resolvedPegawaiUtama.nama}
                                    <div className="text-[9pt] font-normal text-slate-700">NIP. {resolvedPegawaiUtama.nip}</div>
                                  </td>
                                  <td className="border-r border-black p-1.5">{resolvedPegawaiUtama.pangkatGolongan}</td>
                                  <td className="p-1.5">{resolvedPegawaiUtama.jabatan}</td>
                                </tr>
                                {spt.pengikutIds.map((pId, idx) => {
                                  const pegPengikut = pegawaiMap[pId];
                                  if (!pegPengikut) return null;
                                  return (
                                    <tr key={pId} className="border-b border-black">
                                      <td className="border-r border-black p-1.5 text-center">{idx + 2}</td>
                                      <td className="border-r border-black p-1.5 font-bold">
                                        {pegPengikut.nama}
                                        <div className="text-[9pt] font-normal text-slate-700">NIP. {pegPengikut.nip}</div>
                                      </td>
                                      <td className="border-r border-black p-1.5">{pegPengikut.pangkatGolongan}</td>
                                      <td className="p-1.5">{pegPengikut.jabatan}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          ) : (
                            <span className="italic">Pegawai belum ditentukan</span>
                          )}
                        </td>
                      </tr>

                      {/* UNTUK */}
                      <tr className="align-top">
                        <td className="w-20 font-bold py-1">Untuk</td>
                        <td className="w-4 py-1">:</td>
                        <td className="py-1">
                          <ol className="list-decimal pl-4 space-y-1.5">
                            <li>
                              <strong>Maksud Penugasan:</strong> {spt.maksudTugas}
                            </li>
                            <li>
                              <strong>Tempat Tujuan:</strong> {spt.tempatTujuan}
                            </li>
                            <li>
                              <strong>Waktu Pelaksanaan:</strong> Selama {spt.lamaHari} (
                              {terbilangRupiah(spt.lamaHari).replace(' Rupiah', '')}) hari kerja, terhitung mulai tanggal{' '}
                              <strong>{formatTanggalIndonesia(spt.tanggalBerangkat)}</strong> s/d{' '}
                              <strong>{formatTanggalIndonesia(spt.tanggalKembali)}</strong>.
                            </li>
                            <li>
                              <strong>Alat Angkutan:</strong> {spt.alatAngkutan}
                            </li>
                            <li>
                              <strong>Pembebanan Anggaran:</strong> Dibebankan pada {spt.bebanAnggaran} - Rekening {spt.mataAnggaran}.
                            </li>
                            {resolvedRapat && (
                              <li>
                                <strong>Dokumen Lampiran:</strong> Dilampirkan Notulen Rapat Koordinasi Nomor {resolvedRapat.nomorRapat} beserta Daftar Hadir Peserta.
                              </li>
                            )}
                            <li>
                              Melaporkan hasil pelaksanaan tugas kepada pejabat pemberi perintah segera setelah tugas selesai dilaksanakan.
                            </li>
                          </ol>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* PENUTUP & TANDA TANGAN */}
                <div className="mt-4 text-[10.5pt]">
                  <p className="text-justify leading-relaxed">
                    Demikian surat perintah tugas ini dibuat untuk dilaksanakan dengan penuh rasa tanggung jawab.
                  </p>
                </div>

                <div className="mt-8 flex justify-end text-[10.5pt] avoid-break-inside">
                  <div className="w-72 text-left">
                    <p>Dikeluarkan di : {resolvedPenandatanganSPT?.kotaTitimangsa || kop.kota}</p>
                    <p>Pada tanggal : {formatTanggalIndonesia(spt.tanggalSurat)}</p>
                    <p className="mt-2 font-bold uppercase">
                      {resolvedPenandatanganSPT?.jabatan || 'Kepala Instansi'}
                    </p>
                    <div className="h-20"></div>
                    <p className="font-bold underline">
                      {resolvedPenandatanganSPT?.nama || '...........................................'}
                    </p>
                    <p>NIP. {resolvedPenandatanganSPT?.nip || '-'}</p>
                    <p className="text-[9.5pt]">{resolvedPenandatanganSPT?.pangkatGolongan || ''}</p>
                  </div>
                </div>
              </div>
            )}

            {/* RENDER NOTULEN RAPAT RESMI */}
            {activeView === 'notulen_rapat' && resolvedRapat && (
              <div>
                {/* KOP SURAT NOTULEN */}
                <div className="flex items-center justify-between pb-3 mb-4 kop-double-line">
                  <div className="w-20 h-20 shrink-0 flex items-center justify-center overflow-hidden">
                    <img 
                      src={getLogoSrc()} 
                      alt="Logo Instansi" 
                      referrerPolicy="no-referrer"
                      className="max-h-20 max-w-20 object-contain"
                    />
                  </div>
                  <div className="flex-1 text-center px-2">
                    <h4 className="text-[12pt] font-bold tracking-wide uppercase leading-tight">
                      {kop.pemerintahInduk}
                    </h4>
                    <h3 className="text-[13pt] font-bold uppercase leading-tight">
                      {kop.instansiInduk}
                    </h3>
                    <h2 className="text-[14pt] font-extrabold uppercase leading-tight tracking-wider">
                      {kop.unitKerja}
                    </h2>
                    <p className="text-[9pt] leading-tight mt-1 text-slate-800">
                      {kop.alamat}, {kop.kota} - Telp: {kop.telepon}
                    </p>
                  </div>
                  {renderRightLogo('max-h-20 max-w-20', 'w-20 h-20')}
                </div>

                {/* JUDUL NOTULEN */}
                <div className="text-center my-4">
                  <h3 className="text-[13pt] font-bold underline uppercase tracking-wide">
                    NOTULEN RAPAT KEDINASAN
                  </h3>
                  <p className="text-[10pt] mt-0.5">
                    Nomor: {resolvedRapat.nomorRapat}
                  </p>
                </div>

                {/* IDENTITAS RAPAT */}
                <div className="border border-black p-3.5 mb-4 text-[10pt] bg-slate-50/50">
                  <table className="w-full border-none">
                    <tbody>
                      <tr>
                        <td className="w-32 py-1 font-semibold">Hari / Tanggal</td>
                        <td className="w-4 py-1">:</td>
                        <td className="py-1">{formatTanggalIndonesia(resolvedRapat.hariTanggal)}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-semibold">Waktu Pelaksanaan</td>
                        <td className="py-1">:</td>
                        <td className="py-1">{resolvedRapat.waktuMulai} s/d {resolvedRapat.waktuSelesai}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-semibold">Tempat</td>
                        <td className="py-1">:</td>
                        <td className="py-1">{resolvedRapat.tempat}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-semibold">Acara / Agenda</td>
                        <td className="py-1">:</td>
                        <td className="py-1 font-bold">{resolvedRapat.judulRapat}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-semibold">Pokok Bahasan</td>
                        <td className="py-1">:</td>
                        <td className="py-1">{resolvedRapat.agenda}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-semibold">Pimpinan Rapat</td>
                        <td className="py-1">:</td>
                        <td className="py-1">{pimpinanRapat?.nama || '-'} (NIP. {pimpinanRapat?.nip || '-'})</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-semibold">Notulis / Pencatat</td>
                        <td className="py-1">:</td>
                        <td className="py-1">{notulisRapat?.nama || '-'} (NIP. {notulisRapat?.nip || '-'})</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-semibold">Kehadiran Peserta</td>
                        <td className="py-1">:</td>
                        <td className="py-1">
                          {(resolvedRapat.daftarHadir || []).filter(d => d.status === 'Hadir').length} Orang Hadir dari {(resolvedRapat.daftarHadir || []).length} Staf Terdaftar (Daftar Hadir Terlampir)
                        </td>
                      </tr>
                      {resolvedRapat.sptIdTerhubung && (
                        <tr>
                          <td className="py-1 font-semibold text-indigo-900">Perjalanan Dinas Terkait</td>
                          <td className="py-1">:</td>
                          <td className="py-1 font-mono text-xs font-bold text-indigo-900">
                            Terhubung ke SPT: {sptList.find(s => s.id === resolvedRapat.sptIdTerhubung)?.nomorSPT || resolvedRapat.sptIdTerhubung}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* JALANNYA RAPAT */}
                <div className="space-y-3 text-[10.5pt] text-justify leading-relaxed">
                  <div>
                    <h4 className="font-bold uppercase text-[11pt] border-b border-black pb-1 mb-1.5">
                      I. PEMBUKAAN
                    </h4>
                    <p className="whitespace-pre-line pl-2">
                      {resolvedRapat.notulensi.pembukaan || 'Rapat dibuka oleh pimpinan rapat sesuai jadwal yang ditentukan.'}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold uppercase text-[11pt] border-b border-black pb-1 mb-1.5">
                      II. POKOK PEMBAHASAN
                    </h4>
                    <p className="whitespace-pre-line pl-2">
                      {resolvedRapat.notulensi.pembahasan || 'Pembahasan materi agenda rapat berlangsung secara aktif dan konstruktif.'}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold uppercase text-[11pt] border-b border-black pb-1 mb-1.5">
                      III. KESIMPULAN & KEPUTUSAN RAPAT
                    </h4>
                    <p className="whitespace-pre-line pl-2 font-medium">
                      {resolvedRapat.notulensi.kesimpulanKeputusan || 'Keputusan rapat disepakati oleh seluruh peserta yang hadir.'}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold uppercase text-[11pt] border-b border-black pb-1 mb-1.5">
                      IV. TINDAK LANJUT & PENUGASAN DINAS
                    </h4>
                    <p className="whitespace-pre-line pl-2">
                      {resolvedRapat.notulensi.tindakLanjut || 'Tindak lanjut dilaksanakan oleh unit kerja terkait.'}
                    </p>
                  </div>
                </div>

                {/* TANDA TANGAN NOTULEN (2 PIHAK: PIMPINAN & NOTULIS) */}
                <div className="mt-8 grid grid-cols-2 gap-8 text-[10pt] avoid-break-inside">
                  <div className="text-center">
                    <p>Mengetahui / Mengesahkan,</p>
                    <p className="font-bold">{pimpinanRapat?.jabatan || 'Pimpinan Rapat'}</p>
                    <div className="h-20"></div>
                    <p className="font-bold underline">{pimpinanRapat?.nama || '...........................................'}</p>
                    <p>NIP. {pimpinanRapat?.nip || '-'}</p>
                  </div>

                  <div className="text-center">
                    <p>{kop.kota}, {formatTanggalIndonesia(resolvedRapat.hariTanggal)}</p>
                    <p className="font-bold">Notulis Rapat,</p>
                    <div className="h-20"></div>
                    <p className="font-bold underline">{notulisRapat?.nama || '...........................................'}</p>
                    <p>NIP. {notulisRapat?.nip || '-'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* RENDER DAFTAR HADIR RAPAT (PRESENSI) */}
            {activeView === 'daftar_hadir' && resolvedRapat && (
              <div>
                {/* KOP SURAT */}
                <div className="flex items-center justify-between pb-3 mb-4 kop-double-line">
                  <div className="w-16 h-16 shrink-0 flex items-center justify-center overflow-hidden">
                    <img 
                      src={getLogoSrc()} 
                      alt="Logo Instansi" 
                      referrerPolicy="no-referrer"
                      className="max-h-16 max-w-16 object-contain"
                    />
                  </div>
                  <div className="flex-1 text-center px-2">
                    <h4 className="text-[11pt] font-bold tracking-wide uppercase leading-tight">
                      {kop.pemerintahInduk}
                    </h4>
                    <h3 className="text-[12pt] font-bold uppercase leading-tight">
                      {kop.instansiInduk}
                    </h3>
                    <h2 className="text-[13pt] font-extrabold uppercase leading-tight">
                      {kop.unitKerja}
                    </h2>
                    <p className="text-[8pt] leading-tight mt-0.5 text-slate-800">
                      {kop.alamat}, {kop.kota} - Telp: {kop.telepon}
                    </p>
                  </div>
                  {renderRightLogo('max-h-16 max-w-16', 'w-16 h-16')}
                </div>

                <div className="text-center my-4">
                  <h3 className="text-[12pt] font-bold underline uppercase tracking-wide">
                    DAFTAR HADIR PESERTA RAPAT
                  </h3>
                  <p className="text-[9.5pt]">
                    Lampiran Notulen Rapat Nomor: {resolvedRapat.nomorRapat}
                  </p>
                </div>

                <div className="mb-3 text-[9.5pt]">
                  <p><strong>Hari / Tanggal:</strong> {formatTanggalIndonesia(resolvedRapat.hariTanggal)} ({resolvedRapat.waktuMulai} - {resolvedRapat.waktuSelesai})</p>
                  <p><strong>Tempat:</strong> {resolvedRapat.tempat}</p>
                  <p><strong>Acara:</strong> {resolvedRapat.judulRapat}</p>
                </div>

                {/* TABEL PRESENSI */}
                <table className="w-full border-collapse border border-black text-[9pt] mb-6">
                  <thead>
                    <tr className="bg-slate-50 border-b border-black text-center font-bold">
                      <th className="border-r border-black p-1.5 w-8">No</th>
                      <th className="border-r border-black p-1.5">Nama Lengkap & NIP</th>
                      <th className="border-r border-black p-1.5">Pangkat / Gol.</th>
                      <th className="border-r border-black p-1.5">Jabatan</th>
                      <th className="border-r border-black p-1.5 w-24">Status</th>
                      <th className="p-1.5 w-32">Tanda Tangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(resolvedRapat.daftarHadir || []).map((dh, idx) => {
                      const p = pegawaiMap[dh.pegawaiId];
                      return (
                        <tr key={dh.pegawaiId} className="border-b border-black">
                          <td className="border-r border-black p-1.5 text-center">{idx + 1}</td>
                          <td className="border-r border-black p-1.5">
                            <span className="font-bold">{p?.nama || '-'}</span>
                            <div className="text-[8pt] text-slate-600">NIP. {p?.nip || '-'}</div>
                          </td>
                          <td className="border-r border-black p-1.5 text-[8.5pt]">{p?.pangkatGolongan || '-'}</td>
                          <td className="border-r border-black p-1.5 text-[8.5pt]">{p?.jabatan || '-'}</td>
                          <td className="border-r border-black p-1.5 text-center font-semibold">
                            {dh.status}
                            {dh.waktuHadir && <div className="text-[7.5pt] font-normal text-slate-600">{dh.waktuHadir}</div>}
                          </td>
                          <td className="p-1.5 text-center font-mono text-[8.5pt]">
                            {idx % 2 === 0 ? `${idx + 1}. ....................` : `    ${idx + 1}. ....................`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* TANDA TANGAN PIMPINAN */}
                <div className="mt-8 flex justify-end text-[10pt] avoid-break-inside">
                  <div className="w-72 text-left">
                    <p>{kop.kota}, {formatTanggalIndonesia(resolvedRapat.hariTanggal)}</p>
                    <p className="font-bold">Mengetahui / Pimpinan Rapat,</p>
                    <div className="h-16"></div>
                    <p className="font-bold underline">{pimpinanRapat?.nama || '...........................................'}</p>
                    <p>NIP. {pimpinanRapat?.nip || '-'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* RENDER SPPD LEMBAR 1 (Halaman Depan) */}
            {(activeView === 'sppd_lembar1' || activeView === 'sppd_lengkap') && sppd && (
              <div className={activeView === 'sppd_lengkap' ? 'page-break-after mb-12' : ''}>
                {/* KOP SURAT */}
                <div className="flex items-center justify-between pb-2 mb-3 kop-double-line">
                  <div className="w-16 h-16 shrink-0 flex items-center justify-center overflow-hidden">
                    <img 
                      src={getLogoSrc()} 
                      alt="Logo Instansi" 
                      referrerPolicy="no-referrer"
                      className="max-h-16 max-w-16 object-contain"
                    />
                  </div>
                  <div className="flex-1 text-center px-2">
                    <h4 className="text-[11pt] font-bold tracking-wide uppercase leading-tight">
                      {kop.pemerintahInduk}
                    </h4>
                    <h3 className="text-[12pt] font-bold uppercase leading-tight">
                      {kop.instansiInduk}
                    </h3>
                    <h2 className="text-[13pt] font-extrabold uppercase leading-tight">
                      {kop.unitKerja}
                    </h2>
                    <p className="text-[8pt] leading-tight mt-0.5 text-slate-800">
                      {kop.alamat}, {kop.kota} - Telp: {kop.telepon}
                    </p>
                  </div>
                  {renderRightLogo('max-h-16 max-w-16', 'w-16 h-16')}
                </div>

                <div className="text-right text-[8.5pt] mb-2">
                  <p>Lembar Ke : I (Satu)</p>
                  <p>Kode No : {sppd.mataAnggaran}</p>
                  <p>Nomor : {sppd.nomorSPPD}</p>
                </div>

                <div className="text-center mb-3">
                  <h3 className="text-[12pt] font-bold underline uppercase tracking-wider">
                    SURAT PERINTAH PERJALANAN DINAS
                  </h3>
                  <p className="text-[10pt] font-medium">
                    ( S P P D )
                  </p>
                </div>

                {/* TABEL SPPD 10 KOLOM RESMI */}
                <table className="w-full border-collapse border border-black text-[9.5pt]">
                  <tbody>
                    <tr className="border border-black">
                      <td className="w-8 border-r border-black p-1.5 text-center font-bold">1.</td>
                      <td className="w-64 border-r border-black p-1.5">Pejabat Pembuat Komitmen</td>
                      <td className="p-1.5 font-medium">
                        {resolvedPenandatanganSPPD?.nama || 'Kepala Sekolah / PPK'}
                      </td>
                    </tr>

                    <tr className="border border-black">
                      <td className="border-r border-black p-1.5 text-center font-bold">2.</td>
                      <td className="border-r border-black p-1.5">Nama / NIP Pegawai yang diperintahkan</td>
                      <td className="p-1.5 font-bold">
                        {resolvedPegawaiUtama?.nama}
                        <div className="text-[8.5pt] font-normal">NIP. {resolvedPegawaiUtama?.nip}</div>
                      </td>
                    </tr>

                    <tr className="border border-black">
                      <td className="border-r border-black p-1.5 text-center font-bold">3.</td>
                      <td className="border-r border-black p-1.5">
                        a. Pangkat dan Golongan ruang<br/>
                        b. Jabatan / Instansi<br/>
                        c. Tingkat Biaya Perjalanan Dinas
                      </td>
                      <td className="p-1.5">
                        a. {resolvedPegawaiUtama?.pangkatGolongan}<br/>
                        b. {resolvedPegawaiUtama?.jabatan} / {resolvedPegawaiUtama?.instansi}<br/>
                        c. {sppd.tingkatBiaya || 'Tingkat B'}
                      </td>
                    </tr>

                    <tr className="border border-black">
                      <td className="border-r border-black p-1.5 text-center font-bold">4.</td>
                      <td className="border-r border-black p-1.5">Maksud Perjalanan Dinas</td>
                      <td className="p-1.5 leading-snug">{sppd.maksudPerjalanan}</td>
                    </tr>

                    <tr className="border border-black">
                      <td className="border-r border-black p-1.5 text-center font-bold">5.</td>
                      <td className="border-r border-black p-1.5">Alat angkut yang dipergunakan</td>
                      <td className="p-1.5">{sppd.alatAngkut}</td>
                    </tr>

                    <tr className="border border-black">
                      <td className="border-r border-black p-1.5 text-center font-bold">6.</td>
                      <td className="border-r border-black p-1.5">
                        a. Tempat berangkat<br/>
                        b. Tempat tujuan
                      </td>
                      <td className="p-1.5">
                        a. {sppd.tempatBerangkat}<br/>
                        b. {sppd.tempatTujuan}
                      </td>
                    </tr>

                    <tr className="border border-black">
                      <td className="border-r border-black p-1.5 text-center font-bold">7.</td>
                      <td className="border-r border-black p-1.5">
                        a. Lamanya Perjalanan Dinas<br/>
                        b. Tanggal berangkat<br/>
                        c. Tanggal harus kembali
                      </td>
                      <td className="p-1.5">
                        a. {sppd.lamaHari} hari<br/>
                        b. {formatTanggalIndonesia(sppd.tanggalBerangkat)}<br/>
                        c. {formatTanggalIndonesia(sppd.tanggalKembali)}
                      </td>
                    </tr>

                    <tr className="border border-black">
                      <td className="border-r border-black p-1.5 text-center font-bold">8.</td>
                      <td className="border-r border-black p-1.5">
                        Pengikut: Nama / NIP
                      </td>
                      <td className="p-1.5">
                        {sppd.pengikut && sppd.pengikut.length > 0 ? (
                          <ol className="list-decimal pl-4">
                            {sppd.pengikut.map((p, idx) => (
                              <li key={idx}>
                                {p.nama} {p.nip ? `(NIP. ${p.nip})` : ''} - {p.keterangan || 'Anggota'}
                              </li>
                            ))}
                          </ol>
                        ) : (
                          <span>- (Tidak ada pengikut)</span>
                        )}
                      </td>
                    </tr>

                    <tr className="border border-black">
                      <td className="border-r border-black p-1.5 text-center font-bold">9.</td>
                      <td className="border-r border-black p-1.5">
                        Pembebanan Anggaran<br/>
                        a. Instansi<br/>
                        b. Mata Anggaran (Akun)
                      </td>
                      <td className="p-1.5">
                        <br/>
                        a. {sppd.instansiBeban}<br/>
                        b. {sppd.mataAnggaran}
                      </td>
                    </tr>

                    <tr className="border border-black">
                      <td className="border-r border-black p-1.5 text-center font-bold">10.</td>
                      <td className="border-r border-black p-1.5">Keterangan lain-lain</td>
                      <td className="p-1.5">{sppd.keteranganLain || '-'}</td>
                    </tr>
                  </tbody>
                </table>

                {/* TANDA TANGAN LEMBAR 1 */}
                <div className="mt-6 flex justify-end text-[10pt] avoid-break-inside">
                  <div className="w-72 text-left">
                    <p>Dikeluarkan di : {sppd.kotaDikeluarkan || kop.kota}</p>
                    <p>Pada tanggal : {formatTanggalIndonesia(sppd.tanggalDikeluarkan)}</p>
                    <p className="mt-1 font-bold">
                      {resolvedPenandatanganSPPD?.jabatan || 'Pejabat Pembuat Komitmen'}
                    </p>
                    <div className="h-20"></div>
                    <p className="font-bold underline">
                      {resolvedPenandatanganSPPD?.nama || '...........................................'}
                    </p>
                    <p>NIP. {resolvedPenandatanganSPPD?.nip || '-'}</p>
                    <p className="text-[9pt]">{resolvedPenandatanganSPPD?.pangkatGolongan || ''}</p>
                  </div>
                </div>
              </div>
            )}

            {/* RENDER SPPD LEMBAR 2 (Visum Perjalanan Dinas) */}
            {(activeView === 'sppd_lembar2' || activeView === 'sppd_lengkap') && sppd && (
              <div className={activeView === 'sppd_lengkap' ? 'page-break-after mb-12' : ''}>
                <div className="text-right text-[8.5pt] mb-2">
                  <p>SPPD No : {sppd.nomorSPPD}</p>
                  <p>Lembar Ke : II (Visum Catatan Perjalanan)</p>
                </div>

                <div className="text-center mb-3">
                  <h3 className="text-[11.5pt] font-bold uppercase tracking-wide">
                    LEMBAR VISUM PERJALANAN DINAS
                  </h3>
                  <p className="text-[9pt] text-slate-700">
                    (Pengesahan Pejabat Tempat Berangkat, Tempat Tujuan, dan Kedatangan Kembali)
                  </p>
                </div>

                {/* TABEL VISUM LEMBAR 2 */}
                <table className="w-full border-collapse border border-black text-[8.5pt]">
                  <tbody>
                    {/* BAGIAN I */}
                    <tr className="border border-black">
                      <td className="w-1/2 border-r border-black p-2 align-top">
                        {/* Kolom Berangkat Awal */}
                      </td>
                      <td className="w-1/2 p-2 align-top">
                        <p>I. Berangkat dari : {sppd.tempatBerangkat}</p>
                        <p className="pl-3">(Tempat Kedudukan)</p>
                        <p>Ke : {sppd.tempatTujuan}</p>
                        <p>Pada tanggal : {formatTanggalIndonesia(sppd.tanggalBerangkat)}</p>
                        <p className="mt-1 font-semibold">{resolvedPenandatanganSPPD?.jabatan || 'Pejabat Pembuat Komitmen'}</p>
                        <div className="h-12"></div>
                        <p className="font-bold underline">{resolvedPenandatanganSPPD?.nama}</p>
                        <p>NIP. {resolvedPenandatanganSPPD?.nip}</p>
                      </td>
                    </tr>

                    {/* BAGIAN II */}
                    <tr className="border border-black">
                      <td className="border-r border-black p-2 align-top">
                        <p>II. Tiba di : {sppd.tempatTujuan}</p>
                        <p>Pada tanggal : {formatTanggalIndonesia(sppd.tanggalBerangkat)}</p>
                        <p className="mt-1 font-semibold">Kepala / Pejabat di Tempat Tujuan</p>
                        <div className="h-12"></div>
                        <p className="font-bold underline">(........................................................)</p>
                        <p>NIP.</p>
                      </td>
                      <td className="p-2 align-top">
                        <p>Berangkat dari : {sppd.tempatTujuan}</p>
                        <p>Ke : {sppd.tempatBerangkat}</p>
                        <p>Pada tanggal : {formatTanggalIndonesia(sppd.tanggalKembali)}</p>
                        <p className="mt-1 font-semibold">Kepala / Pejabat di Tempat Tujuan</p>
                        <div className="h-12"></div>
                        <p className="font-bold underline">(........................................................)</p>
                        <p>NIP.</p>
                      </td>
                    </tr>

                    {/* BAGIAN III */}
                    <tr className="border border-black">
                      <td className="border-r border-black p-2 align-top">
                        <p>III. Tiba di : ............................................</p>
                        <p>Pada tanggal : ............................................</p>
                        <div className="h-10"></div>
                        <p className="font-bold underline">(........................................................)</p>
                        <p>NIP.</p>
                      </td>
                      <td className="p-2 align-top">
                        <p>Berangkat dari : ............................................</p>
                        <p>Ke : ............................................</p>
                        <p>Pada tanggal : ............................................</p>
                        <div className="h-10"></div>
                        <p className="font-bold underline">(........................................................)</p>
                        <p>NIP.</p>
                      </td>
                    </tr>

                    {/* BAGIAN IV */}
                    <tr className="border border-black">
                      <td className="border-r border-black p-2 align-top">
                        <p>IV. Tiba di : {sppd.tempatBerangkat}</p>
                        <p>(Tempat Kedudukan Asal)</p>
                        <p>Pada tanggal : {formatTanggalIndonesia(sppd.tanggalKembali)}</p>
                        <p className="mt-1 font-semibold">{resolvedPenandatanganSPPD?.jabatan || 'Pejabat Pembuat Komitmen'}</p>
                        <div className="h-12"></div>
                        <p className="font-bold underline">{resolvedPenandatanganSPPD?.nama}</p>
                        <p>NIP. {resolvedPenandatanganSPPD?.nip}</p>
                      </td>
                      <td className="p-2 align-top text-justify">
                        <p className="leading-snug">
                          Telah diperiksa dengan keterangan bahwa perjalanan tersebut di atas benar-benar dilakukan atas perintahnya dan semata-mata untuk kepentingan jabatan dalam waktu yang sesingkat-singkatnya.
                        </p>
                        <p className="mt-2 font-semibold">{resolvedPenandatanganSPPD?.jabatan || 'Pejabat Pembuat Komitmen'}</p>
                        <div className="h-12"></div>
                        <p className="font-bold underline">{resolvedPenandatanganSPPD?.nama}</p>
                        <p>NIP. {resolvedPenandatanganSPPD?.nip}</p>
                      </td>
                    </tr>

                    {/* BAGIAN V */}
                    <tr className="border border-black">
                      <td colSpan={2} className="p-2">
                        <p className="font-semibold">V. CATATAN LAIN-LAIN:</p>
                        <p className="text-slate-700 text-[8pt] italic">
                          Pejabat yang berwenang menerbitkan SPPD, pegawai yang melakukan perjalanan dinas, para pejabat yang mengesahkan tanggal berangkat/tiba bertanggung jawab menurut peraturan perundang-undangan keuangan negara jika negara menderita rugi akibat kesalahan, kelalaian, dan kealpaannya.
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* RENDER KUITANSI & RINCIAN BIAYA RIIL */}
            {(activeView === 'sppd_kuitansi' || activeView === 'sppd_lengkap') && sppd && (
              <div className="avoid-break-inside">
                {/* KOP KUITANSI */}
                <div className="flex items-center justify-between pb-2 mb-3 kop-double-line">
                  <div className="w-16 h-16 shrink-0 flex items-center justify-center overflow-hidden">
                    <img 
                      src={getLogoSrc()} 
                      alt="Logo Instansi" 
                      referrerPolicy="no-referrer"
                      className="max-h-16 max-w-16 object-contain"
                    />
                  </div>
                  <div className="flex-1 text-center px-2">
                    <h3 className="text-[12pt] font-bold uppercase leading-tight">
                      {kop.instansiInduk}
                    </h3>
                    <h2 className="text-[13pt] font-extrabold uppercase leading-tight">
                      {kop.unitKerja}
                    </h2>
                    <p className="text-[8.5pt] leading-tight mt-0.5 text-slate-800">
                      Tahun Anggaran 2026 · Bukti Pengeluaran Kas Perjalanan Dinas
                    </p>
                  </div>
                  {renderRightLogo('max-h-16 max-w-16', 'w-16 h-16')}
                </div>

                <div className="text-center mb-4">
                  <h3 className="text-[12pt] font-bold underline uppercase tracking-wide">
                    RINCIAN BIAYA PERJALANAN DINAS
                  </h3>
                  <p className="text-[9.5pt]">
                    Lampiran SPPD Nomor: {sppd.nomorSPPD}
                  </p>
                </div>

                {/* TABEL RINCIAN BIAYA */}
                <table className="w-full border-collapse border border-black text-[9.5pt] mb-3">
                  <thead>
                    <tr className="bg-slate-50 border-b border-black text-center font-bold">
                      <th className="border-r border-black p-1.5 w-8">No</th>
                      <th className="border-r border-black p-1.5">Perincian Biaya</th>
                      <th className="border-r border-black p-1.5 w-32">Jumlah (Rp)</th>
                      <th className="p-1.5 w-40">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="border-r border-black p-1.5 text-center">1</td>
                      <td className="border-r border-black p-1.5">
                        Uang Harian Perjalanan Dinas ({sppd.lamaHari} hari x {formatRupiah(rincian.uangHarianPerHari)})
                      </td>
                      <td className="border-r border-black p-1.5 text-right font-mono tabular-nums font-semibold">
                        {formatRupiah(totalUangHarian)}
                      </td>
                      <td className="p-1.5 text-xs text-slate-600">Standar Biaya Masukan</td>
                    </tr>

                    <tr className="border-b border-black">
                      <td className="border-r border-black p-1.5 text-center">2</td>
                      <td className="border-r border-black p-1.5">
                        Biaya Transportasi PP ({sppd.alatAngkut})
                      </td>
                      <td className="border-r border-black p-1.5 text-right font-mono tabular-nums font-semibold">
                        {formatRupiah(rincian.transportPP)}
                      </td>
                      <td className="p-1.5 text-xs text-slate-600">Bukti Tiket / Kuitansi</td>
                    </tr>

                    <tr className="border-b border-black">
                      <td className="border-r border-black p-1.5 text-center">3</td>
                      <td className="border-r border-black p-1.5">
                        Biaya Penginapan / Hotel ({rincian.jumlahMalam} malam x {formatRupiah(rincian.penginapanPerMalam)})
                      </td>
                      <td className="border-r border-black p-1.5 text-right font-mono tabular-nums font-semibold">
                        {formatRupiah(totalPenginapan)}
                      </td>
                      <td className="p-1.5 text-xs text-slate-600">Bill / Invoice Hotel</td>
                    </tr>

                    {rincian.uangRepresentasi > 0 && (
                      <tr className="border-b border-black">
                        <td className="border-r border-black p-1.5 text-center">4</td>
                        <td className="border-r border-black p-1.5">Uang Representasi Pejabat</td>
                        <td className="border-r border-black p-1.5 text-right font-mono tabular-nums font-semibold">
                          {formatRupiah(rincian.uangRepresentasi)}
                        </td>
                        <td className="p-1.5 text-xs text-slate-600">Sesuai Peraturan</td>
                      </tr>
                    )}

                    {rincian.biayaLainnya > 0 && (
                      <tr className="border-b border-black">
                        <td className="border-r border-black p-1.5 text-center">5</td>
                        <td className="border-r border-black p-1.5">
                          Biaya Lain-Lain ({rincian.keteranganBiayaLain || 'Tol / Parkir'})
                        </td>
                        <td className="border-r border-black p-1.5 text-right font-mono tabular-nums font-semibold">
                          {formatRupiah(rincian.biayaLainnya)}
                        </td>
                        <td className="p-1.5 text-xs text-slate-600">Pengeluaran Riil</td>
                      </tr>
                    )}

                    {/* TOTAL */}
                    <tr className="border-t-2 border-black font-bold bg-slate-50">
                      <td colSpan={2} className="border-r border-black p-2 text-right uppercase">
                        Jumlah Total :
                      </td>
                      <td className="border-r border-black p-2 text-right font-mono tabular-nums text-[10.5pt]">
                        {formatRupiah(totalBiayaSemua)}
                      </td>
                      <td className="p-2 text-xs">Lunas Dibayarkan</td>
                    </tr>
                  </tbody>
                </table>

                {/* TERBILANG BOX */}
                <div className="border border-black p-2 bg-slate-50 text-[9.5pt] mb-4">
                  <strong>Terbilang:</strong> <span className="italic font-medium">{terbilangRupiah(totalBiayaSemua)}</span>
                </div>

                {/* TANDA TANGAN 3 PIHAK: PPK, BENDAHARA, PEGAWAI */}
                <div className="grid grid-cols-3 gap-2 text-center text-[8.5pt] mt-6 avoid-break-inside">
                  <div>
                    <p>Mengetahui / Menyetujui,</p>
                    <p className="font-bold">{resolvedPenandatanganSPPD?.jabatan || 'Pejabat Pembuat Komitmen'}</p>
                    <div className="h-16"></div>
                    <p className="font-bold underline">{resolvedPenandatanganSPPD?.nama}</p>
                    <p>NIP. {resolvedPenandatanganSPPD?.nip}</p>
                  </div>

                  <div>
                    <p>Lunas Dibayar Tgl: {formatTanggalIndonesia(sppd.tanggalDikeluarkan)}</p>
                    <p className="font-bold">Bendahara Pengeluaran,</p>
                    <div className="h-16"></div>
                    <p className="font-bold underline">Dewi Sartika, S.E.</p>
                    <p>NIP. 19920315 201902 2 007</p>
                  </div>

                  <div>
                    <p>{sppd.kotaDikeluarkan || kop.kota}, {formatTanggalIndonesia(sppd.tanggalDikeluarkan)}</p>
                    <p className="font-bold">Yang Menerima,</p>
                    <div className="h-16"></div>
                    <p className="font-bold underline">{resolvedPegawaiUtama?.nama}</p>
                    <p>NIP. {resolvedPegawaiUtama?.nip}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
