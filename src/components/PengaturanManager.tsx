import React, { useState } from 'react';
import { KopSurat, DasarHukum, PejabatPenandatangan, CustomLogoItem } from '../types';
import { LOGO_ASSETS } from '../data/defaultData';
import { 
  Settings, 
  FileText, 
  Scale, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  Upload, 
  Eye, 
  Save, 
  AlertCircle,
  X,
  Image as ImageIcon,
  PieChart,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface PengaturanManagerProps {
  kop: KopSurat;
  dasarHukumList: DasarHukum[];
  pejabatList: PejabatPenandatangan[];
  savedLogos?: CustomLogoItem[];
  kuotaPerPegawaiDefault?: number;
  onSaveKop: (kop: KopSurat) => void;
  onSaveDasarHukum: (dh: DasarHukum) => void;
  onDeleteDasarHukum: (id: string) => void;
  onSavePejabat: (pejabat: PejabatPenandatangan) => void;
  onDeletePejabat: (id: string) => void;
  onSaveLogoToGallery?: (newLogo: CustomLogoItem) => void;
  onDeleteLogoFromGallery?: (id: string) => void;
  onOpenLogoManagerModal?: () => void;
  onUpdateKuotaDefault?: (kuota: number) => void;
}

export const PengaturanManager: React.FC<PengaturanManagerProps> = ({
  kop,
  dasarHukumList,
  pejabatList,
  savedLogos = [],
  kuotaPerPegawaiDefault = 5,
  onSaveKop,
  onSaveDasarHukum,
  onDeleteDasarHukum,
  onSavePejabat,
  onDeletePejabat,
  onSaveLogoToGallery,
  onDeleteLogoFromGallery,
  onOpenLogoManagerModal,
  onUpdateKuotaDefault,
}) => {
  const [activeTab, setActiveTab] = useState<'kop' | 'logo' | 'dasar_hukum' | 'pejabat' | 'kuota'>('kop');
  const [kopForm, setKopForm] = useState<KopSurat>({ ...kop });
  const [kuotaInput, setKuotaInput] = useState(kuotaPerPegawaiDefault);
  const [isSavedAlert, setIsSavedAlert] = useState(false);
  const [isSavedKuotaAlert, setIsSavedKuotaAlert] = useState(false);

  // Dasar Hukum modal
  const [isDHModalOpen, setIsDHModalOpen] = useState(false);
  const [editingDH, setEditingDH] = useState<DasarHukum | null>(null);
  const [dhForm, setDHForm] = useState<Partial<DasarHukum>>({
    kode: '',
    judul: '',
    nomor: '',
    tentang: '',
    isDefault: false,
  });

  // Pejabat modal
  const [isPejabatModalOpen, setIsPejabatModalOpen] = useState(false);
  const [editingPejabat, setEditingPejabat] = useState<PejabatPenandatangan | null>(null);
  const [pejabatForm, setPejabatForm] = useState<Partial<PejabatPenandatangan>>({
    nama: '',
    nip: '',
    pangkatGolongan: '',
    jabatan: '',
    kotaTitimangsa: 'Sukamaju',
  });

  // Handle Save Kop
  const handleSaveKop = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveKop(kopForm);
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 2500);
  };

  // Handle Custom Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setKopForm(prev => ({
        ...prev,
        logoType: 'custom',
        customLogoUrl: result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const getLogoPreviewSrc = () => {
    if (kopForm.logoType === 'custom' && kopForm.customLogoUrl) {
      return kopForm.customLogoUrl;
    }
    if (kopForm.logoType === 'garuda') return LOGO_ASSETS.garuda;
    if (kopForm.logoType === 'pemda') return LOGO_ASSETS.pemda;
    return LOGO_ASSETS.tutwuri;
  };

  const getLogoKananPreviewSrc = () => {
    if (!kopForm.logoKananType || kopForm.logoKananType === 'none') return null;
    if (kopForm.logoKananType === 'custom' && kopForm.customLogoKananUrl) {
      return kopForm.customLogoKananUrl;
    }
    if (kopForm.logoKananType === 'garuda') return LOGO_ASSETS.garuda;
    if (kopForm.logoKananType === 'pemda') return LOGO_ASSETS.pemda;
    if (kopForm.logoKananType === 'tutwuri') return LOGO_ASSETS.tutwuri;
    return null;
  };

  const handleAssignLogoKiri = (url: string, type: 'tutwuri' | 'pemda' | 'garuda' | 'custom') => {
    const updated: KopSurat = {
      ...kopForm,
      logoType: type,
      customLogoUrl: type === 'custom' ? url : undefined,
    };
    setKopForm(updated);
    onSaveKop(updated);
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 2500);
  };

  const handleAssignLogoKanan = (url: string | null, type: 'tutwuri' | 'pemda' | 'garuda' | 'custom' | 'none') => {
    const updated: KopSurat = {
      ...kopForm,
      logoKananType: type,
      customLogoKananUrl: type === 'custom' && url ? url : undefined,
    };
    setKopForm(updated);
    onSaveKop(updated);
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 2500);
  };

  const handleSaveKuota = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateKuotaDefault) {
      onUpdateKuotaDefault(kuotaInput);
      setIsSavedKuotaAlert(true);
      setTimeout(() => setIsSavedKuotaAlert(false), 2500);
    }
  };

  // Dasar Hukum Handlers
  const openAddDHModal = () => {
    setEditingDH(null);
    setDHForm({
      kode: `DH-0${dasarHukumList.length + 1}`,
      judul: '',
      nomor: '',
      tentang: '',
      isDefault: false,
    });
    setIsDHModalOpen(true);
  };

  const openEditDHModal = (dh: DasarHukum) => {
    setEditingDH(dh);
    setDHForm({ ...dh });
    setIsDHModalOpen(true);
  };

  const handleSubmitDH = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dhForm.nomor?.trim()) return;

    const payload: DasarHukum = {
      id: editingDH ? editingDH.id : `dh-${Date.now()}`,
      kode: dhForm.kode?.trim() || `DH-${Date.now().toString().slice(-3)}`,
      judul: dhForm.judul?.trim() || 'Dasar Hukum',
      nomor: dhForm.nomor.trim(),
      tentang: dhForm.tentang?.trim() || '',
      isDefault: !!dhForm.isDefault,
    };

    onSaveDasarHukum(payload);
    setIsDHModalOpen(false);
  };

  // Pejabat Handlers
  const openAddPejabatModal = () => {
    setEditingPejabat(null);
    setPejabatForm({
      nama: '',
      nip: '',
      pangkatGolongan: '',
      jabatan: '',
      kotaTitimangsa: kopForm.kota || 'Sukamaju',
    });
    setIsPejabatModalOpen(true);
  };

  const openEditPejabatModal = (pej: PejabatPenandatangan) => {
    setEditingPejabat(pej);
    setPejabatForm({ ...pej });
    setIsPejabatModalOpen(true);
  };

  const handleSubmitPejabat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pejabatForm.nama?.trim()) return;

    const payload: PejabatPenandatangan = {
      id: editingPejabat ? editingPejabat.id : `pejabat-${Date.now()}`,
      nama: pejabatForm.nama.trim(),
      nip: pejabatForm.nip?.trim() || '-',
      pangkatGolongan: pejabatForm.pangkatGolongan?.trim() || '-',
      jabatan: pejabatForm.jabatan?.trim() || 'Kepala Sekolah',
      kotaTitimangsa: pejabatForm.kotaTitimangsa?.trim() || 'Sukamaju',
    };

    onSavePejabat(payload);
    setIsPejabatModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-600" />
            <span>Pengaturan Dokumen & Master Data</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Sesuaikan Kop Dokumen resmi, format garis dinas, Master Dasar Hukum, dan Pejabat Penandatangan.
          </p>
        </div>

        {/* Tab segmented switch */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
          <button
            onClick={() => setActiveTab('kop')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'kop' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Custom Kop Dokumen
          </button>
          <button
            onClick={() => setActiveTab('logo')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'logo' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upload & Galeri Logo ({savedLogos.length + 3})
          </button>
          <button
            onClick={() => setActiveTab('dasar_hukum')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'dasar_hukum' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Master Dasar Hukum ({dasarHukumList.length})
          </button>
          <button
            onClick={() => setActiveTab('pejabat')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'pejabat' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pejabat Penandatangan ({pejabatList.length})
          </button>
          <button
            onClick={() => setActiveTab('kuota')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'kuota' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Plafon Kuota Dinas
          </button>
        </div>
      </div>

      {/* TAB 1: CUSTOM KOP DOKUMEN */}
      {activeTab === 'kop' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Kop */}
          <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                Parameter Kop Surat Dinas
              </h3>
              {isSavedAlert && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-4 h-4" /> Pengaturan Tersimpan!
                </span>
              )}
            </div>

            <form onSubmit={handleSaveKop} className="space-y-4">
              {/* Logo Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Pilihan Lambang / Logo Kop Surat
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenLogoManagerModal) {
                        onOpenLogoManagerModal();
                      } else {
                        setActiveTab('logo');
                      }
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tempat Upload & Galeri Logo</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setKopForm(prev => ({ ...prev, logoType: 'tutwuri' }))}
                    className={`p-2.5 rounded-lg border text-left transition-all flex flex-col items-center text-center ${
                      kopForm.logoType === 'tutwuri'
                        ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <img src={LOGO_ASSETS.tutwuri} alt="Tut Wuri" className="w-12 h-12 object-contain mb-1.5" />
                    <span className="text-xs font-semibold text-slate-800">Tut Wuri</span>
                    <span className="text-[10px] text-slate-500">Pendidikan / Sekolah</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setKopForm(prev => ({ ...prev, logoType: 'pemda' }))}
                    className={`p-2.5 rounded-lg border text-left transition-all flex flex-col items-center text-center ${
                      kopForm.logoType === 'pemda'
                        ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <img src={LOGO_ASSETS.pemda} alt="Pemda" className="w-12 h-12 object-contain mb-1.5" />
                    <span className="text-xs font-semibold text-slate-800">Pemda</span>
                    <span className="text-[10px] text-slate-500">Dinas & Instansi Daerah</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setKopForm(prev => ({ ...prev, logoType: 'garuda' }))}
                    className={`p-2.5 rounded-lg border text-left transition-all flex flex-col items-center text-center ${
                      kopForm.logoType === 'garuda'
                        ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <img src={LOGO_ASSETS.garuda} alt="Garuda" className="w-12 h-12 object-contain mb-1.5" />
                    <span className="text-xs font-semibold text-slate-800">Garuda</span>
                    <span className="text-[10px] text-slate-500">Kementerian / Nasional</span>
                  </button>

                  <label className={`cursor-pointer p-2.5 rounded-lg border text-left transition-all flex flex-col items-center justify-center text-center ${
                    kopForm.logoType === 'custom'
                      ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <Upload className="w-6 h-6 text-indigo-600 mb-1" />
                    <span className="text-xs font-semibold text-slate-800">Unggah Logo</span>
                    <span className="text-[10px] text-slate-500">File PNG/JPG</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Teks Instansi Bertingkat */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1. Pemerintah Induk (Baris Teratas)
                </label>
                <input
                  type="text"
                  required
                  value={kopForm.pemerintahInduk}
                  onChange={(e) => setKopForm({ ...kopForm, pemerintahInduk: e.target.value })}
                  placeholder="PEMERINTAH KABUPATEN BOGOR"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  2. Instansi / Organisasi Induk (Baris Kedua)
                </label>
                <input
                  type="text"
                  required
                  value={kopForm.instansiInduk}
                  onChange={(e) => setKopForm({ ...kopForm, instansiInduk: e.target.value })}
                  placeholder="DINAS PENDIDIKAN DAN KEBUDAYAAN"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  3. Nama Satuan Unit Kerja / Sekolah (Baris Utama Tebal)
                </label>
                <input
                  type="text"
                  required
                  value={kopForm.unitKerja}
                  onChange={(e) => setKopForm({ ...kopForm, unitKerja: e.target.value })}
                  placeholder="SMP NEGERI 1 CERDAS MANDIRI"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase font-bold"
                />
              </div>

              {/* Alamat & Kota */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Jalan</label>
                  <input
                    type="text"
                    value={kopForm.alamat}
                    onChange={(e) => setKopForm({ ...kopForm, alamat: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kota / Kabupaten</label>
                  <input
                    type="text"
                    value={kopForm.kota}
                    onChange={(e) => setKopForm({ ...kopForm, kota: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Kontak */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Pos</label>
                  <input
                    type="text"
                    value={kopForm.kodePos}
                    onChange={(e) => setKopForm({ ...kopForm, kodePos: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Telepon / Fax</label>
                  <input
                    type="text"
                    value={kopForm.telepon}
                    onChange={(e) => setKopForm({ ...kopForm, telepon: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ukuran Kertas Baku</label>
                  <select
                    value={kopForm.kertas}
                    onChange={(e) => setKopForm({ ...kopForm, kertas: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="A4">A4 (210 x 297 mm)</option>
                    <option value="F4">Folio / F4 (215 x 330 mm)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Resmi</label>
                  <input
                    type="email"
                    value={kopForm.email}
                    onChange={(e) => setKopForm({ ...kopForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Website Resmi</label>
                  <input
                    type="text"
                    value={kopForm.website}
                    onChange={(e) => setKopForm({ ...kopForm, website: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-2xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Pengaturan Kop Surat</span>
                </button>
              </div>
            </form>
          </div>

          {/* Live Kop Preview Box */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-600" />
                <span>Pratinjau Kop Surat Resmi</span>
              </h3>

              {/* Realistic Paper Mockup of Kop */}
              <div className="bg-white border border-slate-300 p-5 font-document shadow-sm text-black">
                <div className="flex items-center justify-between pb-3 kop-double-line">
                  <div className="w-16 h-16 shrink-0 flex items-center justify-center overflow-hidden">
                    <img
                      src={getLogoPreviewSrc()}
                      alt="Logo"
                      referrerPolicy="no-referrer"
                      className="max-h-16 max-w-16 object-contain"
                    />
                  </div>
                  <div className="flex-1 text-center px-1">
                    <h5 className="text-[10pt] font-bold tracking-tight uppercase leading-tight">
                      {kopForm.pemerintahInduk || 'PEMERINTAH DAERAH'}
                    </h5>
                    <h4 className="text-[11pt] font-bold uppercase leading-tight">
                      {kopForm.instansiInduk || 'DINAS PENDIDIKAN'}
                    </h4>
                    <h3 className="text-[12pt] font-extrabold uppercase leading-tight tracking-wide">
                      {kopForm.unitKerja || 'SMP NEGERI 1 CERDAS MANDIRI'}
                    </h3>
                    <p className="text-[7.5pt] leading-tight mt-1 text-slate-800">
                      {kopForm.alamat || 'Jl. Raya Pendidikan No. 45'}, {kopForm.kota} - Kode Pos: {kopForm.kodePos}
                    </p>
                    <p className="text-[7pt] leading-tight text-slate-700">
                      Telp: {kopForm.telepon} · Pos-el: {kopForm.email}
                    </p>
                  </div>
                  <div className="w-12 shrink-0"></div>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-[9pt] font-bold underline uppercase">
                    SURAT PERINTAH TUGAS
                  </p>
                  <p className="text-[7.5pt]">Nomor: 094/001/SPT/2026</p>
                  <p className="text-[7pt] text-slate-400 mt-4 italic">
                    (Format Kop Surat siap dicetak otomatis pada SPT dan SPPD)
                  </p>
                </div>
              </div>

              <div className="mt-4 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600">
                <p className="font-semibold text-slate-800 mb-1">Standar Format Kop Resmi:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                  <li>Garis ganda dinas (garis tebal 3px dan tipis 1px).</li>
                  <li>Teks instansi bertingkat dari atas ke bawah.</li>
                  <li>Logo resmi sebelah kiri dengan proporsi simetris.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEMPAT UPLOAD & GALERI LOGO */}
      {activeTab === 'logo' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-indigo-600" />
                  <span>Tempat Upload & Galeri Logo Kop Surat</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unggah logo kustom instansi, dan atur penempatan logo sisi kiri (utama) maupun logo sisi kanan.
                </p>
              </div>

              {onOpenLogoManagerModal && (
                <button
                  type="button"
                  onClick={onOpenLogoManagerModal}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Buka Dialog Upload Lengkap</span>
                </button>
              )}
            </div>

            {/* Quick Upload Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50/70 transition-colors flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  Pilih File Logo Kustom Baru
                </p>
                <p className="text-[11px] text-slate-500 mb-3">
                  Format PNG transparan, JPG, atau SVG (maks. 2MB)
                </p>
                <label className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer transition-colors inline-block shadow-2xs">
                  <span>Pilih File Dari Komputer</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const result = event.target?.result as string;
                        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
                        const newLogoItem: CustomLogoItem = {
                          id: `logo-${Date.now()}`,
                          nama: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
                          url: result,
                          ukuranKb: Math.round(file.size / 1024),
                          createdAt: new Date().toISOString(),
                        };
                        if (onSaveLogoToGallery) onSaveLogoToGallery(newLogoItem);
                        handleAssignLogoKiri(result, 'custom');
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Status Logo Aktif Saat Ini */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Status Logo Kop Dokumen Saat Ini:
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-2.5">
                    <div className="w-10 h-10 p-1 bg-slate-50 rounded border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                      <img src={getLogoPreviewSrc()} alt="Logo Kiri" className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Logo Kiri (Utama)</div>
                      <div className="font-bold text-slate-800 capitalize truncate">
                        {kopForm.logoType === 'custom' ? 'Logo Kustom' : kopForm.logoType}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-2.5">
                    <div className="w-10 h-10 p-1 bg-slate-50 rounded border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                      {getLogoKananPreviewSrc() ? (
                        <img src={getLogoKananPreviewSrc()!} alt="Logo Kanan" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <div className="text-[10px] text-slate-300 italic">None</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Logo Kanan</div>
                      <div className="font-bold text-slate-800 capitalize truncate">
                        {kopForm.logoKananType && kopForm.logoKananType !== 'none'
                          ? kopForm.logoKananType === 'custom' ? 'Kustom' : kopForm.logoKananType
                          : 'Nonaktif'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-slate-500">
                  Logo akan otomatis dicetak pada Kop Surat di Surat Perintah Tugas (SPT), Surat Perjalanan Dinas (SPPD), Notulensi Rapat, dan Kuitansi.
                </div>
              </div>
            </div>

            {/* Galeri Logo Standar & Kustom */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Pustaka Logo Bawaan & Logo yang Tersimpan</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {/* Preset 1: Tut Wuri */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 p-1 bg-slate-50 rounded border border-slate-200 flex items-center justify-center shrink-0">
                      <img src={LOGO_ASSETS.tutwuri} alt="Tut Wuri" className="max-w-full max-h-full object-contain" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">Tut Wuri Handayani</div>
                      <div className="text-[10px] text-slate-500">Kementerian Pendidikan / Sekolah</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAssignLogoKiri(LOGO_ASSETS.tutwuri, 'tutwuri')}
                      className="flex-1 py-1 text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded transition-colors text-center"
                    >
                      Pasang Kiri
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAssignLogoKanan(LOGO_ASSETS.tutwuri, 'tutwuri')}
                      className="flex-1 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors text-center"
                    >
                      Pasang Kanan
                    </button>
                  </div>
                </div>

                {/* Preset 2: Pemda */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 p-1 bg-slate-50 rounded border border-slate-200 flex items-center justify-center shrink-0">
                      <img src={LOGO_ASSETS.pemda} alt="Pemda" className="max-w-full max-h-full object-contain" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">Pemerintah Daerah</div>
                      <div className="text-[10px] text-slate-500">Lambang Daerah Kabupaten/Kota</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAssignLogoKiri(LOGO_ASSETS.pemda, 'pemda')}
                      className="flex-1 py-1 text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded transition-colors text-center"
                    >
                      Pasang Kiri
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAssignLogoKanan(LOGO_ASSETS.pemda, 'pemda')}
                      className="flex-1 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors text-center"
                    >
                      Pasang Kanan
                    </button>
                  </div>
                </div>

                {/* Preset 3: Garuda */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 p-1 bg-slate-50 rounded border border-slate-200 flex items-center justify-center shrink-0">
                      <img src={LOGO_ASSETS.garuda} alt="Garuda" className="max-w-full max-h-full object-contain" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">Garuda Pancasila</div>
                      <div className="text-[10px] text-slate-500">Lambang Negara Resmi</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAssignLogoKiri(LOGO_ASSETS.garuda, 'garuda')}
                      className="flex-1 py-1 text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded transition-colors text-center"
                    >
                      Pasang Kiri
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAssignLogoKanan(LOGO_ASSETS.garuda, 'garuda')}
                      className="flex-1 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors text-center"
                    >
                      Pasang Kanan
                    </button>
                  </div>
                </div>

                {/* Custom Uploaded Logos */}
                {savedLogos.map((item) => (
                  <div key={item.id} className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 p-1 bg-slate-50 rounded border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                        <img src={item.url} alt={item.nama} className="max-w-full max-h-full object-contain" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-slate-900 truncate" title={item.nama}>
                          {item.nama}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.ukuranKb ? `${item.ukuranKb} KB` : 'Kustom'}
                        </div>
                      </div>
                      {onDeleteLogoFromGallery && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Hapus logo "${item.nama}"?`)) {
                              onDeleteLogoFromGallery(item.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                          title="Hapus Logo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAssignLogoKiri(item.url, 'custom')}
                        className="flex-1 py-1 text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded transition-colors text-center"
                      >
                        Pasang Kiri
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAssignLogoKanan(item.url, 'custom')}
                        className="flex-1 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors text-center"
                      >
                        Pasang Kanan
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MASTER DASAR HUKUM */}
      {activeTab === 'dasar_hukum' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-600" />
                <span>Master Dasar Hukum Surat Perintah Tugas</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar peraturan baku yang otomatis dapat dipilih saat pembuatan dokumen SPT.
              </p>
            </div>

            <button
              onClick={openAddDHModal}
              className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Dasar Hukum</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-2.5 px-3 w-16">Kode</th>
                  <th className="py-2.5 px-3">Nomor Peraturan</th>
                  <th className="py-2.5 px-3">Tentang / Perihal</th>
                  <th className="py-2.5 px-3 text-center w-28">Pilihan Bawaan</th>
                  <th className="py-2.5 px-3 text-center w-20">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dasarHukumList.map((dh) => (
                  <tr key={dh.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-xs font-bold text-slate-500">
                      {dh.kode}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 text-xs">
                      {dh.nomor}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-xs">
                      {dh.tentang}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded ${
                        dh.isDefault ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {dh.isDefault ? 'Default' : 'Manual'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditDHModal(dh)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteDasarHukum(dh.id)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PEJABAT PENANDATANGAN */}
      {activeTab === 'pejabat' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Master Pejabat Penandatangan Dokumen</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kepala Sekolah, Pejabat Pembuat Komitmen (PPK), atau Kuasa Pengguna Anggaran yang berwenang meneken SPT & SPPD.
              </p>
            </div>

            <button
              onClick={openAddPejabatModal}
              className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Pejabat</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pejabatList.map((pej) => (
              <div key={pej.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 relative">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider block mb-1">
                      {pej.jabatan}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">{pej.nama}</h4>
                    <p className="text-xs text-slate-600 font-mono mt-0.5">NIP. {pej.nip}</p>
                    <p className="text-xs text-slate-500 mt-1">{pej.pangkatGolongan}</p>
                    <p className="text-[11px] text-slate-400 mt-2">
                      Lokasi Titimangsa: <strong>{pej.kotaTitimangsa}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditPejabatModal(pej)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    {pejabatList.length > 1 && (
                      <button
                        onClick={() => onDeletePejabat(pej.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PLAFON KUOTA PERJALANAN DINAS */}
      {activeTab === 'kuota' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <PieChart className="w-5 h-5 text-indigo-600" />
                <span>Plafon Kuota Perjalanan Dinas Pegawai</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Atur alokasi standar frekuensi penugasan luar kantor per pegawai untuk menjaga efisiensi anggaran dan pemerataan tugas.
              </p>
            </div>
            {isSavedKuotaAlert && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" /> Plafon Kuota Berhasil Disimpan!
              </span>
            )}
          </div>

          <form onSubmit={handleSaveKuota} className="max-w-xl space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alokasi Kuota Standar Per Staf / Pegawai (Tugas per Semester / Tahun)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={kuotaInput}
                  onChange={(e) => setKuotaInput(parseInt(e.target.value, 10) || 1)}
                  className="w-32 px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-center bg-white"
                />
                <span className="text-xs font-medium text-slate-600">tugas perjalanan dinas / orang</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Nilai ini digunakan sebagai dasar kalkulasi persentase sisa kuota dinas staf pada Dashboard Utama.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Ketentuan Efisiensi Penugasan Kedinasan:</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Sesuai prinsip kehati-hatian pengelolaan keuangan negara (Permendagri No. 77/2020 & Perpres No. 53/2023), penugasan perjalanan dinas dilaksanakan secara selektif, mengutamakan pencapaian target kinerja, dan memastikan pemerataan delegasi tugas antar staf aparatur sipil/sekolah.
              </p>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2 shadow-2xs"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan Kuota</span>
            </button>
          </form>
        </div>
      )}

      {/* Modal Add / Edit Dasar Hukum */}
      {isDHModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">
                {editingDH ? 'Ubah Dasar Hukum' : 'Tambah Dasar Hukum Baru'}
              </h3>
              <button
                onClick={() => setIsDHModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDH} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Peraturan / Surat *
                </label>
                <input
                  type="text"
                  required
                  value={dhForm.nomor || ''}
                  onChange={(e) => setDHForm({ ...dhForm, nomor: e.target.value })}
                  placeholder="Contoh: Undang-Undang Nomor 20 Tahun 2023"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tentang / Perihal Peraturan
                </label>
                <input
                  type="text"
                  value={dhForm.tentang || ''}
                  onChange={(e) => setDHForm({ ...dhForm, tentang: e.target.value })}
                  placeholder="Contoh: Tentang Aparatur Sipil Negara"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="dh-default"
                  checked={!!dhForm.isDefault}
                  onChange={(e) => setDHForm({ ...dhForm, isDefault: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="dh-default" className="text-xs text-slate-700 cursor-pointer">
                  Pilih otomatis (default dicentang saat membuat SPT baru)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsDHModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs"
                >
                  Simpan Dasar Hukum
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Pejabat */}
      {isPejabatModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">
                {editingPejabat ? 'Ubah Data Pejabat Penandatangan' : 'Tambah Pejabat Penandatangan'}
              </h3>
              <button
                onClick={() => setIsPejabatModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPejabat} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar *
                </label>
                <input
                  type="text"
                  required
                  value={pejabatForm.nama || ''}
                  onChange={(e) => setPejabatForm({ ...pejabatForm, nama: e.target.value })}
                  placeholder="Contoh: Drs. H. Bambang Sudarsono, M.Pd."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIP *
                </label>
                <input
                  type="text"
                  required
                  value={pejabatForm.nip || ''}
                  onChange={(e) => setPejabatForm({ ...pejabatForm, nip: e.target.value })}
                  placeholder="19680817 199303 1 008"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jabatan Kedinasan *
                </label>
                <input
                  type="text"
                  required
                  value={pejabatForm.jabatan || ''}
                  onChange={(e) => setPejabatForm({ ...pejabatForm, jabatan: e.target.value })}
                  placeholder="Contoh: Kepala Sekolah / Pejabat Pembuat Komitmen (PPK)"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pangkat & Golongan
                  </label>
                  <input
                    type="text"
                    value={pejabatForm.pangkatGolongan || ''}
                    onChange={(e) => setPejabatForm({ ...pejabatForm, pangkatGolongan: e.target.value })}
                    placeholder="Pembina Utama Muda (IV/c)"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kota Titimangsa TTD
                  </label>
                  <input
                    type="text"
                    value={pejabatForm.kotaTitimangsa || ''}
                    onChange={(e) => setPejabatForm({ ...pejabatForm, kotaTitimangsa: e.target.value })}
                    placeholder="Sukamaju"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPejabatModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs"
                >
                  Simpan Pejabat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
