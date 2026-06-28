import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, Info, AlertCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarEvent } from '../types';

interface CalendarClockWidgetProps {
  events: CalendarEvent[];
  compact?: boolean;
  onDeleteEvent?: (id: string) => void;
}

export default function CalendarClockWidget({ events, compact = false, onDeleteEvent }: CalendarClockWidgetProps) {
  // Real-time Clock State
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calendar State (Defaults to June 2026, the simulated timeline of the app)
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 5, 26)); // June 26, 2026
  const [selectedDay, setSelectedDay] = useState<number | null>(26); // Default select 26 June

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed (5 = June)

  // Navigate Months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDay(null);
  };

  // Indonesian Names for Days and Months
  const indonesianMonths = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  const indonesianDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  // Days in selected Month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  // First day of selected month
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun, 1 = Mon...
  // Adjust so Monday is 0, Sunday is 6
  const firstDayOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  // Generate days arrays
  const blanks = Array(firstDayOffset).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Helper to determine events on a specific day
  const getEventsForDate = (day: number, month: number, year: number): CalendarEvent[] => {
    // Format check or manual mapping for June/July 2026 simulation
    const results: CalendarEvent[] = [];

    // UAS: 30 Juni s.d 4 Juli 2026
    if ((year === 2026 && month === 5 && day === 30) || (year === 2026 && month === 6 && day >= 1 && day <= 4)) {
      const uasEvent = events.find(e => e.id === 'event-1');
      if (uasEvent) results.push(uasEvent);
    }

    // Libur Kenaikan Kelas: 6 s.d 18 Juli 2026
    if (year === 2026 && month === 6 && day >= 6 && day <= 18) {
      const holidayEvent = events.find(e => e.id === 'event-2');
      if (holidayEvent) results.push(holidayEvent);
    }

    // Pembagian Rapor: 5 Juli 2026
    if (year === 2026 && month === 6 && day === 5) {
      const raporEvent = events.find(e => e.id === 'event-3');
      if (raporEvent) results.push(raporEvent);
    }

    // Rapat Koordinasi: 10 Juli 2026
    if (year === 2026 && month === 6 && day === 10) {
      const rapatEvent = events.find(e => e.id === 'event-4');
      if (rapatEvent) results.push(rapatEvent);
    }

    // Check for other dynamic events that match "YYYY-MM-DD"
    const targetDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dynamicEvents = events.filter((e) => {
      if (['event-1', 'event-2', 'event-3', 'event-4'].includes(e.id)) return false;
      return e.date === targetDateStr;
    });
    results.push(...dynamicEvents);

    return results;
  };

  // Format real-time Clock output
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }) + ' WIB';
  };

  const formatFullDateString = (date: Date) => {
    const dayName = indonesianDays[date.getDay()];
    const dayNum = date.getDate();
    const monthName = indonesianMonths[date.getMonth()];
    const yearNum = date.getFullYear();
    return `${dayName}, ${dayNum} ${monthName} ${yearNum}`;
  };

  const formatEventDate = (dateStr: string) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split('-');
      const monthIndex = parseInt(m) - 1;
      return `${parseInt(d)} ${indonesianMonths[monthIndex]} ${y}`;
    }
    return dateStr;
  };

  const selectedDayEvents = selectedDay ? getEventsForDate(selectedDay, currentMonth, currentYear) : [];

  if (compact) {
    // Compact version for placing inline in dashboards
    const todayEvents = getEventsForDate(26, 5, 2026); // Simulating today is June 26, 2026
    return (
      <div className="bg-gradient-to-br from-sky-50 to-blue-100/50 rounded-3xl p-4.5 border border-sky-100 custom-shadow flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-sky-500 text-white p-2 rounded-xl shadow-md shadow-sky-500/20">
              <Clock size={16} className="animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] text-sky-600 font-bold uppercase tracking-wider block">Waktu Sistem</span>
              <span className="font-mono text-xs font-black text-slate-800 leading-none">{formatTime(currentTime)}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-slate-400 block font-semibold">Simulasi Tanggal</span>
            <span className="text-[11px] font-bold text-slate-700">Jumat, 26 Juni 2026</span>
          </div>
        </div>

        {todayEvents.length > 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 border border-sky-100 flex items-start gap-2.5">
            <Calendar size={14} className="text-sky-600 mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <span className="text-[9px] font-extrabold text-sky-600 uppercase tracking-wider">Agenda Hari Ini</span>
              {todayEvents.map(evt => (
                <div key={evt.id}>
                  <h4 className="text-xs font-bold text-slate-800 leading-tight">{evt.title}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">{evt.description.slice(0, 50)}...</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-2.5 border border-sky-100 text-center">
            <p className="text-[10px] text-sky-700/80 font-bold">🎉 Tidak ada agenda akademik mendesak hari ini</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Realtime Clock & Date Display Panel */}
      <div className="bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-3xl p-5 shadow-lg shadow-sky-500/10 relative overflow-hidden flex items-center justify-between">
        {/* Abstract light effects */}
        <div className="absolute top-[-20px] right-[-20px] w-24 h-24 rounded-full bg-white/15 blur-xl"></div>
        <div className="absolute bottom-[-20px] left-[-20px] w-20 h-20 rounded-full bg-white/10 blur-lg"></div>

        <div className="space-y-1 relative z-10">
          <span className="text-[10px] bg-white/20 text-white font-extrabold px-2.5 py-0.5 rounded-full tracking-wider uppercase block w-fit">
            Waktu Realtime
          </span>
          <span className="font-mono text-xl font-black block tracking-tight">{formatTime(currentTime)}</span>
          <span className="text-xs text-sky-100 block font-medium">{formatFullDateString(currentTime)}</span>
        </div>

        <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl relative z-10 text-white border border-white/10">
          <Clock size={24} className="animate-spin-slow" />
        </div>
      </div>

      {/* Main Calendar Month Container */}
      <div className="bg-white rounded-3xl p-4.5 border border-slate-100 custom-shadow space-y-4">
        {/* Month Navigation Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-sky-500" />
            <h4 className="font-display font-extrabold text-sm text-slate-800 uppercase tracking-tight">
              {indonesianMonths[currentMonth]} {currentYear}
            </h4>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-1.5">
          {/* Day Names Row */}
          <div className="grid grid-cols-7 text-center">
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((d) => (
              <span key={d} className="text-[10px] font-black text-slate-400 uppercase tracking-wider py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Blanks */}
            {blanks.map((_, i) => (
              <div key={`blank-${i}`} className="aspect-square"></div>
            ))}

            {/* Day numbers */}
            {days.map((day) => {
              const hasEvents = getEventsForDate(day, currentMonth, currentYear).length > 0;
              const isSelected = selectedDay === day;
              
              // Hardcode "Today" highlight for the simulated date (26 June 2026)
              const isTodaySimulated = currentYear === 2026 && currentMonth === 5 && day === 26;

              return (
                <button
                  key={`day-${day}`}
                  onClick={() => setSelectedDay(day)}
                  className={`aspect-square rounded-xl text-xs font-bold flex flex-col items-center justify-center relative transition-all focus:outline-none ${
                    isSelected
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20 scale-105'
                      : isTodaySimulated
                      ? 'bg-sky-100 text-sky-700 ring-2 ring-sky-300'
                      : hasEvents
                      ? 'bg-blue-50/80 text-blue-600 hover:bg-blue-100'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{day}</span>
                  {hasEvents && !isSelected && (
                    <span className="w-1 h-1 bg-sky-500 rounded-full absolute bottom-1.5"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Day Agenda Detail */}
      <AnimatePresence mode="wait">
        {selectedDay && (
          <motion.div
            key={`detail-${selectedDay}-${currentMonth}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between px-1">
              <h5 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                Agenda {selectedDay} {indonesianMonths[currentMonth]}
              </h5>
              {selectedDayEvents.length > 0 && (
                <span className="text-[10px] bg-sky-50 text-sky-600 font-bold px-2 py-0.5 rounded-full">
                  {selectedDayEvents.length} Kegiatan
                </span>
              )}
            </div>

            {selectedDayEvents.length > 0 ? (
              <div className="space-y-2.5">
                {selectedDayEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="bg-gradient-to-r from-sky-50 to-white p-4 rounded-2xl border border-sky-100 custom-shadow flex items-start gap-3 relative"
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      evt.type === 'academic' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                      evt.type === 'holiday' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                      'bg-sky-50 text-sky-600 border border-sky-100'
                    }`}>
                      <Calendar size={16} />
                    </div>
                    <div className="space-y-1 flex-1 pr-6">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-sky-600">
                        {evt.type === 'academic' ? 'Akademik' : evt.type === 'holiday' ? 'Libur Sekolah' : 'Acara Sekolah'}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 leading-snug">{evt.title}</h4>
                      <span className="text-[10px] font-semibold text-brand-green block">{formatEventDate(evt.date)}</span>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-1">{evt.description}</p>
                    </div>
                    {onDeleteEvent && (
                      <button
                        onClick={() => onDeleteEvent(evt.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all absolute right-3 top-3 focus:outline-none"
                        title="Hapus Agenda"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
                <p className="text-xs text-slate-400 font-medium">Tidak ada kegiatan sekolah terjadwal pada hari ini.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
