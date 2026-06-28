import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Smile, 
  Brain, 
  Calendar, 
  User, 
  Sparkles, 
  ChevronRight, 
  BookOpen, 
  Award, 
  ShieldAlert, 
  AlertCircle 
} from 'lucide-react';
import { Student, CounselingRecord } from '../types';

interface ParentCounselingTabProps {
  student: Student;
  counselingRecords: CounselingRecord[];
}

export function ParentCounselingTab({ student, counselingRecords }: ParentCounselingTabProps) {
  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
        <div>
          <h3 className="font-display font-black text-slate-800 text-sm">Memuat Data Perkembangan...</h3>
          <p className="text-xs text-slate-400 mt-1">Mengambil rincian catatan bimbingan konseling.</p>
        </div>
      </div>
    );
  }

  const [selectedRecord, setSelectedRecord] = useState<CounselingRecord | null>(null);

  // Filter records that belong to this student and are Published (Terpublikasi)
  const studentRecords = counselingRecords.filter(
    r => r.studentId === student.id && r.status === 'Terpublikasi'
  );

  // Category visual themes mapping
  const categoryStyles: Record<string, { bg: string; text: string; icon: React.ReactNode; border: string }> = {
    'Perkembangan Fisik': { 
      bg: 'bg-emerald-50', 
      text: 'text-emerald-700', 
      border: 'border-emerald-100',
      icon: <Heart size={16} className="text-emerald-500" /> 
    },
    'Perkembangan Kognitif': { 
      bg: 'bg-indigo-50', 
      text: 'text-indigo-700', 
      border: 'border-indigo-100',
      icon: <Brain size={16} className="text-indigo-500" /> 
    },
    'Sosial Emosional': { 
      bg: 'bg-rose-50', 
      text: 'text-rose-700', 
      border: 'border-rose-100',
      icon: <Smile size={16} className="text-rose-500" /> 
    },
    'Konseling Perilaku': { 
      bg: 'bg-amber-50', 
      text: 'text-amber-700', 
      border: 'border-amber-100',
      icon: <ShieldAlert size={16} className="text-amber-500" /> 
    },
    'Lainnya': { 
      bg: 'bg-slate-50', 
      text: 'text-slate-700', 
      border: 'border-slate-100',
      icon: <BookOpen size={16} className="text-slate-500" /> 
    }
  };

  const getStyle = (category: string) => {
    return categoryStyles[category] || categoryStyles['Lainnya'];
  };

  return (
    <div className="space-y-6 pb-24 text-left">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="text-left">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">TK MUTIARA BANGSA</span>
          <h2 className="font-display font-black text-xl text-slate-950">Perkembangan & Konseling</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Laporan observasi guru dan catatan bimbingan {student.name}</p>
        </div>
        <div className="bg-rose-50 text-rose-500 p-2.5 rounded-2xl">
          <Smile size={24} />
        </div>
      </div>

      {/* Intro Tip */}
      <div className="bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-100/30 p-4 rounded-3xl flex items-start gap-3 shadow-sm">
        <div className="text-rose-500 mt-0.5 shrink-0">
          <Sparkles size={16} />
        </div>
        <div className="space-y-0.5">
          <h4 className="font-display font-bold text-xs text-slate-800">Catatan Perkembangan Anak</h4>
          <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
            Wali kelas secara rutin mengamati aspek motorik, kognitif, emosional, dan perilaku anak selama masa belajar di TK Mutiara Bangsa.
          </p>
        </div>
      </div>

      {/* Counseling Records List */}
      <div className="space-y-3">
        <h3 className="font-display font-extrabold text-xs text-slate-800 uppercase tracking-wider">Daftar Catatan Observasi</h3>

        {studentRecords.length === 0 ? (
          <div className="bg-white border border-slate-100 p-8 rounded-3xl text-center space-y-2">
            <div className="bg-slate-50 text-slate-400 p-3 rounded-full w-fit mx-auto">
              <AlertCircle size={20} />
            </div>
            <p className="text-xs text-slate-500 font-semibold">Belum ada catatan perkembangan terpublikasi.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {studentRecords.map((r) => {
              const style = getStyle(r.category);
              return (
                <motion.div
                  key={r.id}
                  onClick={() => setSelectedRecord(r)}
                  className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs hover:shadow-sm transition-all cursor-pointer flex items-start justify-between gap-3 text-left group"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border ${style.bg} ${style.text} ${style.border}`}>
                        {r.category}
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold font-mono">📅 {r.date}</span>
                    </div>

                    <h4 className="font-display font-extrabold text-sm text-slate-800 truncate group-hover:text-brand-blue transition-colors">
                      {r.title}
                    </h4>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {r.notes}
                    </p>

                    <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold">
                      <User size={10} />
                      <span>Oleh Wali Kelas: {r.teacherName}</span>
                    </div>
                  </div>

                  <div className="text-slate-300 group-hover:text-slate-500 transition-colors self-center">
                    <ChevronRight size={18} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-5 relative max-h-[90vh] overflow-y-auto text-left"
            >
              {/* Header */}
              <div className="space-y-1.5 pr-8">
                <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border ${getStyle(selectedRecord.category).bg} ${getStyle(selectedRecord.category).text} ${getStyle(selectedRecord.category).border}`}>
                  {selectedRecord.category}
                </span>
                <h3 className="font-display font-black text-base text-slate-900 leading-snug">
                  {selectedRecord.title}
                </h3>
                <div className="flex items-center gap-3 text-[10px] text-slate-400 font-semibold pt-1">
                  <span>📅 Tanggal: {selectedRecord.date}</span>
                  <span>✍️ Guru: {selectedRecord.teacherName}</span>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={() => setSelectedRecord(null)}
                className="absolute top-5 right-5 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"
              >
                <ChevronRight size={16} className="rotate-180" />
              </button>

              {/* Observations section */}
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Hasil Observasi Perkembangan</span>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                    {selectedRecord.notes}
                  </p>
                </div>
              </div>

              {/* Recommendation section */}
              <div className="space-y-1.5">
                <span className="text-[9px] text-rose-400 font-extrabold uppercase tracking-wider block flex items-center gap-1">
                  <Award size={10} />
                  Saran & Rekomendasi di Rumah
                </span>
                <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100/50">
                  <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                    {selectedRecord.recommendation}
                  </p>
                </div>
              </div>

              {/* Interactive confirmation button */}
              <button
                onClick={() => {
                  alert('Terima kasih. Konfirmasi bahwa Anda telah membaca catatan perkembangan ini berhasil dikirim ke wali kelas.');
                  setSelectedRecord(null);
                }}
                className="w-full bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-md mt-4"
              >
                Tandai Sudah Dibaca & Mengerti
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
