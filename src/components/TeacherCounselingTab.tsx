import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  Filter, 
  Search, 
  Smile, 
  Brain, 
  Heart, 
  ShieldAlert, 
  BookOpen, 
  CheckCircle2, 
  X, 
  Check, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { Student, CounselingRecord } from '../types';

interface TeacherCounselingTabProps {
  students: Student[];
  counselingRecords: CounselingRecord[];
  onAddRecord: (record: CounselingRecord) => void;
  onUpdateRecord: (recordId: string, updates: Partial<CounselingRecord>) => void;
  onDeleteRecord: (recordId: string) => void;
  className?: string;
  teacherName?: string;
}

export function TeacherCounselingTab({
  students,
  counselingRecords,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  className = 'TK-A',
  teacherName = 'Pak Budi'
}: TeacherCounselingTabProps) {
  // Class students
  const classStudents = students.filter(s => s.class === className);

  // States
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [category, setCategory] = useState<CounselingRecord['category']>('Sosial Emosional');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [status, setStatus] = useState<'Draft' | 'Terpublikasi'>('Terpublikasi');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CounselingRecord | null>(null);

  const [filterStudentId, setFilterStudentId] = useState<string>('Semua');
  const [filterCategory, setFilterCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter counseling records belonging to class students
  const studentIdsInClass = classStudents.map(s => s.id);
  const classRecords = counselingRecords.filter(r => studentIdsInClass.includes(r.studentId));

  // Applied filtering
  const filteredRecords = classRecords.filter(r => {
    const matchStudent = filterStudentId === 'Semua' ? true : r.studentId === filterStudentId;
    const matchCategory = filterCategory === 'Semua' ? true : r.category === filterCategory;
    const matchSearch = searchQuery.trim() === '' ? true : (
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.notes.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchStudent && matchCategory && matchSearch;
  });

  // Category styles
  const categoryStyles: Record<string, { bg: string; text: string; icon: React.ReactNode; border: string }> = {
    'Perkembangan Fisik': { 
      bg: 'bg-emerald-50', 
      text: 'text-emerald-700', 
      border: 'border-emerald-100',
      icon: <Heart size={14} className="text-emerald-500" /> 
    },
    'Perkembangan Kognitif': { 
      bg: 'bg-indigo-50', 
      text: 'text-indigo-700', 
      border: 'border-indigo-100',
      icon: <Brain size={14} className="text-indigo-500" /> 
    },
    'Sosial Emosional': { 
      bg: 'bg-rose-50', 
      text: 'text-rose-700', 
      border: 'border-rose-100',
      icon: <Smile size={14} className="text-rose-500" /> 
    },
    'Konseling Perilaku': { 
      bg: 'bg-amber-50', 
      text: 'text-amber-700', 
      border: 'border-amber-100',
      icon: <ShieldAlert size={14} className="text-amber-500" /> 
    },
    'Lainnya': { 
      bg: 'bg-slate-50', 
      text: 'text-slate-700', 
      border: 'border-slate-100',
      icon: <BookOpen size={14} className="text-slate-500" /> 
    }
  };

  const getStyle = (cat: string) => {
    return categoryStyles[cat] || categoryStyles['Lainnya'];
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const targetStudent = classStudents.find(s => s.id === selectedStudentId);
    if (!targetStudent) return;

    const newRecord: CounselingRecord = {
      id: `couns-${Date.now()}`,
      studentId: selectedStudentId,
      studentName: targetStudent.name,
      className,
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      category,
      title,
      notes,
      recommendation,
      teacherName,
      status
    };

    onAddRecord(newRecord);
    
    // Reset forms
    setSelectedStudentId('');
    setTitle('');
    setNotes('');
    setRecommendation('');
    setCategory('Sosial Emosional');
    setStatus('Terpublikasi');
    setShowAddModal(false);
  };

  const handleEditInit = (record: CounselingRecord) => {
    setEditingRecord(record);
    setSelectedStudentId(record.studentId);
    setCategory(record.category);
    setTitle(record.title);
    setNotes(record.notes);
    setRecommendation(record.recommendation);
    setStatus(record.status);
    setShowAddModal(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    const targetStudent = classStudents.find(s => s.id === selectedStudentId);
    if (!targetStudent) return;

    onUpdateRecord(editingRecord.id, {
      studentId: selectedStudentId,
      studentName: targetStudent.name,
      category,
      title,
      notes,
      recommendation,
      status
    });

    // Reset forms
    setEditingRecord(null);
    setSelectedStudentId('');
    setTitle('');
    setNotes('');
    setRecommendation('');
    setCategory('Sosial Emosional');
    setStatus('Terpublikasi');
    setShowAddModal(false);
  };

  const handleToggleStatus = (record: CounselingRecord) => {
    const newStatus = record.status === 'Draft' ? 'Terpublikasi' : 'Draft';
    onUpdateRecord(record.id, { status: newStatus });
  };

  return (
    <div className="space-y-6 pb-24 text-left">
      {/* Header Block */}
      <div className="flex items-center justify-between">
        <div className="text-left">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">TK MUTIARA BANGSA</span>
          <h2 className="font-display font-black text-xl text-slate-950">Catatan Perkembangan Anak</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Rekam bimbingan & laporan perkembangan karakter murid {className}</p>
        </div>
        <button
          onClick={() => {
            setEditingRecord(null);
            setSelectedStudentId(classStudents[0]?.id || '');
            setTitle('');
            setNotes('');
            setRecommendation('');
            setCategory('Sosial Emosional');
            setStatus('Terpublikasi');
            setShowAddModal(true);
          }}
          className="bg-brand-blue hover:bg-brand-blue-light text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition-all shadow-sm shrink-0"
        >
          <Plus size={16} /> Buat Catatan
        </button>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm space-y-3.5">
        <div className="flex items-center gap-2 text-slate-400">
          <Filter size={14} className="text-brand-blue" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Filter Pencarian</span>
        </div>

        {/* Text search */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari judul, nama murid, atau catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-brand-blue"
          />
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase block">Murid</label>
            <select
              value={filterStudentId}
              onChange={(e) => setFilterStudentId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-[11px] font-bold text-slate-700 focus:outline-none"
            >
              <option value="Semua">Semua Murid</option>
              {classStudents.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase block">Kategori</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-[11px] font-bold text-slate-700 focus:outline-none"
            >
              <option value="Semua">Semua Kategori</option>
              <option value="Perkembangan Fisik">Perkembangan Fisik</option>
              <option value="Perkembangan Kognitif">Perkembangan Kognitif</option>
              <option value="Sosial Emosional">Sosial Emosional</option>
              <option value="Konseling Perilaku">Konseling Perilaku</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
        </div>
      </div>

      {/* Counseling list */}
      <div className="space-y-3">
        <h3 className="font-display font-extrabold text-xs text-slate-800 uppercase tracking-wider">Buku Observasi & Konseling ({filteredRecords.length})</h3>

        {filteredRecords.length === 0 ? (
          <div className="bg-white border border-slate-100 p-12 rounded-3xl text-center space-y-2">
            <div className="bg-slate-50 text-slate-400 p-3 rounded-full w-fit mx-auto">
              <AlertCircle size={20} />
            </div>
            <p className="text-xs text-slate-500 font-semibold">Tidak ada catatan perkembangan yang sesuai.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredRecords.map((r) => {
              const style = getStyle(r.category);
              return (
                <div key={r.id} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm space-y-3 text-left relative overflow-hidden">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider border ${style.bg} ${style.text} ${style.border}`}>
                          {r.category}
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold font-mono">{r.date}</span>
                      </div>
                      <h4 className="font-display font-extrabold text-sm text-slate-900 leading-snug">{r.title}</h4>
                      <p className="text-[10px] text-brand-blue font-bold">Anak Didik: {r.studentName}</p>
                    </div>

                    {/* Status badge and actions */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <button
                        onClick={() => handleToggleStatus(r)}
                        className={`text-[8px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border transition-all ${
                          r.status === 'Terpublikasi'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}
                        title={r.status === 'Terpublikasi' ? 'Draftkan (Sembunyikan dari Orang Tua)' : 'Publikasikan ke Orang Tua'}
                      >
                        {r.status === 'Terpublikasi' ? <Eye size={10} /> : <EyeOff size={10} />}
                        {r.status.toUpperCase()}
                      </button>
                    </div>
                  </div>

                  {/* Body Notes */}
                  <div className="bg-slate-50 p-3.5 rounded-xl space-y-1 border border-slate-100">
                    <span className="text-[8px] text-slate-400 font-extrabold uppercase">Catatan Perkembangan:</span>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{r.notes}</p>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-rose-50/30 p-3.5 rounded-xl space-y-1 border border-rose-100/30">
                    <span className="text-[8px] text-rose-400 font-extrabold uppercase">Rekomendasi di Rumah:</span>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{r.recommendation}</p>
                  </div>

                  {/* CRUD Button bar */}
                  <div className="flex justify-end gap-1.5 pt-1.5 border-t border-slate-100/50">
                    <button
                      onClick={() => handleEditInit(r)}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 transition-all"
                    >
                      <Edit3 size={12} /> Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Apakah Anda yakin ingin menghapus catatan perkembangan ini?`)) {
                          onDeleteRecord(r.id);
                        }
                      }}
                      className="text-[10px] bg-red-50 hover:bg-red-100 text-red-500 font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 transition-all"
                    >
                      <Trash2 size={12} /> Hapus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Record Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 relative max-h-[90vh] overflow-y-auto text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-display font-black text-base text-slate-900">
                  {editingRecord ? '✍️ Edit Catatan Perkembangan' : '✨ Catat Perkembangan Baru'}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={editingRecord ? handleUpdate : handleCreate} className="space-y-4">
                {/* Select student */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Pilih Murid</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-brand-blue"
                    required
                  >
                    {classStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Category & Status Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Kategori</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-brand-blue"
                      required
                    >
                      <option value="Perkembangan Fisik">Perkembangan Fisik</option>
                      <option value="Perkembangan Kognitif">Perkembangan Kognitif</option>
                      <option value="Sosial Emosional">Sosial Emosional</option>
                      <option value="Konseling Perilaku">Konseling Perilaku</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Publikasi</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-brand-blue"
                      required
                    >
                      <option value="Terpublikasi">Publikasi Langsung</option>
                      <option value="Draft">Draft (Simpan Internal)</option>
                    </select>
                  </div>
                </div>

                {/* Record Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Judul Catatan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Penguasaan Motorik Halus atau Sikap Peduli Teman"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-semibold placeholder:text-slate-300 focus:outline-none focus:border-brand-blue"
                    required
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Hasil Observasi / Catatan</label>
                  <textarea
                    rows={3}
                    placeholder="Tuliskan kejadian spesifik, kemajuan perkembangan, atau bimbingan yang dilakukan..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-semibold placeholder:text-slate-300 focus:outline-none focus:border-brand-blue resize-none"
                    required
                  />
                </div>

                {/* Recommendations */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Saran / Rekomendasi di Rumah</label>
                  <textarea
                    rows={2}
                    placeholder="Saran aktivitas atau bentuk bimbingan orang tua di rumah..."
                    value={recommendation}
                    onChange={(e) => setRecommendation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-semibold placeholder:text-slate-300 focus:outline-none focus:border-brand-blue resize-none"
                    required
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-brand-blue hover:bg-brand-blue-light text-white text-xs font-bold py-3 rounded-xl transition-all shadow-sm"
                  >
                    {editingRecord ? 'Simpan Perubahan' : 'Simpan Catatan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
