import React, { useState, useMemo } from 'react';
import { AppDatabase, ActiveTab, SPTItem, SPPDItem, Pegawai, RapatItem } from '../types';
import { formatTanggalIndonesia, formatRupiah } from '../utils/documentFormatter';
import { LOGO_ASSETS } from '../data/defaultData';
import { KalenderPerjalanan } from './KalenderPerjalanan';
import { 
  Users, 
  FileText, 
  FileCheck, 
  Calendar,
  Calculator, 
  Plus, 
  Printer, 
  ArrowRight, 
  Code2, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Image as ImageIcon,
  Upload,
  PieChart,
  ShieldAlert,
  AlertCircle,
  Eye,
  Sliders,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  MapPin
} from 'lucide-react';

interface DashboardProps {
  database: AppDatabase;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenCreateSPT: () => void;
  onPreviewSPT: (spt: SPTItem) => void;
  onPreviewSPPD: (sppd: SPPDItem, type: 'sppd_lembar1' | 'sppd_lembar2' | 'sppd_kuitansi' | 'sppd_lengkap') => void;
  onCreateSPPDFromSPT: (spt: SPTItem) => void;
  onOpenLogoManager: () => void;
  onUpdateKuotaDefault?: (kuota: number) => void;
  onPreviewRapat?: (rapat: RapatItem) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  database,
  onNavigateTab,
  onOpenCreateSPT,
  onPreviewSPT,
  onPreviewSPPD,
  onCreateSPPDFromSPT,
  onOpenLogoManager,
  onUpdateKuotaDefault,
  onPreviewRapat,
}) => {
  const { pegawai, sptList, sppdList, rapatList = [], kop, kuotaPerPegawaiDefault = 5 } = database;

  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [isActiveTripsModalOpen, setIsActiveTripsModalOpen] = useState(false);
  const [kuotaSetting, setKuotaSetting] = useState(kuotaPerPegawaiDefault);
  const [isSavingKuota, setIsSavingKuota] = useState(false);

  // Today reference
  const todayStr = useMemo(() => {
    // Current date in YYYY-MM-DD
    const now = new Date();
    return now.toISOString().split('T')[0];
  }, []);

  const currentMonthStr = useMemo(() => {
    return todayStr.slice(0, 7); // e.g., '2026-10'
  }, [todayStr]);

  const currentMonthName = useMemo(() => {
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthIndex = parseInt(todayStr.slice(5, 7), 10) - 1;
    const year = todayStr.slice(0, 4);
    return `${monthNames[monthIndex] || 'Bulan Berjalan'} ${year}`;
  }, [todayStr]);

  const pegawaiMap = useMemo(() => {
    const map: Record<string, Pegawai> = {};
    pegawai.forEach(p => { map[p.id] = p; });
    return map;
  }, [pegawai]);

  // 1. STATISTIK: Perjalanan Dinas Aktif Bulan Ini
  const activeTripsThisMonth = useMemo(() => {
    return sptList.filter(spt => {
      const berangkat = spt.tanggalBerangkat || '';
      const kembali = spt.tanggalKembali || '';
      // Matches current month prefix
      const matchMonth = berangkat.startsWith(currentMonthStr) || kembali.startsWith(currentMonthStr);
      return matchMonth;
    });
  }, [sptList, currentMonthStr]);

  const activeTripsBreakdown = useMemo(() => {
    let sedangBerlangsung = 0;
    let akanDatang = 0;
    let selesai = 0;

    activeTripsThisMonth.forEach(spt => {
      const b = spt.tanggalBerangkat;
      const k = spt.tanggalKembali;
      if (todayStr >= b && todayStr <= k) {
        sedangBerlangsung++;
      } else if (todayStr < b) {
        akanDatang++;
      } else {
        selesai++;
      }
    });

    return { sedangBerlangsung, akanDatang, selesai };
  }, [activeTripsThisMonth, todayStr]);

  // 2. STATISTIK: Rapat yang Akan Datang
  const upcomingMeetings = useMemo(() => {
    return rapatList
      .filter(r => r.hariTanggal >= todayStr)
      .sort((a, b) => a.hariTanggal.localeCompare(b.hariTanggal));
  }, [rapatList, todayStr]);

  const nearestMeeting = upcomingMeetings[0];

  // 3. STATISTIK: Status Sisa Kuota Perjalanan Dinas Pegawai
  const kuotaPerPegawai = kuotaPerPegawaiDefault;
  const employeeQuotaStats = useMemo(() => {
    const stats = pegawai.map(p => {
      // Count total SPT where employee is utama or in pengikut
      const usedCount = sptList.filter(spt => 
        spt.pegawaiUtamaId === p.id || (spt.pengikutIds || []).includes(p.id)
      ).length;

      const remaining = Math.max(0, kuotaPerPegawai - usedCount);
      const percentUsed = Math.min(100, Math.round((usedCount / kuotaPerPegawai) * 100));

      let statusTier: 'aman' | 'perhatian' | 'kritis' = 'aman';
      if (remaining === 0) {
        statusTier = 'kritis';
      } else if (remaining <= 2) {
        statusTier = 'perhatian';
      }

      return {
        pegawai: p,
        usedCount,
        remaining,
        percentUsed,
        statusTier,
      };
    });

    const totalInstitusiQuota = pegawai.length * kuotaPerPegawai;
    const totalUsedInstitusi = stats.reduce((acc, curr) => acc + curr.usedCount, 0);
    const totalRemainingInstitusi = Math.max(0, totalInstitusiQuota - totalUsedInstitusi);
    const percentInstitusiRemaining = totalInstitusiQuota > 0
      ? Math.round((totalRemainingInstitusi / totalInstitusiQuota) * 100)
      : 100;

    return {
      stats,
      totalInstitusiQuota,
      totalUsedInstitusi,
      totalRemainingInstitusi,
      percentInstitusiRemaining,
    };
  }, [pegawai, sptList, kuotaPerPegawai]);

  // Total Estimasi Biaya
  const totalEstimasiBiaya = useMemo(() => {
    return sppdList.reduce((acc, curr) => {
      const r = curr.rincianBiaya;
      if (!r) return acc;
      const harian = (r.uangHarianPerHari || 0) * (curr.lamaHari || 1);
      const transport = r.transportPP || 0;
      const inap = (r.penginapanPerMalam || 0) * (r.jumlahMalam || 0);
      const rep = r.uangRepresentasi || 0;
      const lain = r.biayaLainnya || 0;
      return acc + harian + transport + inap + rep + lain;
    }, 0);
  }, [sppdList]);

  // Recent SPT & SPPD
  const recentSPT = useMemo(() => [...sptList].reverse().slice(0, 5), [sptList]);
  const recentSPPD = useMemo(() => [...sppdList].reverse().slice(0, 5), [sppdList]);

  // Current Logo display
  const logoKiriPreview = useMemo(() => {
    if (kop.logoType === 'custom' && kop.customLogoUrl) return kop.customLogoUrl;
    if (kop.logoType === 'garuda') return LOGO_ASSETS.garuda;
    if (kop.logoType === 'pemda') return LOGO_ASSETS.pemda;
    return LOGO_ASSETS.tutwuri;
  }, [kop]);

  const logoKananPreview = useMemo(() => {
    if (!kop.logoKananType || kop.logoKananType === 'none') return null;
    if (kop.logoKananType === 'custom' && kop.customLogoKananUrl) return kop.customLogoKananUrl;
    if (kop.logoKananType === 'garuda') return LOGO_ASSETS.garuda;
    if (kop.logoKananType === 'pemda') return LOGO_ASSETS.pemda;
    if (kop.logoKananType === 'tutwuri') return LOGO_ASSETS.tutwuri;
    return null;
  }, [kop]);

  const handleSaveKuotaDefault = () => {
    if (onUpdateKuotaDefault) {
      onUpdateKuotaDefault(kuotaSetting);
      setIsSavingKuota(true);
      setTimeout(() => setIsSavingKuota(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner with Logo Uploader Shortcut */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
            <span>Sistem Otomasi Administrasi</span>
            <span>·</span>
            <span>Berbasis Google Apps Script & Web</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            SIMPEL-SPPD Indonesia
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed">
            Percepat pembuatan Surat Perintah Tugas (SPT) dan Surat Perintah Perjalanan Dinas (SPPD) 
            dengan kop dinas kustom, dasar hukum otomatis, manajemen rapat, dan cetak sekali klik.
          </p>

          <div className="flex items-center gap-3 pt-1 text-xs text-slate-600 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Unit Aktif: <strong className="text-slate-800">{kop.unitKerja}</strong> ({kop.kota})</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5 text-indigo-700 font-medium">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>Periode: <strong>{currentMonthName}</strong></span>
            </div>
          </div>
        </div>

        {/* Quick Action Group */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={onOpenCreateSPT}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Buat SPT Baru</span>
          </button>

          {/* Dedicated Logo Upload Button */}
          <button
            onClick={onOpenLogoManager}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors flex items-center gap-2 shadow-2xs"
            title="Upload Logo Kustom & Kelola Lambang Kop Surat"
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>Upload Logo Kop</span>
          </button>

          <button
            onClick={() => onNavigateTab('rapat')}
            className="px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Catat Rapat</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3 CORE REAL-TIME OPERATIONAL CARDS REQUESTED BY USER */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* KARTU 1: Perjalanan Dinas Aktif Bulan Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Bulan Berjalan ({currentMonthName})</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-3xl font-extrabold font-mono tabular-nums text-slate-900">
                {activeTripsThisMonth.length}
                <span className="text-xs font-normal text-slate-500 ml-2">Perjalanan Dinas Aktif</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Surat tugas (SPT) dengan pelaksanaan dinas pada {currentMonthName}.
              </p>
            </div>

            {/* Breakdown Status */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
              <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                <div className="text-base font-bold font-mono text-emerald-700">{activeTripsBreakdown.sedangBerlangsung}</div>
                <div className="text-[10px] text-emerald-800 font-medium">Berlangsung</div>
              </div>
              <div className="bg-blue-50/70 p-2 rounded-lg border border-blue-100">
                <div className="text-base font-bold font-mono text-blue-700">{activeTripsBreakdown.akanDatang}</div>
                <div className="text-[10px] text-blue-800 font-medium">Terjadwal</div>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <div className="text-base font-bold font-mono text-slate-700">{activeTripsBreakdown.selesai}</div>
                <div className="text-[10px] text-slate-500 font-medium">Selesai</div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setIsActiveTripsModalOpen(true)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
            >
              <span>Lihat Daftar Perjalanan Bulan Ini</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigateTab('spt')}
              className="text-[11px] text-slate-400 hover:text-slate-700"
            >
              Ke Menu SPT
            </button>
          </div>
        </div>

        {/* KARTU 2: Jumlah Rapat yang Akan Datang */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md">
                <Calendar className="w-3.5 h-3.5 text-purple-600" />
                <span>Agenda Mendatang</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-3xl font-extrabold font-mono tabular-nums text-slate-900">
                {upcomingMeetings.length}
                <span className="text-xs font-normal text-slate-500 ml-2">Rapat Terjadwal</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Rapat koordinasi kedinasan & komite yang akan berlangsung.
              </p>
            </div>

            {/* Nearest upcoming meeting teaser */}
            <div className="pt-2 border-t border-slate-100">
              {nearestMeeting ? (
                <div className="bg-purple-50/50 p-2.5 rounded-lg border border-purple-100 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-purple-900">Rapat Terdekat:</span>
                    <span className="font-mono text-purple-700 font-bold">
                      {formatTanggalIndonesia(nearestMeeting.hariTanggal)}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-900 line-clamp-1" title={nearestMeeting.judulRapat}>
                    {nearestMeeting.judulRapat}
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Pukul {nearestMeeting.waktuMulai} - {nearestMeeting.waktuSelesai}</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic py-2 text-center">
                  Tidak ada agenda rapat dalam waktu dekat.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onNavigateTab('rapat')}
              className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 transition-colors"
            >
              <span>Buka Manajemen Rapat & Presensi</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigateTab('rapat')}
              className="text-[11px] text-slate-400 hover:text-slate-700"
            >
              + Buat Notulen
            </button>
          </div>
        </div>

        {/* KARTU 3: Status Sisa Kuota Perjalanan Dinas Pegawai */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
                <PieChart className="w-3.5 h-3.5 text-emerald-600" />
                <span>Plafon Alokasi Penugasan</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono tabular-nums text-slate-900">
                  {employeeQuotaStats.percentInstitusiRemaining}%
                </span>
                <span className="text-xs font-semibold text-emerald-700">Kuota Tersedia</span>
              </div>
              <div className="text-xs text-slate-600 mt-1 flex items-center justify-between">
                <span>Total Tersisa: <strong>{employeeQuotaStats.totalRemainingInstitusi}</strong> dari {employeeQuotaStats.totalInstitusiQuota} kuota</span>
                <span className="text-slate-400">({kuotaPerPegawai} tugas/staf)</span>
              </div>
            </div>

            {/* Visual Quota Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-500" 
                  style={{ width: `${100 - employeeQuotaStats.percentInstitusiRemaining}%` }}
                  title={`Terpakai: ${employeeQuotaStats.totalUsedInstitusi} penugasan`}
                ></div>
                <div 
                  className="bg-emerald-400 h-full transition-all duration-500" 
                  style={{ width: `${employeeQuotaStats.percentInstitusiRemaining}%` }}
                  title={`Tersedia: ${employeeQuotaStats.totalRemainingInstitusi} penugasan`}
                ></div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span>
                  Terpakai: {employeeQuotaStats.totalUsedInstitusi}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                  Sisa Kuota: {employeeQuotaStats.totalRemainingInstitusi}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setIsQuotaModalOpen(true)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 transition-colors"
            >
              <span>Rincian Kuota per Staf</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsQuotaModalOpen(true)}
              className="text-[11px] text-slate-400 hover:text-slate-700"
            >
              Atur Plafon
            </button>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* SECONDARY METRICS & LOGO QUICK MANAGEMENT ROW */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric A: Total Database Pegawai */}
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Database Pegawai</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">{pegawai.length}</span>
              <span className="text-xs text-slate-500">Staf Terdaftar</span>
            </div>
            <button
              onClick={() => onNavigateTab('pegawai')}
              className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
            >
              <span>Kelola Staf</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Metric B: Total SPT Diterbitkan */}
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Surat Tugas</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">{sptList.length}</span>
              <span className="text-xs text-slate-500">SPT Terbit</span>
            </div>
            <button
              onClick={() => onNavigateTab('spt')}
              className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
            >
              <span>Data SPT</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Metric C: SPPD Siap Cetak */}
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Dokumen SPPD</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">{sppdList.length}</span>
              <span className="text-xs text-slate-500">Lembar SPPD</span>
            </div>
            <button
              onClick={() => onNavigateTab('sppd')}
              className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
            >
              <span>Cetak SPPD</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Metric D: Real-Time Logo Kop & Upload Shortcut */}
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Logo Kop Dokumen</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-8 h-8 p-1 bg-slate-50 rounded border border-slate-200 flex items-center justify-center overflow-hidden">
                <img src={logoKiriPreview} alt="Logo Kiri" className="max-w-full max-h-full object-contain" />
              </div>
              {logoKananPreview && (
                <div className="w-8 h-8 p-1 bg-slate-50 rounded border border-slate-200 flex items-center justify-center overflow-hidden">
                  <img src={logoKananPreview} alt="Logo Kanan" className="max-w-full max-h-full object-contain" />
                </div>
              )}
              <div className="text-xs font-bold text-slate-800 capitalize truncate max-w-[100px]">
                {kop.logoType === 'custom' ? 'Kustom' : kop.logoType}
                {logoKananPreview ? ' + Kanan' : ''}
              </div>
            </div>
            <button
              onClick={onOpenLogoManager}
              className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
            >
              <span>Ganti / Upload Logo</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div 
            onClick={onOpenLogoManager}
            className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 cursor-pointer flex items-center justify-center transition-colors"
            title="Buka Pusat Upload Logo"
          >
            <Upload className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAMPILAN KALENDER JADWAL PERJALANAN DINAS BULANAN */}
      {/* ======================================================== */}
      <KalenderPerjalanan
        sptList={sptList}
        rapatList={rapatList}
        pegawaiMap={pegawaiMap}
        pegawaiList={pegawai}
        onPreviewSPT={onPreviewSPT}
        onCreateSPPDFromSPT={onCreateSPPDFromSPT}
        onPreviewRapat={onPreviewRapat}
        onNavigateTab={onNavigateTab}
        onOpenCreateSPT={onOpenCreateSPT}
      />

      {/* ======================================================== */}
      {/* MAIN CONTENT SPLIT: RECENT SPT AND QUICK WORKFLOW */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent SPT List */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Surat Perintah Tugas (SPT) Terkini
              </h3>
              <p className="text-xs text-slate-500">
                Dokumen SPT yang baru diterbitkan dan siap dicetak atau dibuatkan SPPD.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('spt')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Lihat Semua ({sptList.length})
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentSPT.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Belum ada data SPT. Klik "Buat SPT Baru" di atas untuk memulai.
              </div>
            ) : (
              recentSPT.map((spt) => {
                const peg = pegawaiMap[spt.pegawaiUtamaId];
                return (
                  <div key={spt.id} className="p-4 hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-4">
                    <div className="space-y-1 max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-900">{spt.nomorSPT}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs text-slate-500">{formatTanggalIndonesia(spt.tanggalSurat)}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-800 line-clamp-1">
                        {spt.maksudTugas}
                      </p>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                        <span>Ditugaskan: <strong className="text-slate-800">{peg?.nama || '-'}</strong></span>
                        <span>·</span>
                        <span className="text-indigo-600 font-medium">Tujuan: {spt.tempatTujuan}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onPreviewSPT(spt)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak</span>
                      </button>

                      <button
                        onClick={() => onCreateSPPDFromSPT(spt)}
                        className="px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 transition-colors"
                      >
                        SPPD
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick SPPD & Workflow Explanations */}
        <div className="lg:col-span-5 space-y-4">
          {/* Recent SPPD Summary */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Cetak Cepat SPPD (1-Klik)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Surat Perjalanan Dinas siap cetak lembar muka & visum.
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('sppd')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Semua ({sppdList.length})
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentSPPD.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  Belum ada SPPD. Buat dari menu SPT.
                </div>
              ) : (
                recentSPPD.map((sppd) => {
                  const peg = pegawaiMap[sppd.pegawaiId];
                  return (
                    <div key={sppd.id} className="p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2">
                      <div>
                        <div className="font-mono text-xs font-semibold text-slate-900">{sppd.nomorSPPD}</div>
                        <div className="text-[11px] text-slate-600">{peg?.nama}</div>
                        <div className="text-[10px] text-slate-400">{sppd.tempatTujuan}</div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onPreviewSPPD(sppd, 'sppd_lembar1')}
                          className="px-2 py-1 text-[11px] font-medium bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-700"
                          title="Cetak Lembar 1"
                        >
                          Lbr 1
                        </button>
                        <button
                          onClick={() => onPreviewSPPD(sppd, 'sppd_lembar2')}
                          className="px-2 py-1 text-[11px] font-medium bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-700"
                          title="Cetak Lembar 2 Visum"
                        >
                          Visum
                        </button>
                        <button
                          onClick={() => onPreviewSPPD(sppd, 'sppd_lengkap')}
                          className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                          title="Cetak Lengkap"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Guide */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Alur Cepat Administrasi:
            </h4>
            <div className="space-y-1.5 text-slate-600 text-[11px]">
              <p>1. <strong>Database Pegawai:</strong> Pastikan NIP & golongan staf terdaftar.</p>
              <p>2. <strong>Rapat Koordinasi:</strong> Buat notulen & presensi, hasil rapat langsung bisa diubah jadi SPT.</p>
              <p>3. <strong>Surat Perintah Tugas:</strong> Terbitkan SPT, klik "Buat SPPD" untuk mencetak paket dokumen lengkap.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: RINCIAN KUOTA PERJALANAN DINAS PEGAWAI */}
      {/* ======================================================== */}
      {isQuotaModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                  <PieChart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Status Sisa Kuota Perjalanan Dinas Staf Pegawai
                  </h3>
                  <p className="text-xs text-slate-300">
                    Pemantauan alokasi dan frekuensi penugasan dinas per semester / tahun anggaran.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsQuotaModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Plafon Setting Bar */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-900 block">
                    Standar Plafon Kuota Tugas per Pegawai:
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Batas alokasi standar penugasan luar kantor yang diberikan kepada masing-masing pegawai.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={kuotaSetting}
                    onChange={(e) => setKuotaSetting(parseInt(e.target.value, 10) || 1)}
                    className="w-20 px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-center bg-white"
                  />
                  <span className="text-xs text-slate-600">tugas/staf</span>
                  <button
                    onClick={handleSaveKuotaDefault}
                    className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1"
                  >
                    {isSavingKuota ? <Check className="w-3.5 h-3.5" /> : null}
                    <span>{isSavingKuota ? 'Tersimpan' : 'Terapkan'}</span>
                  </button>
                </div>
              </div>

              {/* Institution Quota Summary Bar */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500">Total Plafon Alokasi</div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                    {employeeQuotaStats.totalInstitusiQuota}
                  </div>
                  <div className="text-[10px] text-slate-400">Semua Staf ({pegawai.length} orang)</div>
                </div>
                <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-100">
                  <div className="text-xs text-indigo-700 font-medium">Telah Digunakan</div>
                  <div className="text-xl font-bold font-mono text-indigo-800 mt-0.5">
                    {employeeQuotaStats.totalUsedInstitusi}
                  </div>
                  <div className="text-[10px] text-indigo-600">Total Surat Tugas Terbit</div>
                </div>
                <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
                  <div className="text-xs text-emerald-800 font-medium">Sisa Kuota Bersama</div>
                  <div className="text-xl font-bold font-mono text-emerald-700 mt-0.5">
                    {employeeQuotaStats.totalRemainingInstitusi}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold">{employeeQuotaStats.percentInstitusiRemaining}% Tersedia</div>
                </div>
              </div>

              {/* Employee Breakdown Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                      <th className="py-2.5 px-3 w-10 text-center">No</th>
                      <th className="py-2.5 px-3">Nama Pegawai & NIP</th>
                      <th className="py-2.5 px-3">Jabatan & Golongan</th>
                      <th className="py-2.5 px-3 text-center">Terpakai</th>
                      <th className="py-2.5 px-3 text-center">Sisa Kuota</th>
                      <th className="py-2.5 px-3">Status Alokasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employeeQuotaStats.stats.map((item, idx) => (
                      <tr key={item.pegawai.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{item.pegawai.nama}</div>
                          <div className="text-[10px] text-slate-500 font-mono">NIP. {item.pegawai.nip}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="text-slate-800">{item.pegawai.jabatan}</div>
                          <div className="text-[10px] text-slate-500">{item.pegawai.pangkatGolongan}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                          {item.usedCount} <span className="text-[10px] text-slate-400 font-normal">tugas</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">
                          {item.remaining} <span className="text-[10px] text-slate-400 font-normal">sisa</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full ${
                                  item.statusTier === 'kritis' ? 'bg-red-500' : item.statusTier === 'perhatian' ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${item.percentUsed}%` }}
                              ></div>
                            </div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              item.statusTier === 'kritis'
                                ? 'bg-red-50 text-red-700'
                                : item.statusTier === 'perhatian'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {item.statusTier === 'kritis' ? 'Penuh' : item.statusTier === 'perhatian' ? 'Mendekati' : 'Aman'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                Plafon kuota membantu pemerataan penugasan dinas antar pegawai.
              </span>
              <button
                onClick={() => setIsQuotaModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: DAFTAR PERJALANAN DINAS BULAN INI */}
      {/* ======================================================== */}
      {isActiveTripsModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Perjalanan Dinas Aktif Bulan Ini ({currentMonthName})
                  </h3>
                  <p className="text-xs text-slate-300">
                    Menampilkan {activeTripsThisMonth.length} dokumen tugas yang diagendakan pada bulan {currentMonthName}.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsActiveTripsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {activeTripsThisMonth.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                  Tidak ada perjalanan dinas yang tercatat pada bulan {currentMonthName}.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {activeTripsThisMonth.map((spt, i) => {
                    const peg = pegawaiMap[spt.pegawaiUtamaId];
                    const isOngoing = todayStr >= spt.tanggalBerangkat && todayStr <= spt.tanggalKembali;
                    const isUpcoming = todayStr < spt.tanggalBerangkat;

                    return (
                      <div key={spt.id} className="p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900">{spt.nomorSPT}</span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              isOngoing
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isUpcoming
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {isOngoing ? 'Sedang Berlangsung' : isUpcoming ? 'Terjadwal' : 'Selesai'}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-slate-800">{spt.maksudTugas}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>Petugas: <strong>{peg?.nama}</strong></span>
                            <span>·</span>
                            <span>Tujuan: <strong>{spt.tempatTujuan}</strong></span>
                            <span>·</span>
                            <span>Tgl: {formatTanggalIndonesia(spt.tanggalBerangkat)} - {formatTanggalIndonesia(spt.tanggalKembali)} ({spt.lamaHari} Hari)</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              setIsActiveTripsModalOpen(false);
                              onPreviewSPT(spt);
                            }}
                            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
                          >
                            Cetak SPT
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                onClick={() => {
                  setIsActiveTripsModalOpen(false);
                  onNavigateTab('spt');
                }}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Buka Semua di Menu SPT →
              </button>
              <button
                onClick={() => setIsActiveTripsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
