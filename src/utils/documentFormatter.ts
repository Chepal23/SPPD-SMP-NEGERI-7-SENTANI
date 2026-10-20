const BULAN_INDONESIA = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const BULAN_ROMAWI = [
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'
];

export const formatTanggalIndonesia = (dateString?: string): string => {
  if (!dateString) return '-';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${day} ${BULAN_INDONESIA[monthIdx]} ${year}`;
      }
    }
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return `${d.getDate()} ${BULAN_INDONESIA[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateString;
  }
};

export const getBulanRomawi = (dateString?: string): string => {
  try {
    const d = dateString ? new Date(dateString) : new Date();
    return BULAN_ROMAWI[d.getMonth()] || 'X';
  } catch {
    return 'X';
  }
};

export const formatRupiah = (nominal: number): string => {
  if (nominal === undefined || nominal === null || isNaN(nominal)) return 'Rp 0';
  return 'Rp ' + nominal.toLocaleString('id-ID');
};

const SATUAN = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

export const terbilangRupiah = (nilai: number): string => {
  if (nilai <= 0) return 'Nol Rupiah';
  
  function convert(n: number): string {
    if (n < 12) {
      return SATUAN[n];
    } else if (n < 20) {
      return convert(n - 10) + ' Belas';
    } else if (n < 100) {
      return convert(Math.floor(n / 10)) + ' Puluh ' + convert(n % 10);
    } else if (n < 200) {
      return 'Seratus ' + convert(n - 100);
    } else if (n < 1000) {
      return convert(Math.floor(n / 100)) + ' Ratus ' + convert(n % 100);
    } else if (n < 2000) {
      return 'Seribu ' + convert(n - 1000);
    } else if (n < 1000000) {
      return convert(Math.floor(n / 1000)) + ' Ribu ' + convert(n % 1000);
    } else if (n < 1000000000) {
      return convert(Math.floor(n / 1000000)) + ' Juta ' + convert(n % 1000000);
    } else if (n < 1000000000000) {
      return convert(Math.floor(n / 1000000000)) + ' Miliar ' + convert(n % 1000000000);
    }
    return '';
  }

  const hasil = convert(Math.floor(nilai)).replace(/\s+/g, ' ').trim();
  return hasil + ' Rupiah';
};

export const calculateDaysBetween = (startStr: string, endStr: string): number => {
  if (!startStr || !endStr) return 1;
  try {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  } catch {
    return 1;
  }
};
