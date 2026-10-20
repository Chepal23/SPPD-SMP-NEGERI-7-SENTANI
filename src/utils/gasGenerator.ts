export const GENERATED_GAS_CODE = `/**
 * =========================================================================
 * SIMPEL-SPPD: APLIKASI PERJALANAN DINAS & SPT BERBASIS GOOGLE APPS SCRIPT
 * Versi: 2.0 (Open Source & Gratis)
 * Deskripsi: Skrip otomasi pembuatan dokumen Surat Perintah Tugas (SPT) dan
 *            Surat Perintah Perjalanan Dinas (SPPD) terhubung ke Google Sheets
 * =========================================================================
 */

// 1. FUNGSI SETUP AWAL DATABASE GOOGLE SHEETS
function setupDatabaseSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Sheet Data Pegawai
  var sheetPegawai = ss.getSheetByName('Data_Pegawai') || ss.insertSheet('Data_Pegawai');
  if (sheetPegawai.getLastRow() === 0) {
    sheetPegawai.appendRow([
      'ID', 'NIP', 'Nama Lengkap', 'Pangkat/Golongan', 'Jabatan', 
      'Instansi', 'Tingkat Biaya', 'Status Kepegawaian', 'No HP', 'Email'
    ]);
    sheetPegawai.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#E2E8F0');
    sheetPegawai.appendRow([
      'PEG-001', '19680817 199303 1 008', 'Drs. H. Bambang Sudarsono, M.Pd.',
      'Pembina Utama Muda, IV/c', 'Kepala Sekolah', 'SMP Negeri 1', 'A', 'PNS', '081234567890', 'bambang@belajar.id'
    ]);
    sheetPegawai.appendRow([
      'PEG-002', '19850614 201001 1 012', 'Maikel Wally, S.Pd., M.Kom.',
      'Penata Tingkat I, III/d', 'Wakil Kepala Sekolah / Guru', 'SMP Negeri 1', 'B', 'PNS', '081387654321', 'maikelwally32@admin.smp.belajar.id'
    ]);
  }

  // Sheet Data SPT
  var sheetSPT = ss.getSheetByName('Data_SPT') || ss.insertSheet('Data_SPT');
  if (sheetSPT.getLastRow() === 0) {
    sheetSPT.appendRow([
      'ID SPT', 'Nomor SPT', 'Tanggal Surat', 'NIP Pegawai', 'Nama Pegawai', 
      'Maksud Tugas', 'Tempat Berangkat', 'Tempat Tujuan', 'Tgl Berangkat', 
      'Tgl Kembali', 'Lama Hari', 'Angkutan', 'Beban Anggaran', 'Status'
    ]);
    sheetSPT.getRange(1, 1, 1, 14).setFontWeight('bold').setBackground('#E2E8F0');
  }

  // Sheet Data SPPD
  var sheetSPPD = ss.getSheetByName('Data_SPPD') || ss.insertSheet('Data_SPPD');
  if (sheetSPPD.getLastRow() === 0) {
    sheetSPPD.appendRow([
      'ID SPPD', 'Nomor SPPD', 'Ref No SPT', 'Nama Pegawai', 'NIP', 
      'Maksud Perjalanan', 'Tujuan', 'Tgl Berangkat', 'Tgl Kembali', 
      'Lama Hari', 'Uang Harian', 'Transport PP', 'Penginapan', 'Total Biaya'
    ]);
    sheetSPPD.getRange(1, 1, 1, 14).setFontWeight('bold').setBackground('#E2E8F0');
  }

  // Sheet Pengaturan Kop & Instansi
  var sheetConfig = ss.getSheetByName('Pengaturan_Kop') || ss.insertSheet('Pengaturan_Kop');
  if (sheetConfig.getLastRow() === 0) {
    sheetConfig.appendRow(['Parameter', 'Nilai Pengaturan']);
    sheetConfig.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#E2E8F0');
    sheetConfig.appendRow(['Pemerintah_Induk', 'PEMERINTAH DAERAH PROVINSI / KABUPATEN']);
    sheetConfig.appendRow(['Instansi_Induk', 'DINAS PENDIDIKAN DAN KEBUDAYAAN']);
    sheetConfig.appendRow(['Unit_Kerja', 'SMP NEGERI 1 CERDAS MANDIRI']);
    sheetConfig.appendRow(['Alamat', 'Jl. Merdeka Belajar No. 45']);
    sheetConfig.appendRow(['Kota_Instansi', 'Kabupaten Sukamaju']);
    sheetConfig.appendRow(['Nama_Kepala', 'Drs. H. Bambang Sudarsono, M.Pd.']);
    sheetConfig.appendRow(['NIP_Kepala', '19680817 199303 1 008']);
  }

  SpreadsheetApp.getUi().alert('Selamat! Semua Sheet Database SIMPEL-SPPD Berhasil Dibuat!');
}

// 2. WEB API (doGet) UNTUK SINKRONISASI DATA KE WEB APP
function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : 'all';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var result = {};

  try {
    if (action === 'all' || action === 'pegawai') {
      var sheet = ss.getSheetByName('Data_Pegawai');
      if (sheet) {
        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        result.pegawai = [];
        for (var i = 1; i < data.length; i++) {
          var row = data[i];
          result.pegawai.push({
            id: row[0],
            nip: row[1],
            nama: row[2],
            pangkatGolongan: row[3],
            jabatan: row[4],
            instansi: row[5],
            tingkatBiaya: row[6],
            statusKepegawaian: row[7],
            noHp: row[8],
            email: row[9]
          });
        }
      }
    }

    result.status = 'success';
    result.timestamp = new Date().toISOString();
  } catch (err) {
    result.status = 'error';
    result.message = err.toString();
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// 3. WEB API (doPost) UNTUK MENERIMA PENYIMPANAN DATA DARI WEB APP
function doPost(e) {
  var result = {};
  try {
    var raw = e.postData.contents;
    var payload = JSON.parse(raw);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (payload.action === 'save_spt') {
      var sheetSPT = ss.getSheetByName('Data_SPT') || ss.insertSheet('Data_SPT');
      var item = payload.data;
      sheetSPT.appendRow([
        item.id || 'SPT-' + Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMddHHmmss'),
        item.nomorSPT,
        item.tanggalSurat,
        item.nipPegawai || '',
        item.namaPegawai || '',
        item.maksudTugas,
        item.tempatBerangkat,
        item.tempatTujuan,
        item.tanggalBerangkat,
        item.tanggalKembali,
        item.lamaHari,
        item.alatAngkutan,
        item.bebanAnggaran,
        item.status || 'Disetujui'
      ]);
      result.status = 'success';
      result.message = 'SPT Berhasil Disimpan ke Google Sheets!';
    } else {
      result.status = 'success';
      result.message = 'Payload diterima.';
    }
  } catch (err) {
    result.status = 'error';
    result.message = err.toString();
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

export const GAS_TUTORIAL_STEPS = [
  {
    step: 1,
    title: 'Buat Spreadsheet Baru di Google Drive',
    desc: 'Buka Google Drive Anda, klik Baru (+ Baru) > Google Spreadsheet, lalu beri nama spreadsheet misalnya "Database SIMPEL-SPPD".',
  },
  {
    step: 2,
    title: 'Buka Apps Script Editor',
    desc: 'Pada menu spreadsheet di atas, klik menu "Ekstensi" lalu pilih "Apps Script". Jendela editor Google Apps Script akan terbuka.',
  },
  {
    step: 3,
    title: 'Tempel Kode Script (Code.gs)',
    desc: 'Hapus semua kode bawaan (myFunction), lalu salin seluruh kode di tab "Kode Script Google Apps Script" dan tempel ke editor.',
  },
  {
    step: 4,
    title: 'Jalankan Fungsi Inisialisasi Sheet',
    desc: 'Pilih fungsi "setupDatabaseSheets" pada dropdown fungsi di bagian atas editor, lalu klik tombol "Jalankan" (Run). Berikan izin akun Google saat pertama kali diminta.',
  },
  {
    step: 5,
    title: 'Deploy sebagai Web App (Opsional untuk Sinkronisasi)',
    desc: 'Klik tombol biru "Terapkan" (Deploy) > "Penerapan Baru" (New Deployment). Pilih jenis "Aplikasi Web" (Web app). Atur akses "Siapa saja" (Anyone), lalu salin URL Web App yang didapat ke menu Pengaturan di aplikasi ini untuk koneksi langsung.',
  },
];
