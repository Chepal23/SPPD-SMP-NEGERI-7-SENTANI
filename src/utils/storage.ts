import { AppDatabase, Pegawai, SPTItem, SPPDItem, RapatItem } from '../types';
import { INITIAL_DATABASE } from '../data/defaultData';

const STORAGE_KEY = 'simpel_sppd_app_data_v1';

export const loadDatabase = (): AppDatabase => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveDatabase(INITIAL_DATABASE);
      return INITIAL_DATABASE;
    }
    const parsed = JSON.parse(raw);
    // ensure required fields exist
    return {
      ...INITIAL_DATABASE,
      ...parsed,
      kop: { ...INITIAL_DATABASE.kop, ...(parsed.kop || {}) },
      pejabat: parsed.pejabat || INITIAL_DATABASE.pejabat,
      dasarHukum: parsed.dasarHukum || INITIAL_DATABASE.dasarHukum,
      pegawai: parsed.pegawai || INITIAL_DATABASE.pegawai,
      sptList: parsed.sptList || INITIAL_DATABASE.sptList,
      sppdList: parsed.sppdList || INITIAL_DATABASE.sppdList,
      rapatList: parsed.rapatList || INITIAL_DATABASE.rapatList || [],
      savedLogos: parsed.savedLogos || INITIAL_DATABASE.savedLogos || [],
      kuotaPerPegawaiDefault: parsed.kuotaPerPegawaiDefault || INITIAL_DATABASE.kuotaPerPegawaiDefault || 5,
    };
  } catch (err) {
    console.error('Failed to load local storage data:', err);
    return INITIAL_DATABASE;
  }
};

export const saveDatabase = (db: AppDatabase): void => {
  try {
    const payload = {
      ...db,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error('Failed to save to local storage:', err);
  }
};

export const resetDatabase = (): AppDatabase => {
  localStorage.removeItem(STORAGE_KEY);
  saveDatabase(INITIAL_DATABASE);
  return INITIAL_DATABASE;
};

export const exportDatabaseJSON = (db: AppDatabase): void => {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(db, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  const dateStr = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute('download', `SIMPEL-SPPD_Backup_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

export const downloadCSV = (content: string, filename: string): void => {
  // Add UTF-8 BOM so Excel opens Indonesian characters properly
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const exportPegawaiCSV = (pegawai: Pegawai[]): void => {
  const headers = ['ID', 'NIP', 'Nama Lengkap', 'Pangkat/Golongan', 'Jabatan', 'Instansi', 'Status', 'Tingkat Biaya', 'No. HP', 'Email'];
  const rows = pegawai.map(p => [
    p.id,
    `"${p.nip}"`,
    `"${p.nama}"`,
    `"${p.pangkatGolongan}"`,
    `"${p.jabatan}"`,
    `"${p.instansi}"`,
    `"${p.statusKepegawaian}"`,
    p.tingkatBiaya,
    `"${p.noHp}"`,
    `"${p.email}"`,
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `Data_Pegawai_${dateStr}.csv`);
};

export const exportSPTCSV = (sptList: SPTItem[], pegawaiMap: Record<string, Pegawai>): void => {
  const headers = ['No SPT', 'Tanggal Surat', 'Pegawai Utama', 'NIP', 'Maksud Tugas', 'Tujuan', 'Tgl Berangkat', 'Tgl Kembali', 'Lama (Hari)', 'Status', 'Beban Anggaran'];
  const rows = sptList.map(s => {
    const peg = pegawaiMap[s.pegawaiUtamaId];
    return [
      `"${s.nomorSPT}"`,
      s.tanggalSurat,
      `"${peg ? peg.nama : '-'}"`,
      `"${peg ? peg.nip : '-'}"`,
      `"${s.maksudTugas.replace(/"/g, '""')}"`,
      `"${s.tempatTujuan.replace(/"/g, '""')}"`,
      s.tanggalBerangkat,
      s.tanggalKembali,
      s.lamaHari,
      s.status,
      `"${s.bebanAnggaran}"`,
    ];
  });

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `Data_SPT_${dateStr}.csv`);
};

export const exportSPPDCSV = (sppdList: SPPDItem[], pegawaiMap: Record<string, Pegawai>): void => {
  const headers = ['No SPPD', 'Pegawai Yang Diperintah', 'NIP', 'Maksud Perjalanan', 'Tujuan', 'Tgl Berangkat', 'Tgl Kembali', 'Lama Hari', 'Angkutan', 'Total Estimasi Biaya (Rp)'];
  const rows = sppdList.map(s => {
    const peg = pegawaiMap[s.pegawaiId];
    const totalBiaya = (
      (s.rincianBiaya?.uangHarianPerHari || 0) * (s.lamaHari || 1) +
      (s.rincianBiaya?.transportPP || 0) +
      (s.rincianBiaya?.penginapanPerMalam || 0) * (s.rincianBiaya?.jumlahMalam || 0) +
      (s.rincianBiaya?.uangRepresentasi || 0) +
      (s.rincianBiaya?.biayaLainnya || 0)
    );

    return [
      `"${s.nomorSPPD}"`,
      `"${peg ? peg.nama : '-'}"`,
      `"${peg ? peg.nip : '-'}"`,
      `"${s.maksudPerjalanan.replace(/"/g, '""')}"`,
      `"${s.tempatTujuan.replace(/"/g, '""')}"`,
      s.tanggalBerangkat,
      s.tanggalKembali,
      s.lamaHari,
      `"${s.alatAngkut}"`,
      totalBiaya,
    ];
  });

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `Data_SPPD_${dateStr}.csv`);
};

export const exportRapatCSV = (rapatList: RapatItem[], pegawaiMap: Record<string, Pegawai>): void => {
  const headers = ['No Rapat', 'Hari/Tanggal', 'Waktu', 'Judul Rapat', 'Tempat', 'Pimpinan Rapat', 'Notulis', 'Jumlah Hadir', 'Status', 'Ref SPT'];
  const rows = rapatList.map(r => {
    const pimpinan = pegawaiMap[r.pimpinanRapatId];
    const notulis = pegawaiMap[r.notulisId];
    const jumlahHadir = (r.daftarHadir || []).filter(d => d.status === 'Hadir').length;

    return [
      `"${r.nomorRapat}"`,
      r.hariTanggal,
      `"${r.waktuMulai} - ${r.waktuSelesai}"`,
      `"${r.judulRapat.replace(/"/g, '""')}"`,
      `"${r.tempat.replace(/"/g, '""')}"`,
      `"${pimpinan ? pimpinan.nama : '-'}"`,
      `"${notulis ? notulis.nama : '-'}"`,
      jumlahHadir,
      r.status,
      `"${r.sptIdTerhubung || '-'}"`,
    ];
  });

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `Data_Rapat_Notulensi_${dateStr}.csv`);
};
