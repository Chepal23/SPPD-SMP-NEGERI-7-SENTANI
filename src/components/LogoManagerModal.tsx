import React, { useState, useRef } from 'react';
import { KopSurat, CustomLogoItem } from '../types';
import { LOGO_ASSETS } from '../data/defaultData';
import { 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Check, 
  X, 
  Plus, 
  CheckCircle2, 
  ArrowLeftRight,
  ShieldCheck,
  Eye,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';

interface LogoManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  kop: KopSurat;
  savedLogos: CustomLogoItem[];
  onSaveKop: (updatedKop: KopSurat) => void;
  onSaveLogoToGallery: (newLogo: CustomLogoItem) => void;
  onDeleteLogoFromGallery: (id: string) => void;
}

export const LogoManagerModal: React.FC<LogoManagerModalProps> = ({
  isOpen,
  onClose,
  kop,
  savedLogos,
  onSaveKop,
  onSaveLogoToGallery,
  onDeleteLogoFromGallery,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'galeri' | 'posisi'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [logoName, setLogoName] = useState('');
  const [targetSlot, setTargetSlot] = useState<'utama' | 'kanan' | 'galeri'>('utama');
  const [fileSizeKb, setFileSizeKb] = useState<number | undefined>(undefined);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const triggerAlert = (msg: string) => {
    setAlertSuccess(msg);
    setTimeout(() => setAlertSuccess(null), 3000);
  };

  const handleProcessFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar (PNG, JPG, JPEG, SVG, WebP).');
      return;
    }

    const sizeKb = Math.round(file.size / 1024);
    setFileSizeKb(sizeKb);
    
    // Auto-generate name from filename
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    setLogoName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleSaveUploadedLogo = () => {
    if (!previewUrl) return;

    const newId = `logo-${Date.now()}`;
    const logoTitle = logoName.trim() || 'Logo Kustom';

    const newLogoItem: CustomLogoItem = {
      id: newId,
      nama: logoTitle,
      url: previewUrl,
      kategori: targetSlot === 'kanan' ? 'kanan' : 'utama',
      ukuranKb: fileSizeKb,
      createdAt: new Date().toISOString(),
    };

    // Save to gallery
    onSaveLogoToGallery(newLogoItem);

    // Apply to Kop based on target
    if (targetSlot === 'utama') {
      onSaveKop({
        ...kop,
        logoType: 'custom',
        customLogoUrl: previewUrl,
      });
      triggerAlert(`Logo "${logoTitle}" berhasil disimpan dan dipasang sebagai Logo Utama (Kiri)!`);
    } else if (targetSlot === 'kanan') {
      onSaveKop({
        ...kop,
        logoKananType: 'custom',
        customLogoKananUrl: previewUrl,
      });
      triggerAlert(`Logo "${logoTitle}" berhasil disimpan dan dipasang sebagai Logo Kanan (Pendamping)!`);
    } else {
      triggerAlert(`Logo "${logoTitle}" berhasil disimpan ke dalam Galeri Logo!`);
    }

    // Reset upload state
    setPreviewUrl(null);
    setLogoName('');
    setFileSizeKb(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setActiveTab('galeri');
  };

  const handleSetLogoKiri = (logo: CustomLogoItem | { type: 'garuda' | 'tutwuri' | 'pemda'; name: string; url: string }) => {
    if ('type' in logo) {
      onSaveKop({
        ...kop,
        logoType: logo.type,
        customLogoUrl: undefined,
      });
      triggerAlert(`Logo ${logo.name} dipasang sebagai Logo Kiri (Utama).`);
    } else {
      onSaveKop({
        ...kop,
        logoType: 'custom',
        customLogoUrl: logo.url,
      });
      triggerAlert(`Logo "${logo.nama}" dipasang sebagai Logo Kiri (Utama).`);
    }
  };

  const handleSetLogoKanan = (logo: CustomLogoItem | { type: 'garuda' | 'tutwuri' | 'pemda'; name: string; url: string } | null) => {
    if (!logo) {
      onSaveKop({
        ...kop,
        logoKananType: 'none',
        customLogoKananUrl: undefined,
      });
      triggerAlert('Logo Kanan dinonaktifkan.');
      return;
    }

    if ('type' in logo) {
      onSaveKop({
        ...kop,
        logoKananType: logo.type,
        customLogoKananUrl: undefined,
      });
      triggerAlert(`Logo ${logo.name} dipasang sebagai Logo Kanan.`);
    } else {
      onSaveKop({
        ...kop,
        logoKananType: 'custom',
        customLogoKananUrl: logo.url,
      });
      triggerAlert(`Logo "${logo.nama}" dipasang sebagai Logo Kanan.`);
    }
  };

  const getActiveLogoKiriSrc = () => {
    if (kop.logoType === 'custom' && kop.customLogoUrl) return kop.customLogoUrl;
    if (kop.logoType === 'garuda') return LOGO_ASSETS.garuda;
    if (kop.logoType === 'pemda') return LOGO_ASSETS.pemda;
    return LOGO_ASSETS.tutwuri;
  };

  const getActiveLogoKananSrc = () => {
    if (!kop.logoKananType || kop.logoKananType === 'none') return null;
    if (kop.logoKananType === 'custom' && kop.customLogoKananUrl) return kop.customLogoKananUrl;
    if (kop.logoKananType === 'garuda') return LOGO_ASSETS.garuda;
    if (kop.logoKananType === 'pemda') return LOGO_ASSETS.pemda;
    if (kop.logoKananType === 'tutwuri') return LOGO_ASSETS.tutwuri;
    return null;
  };

  const logoKiriSrc = getActiveLogoKiriSrc();
  const logoKananSrc = getActiveLogoKananSrc();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                <span>Pusat & Tempat Upload Logo Kop Surat</span>
                <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded font-mono">
                  Multi-Logo & Custom
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Kelola logo resmi instansi, unggah lambang daerah / sekolah, dan atur posisi logo Kop Dokumen.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {alertSuccess && (
          <div className="bg-emerald-600 text-white px-6 py-2 text-xs font-semibold flex items-center justify-between animate-fade-in shrink-0">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {alertSuccess}
            </span>
            <button onClick={() => setAlertSuccess(null)} className="text-white/80 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 text-xs font-medium">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'border-indigo-600 text-indigo-700 font-semibold bg-white rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Logo Baru</span>
            </button>

            <button
              onClick={() => setActiveTab('galeri')}
              className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'galeri'
                  ? 'border-indigo-600 text-indigo-700 font-semibold bg-white rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Galeri & Pilihan Logo ({savedLogos.length + 3})</span>
            </button>

            <button
              onClick={() => setActiveTab('posisi')}
              className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'posisi'
                  ? 'border-indigo-600 text-indigo-700 font-semibold bg-white rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Pratinjau Kop & Posisi Logo</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 hidden sm:block">
            Mendukung PNG transparan, JPG, SVG maks 2MB
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: UPLOAD LOGO */}
          {activeTab === 'upload' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Drag and drop zone */}
              <div className="md:col-span-7 space-y-4">
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
                    dragActive
                      ? 'border-indigo-600 bg-indigo-50/80 ring-4 ring-indigo-100'
                      : previewUrl
                      ? 'border-emerald-400 bg-emerald-50/20'
                      : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/80'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                  />

                  {previewUrl ? (
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-24 h-24 p-2 bg-white rounded-xl shadow-xs border border-slate-200 flex items-center justify-center overflow-hidden">
                        <img
                          src={previewUrl}
                          alt="Pratinjau"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <div className="text-xs text-slate-600">
                        File terpilih: <span className="font-semibold text-slate-900">{logoName || 'Gambar'}</span>{' '}
                        {fileSizeKb && <span className="text-slate-400">({fileSizeKb} KB)</span>}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                      >
                        Ganti Gambar Lain
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-800">
                        Klik untuk memilih gambar atau seret (drag & drop) ke sini
                      </p>
                      <p className="text-xs text-slate-500">
                        Format disarankan: <strong>PNG dengan latar transparan</strong> untuk hasil cetak kop paling jernih.
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Panduan Format Logo Administrasi:</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                    <li>Gunakan resolusi minimal <strong>300x300 pixel</strong> agar tidak pecah saat dicetak di kertas F4/A4.</li>
                    <li>Untuk Logo Daerah (Pemda) atau Lembaga Pendidikan, gunakan rasio 1:1 (persegi/lingkaran).</li>
                    <li>Sistem secara otomatis mengompresi gambar ke Base64 agar dapat dicetak secara offline tanpa internet.</li>
                  </ul>
                </div>
              </div>

              {/* Upload Meta & Options */}
              <div className="md:col-span-5 space-y-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Atribut & Penempatan Logo
                  </h4>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama / Identitas Logo
                    </label>
                    <input
                      type="text"
                      value={logoName}
                      onChange={(e) => setLogoName(e.target.value)}
                      placeholder="Contoh: Logo SMP Negeri 1 Cerdas Mandiri"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Terapkan Langsung Ke:
                    </label>
                    <div className="space-y-2 text-xs">
                      <label className="flex items-start gap-2.5 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                        <input
                          type="radio"
                          name="targetSlot"
                          checked={targetSlot === 'utama'}
                          onChange={() => setTargetSlot('utama')}
                          className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <div className="font-semibold text-slate-900">Logo Utama (Posisi Kiri Kop)</div>
                          <div className="text-[11px] text-slate-500">Logo primer instansi / lambang daerah / Tut Wuri</div>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                        <input
                          type="radio"
                          name="targetSlot"
                          checked={targetSlot === 'kanan'}
                          onChange={() => setTargetSlot('kanan')}
                          className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <div className="font-semibold text-slate-900">Logo Pendamping (Posisi Kanan Kop)</div>
                          <div className="text-[11px] text-slate-500">Logo sekolah, akreditasi, atau mitra di pojok kanan</div>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                        <input
                          type="radio"
                          name="targetSlot"
                          checked={targetSlot === 'galeri'}
                          onChange={() => setTargetSlot('galeri')}
                          className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <div className="font-semibold text-slate-900">Simpan ke Galeri Saja</div>
                          <div className="text-[11px] text-slate-500">Simpan sebagai arsip koleksi logo untuk dipakai nanti</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!previewUrl}
                    onClick={handleSaveUploadedLogo}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs ${
                      previewUrl
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>Simpan & Terapkan Logo</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GALERI LOGO */}
          {activeTab === 'galeri' && (
            <div className="space-y-6">
              {/* Presets Standard */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Lambang & Logo Standar Nasional / Kedinasan</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Preset 1: Tut Wuri */}
                  <div className={`bg-white p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    kop.logoType === 'tutwuri' ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 p-1.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center shrink-0">
                        <img src={LOGO_ASSETS.tutwuri} alt="Tut Wuri" className="max-w-full max-h-full object-contain" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900">Tut Wuri Handayani</div>
                        <div className="text-[11px] text-slate-500">Resmi Kementerian Pendidikan / Sekolah</div>
                        {kop.logoType === 'tutwuri' && (
                          <span className="inline-block mt-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                            Aktif di Kiri
                          </span>
                        )}
                        {kop.logoKananType === 'tutwuri' && (
                          <span className="inline-block mt-1 ml-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            Aktif di Kanan
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => handleSetLogoKiri({ type: 'tutwuri', name: 'Tut Wuri Handayani', url: LOGO_ASSETS.tutwuri })}
                        className="flex-1 py-1.5 text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md transition-colors"
                      >
                        Pasang di Kiri
                      </button>
                      <button
                        onClick={() => handleSetLogoKanan({ type: 'tutwuri', name: 'Tut Wuri Handayani', url: LOGO_ASSETS.tutwuri })}
                        className="flex-1 py-1.5 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                      >
                        Pasang di Kanan
                      </button>
                    </div>
                  </div>

                  {/* Preset 2: Pemda */}
                  <div className={`bg-white p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    kop.logoType === 'pemda' ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 p-1.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center shrink-0">
                        <img src={LOGO_ASSETS.pemda} alt="Pemda" className="max-w-full max-h-full object-contain" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900">Pemerintah Daerah</div>
                        <div className="text-[11px] text-slate-500">Lambang Bintang Padi & Kapas Pemprov/Pemkab</div>
                        {kop.logoType === 'pemda' && (
                          <span className="inline-block mt-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                            Aktif di Kiri
                          </span>
                        )}
                        {kop.logoKananType === 'pemda' && (
                          <span className="inline-block mt-1 ml-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            Aktif di Kanan
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => handleSetLogoKiri({ type: 'pemda', name: 'Pemerintah Daerah', url: LOGO_ASSETS.pemda })}
                        className="flex-1 py-1.5 text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md transition-colors"
                      >
                        Pasang di Kiri
                      </button>
                      <button
                        onClick={() => handleSetLogoKanan({ type: 'pemda', name: 'Pemerintah Daerah', url: LOGO_ASSETS.pemda })}
                        className="flex-1 py-1.5 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                      >
                        Pasang di Kanan
                      </button>
                    </div>
                  </div>

                  {/* Preset 3: Garuda */}
                  <div className={`bg-white p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    kop.logoType === 'garuda' ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 p-1.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center shrink-0">
                        <img src={LOGO_ASSETS.garuda} alt="Garuda" className="max-w-full max-h-full object-contain" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900">Garuda Pancasila Emas</div>
                        <div className="text-[11px] text-slate-500">Lambang Negara Kementerian / Instansi Pusat</div>
                        {kop.logoType === 'garuda' && (
                          <span className="inline-block mt-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                            Aktif di Kiri
                          </span>
                        )}
                        {kop.logoKananType === 'garuda' && (
                          <span className="inline-block mt-1 ml-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            Aktif di Kanan
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => handleSetLogoKiri({ type: 'garuda', name: 'Garuda Pancasila', url: LOGO_ASSETS.garuda })}
                        className="flex-1 py-1.5 text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md transition-colors"
                      >
                        Pasang di Kiri
                      </button>
                      <button
                        onClick={() => handleSetLogoKanan({ type: 'garuda', name: 'Garuda Pancasila', url: LOGO_ASSETS.garuda })}
                        className="flex-1 py-1.5 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                      >
                        Pasang di Kanan
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Uploaded Logos */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-purple-600" />
                    <span>Logo Kustom yang Diunggah ({savedLogos.length})</span>
                  </h4>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Logo Baru</span>
                  </button>
                </div>

                {savedLogos.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                    <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">Belum ada logo kustom yang diunggah</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Klik tombol "Upload Logo Baru" untuk mengunggah logo khas sekolah, pemkab, atau instansi Anda.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {savedLogos.map((item) => {
                      const isLeftActive = kop.logoType === 'custom' && kop.customLogoUrl === item.url;
                      const isRightActive = kop.logoKananType === 'custom' && kop.customLogoKananUrl === item.url;

                      return (
                        <div
                          key={item.id}
                          className={`bg-white p-4 rounded-xl border transition-all flex flex-col justify-between ${
                            isLeftActive || isRightActive ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-14 h-14 p-1.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                              <img src={item.url} alt={item.nama} className="max-w-full max-h-full object-contain" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-xs text-slate-900 truncate" title={item.nama}>
                                {item.nama}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {item.ukuranKb ? `${item.ukuranKb} KB · ` : ''}Kustom
                              </div>
                              <div className="flex items-center gap-1 mt-1 flex-wrap">
                                {isLeftActive && (
                                  <span className="text-[9.5pt] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]">
                                    Kiri (Utama)
                                  </span>
                                )}
                                {isRightActive && (
                                  <span className="text-[9.5pt] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                                    Kanan
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5">
                            <button
                              onClick={() => handleSetLogoKiri(item)}
                              className="flex-1 py-1.5 text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md transition-colors"
                            >
                              Pasang Kiri
                            </button>
                            <button
                              onClick={() => handleSetLogoKanan(item)}
                              className="flex-1 py-1.5 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                            >
                              Pasang Kanan
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Hapus logo "${item.nama}" dari galeri?`)) {
                                  onDeleteLogoFromGallery(item.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Hapus Logo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: POSISI & PRATINJAU KOP */}
          {activeTab === 'posisi' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Control Kiri */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Logo Utama (Sisi Kiri)</span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded">
                      Wajib / Primer
                    </span>
                  </div>
                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200">
                    <div className="w-12 h-12 p-1 bg-slate-50 rounded border border-slate-200 flex items-center justify-center shrink-0">
                      <img src={logoKiriSrc} alt="Logo Kiri" className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-900 capitalize">
                        {kop.logoType === 'custom' ? 'Logo Kustom Pengguna' : `Lambang ${kop.logoType}`}
                      </div>
                      <div className="text-[11px] text-slate-500">Tampil di sisi kiri Kop Surat</div>
                    </div>
                    <button
                      onClick={() => setActiveTab('galeri')}
                      className="text-xs text-indigo-600 font-semibold hover:underline"
                    >
                      Ganti
                    </button>
                  </div>
                </div>

                {/* Control Kanan */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Logo Pendamping (Sisi Kanan)</span>
                    <button
                      onClick={() => handleSetLogoKanan(null)}
                      className="text-[10px] text-red-600 font-semibold hover:underline"
                    >
                      Nonaktifkan
                    </button>
                  </div>
                  {logoKananSrc ? (
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200">
                      <div className="w-12 h-12 p-1 bg-slate-50 rounded border border-slate-200 flex items-center justify-center shrink-0">
                        <img src={logoKananSrc} alt="Logo Kanan" className="max-w-full max-h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-900 capitalize">
                          {kop.logoKananType === 'custom' ? 'Logo Kustom Kanan' : `Lambang ${kop.logoKananType}`}
                        </div>
                        <div className="text-[11px] text-emerald-600 font-medium">Aktif berdampingan di Kop</div>
                      </div>
                      <button
                        onClick={() => setActiveTab('galeri')}
                        className="text-xs text-indigo-600 font-semibold hover:underline"
                      >
                        Ganti
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-white rounded-lg border border-dashed border-slate-300 text-center text-xs text-slate-500">
                      <span>Logo Kanan saat ini dinonaktifkan (default Kop satu logo).</span>
                      <button
                        onClick={() => setActiveTab('galeri')}
                        className="block mx-auto mt-1 text-indigo-600 font-semibold hover:underline"
                      >
                        + Tambah / Pasang Logo Kanan
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-indigo-600" />
                    <span>Pratinjau Nyata Kop Surat Dokumen (Skala Cetak):</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">Font: Times / Tinos Resmi</span>
                </div>

                <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-300 shadow-sm font-document text-black">
                  <div className="flex items-center justify-between pb-3 kop-double-line">
                    {/* Logo Kiri */}
                    <div className="w-20 h-20 shrink-0 flex items-center justify-center overflow-hidden">
                      <img src={logoKiriSrc} alt="Logo Kiri" className="max-h-20 max-w-20 object-contain" />
                    </div>

                    {/* Teks Tengah Kop */}
                    <div className="flex-1 text-center px-3">
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

                    {/* Logo Kanan atau Spacer */}
                    <div className="w-20 h-20 shrink-0 flex items-center justify-center overflow-hidden">
                      {logoKananSrc ? (
                        <img src={logoKananSrc} alt="Logo Kanan" className="max-h-20 max-w-20 object-contain" />
                      ) : (
                        <div className="w-20"></div>
                      )}
                    </div>
                  </div>

                  <div className="text-center text-xs text-slate-400 py-3 italic">
                    (Format di atas akan tercetak di bagian teratas seluruh dokumen SPT, SPPD, Notulensi Rapat, dan Kuitansi)
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Perubahan logo tersimpan otomatis di memori aplikasi & siap dicetak.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors"
          >
            Tutup & Terapkan
          </button>
        </div>
      </div>
    </div>
  );
};
