import React, { useState } from 'react';
import { RapatItem, Pegawai, SPTItem, PesertaHadir } from '../types';
import { formatTanggalIndonesia } from '../utils/documentFormatter';
import { exportRapatCSV } from '../utils/storage';
import { 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  FileText, 
  Plus, 
  Search, 
  Printer, 
  Edit, 
  Trash2, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Check, 
  Link2,
  ArrowRight
} from 'lucide-react';

interface RapatManagerProps {
  rapatList: RapatItem[];
  pegawaiList: Pegawai[];
  sptList: SPTItem[];
  pegawaiMap: Record<string, Pegawai>;
  onSaveRapat: (rapat: RapatItem) => void;
  onDeleteRapat: (id: string) => void;
  onPreviewRapat: (rapat: RapatItem, type: 'notulen_rapat' | 'daftar_hadir') => void;
  onCreateSPTFromRapat: (rapat: RapatItem) => void;
}

export const RapatManager: React.FC<RapatManagerProps> = ({
  rapatList,
  pegawaiList,
  sptList,
  pegawaiMap,
  onSaveRapat,
  onDeleteRapat,
  onPreviewRapat,
  onCreateSPTFromRapat,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'info' | 'presensi' | 'notulen'>('info');
  const [editingRapat, setEditingRapat] = useState<RapatItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<RapatItem>>({
    nomorRapat: '',
    judulRapat: '',
    agenda: '',
    hariTanggal: new Date().toISOString().split('T')[0],
    waktuMulai: '09:00',
    waktuSelesai: '11:30 WIB',
    tempat: 'Ruang Rapat Utama SMP Negeri 1 Cerdas Mandiri',
    pimpinanRapatId: pegawaiList[0]?.id || '',
    notulisId: pegawaiList[pegawaiList.length - 1]?.id || '',
    sptIdTerhubung: '',
    status: 'Disahkan',
    daftarHadir: [],
    notulensi: {
      pembukaan: '',
      pembahasan: '',
      kesimpulanKeputusan: '',
      tindakLanjut: '',
    },
  });

  const generateNomorRapat = () => {
    const year = new Date().getFullYear();
    const count = String(rapatList.length + 1).padStart(3, '0');
    return `${count}/NOTULEN/SMP.01/${year}`;
  };

  const openAddModal = () => {
    setEditingRapat(null);
    setModalTab('info');
    const today = new Date().toISOString().split('T')[0];

    // Default attendance: all registered pegawai with 'Hadir'
    const initialHadir: PesertaHadir[] = pegawaiList.map((p, idx) => ({
      pegawaiId: p.id,
      status: 'Hadir',
      waktuHadir: `08:${45 + (idx % 15)} WIB`,
      keterangan: idx === 0 ? 'Pimpinan Rapat' : 'Peserta',
    }));

    setFormData({
      nomorRapat: generateNomorRapat(),
      judulRapat: '',
      agenda: '',
      hariTanggal: today,
      waktuMulai: '09:00',
      waktuSelesai: '11:45 WIB',
      tempat: 'Ruang Pertemuan / Ruang Rapat Utama',
      pimpinanRapatId: pegawaiList[0]?.id || '',
      notulisId: pegawaiList[pegawaiList.length > 1 ? 1 : 0]?.id || '',
      sptIdTerhubung: '',
      status: 'Disahkan',
      daftarHadir: initialHadir,
      notulensi: {
        pembukaan: 'Rapat dibuka secara resmi oleh Pimpinan Rapat pada pukul 09.00 WIB. Pimpinan menyampaikan agenda dan target hasil pembahasan.',
        pembahasan: '1. Pembahasan materi koordinasi dan program kerja.\\n2. Penentuan pembagian tugas aparatur / personil dinas.\\n3. Evaluasi kesiapan administrasi dan tindak lanjut lapangan.',
        kesimpulanKeputusan: '1. Disepakati pelaksanaan penugasan dinas sesuai agenda.\\n2. Menerbitkan surat perintah penugasan resmi bagi delegasi yang ditunjuk.\\n3. Notulensi dan daftar hadir ini disahkan sebagai lampiran pendukung perjalanan dinas.',
        tindakLanjut: 'Staf tata usaha segera menyusun dokumen SPT dan SPPD, serta melaporkan hasil kegiatan setelah pelaksanaan selesai.',
      },
    });
    setIsModalOpen(true);
  };

  const openEditModal = (rapat: RapatItem) => {
    setEditingRapat(rapat);
    setModalTab('info');

    // Ensure all current pegawai exist in daftarHadir list
    const existingMap = new Map((rapat.daftarHadir || []).map(d => [d.pegawaiId, d]));
    const syncedHadir: PesertaHadir[] = pegawaiList.map(p => {
      const existing = existingMap.get(p.id);
      if (existing) return existing;
      return {
        pegawaiId: p.id,
        status: 'Hadir',
        waktuHadir: '09:00 WIB',
        keterangan: 'Peserta',
      };
    });

    setFormData({
      ...rapat,
      daftarHadir: syncedHadir,
    });
    setIsModalOpen(true);
  };

  const handleAttendanceChange = (pegawaiId: string, status: PesertaHadir['status'], keterangan?: string) => {
    setFormData(prev => {
      const current = [...(prev.daftarHadir || [])];
      const idx = current.findIndex(d => d.pegawaiId === pegawaiId);
      if (idx >= 0) {
        current[idx] = {
          ...current[idx],
          status,
          ...(keterangan !== undefined ? { keterangan } : {}),
        };
      } else {
        current.push({
          pegawaiId,
          status,
          waktuHadir: '09:00 WIB',
          keterangan: keterangan || 'Peserta',
        });
      }
      return { ...prev, daftarHadir: current };
    });
  };

  const handleMarkAllHadir = () => {
    setFormData(prev => ({
      ...prev,
      daftarHadir: pegawaiList.map(p => ({
        pegawaiId: p.id,
        status: 'Hadir',
        waktuHadir: '09:00 WIB',
        keterangan: p.id === prev.pimpinanRapatId ? 'Pimpinan Rapat' : 'Peserta',
      })),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nomorRapat?.trim() || !formData.judulRapat?.trim()) {
      alert('Mohon isi Nomor Rapat dan Judul Rapat.');
      return;
    }

    const payload: RapatItem = {
      id: editingRapat ? editingRapat.id : `rapat-${Date.now()}`,
      nomorRapat: formData.nomorRapat.trim(),
      judulRapat: formData.judulRapat.trim(),
      agenda: formData.agenda?.trim() || 'Koordinasi Kedinasan',
      hariTanggal: formData.hariTanggal || new Date().toISOString().split('T')[0],
      waktuMulai: formData.waktuMulai || '09:00',
      waktuSelesai: formData.waktuSelesai || '11:30 WIB',
      tempat: formData.tempat?.trim() || 'Ruang Rapat',
      pimpinanRapatId: formData.pimpinanRapatId || pegawaiList[0]?.id || '',
      notulisId: formData.notulisId || pegawaiList[0]?.id || '',
      sptIdTerhubung: formData.sptIdTerhubung || undefined,
      status: formData.status || 'Disahkan',
      daftarHadir: formData.daftarHadir || [],
      notulensi: formData.notulensi || {
        pembukaan: '',
        pembahasan: '',
        kesimpulanKeputusan: '',
        tindakLanjut: '',
      },
      createdAt: editingRapat ? editingRapat.createdAt : new Date().toISOString(),
    };

    onSaveRapat(payload);
    setIsModalOpen(false);
  };

  const filteredRapat = rapatList.filter(r => {
    const matchesSearch = 
      r.nomorRapat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.judulRapat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.tempat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.agenda.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            <span>Manajemen Rapat, Notulensi & Daftar Hadir</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Dokumentasikan jalannya rapat, presensi pegawai, dan lampirkan hasil notulensi resmi ke Surat Tugas Perjalanan Dinas (SPT).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportRapatCSV(rapatList, pegawaiMap)}
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
            <span>Buat Rapat & Notulen</span>
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
            placeholder="Cari nomor notulen, agenda, atau judul rapat..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs self-start sm:self-auto overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua Rapat ({rapatList.length})
          </button>
          <button
            onClick={() => setStatusFilter('Disahkan')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              statusFilter === 'Disahkan' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Disahkan ({rapatList.filter(r => r.status === 'Disahkan').length})
          </button>
          <button
            onClick={() => setStatusFilter('Draft')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              statusFilter === 'Draft' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Draft ({rapatList.filter(r => r.status === 'Draft').length})
          </button>
        </div>
      </div>

      {/* Rapat Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nomor & Tanggal Rapat</th>
                <th className="py-3 px-4">Judul Rapat & Tempat</th>
                <th className="py-3 px-4">Pimpinan & Notulis</th>
                <th className="py-3 px-4 text-center">Kehadiran</th>
                <th className="py-3 px-4">Koneksi Dokumen SPT</th>
                <th className="py-3 px-4 text-center w-52">Aksi Cetak & SPT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRapat.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-700">Belum ada data rapat dan notulensi</p>
                    <p className="text-xs text-slate-400 mt-1">Klik "Buat Rapat & Notulen" untuk mencatat agenda rapat baru.</p>
                  </td>
                </tr>
              ) : (
                filteredRapat.map((rapat, index) => {
                  const pimpinan = pegawaiMap[rapat.pimpinanRapatId];
                  const notulis = pegawaiMap[rapat.notulisId];
                  const hadirCount = (rapat.daftarHadir || []).filter(d => d.status === 'Hadir').length;
                  const totalPeserta = (rapat.daftarHadir || []).length;
                  const connectedSPT = sptList.find(s => s.id === rapat.sptIdTerhubung);

                  return (
                    <tr key={rapat.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center text-slate-400 font-mono text-xs">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 font-mono text-xs">{rapat.nomorRapat}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{formatTanggalIndonesia(rapat.hariTanggal)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 text-xs line-clamp-1">{rapat.judulRapat}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{rapat.tempat}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div className="text-slate-800 font-medium">Pimpinan: {pimpinan?.nama || '-'}</div>
                        <div className="text-[11px] text-slate-500">Notulis: {notulis?.nama || '-'}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {hadirCount} / {totalPeserta} Hadir
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {connectedSPT ? (
                          <div className="p-1.5 rounded bg-indigo-50/80 border border-indigo-100 max-w-[200px]">
                            <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wide block">Terlampir di SPT:</span>
                            <span className="font-mono text-[11px] text-indigo-900 truncate block">{connectedSPT.nomorSPT}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Belum terhubung ke SPT</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* Cetak Notulen */}
                          <button
                            onClick={() => onPreviewRapat(rapat, 'notulen_rapat')}
                            className="px-2 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors flex items-center gap-1 shadow-2xs"
                            title="Pratinjau & Cetak Notulen Rapat"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-600" />
                            <span>Notulen</span>
                          </button>

                          {/* Cetak Daftar Hadir */}
                          <button
                            onClick={() => onPreviewRapat(rapat, 'daftar_hadir')}
                            className="px-2 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors flex items-center gap-1 shadow-2xs"
                            title="Cetak Daftar Hadir Rapat"
                          >
                            <Users className="w-3.5 h-3.5 text-slate-600" />
                            <span>Presensi</span>
                          </button>

                          {/* Buat SPT dari Hasil Rapat */}
                          <button
                            onClick={() => onCreateSPTFromRapat(rapat)}
                            className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
                            title="Buat SPT Perjalanan Dinas dari Rapat Ini"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => openEditModal(rapat)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Edit Rapat"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeleteConfirmId(rapat.id)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Hapus Rapat"
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

      {/* Modal Add / Edit Rapat */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header with Subtabs */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingRapat ? 'Ubah Agenda & Notulensi Rapat' : 'Form Catat Rapat & Notulensi Baru'}
                </h3>
                <p className="text-xs text-slate-500">
                  Terintegrasi langsung dengan database pegawai untuk daftar hadir dan sistem SPT.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tab Navigation inside Modal */}
            <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-100 bg-white text-xs">
              <button
                type="button"
                onClick={() => setModalTab('info')}
                className={`px-3 py-2 border-b-2 font-medium transition-colors ${
                  modalTab === 'info'
                    ? 'border-indigo-600 text-indigo-700 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                1. Agenda & Waktu
              </button>
              <button
                type="button"
                onClick={() => setModalTab('presensi')}
                className={`px-3 py-2 border-b-2 font-medium transition-colors ${
                  modalTab === 'presensi'
                    ? 'border-indigo-600 text-indigo-700 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                2. Daftar Hadir Pegawai ({pegawaiList.length} Staf)
              </button>
              <button
                type="button"
                onClick={() => setModalTab('notulen')}
                className={`px-3 py-2 border-b-2 font-medium transition-colors ${
                  modalTab === 'notulen'
                    ? 'border-indigo-600 text-indigo-700 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                3. Notulensi & Keputusan
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
              {/* TAB 1: INFO RAPAT */}
              {modalTab === 'info' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">Nomor Surat Notulen *</label>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, nomorRapat: generateNomorRapat() }))}
                          className="text-[11px] text-indigo-600 hover:underline"
                        >
                          Auto-generate
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={formData.nomorRapat || ''}
                        onChange={(e) => setFormData({ ...formData, nomorRapat: e.target.value })}
                        className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Hari & Tanggal Rapat *</label>
                      <input
                        type="date"
                        required
                        value={formData.hariTanggal || ''}
                        onChange={(e) => setFormData({ ...formData, hariTanggal: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Judul / Acara Rapat *</label>
                    <input
                      type="text"
                      required
                      value={formData.judulRapat || ''}
                      onChange={(e) => setFormData({ ...formData, judulRapat: e.target.value })}
                      placeholder="Contoh: Rapat Koordinasi Persiapan Penugasan Dinas & Sinkronisasi RKAS"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Agenda / Pokok Bahasan *</label>
                    <textarea
                      required
                      rows={2}
                      value={formData.agenda || ''}
                      onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
                      placeholder="Contoh: Pembahasan persiapan perjalanan dinas luar daerah, verifikasi berkas, dan pembagian tugas delegasi..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Waktu Mulai</label>
                      <input
                        type="text"
                        value={formData.waktuMulai || '09:00'}
                        onChange={(e) => setFormData({ ...formData, waktuMulai: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Waktu Selesai</label>
                      <input
                        type="text"
                        value={formData.waktuSelesai || '11:30 WIB'}
                        onChange={(e) => setFormData({ ...formData, waktuSelesai: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Status Rapat</label>
                      <select
                        value={formData.status || 'Disahkan'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="Disahkan">Disahkan</option>
                        <option value="Final">Final</option>
                        <option value="Draft">Draft</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tempat / Ruangan Pelaksanaan</label>
                    <input
                      type="text"
                      value={formData.tempat || ''}
                      onChange={(e) => setFormData({ ...formData, tempat: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Pimpinan & Notulis dari data Pegawai */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Pimpinan Rapat (Staf Pegawai) *</label>
                      <select
                        required
                        value={formData.pimpinanRapatId || ''}
                        onChange={(e) => setFormData({ ...formData, pimpinanRapatId: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        {pegawaiList.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nama} ({p.jabatan})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Notulis / Pencatat (Staf Pegawai) *</label>
                      <select
                        required
                        value={formData.notulisId || ''}
                        onChange={(e) => setFormData({ ...formData, notulisId: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        {pegawaiList.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nama} ({p.jabatan})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* KONEKSI DENGAN SPT */}
                  <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-100 space-y-2">
                    <label className="block text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <Link2 className="w-4 h-4 text-indigo-600" />
                      <span>Lampirkan ke Dokumen Surat Tugas (SPT)</span>
                    </label>
                    <p className="text-[11px] text-slate-600">
                      Pilih SPT yang relevan jika rapat ini menghasilkan penugasan perjalanan dinas. Notulensi akan otomatis terhubung dan dapat dicetak sebagai lampiran SPT.
                    </p>
                    <select
                      value={formData.sptIdTerhubung || ''}
                      onChange={(e) => setFormData({ ...formData, sptIdTerhubung: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-indigo-200 rounded-lg bg-white"
                    >
                      <option value="">-- Tidak Terhubung ke SPT --</option>
                      {sptList.map(spt => {
                        const peg = pegawaiMap[spt.pegawaiUtamaId];
                        return (
                          <option key={spt.id} value={spt.id}>
                            {spt.nomorSPT} - {peg?.nama} (Tujuan: {spt.tempatTujuan})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              )}

              {/* TAB 2: DAFTAR HADIR (PRESENSI) */}
              {modalTab === 'presensi' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs text-slate-600 font-medium">
                      Presensi aparatur terintegrasi dengan Database Pegawai:
                    </span>
                    <button
                      type="button"
                      onClick={handleMarkAllHadir}
                      className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors"
                    >
                      Tandai Semua Hadir
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {pegawaiList.map((p) => {
                      const record = (formData.daftarHadir || []).find(d => d.pegawaiId === p.id) || {
                        pegawaiId: p.id,
                        status: 'Hadir',
                        keterangan: '',
                      };

                      return (
                        <div key={p.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="font-semibold text-slate-900 text-xs">{p.nama}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              NIP. {p.nip} · {p.pangkatGolongan} · {p.jabatan}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            {/* Segmented status selection */}
                            <select
                              value={record.status}
                              onChange={(e) => handleAttendanceChange(p.id, e.target.value as any, record.keterangan)}
                              className={`text-xs px-2.5 py-1 rounded font-semibold border ${
                                record.status === 'Hadir'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : record.status === 'Izin'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : record.status === 'Sakit'
                                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                                  : 'bg-indigo-50 text-indigo-800 border-indigo-300'
                              }`}
                            >
                              <option value="Hadir">Hadir</option>
                              <option value="Izin">Izin</option>
                              <option value="Sakit">Sakit</option>
                              <option value="Dinas Luar">Dinas Luar</option>
                            </select>

                            <input
                              type="text"
                              placeholder="Keterangan..."
                              value={record.keterangan || ''}
                              onChange={(e) => handleAttendanceChange(p.id, record.status, e.target.value)}
                              className="px-2 py-1 text-xs border border-slate-300 rounded bg-white w-32"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: NOTULENSI */}
              {modalTab === 'notulen' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      1. Pembukaan Rapat
                    </label>
                    <textarea
                      rows={2}
                      value={formData.notulensi?.pembukaan || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        notulensi: {
                          ...formData.notulensi!,
                          pembukaan: e.target.value,
                        },
                      })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      2. Pokok Pembahasan & Jalannya Rapat
                    </label>
                    <textarea
                      rows={4}
                      value={formData.notulensi?.pembahasan || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        notulensi: {
                          ...formData.notulensi!,
                          pembahasan: e.target.value,
                        },
                      })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      3. Kesimpulan & Keputusan Rapat
                    </label>
                    <textarea
                      rows={3}
                      value={formData.notulensi?.kesimpulanKeputusan || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        notulensi: {
                          ...formData.notulensi!,
                          kesimpulanKeputusan: e.target.value,
                        },
                      })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      4. Tindak Lanjut Penugasan / Perjalanan Dinas
                    </label>
                    <textarea
                      rows={2}
                      value={formData.notulensi?.tindakLanjut || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        notulensi: {
                          ...formData.notulensi!,
                          tindakLanjut: e.target.value,
                        },
                      })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Form Navigation & Submit */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="text-xs text-slate-500">
                  Tab {modalTab === 'info' ? '1 dari 3' : modalTab === 'presensi' ? '2 dari 3' : '3 dari 3'}
                </div>

                <div className="flex items-center gap-2">
                  {modalTab !== 'info' && (
                    <button
                      type="button"
                      onClick={() => setModalTab(modalTab === 'notulen' ? 'presensi' : 'info')}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Kembali
                    </button>
                  )}

                  {modalTab !== 'notulen' ? (
                    <button
                      type="button"
                      onClick={() => setModalTab(modalTab === 'info' ? 'presensi' : 'notulen')}
                      className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs"
                    >
                      Lanjut ke {modalTab === 'info' ? 'Daftar Hadir' : 'Notulensi'} &rarr;
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs"
                    >
                      {editingRapat ? 'Simpan Perubahan Rapat' : 'Simpan & Sahkan Notulensi'}
                    </button>
                  )}
                </div>
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
            <h3 className="text-base font-bold text-slate-900">Hapus Data Rapat?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Data notulensi dan presensi rapat ini akan dihapus dari sistem.
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
                  onDeleteRapat(deleteConfirmId);
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
