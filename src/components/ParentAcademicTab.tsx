import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  TrendingUp, 
  Calendar, 
  ChevronRight, 
  Printer, 
  Download, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  GraduationCap, 
  FileText,
  ChevronLeft,
  BookOpen
} from 'lucide-react';
import { Student, CalendarEvent, Grade } from '../types';

interface ParentAcademicTabProps {
  student: Student;
  calendarEvents: CalendarEvent[];
  teacherName?: string;
}

export function ParentAcademicTab({ student, calendarEvents, teacherName }: ParentAcademicTabProps) {
  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
        <div>
          <h3 className="font-display font-black text-slate-800 text-sm">Memuat Data Akademik...</h3>
          <p className="text-xs text-slate-400 mt-1">Mengambil rincian nilai dan rapor digital.</p>
        </div>
      </div>
    );
  }

  const [activeFilter, setActiveFilter] = useState<'Semua' | 'Tugas' | 'UTS' | 'UAS'>('Semua');
  const [showReportCardModal, setShowReportCardModal] = useState(false);

  // Safe grades check with fallback if none exist
  const grades = student.grades || [];
  
  // Calculate stats
  const averageScore = grades.length > 0 
    ? Math.round(grades.reduce((sum, g) => sum + g.score, 0) / grades.length) 
    : 0;

  const totalEvaluations = grades.length;
  
  // Determine general predicate
  let predicate = '-';
  let predicateColor = 'text-slate-400 bg-slate-50';
  if (averageScore >= 90) {
    predicate = 'A (Sangat Baik)';
    predicateColor = 'text-emerald-700 bg-emerald-50 border-emerald-100';
  } else if (averageScore >= 80) {
    predicate = 'B (Baik)';
    predicateColor = 'text-blue-700 bg-blue-50 border-blue-100';
  } else if (averageScore >= 70) {
    predicate = 'C (Cukup)';
    predicateColor = 'text-amber-700 bg-amber-50 border-amber-100';
  } else if (averageScore > 0) {
    predicate = 'D (Perlu Bimbingan)';
    predicateColor = 'text-red-700 bg-red-50 border-red-100';
  }

  // Filter grades
  const filteredGrades = grades.filter(g => 
    activeFilter === 'Semua' ? true : g.type === activeFilter
  );

  // Filter academic calendar events
  const academicEvents = calendarEvents.filter(e => e.type === 'academic');

  // Helper for grade feedback
  const getGradeFeedback = (score: number) => {
    if (score >= 90) return { label: 'Istimewa', color: 'bg-emerald-500 text-white' };
    if (score >= 80) return { label: 'Tuntas', color: 'bg-blue-500 text-white' };
    if (score >= 70) return { label: 'Cukup', color: 'bg-amber-500 text-white' };
    return { label: 'Remedial', color: 'bg-red-500 text-white' };
  };

  return (
    <div className="space-y-6 pb-24 text-left">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="text-left">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">TK MUTIARA BANGSA</span>
          <h2 className="font-display font-black text-xl text-slate-950">Laporan Akademik</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Pantau hasil belajar dan perkembangan {student.name}</p>
        </div>
        <div className="bg-brand-blue/10 text-brand-blue p-2.5 rounded-2xl">
          <GraduationCap size={24} />
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* GPA / Average Card */}
        <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 bg-brand-blue/5 rounded-full"></div>
          <div className="flex items-center gap-2 text-brand-blue">
            <Award size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Rata-Rata Nilai</span>
          </div>
          <div className="mt-3">
            <span className="font-display font-black text-3xl text-slate-950">{averageScore > 0 ? averageScore : '-'}</span>
            <span className="text-xs text-slate-400 font-bold"> / 100</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-1.5 font-semibold">Semua mata pelajaran semester ini</p>
        </div>

        {/* Predicate Card */}
        <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 bg-brand-accent/5 rounded-full"></div>
          <div className="flex items-center gap-2 text-brand-accent">
            <TrendingUp size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Predikat Akhir</span>
          </div>
          <div className="mt-3">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${predicateColor}`}>
              {predicate}
            </span>
          </div>
          <p className="text-[9px] text-slate-400 mt-2.5 font-semibold">Capaian kompetensi dasar</p>
        </div>
      </div>

      {/* Visual Chart Section (Custom SVG Chart) */}
      {grades.length > 0 && (
        <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm space-y-3">
          <h3 className="font-display font-bold text-xs text-slate-800 uppercase tracking-wider">Grafik Capaian Nilai</h3>
          
          <div className="h-44 flex items-end justify-between gap-2 pt-4 px-2 relative border-b border-slate-100">
            {/* Grid Line lines */}
            <div className="absolute inset-x-0 top-1/4 border-t border-dashed border-slate-100 flex justify-between pointer-events-none">
              <span className="text-[8px] font-mono text-slate-300 -mt-2">75 (KKM)</span>
            </div>
            <div className="absolute inset-x-0 top-2/4 border-t border-dashed border-slate-50 pointer-events-none"></div>

            {grades.map((g, idx) => {
              const barHeight = `${g.score}%`;
              const isPassing = g.score >= 75;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] font-bold rounded px-1.5 py-0.5 absolute mb-16 shadow-lg z-10 pointer-events-none">
                    {g.score} ({g.type})
                  </div>
                  
                  {/* Bar */}
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: barHeight }}
                    transition={{ delay: idx * 0.05, duration: 0.5, ease: 'easeOut' }}
                    className={`w-full rounded-t-lg relative ${
                      isPassing ? 'bg-gradient-to-t from-brand-blue to-sky-400' : 'bg-gradient-to-t from-red-500 to-rose-400'
                    }`}
                  >
                    <span className="absolute top-1 inset-x-0 text-[9px] text-white font-black text-center">
                      {g.score}
                    </span>
                  </motion.div>
                  
                  {/* Label */}
                  <span className="text-[9px] font-bold text-slate-500 truncate w-full text-center mt-2" title={g.subject}>
                    {g.subject.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-4 text-[9px] font-semibold text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-brand-blue rounded-full"></span> Sesuai KKM (&ge;75)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span> Perlu Perbaikan (&lt;75)
            </span>
          </div>
        </div>
      )}

      {/* Button to view digital report card */}
      <button
        onClick={() => setShowReportCardModal(true)}
        className="w-full bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold py-3 px-4 rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-md"
      >
        <FileText size={16} />
        Lihat Laporan Hasil Belajar (Rapor Digital)
      </button>

      {/* Detailed Grades Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-extrabold text-xs text-slate-800 uppercase tracking-wider">Daftar Nilai Siswa</h3>
          
          {/* Grade filter */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl text-[10px] font-bold">
            {(['Semua', 'Tugas', 'UTS', 'UAS'] as const).map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeFilter === f 
                    ? 'bg-white text-slate-950 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filteredGrades.length === 0 ? (
          <div className="bg-white border border-slate-100 p-8 rounded-3xl text-center space-y-2">
            <div className="bg-slate-100 text-slate-400 p-3 rounded-full w-fit mx-auto">
              <AlertCircle size={20} />
            </div>
            <p className="text-xs text-slate-500 font-semibold">Tidak ada data nilai untuk filter "{activeFilter}"</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredGrades.map((g, idx) => {
              const fb = getGradeFeedback(g.score);
              return (
                <div key={idx} className="bg-white border border-slate-100 p-3.5 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        g.type === 'Tugas' ? 'bg-amber-100 text-amber-800' :
                        g.type === 'UTS' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {g.type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold font-mono">{g.date}</span>
                    </div>
                    <h4 className="font-display font-extrabold text-xs text-slate-800">{g.subject}</h4>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-display font-black text-sm text-slate-950">{g.score}</div>
                      <div className="text-[8px] font-bold text-slate-400">skor / {g.maxScore}</div>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${fb.color}`}>
                      {fb.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Academic Calendar Widget */}
      <div className="space-y-3">
        <h3 className="font-display font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Calendar size={14} className="text-brand-blue" />
          Agenda & Kalender Akademik
        </h3>

        {academicEvents.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Tidak ada agenda akademik dalam waktu dekat.</p>
        ) : (
          <div className="space-y-2.5">
            {academicEvents.map((e, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-100/50 p-3.5 rounded-2xl space-y-1">
                <span className="text-[9px] bg-brand-blue/10 text-brand-blue font-bold px-2 py-0.5 rounded-md">
                  AKADEMIK
                </span>
                <h4 className="font-display font-bold text-xs text-slate-800">{e.title}</h4>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold pt-1">
                  <span>📅 {e.date}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-snug">{e.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Digital Report Card Modal (Rapor Digital) */}
      <AnimatePresence>
        {showReportCardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 space-y-6 relative max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowReportCardModal(false)}
                className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-all"
              >
                <ChevronLeft size={16} />
              </button>

              {/* Report Header */}
              <div className="text-center border-b-2 border-double border-slate-200 pb-4 space-y-1.5 text-slate-950">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">RAPOR DIGITAL SISWA</span>
                <h3 className="font-display font-black text-lg">TK MUTIARA BANGSA</h3>
                <p className="text-[9px] text-slate-400 font-mono">Jl. Boulevard Mutiara No. 10 • Terakreditasi A</p>
              </div>

              {/* Student Meta */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[9px]">Nama Siswa</span>
                  <span className="text-slate-800 font-bold">{student.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">Nomor Induk Siswa (NIS)</span>
                  <span className="text-slate-800 font-mono font-bold">{student.nis || `2026${student.id.toUpperCase()}`}</span>
                </div>
                <div className="mt-1">
                  <span className="text-slate-400 block text-[9px]">Tingkat Kelas</span>
                  <span className="text-slate-800 font-bold">{student.class}</span>
                </div>
                <div className="mt-1">
                  <span className="text-slate-400 block text-[9px]">Tahun Pelajaran / Semester</span>
                  <span className="text-slate-800 font-bold">2025/2026 - Genap</span>
                </div>
              </div>

              {/* Subject Scores Table */}
              <div className="space-y-2">
                <h4 className="font-display font-bold text-xs text-slate-800 uppercase tracking-wider">Capaian Kompetensi Mata Pelajaran</h4>
                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-bold">
                        <th className="p-2.5">Mata Pelajaran</th>
                        <th className="p-2.5 text-center">Nilai</th>
                        <th className="p-2.5 text-center">KKM</th>
                        <th className="p-2.5 text-right">Hasil</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {grades.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-400 font-medium">Belum ada nilai yang diinput.</td>
                        </tr>
                      ) : (
                        grades.map((g, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 font-medium text-slate-800">
                            <td className="p-2.5 font-bold">{g.subject}</td>
                            <td className="p-2.5 text-center font-mono font-bold text-slate-950">{g.score}</td>
                            <td className="p-2.5 text-center text-slate-400 font-mono">75</td>
                            <td className="p-2.5 text-right">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                g.score >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                              }`}>
                                {g.score >= 90 ? 'Sangat Baik' : g.score >= 75 ? 'Baik' : 'Butuh Bimbingan'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Attendance & Notes Block */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-slate-100 p-3 rounded-2xl space-y-1.5">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase">Ketidakhadiran</span>
                  <div className="text-[10px] font-semibold text-slate-700 space-y-1">
                    <div className="flex justify-between"><span>Sakit (S):</span> <span className="font-bold">1 Hari</span></div>
                    <div className="flex justify-between"><span>Izin (I):</span> <span className="font-bold">2 Hari</span></div>
                    <div className="flex justify-between"><span>Tanpa Keterangan (A):</span> <span className="font-bold">0 Hari</span></div>
                  </div>
                </div>

                <div className="border border-slate-100 p-3 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase block">Keputusan</span>
                    <span className="text-[11px] font-bold text-slate-800 mt-1 block">Naik ke Jenjang Berikutnya</span>
                  </div>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full w-fit">STATUS: LOLOS</span>
                </div>
              </div>

              {/* Teacher Remarks */}
              <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl space-y-1">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase">Catatan Wali Kelas</span>
                <p className="text-[10px] text-slate-700 leading-relaxed font-semibold italic">
                  "{student.name} menunjukkan perkembangan emosional dan sosial yang sangat matang di sekolah. Keaktifannya dalam interaksi kelas dan tugas kelompok sangat mengagumkan. Terus bimbing di rumah untuk mempertahankan semangat belajarnya!"
                </p>
              </div>

              {/* Footer Signature */}
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold pt-2 border-t border-slate-100">
                <div className="text-center">
                  <span className="block text-[8px] text-slate-400">Mengetahui,</span>
                  <span className="block font-bold text-slate-700 mt-6">Ibu Maria</span>
                  <span className="block text-[8px] text-slate-400">Orang Tua/Wali</span>
                </div>
                <div className="text-center">
                  <span className="block text-[8px] text-slate-400">Jakarta, 27 Juni 2026</span>
                  <span className="block font-bold text-slate-700 mt-6">{teacherName || 'Wali Kelas'}</span>
                  <span className="block text-[8px] text-slate-400">Wali Kelas</span>
                </div>
              </div>

              {/* Download / Print Actions */}
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Printer size={14} /> Cetak Rapor
                </button>
                <button
                  onClick={() => alert('File PDF Rapor Hasil Belajar berhasil diunduh ke perangkat Anda.')}
                  className="flex-1 bg-brand-blue hover:bg-brand-blue-light text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Download size={14} /> Unduh PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
