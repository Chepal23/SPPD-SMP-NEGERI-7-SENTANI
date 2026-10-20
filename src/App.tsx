import React, { useState, useEffect, useMemo } from 'react';
import { 
  AppDatabase, 
  ActiveTab, 
  Pegawai, 
  SPTItem, 
  SPPDItem, 
  RapatItem,
  KopSurat, 
  DasarHukum, 
  PejabatPenandatangan,
  CustomLogoItem
} from './types';
import { loadDatabase, saveDatabase } from './utils/storage';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { PegawaiManager } from './components/PegawaiManager';
import { SPTManager } from './components/SPTManager';
import { SPPDManager } from './components/SPPDManager';
import { RapatManager } from './components/RapatManager';
import { PengaturanManager } from './components/PengaturanManager';
import { GoogleAppsScriptHub } from './components/GoogleAppsScriptHub';
import { DocumentPreviewModal, PreviewDocType } from './components/DocumentPreviewModal';
import { LogoManagerModal } from './components/LogoManagerModal';

export default function App() {
  const [database, setDatabase] = useState<AppDatabase>(() => loadDatabase());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);

  // Preview Modal State
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    documentType: PreviewDocType;
    spt?: SPTItem;
    sppd?: SPPDItem;
    rapat?: RapatItem;
  }>({
    isOpen: false,
    documentType: 'spt',
  });

  // Keep local storage synchronized
  useEffect(() => {
    saveDatabase(database);
  }, [database]);

  // Lookup Maps
  const pegawaiMap = useMemo(() => {
    const map: Record<string, Pegawai> = {};
    database.pegawai.forEach(p => { map[p.id] = p; });
    return map;
  }, [database.pegawai]);

  const pejabatMap = useMemo(() => {
    const map: Record<string, PejabatPenandatangan> = {};
    database.pejabat.forEach(pej => { map[pej.id] = pej; });
    return map;
  }, [database.pejabat]);

  const dasarHukumMap = useMemo(() => {
    const map: Record<string, DasarHukum> = {};
    database.dasarHukum.forEach(dh => { map[dh.id] = dh; });
    return map;
  }, [database.dasarHukum]);

  const rapatMap = useMemo(() => {
    const map: Record<string, RapatItem> = {};
    (database.rapatList || []).forEach(r => { map[r.id] = r; });
    return map;
  }, [database.rapatList]);

  // Pegawai Handlers
  const handleSavePegawai = (p: Pegawai) => {
    setDatabase(prev => {
      const exists = prev.pegawai.some(item => item.id === p.id);
      const updated = exists
        ? prev.pegawai.map(item => item.id === p.id ? p : item)
        : [...prev.pegawai, p];
      return { ...prev, pegawai: updated };
    });
  };

  const handleDeletePegawai = (id: string) => {
    setDatabase(prev => ({
      ...prev,
      pegawai: prev.pegawai.filter(item => item.id !== id),
    }));
  };

  const handleImportPegawai = (newPegawai: Pegawai[]) => {
    setDatabase(prev => {
      const existingIds = new Set(prev.pegawai.map(p => p.id));
      const filtered = newPegawai.filter(p => !existingIds.has(p.id));
      return {
        ...prev,
        pegawai: [...prev.pegawai, ...filtered],
      };
    });
    alert(`Berhasil menambahkan ${newPegawai.length} data pegawai ke dalam database.`);
  };

  // SPT Handlers
  const handleSaveSPT = (spt: SPTItem) => {
    setDatabase(prev => {
      const exists = prev.sptList.some(item => item.id === spt.id);
      const updated = exists
        ? prev.sptList.map(item => item.id === spt.id ? spt : item)
        : [spt, ...prev.sptList];
      
      // If SPT has an attached rapatId, ensure that rapat also points back to this SPT
      let updatedRapatList = prev.rapatList || [];
      if (spt.rapatId) {
        updatedRapatList = updatedRapatList.map(r => 
          r.id === spt.rapatId ? { ...r, sptIdTerhubung: spt.id } : r
        );
      }

      return { ...prev, sptList: updated, rapatList: updatedRapatList };
    });
  };

  const handleDeleteSPT = (id: string) => {
    setDatabase(prev => ({
      ...prev,
      sptList: prev.sptList.filter(item => item.id !== id),
      // detach from rapat if connected
      rapatList: (prev.rapatList || []).map(r => r.sptIdTerhubung === id ? { ...r, sptIdTerhubung: undefined } : r),
    }));
  };

  const handlePreviewSPT = (spt: SPTItem) => {
    const relatedSPPD = database.sppdList.find(s => s.sptId === spt.id);
    const relatedRapat = spt.rapatId ? rapatMap[spt.rapatId] : undefined;
    setPreviewModal({
      isOpen: true,
      documentType: 'spt',
      spt,
      sppd: relatedSPPD,
      rapat: relatedRapat,
    });
  };

  // SPPD Handlers
  const handleSaveSPPD = (sppd: SPPDItem) => {
    setDatabase(prev => {
      const exists = prev.sppdList.some(item => item.id === sppd.id);
      const updated = exists
        ? prev.sppdList.map(item => item.id === sppd.id ? sppd : item)
        : [sppd, ...prev.sppdList];
      return { ...prev, sppdList: updated };
    });
  };

  const handleDeleteSPPD = (id: string) => {
    setDatabase(prev => ({
      ...prev,
      sppdList: prev.sppdList.filter(item => item.id !== id),
    }));
  };

  const handlePreviewSPPD = (sppd: SPPDItem, type: PreviewDocType) => {
    const relatedSPT = database.sptList.find(s => s.id === sppd.sptId);
    const relatedRapat = relatedSPT?.rapatId ? rapatMap[relatedSPT.rapatId] : undefined;
    setPreviewModal({
      isOpen: true,
      documentType: type,
      spt: relatedSPT,
      sppd,
      rapat: relatedRapat,
    });
  };

  // 1-Click: Create SPPD from SPT directly!
  const handleCreateSPPDFromSPT = (spt: SPTItem) => {
    const existingSPPD = database.sppdList.find(s => s.sptId === spt.id);
    if (existingSPPD) {
      setPreviewModal({
        isOpen: true,
        documentType: 'sppd_lembar1',
        spt,
        sppd: existingSPPD,
        rapat: spt.rapatId ? rapatMap[spt.rapatId] : undefined,
      });
      return;
    }

    const pegUtama = pegawaiMap[spt.pegawaiUtamaId];
    const pengikutList = (spt.pengikutIds || []).map(pId => {
      const p = pegawaiMap[pId];
      return {
        id: `p-${Date.now()}-${pId}`,
        nama: p ? p.nama : '',
        nip: p ? p.nip : '',
        keterangan: p ? p.jabatan : 'Anggota',
      };
    });

    const year = new Date().getFullYear();
    const nextNumber = String(database.sppdList.length + 101).padStart(3, '0');
    const newNomorSPPD = `094/${nextNumber}-SPPD/SMP.01/${year}`;

    const newSPPD: SPPDItem = {
      id: `sppd-${Date.now()}`,
      nomorSPPD: newNomorSPPD,
      sptId: spt.id,
      pegawaiId: spt.pegawaiUtamaId,
      tingkatBiaya: `Tingkat ${pegUtama?.tingkatBiaya || 'B'}`,
      maksudPerjalanan: spt.maksudTugas,
      alatAngkut: spt.alatAngkutan,
      tempatBerangkat: spt.tempatBerangkat,
      tempatTujuan: spt.tempatTujuan,
      lamaHari: spt.lamaHari,
      tanggalBerangkat: spt.tanggalBerangkat,
      tanggalKembali: spt.tanggalKembali,
      instansiBeban: spt.bebanAnggaran,
      mataAnggaran: spt.mataAnggaran,
      keteranganLain: `Dasar: SPT Nomor ${spt.nomorSPT}`,
      tanggalDikeluarkan: spt.tanggalSurat,
      kotaDikeluarkan: database.kop.kota,
      penandatanganId: database.pejabat[1]?.id || database.pejabat[0]?.id || '',
      pengikut: pengikutList,
      rincianBiaya: {
        uangHarianPerHari: 380000,
        transportPP: 250000,
        penginapanPerMalam: 550000,
        jumlahMalam: spt.lamaHari - 1 > 0 ? spt.lamaHari - 1 : 0,
        uangRepresentasi: 0,
        biayaLainnya: 50000,
        keteranganBiayaLain: 'Biaya Tol / Parkir Resmi',
      },
      createdAt: new Date().toISOString(),
    };

    setDatabase(prev => ({
      ...prev,
      sppdList: [newSPPD, ...prev.sppdList],
    }));

    setPreviewModal({
      isOpen: true,
      documentType: 'sppd_lembar1',
      spt,
      sppd: newSPPD,
      rapat: spt.rapatId ? rapatMap[spt.rapatId] : undefined,
    });
  };

  // Rapat Handlers
  const handleSaveRapat = (rapat: RapatItem) => {
    setDatabase(prev => {
      const exists = (prev.rapatList || []).some(item => item.id === rapat.id);
      const updated = exists
        ? prev.rapatList.map(item => item.id === rapat.id ? rapat : item)
        : [rapat, ...(prev.rapatList || [])];

      // If rapat is linked to an SPT, sync spt.rapatId
      let updatedSptList = prev.sptList;
      if (rapat.sptIdTerhubung) {
        updatedSptList = prev.sptList.map(s => 
          s.id === rapat.sptIdTerhubung ? { ...s, rapatId: rapat.id } : s
        );
      }

      return { ...prev, rapatList: updated, sptList: updatedSptList };
    });
  };

  const handleDeleteRapat = (id: string) => {
    setDatabase(prev => ({
      ...prev,
      rapatList: (prev.rapatList || []).filter(item => item.id !== id),
      sptList: prev.sptList.map(s => s.rapatId === id ? { ...s, rapatId: undefined } : s),
    }));
  };

  const handlePreviewRapat = (rapat: RapatItem, type: 'notulen_rapat' | 'daftar_hadir') => {
    const relatedSPT = rapat.sptIdTerhubung ? database.sptList.find(s => s.id === rapat.sptIdTerhubung) : undefined;
    setPreviewModal({
      isOpen: true,
      documentType: type,
      rapat,
      spt: relatedSPT,
    });
  };

  // Bidirectional: Create SPT from Rapat Decision!
  const handleCreateSPTFromRapat = (rapat: RapatItem) => {
    const year = new Date().getFullYear();
    const nextNumber = String(database.sptList.length + 101).padStart(3, '0');
    const newNomorSPT = `094/${nextNumber}/SPT/SMP.01/${year}`;

    // Selected participants who were marked "Hadir"
    const hadirPegawaiIds = (rapat.daftarHadir || [])
      .filter(d => d.status === 'Hadir' && d.pegawaiId !== rapat.pimpinanRapatId)
      .map(d => d.pegawaiId);

    const pegawaiUtamaId = hadirPegawaiIds[0] || rapat.pimpinanRapatId || database.pegawai[0]?.id || '';
    const pengikutIds = hadirPegawaiIds.slice(1);

    const newSPT: SPTItem = {
      id: `spt-${Date.now()}`,
      nomorSPT: newNomorSPT,
      tanggalSurat: rapat.hariTanggal,
      dasarHukumIds: database.dasarHukum.filter(d => d.isDefault).map(d => d.id),
      dasarHukumCustom: `Hasil ${rapat.judulRapat} Nomor ${rapat.nomorRapat} tanggal ${rapat.hariTanggal}`,
      pegawaiUtamaId,
      pengikutIds,
      maksudTugas: `Melaksanakan tindak lanjut keputusan rapat: ${rapat.judulRapat} (${rapat.agenda})`,
      tempatBerangkat: 'SMP Negeri 1 Cerdas Mandiri',
      tempatTujuan: rapat.tempat.includes('Ruang') ? 'Kantor Dinas Pendidikan Kabupaten Sukamaju' : rapat.tempat,
      tanggalBerangkat: rapat.hariTanggal,
      tanggalKembali: rapat.hariTanggal,
      lamaHari: 1,
      alatAngkutan: 'Kendaraan Dinas / Roda Empat',
      bebanAnggaran: 'BOS Reguler SMP Negeri 1 Cerdas Mandiri TA 2026',
      mataAnggaran: '5.1.02.04.01.0001 (Belanja Perjalanan Dinas Biasa)',
      penandatanganId: database.pejabat[0]?.id || '',
      status: 'Disetujui',
      rapatId: rapat.id,
      catatan: `Tindak Lanjut Notulen: ${rapat.notulensi.tindakLanjut}`,
      createdAt: new Date().toISOString(),
    };

    setDatabase(prev => ({
      ...prev,
      sptList: [newSPT, ...prev.sptList],
      rapatList: (prev.rapatList || []).map(r => r.id === rapat.id ? { ...r, sptIdTerhubung: newSPT.id } : r),
    }));

    setActiveTab('spt');
  };

  // Create Rapat from SPT Penugasan
  const handleCreateRapatFromSPT = (spt: SPTItem) => {
    const year = new Date().getFullYear();
    const count = String((database.rapatList || []).length + 1).padStart(3, '0');
    const newNomorRapat = `${count}/NOTULEN/SMP.01/${year}`;

    const newRapat: RapatItem = {
      id: `rapat-${Date.now()}`,
      nomorRapat: newNomorRapat,
      judulRapat: `Rapat Koordinasi Penugasan Dinas: ${spt.maksudTugas.slice(0, 70)}...`,
      agenda: `Persiapan dan koordinasi teknis pelaksanaan penugasan ke ${spt.tempatTujuan} sesuai Surat Tugas No. ${spt.nomorSPT}`,
      hariTanggal: spt.tanggalSurat,
      waktuMulai: '09:00',
      waktuSelesai: '11:00 WIB',
      tempat: 'Ruang Rapat Utama SMP Negeri 1',
      pimpinanRapatId: database.pejabat[0]?.id ? (database.pegawai.find(p => p.nip === database.pejabat[0]?.nip)?.id || database.pegawai[0]?.id) : database.pegawai[0]?.id,
      notulisId: database.pegawai[database.pegawai.length - 1]?.id || database.pegawai[0]?.id,
      sptIdTerhubung: spt.id,
      status: 'Disahkan',
      daftarHadir: database.pegawai.map(p => ({
        pegawaiId: p.id,
        status: (p.id === spt.pegawaiUtamaId || (spt.pengikutIds || []).includes(p.id)) ? 'Hadir' : 'Hadir',
        waktuHadir: '08:55 WIB',
        keterangan: p.id === spt.pegawaiUtamaId ? 'Petugas Utama SPT' : ((spt.pengikutIds || []).includes(p.id) ? 'Anggota Delegasi SPT' : 'Peserta Rapat'),
      })),
      notulensi: {
        pembukaan: `Rapat koordinasi persiapan keberangkatan perjalanan dinas dibuka oleh Pimpinan pada pukul 09.00 WIB.`,
        pembahasan: `1. Pemaparan agenda tugas ke ${spt.tempatTujuan} oleh ${pegawaiMap[spt.pegawaiUtamaId]?.nama || 'Petugas'}.\\n2. Verifikasi berkas administrasi perjalanan dinas (SPT No. ${spt.nomorSPT}).\\n3. Penyiapan bahan laporan hasil penugasan.`,
        kesimpulanKeputusan: `1. Menetapkan kesiapan personil yang ditugaskan berangkat pada ${spt.tanggalBerangkat}.\\n2. Melampirkan notulensi ini sebagai kelengkapan surat dinas.`,
        tindakLanjut: `Menyelesaikan SPPD dan visum perjalanan sebelum jadwal keberangkatan.`,
      },
      createdAt: new Date().toISOString(),
    };

    setDatabase(prev => ({
      ...prev,
      rapatList: [newRapat, ...(prev.rapatList || [])],
      sptList: prev.sptList.map(s => s.id === spt.id ? { ...s, rapatId: newRapat.id } : s),
    }));

    setActiveTab('rapat');
  };

  // Settings Handlers
  const handleSaveKop = (newKop: KopSurat) => {
    setDatabase(prev => ({ ...prev, kop: newKop }));
  };

  const handleSaveDasarHukum = (dh: DasarHukum) => {
    setDatabase(prev => {
      const exists = prev.dasarHukum.some(item => item.id === dh.id);
      const updated = exists
        ? prev.dasarHukum.map(item => item.id === dh.id ? dh : item)
        : [...prev.dasarHukum, dh];
      return { ...prev, dasarHukum: updated };
    });
  };

  const handleDeleteDasarHukum = (id: string) => {
    setDatabase(prev => ({
      ...prev,
      dasarHukum: prev.dasarHukum.filter(item => item.id !== id),
    }));
  };

  const handleSavePejabat = (pej: PejabatPenandatangan) => {
    setDatabase(prev => {
      const exists = prev.pejabat.some(item => item.id === pej.id);
      const updated = exists
        ? prev.pejabat.map(item => item.id === pej.id ? pej : item)
        : [...prev.pejabat, pej];
      return { ...prev, pejabat: updated };
    });
  };

  const handleDeletePejabat = (id: string) => {
    setDatabase(prev => ({
      ...prev,
      pejabat: prev.pejabat.filter(item => item.id !== id),
    }));
  };

  const handleUpdateWebhook = (url: string) => {
    setDatabase(prev => ({ ...prev, gasWebhookUrl: url }));
  };

  const handleRestoreDatabase = (restoredDb: AppDatabase) => {
    setDatabase(restoredDb);
  };

  const handleSaveLogoToGallery = (newLogo: CustomLogoItem) => {
    setDatabase(prev => {
      const existing = prev.savedLogos || [];
      const updated = [newLogo, ...existing.filter(l => l.id !== newLogo.id)];
      return { ...prev, savedLogos: updated };
    });
  };

  const handleDeleteLogoFromGallery = (id: string) => {
    setDatabase(prev => ({
      ...prev,
      savedLogos: (prev.savedLogos || []).filter(l => l.id !== id),
    }));
  };

  const handleUpdateKuotaDefault = (newKuota: number) => {
    setDatabase(prev => ({
      ...prev,
      kuotaPerPegawaiDefault: newKuota,
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Bar Header Navigation */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onQuickAction={() => setActiveTab('spt')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            database={database}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenCreateSPT={() => setActiveTab('spt')}
            onPreviewSPT={handlePreviewSPT}
            onPreviewSPPD={handlePreviewSPPD}
            onCreateSPPDFromSPT={handleCreateSPPDFromSPT}
            onOpenLogoManager={() => setIsLogoModalOpen(true)}
            onUpdateKuotaDefault={handleUpdateKuotaDefault}
            onPreviewRapat={(rapat) => handlePreviewRapat(rapat, 'notulen_rapat')}
          />
        )}

        {activeTab === 'pegawai' && (
          <PegawaiManager
            pegawaiList={database.pegawai}
            onSavePegawai={handleSavePegawai}
            onDeletePegawai={handleDeletePegawai}
            onImportPegawai={handleImportPegawai}
          />
        )}

        {activeTab === 'spt' && (
          <SPTManager
            sptList={database.sptList}
            pegawaiList={database.pegawai}
            dasarHukumList={database.dasarHukum}
            pejabatList={database.pejabat}
            rapatList={database.rapatList || []}
            pegawaiMap={pegawaiMap}
            rapatMap={rapatMap}
            onSaveSPT={handleSaveSPT}
            onDeleteSPT={handleDeleteSPT}
            onCreateSPPDFromSPT={handleCreateSPPDFromSPT}
            onPreviewSPT={handlePreviewSPT}
            onCreateRapatFromSPT={handleCreateRapatFromSPT}
            onPreviewRapat={(rapat) => handlePreviewRapat(rapat, 'notulen_rapat')}
          />
        )}

        {activeTab === 'sppd' && (
          <SPPDManager
            sppdList={database.sppdList}
            sptList={database.sptList}
            pegawaiList={database.pegawai}
            pejabatList={database.pejabat}
            pegawaiMap={pegawaiMap}
            onSaveSPPD={handleSaveSPPD}
            onDeleteSPPD={handleDeleteSPPD}
            onPreviewSPPD={handlePreviewSPPD}
          />
        )}

        {activeTab === 'rapat' && (
          <RapatManager
            rapatList={database.rapatList || []}
            pegawaiList={database.pegawai}
            sptList={database.sptList}
            pegawaiMap={pegawaiMap}
            onSaveRapat={handleSaveRapat}
            onDeleteRapat={handleDeleteRapat}
            onPreviewRapat={handlePreviewRapat}
            onCreateSPTFromRapat={handleCreateSPTFromRapat}
          />
        )}

        {activeTab === 'pengaturan' && (
          <PengaturanManager
            kop={database.kop}
            dasarHukumList={database.dasarHukum}
            pejabatList={database.pejabat}
            savedLogos={database.savedLogos || []}
            kuotaPerPegawaiDefault={database.kuotaPerPegawaiDefault || 5}
            onSaveKop={handleSaveKop}
            onSaveDasarHukum={handleSaveDasarHukum}
            onDeleteDasarHukum={handleDeleteDasarHukum}
            onSavePejabat={handleSavePejabat}
            onDeletePejabat={handleDeletePejabat}
            onSaveLogoToGallery={handleSaveLogoToGallery}
            onDeleteLogoFromGallery={handleDeleteLogoFromGallery}
            onOpenLogoManagerModal={() => setIsLogoModalOpen(true)}
            onUpdateKuotaDefault={handleUpdateKuotaDefault}
          />
        )}

        {activeTab === 'gas-hub' && (
          <GoogleAppsScriptHub
            database={database}
            onUpdateWebhook={handleUpdateWebhook}
            onRestoreDatabase={handleRestoreDatabase}
          />
        )}
      </main>

      {/* Official Document Print & Preview Modal */}
      <DocumentPreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal(prev => ({ ...prev, isOpen: false }))}
        documentType={previewModal.documentType}
        spt={previewModal.spt}
        sppd={previewModal.sppd}
        rapat={previewModal.rapat}
        kop={database.kop}
        pegawaiMap={pegawaiMap}
        pejabatMap={pejabatMap}
        dasarHukumMap={dasarHukumMap}
        rapatMap={rapatMap}
        sptList={database.sptList}
      />

      {/* Pusat & Tempat Upload Logo Modal */}
      <LogoManagerModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        kop={database.kop}
        savedLogos={database.savedLogos || []}
        onSaveKop={handleSaveKop}
        onSaveLogoToGallery={handleSaveLogoToGallery}
        onDeleteLogoFromGallery={handleDeleteLogoFromGallery}
      />

      {/* Quiet Footer */}
      <footer className="no-print border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SIMPEL-SPPD · Sistem Informasi Manajemen Perjalanan Dinas, SPT & Notulensi Rapat</span>
          <span className="text-slate-400">Open Source & Kompatibel dengan Google Apps Script</span>
        </div>
      </footer>
    </div>
  );
}
