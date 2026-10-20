import React, { useState } from 'react';
import { Pegawai } from '../types';
import { exportPegawaiCSV } from '../utils/storage';
import { 
  Users, 
  Search, 
  Plus, 
  Download, 
  Upload, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

interface PegawaiManagerProps {
  pegawaiList: Pegawai[];
  onSavePegawai: (pegawai: Pegawai) => void;
  onDeletePegawai: (id: string) => void;
  onImportPegawai: (pegawai: Pegawai[]) => void;
}

export const PegawaiManager: React.FC<PegawaiManagerProps> = ({
  pegawaiList,
  onSavePegawai,
  onDeletePegawai,
  onImportPegawai,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPegawai, setEditingPegawai] = useState<Pegawai | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Pegawai>>({
    nama: '',
    nip: '',
    pangkatGolongan: '',
    jabatan: '',
    instansi: '',
    tingkatBiaya: 'B',
    statusKepegawaian: 'PNS',
    noHp: '',
    email: '',
  });

  const openAddModal = () => {
    setEditingPegawai(null);
    setFormData({
      nama: '',
      nip: '',
      pangkatGolongan: 'Penata Muda, III/a',
      jabatan: 'Guru Mata Pelajaran',
      instansi: 'SMP Negeri 1 Cerdas Mandiri',
      tingkatBiaya: 'C',
      statusKepegawaian: 'PNS',
      noHp: '',
      email: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: Pegawai) => {
    setEditingPegawai(p);
    setFormData({ ...p });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama?.trim()) return;

    const payload: Pegawai = {
      id: editingPegawai ? editingPegawai.id : `peg-${Date.now()}`,
      nama: formData.nama.trim(),
      nip: formData.nip?.trim() || '-',
      pangkatGolongan: formData.pangkatGolongan?.trim() || '-',
      jabatan: formData.jabatan?.trim() || 'Staf',
      instansi: formData.instansi?.trim() || 'SMP Negeri 1 Cerdas Mandiri',
      tingkatBiaya: (formData.tingkatBiaya as any) || 'B',
      statusKepegawaian: (formData.statusKepegawaian as any) || 'PNS',
      noHp: formData.noHp?.trim() || '',
      email: formData.email?.trim() || '',
    };

    onSavePegawai(payload);
    setIsModalOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        // Parse CSV or JSON
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            onImportPegawai(parsed);
          }
        } else {
          // simple CSV parse
          const lines = text.split(/\r?\n/).filter(Boolean);
          if (lines.length > 1) {
            const imported: Pegawai[] = [];
            for (let i = 1; i < lines.length; i++) {
              const row = lines[i].split(',').map(s => s.replace(/^"|"$/g, '').trim());
              if (row[2]) {
                imported.push({
                  id: row[0] || `peg-import-${Date.now()}-${i}`,
                  nip: row[1] || '-',
                  nama: row[2],
                  pangkatGolongan: row[3] || '-',
                  jabatan: row[4] || 'Staf',
                  instansi: row[5] || 'SMP Negeri 1 Cerdas Mandiri',
                  statusKepegawaian: (row[6] as any) || 'PNS',
                  tingkatBiaya: (row[7] as any) || 'C',
                  noHp: row[8] || '',
                  email: row[9] || '',
                });
              }
            }
            if (imported.length > 0) {
              onImportPegawai(imported);
            }
          }
        }
      } catch (err) {
        console.error('Gagal impor file:', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredPegawai = pegawaiList.filter(p => {
    const matchesSearch = 
      p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.jabatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.pangkatGolongan.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || p.statusKepegawaian === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>Database Pegawai & Staf</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola data aparatur, golongan, jabatan, dan tingkat biaya perjalanan dinas secara rapi.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <label className="cursor-pointer px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs">
            <Upload className="w-3.5 h-3.5" />
            <span>Impor CSV</span>
            <input type="file" accept=".csv,.json" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={() => exportPegawaiCSV(pegawaiList)}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor Excel/CSV</span>
          </button>

          <button
            onClick={openAddModal}
            className="px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Pegawai</span>
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
            placeholder="Cari berdasarkan nama, NIP, jabatan..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Filter Tabs (Functional segmented controls) */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs self-start sm:self-auto overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-medium' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({pegawaiList.length})
          </button>
          <button
            onClick={() => setStatusFilter('PNS')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              statusFilter === 'PNS' ? 'bg-white text-slate-900 shadow-2xs font-medium' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            PNS ({pegawaiList.filter(p => p.statusKepegawaian === 'PNS').length})
          </button>
          <button
            onClick={() => setStatusFilter('PPPK')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              statusFilter === 'PPPK' ? 'bg-white text-slate-900 shadow-2xs font-medium' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            PPPK ({pegawaiList.filter(p => p.statusKepegawaian === 'PPPK').length})
          </button>
          <button
            onClick={() => setStatusFilter('Honorer / Non-ASN')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              statusFilter === 'Honorer / Non-ASN' ? 'bg-white text-slate-900 shadow-2xs font-medium' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Non-ASN ({pegawaiList.filter(p => p.statusKepegawaian === 'Honorer / Non-ASN').length})
          </button>
        </div>
      </div>

      {/* Pegawai Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Lengkap & NIP</th>
                <th className="py-3 px-4">Pangkat / Golongan</th>
                <th className="py-3 px-4">Jabatan</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Tingkat Biaya</th>
                <th className="py-3 px-4">Kontak</th>
                <th className="py-3 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPegawai.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-700">Tidak ada data pegawai yang cocok</p>
                    <p className="text-xs text-slate-400 mt-1">Gunakan kata kunci lain atau tambahkan data baru.</p>
                  </td>
                </tr>
              ) : (
                filteredPegawai.map((pegawai, index) => (
                  <tr key={pegawai.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-400 font-mono text-xs">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{pegawai.nama}</div>
                      <div className="text-xs text-slate-500 font-mono">NIP. {pegawai.nip}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 text-xs">
                      {pegawai.pangkatGolongan}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800 text-xs font-medium">{pegawai.jabatan}</div>
                      <div className="text-[11px] text-slate-500">{pegawai.instansi}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
                        pegawai.statusKepegawaian === 'PNS' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                          : pegawai.statusKepegawaian === 'PPPK' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {pegawai.statusKepegawaian}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-semibold text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        Tingkat {pegawai.tingkatBiaya}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      <div>{pegawai.noHp || '-'}</div>
                      <div className="text-slate-400 text-[11px] truncate max-w-[140px]">{pegawai.email}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(pegawai)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="Edit Pegawai"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(pegawai.id)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Hapus Pegawai"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Pegawai */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">
                {editingPegawai ? 'Ubah Data Pegawai' : 'Tambah Pegawai Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama || ''}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Drs. Bambang Sudarsono, M.Pd."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NIP / NIK
                  </label>
                  <input
                    type="text"
                    value={formData.nip || ''}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    placeholder="Contoh: 19850614 201001 1 012"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Kepegawaian
                  </label>
                  <select
                    value={formData.statusKepegawaian || 'PNS'}
                    onChange={(e) => setFormData({ ...formData, statusKepegawaian: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="PNS">PNS</option>
                    <option value="PPPK">PPPK</option>
                    <option value="Honorer / Non-ASN">Honorer / Non-ASN</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pangkat & Golongan
                  </label>
                  <input
                    type="text"
                    value={formData.pangkatGolongan || ''}
                    onChange={(e) => setFormData({ ...formData, pangkatGolongan: e.target.value })}
                    placeholder="Contoh: Penata Tingkat I (III/d)"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tingkat Biaya SPPD
                  </label>
                  <select
                    value={formData.tingkatBiaya || 'B'}
                    onChange={(e) => setFormData({ ...formData, tingkatBiaya: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="A">Tingkat A (Eselon I / Gol IV/e-IV/d)</option>
                    <option value="B">Tingkat B (Eselon II / Gol IV/c-IV/a)</option>
                    <option value="C">Tingkat C (Gol III/d-III/a / PPPK)</option>
                    <option value="D">Tingkat D (Gol II & Tenaga Teknis)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jabatan Kedinasan
                </label>
                <input
                  type="text"
                  value={formData.jabatan || ''}
                  onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                  placeholder="Contoh: Guru Madya / Wakil Kepala Sekolah / Bendahara"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unit Kerja / Satuan Pendidikan
                </label>
                <input
                  type="text"
                  value={formData.instansi || ''}
                  onChange={(e) => setFormData({ ...formData, instansi: e.target.value })}
                  placeholder="Contoh: SMP Negeri 1 Cerdas Mandiri"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. Handphone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.noHp || ''}
                    onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                    placeholder="Contoh: 08123456789"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nama@admin.smp.belajar.id"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
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
                  className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs"
                >
                  {editingPegawai ? 'Simpan Perubahan' : 'Tambahkan Pegawai'}
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
            <h3 className="text-base font-bold text-slate-900">Hapus Data Pegawai?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Data pegawai ini akan dihapus dari sistem. Tindakan ini tidak dapat dibatalkan.
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
                  onDeletePegawai(deleteConfirmId);
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
