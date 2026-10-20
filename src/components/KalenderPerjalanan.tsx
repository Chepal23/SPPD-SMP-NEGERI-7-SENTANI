import React, { useState, useMemo } from 'react';
import { SPTItem, RapatItem, Pegawai, ActiveTab } from '../types';
import { formatTanggalIndonesia } from '../utils/documentFormatter';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Users, 
  FileText, 
  Printer, 
  Filter, 
  RotateCcw, 
  Eye, 
  CalendarDays, 
  List, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Plane,
  Sparkles,
  Search,
  ExternalLink
} from 'lucide-react';

interface KalenderPerjalananProps {
  sptList: SPTItem[];
  rapatList?: RapatItem[];
  pegawaiMap: Record<string, Pegawai>;
  pegawaiList: Pegawai[];
  onPreviewSPT: (spt: SPTItem) => void;
  onCreateSPPDFromSPT: (spt: SPTItem) => void;
  onPreviewRapat?: (rapat: RapatItem) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenCreateSPT: () => void;
}

type ViewMode = 'grid' | 'agenda';
type EventFilterType = 'all' | 'departure' | 'return';

interface DayEvent {
  id: string;
  type: 'departure' | 'return' | 'ongoing' | 'rapat';
  spt?: SPTItem;
  rapat?: RapatItem;
  title: string;
  destination?: string;
  officerName?: string;
  dateStr: string;
}

export const KalenderPerjalanan: React.FC<KalenderPerjalananProps> = ({
  sptList,
  rapatList = [],
  pegawaiMap,
  pegawaiList,
  onPreviewSPT,
  onCreateSPPDFromSPT,
  onPreviewRapat,
  onNavigateTab,
  onOpenCreateSPT,
}) => {
  // Current real-world / application reference date
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => today.toISOString().split('T')[0], [today]);

  // Calendar view year and month (0-indexed month)
  const [currentYear, setCurrentYear] = useState<number>(() => {
    // Check if there are SPTs in 2026, or use current date year
    const has2026 = sptList.some(s => s.tanggalBerangkat?.startsWith('2026'));
    return has2026 ? 2026 : today.getFullYear();
  });

  const [currentMonth, setCurrentMonth] = useState<number>(() => {
    // Default to month of current date or October (9 for 0-indexed) if 2026 data
    const month = today.getMonth();
    return currentYear === 2026 ? 9 : month; // 9 = October
  });

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedPegawaiId, setSelectedPegawaiId] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<EventFilterType>('all');
  const [showRapat, setShowRapat] = useState<boolean>(true);

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    // Default to 2026-10 if dataset is in 2026
    const has2026 = sptList.some(s => s.tanggalBerangkat?.startsWith('2026'));
    if (has2026) {
      setCurrentYear(2026);
      setCurrentMonth(9);
      setSelectedDate('2026-10-19');
    } else {
      setCurrentYear(now.getFullYear());
      setCurrentMonth(now.getMonth());
      setSelectedDate(todayStr);
    }
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const currentMonthName = `${monthNames[currentMonth]} ${currentYear}`;
  const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  // Filtered SPT list based on employee selection
  const filteredSPT = useMemo(() => {
    return sptList.filter(spt => {
      if (selectedPegawaiId === 'all') return true;
      return (
        spt.pegawaiUtamaId === selectedPegawaiId ||
        (spt.pengikutIds || []).includes(selectedPegawaiId)
      );
    });
  }, [sptList, selectedPegawaiId]);

  // Map of events by YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map: Record<string, DayEvent[]> = {};

    const addEvent = (date: string, ev: DayEvent) => {
      if (!map[date]) map[date] = [];
      map[date].push(ev);
    };

    // 1. Process SPT Departures and Returns
    filteredSPT.forEach(spt => {
      const b = spt.tanggalBerangkat;
      const k = spt.tanggalKembali;
      const peg = pegawaiMap[spt.pegawaiUtamaId];
      const pegName = peg ? peg.nama.split(',')[0] : 'Petugas';

      // Keberangkatan (Departure)
      if (b && (eventFilter === 'all' || eventFilter === 'departure')) {
        addEvent(b, {
          id: `dep-${spt.id}`,
          type: 'departure',
          spt,
          title: `Keberangkatan: ${spt.tempatTujuan}`,
          destination: spt.tempatTujuan,
          officerName: pegName,
          dateStr: b,
        });
      }

      // Kepulangan (Return)
      if (k && (eventFilter === 'all' || eventFilter === 'return')) {
        // If return date is different from departure date, add distinct return event
        if (k !== b) {
          addEvent(k, {
            id: `ret-${spt.id}`,
            type: 'return',
            spt,
            title: `Kepulangan: dari ${spt.tempatTujuan}`,
            destination: spt.tempatTujuan,
            officerName: pegName,
            dateStr: k,
          });
        }
      }

      // Intermediate ongoing days (for multi-day trips longer than 2 days)
      if (b && k && b < k) {
        const start = new Date(b);
        const end = new Date(k);
        const cur = new Date(start);
        cur.setDate(cur.getDate() + 1);

        while (cur < end) {
          const midDateStr = cur.toISOString().split('T')[0];
          addEvent(midDateStr, {
            id: `mid-${spt.id}-${midDateStr}`,
            type: 'ongoing',
            spt,
            title: `Pelaksanaan: di ${spt.tempatTujuan}`,
            destination: spt.tempatTujuan,
            officerName: pegName,
            dateStr: midDateStr,
          });
          cur.setDate(cur.getDate() + 1);
        }
      }
    });

    // 2. Process Meetings (Rapat) if enabled
    if (showRapat && eventFilter === 'all') {
      rapatList.forEach(rapat => {
        if (!rapat.hariTanggal) return;
        if (selectedPegawaiId !== 'all') {
          const isParticipant = (rapat.daftarHadir || []).some(d => d.pegawaiId === selectedPegawaiId) ||
            rapat.pimpinanRapatId === selectedPegawaiId ||
            rapat.notulisId === selectedPegawaiId;
          if (!isParticipant) return;
        }

        addEvent(rapat.hariTanggal, {
          id: `rapat-${rapat.id}`,
          type: 'rapat',
          rapat,
          title: `Rapat: ${rapat.judulRapat}`,
          destination: rapat.tempat,
          officerName: 'Pimpinan & Tim',
          dateStr: rapat.hariTanggal,
        });
      });
    }

    return map;
  }, [filteredSPT, rapatList, pegawaiMap, eventFilter, showRapat, selectedPegawaiId]);

  // Calendar grid calculations
  const calendarDays = useMemo(() => {
    // First day of current month
    const firstDay = new Date(currentYear, currentMonth, 1);
    // Number of days in current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    // Day of week for first day (0=Sunday, 1=Monday... 6=Saturday)
    // Convert so Monday is index 0, Sunday is index 6
    const startingDayIndex = (firstDay.getDay() + 6) % 7;

    const days: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      events: DayEvent[];
    }> = [];

    // Days from previous month to fill the first row
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDayIndex - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        dateStr: dStr,
        dayNum: day,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        events: eventsByDate[dStr] || [],
      });
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        dateStr: dStr,
        dayNum: day,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        events: eventsByDate[dStr] || [],
      });
    }

    // Days from next month to complete grid (multiples of 7)
    const remainingDays = (7 - (days.length % 7)) % 7;
    for (let day = 1; day <= remainingDays; day++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        dateStr: dStr,
        dayNum: day,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        events: eventsByDate[dStr] || [],
      });
    }

    return days;
  }, [currentYear, currentMonth, eventsByDate, todayStr]);

  // Statistics for the current viewed month
  const monthStats = useMemo(() => {
    let departures = 0;
    let returns = 0;
    let meetings = 0;

    filteredSPT.forEach(spt => {
      if (spt.tanggalBerangkat?.startsWith(currentMonthPrefix)) departures++;
      if (spt.tanggalKembali?.startsWith(currentMonthPrefix)) returns++;
    });

    rapatList.forEach(rapat => {
      if (rapat.hariTanggal?.startsWith(currentMonthPrefix)) meetings++;
    });

    return { departures, returns, meetings };
  }, [filteredSPT, rapatList, currentMonthPrefix]);

  // Selected Date events list
  const selectedDateEvents = useMemo(() => {
    return eventsByDate[selectedDate] || [];
  }, [eventsByDate, selectedDate]);

  // Chronological agenda events for current month (Agenda view)
  const monthlyAgendaEvents = useMemo(() => {
    const list: Array<{ dateStr: string; events: DayEvent[] }> = [];
    const dateMap: Record<string, DayEvent[]> = {};

    Object.keys(eventsByDate)
      .filter(d => d.startsWith(currentMonthPrefix))
      .sort()
      .forEach(d => {
        const evs = eventsByDate[d];
        if (evs && evs.length > 0) {
          dateMap[d] = evs;
          list.push({ dateStr: d, events: evs });
        }
      });

    return list;
  }, [eventsByDate, currentMonthPrefix]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Header & Controls */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title & Month Navigator */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Kalender Jadwal Perjalanan Dinas</span>
                <span className="text-xs font-normal text-slate-500 hidden sm:inline">
                  (Format Bulanan)
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Visualisasi jadwal keberangkatan 🛫 dan kepulangan 🛬 perjalanan dinas pegawai secara real-time.
              </p>
            </div>
          </div>
        </div>

        {/* Month Navigation & Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Month Stepper */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white text-slate-700 hover:text-slate-900 rounded-lg transition-colors"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold font-mono text-slate-800 min-w-[130px] text-center">
              {currentMonthName}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white text-slate-700 hover:text-slate-900 rounded-lg transition-colors"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Today Button */}
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors shadow-2xs"
          >
            Hari Ini
          </button>

          {/* View Switch: Grid vs Agenda */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Kotak Kalender Bulanan"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kalender</span>
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                viewMode === 'agenda'
                  ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Daftar Agenda Bulanan"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Linimasa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Legend Bar */}
      <div className="px-5 sm:px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Filter Inputs */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Filter Pegawai */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-300">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedPegawaiId}
              onChange={(e) => setSelectedPegawaiId(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-800 focus:outline-none"
            >
              <option value="all">Semua Pegawai ({pegawaiList.length} Staf)</option>
              {pegawaiList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Event Type */}
          <div className="flex items-center bg-white rounded-lg border border-slate-300 p-0.5">
            <button
              onClick={() => setEventFilter('all')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                eventFilter === 'all' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600'
              }`}
            >
              Semua Jadwal
            </button>
            <button
              onClick={() => setEventFilter('departure')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                eventFilter === 'departure' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600'
              }`}
            >
              <span>🛫</span>
              <span>Keberangkatan</span>
            </button>
            <button
              onClick={() => setEventFilter('return')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                eventFilter === 'return' ? 'bg-amber-600 text-white font-bold' : 'text-slate-600'
              }`}
            >
              <span>🛬</span>
              <span>Kepulangan</span>
            </button>
          </div>

          {/* Checkbox Rapat */}
          <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showRapat}
              onChange={(e) => setShowRapat(e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500 border-slate-300"
            />
            <span className="text-[11px] font-medium text-purple-900">Sertakan Agenda Rapat</span>
          </label>
        </div>

        {/* Month Quick Summary Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-semibold">
            <span>🛫 Keberangkatan:</span>
            <span className="font-mono font-bold">{monthStats.departures}</span>
          </div>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold">
            <span>🛬 Kepulangan:</span>
            <span className="font-mono font-bold">{monthStats.returns}</span>
          </div>
          {showRapat && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-800 text-[11px] font-semibold">
              <span>👥 Rapat:</span>
              <span className="font-mono font-bold">{monthStats.meetings}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Calendar Area: Grid Mode */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Left: 7-Day Monthly Calendar Grid */}
          <div className="lg:col-span-8 xl:col-span-8 p-3 sm:p-5 overflow-x-auto">
            {/* Weekday Header */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 min-w-[560px]">
              {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((dayName, idx) => {
                const isWeekend = idx >= 5;
                return (
                  <div
                    key={dayName}
                    className={`py-1.5 text-center text-xs font-bold uppercase tracking-wider ${
                      isWeekend ? 'text-rose-500 bg-rose-50/50 rounded-lg' : 'text-slate-500'
                    }`}
                  >
                    {dayName}
                  </div>
                );
              })}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 min-w-[560px]">
              {calendarDays.map((cell, idx) => {
                const isSelected = cell.dateStr === selectedDate;
                const isWeekend = idx % 7 >= 5;
                const hasEvents = cell.events.length > 0;

                return (
                  <div
                    key={cell.dateStr + idx}
                    onClick={() => setSelectedDate(cell.dateStr)}
                    className={`min-h-[96px] sm:min-h-[105px] p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-500/30 bg-indigo-50/20 shadow-xs'
                        : cell.isToday
                        ? 'border-indigo-300 bg-indigo-50/10'
                        : cell.isCurrentMonth
                        ? isWeekend
                          ? 'border-slate-200/70 bg-slate-50/40 hover:bg-slate-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50/70'
                        : 'border-slate-100 bg-slate-50/30 text-slate-300'
                    }`}
                  >
                    {/* Top Row: Date Number and Badges */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-mono font-bold ${
                          cell.isToday
                            ? 'w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px]'
                            : cell.isCurrentMonth
                            ? isWeekend
                              ? 'text-rose-600'
                              : 'text-slate-800'
                            : 'text-slate-300'
                        }`}
                      >
                        {cell.dayNum}
                      </span>

                      {/* Event Count Dot */}
                      {hasEvents && (
                        <div className="flex items-center gap-0.5">
                          {cell.events.some(e => e.type === 'departure') && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" title="Ada Keberangkatan" />
                          )}
                          {cell.events.some(e => e.type === 'return') && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Ada Kepulangan" />
                          )}
                          {cell.events.some(e => e.type === 'rapat') && (
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" title="Ada Rapat" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Events Mini Pills inside Day Cell */}
                    <div className="mt-1 space-y-1 overflow-hidden flex-1">
                      {cell.events.slice(0, 2).map((ev) => {
                        if (ev.type === 'departure') {
                          return (
                            <div
                              key={ev.id}
                              className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100/90 text-indigo-900 border border-indigo-200/80 truncate flex items-center gap-1 shadow-2xs"
                              title={`${ev.title} - ${ev.officerName}`}
                            >
                              <span className="shrink-0">🛫</span>
                              <span className="truncate">{ev.destination}</span>
                            </div>
                          );
                        }

                        if (ev.type === 'return') {
                          return (
                            <div
                              key={ev.id}
                              className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100/90 text-amber-900 border border-amber-200/80 truncate flex items-center gap-1 shadow-2xs"
                              title={`${ev.title} - ${ev.officerName}`}
                            >
                              <span className="shrink-0">🛬</span>
                              <span className="truncate">{ev.destination}</span>
                            </div>
                          );
                        }

                        if (ev.type === 'ongoing') {
                          return (
                            <div
                              key={ev.id}
                              className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-100 truncate flex items-center gap-0.5"
                              title={`${ev.title} - ${ev.officerName}`}
                            >
                              <span className="shrink-0">📍</span>
                              <span className="truncate">{ev.destination}</span>
                            </div>
                          );
                        }

                        if (ev.type === 'rapat') {
                          return (
                            <div
                              key={ev.id}
                              className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100/90 text-purple-900 border border-purple-200/80 truncate flex items-center gap-1"
                              title={ev.title}
                            >
                              <span className="shrink-0">👥</span>
                              <span className="truncate">{ev.title.replace('Rapat: ', '')}</span>
                            </div>
                          );
                        }

                        return null;
                      })}

                      {cell.events.length > 2 && (
                        <div className="text-[9px] font-bold text-slate-500 pl-1">
                          +{cell.events.length - 2} agenda lainnya
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Legend */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-indigo-500 inline-block"></span>
                  <strong>Keberangkatan (🛫)</strong>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block"></span>
                  <strong>Kepulangan (🛬)</strong>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span>
                  <span>Di Luar Kantor (📍)</span>
                </span>
                {showRapat && (
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-purple-500 inline-block"></span>
                    <span>Rapat Kedinasan (👥)</span>
                  </span>
                )}
              </div>
              <span className="italic text-[10px]">Klik tanggal mana pun untuk melihat rincian penugasan</span>
            </div>
          </div>

          {/* Right: Selected Date Inspection Drawer */}
          <div className="lg:col-span-4 xl:col-span-4 p-5 sm:p-6 bg-slate-50/50 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Selected Date Header */}
              <div className="border-b border-slate-200 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                    Rincian Agenda Harian
                  </span>
                  {selectedDate === todayStr && (
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Hari Ini
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {formatTanggalIndonesia(selectedDate)}
                </h3>
                <div className="text-xs text-slate-500 font-mono">
                  {selectedDateEvents.length} kegiatan tercatat pada tanggal ini
                </div>
              </div>

              {/* Event Cards for Selected Date */}
              {selectedDateEvents.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-300 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">
                    Tidak ada jadwal perjalanan dinas
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Tidak ada keberangkatan atau kepulangan petugas pada {formatTanggalIndonesia(selectedDate)}.
                  </p>
                  <button
                    onClick={onOpenCreateSPT}
                    className="mt-2 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors inline-flex items-center gap-1"
                  >
                    <span>+ Buat SPT di Tanggal Ini</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {selectedDateEvents.map((ev) => {
                    if (ev.spt) {
                      const spt = ev.spt;
                      const peg = pegawaiMap[spt.pegawaiUtamaId];
                      const isDeparture = ev.type === 'departure';
                      const isReturn = ev.type === 'return';

                      return (
                        <div
                          key={ev.id}
                          className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-indigo-300 transition-all space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                                    isDeparture
                                      ? 'bg-indigo-100 text-indigo-800'
                                      : isReturn
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  <span>{isDeparture ? '🛫 Keberangkatan' : isReturn ? '🛬 Kepulangan' : '📍 Sedang Berlangsung'}</span>
                                </span>
                                <span className="font-mono text-[11px] font-semibold text-slate-600">
                                  {spt.nomorSPT}
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                                {spt.maksudTugas}
                              </h4>
                            </div>
                          </div>

                          <div className="space-y-1 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span>Petugas: <strong className="text-slate-900">{peg?.nama || '-'}</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span>Tujuan: <strong className="text-slate-900">{spt.tempatTujuan}</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span>
                                Jadwal: {formatTanggalIndonesia(spt.tanggalBerangkat)} s/d {formatTanggalIndonesia(spt.tanggalKembali)} ({spt.lamaHari} Hari)
                              </span>
                            </div>
                            {spt.pengikutIds && spt.pengikutIds.length > 0 && (
                              <div className="text-[10px] text-slate-500 pt-0.5">
                                +{spt.pengikutIds.length} Staf Pengikut Delegasi
                              </div>
                            )}
                          </div>

                          {/* Quick Document Actions */}
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                            <button
                              onClick={() => onPreviewSPT(spt)}
                              className="flex-1 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-2xs"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-500" />
                              <span>Cetak SPT</span>
                            </button>
                            <button
                              onClick={() => onCreateSPPDFromSPT(spt)}
                              className="flex-1 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center justify-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>SPPD</span>
                            </button>
                          </div>
                        </div>
                      );
                    }

                    if (ev.rapat) {
                      const r = ev.rapat;
                      const pim = pegawaiMap[r.pimpinanRapatId];
                      return (
                        <div
                          key={ev.id}
                          className="bg-white rounded-xl border border-purple-200 p-4 shadow-2xs space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 flex items-center gap-1">
                              <span>👥 Rapat Kedinasan</span>
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Pukul {r.waktuMulai} - {r.waktuSelesai}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 leading-snug">
                              {r.judulRapat}
                            </h4>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              Tempat: {r.tempat} · Pimpinan: {pim?.nama || '-'}
                            </p>
                          </div>
                          <div className="pt-1 flex items-center justify-between border-t border-purple-50">
                            <span className="text-[10px] text-purple-700 font-medium">
                              {r.daftarHadir?.length || 0} Peserta Presensi
                            </span>
                            <button
                              onClick={() => {
                                if (onPreviewRapat) onPreviewRapat(r);
                                else onNavigateTab('rapat');
                              }}
                              className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1"
                            >
                              <span>Lihat Notulen</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              )}
            </div>

            {/* Quick Link to SPT Tab */}
            <div className="pt-4 mt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => onNavigateTab('spt')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Buka Tabel Lengkap SPT</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onOpenCreateSPT}
                className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                + Buat SPT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alternate Mode: Monthly Timeline / Agenda View */}
      {viewMode === 'agenda' && (
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Linimasa Perjalanan Dinas Bulan {currentMonthName}
              </h3>
              <p className="text-xs text-slate-500">
                Daftar kronologis keberangkatan, kepulangan, dan agenda rapat sepanjang bulan ini.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
              {monthlyAgendaEvents.length} Hari Beragenda
            </span>
          </div>

          {monthlyAgendaEvents.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <p className="text-xs text-slate-500">
                Belum ada jadwal perjalanan dinas atau rapat pada bulan {currentMonthName}.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {monthlyAgendaEvents.map(({ dateStr, events }) => (
                <div key={dateStr} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                  {/* Date Header Strip */}
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800">
                        {formatTanggalIndonesia(dateStr)}
                      </span>
                      {dateStr === todayStr && (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Hari Ini
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {events.length} Peristiwa
                    </span>
                  </div>

                  {/* Events on this date */}
                  <div className="divide-y divide-slate-100">
                    {events.map((ev) => {
                      if (ev.spt) {
                        const spt = ev.spt;
                        const peg = pegawaiMap[spt.pegawaiUtamaId];
                        const isDep = ev.type === 'departure';
                        const isRet = ev.type === 'return';

                        return (
                          <div key={ev.id} className="p-3.5 sm:p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                                    isDep
                                      ? 'bg-indigo-100 text-indigo-800'
                                      : isRet
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {isDep ? '🛫 Keberangkatan' : isRet ? '🛬 Kepulangan' : '📍 Di Lapangan'}
                                </span>
                                <span className="font-mono text-xs font-semibold text-slate-700">
                                  {spt.nomorSPT}
                                </span>
                                <span className="text-slate-300">·</span>
                                <span className="text-xs font-medium text-slate-900">
                                  {peg?.nama}
                                </span>
                              </div>
                              <p className="text-xs text-slate-700 font-medium">
                                {spt.maksudTugas}
                              </p>
                              <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                                <span>Tujuan: <strong className="text-slate-800">{spt.tempatTujuan}</strong></span>
                                <span>·</span>
                                <span>Durasi: {spt.lamaHari} Hari ({formatTanggalIndonesia(spt.tanggalBerangkat)} - {formatTanggalIndonesia(spt.tanggalKembali)})</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => onPreviewSPT(spt)}
                                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Cetak SPT</span>
                              </button>
                              <button
                                onClick={() => onCreateSPPDFromSPT(spt)}
                                className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                              >
                                SPPD
                              </button>
                            </div>
                          </div>
                        );
                      }

                      if (ev.rapat) {
                        const r = ev.rapat;
                        return (
                          <div key={ev.id} className="p-3.5 sm:p-4 hover:bg-purple-50/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 flex items-center gap-1">
                                  👥 Rapat Kedinasan
                                </span>
                                <span className="text-xs font-bold text-slate-900">
                                  {r.judulRapat}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Tempat: {r.tempat} · Pukul {r.waktuMulai} - {r.waktuSelesai}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                if (onPreviewRapat) onPreviewRapat(r);
                                else onNavigateTab('rapat');
                              }}
                              className="px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors self-start sm:self-auto"
                            >
                              Lihat Notulen & Presensi
                            </button>
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
