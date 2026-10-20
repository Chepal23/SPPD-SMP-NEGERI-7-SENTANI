export interface Pegawai {
  id: string;
  nama: string;
  nip: string;
  pangkatGolongan: string;
  jabatan: string;
  instansi: string;
  tingkatBiaya: 'A' | 'B' | 'C' | 'D';
  noHp: string;
  email: string;
  statusKepegawaian: 'PNS' | 'PPPK' | 'Honorer / Non-ASN';
}

export interface DasarHukum {
  id: string;
  kode: string;
  judul: string;
  nomor: string;
  tentang: string;
  isDefault: boolean;
}

export interface PejabatPenandatangan {
  id: string;
  nama: string;
  nip: string;
  pangkatGolongan: string;
  jabatan: string;
  kotaTitimangsa: string;
}

export interface CustomLogoItem {
  id: string;
  nama: string;
  url: string;
  kategori?: 'utama' | 'kanan' | 'umum';
  ukuranKb?: number;
  createdAt: string;
}

export interface KopSurat {
  logoType: 'garuda' | 'tutwuri' | 'pemda' | 'custom';
  customLogoUrl?: string;
  logoKananType?: 'none' | 'garuda' | 'tutwuri' | 'pemda' | 'custom';
  customLogoKananUrl?: string;
  pemerintahInduk: string;
  instansiInduk: string;
  unitKerja: string;
  alamat: string;
  kota: string;
  kodePos: string;
  telepon: string;
  email: string;
  website: string;
  kertas: 'A4' | 'F4';
}

export interface PesertaHadir {
  pegawaiId: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Dinas Luar';
  waktuHadir?: string;
  keterangan?: string;
}

export interface NotulensiData {
  pembukaan: string;
  pembahasan: string;
  kesimpulanKeputusan: string;
  tindakLanjut: string;
}

export interface RapatItem {
  id: string;
  nomorRapat: string;
  judulRapat: string;
  agenda: string;
  hariTanggal: string;
  waktuMulai: string;
  waktuSelesai: string;
  tempat: string;
  pimpinanRapatId: string;
  notulisId: string;
  daftarHadir: PesertaHadir[];
  notulensi: NotulensiData;
  sptIdTerhubung?: string;
  status: 'Draft' | 'Final' | 'Disahkan';
  createdAt: string;
}

export interface SPTItem {
  id: string;
  nomorSPT: string;
  tanggalSurat: string;
  dasarHukumIds: string[];
  dasarHukumCustom?: string;
  pegawaiUtamaId: string;
  pengikutIds: string[];
  maksudTugas: string;
  tempatBerangkat: string;
  tempatTujuan: string;
  tanggalBerangkat: string;
  tanggalKembali: string;
  lamaHari: number;
  alatAngkutan: string;
  bebanAnggaran: string;
  mataAnggaran: string;
  penandatanganId: string;
  status: 'Draft' | 'Disetujui' | 'Selesai';
  catatan?: string;
  rapatId?: string; // Lampiran Notulensi Rapat
  createdAt: string;
}

export interface RincianBiayaSPPD {
  uangHarianPerHari: number;
  transportPP: number;
  penginapanPerMalam: number;
  jumlahMalam: number;
  uangRepresentasi: number;
  biayaLainnya: number;
  keteranganBiayaLain: string;
}

export interface SPPDItem {
  id: string;
  nomorSPPD: string;
  sptId?: string;
  pegawaiId: string;
  tingkatBiaya: string;
  maksudPerjalanan: string;
  alatAngkut: string;
  tempatBerangkat: string;
  tempatTujuan: string;
  lamaHari: number;
  tanggalBerangkat: string;
  tanggalKembali: string;
  instansiBeban: string;
  mataAnggaran: string;
  keteranganLain: string;
  tanggalDikeluarkan: string;
  kotaDikeluarkan: string;
  penandatanganId: string;
  pengikut: Array<{
    id: string;
    nama: string;
    nip: string;
    keterangan: string;
  }>;
  rincianBiaya: RincianBiayaSPPD;
  createdAt: string;
}

export interface AppDatabase {
  pegawai: Pegawai[];
  dasarHukum: DasarHukum[];
  pejabat: PejabatPenandatangan[];
  kop: KopSurat;
  sptList: SPTItem[];
  sppdList: SPPDItem[];
  rapatList: RapatItem[];
  savedLogos?: CustomLogoItem[];
  kuotaPerPegawaiDefault?: number;
  gasWebhookUrl: string;
  lastUpdated: string;
}

export type ActiveTab = 'dashboard' | 'pegawai' | 'spt' | 'sppd' | 'rapat' | 'pengaturan' | 'gas-hub';
