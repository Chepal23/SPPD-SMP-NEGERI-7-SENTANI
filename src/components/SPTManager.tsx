import React, { useState } from 'react';
import { SPTItem, Pegawai, DasarHukum, PejabatPenandatangan, RapatItem } from '../types';
import { calculateDaysBetween, formatTanggalIndonesia } from '../utils/documentFormatter';
import { exportSPTCSV } from '../utils/storage';
import { 
  FileText, 
  Plus, 
  Search, 
  Printer, 
  FileCheck, 
  Edit, 
  Trash2, 
  Copy, 
  Download, 
  CheckCircle2, 
  Clock, 
  X,
  AlertCircle,
  Calendar,
  Link2
} from 'lucide-react';

interface SPTManagerProps {
  sptList: SPTItem[];
  pegawaiList: Pegawai[];
  dasarHukumList: DasarHukum[];
  pejabatList: PejabatPenandatangan[];
  rapatList: RapatItem[];
  pegawaiMap: Record<string, Pegawai>;
  rapatMap: Record<string, RapatItem>;
  onSaveSPT: (spt: SPTItem) => void;
  onDeleteSPT: (id: string) => void;
  onCreateSPPDFromSPT: (spt: SPTItem) => void;
  onPreviewSPT: (spt: SPTItem) => void;
  onCreateRapatFromSPT?: (spt: SPTItem) => void;
  onPreviewRapat?: (rapat: RapatItem) => void;
}

export const SPTManager: React.FC<SPTManagerProps> = ({
  sptList,
  pegawaiList,
  dasarHukumList,
  pejabatList,
  rapatList,
  pegawaiMap,
  rapatMap,
  onSaveSPT,
  onDeleteSPT,
  onCreateSPPDFromSPT,
  onPreviewSPT,
  onCreateRapatFromSPT,
  onPreviewRapat,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSPT, setEditingSPT] = useState<SPTItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<SPTItem>>({
    nomorSPT: '',
    tanggalSurat: new Date().toISOString().split('T')[0],
    dasarHukumIds: [],
    dasarHukumCustom: '',
    pegawaiUtamaId: '',
    pengikutIds: [],
    maksudTugas: '',
    tempatBerangkat: 'SMP Negeri 1 Cerdas Mandiri',
    tempatTujuan: '',
    tanggalBerangkat: new Date().toISOString().split('T')[0],
    tanggalKembali: new Date().toISOString().split('T')[0],
    lamaHari: 1,
    alatAngkutan: 'Kendaraan Dinas / Roda Empat',
    bebanAnggaran: 'BOS Reguler SMP Negeri 1 Cerdas Mandiri TA 2026',
    mataAnggaran: '5.1.02.04.01.0001 (Belanja Perjalanan Dinas Biasa)',
    penandatanganId: pejabatList[0]?.id || '',
    status: 'Disetujui',
    catatan: '',
    rapatId: '',
  });

  const generateNomorSPT = () => {
    const year = new Date().getFullYear();
    const nextNumber = String(sptList.length + 101).padStart(3, '0');
    return `094/${nextNumber}/SPT/SMP.01/${year}`;
  };

  const openAddModal = () => {
    setEditingSPT(null);
    const defaultDH = dasarHukumList.filter(d => d.isDefault).map(d => d.id);
    const today = new Date().toISOString().split('T')[0];

    setFormData({
      nomorSPT: generateNomorSPT(),
      tanggalSurat: today,
      dasarHukumIds: defaultDH,
      dasarHukumCustom: '',
      pegawaiUtamaId: pegawaiList[0]?.id || '',
      pengikutIds: [],
      maksudTugas: '',
      tempatBerangkat: 'SMP Negeri 1 Cerdas Mandiri',
      tempatTujuan: '',
      tanggalBerangkat: today,
      tanggalKembali: today,
      lamaHari: 1,
      alatAngkutan: 'Kendaraan Dinas / Roda Empat',
      bebanAnggaran: 'BOS Reguler SMP Negeri 1 Cerdas Mandiri TA 2026',
      mataAnggaran: '5.1.02.04.01.0001 (Belanja Perjalanan Dinas Biasa)',
      penandatanganId: pejabatList[0]?.id || '',
      status: 'Disetujui',
      catatan: '',
      rapatId: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (spt: SPTItem) => {
    setEditingSPT(spt);
    setFormData({ ...spt });
    setIsModalOpen(true);
  };

  const handleDuplicate = (spt: SPTItem) => {
    const duplicated: SPTItem = {
      ...spt,
      id: `spt-${Date.now()}`,
      nomorSPT: generateNomorSPT(),
      status: 'Draft',
      createdAt: new Date().toISOString(),
    };
    onSaveSPT(duplicated);
  };

  const handleDateChange = (start: string, end: string) => {
    const days = calculateDaysBetween(start, end);
    setFormData(prev => ({
      ...prev,
      tanggalBerangkat: start,
      tanggalKembali: end,
      lamaHari: days,
    }));
  };

  const handleToggleDasarHukum = (id: string) => {
    const current = formData.dasarHukumIds || [];
    if (current.includes(id)) {
      setFormData(prev => ({
        ...prev,
        dasarHukumIds: current.filter(item => item !== id),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        dasarHukumIds: [...current, id],
      }));
    }
  };

  const handleTogglePengikut = (pegawaiId: string) => {
    const current = formData.pengikutIds || [];
    if (current.includes(pegawaiId)) {
      setFormData(prev => ({
        ...prev,
        pengikutIds: current.filter(id => id !== pegawaiId),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        pengikutIds: [...current, pegawaiId],
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nomorSPT?.trim() || !formData.pegawaiUtamaId || !formData.maksudTugas?.trim()) {
      return;
    }

    const payload: SPTItem = {
      id: editingSPT ? editingSPT.id : `spt-${Date.now()}`,
      nomorSPT: formData.nomorSPT.trim(),
      tanggalSurat: formData.tanggalSurat || new Date().toISOString().split('T')[0],
      dasarHukumIds: formData.dasarHukumIds || [],
      dasarHukumCustom: formData.dasarHukumCustom?.trim(),
      pegawaiUtamaId: formData.pegawaiUtamaId,
      pengikutIds: formData.pengikutIds || [],
      maksudTugas: formData.maksudTugas.trim(),
      tempatBerangkat: formData.tempatBerangkat?.trim() || 'SMP Negeri 1',
      tempatTujuan: formData.tempatTujuan?.trim() || 'Dinas Pendidikan',
      tanggalBerangkat: formData.tanggalBerangkat || new Date().toISOString().split('T')[0],
      tanggalKembali: formData.tanggalKembali || new Date().toISOString().split('T')[0],
      lamaHari: formData.lamaHari || 1,
      alatAngkutan: formData.alatAngkutan || 'Kendaraan Dinas',
      bebanAnggaran: formData.bebanAnggaran || 'BOS Reguler',
      mataAnggaran: formData.mataAnggaran || '5.1.02.04.01.0001',
      penandatanganId: formData.penandatanganId || pejabatList[0]?.id || '',
      status: formData.status || 'Disetujui',
      catatan: formData.catatan || '',
      rapatId: formData.rapatId || undefined,
      createdAt: editingSPT ? editingSPT.createdAt : new Date().toISOString(),
    };

    onSaveSPT(payload);
    setIsModalOpen(false);
  };

  const filteredSPT = sptList.filter(s => {
    const peg = pegawaiMap[s.pegawaiUtamaId];
    const pegName = peg ? peg.nama.toLowerCase() : '';
    const matchesSearch = 
      s.nomorSPT.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.maksudTugas.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.tempatTujuan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pegName.includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            <span>Data Surat Perintah Tugas (SPT)</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Buat dan cetak SPT otomatis dengan nomor terstruktur, dasar hukum baku, dan delegasi pegawai.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportSPTCSV(sptList, pegawaiMap)}
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
            <span>Buat SPT Otomatis</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari No. SPT, nama pegawai, atau tujuan..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Filter Segmented Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs self-start sm:self-auto overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-medium' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({sptList.length})
          </button>
          <button
            onClick={() => setStatusFilter('Disetujui')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              statusFilter === 'Disetujui' ? 'bg-white text-slate-900 shadow-2xs font-medium' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Disetujui ({sptList.filter(s => s.status === 'Disetujui').length})
          </button>
          <button
            onClick={() => setStatusFilter('Draft')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              statusFilter === 'Draft' ? 'bg-white text-slate-900 shadow-2xs font-medium' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Draft ({sptList.filter(s => s.status === 'Draft').length})
          </button>
          <button
            onClick={() => setStatusFilter('Selesai')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              statusFilter === 'Selesai' ? 'bg-white text-slate-900 shadow-2xs font-medium' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Selesai ({sptList.filter(s => s.status === 'Selesai').length})
          </button>
        </div>
      </div>

      {/* SPT Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nomor & Tanggal SPT</th>
                <th className="py-3 px-4">Pegawai Ditugaskan</th>
                <th className="py-3 px-4">Maksud Tugas & Tujuan</th>
                <th className="py-3 px-4">Waktu & Durasi</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center w-48">Aksi Cetak & Buat SPPD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSPT.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-700">Belum ada data Surat Perintah Tugas</p>
                    <p className="text-xs text-slate-400 mt-1">Klik tombol "Buat SPT Otomatis" untuk memulai.</p>
                  </td>
                </tr>
              ) : (
                filteredSPT.map((spt, index) => {
                  const pegUtama = pegawaiMap[spt.pegawaiUtamaId];
                  const totalPersonil = 1 + (spt.pengikutIds?.length || 0);

                  return (
                    <tr key={spt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center text-slate-400 font-mono text-xs">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 font-mono text-xs">{spt.nomorSPT}</div>
                        <div className="text-xs text-slate-500">{formatTanggalIndonesia(spt.tanggalSurat)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 text-xs">{pegUtama?.nama || 'Pegawai tidak ditemukan'}</div>
                        <div className="text-[11px] text-slate-500">
                          {pegUtama?.pangkatGolongan} · {totalPersonil > 1 ? `${totalPersonil} Orang (Tim)` : '1 Orang'}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-slate-800 text-xs line-clamp-2 leading-relaxed">
                          {spt.maksudTugas}
                        </div>
                        <div className="text-[11px] text-indigo-600 font-medium mt-0.5">
                          Tujuan: {spt.tempatTujuan}
                        </div>
                        {spt.rapatId && rapatMap[spt.rapatId] ? (
                          <button
                            type="button"
                            onClick={() => onPreviewRapat ? onPreviewRapat(rapatMap[spt.rapatId!]) : onPreviewSPT(spt)}
                            className="mt-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1 w-fit transition-colors"
                            title="Klik untuk melihat Notulen & Daftar Hadir Terlampir"
                          >
                            <Calendar className="w-3 h-3 text-emerald-600" />
                            <span>Notulensi: {rapatMap[spt.rapatId].nomorRapat}</span>
                          </button>
                        ) : (
                          onCreateRapatFromSPT && (
                            <button
                              type="button"
                              onClick={() => onCreateRapatFromSPT(spt)}
                              className="mt-1 text-[10px] text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>Buat Notulen Rapat</span>
                            </button>
                          )
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700">
                        <div className="font-mono tabular-nums font-medium">{spt.lamaHari} Hari Kerja</div>
                        <div className="text-[11px] text-slate-500">
                          {formatTanggalIndonesia(spt.tanggalBerangkat)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
                          spt.status === 'Disetujui'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : spt.status === 'Draft'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {spt.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* Cetak SPT */}
                          <button
                            onClick={() => onPreviewSPT(spt)}
                            className="px-2 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors flex items-center gap-1 shadow-2xs"
                            title="Pratinjau & Cetak SPT"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-600" />
                            <span>Cetak</span>
                          </button>

                          {/* Buat SPPD Sekali Klik */}
                          <button
                            onClick={() => onCreateSPPDFromSPT(spt)}
                            className="px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 transition-colors flex items-center gap-1"
                            title="Buat SPPD dari SPT Ini"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Buat SPPD</span>
                          </button>

                          <button
                            onClick={() => handleDuplicate(spt)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                            title="Duplikasi SPT"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => openEditModal(spt)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Edit SPT"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeleteConfirmId(spt.id)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Hapus SPT"
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

      {/* Modal Add / Edit SPT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingSPT ? 'Ubah Surat Perintah Tugas (SPT)' : 'Form Buat SPT Otomatis'}
                </h3>
                <p className="text-xs text-slate-500">
                  Lengkapi parameter surat perintah tugas resmi di bawah ini.
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
              {/* Row 1: Nomor Surat & Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Nomor SPT *</label>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, nomorSPT: generateNomorSPT() }))}
                      className="text-[11px] text-indigo-600 hover:underline"
                    >
                      Auto-generate
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.nomorSPT || ''}
                    onChange={(e) => setFormData({ ...formData, nomorSPT: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Surat *</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggalSurat || ''}
                    onChange={(e) => setFormData({ ...formData, tanggalSurat: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Pegawai Utama */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pegawai Yang Ditugaskan (Ketua / Pegawai Utama) *
                </label>
                <select
                  required
                  value={formData.pegawaiUtamaId || ''}
                  onChange={(e) => setFormData({ ...formData, pegawaiUtamaId: e.target.value })}
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

              {/* Pengikut / Anggota Tim Rombongan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Anggota Tim Penugasan Lainnya (Opsional / Multi-Personil)
                </label>
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2.5 space-y-1.5 bg-slate-50/50">
                  {pegawaiList
                    .filter(p => p.id !== formData.pegawaiUtamaId)
                    .map(p => {
                      const isChecked = (formData.pengikutIds || []).includes(p.id);
                      return (
                        <label key={p.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:bg-slate-100 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePengikut(p.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="font-medium">{p.nama}</span>
                          <span className="text-slate-400">({p.jabatan})</span>
                        </label>
                      );
                    })}
                </div>
              </div>

              {/* Maksud Tugas */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Maksud Penugasan / Keperluan Dinas *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.maksudTugas || ''}
                  onChange={(e) => setFormData({ ...formData, maksudTugas: e.target.value })}
                  placeholder="Contoh: Mengikuti Rapat Koordinasi Sinkronisasi Rencana Kegiatan dan Anggaran Sekolah (RKAS)..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Tempat Berangkat & Tempat Tujuan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tempat Berangkat *</label>
                  <input
                    type="text"
                    required
                    value={formData.tempatBerangkat || ''}
                    onChange={(e) => setFormData({ ...formData, tempatBerangkat: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tempat / Kota Tujuan *</label>
                  <input
                    type="text"
                    required
                    value={formData.tempatTujuan || ''}
                    onChange={(e) => setFormData({ ...formData, tempatTujuan: e.target.value })}
                    placeholder="Contoh: Kantor Dinas Pendidikan / Hotel Grand Mercure"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Tanggal Berangkat & Kembali */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tgl Berangkat *</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggalBerangkat || ''}
                    onChange={(e) => handleDateChange(e.target.value, formData.tanggalKembali || e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tgl Kembali *</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggalKembali || ''}
                    onChange={(e) => handleDateChange(formData.tanggalBerangkat || e.target.value, e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lama Hari Tugas</label>
                  <div className="px-3 py-1.5 text-xs font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between">
                    <span>{formData.lamaHari || 1} Hari</span>
                    <span className="text-[11px] font-normal text-slate-500">Otomatis</span>
                  </div>
                </div>
              </div>

              {/* Alat Angkutan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Alat Angkutan *</label>
                  <select
                    value={formData.alatAngkutan || 'Kendaraan Dinas / Roda Empat'}
                    onChange={(e) => setFormData({ ...formData, alatAngkutan: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="Kendaraan Dinas / Roda Empat">Kendaraan Dinas / Roda Empat</option>
                    <option value="Kendaraan Pribadi / Sewa">Kendaraan Pribadi / Sewa</option>
                    <option value="Angkutan Umum / Bus">Angkutan Umum / Bus</option>
                    <option value="Kereta Api">Kereta Api</option>
                    <option value="Pesawat Udara">Pesawat Udara</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status Dokumen</label>
                  <select
                    value={formData.status || 'Disetujui'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="Disetujui">Disetujui</option>
                    <option value="Draft">Draft</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
              </div>

              {/* Beban Anggaran & Akun */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pembebanan Anggaran</label>
                  <input
                    type="text"
                    value={formData.bebanAnggaran || ''}
                    onChange={(e) => setFormData({ ...formData, bebanAnggaran: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mata Anggaran / Kode Akun</label>
                  <input
                    type="text"
                    value={formData.mataAnggaran || ''}
                    onChange={(e) => setFormData({ ...formData, mataAnggaran: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-xs"
                  />
                </div>
              </div>

              {/* Dasar Hukum Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Dasar Hukum Surat Perintah Tugas
                </label>
                <div className="border border-slate-200 rounded-lg p-3 space-y-2 max-h-44 overflow-y-auto bg-slate-50/50">
                  {dasarHukumList.map(dh => {
                    const isSelected = (formData.dasarHukumIds || []).includes(dh.id);
                    return (
                      <label key={dh.id} className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer hover:bg-slate-100 p-1.5 rounded">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleDasarHukum(dh.id)}
                          className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <div className="font-semibold text-slate-900">{dh.nomor}</div>
                          <div className="text-[11px] text-slate-500">{dh.tentang}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Dasar Hukum Tambahan Custom */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dasar Hukum Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  value={formData.dasarHukumCustom || ''}
                  onChange={(e) => setFormData({ ...formData, dasarHukumCustom: e.target.value })}
                  placeholder="Contoh: Surat Undangan No. 0422/B7.1/KP.01/2026 tanggal 15 Oktober 2026..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Lampiran Notulensi Rapat Terkait */}
              <div className="bg-emerald-50/60 p-3.5 rounded-lg border border-emerald-100">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-emerald-950 flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Lampiran Notulensi Rapat (Opsional)</span>
                  </label>
                  {formData.rapatId && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, rapatId: '' }))}
                      className="text-[11px] text-red-600 hover:underline"
                    >
                      Lepas Lampiran
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mb-2">
                  Hubungkan dengan hasil rapat kedinasan. Notulensi dan presensi rapat akan otomatis terlampir pada dokumen resmi penugasan.
                </p>
                <select
                  value={formData.rapatId || ''}
                  onChange={(e) => setFormData({ ...formData, rapatId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-emerald-200 rounded-md bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Tanpa Lampiran Notulensi Rapat --</option>
                  {rapatList.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.nomorRapat} - {r.judulRapat} ({formatTanggalIndonesia(r.hariTanggal)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Pejabat Penandatangan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pejabat Pemberi Perintah (Penandatangan SPT) *
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
                  {editingSPT ? 'Simpan Perubahan SPT' : 'Simpan & Terbitkan SPT'}
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
            <h3 className="text-base font-bold text-slate-900">Hapus Dokumen SPT?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Dokumen SPT ini akan dihapus dari sistem.
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
                  onDeleteSPT(deleteConfirmId);
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
