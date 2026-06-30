import React, { useState } from 'react';
import { Student, LiaisonEntry, LiaisonMessage, User as AuthUser } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  MessageSquare,
  Plus,
  Send,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  X,
  Filter,
  BookMarked,
  Tag,
  Trash2
} from 'lucide-react';

interface LiaisonNotebookProps {
  currentUser: AuthUser;
  students: Student[];
  selectedStudentId?: string; // used by parents
  entries: LiaisonEntry[];
  onAddEntry: (newEntry: Omit<LiaisonEntry, 'id' | 'lastUpdated'>) => void;
  onAddReply: (entryId: string, messageText: string) => void;
  onUpdateStatus?: (entryId: string, status: LiaisonEntry['status']) => void;
  onDeleteEntry?: (entryId: string) => void;
  activeClassName?: string;
}

export default function LiaisonNotebook({
  currentUser,
  students,
  selectedStudentId,
  entries,
  onAddEntry,
  onAddReply,
  onUpdateStatus,
  onDeleteEntry,
  activeClassName
}: LiaisonNotebookProps) {
  const isTeacher = currentUser.role === 'teacher';

  // State for filtering and active entry
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>(
    isTeacher ? 'all' : selectedStudentId || ''
  );
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [showNewEntryModal, setShowNewEntryModal] = useState(false);

  // New Entry Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [subjects, setSubjects] = useState<string[]>(() => {
    const saved = localStorage.getItem('educonnect_teacher_subjects');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return ['Matematika', 'IPA', 'IPS', 'Bahasa Indonesia', 'Seni Budaya', 'Pancasila & PKn'];
  });
  const [newSubject, setNewSubject] = useState('Matematika');
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [showManageSubjects, setShowManageSubjects] = useState(false);

  const handleAddSubject = (subjectName: string) => {
    const trimmed = subjectName.trim();
    if (!trimmed) return;
    if (subjects.includes(trimmed)) {
      setNewSubject(trimmed);
      return;
    }
    const updated = [...subjects, trimmed];
    setSubjects(updated);
    localStorage.setItem('educonnect_teacher_subjects', JSON.stringify(updated));
    setNewSubject(trimmed);
    setNewSubjectInput('');
  };

  const handleRemoveSubject = (subjectName: string) => {
    const updated = subjects.filter(s => s !== subjectName);
    setSubjects(updated);
    localStorage.setItem('educonnect_teacher_subjects', JSON.stringify(updated));
    if (newSubject === subjectName) {
      setNewSubject(updated[0] || '');
    }
  };

  const [newStudentId, setNewStudentId] = useState('');
  const [newStatus, setNewStatus] = useState<LiaisonEntry['status']>('Perlu Perhatian');
  const [newInitialMessage, setNewInitialMessage] = useState('');

  // Chat Reply State
  const [replyText, setReplyText] = useState('');

  // Sync selectedStudentFilter when selectedStudentId changes for parent
  React.useEffect(() => {
    if (!isTeacher && selectedStudentId) {
      setSelectedStudentFilter(selectedStudentId);
    }
  }, [selectedStudentId, isTeacher]);

  // Filter students to only include students in the teacher's class or parents' kids
  const classStudents = isTeacher
    ? students.filter((s) => s.class === (activeClassName || currentUser.className))
    : students.filter((s) => s.id === selectedStudentId);

  // Set default student for new entry
  React.useEffect(() => {
    if (classStudents.length > 0 && !newStudentId) {
      setNewStudentId(classStudents[0].id);
    }
  }, [classStudents, newStudentId]);

  // Filter and sort Liaison entries (newest/latest updated first)
  const filteredEntries = entries
    .filter((entry) => {
      // If parent, only show entries for currently selected kid
      if (!isTeacher) {
        return entry.studentId === selectedStudentId;
      }
      // If teacher, optionally filter by student
      if (selectedStudentFilter !== 'all') {
        return entry.studentId === selectedStudentFilter;
      }
      // Only show entries in teacher's class
      if (activeClassName) {
        return entry.className === activeClassName;
      }
      const teacherClasses = currentUser.className ? currentUser.className.split(',').map(c => c.trim()) : ['TK-A'];
      return teacherClasses.includes(entry.className);
    })
    .sort((a, b) => {
      const getScore = (entry: LiaisonEntry) => {
        const monthsMap: Record<string, string> = {
          'jan': 'Jan', 'feb': 'Feb', 'mar': 'Mar', 'apr': 'Apr', 'mei': 'May', 'jun': 'Jun',
          'jul': 'Jul', 'agt': 'Aug', 'agu': 'Aug', 'sep': 'Sep', 'okt': 'Oct', 'nov': 'Nov', 'des': 'Dec',
          'januari': 'January', 'februari': 'February', 'maret': 'March', 'april': 'April',
          'juni': 'June', 'juli': 'July', 'agustus': 'August',
          'september': 'September', 'oktober': 'October', 'november': 'November', 'desember': 'December'
        };

        if (entry.lastUpdated) {
          const cleanStr = entry.lastUpdated.trim().toLowerCase();
          
          // Check if it's already a standard parseable format
          const parsed = Date.parse(cleanStr);
          if (!isNaN(parsed)) return parsed;

          const parts = cleanStr.split(/\s+/);
          if (parts.length >= 3) {
            const day = parseInt(parts[0], 10);
            const monthName = parts[1];
            const year = parseInt(parts[2], 10);
            
            const englishMonth = monthsMap[monthName] || monthName;
            const dateObj = new Date(`${englishMonth} ${day}, ${year}`);
            if (!isNaN(dateObj.getTime())) {
              return dateObj.getTime();
            }
          }
        }

        // Fallback: parse numeric suffix from ID
        if (entry.id && entry.id.startsWith('liaison-')) {
          const suffix = entry.id.replace('liaison-', '');
          const num = parseInt(suffix, 10);
          if (!isNaN(num)) {
            // For older small IDs like '1', '2', we return them, but they'll be small
            return num;
          }
        }
        return 0;
      };

      const scoreA = getScore(a);
      const scoreB = getScore(b);
      return scoreB - scoreA;
    });

  const activeEntry = entries.find((e) => e.id === activeEntryId);

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !newInitialMessage) return;

    const targetStudent = students.find((s) => s.id === (isTeacher ? newStudentId : selectedStudentId));
    if (!targetStudent) return;

    const initialMsg: LiaisonMessage = {
      id: `msg-${Date.now()}`,
      senderRole: currentUser.role as 'teacher' | 'parent',
      senderName: currentUser.fullName,
      message: newInitialMessage,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    onAddEntry({
      studentId: targetStudent.id,
      studentName: targetStudent.name,
      className: targetStudent.class,
      taskTitle: newTaskTitle,
      subject: newSubject,
      status: newStatus,
      messages: [initialMsg]
    });

    // Reset Form
    setNewTaskTitle('');
    setNewInitialMessage('');
    setShowNewEntryModal(false);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeEntryId) return;

    onAddReply(activeEntryId, replyText.trim());
    setReplyText('');
  };

  const getStatusStyle = (status: LiaisonEntry['status']) => {
    switch (status) {
      case 'Selesai':
        return 'bg-emerald-50 text-brand-green border-emerald-100';
      case 'Sudah Dikerjakan':
        return 'bg-blue-50 text-brand-blue border-blue-100';
      case 'Butuh Bimbingan':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Perlu Perhatian':
        return 'bg-rose-50 text-rose-600 border-rose-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getStatusIcon = (status: LiaisonEntry['status']) => {
    switch (status) {
      case 'Selesai':
        return <CheckCircle2 size={12} className="shrink-0" />;
      case 'Sudah Dikerjakan':
        return <CheckCircle2 size={12} className="shrink-0 text-brand-blue" />;
      case 'Butuh Bimbingan':
        return <Clock size={12} className="shrink-0" />;
      case 'Perlu Perhatian':
        return <AlertCircle size={12} className="shrink-0" />;
    }
  };

  return (
    <div className="space-y-6 pb-12" id="liaison-notebook-container">
      {/* Banner / Header */}
      <div className="bg-gradient-to-r from-sky-500 to-brand-blue rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
          <BookOpen size={180} />
        </div>
        <div className="relative z-10 space-y-2">
          <span className="bg-white/20 text-white text-[10px] font-bold py-1 px-3 rounded-full uppercase tracking-wider">
            Buku Penghubung Tugas
          </span>
          <h2 className="font-display font-black text-2xl tracking-tight">Buku Penghubung</h2>
          <p className="text-xs text-sky-100 leading-relaxed max-w-md">
            Pantau dan komunikasikan tugas-tugas harian siswa antara Wali Kelas dengan Wali Murid secara real-time.
          </p>
        </div>
      </div>

      {/* Action Buttons & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Student Filter (Teacher Only) */}
        {isTeacher ? (
          <div className="flex items-center gap-2 bg-white border border-slate-100 px-3 py-1.5 rounded-2xl shadow-sm">
            <Filter size={14} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-500">Siswa:</span>
            <select
              value={selectedStudentFilter}
              onChange={(e) => setSelectedStudentFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              id="student-liaison-filter"
            >
              <option value="all">Semua Siswa</option>
              {classStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="bg-sky-50 text-sky-700 font-bold text-xs px-3.5 py-1.5 rounded-full border border-sky-100">
              Siswa Terpantau: {students.find((s) => s.id === selectedStudentId)?.name || 'Siswa'}
            </div>
          </div>
        )}

        {/* Add Entry Button */}
        {isTeacher && (
          <button
            onClick={() => setShowNewEntryModal(true)}
            className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold py-3 px-4 rounded-2xl shadow-sm transition-colors flex items-center justify-center gap-2"
            id="add-liaison-entry-btn"
          >
            <Plus size={16} />
            <span>Tambah Catatan Tugas</span>
          </button>
        )}
      </div>

      {/* Main Liaison Entries List */}
      <div className="space-y-3">
        {filteredEntries.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center space-y-3">
            <div className="bg-slate-50 text-slate-400 p-4 rounded-full w-fit mx-auto">
              <BookMarked size={32} />
            </div>
            <h4 className="font-display font-bold text-sm text-slate-700">Belum Ada Catatan Tugas</h4>
            <p className="text-xs text-slate-400 leading-normal max-w-sm mx-auto">
              {isTeacher
                ? 'Belum ada koordinasi mengenai tugas untuk siswa yang dipilih. Silakan mulai dengan membuat catatan tugas baru.'
                : 'Belum ada catatan tugas dari Wali Kelas yang memerlukan koordinasi khusus saat ini.'}
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const lastMsg = entry.messages[entry.messages.length - 1];
            return (
              <div
                key={entry.id}
                onClick={() => setActiveEntryId(entry.id)}
                className="bg-white hover:bg-slate-50/50 border border-slate-100 hover:border-slate-200 p-5 rounded-3xl shadow-sm hover:shadow transition-all cursor-pointer flex flex-col justify-between relative group"
                id={`liaison-card-${entry.id}`}
              >
                <div className="space-y-3">
                  {/* Subject and Status row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold py-1 px-2.5 rounded-lg flex items-center gap-1">
                        <Tag size={10} />
                        {entry.subject}
                      </span>
                      <span
                        className={`text-[10px] font-bold py-1 px-2.5 rounded-lg border flex items-center gap-1.5 ${getStatusStyle(
                          entry.status
                        )}`}
                      >
                        {getStatusIcon(entry.status)}
                        {entry.status}
                      </span>
                    </div>
                    {isTeacher && onDeleteEntry && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Apakah Anda yakin ingin menghapus catatan buku penghubung ini?')) {
                            onDeleteEntry(entry.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Catatan"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Task details */}
                  <div className="space-y-1">
                    {isTeacher && (
                      <span className="text-[10px] text-slate-400 font-bold block">
                        Siswa: {entry.studentName} ({entry.className})
                      </span>
                    )}
                    <h3 className="font-display font-extrabold text-sm text-slate-900 group-hover:text-sky-600 transition-colors">
                      {entry.taskTitle}
                    </h3>
                  </div>

                  {/* Last message preview */}
                  {lastMsg && (
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/50 text-xs text-slate-600 flex items-start gap-2.5">
                      <div className="bg-white border border-slate-100 p-1.5 rounded-xl shrink-0 mt-0.5 text-slate-400">
                        <User size={12} />
                      </div>
                      <div className="space-y-1">
                        <span className="font-bold text-slate-700 text-[10px]">
                          {lastMsg.senderName} ({lastMsg.senderRole === 'teacher' ? 'Guru' : 'Orang Tua'}):
                        </span>
                        <p className="line-clamp-2 leading-relaxed text-slate-500 italic">
                          "{lastMsg.message}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer updated timestamp */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold pt-3 mt-3 border-t border-slate-100/70">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    Pembaruan: {entry.lastUpdated}
                  </span>
                  <span className="text-sky-500 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    Buka Diskusi ({entry.messages.length}) <ChevronRight size={12} />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Liaison Message Thread / Chat Dialog Sheet */}
      <AnimatePresence>
        {activeEntry && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-blue/60 backdrop-blur-sm p-0">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-[#F8FAFC] w-full max-w-lg rounded-t-[2.5rem] flex flex-col h-[90vh] overflow-hidden shadow-2xl relative"
            >
              {/* Thread Header */}
              <div className="bg-white px-6 py-5 border-b border-slate-100 shrink-0 relative flex items-center justify-between">
                <div className="space-y-1 pr-8">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <BookOpen size={10} /> Buku Penghubung • {activeEntry.subject}
                  </span>
                  <h3 className="font-display font-extrabold text-sm text-slate-900 leading-snug">
                    {activeEntry.taskTitle}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold">
                    Siswa: <span className="text-sky-600">{activeEntry.studentName}</span> • {activeEntry.className}
                  </p>
                </div>
                <div className="absolute top-5 right-5 flex items-center gap-1.5">
                  {isTeacher && onDeleteEntry && (
                    <button
                      onClick={() => {
                        if (window.confirm('Apakah Anda yakin ingin menghapus catatan buku penghubung ini?')) {
                          onDeleteEntry(activeEntry.id);
                          setActiveEntryId(null);
                        }
                      }}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-full transition-all"
                      title="Hapus Catatan"
                      id="delete-liaison-thread-btn"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => setActiveEntryId(null)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-all"
                    id="close-liaison-thread-btn"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Status Update Control for Teacher */}
              {isTeacher && onUpdateStatus && (
                <div className="bg-amber-50/50 border-b border-amber-100/50 px-6 py-3 shrink-0 flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-amber-800 flex items-center gap-1">
                    <AlertCircle size={14} /> Atur Status Tugas:
                  </span>
                  <div className="flex gap-1">
                    {(['Perlu Perhatian', 'Butuh Bimbingan', 'Sudah Dikerjakan', 'Selesai'] as LiaisonEntry['status'][]).map(
                      (statusOption) => (
                        <button
                          key={statusOption}
                          type="button"
                          onClick={() => onUpdateStatus(activeEntry.id, statusOption)}
                          className={`text-[9px] font-bold py-1 px-2 rounded-lg border transition-all ${
                            activeEntry.status === statusOption
                              ? 'bg-sky-600 text-white border-sky-600'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {statusOption}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Chat Thread Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {activeEntry.messages.map((msg) => {
                  const isMyMessage = msg.senderRole === currentUser.role;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="max-w-[85%] space-y-1">
                        {/* Sender info */}
                        <div
                          className={`flex items-center gap-1 text-[10px] text-slate-400 font-bold ${
                            isMyMessage ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <span>{msg.senderName}</span>
                          <span className="opacity-60">• {msg.senderRole === 'teacher' ? 'Guru' : 'Orang Tua'}</span>
                        </div>

                        {/* Bubble */}
                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-normal shadow-sm ${
                            isMyMessage
                              ? 'bg-sky-600 text-white rounded-tr-none'
                              : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap font-medium">{msg.message}</p>
                        </div>

                        {/* Time */}
                        <span
                          className={`block text-[9px] text-slate-400 ${
                            isMyMessage ? 'text-right' : 'text-left'
                          }`}
                        >
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Footer Reply Input / Approve & Sign button */}
              {!isTeacher ? (
                <div className="bg-white p-4 border-t border-slate-100 shrink-0 flex flex-col gap-2">
                  {activeEntry.messages.some(
                    (msg) =>
                      msg.senderRole === 'parent' &&
                      msg.message.includes('menandatangani')
                  ) ? (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-2xl text-center font-bold text-xs flex items-center justify-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <span>Tugas ini sudah Disetujui & Ditandatangani oleh Wali Murid</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onAddReply(
                          activeEntry.id,
                          'Saya telah membaca, menyetujui, dan menandatangani buku penghubung untuk tugas ini.'
                        );
                        if (onUpdateStatus) {
                          onUpdateStatus(activeEntry.id, 'Selesai');
                        }
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-xs py-3.5 rounded-2xl custom-shadow transition-all flex items-center justify-center gap-2"
                      id="parent-approve-sign-btn"
                    >
                      <CheckCircle2 size={16} />
                      <span>Setujui & Tanda Tangani Tugas</span>
                    </button>
                  )}
                </div>
              ) : (
                <form
                  onSubmit={handleSendReply}
                  className="bg-white p-4 border-t border-slate-100 shrink-0 flex items-center gap-2"
                >
                  <input
                    type="text"
                    required
                    placeholder="Ketik pesan balasan..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-sky-500 font-semibold"
                  />
                  <button
                    type="submit"
                    className="bg-sky-600 hover:bg-sky-700 text-white p-3 rounded-2xl shadow transition-colors shrink-0"
                    id="send-liaison-reply-btn"
                  >
                    <Send size={16} />
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create New Liaison Entry Modal Sheet */}
      <AnimatePresence>
        {showNewEntryModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-blue/60 backdrop-blur-sm p-0">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white w-full max-w-lg rounded-t-[2.5rem] p-6 max-h-[85vh] overflow-y-auto space-y-5 shadow-2xl relative"
            >
              <button
                onClick={() => setShowNewEntryModal(false)}
                className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-all"
                id="close-new-liaison-modal-btn"
              >
                <X size={18} />
              </button>

              <div>
                <h3 className="font-display font-extrabold text-lg text-slate-950">📝 Tambah Catatan Tugas</h3>
                <p className="text-xs text-slate-400">Hubungkan orang tua dan wali kelas untuk memantau tugas tertentu.</p>
              </div>

              <form onSubmit={handleCreateEntry} className="space-y-4">
                {isTeacher && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500">Pilih Siswa</label>
                    <select
                      value={newStudentId}
                      onChange={(e) => setNewStudentId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-sky-500"
                    >
                      {classStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.class})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Subject Selector */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-slate-500">Mata Pelajaran</label>
                    <button
                      type="button"
                      onClick={() => setShowManageSubjects(!showManageSubjects)}
                      className="text-[10px] text-sky-600 hover:underline font-extrabold focus:outline-none"
                    >
                      {showManageSubjects ? 'Selesai Kelola' : 'Kelola / Tambah Mapel'}
                    </button>
                  </div>

                  {showManageSubjects ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-3">
                      {/* Add Subject Inline Input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Tulis nama mapel baru..."
                          value={newSubjectInput}
                          onChange={(e) => setNewSubjectInput(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-sky-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddSubject(newSubjectInput)}
                          className="bg-sky-500 hover:bg-sky-600 text-white px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 shrink-0"
                        >
                          <Plus size={12} /> Tambah
                        </button>
                      </div>

                      {/* Current Subjects List to delete from */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">List Mapel Aktif (Klik x untuk hapus)</span>
                        <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto p-1 bg-white rounded-xl border border-slate-100">
                          {subjects.map((sub) => (
                            <span
                              key={sub}
                              className="inline-flex items-center gap-1 bg-slate-50 border border-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-sm"
                            >
                              {sub}
                              <button
                                type="button"
                                onClick={() => handleRemoveSubject(sub)}
                                className="text-red-500 hover:bg-red-50 p-0.5 rounded transition-colors"
                                title={`Hapus mapel ${sub}`}
                              >
                                <X size={10} />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5 max-h-[140px] overflow-y-auto p-0.5">
                      {subjects.map((subj) => (
                        <button
                          key={subj}
                          type="button"
                          onClick={() => setNewSubject(subj)}
                          className={`text-[10px] font-bold py-2 px-1.5 rounded-xl text-center border transition-all ${
                            newSubject === subj
                              ? 'bg-sky-500 text-white border-sky-500'
                              : 'bg-slate-50 text-slate-500 border-slate-200/50 hover:bg-slate-100'
                          }`}
                        >
                          {subj}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Task Title */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500">Nama / Judul Tugas</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PR Perkalian Pecahan halaman 30"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Status Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500">Status Awal</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Perlu Perhatian', 'Butuh Bimbingan', 'Sudah Dikerjakan', 'Selesai'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setNewStatus(st as LiaisonEntry['status'])}
                        className={`text-[10px] font-bold py-2.5 px-2 rounded-xl text-center border transition-all ${
                          newStatus === st
                            ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                            : 'bg-slate-50 text-slate-600 border-slate-200/50 hover:bg-slate-100'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Initial message / question */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500">Pesan Koordinasi Awal</label>
                  <textarea
                    required
                    rows={4}
                    placeholder={
                      isTeacher
                        ? "Tulis catatan khusus untuk orang tua murid mengenai perkembangan tugas ini..."
                        : "Tanyakan kendala tugas anak Anda atau infokan perkembangan pengerjaan tugas kepada Guru..."
                    }
                    value={newInitialMessage}
                    onChange={(e) => setNewInitialMessage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-sky-500 leading-normal resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-display font-bold text-xs py-3.5 rounded-xl custom-shadow transition-colors"
                  id="submit-liaison-entry-btn"
                >
                  Buat Buku Penghubung Tugas
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
