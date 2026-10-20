import React, { useState } from 'react';
import { AppDatabase } from '../types';
import { GENERATED_GAS_CODE, GAS_TUTORIAL_STEPS } from '../utils/gasGenerator';
import { exportDatabaseJSON, resetDatabase } from '../utils/storage';
import { 
  Code2, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  FileSpreadsheet, 
  BookOpen, 
  Cloud, 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface GoogleAppsScriptHubProps {
  database: AppDatabase;
  onUpdateWebhook: (url: string) => void;
  onRestoreDatabase: (db: AppDatabase) => void;
}

export const GoogleAppsScriptHub: React.FC<GoogleAppsScriptHubProps> = ({
  database,
  onUpdateWebhook,
  onRestoreDatabase,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'script' | 'panduan' | 'webhook' | 'backup'>('script');
  const [copiedCode, setCopiedCode] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(database.gasWebhookUrl || '');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GENERATED_GAS_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleDownloadCodeFile = () => {
    const blob = new Blob([GENERATED_GAS_CODE], { type: 'text/javascript;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Code.gs');
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateWebhook(webhookUrl.trim());
    setTestStatus('success');
    setTestMessage('URL Webhook Google Apps Script berhasil disimpan!');
    setTimeout(() => setTestStatus('idle'), 3000);
  };

  const handleTestConnection = async () => {
    if (!webhookUrl.trim()) {
      setTestStatus('error');
      setTestMessage('Masukkan URL Web App Google Apps Script terlebih dahulu.');
      return;
    }

    setTestStatus('testing');
    try {
      const target = webhookUrl.includes('?') ? `${webhookUrl}&action=pegawai` : `${webhookUrl}?action=pegawai`;
      const response = await fetch(target, { method: 'GET', mode: 'cors' });
      if (response.ok) {
        const data = await response.json();
        setTestStatus('success');
        setTestMessage(`Koneksi Sukses! Ditemukan ${data.pegawai?.length || 0} data dari Google Spreadsheet.`);
      } else {
        setTestStatus('error');
        setTestMessage(`Gagal merespons (Status: ${response.status}). Pastikan akses disetel ke "Anyone" (Siapa saja).`);
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage('Koneksi terhalang CORS browser atau URL tidak valid. Pastikan URL berakhiran /exec.');
    }
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.pegawai && parsed.sptList) {
          onRestoreDatabase(parsed);
          alert('Data cadangan berhasil dipulihkan!');
        } else {
          alert('Format berkas cadangan JSON tidak cocok.');
        }
      } catch (err) {
        alert('Gagal membaca berkas cadangan JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Open Source */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-semibold mb-3 border border-indigo-400/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>100% Gratis & Open Source</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Pusat Kode Google Apps Script & Integrasi Spreadsheet
          </h2>
          <p className="mt-2 text-sm text-indigo-100/90 leading-relaxed">
            Aplikasi ini dirancang fleksibel: Anda dapat menjalankannya langsung di web ini untuk cetak dokumen satu klik, 
            atau menghubungkannya ke Google Spreadsheet Anda menggunakan skrip otomasi Google Apps Script (GAS) di bawah.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveSubTab('script')}
          className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'script'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Kode Script Google Apps Script (Code.gs)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('panduan')}
          className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'panduan'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Panduan Instalasi Spreadsheet</span>
        </button>

        <button
          onClick={() => setActiveSubTab('webhook')}
          className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'webhook'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>Koneksi Sinkronisasi Web App</span>
        </button>

        <button
          onClick={() => setActiveSubTab('backup')}
          className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'backup'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Cadangan & Pulihkan Data</span>
        </button>
      </div>

      {/* SUBTAB 1: KODE SCRIPT GOOGLE APPS SCRIPT */}
      {activeSubTab === 'script' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-800 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-indigo-400" />
              <div>
                <span className="font-mono text-xs font-semibold text-slate-300">File: Code.gs</span>
                <span className="text-slate-400 text-xs ml-2">· Google Apps Script Engine</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-md transition-colors flex items-center gap-1.5"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Tersalin ke Clipboard!' : 'Salin Seluruh Kode'}</span>
              </button>

              <button
                onClick={handleDownloadCodeFile}
                className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File Code.gs</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-[500px] leading-relaxed">
            <pre>
              <code>{GENERATED_GAS_CODE}</code>
            </pre>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p>
              <strong>Petunjuk Singkat:</strong> Buka Google Spreadsheet baru, klik <em>Ekstensi &gt; Apps Script</em>, 
              ganti semua isinya dengan kode di atas, lalu jalankan fungsi <code>setupDatabaseSheets()</code> untuk membuat seluruh tabel database secara otomatis.
            </p>
          </div>
        </div>
      )}

      {/* SUBTAB 2: PANDUAN INSTALASI SPREADSHEET */}
      {activeSubTab === 'panduan' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-lg">
              Panduan Lengkap Pemasangan di Google Drive & Spreadsheet
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ikuti 5 langkah sederhana berikut untuk memiliki database perjalanan dinas mandiri berbasis Google Sheets.
            </p>
          </div>

          <div className="space-y-4">
            {GAS_TUTORIAL_STEPS.map((step) => (
              <div key={step.step} className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                  {step.step}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{step.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tips Spreadsheet Structure */}
          <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50">
            <h4 className="font-bold text-indigo-950 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
              <span>Struktur Sheet yang Dibuat Otomatis:</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white rounded-lg border border-indigo-100">
                <span className="font-bold text-slate-900 font-mono">1. Data_Pegawai</span>
                <p className="text-[11px] text-slate-500 mt-1">Menampung NIP, nama, golongan, jabatan, status kepegawaian.</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-indigo-100">
                <span className="font-bold text-slate-900 font-mono">2. Data_SPT</span>
                <p className="text-[11px] text-slate-500 mt-1">Riwayat penugasan, nomor SPT, tanggal, tujuan, dan anggaran.</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-indigo-100">
                <span className="font-bold text-slate-900 font-mono">3. Data_SPPD</span>
                <p className="text-[11px] text-slate-500 mt-1">Data lembar SPPD resmi dan rincian nominal biaya riil.</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-indigo-100">
                <span className="font-bold text-slate-900 font-mono">4. Pengaturan_Kop</span>
                <p className="text-[11px] text-slate-500 mt-1">Konfigurasi teks kop instansi dan pejabat penandatangan.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: KONEKSI WEBHOOK */}
      {activeSubTab === 'webhook' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Sinkronisasi URL Web App Google Apps Script
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Masukkan Web App URL hasil Deploy Google Apps Script Anda (format: https://script.google.com/macros/s/.../exec)
            </p>
          </div>

          <form onSubmit={handleSaveWebhook} className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Google Apps Script Web App Deployment URL
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs"
              >
                Simpan Konfigurasi URL
              </button>

              <button
                type="button"
                onClick={handleTestConnection}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin text-indigo-600' : ''}`} />
                <span>Uji Koneksi Sinkronisasi</span>
              </button>
            </div>
          </form>

          {testMessage && (
            <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              testStatus === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              {testStatus === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{testMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 4: CADANGAN & PULIHKAN */}
      {activeSubTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Ekspor Cadangan */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Download className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Unduh Cadangan JSON</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Simpan seluruh database pegawai, SPT, SPPD, kop surat, dan dasar hukum ke dalam satu berkas cadangan JSON aman.
            </p>
            <button
              onClick={() => exportDatabaseJSON(database)}
              className="w-full px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh File Cadangan</span>
            </button>
          </div>

          {/* Impor Pulihkan */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Cloud className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Pulihkan Cadangan</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Kembalikan data dari berkas cadangan JSON yang sebelumnya pernah diunduh ke dalam aplikasi ini.
            </p>
            <label className="cursor-pointer w-full px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center justify-center gap-1.5">
              <span>Pilih Berkas JSON</span>
              <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
            </label>
          </div>

          {/* Reset Bawaan */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Reset ke Data Awal</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Muat ulang data contoh resmi (Kepala Sekolah, Guru, Pengawas, template SPT & SPPD baku).
            </p>
            <button
              onClick={() => setResetConfirmOpen(true)}
              className="w-full px-3 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Reset Data Contoh</span>
            </button>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">Reset Semua Data?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Semua perubahan data lokal akan dikembalikan ke data awal contoh sistem.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  const restored = resetDatabase();
                  onRestoreDatabase(restored);
                  setResetConfirmOpen(false);
                }}
                className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-2xs"
              >
                Ya, Reset Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
