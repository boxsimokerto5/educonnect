import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  Users, 
  BookOpen, 
  TrendingUp, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  FileSpreadsheet, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle,
  X 
} from 'lucide-react';
import { Student, Grade } from '../types';

interface TeacherAcademicTabProps {
  students: Student[];
  onAddGrade: (studentId: string, grade: Grade) => void;
  onDeleteGrade?: (studentId: string, gradeIndex: number) => void;
  className?: string;
}

export function TeacherAcademicTab({ 
  students, 
  onAddGrade, 
  onDeleteGrade, 
  className = 'TK-A' 
}: TeacherAcademicTabProps) {
  // Filter students who are in this class
  const classStudents = students.filter(s => s.class === className);

  // States
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [showQuickAddForm, setShowQuickAddForm] = useState<string | null>(null); // holds studentId

  // Grade Form state
  const [subjects, setSubjects] = useState<string[]>(() => {
    const saved = localStorage.getItem('educonnect_teacher_subjects');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return ['Matematika', 'IPA', 'IPS', 'Bahasa Indonesia', 'Seni Budaya', 'Pancasila & PKn'];
  });
  const [subject, setSubject] = useState('Matematika');
  const [gradeType, setGradeType] = useState<'Tugas' | 'UTS' | 'UAS'>('Tugas');
  const [score, setScore] = useState<number>(85);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Custom Subject management inline
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [showManageSubjects, setShowManageSubjects] = useState(false);

  const handleAddSubject = (subjectName: string) => {
    const trimmed = subjectName.trim();
    if (!trimmed) return;
    if (subjects.includes(trimmed)) {
      setSubject(trimmed);
      return;
    }
    const updated = [...subjects, trimmed];
    setSubjects(updated);
    localStorage.setItem('educonnect_teacher_subjects', JSON.stringify(updated));
    setSubject(trimmed);
    setNewSubjectInput('');
  };

  const handleRemoveSubject = (subjectName: string) => {
    const updated = subjects.filter(s => s !== subjectName);
    setSubjects(updated);
    localStorage.setItem('educonnect_teacher_subjects', JSON.stringify(updated));
    if (subject === subjectName) {
      setSubject(updated[0] || '');
    }
  };

  // Stats calculation
  const totalStudents = classStudents.length;
  
  // Calculate class average
  let totalScoresSum = 0;
  let totalEvaluationsCount = 0;
  let passingStudentsCount = 0;

  classStudents.forEach(std => {
    const stdGrades = std.grades || [];
    if (stdGrades.length > 0) {
      const stdAvg = stdGrades.reduce((sum, g) => sum + g.score, 0) / stdGrades.length;
      totalScoresSum += stdAvg;
      totalEvaluationsCount++;
      if (stdAvg >= 75) {
        passingStudentsCount++;
      }
    }
  });

  const classAverage = totalEvaluationsCount > 0 
    ? Math.round(totalScoresSum / totalEvaluationsCount) 
    : 0;

  const passingRate = totalEvaluationsCount > 0
    ? Math.round((passingStudentsCount / totalEvaluationsCount) * 100)
    : 0;

  const toggleExpandStudent = (id: string) => {
    if (expandedStudentId === id) {
      setExpandedStudentId(null);
      setShowQuickAddForm(null);
    } else {
      setExpandedStudentId(id);
      setShowQuickAddForm(null);
    }
  };

  const handleInlineSubmit = (e: React.FormEvent, studentId: string) => {
    e.preventDefault();
    if (!studentId) return;

    const newGrade: Grade = {
      subject,
      score: Number(score),
      maxScore: 100,
      type: gradeType,
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    onAddGrade(studentId, newGrade);
    setSuccessMsg('Nilai berhasil diinput!');
    
    // Reset form
    setScore(85);
    
    setTimeout(() => {
      setSuccessMsg(null);
      setShowQuickAddForm(null);
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-24 text-left">
      {/* Header Block */}
      <div className="flex items-center justify-between">
        <div className="text-left">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">TK MUTIARA BANGSA</span>
          <h2 className="font-display font-black text-xl text-slate-950">Kelola Akademik & Nilai</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Input, tinjau, dan rekap capaian belajar murid {className}</p>
        </div>
        <div className="bg-brand-accent/20 text-brand-accent p-2.5 rounded-2xl">
          <Award size={24} />
        </div>
      </div>

      {/* Class Metrics Dashboard */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white border border-slate-100 p-3 rounded-2xl text-center flex flex-col justify-between shadow-sm">
          <div className="text-slate-400 mx-auto bg-slate-50 p-1.5 rounded-lg w-fit">
            <BookOpen size={14} className="text-brand-blue" />
          </div>
          <div className="mt-1.5">
            <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Rata-Rata</span>
            <span className="font-display font-black text-base text-slate-950">{classAverage > 0 ? classAverage : '-'}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-3 rounded-2xl text-center flex flex-col justify-between shadow-sm">
          <div className="text-slate-400 mx-auto bg-slate-50 p-1.5 rounded-lg w-fit">
            <TrendingUp size={14} className="text-emerald-500" />
          </div>
          <div className="mt-1.5">
            <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Ketuntasan</span>
            <span className="font-display font-black text-base text-emerald-600">{passingRate > 0 ? `${passingRate}%` : '-'}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-3 rounded-2xl text-center flex flex-col justify-between shadow-sm">
          <div className="text-slate-400 mx-auto bg-slate-50 p-1.5 rounded-lg w-fit">
            <Users size={14} className="text-brand-accent" />
          </div>
          <div className="mt-1.5">
            <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Total Siswa</span>
            <span className="font-display font-black text-base text-slate-950">{totalStudents}</span>
          </div>
        </div>
      </div>

      {/* List of Students with Grades */}
      <div className="space-y-3">
        <h3 className="font-display font-extrabold text-xs text-slate-800 uppercase tracking-wider">Buku Nilai Siswa</h3>
        
        {classStudents.length === 0 ? (
          <div className="bg-white border border-slate-100 p-8 rounded-3xl text-center">
            <p className="text-xs text-slate-400 font-semibold">Tidak ada murid terdaftar di kelas ini.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {classStudents.map((std) => {
              const stdGrades = std.grades || [];
              const stdAvg = stdGrades.length > 0 
                ? Math.round(stdGrades.reduce((sum, g) => sum + g.score, 0) / stdGrades.length) 
                : 0;
              const isExpanded = expandedStudentId === std.id;

              return (
                <div key={std.id} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden transition-all">
                  {/* Collapsible Header */}
                  <div 
                    onClick={() => toggleExpandStudent(std.id)}
                    className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={std.avatar} 
                        alt={std.name} 
                        className="w-9 h-9 rounded-full object-cover border border-slate-100" 
                      />
                      <div className="text-left">
                        <h4 className="font-display font-extrabold text-xs text-slate-800 uppercase">{std.name}</h4>
                        <p className="text-[9px] text-slate-400 font-bold">{stdGrades.length} evaluasi selesai</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-[8px] font-extrabold text-slate-400 block uppercase">AVERAGE</span>
                        <span className={`font-display font-black text-xs ${
                          stdAvg >= 75 ? 'text-brand-blue' : stdAvg > 0 ? 'text-red-500' : 'text-slate-400'
                        }`}>
                          {stdAvg > 0 ? stdAvg : '-'}
                        </span>
                      </div>
                      <div className="text-slate-400">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-100/60 bg-slate-50/50 p-4 space-y-4"
                      >
                        {/* Control buttons inside expand */}
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-slate-400 font-extrabold uppercase">Rincian Nilai</span>
                          {showQuickAddForm !== std.id ? (
                            <button
                              onClick={() => {
                                setShowQuickAddForm(std.id);
                                setSuccessMsg(null);
                              }}
                              className="text-[10px] bg-brand-blue hover:bg-brand-blue-light text-white font-bold py-1 px-2.5 rounded-lg flex items-center gap-1 transition-all shadow-sm"
                            >
                              <Plus size={12} /> Input Nilai Baru
                            </button>
                          ) : (
                            <button
                              onClick={() => setShowQuickAddForm(null)}
                              className="text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold py-1 px-2.5 rounded-lg transition-colors"
                            >
                              Batal
                            </button>
                          )}
                        </div>

                        {/* Inline Grade Form */}
                        {showQuickAddForm === std.id && (
                          <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white border border-slate-100 p-3.5 rounded-2xl shadow-sm space-y-3"
                          >
                            <h5 className="font-display font-bold text-[10px] text-slate-800 uppercase tracking-wide">
                              Form Input Nilai: {std.name.toUpperCase()}
                            </h5>
                            
                            {successMsg ? (
                              <div className="bg-emerald-50 border border-emerald-100 text-brand-green-dark p-2 rounded-xl text-center text-[10px] font-bold">
                                {successMsg}
                              </div>
                            ) : (
                               <form onSubmit={(e) => handleInlineSubmit(e, std.id)} className="space-y-3">
                                <div className="space-y-2 border-b border-slate-50 pb-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-slate-500">Mata Pelajaran Tambahan?</span>
                                    <button
                                      type="button"
                                      onClick={() => setShowManageSubjects(!showManageSubjects)}
                                      className="text-[9px] text-brand-blue hover:underline font-extrabold focus:outline-none"
                                    >
                                      {showManageSubjects ? 'Selesai Kelola' : 'Kelola / Tambah Mapel'}
                                    </button>
                                  </div>

                                  {showManageSubjects && (
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 space-y-2">
                                      {/* Add Subject Inline Input */}
                                      <div className="flex gap-2">
                                        <input
                                          type="text"
                                          placeholder="Tulis mapel..."
                                          value={newSubjectInput}
                                          onChange={(e) => setNewSubjectInput(e.target.value)}
                                          className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-semibold focus:outline-none focus:border-brand-blue"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleAddSubject(newSubjectInput)}
                                          className="bg-brand-blue hover:bg-brand-blue-light text-white px-2 py-1 rounded-lg text-[9px] font-bold flex items-center gap-0.5 shrink-0"
                                        >
                                          <Plus size={10} /> Tambah
                                        </button>
                                      </div>

                                      {/* Current Subjects List to delete from */}
                                      <div className="space-y-1">
                                        <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider block">List Mapel Aktif</span>
                                        <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto p-1 bg-white rounded-lg border border-slate-100">
                                          {subjects.map((sub) => (
                                            <span
                                              key={sub}
                                              className="inline-flex items-center gap-1 bg-slate-50 border border-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[8px] font-bold shadow-sm"
                                            >
                                              {sub}
                                              <button
                                                type="button"
                                                onClick={() => handleRemoveSubject(sub)}
                                                className="text-red-500 hover:bg-red-50 p-0.5 rounded transition-colors"
                                                title={`Hapus mapel ${sub}`}
                                              >
                                                <X size={8} />
                                              </button>
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 block">Mata Pelajaran</label>
                                    <select 
                                      value={subject}
                                      onChange={(e) => setSubject(e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-[10px] font-semibold focus:outline-none focus:border-brand-blue"
                                    >
                                      {subjects.map((sub) => (
                                        <option key={sub} value={sub}>{sub}</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 block">Evaluasi</label>
                                    <select 
                                      value={gradeType}
                                      onChange={(e) => setGradeType(e.target.value as any)}
                                      className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-[10px] font-semibold focus:outline-none"
                                    >
                                      <option value="Tugas">Tugas Harian</option>
                                      <option value="UTS">UTS</option>
                                      <option value="UAS">UAS</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 items-end">
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 block">Nilai (0-100)</label>
                                    <input 
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={score}
                                      onChange={(e) => setScore(Number(e.target.value))}
                                      className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-[10px] font-bold focus:outline-none"
                                      required
                                    />
                                  </div>

                                  <button
                                    type="submit"
                                    className="bg-brand-accent hover:bg-brand-accent-hover text-white text-[10px] font-bold py-2.5 rounded-lg shadow-sm transition-colors"
                                  >
                                    Simpan Nilai
                                  </button>
                                </div>
                              </form>
                            )}
                          </motion.div>
                        )}

                        {/* List of existing student grades */}
                        {stdGrades.length === 0 ? (
                          <p className="text-[10px] text-slate-400 font-semibold text-center py-2">Belum ada nilai yang dimasukkan.</p>
                        ) : (
                          <div className="space-y-2">
                            {stdGrades.map((g, idx) => (
                              <div key={idx} className="bg-white border border-slate-100/70 p-2.5 rounded-xl flex items-center justify-between shadow-xs">
                                <div className="text-left space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-[7px] font-black px-1 py-0.2 rounded uppercase tracking-wider ${
                                      g.type === 'Tugas' ? 'bg-amber-100 text-amber-800' :
                                      g.type === 'UTS' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                                    }`}>
                                      {g.type}
                                    </span>
                                    <span className="text-[8px] text-slate-400 font-mono font-bold">{g.date}</span>
                                  </div>
                                  <h5 className="font-display font-extrabold text-[10px] text-slate-800">{g.subject}</h5>
                                </div>

                                <div className="flex items-center gap-2.5">
                                  <div className="text-right">
                                    <span className="font-display font-black text-[11px] text-slate-950 block">{g.score}</span>
                                    <span className="text-[7px] font-bold text-slate-400 uppercase">skor</span>
                                  </div>

                                  {onDeleteGrade && (
                                    <button
                                      onClick={() => {
                                        if (confirm(`Apakah Anda yakin ingin menghapus nilai ${g.subject} (${g.type}) milik ${std.name}?`)) {
                                          onDeleteGrade(std.id, idx);
                                        }
                                      }}
                                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                                      title="Hapus Nilai"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
