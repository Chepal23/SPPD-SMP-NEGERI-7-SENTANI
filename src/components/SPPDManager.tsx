import React, { useState } from 'react';
import { SPPDItem, SPTItem, Pegawai, PejabatPenandatangan } from '../types';
import { formatTanggalIndonesia, formatRupiah } from '../utils/documentFormatter';
import { exportSPPDCSV } from '../utils/storage';
import { 
  FileCheck, 
  Plus, 
  Search, 
  Printer, 
  FileText, 
  Edit, 
  Trash2, 
  Download, 
  Calculator, 
  X, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';

interface SPPDManagerProps {
  sppdList: SPPDItem[];
  sptList: SPTItem[];
  pegawaiList: Pegawai[];
  pejabatList: PejabatPenandatangan[];
  pegawaiMap: Record<string, Pegawai>;
  onSaveSPPD: (sppd: SPPDItem) => void;
  onDeleteSPPD: (id: string) => void;
  onPreviewSPPD: (sppd: SPPDItem, type: 'sppd_lembar1' | 'sppd_lembar2' | 'sppd_kuitansi' | 'sppd_lengkap') => void;
}

export const SPPDManager: React.FC<SPPDManagerProps> = ({
  sppdList,
  sptList,
  pegawaiList,
  pejabatList,
  pegawaiMap,
  onSaveSPPD,
  onDeleteSPPD,
  onPreviewSPPD,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSPPD, setEditingSPPD] = useState<SPPDItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<SPPDItem>>({
    nomorSPPD: '',
    sptId: '',
    pegawaiId: '',
    tingkatBiaya: 'Tingkat B',
    maksudPerjalanan: '',
    alatAngkut: 'Kendaraan Dinas / Roda Empat',
    tempatBerangkat: 'SMP Negeri 1 Cerdas Mandiri',
    tempatTujuan: '',
    lamaHari: 2,
    tanggalBerangkat: new Date().toISOString().split('T')[0],
    tanggalKembali: new Date().toISOString().split('T')[0],
    instansiBeban: 'SMP Negeri 1 Cerdas Mandiri',
    mataAnggaran: '5.1.02.04.01.0001 (Belanja Perjalanan Dinas Biasa)',
    keteranganLain: '',
    tanggalDikeluarkan: new Date().toISOString().split('T')[0],
    kotaDikeluarkan: 'Sukamaju',
    penandatanganId: pejabatList[1]?.id || pejabatList[0]?.id || '',
    pengikut: [],
    rincianBiaya: {
      uangHarianPerHari: 380000,
      transportPP: 250000,
      penginapanPerMalam: 550000,
      jumlahMalam: 1,
      uangRepresentasi: 0,
      biayaLainnya: 50000,
      keteranganBiayaLain: 'Biaya Tol & Parkir Resmi',
    },
  });

  const generateNomorSPPD = () => {
    const year = new Date().getFullYear();
    const nextNumber = String(sppdList.length + 101).padStart(3, '0');
    return `094/${nextNumber}-SPPD/SMP.01/${year}`;
  };

  const openAddModal = () => {
    setEditingSPPD(null);
    const today = new Date().toISOString().split('T')[0];
    const defaultPeg = pegawaiList[0];

    setFormData({
      nomorSPPD: generateNomorSPPD(),
      sptId: '',
      pegawaiId: defaultPeg?.id || '',
      tingkatBiaya: `Tingkat ${defaultPeg?.tingkatBiaya || 'B'}`,
      maksudPerjalanan: '',
      alatAngkut: 'Kendaraan Dinas / Roda Empat',
      tempatBerangkat: 'SMP Negeri 1 Cerdas Mandiri',
      tempatTujuan: '',
      lamaHari: 2,
      tanggalBerangkat: today,
      tanggalKembali: today,
      instansiBeban: 'SMP Negeri 1 Cerdas Mandiri',
      mataAnggaran: '5.1.02.04.01.0001 (Belanja Perjalanan Dinas Biasa)',
      keteranganLain: '',
      tanggalDikeluarkan: today,
      kotaDikeluarkan: 'Sukamaju',
      penandatanganId: pejabatList[1]?.id || pejabatList[0]?.id || '',
      pengikut: [],
      rincianBiaya: {
        uangHarianPerHari: 380000,
        transportPP: 250000,
        penginapanPerMalam: 550000,
        jumlahMalam: 1,
        uangRepresentasi: 0,
        biayaLainnya: 50000,
        keteranganBiayaLain: 'Biaya Tol & Parkir Resmi',
      },
    });
    setIsModalOpen(true);
  };

  const openEditModal = (sppd: SPPDItem) => {
    setEditingSPPD(sppd);
    setFormData({ ...sppd });
    setIsModalOpen(true);
  };

  // Sync with selected SPT
  const handleSelectSPT = (selectedSptId: string) => {
    const foundSPT = sptList.find(s => s.id === selectedSptId);
    if (!foundSPT) {
      setFormData(prev => ({ ...prev, sptId: '' }));
      return;
    }

    const pegUtama = pegawaiMap[foundSPT.pegawaiUtamaId];
    const pengikutList = (foundSPT.pengikutIds || []).map(pId => {
      const p = pegawaiMap[pId];
      return {
        id: `p-${Date.now()}-${pId}`,
        nama: p ? p.nama : '',
        nip: p ? p.nip : '',
        keterangan: p ? p.jabatan : 'Anggota',
      };
    });

    setFormData(prev => ({
      ...prev,
      sptId: foundSPT.id,
      pegawaiId: foundSPT.pegawaiUtamaId,
      tingkatBiaya: `Tingkat ${pegUtama?.tingkatBiaya || 'B'}`,
      maksudPerjalanan: foundSPT.maksudTugas,
      alatAngkut: foundSPT.alatAngkutan,
      tempatBerangkat: foundSPT.tempatBerangkat,
      tempatTujuan: foundSPT.tempatTujuan,
      lamaHari: foundSPT.lamaHari,
      tanggalBerangkat: foundSPT.tanggalBerangkat,
      tanggalKembali: foundSPT.tanggalKembali,
      instansiBeban: foundSPT.bebanAnggaran,
      mataAnggaran: foundSPT.mataAnggaran,
      keteranganLain: `Dasar: SPT No. ${foundSPT.nomorSPT}`,
      pengikut: pengikutList,
    }));
  };

  const handleAddPengikut = () => {
    setFormData(prev => ({
      ...prev,
      pengikut: [
        ...(prev.pengikut || []),
        { id: `p-${Date.now()}`, nama: '', nip: '', keterangan: 'Anggota' },
      ],
    }));
  };

  const handleRemovePengikut = (index: number) => {
    setFormData(prev => ({
      ...prev,
      pengikut: (prev.pengikut || []).filter((_, i) => i !== index),
    }));
  };

  const handlePengikutChange = (index: number, field: string, val: string) => {
    setFormData(prev => {
      const updated = [...(prev.pengikut || [])];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, pengikut: updated };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nomorSPPD?.trim() || !formData.pegawaiId || !formData.maksudPerjalanan?.trim()) {
      return;
    }

    const payload: SPPDItem = {
      id: editingSPPD ? editingSPPD.id : `sppd-${Date.now()}`,
      nomorSPPD: formData.nomorSPPD.trim(),
      sptId: formData.sptId,
      pegawaiId: formData.pegawaiId,
      tingkatBiaya: formData.tingkatBiaya || 'Tingkat B',
      maksudPerjalanan: formData.maksudPerjalanan.trim(),
      alatAngkut: formData.alatAngkut || 'Kendaraan Dinas',
      tempatBerangkat: formData.tempatBerangkat?.trim() || 'SMP Negeri 1',
      tempatTujuan: formData.tempatTujuan?.trim() || 'Dinas Pendidikan',
      lamaHari: formData.lamaHari || 1,
      tanggalBerangkat: formData.tanggalBerangkat || new Date().toISOString().split('T')[0],
      tanggalKembali: formData.tanggalKembali || new Date().toISOString().split('T')[0],
      instansiBeban: formData.instansiBeban || 'SMP Negeri 1',
      mataAnggaran: formData.mataAnggaran || '5.1.02.04.01.0001',
      keteranganLain: formData.keteranganLain || '',
      tanggalDikeluarkan: formData.tanggalDikeluarkan || new Date().toISOString().split('T')[0],
      kotaDikeluarkan: formData.kotaDikeluarkan || 'Sukamaju',
      penandatanganId: formData.penandatanganId || pejabatList[0]?.id || '',
      pengikut: formData.pengikut || [],
      rincianBiaya: formData.rincianBiaya || {
        uangHarianPerHari: 380000,
        transportPP: 250000,
        penginapanPerMalam: 550000,
        jumlahMalam: 1,
        uangRepresentasi: 0,
        biayaLainnya: 50000,
        keteranganBiayaLain: 'Tol & Parkir',
      },
      createdAt: editingSPPD ? editingSPPD.createdAt : new Date().toISOString(),
    };

    onSaveSPPD(payload);
    setIsModalOpen(false);
  };

  const filteredSPPD = sppdList.filter(s => {
    const peg = pegawaiMap[s.pegawaiId];
    const pegName = peg ? peg.nama.toLowerCase() : '';
    return (
      s.nomorSPPD.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.maksudPerjalanan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.tempatTujuan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pegName.includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-indigo-600" />
            <span>Data Surat Perintah Perjalanan Dinas (SPPD)</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Cetak dokumen SPPD resmi sekali klik: Lembar 1 (Muka), Lembar 2 (Visum Perjalanan), dan Kuitansi Biaya Riil.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportSPPDCSV(sppdList, pegawaiMap)}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={openAddModal}
            className="px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah SPPD Baru</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari No. SPPD, nama pegawai, atau tujuan..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* SPPD Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nomor SPPD</th>
                <th className="py-3 px-4">Pegawai Yang Diperintah</th>
                <th className="py-3 px-4">Maksud & Tempat Tujuan</th>
                <th className="py-3 px-4">Tanggal & Angkutan</th>
                <th className="py-3 px-4 text-right">Estimasi Biaya</th>
                <th className="py-3 px-4 text-center w-56">Cetak Dokumen Sekali Klik</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSPPD.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <FileCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-700">Belum ada data SPPD</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Klik "Tambah SPPD Baru" atau buat langsung dari menu "Data SPT".
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSPPD.map((sppd, index) => {
                  const peg = pegawaiMap[sppd.pegawaiId];
                  const totalBiaya = (
                    (sppd.rincianBiaya?.uangHarianPerHari || 0) * (sppd.lamaHari || 1) +
                    (sppd.rincianBiaya?.transportPP || 0) +
                    (sppd.rincianBiaya?.penginapanPerMalam || 0) * (sppd.rincianBiaya?.jumlahMalam || 0) +
                    (sppd.rincianBiaya?.uangRepresentasi || 0) +
                    (sppd.rincianBiaya?.biayaLainnya || 0)
                  );

                  return (
                    <tr key={sppd.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center text-slate-400 font-mono text-xs">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 font-mono text-xs">{sppd.nomorSPPD}</div>
                        <div className="text-[11px] text-slate-500">
                          {sppd.sptId ? 'Terhubung ke SPT' : 'Mandiri'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 text-xs">{peg?.nama || 'Pegawai tidak ditemukan'}</div>
                        <div className="text-[11px] text-slate-500">
                          {peg?.nip !== '-' ? `NIP. ${peg?.nip}` : peg?.jabatan}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-slate-800 text-xs line-clamp-2 leading-relaxed">
                          {sppd.maksudPerjalanan}
                        </div>
                        <div className="text-[11px] text-indigo-600 font-medium mt-0.5">
                          Ke: {sppd.tempatTujuan}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700">
                        <div className="font-medium">{formatTanggalIndonesia(sppd.tanggalBerangkat)}</div>
                        <div className="text-[11px] text-slate-500">{sppd.alatAngkut} ({sppd.lamaHari} Hari)</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs font-semibold text-slate-900">
                        {formatRupiah(totalBiaya)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {/* Cetak Lembar 1 */}
                          <button
                            onClick={() => onPreviewSPPD(sppd, 'sppd_lembar1')}
                            className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-2xs"
                            title="Cetak SPPD Lembar 1 (Muka)"
                          >
                            Lembar 1
                          </button>

                          {/* Cetak Lembar 2 Visum */}
                          <button
                            onClick={() => onPreviewSPPD(sppd, 'sppd_lembar2')}
                            className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-2xs"
                            title="Cetak SPPD Lembar 2 (Visum)"
                          >
                            Visum
                          </button>

                          {/* Cetak Kuitansi */}
                          <button
                            onClick={() => onPreviewSPPD(sppd, 'sppd_kuitansi')}
                            className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-2xs"
                            title="Cetak Kuitansi & Rincian Riil"
                          >
                            Kuitansi
                          </button>

                          {/* Cetak Semua */}
                          <button
                            onClick={() => onPreviewSPPD(sppd, 'sppd_lengkap')}
                            className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
                            title="Cetak Seluruh Dokumen SPPD"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => openEditModal(sppd)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Edit SPPD"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeleteConfirmId(sppd.id)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Hapus SPPD"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit SPPD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingSPPD ? 'Ubah Surat Perintah Perjalanan Dinas' : 'Form Tambah Dokumen SPPD'}
                </h3>
                <p className="text-xs text-slate-500">
                  Dapat dihubungkan dengan SPT untuk pengisian otomatis.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
              {/* Sambungkan ke SPT jika ada */}
              {sptList.length > 0 && (
                <div className="bg-indigo-50/60 p-3 rounded-lg border border-indigo-100">
                  <label className="block text-xs font-semibold text-indigo-900 mb-1">
                    Hubungkan dengan Surat Tugas (SPT) Terdaftar
                  </label>
                  <select
                    value={formData.sptId || ''}
                    onChange={(e) => handleSelectSPT(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-indigo-200 rounded-md focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">-- Buat SPPD Mandiri (Tanpa SPT) --</option>
                    {sptList.map(s => {
                      const peg = pegawaiMap[s.pegawaiUtamaId];
                      return (
                        <option key={s.id} value={s.id}>
                          {s.nomorSPT} - {peg?.nama} ({s.tempatTujuan})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Nomor SPPD & Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Nomor SPPD *</label>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, nomorSPPD: generateNomorSPPD() }))}
                      className="text-[11px] text-indigo-600 hover:underline"
                    >
                      Auto-generate
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.nomorSPPD || ''}
                    onChange={(e) => setFormData({ ...formData, nomorSPPD: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Dikeluarkan *</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggalDikeluarkan || ''}
                    onChange={(e) => setFormData({ ...formData, tanggalDikeluarkan: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Pegawai & Tingkat Biaya */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pegawai Yang Diperintahkan *
                  </label>
                  <select
                    required
                    value={formData.pegawaiId || ''}
                    onChange={(e) => {
                      const peg = pegawaiMap[e.target.value];
                      setFormData({
                        ...formData,
                        pegawaiId: e.target.value,
                        tingkatBiaya: `Tingkat ${peg?.tingkatBiaya || 'B'}`,
                      });
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="">-- Pilih Pegawai --</option>
                    {pegawaiList.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nama} ({p.pangkatGolongan}) - {p.jabatan}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tingkat Biaya</label>
                  <input
                    type="text"
                    value={formData.tingkatBiaya || 'Tingkat B'}
                    onChange={(e) => setFormData({ ...formData, tingkatBiaya: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Maksud Perjalanan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Maksud Perjalanan Dinas *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.maksudPerjalanan || ''}
                  onChange={(e) => setFormData({ ...formData, maksudPerjalanan: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Tempat Berangkat & Tujuan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tempat Berangkat</label>
                  <input
                    type="text"
                    value={formData.tempatBerangkat || ''}
                    onChange={(e) => setFormData({ ...formData, tempatBerangkat: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tempat Tujuan *</label>
                  <input
                    type="text"
                    required
                    value={formData.tempatTujuan || ''}
                    onChange={(e) => setFormData({ ...formData, tempatTujuan: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Tanggal & Lama Hari */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Berangkat</label>
                  <input
                    type="date"
                    value={formData.tanggalBerangkat || ''}
                    onChange={(e) => setFormData({ ...formData, tanggalBerangkat: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Kembali</label>
                  <input
                    type="date"
                    value={formData.tanggalKembali || ''}
                    onChange={(e) => setFormData({ ...formData, tanggalKembali: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lama Hari</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.lamaHari || 1}
                    onChange={(e) => setFormData({ ...formData, lamaHari: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              {/* Rincian Estimasi Biaya */}
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-indigo-600" />
                    <span>Rincian Biaya Perjalanan Dinas</span>
                  </h4>
                  <span className="text-xs font-mono font-bold text-indigo-700">
                    Total: {formatRupiah(
                      ((formData.rincianBiaya?.uangHarianPerHari || 0) * (formData.lamaHari || 1)) +
                      (formData.rincianBiaya?.transportPP || 0) +
                      ((formData.rincianBiaya?.penginapanPerMalam || 0) * (formData.rincianBiaya?.jumlahMalam || 0)) +
                      (formData.rincianBiaya?.uangRepresentasi || 0) +
                      (formData.rincianBiaya?.biayaLainnya || 0)
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 mb-1">Uang Harian (Per Hari Rp)</label>
                    <input
                      type="number"
                      value={formData.rincianBiaya?.uangHarianPerHari || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        rincianBiaya: {
                          ...formData.rincianBiaya!,
                          uangHarianPerHari: parseInt(e.target.value, 10) || 0,
                        },
                      })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Biaya Transportasi PP (Rp)</label>
                    <input
                      type="number"
                      value={formData.rincianBiaya?.transportPP || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        rincianBiaya: {
                          ...formData.rincianBiaya!,
                          transportPP: parseInt(e.target.value, 10) || 0,
                        },
                      })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Penginapan (Per Malam Rp)</label>
                    <input
                      type="number"
                      value={formData.rincianBiaya?.penginapanPerMalam || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        rincianBiaya: {
                          ...formData.rincianBiaya!,
                          penginapanPerMalam: parseInt(e.target.value, 10) || 0,
                        },
                      })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Jumlah Malam Menginap</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.rincianBiaya?.jumlahMalam || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        rincianBiaya: {
                          ...formData.rincianBiaya!,
                          jumlahMalam: parseInt(e.target.value, 10) || 0,
                        },
                      })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Biaya Lain-Lain (Tol/Parkir Rp)</label>
                    <input
                      type="number"
                      value={formData.rincianBiaya?.biayaLainnya || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        rincianBiaya: {
                          ...formData.rincianBiaya!,
                          biayaLainnya: parseInt(e.target.value, 10) || 0,
                        },
                      })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Keterangan Biaya Lain</label>
                    <input
                      type="text"
                      value={formData.rincianBiaya?.keteranganBiayaLain || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        rincianBiaya: {
                          ...formData.rincianBiaya!,
                          keteranganBiayaLain: e.target.value,
                        },
                      })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Pejabat Pembuat Komitmen */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pejabat Penandatangan / PPK *
                </label>
                <select
                  required
                  value={formData.penandatanganId || ''}
                  onChange={(e) => setFormData({ ...formData, penandatanganId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  {pejabatList.map(pej => (
                    <option key={pej.id} value={pej.id}>
                      {pej.nama} - {pej.jabatan} (NIP. {pej.nip})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs"
                >
                  {editingSPPD ? 'Simpan Perubahan SPPD' : 'Simpan & Buat SPPD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">Hapus Dokumen SPPD?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Dokumen SPPD ini akan dihapus dari sistem.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteSPPD(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-2xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
