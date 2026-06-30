import React, { useState, useEffect } from 'react';
import { Student, EPermit, Grade, CalendarEvent, Announcement, Schedule, AppNotification, User as AuthUser } from '../types';
import { collection, onSnapshot, query, where, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import CalendarClockWidget from './CalendarClockWidget';
import NotificationActivator from './NotificationActivator';
import NotificationInbox from './NotificationInbox';
import {
  Bell,
  CheckCircle,
  FileSpreadsheet,
  PlusCircle,
  UserCheck,
  Award,
  ChevronRight,
  X,
  Plus,
  TrendingUp,
  AwardIcon,
  Trash2,
  CalendarDays,
  Megaphone,
  UserPlus,
  Users,
  AlertTriangle,
  Smile,
  Wallet,
  Sparkles,
  Clock,
  MapPin,
  BookOpen,
  Crown
} from 'lucide-react';

interface TeacherDashboardProps {
  students: Student[];
  permits: EPermit[];
  onGoToApproval: () => void;
  onGoToKonseling?: () => void;
  onGoToFinances?: (tab?: 'approval' | 'create' | 'status' | 'savings') => void;
  onUpdateAttendance: (studentId: string, status: Student['attendanceToday'], time?: string) => void;
  onAddGrade: (studentId: string, grade: Grade) => void;
  teacherName?: string;
  className?: string;
  calendarEvents?: CalendarEvent[];
  announcements?: Announcement[];
  onAddAnnouncement?: (announcement: Omit<Announcement, 'id' | 'date'>) => void;
  onAddStudent?: (studentData: {
    name: string;
    class: string;
    parentName: string;
    username: string;
    password: string;
    nis?: string;
    address?: string;
    phone?: string;
  }) => void;
  onDeleteStudent?: (studentId: string) => void;
  onAddCalendarEvent?: (event: Omit<CalendarEvent, 'id'>) => void;
  onDeleteCalendarEvent?: (id: string) => void;
  schoolLogoUrl?: string;
  schoolName?: string;
  onReplayOnboarding?: () => void;
  isPremium?: boolean;
  notifications?: AppNotification[];
  currentUser?: AuthUser | null;
  onMarkNotificationAsRead?: (id: string) => void;
  onMarkAllNotificationsAsRead?: () => void;
  onDeleteNotification?: (id: string) => void;
  onNavigateToNotification?: (type: string, relatedId?: string) => void;
}

export default function TeacherDashboard({
  students,
  permits,
  onGoToApproval,
  onGoToKonseling,
  onGoToFinances,
  onUpdateAttendance,
  onAddGrade,
  teacherName = 'Pak Budi',
  className = 'TK-A',
  calendarEvents = [],
  announcements = [],
  onAddAnnouncement,
  onAddStudent,
  onDeleteStudent,
  onAddCalendarEvent,
  onDeleteCalendarEvent,
  schoolLogoUrl,
  schoolName,
  onReplayOnboarding = () => {},
  isPremium,
  notifications = [],
  currentUser = null,
  onMarkNotificationAsRead = () => {},
  onMarkAllNotificationsAsRead = () => {},
  onDeleteNotification = () => {},
  onNavigateToNotification = () => {}
}: TeacherDashboardProps) {
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showStudentListModal, setShowStudentListModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDay, setSelectedDay] = useState<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu'>('Senin');

  // New Schedule states
  const [schedDay, setSchedDay] = useState<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu'>('Senin');
  const [schedSubject, setSchedSubject] = useState('');
  const [schedStartTime, setSchedStartTime] = useState('08:00');
  const [schedEndTime, setSchedEndTime] = useState('09:30');
  const [schedRoom, setSchedRoom] = useState('');
  const [schedTeacherName, setSchedTeacherName] = useState(teacherName);
  const [schedColor, setSchedColor] = useState('indigo');
  const [schedSuccessMsg, setSchedSuccessMsg] = useState('');
  const [isAddingSched, setIsAddingSched] = useState(false);

  useEffect(() => {
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayName = dayNames[new Date().getDay()];
    if (todayName !== 'Minggu') {
      setSelectedDay(todayName as any);
      setSchedDay(todayName as any);
    } else {
      setSelectedDay('Senin');
      setSchedDay('Senin');
    }
  }, []);

  useEffect(() => {
    if (!className) return;
    const sId = students[0]?.schoolId || 'school-1';
    const q = query(
      collection(db, 'schedules'),
      where('schoolId', '==', sId),
      where('className', '==', className)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const list: Schedule[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Schedule);
      });
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
      setSchedules(list);
    }, (error) => {
      console.error("Error loading class schedules:", error);
    });
    return () => unsub();
  }, [className, students]);

  const handleAddScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedSubject.trim()) return;

    const sId = students[0]?.schoolId || 'school-1';
    const newSched: Schedule = {
      id: 'sched-' + Date.now() + Math.random().toString(36).substr(2, 5),
      className,
      day: schedDay,
      subject: schedSubject,
      startTime: schedStartTime,
      endTime: schedEndTime,
      room: schedRoom || undefined,
      teacherName: schedTeacherName || teacherName,
      schoolId: sId,
      color: schedColor
    };

    try {
      await setDoc(doc(db, 'schedules', newSched.id), newSched);
      setSchedSuccessMsg('Jadwal pelajaran berhasil ditambahkan!');
      setSchedSubject('');
      setSchedRoom('');
      setIsAddingSched(false);
      setTimeout(() => setSchedSuccessMsg(''), 3000);
    } catch (err) {
      console.error("Error adding schedule:", err);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'schedules', id));
    } catch (err) {
      console.error("Error deleting schedule:", err);
    }
  };

  // New Student Entry State
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentNis, setNewStudentNis] = useState('');
  const [newStudentClass, setNewStudentClass] = useState(className);
  const [newStudentAddress, setNewStudentAddress] = useState('');
  const [newStudentParentName, setNewStudentParentName] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentUsername, setNewStudentUsername] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [studentSuccessMsg, setStudentSuccessMsg] = useState('');
  const [studentToDelete, setStudentToDelete] = useState<any | null>(null);

  // New Calendar Event Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<'academic' | 'holiday' | 'event'>('academic');
  const [eventDate, setEventDate] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventVisibility, setEventVisibility] = useState<'both' | 'teacher'>('both');
  const [calendarSuccessMsg, setCalendarSuccessMsg] = useState('');

  // Filter students belonging to Class
  const classStudents = students.filter((s) => s.class === className);
  const totalStudentsCount = classStudents.length;

  const hadirCount = classStudents.filter((s) => s.attendanceToday === 'HADIR').length;
  const sakitIzinCount = classStudents.filter((s) => s.attendanceToday === 'SAKIT' || s.attendanceToday === 'IZIN').length;
  const alfaCount = classStudents.filter((s) => s.attendanceToday === 'ALFA').length;
  const belumAbsenCount = classStudents.filter((s) => s.attendanceToday === 'BELUM ABSEN').length;

  // Percentage calculations
  const hadirPercent = totalStudentsCount > 0 ? Math.round((hadirCount / totalStudentsCount) * 100) : 0;
  const sakitIzinPercent = totalStudentsCount > 0 ? Math.round((sakitIzinCount / totalStudentsCount) * 100) : 0;
  const alfaPercent = totalStudentsCount > 0 ? Math.round((alfaCount / totalStudentsCount) * 100) : 0;
  const belumAbsenPercent = totalStudentsCount > 0 ? Math.round((belumAbsenCount / totalStudentsCount) * 100) : 0;

  // Pending approval permits count
  const pendingPermitsCount = permits.filter((p) => p.status === 'Pending').length;

  // Pending financial payments count
  let pendingPaymentsCount = 0;
  classStudents.forEach(student => {
    if (student.sppBills) {
      student.sppBills.forEach(bill => {
        if (bill.status === 'Pending') {
          pendingPaymentsCount++;
        }
      });
    }
  });

  // Grade Entry State
  const [gradeStudentId, setGradeStudentId] = useState(classStudents[0]?.id || '');
  const [subjects, setSubjects] = useState<string[]>(() => {
    const saved = localStorage.getItem('educonnect_teacher_subjects');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return ['Matematika', 'IPA', 'IPS', 'Bahasa Indonesia', 'Seni Budaya', 'Pancasila & PKn'];
  });
  const [gradeSubject, setGradeSubject] = useState('Matematika');
  const [gradeScore, setGradeScore] = useState(85);
  const [gradeType, setGradeType] = useState<'Tugas' | 'UTS' | 'UAS'>('Tugas');
  const [gradeSuccessMsg, setGradeSuccessMsg] = useState('');
  
  // Custom Subject management inline
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [showManageSubjects, setShowManageSubjects] = useState(false);

  const handleAddSubject = (subjectName: string) => {
    const trimmed = subjectName.trim();
    if (!trimmed) return;
    if (subjects.includes(trimmed)) {
      setGradeSubject(trimmed);
      return;
    }
    const updated = [...subjects, trimmed];
    setSubjects(updated);
    localStorage.setItem('educonnect_teacher_subjects', JSON.stringify(updated));
    setGradeSubject(trimmed);
    setNewSubjectInput('');
  };

  const handleRemoveSubject = (subjectName: string) => {
    const updated = subjects.filter(s => s !== subjectName);
    setSubjects(updated);
    localStorage.setItem('educonnect_teacher_subjects', JSON.stringify(updated));
    if (gradeSubject === subjectName) {
      setGradeSubject(updated[0] || '');
    }
  };

  const [annTitle, setAnnTitle] = useState('');
  const [annCategory, setAnnCategory] = useState('Akademik');
  const [annContent, setAnnContent] = useState('');
  const [annSuccessMsg, setAnnSuccessMsg] = useState('');

  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeStudentId) return;

    const newGrade: Grade = {
      subject: gradeSubject,
      score: Number(gradeScore),
      maxScore: 100,
      type: gradeType,
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    onAddGrade(gradeStudentId, newGrade);
    setGradeSuccessMsg('Nilai tugas berhasil diinput!');
    setTimeout(() => {
      setGradeSuccessMsg('');
      setShowGradeModal(false);
    }, 1500);
  };

  const handleAnnouncementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;

    const excerpt = annContent.length > 70 ? annContent.substring(0, 70) + '...' : annContent;

    if (onAddAnnouncement) {
      onAddAnnouncement({
        title: annTitle,
        category: annCategory,
        content: annContent,
        excerpt: excerpt
      });
    }

    setAnnSuccessMsg('Informasi terbaru berhasil diterbitkan!');
    setTimeout(() => {
      setAnnSuccessMsg('');
      setAnnTitle('');
      setAnnContent('');
      setAnnCategory('Akademik');
      setShowAnnouncementModal(false);
    }, 1500);
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName || !newStudentParentName || !newStudentUsername || !newStudentPassword) {
      alert('Mohon lengkapi semua kolom wajib.');
      return;
    }

    if (onAddStudent) {
      onAddStudent({
        name: newStudentName,
        class: newStudentClass,
        parentName: newStudentParentName,
        username: newStudentUsername,
        password: newStudentPassword,
        nis: newStudentNis || undefined,
        address: newStudentAddress || undefined,
        phone: newStudentPhone || undefined
      });
    }

    setStudentSuccessMsg('Siswa baru dan akun login wali murid berhasil dibuat!');
    setTimeout(() => {
      setStudentSuccessMsg('');
      setNewStudentName('');
      setNewStudentNis('');
      setNewStudentClass(className);
      setNewStudentAddress('');
      setNewStudentParentName('');
      setNewStudentPhone('');
      setNewStudentUsername('');
      setNewStudentPassword('');
      setShowStudentModal(false);
    }, 1800);
  };

  const handleToggleAttendance = (studentId: string, currentStatus: Student['attendanceToday']) => {
    const statuses: Student['attendanceToday'][] = ['HADIR', 'SAKIT', 'IZIN', 'ALFA'];
    const nextIndex = (statuses.indexOf(currentStatus) + 1) % statuses.length;
    const nextStatus = statuses[nextIndex];
    const timeNow = nextStatus === 'HADIR' ? '07:15 WIB' : undefined;
    onUpdateAttendance(studentId, nextStatus, timeNow);
  };

  // Custom SVG pie chart dimensions
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate offsets for an elegant segmented ring chart
  const hadirDashOffset = circumference - (hadirPercent / 100) * circumference;
  const sakitIzinDashOffset = circumference - ((hadirPercent + sakitIzinPercent) / 100) * circumference;
  const alfaDashOffset = circumference - ((hadirPercent + sakitIzinPercent + alfaPercent) / 100) * circumference;

  return (
    <div className="space-y-6 pb-20">
      {/* Curved Dark Header Backdrop */}
      <div className="bg-brand-blue text-white rounded-b-[2.5rem] px-5 pt-8 pb-12 relative">
        {/* Subtle decorative shapes bounded inside an overflow-hidden container */}
        <div className="absolute inset-0 rounded-b-[2.5rem] overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-40px] left-[-40px] w-44 h-44 rounded-full bg-slate-800 opacity-20 blur-2xl"></div>
          <div className="absolute bottom-[-20px] right-[-20px] w-36 h-36 rounded-full bg-slate-800 opacity-30 blur-xl"></div>
        </div>

        {/* Brand & Notifications Bar */}
        <div className="flex items-center justify-between mb-6 relative z-50">
          <div className="flex items-center gap-2.5">
            {schoolLogoUrl ? (
              <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center overflow-hidden shadow-md shrink-0">
                <img src={schoolLogoUrl} alt="Logo Sekolah" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
              </div>
            ) : (
              <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L1 21h22L12 2zm0 4l6.5 11h-13L12 6zm-1 8h2v2h-2v-2zm0-4h2v3h-2V10z"/>
                </svg>
              </div>
            )}
            <div>
              <span className="text-[10px] text-slate-200 font-black uppercase tracking-widest block leading-tight">{schoolName || 'TK Mutiara Bangsa'}</span>
              <span className="font-display font-black text-[11px] text-yellow-400 tracking-wide uppercase">EduConnect Portal</span>
            </div>
          </div>
          <div className="relative z-20 flex items-center gap-2">
            <button
              onClick={onReplayOnboarding}
              className="p-2 bg-white/15 hover:bg-white/25 text-white rounded-xl backdrop-blur-md transition-all active:scale-95"
              title="Panduan EduConnect"
            >
              <Sparkles size={18} className="text-yellow-300" />
            </button>
            <NotificationInbox
              notifications={notifications}
              currentUser={currentUser}
              onMarkAsRead={onMarkNotificationAsRead}
              onMarkAllAsRead={onMarkAllNotificationsAsRead}
              onDeleteNotification={onDeleteNotification}
              onNavigateToTab={onNavigateToNotification}
            />
            <NotificationActivator />
          </div>
        </div>

        {/* Greeting */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs text-slate-300">Wali Kelas {className}</span>
            {isPremium && (
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                <Crown size={8} className="fill-amber-300 text-amber-300 animate-bounce" />
                PREMIUM
              </span>
            )}
          </div>
          <h1 className="font-display font-bold text-2xl tracking-tight">Halo, {teacherName}!</h1>
          <p className="text-xs text-slate-300 mt-1">{schoolName || 'Mutiara Bangsa Kindergarten'} • HP Mode</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-5 -mt-8 relative z-30 space-y-5">
        {/* Quick Actions (Aksi Cepat) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 custom-shadow space-y-4 overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">Aksi Cepat Guru</span>
            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full select-none">
              <span>Geser</span>
              <ChevronRight size={10} className="text-slate-500 animate-pulse" />
            </div>
          </div>
          <div className="flex overflow-x-auto no-scrollbar gap-2.5 pb-1 snap-x snap-mandatory scroll-smooth -mx-1 px-1">
            <button
              onClick={() => setShowAttendanceModal(true)}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-100 p-3.5 rounded-2xl text-left flex flex-col justify-between transition-all group focus:outline-none min-h-[135px] w-[115px] sm:w-[130px] flex-shrink-0 snap-start"
              id="teacher-action-absensi"
            >
              <div className="bg-emerald-100 text-brand-green p-2 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform">
                <UserCheck size={16} />
              </div>
              <div>
                <h4 className="font-display font-bold text-xs text-slate-800 leading-tight">Isi Absensi</h4>
                <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">Update absensi kelas</p>
              </div>
            </button>
 
            <button
              onClick={() => setShowGradeModal(true)}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-100 p-3.5 rounded-2xl text-left flex flex-col justify-between transition-all group focus:outline-none min-h-[135px] w-[115px] sm:w-[130px] flex-shrink-0 snap-start"
              id="teacher-action-grades"
            >
              <div className="bg-brand-accent/20 text-brand-accent p-2 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform">
                <Award size={16} />
              </div>
              <div>
                <h4 className="font-display font-bold text-xs text-slate-800 leading-tight">Input Nilai</h4>
                <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">Masukkan nilai tugas</p>
              </div>
            </button>
 
            <button
              onClick={() => setShowAnnouncementModal(true)}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-100 p-3.5 rounded-2xl text-left flex flex-col justify-between transition-all group focus:outline-none min-h-[135px] w-[115px] sm:w-[130px] flex-shrink-0 snap-start"
              id="teacher-action-announcement"
            >
              <div className="bg-sky-100 text-sky-600 p-2 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform">
                <Megaphone size={16} />
              </div>
              <div>
                <h4 className="font-display font-bold text-xs text-slate-800 leading-tight">Buat Info</h4>
                <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">Kirim pengumuman baru</p>
              </div>
            </button>
 
            <button
              onClick={() => setShowStudentModal(true)}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-100 p-3.5 rounded-2xl text-left flex flex-col justify-between transition-all group focus:outline-none min-h-[135px] w-[115px] sm:w-[130px] flex-shrink-0 snap-start"
              id="teacher-action-student"
            >
              <div className="bg-blue-100 text-brand-blue p-2 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform">
                <UserPlus size={16} />
              </div>
              <div>
                <h4 className="font-display font-bold text-xs text-slate-800 leading-tight">Siswa Baru</h4>
                <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">Input data & akun login</p>
              </div>
            </button>
 
            <button
              onClick={() => setShowStudentListModal(true)}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-100 p-3.5 rounded-2xl text-left flex flex-col justify-between transition-all group focus:outline-none min-h-[135px] w-[115px] sm:w-[130px] flex-shrink-0 snap-start"
              id="teacher-action-student-list"
            >
              <div className="bg-purple-100 text-purple-600 p-2 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform">
                <Users size={16} />
              </div>
              <div>
                <h4 className="font-display font-bold text-xs text-slate-800 leading-tight">Data Siswa</h4>
                <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">Lihat & hapus data siswa</p>
              </div>
            </button>

            <button
              onClick={() => setShowCalendarModal(true)}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-100 p-3.5 rounded-2xl text-left flex flex-col justify-between transition-all group focus:outline-none min-h-[135px] w-[115px] sm:w-[130px] flex-shrink-0 snap-start"
              id="teacher-action-calendar"
            >
              <div className="bg-sky-100 text-sky-600 p-2 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform">
                <CalendarDays size={16} />
              </div>
              <div>
                <h4 className="font-display font-bold text-xs text-slate-800 leading-tight">Agenda Sekolah</h4>
                <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">Kelola kegiatan & kalender</p>
              </div>
            </button>

            <button
              onClick={() => onGoToKonseling?.()}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-100 p-3.5 rounded-2xl text-left flex flex-col justify-between transition-all group focus:outline-none min-h-[135px] w-[115px] sm:w-[130px] flex-shrink-0 snap-start"
              id="teacher-action-counseling"
            >
              <div className="bg-rose-100 text-rose-600 p-2 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform">
                <Smile size={16} />
              </div>
              <div>
                <h4 className="font-display font-bold text-xs text-slate-800 leading-tight">Catatan Murid</h4>
                <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">Kelola perkembangan anak</p>
              </div>
            </button>

            <button
              onClick={() => onGoToFinances?.()}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-100 p-3.5 rounded-2xl text-left flex flex-col justify-between transition-all group focus:outline-none min-h-[135px] w-[115px] sm:w-[130px] flex-shrink-0 snap-start"
              id="teacher-action-finances"
            >
              <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform">
                <Wallet size={16} />
              </div>
              <div>
                <h4 className="font-display font-bold text-xs text-slate-800 leading-tight">SPP & Keuangan</h4>
                <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">Buat tagihan & persetujuan</p>
              </div>
            </button>

            <button
              onClick={() => onGoToFinances?.('savings')}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-100 p-3.5 rounded-2xl text-left flex flex-col justify-between transition-all group focus:outline-none min-h-[135px] w-[115px] sm:w-[130px] flex-shrink-0 snap-start"
              id="teacher-action-savings"
            >
              <div className="bg-sky-100 text-sky-600 p-2 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M16 11h4v2h-4z" />
                  <circle cx="12" cy="12" r="2.1" />
                </svg>
              </div>
              <div>
                <h4 className="font-display font-bold text-xs text-slate-800 leading-tight">Tabungan Siswa</h4>
                <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">Catat setor & tarik tunai</p>
              </div>
            </button>

            <button
              onClick={() => setShowScheduleModal(true)}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-100 p-3.5 rounded-2xl text-left flex flex-col justify-between transition-all group focus:outline-none min-h-[135px] w-[115px] sm:w-[130px] flex-shrink-0 snap-start"
              id="teacher-action-schedules"
            >
              <div className="bg-violet-100 text-violet-600 p-2 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform">
                <BookOpen size={16} />
              </div>
              <div>
                <h4 className="font-display font-bold text-xs text-slate-800 leading-tight">Jadwal Kelas</h4>
                <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">Atur jadwal pelajaran</p>
              </div>
            </button>
          </div>
        </div>

        {/* Real-time Clock & Calendar Compact Widget */}
        <div onClick={() => setShowCalendarModal(true)} className="cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all">
          <CalendarClockWidget events={calendarEvents} compact={true} />
        </div>

        {/* Approval Waiting List Widget */}
        {pendingPermitsCount > 0 ? (
          <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={onGoToApproval}
            className="bg-amber-50 hover:bg-amber-100/70 border border-amber-100 p-4.5 rounded-3xl flex items-center justify-between cursor-pointer transition-all custom-shadow"
            id="teacher-notif-approval"
          >
            <div className="flex items-center gap-3.5">
              <div className="bg-amber-500 text-white p-3 rounded-2xl animate-bounce">
                <Bell size={20} />
              </div>
              <div>
                <h4 className="font-display font-extrabold text-sm text-amber-900">Validasi Izin Online</h4>
                <p className="text-xs text-amber-700 font-semibold mt-0.5">Ada {pendingPermitsCount} pengajuan butuh persetujuan Anda.</p>
              </div>
            </div>
            <div className="bg-amber-500 text-white p-1 rounded-full">
              <ChevronRight size={18} />
            </div>
          </motion.div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-3 text-brand-green-dark">
              <div className="bg-brand-green/10 text-brand-green p-2.5 rounded-xl">
                <CheckCircle size={18} />
              </div>
              <div>
                <h4 className="font-display font-bold text-xs">Persetujuan Beres</h4>
                <p className="text-[11px] text-brand-green-dark/70 mt-0.5">Tidak ada pengajuan izin tertunda.</p>
              </div>
            </div>
          </div>
        )}

        {/* Pending SPP Payment verification card */}
        {pendingPaymentsCount > 0 ? (
          <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={onGoToFinances}
            className="bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-100 p-4.5 rounded-3xl flex items-center justify-between cursor-pointer transition-all custom-shadow mt-3"
            id="teacher-notif-finances"
          >
            <div className="flex items-center gap-3.5">
              <div className="bg-emerald-500 text-white p-3 rounded-2xl animate-bounce">
                <Wallet size={20} />
              </div>
              <div>
                <h4 className="font-display font-extrabold text-sm text-emerald-950">Konfirmasi Pembayaran SPP</h4>
                <p className="text-xs text-emerald-800 font-semibold mt-0.5">Ada {pendingPaymentsCount} bukti transfer iuran/SPP butuh verifikasi.</p>
              </div>
            </div>
            <div className="bg-emerald-500 text-white p-1 rounded-full">
              <ChevronRight size={18} />
            </div>
          </motion.div>
        ) : null}

        {/* Classroom Attendance Chart & Live Stats */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 custom-shadow space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">Grafik Kehadiran Hari Ini</span>
            <span className="text-[11px] text-slate-500 font-bold bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
              {totalStudentsCount} Siswa {className}
            </span>
          </div>

          <div className="flex items-center justify-between gap-6 py-2">
            {/* Custom SVG Segmented Pie Chart */}
            <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                {/* Background Ring */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="stroke-slate-100"
                  strokeWidth="12"
                  fill="transparent"
                />
                
                {/* Hadir Segment */}
                {hadirPercent > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    className="stroke-brand-green transition-all duration-1000 ease-out"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={hadirDashOffset}
                    strokeLinecap="round"
                  />
                )}

                {/* Sakit/Izin Segment */}
                {sakitIzinPercent > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    className="stroke-brand-accent transition-all duration-1000 ease-out"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={sakitIzinDashOffset}
                    strokeLinecap="round"
                  />
                )}

                {/* Alfa Segment */}
                {alfaPercent > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    className="stroke-red-500 transition-all duration-1000 ease-out"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={alfaDashOffset}
                    strokeLinecap="round"
                  />
                )}
              </svg>
              {/* Inner Center Label */}
              <div className="absolute text-center">
                <span className="font-display font-black text-2xl text-slate-800">{hadirPercent}%</span>
                <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-tight">Hadir</span>
              </div>
            </div>

            {/* Color Legend with live counts */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-green shrink-0"></span>
                  <span>Hadir</span>
                </div>
                <span className="text-slate-800 font-extrabold">{hadirCount} Siswa</span>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-accent shrink-0"></span>
                  <span>Sakit/Izin</span>
                </div>
                <span className="text-slate-800 font-extrabold">{sakitIzinCount} Siswa</span>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"></span>
                  <span>Alfa</span>
                </div>
                <span className="text-slate-800 font-extrabold">{alfaCount} Siswa</span>
              </div>

              {belumAbsenCount > 0 && (
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0"></span>
                    <span>Belum Absen</span>
                  </div>
                  <span className="text-slate-500 font-bold">{belumAbsenCount} Siswa</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Classroom Student Directory Quickview */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 custom-shadow space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">Daftar Kehadiran Siswa</span>
            <span className="text-xs text-slate-400 font-medium">Klik status untuk ganti cepat</span>
          </div>

          <div className="divide-y divide-slate-100">
            {classStudents.map((std) => (
              <div key={std.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={std.avatar}
                    alt={std.name}
                    className="w-9 h-9 rounded-xl object-cover border border-slate-100"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h5 className="font-display font-bold text-xs text-slate-800 uppercase">{std.name}</h5>
                    <p className="text-[10px] text-slate-400 font-semibold">{std.attendanceTime ? `Masuk: ${std.attendanceTime}` : 'Belum absen'}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleAttendance(std.id, std.attendanceToday)}
                  className={`text-[10px] font-extrabold px-3 py-1.5 rounded-full transition-all uppercase ${
                    std.attendanceToday === 'HADIR' ? 'bg-emerald-50 text-brand-green border border-emerald-100' :
                    std.attendanceToday === 'SAKIT' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                    std.attendanceToday === 'IZIN' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                    std.attendanceToday === 'ALFA' ? 'bg-red-50 text-red-500 border border-red-100' :
                    'bg-slate-100 text-slate-500'
                  }`}
                >
                  {std.attendanceToday}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL / BOTTOM SLIDE-OVERS FOR GURU */}
      <AnimatePresence>
        {/* Attendance Management Sheet */}
        {showAttendanceModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-blue/60 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white w-full max-w-lg rounded-t-[2.5rem] p-6 max-h-[85vh] overflow-y-auto space-y-6 shadow-2xl relative"
            >
              <button
                onClick={() => setShowAttendanceModal(false)}
                className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-all"
                id="close-attendance-modal-btn"
              >
                <X size={18} />
              </button>

              <div>
                <h3 className="font-display font-extrabold text-lg text-slate-950">📋 Pengisian Absensi Kelas</h3>
                <p className="text-xs text-slate-400">Pilih status kehadiran hari ini untuk setiap siswa.</p>
              </div>

              <div className="space-y-3.5 divide-y divide-slate-100">
                {classStudents.map((std) => (
                  <div key={std.id} className="pt-3.5 flex flex-col gap-2">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={std.avatar}
                        alt={std.name}
                        className="w-8 h-8 rounded-lg object-cover border border-slate-100"
                        referrerPolicy="no-referrer"
                      />
                      <span className="font-display font-bold text-xs text-slate-800 uppercase">{std.name}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {(['HADIR', 'SAKIT', 'IZIN', 'ALFA'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => {
                            const time = status === 'HADIR' ? '07:05 WIB' : undefined;
                            onUpdateAttendance(std.id, status, time);
                          }}
                          className={`text-[9px] font-extrabold py-2 px-1 rounded-xl text-center transition-all ${
                            std.attendanceToday === status
                              ? status === 'HADIR' ? 'bg-brand-green text-white' :
                                status === 'SAKIT' ? 'bg-amber-500 text-white' :
                                status === 'IZIN' ? 'bg-blue-600 text-white' : 'bg-red-500 text-white'
                              : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200/50'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowAttendanceModal(false)}
                className="w-full bg-brand-blue hover:bg-brand-blue-light text-white font-display font-bold text-xs py-3 rounded-xl custom-shadow transition-colors"
                id="save-attendance-btn"
              >
                Selesai & Simpan Absensi
              </button>
            </motion.div>
          </div>
        )}

        {/* Academic Grade Entry Sheet */}
        {showGradeModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-blue/60 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white w-full max-w-lg rounded-t-[2.5rem] p-6 max-h-[85vh] overflow-y-auto space-y-5 shadow-2xl relative"
            >
              <button
                onClick={() => setShowGradeModal(false)}
                className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-all"
                id="close-grade-modal-btn"
              >
                <X size={18} />
              </button>

              <div>
                <h3 className="font-display font-extrabold text-lg text-slate-950">✍️ Input Nilai Tugas</h3>
                <p className="text-xs text-slate-400">Masukkan perolehan skor nilai tugas siswa.</p>
              </div>

              {gradeSuccessMsg ? (
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-brand-green-dark text-center font-bold text-xs animate-bounce">
                  {gradeSuccessMsg}
                </div>
              ) : (
                <form onSubmit={handleGradeSubmit} className="space-y-4">
                  {/* Select Student */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500">Pilih Siswa</label>
                    <select
                      value={gradeStudentId}
                      onChange={(e) => setGradeStudentId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-brand-blue"
                      required
                    >
                      {classStudents.map((std) => (
                        <option key={std.id} value={std.id}>
                          {std.name.toUpperCase()} ({std.class})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Subject */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-slate-500">Mata Pelajaran</label>
                      <button
                        type="button"
                        onClick={() => setShowManageSubjects(!showManageSubjects)}
                        className="text-[10px] text-brand-blue hover:underline font-extrabold focus:outline-none"
                      >
                        {showManageSubjects ? 'Selesai Kelola' : 'Kelola / Tambah Mapel'}
                      </button>
                    </div>

                    {!showManageSubjects ? (
                      <select
                        value={gradeSubject}
                        onChange={(e) => setGradeSubject(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-brand-blue"
                      >
                        {subjects.map((sub) => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-3">
                        {/* Add Subject Inline Input */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Tulis nama mapel baru..."
                            value={newSubjectInput}
                            onChange={(e) => setNewSubjectInput(e.target.value)}
                            className="flex-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-brand-blue"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddSubject(newSubjectInput)}
                            className="bg-brand-blue hover:bg-brand-blue-light text-white px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 shrink-0"
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
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Grade Type */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500">Jenis Evaluasi</label>
                      <select
                        value={gradeType}
                        onChange={(e) => setGradeType(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-semibold focus:outline-none"
                      >
                        <option value="Tugas">Tugas Harian</option>
                        <option value="UTS">UTS</option>
                        <option value="UAS">UAS</option>
                      </select>
                    </div>

                    {/* Grade Score */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500">Nilai (0 - 100)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={gradeScore}
                        onChange={(e) => setGradeScore(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-brand-blue"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-display font-bold text-xs py-3 rounded-xl custom-shadow transition-colors"
                    id="submit-grade-btn"
                  >
                    Simpan Nilai Siswa
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}

        {/* Announcement Entry Sheet */}
        {showAnnouncementModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-blue/60 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white w-full max-w-lg rounded-t-[2.5rem] p-6 max-h-[85vh] overflow-y-auto space-y-5 shadow-2xl relative"
            >
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-all"
                id="close-announcement-modal-btn"
              >
                <X size={18} />
              </button>

              <div>
                <h3 className="font-display font-extrabold text-lg text-slate-950">📢 Tambah Informasi Terbaru</h3>
                <p className="text-xs text-slate-400">Terbitkan pengumuman baru untuk wali murid kelas Anda.</p>
              </div>

              {annSuccessMsg ? (
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-brand-green-dark text-center font-bold text-xs animate-bounce">
                  {annSuccessMsg}
                </div>
              ) : (
                <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
                  {/* Category Selection */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500">Kategori Informasi</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {['Akademik', 'Ujian', 'Kegiatan', 'Pengumuman'].map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => setAnnCategory(category)}
                          className={`text-[10px] font-bold py-2 px-1.5 rounded-xl text-center border transition-all ${
                            annCategory === category
                              ? 'bg-sky-500 text-white border-sky-500'
                              : 'bg-slate-50 text-slate-500 border-slate-200/50 hover:bg-slate-100'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Announcement Title */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500">Judul Pengumuman</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Edaran Pengambilan Rapor Siswa"
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-brand-blue"
                    />
                  </div>

                  {/* Announcement Content */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500">Isi Pengumuman Lengkap</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Tuliskan detail pengumuman yang ingin disampaikan secara lengkap di sini..."
                      value={annContent}
                      onChange={(e) => setAnnContent(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-brand-blue leading-normal resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-display font-bold text-xs py-3 rounded-xl custom-shadow transition-colors"
                    id="submit-announcement-btn"
                  >
                    Terbitkan Pengumuman
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}

        {/* Student Registration Entry Sheet */}
        {showStudentModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-blue/60 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white w-full max-w-lg rounded-t-[2.5rem] p-6 max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl relative"
            >
              <button
                onClick={() => setShowStudentModal(false)}
                className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-all"
                id="close-student-modal-btn"
              >
                <X size={18} />
              </button>

              <div>
                <h3 className="font-display font-extrabold text-lg text-slate-950">👨‍🎓 Input Siswa Baru & Akun Ortu</h3>
                <p className="text-xs text-slate-400">Tambahkan data siswa baru lengkap beserta akun login untuk wali murid.</p>
              </div>

              {studentSuccessMsg ? (
                <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl text-brand-green-dark text-center font-bold text-xs flex flex-col items-center justify-center gap-2 animate-bounce">
                  <CheckCircle size={28} className="text-brand-green" />
                  <span>{studentSuccessMsg}</span>
                </div>
              ) : (
                <form onSubmit={handleStudentSubmit} className="space-y-4">
                  {/* DATA SISWA SECTION */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                    <span className="text-[9px] font-bold tracking-wider text-brand-blue uppercase block border-b border-slate-200/50 pb-1.5">
                      1. Data Diri Siswa
                    </span>

                    {/* Student Name */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Nama Lengkap Siswa *</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Muhammad Akhyar"
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-blue"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* NIS */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">NISN / NIS</label>
                        <input
                          type="text"
                          placeholder="Contoh: 12049582"
                          value={newStudentNis}
                          onChange={(e) => setNewStudentNis(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-blue"
                        />
                      </div>

                      {/* Class */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Kelas *</label>
                        <select
                          value={newStudentClass}
                          onChange={(e) => setNewStudentClass(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-blue"
                        >
                          <option value="TK-A">TK-A</option>
                          <option value="TK-B">TK-B</option>
                          <option value="KELAS 1 SD">KELAS 1 SD</option>
                          <option value="KELAS 2 SD">KELAS 2 SD</option>
                          <option value="KELAS 3 SD">KELAS 3 SD</option>
                          <option value="KELAS 4 SD">KELAS 4 SD</option>
                          <option value="KELAS 5 SD">KELAS 5 SD</option>
                          <option value="KELAS 6 SD">KELAS 6 SD</option>
                        </select>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Alamat Rumah</label>
                      <input
                        type="text"
                        placeholder="Contoh: Jl. Diponegoro No. 12, Surabaya"
                        value={newStudentAddress}
                        onChange={(e) => setNewStudentAddress(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-blue"
                      />
                    </div>
                  </div>

                  {/* DATA ORANG TUA & AKUN SECTION */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                    <span className="text-[9px] font-bold tracking-wider text-brand-blue uppercase block border-b border-slate-200/50 pb-1.5">
                      2. Wali Murid & Akun Login Aplikasi
                    </span>

                    {/* Parent Name */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Nama Ibu / Bapak (Wali) *</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Ibu Fatimah"
                        value={newStudentParentName}
                        onChange={(e) => setNewStudentParentName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-blue"
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">No. Handphone Ortu</label>
                      <input
                        type="tel"
                        placeholder="Contoh: 081234567890"
                        value={newStudentPhone}
                        onChange={(e) => setNewStudentPhone(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-blue"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Username */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Username Login *</label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: fatimah123"
                          value={newStudentUsername}
                          onChange={(e) => setNewStudentUsername(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-blue"
                        />
                      </div>

                      {/* Password */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Kata Sandi *</label>
                        <input
                          type="text"
                          required
                          placeholder="Sandi login"
                          value={newStudentPassword}
                          onChange={(e) => setNewStudentPassword(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-blue"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-brand-blue hover:bg-brand-blue-light text-white font-display font-bold text-xs py-3.5 rounded-xl custom-shadow transition-colors"
                    id="submit-new-student-btn"
                  >
                    Simpan Siswa & Akun Ortu
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}

        {/* Student List Sheet */}
        {showStudentListModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-blue/60 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-slate-50 w-full max-w-xl rounded-t-[2.5rem] p-6 max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl relative"
            >
              <button
                onClick={() => setShowStudentListModal(false)}
                className="absolute top-6 right-6 p-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full transition-all"
                id="close-student-list-modal-btn"
              >
                <X size={18} />
              </button>

              <div>
                <h3 className="font-display font-extrabold text-lg text-slate-950">📋 Data Siswa {className}</h3>
                <p className="text-xs text-slate-400">
                  Berikut adalah daftar seluruh siswa yang aktif di {className}. Anda dapat menghapus data jika siswa sudah keluar.
                </p>
              </div>

              <div className="space-y-3.5">
                {classStudents.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center text-xs text-slate-400 font-semibold">
                    Belum ada data siswa di kelas ini.
                  </div>
                ) : (
                  classStudents.map((student) => (
                    <div
                      key={student.id}
                      className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm relative space-y-3 flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={student.avatar || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=150&q=80"}
                            alt={student.name}
                            referrerPolicy="no-referrer"
                            className="w-11 h-11 rounded-full object-cover border-2 border-brand-blue/10 shrink-0"
                          />
                          <div>
                            <h4 className="font-display font-bold text-slate-900 text-xs">{student.name}</h4>
                            <p className="text-[10px] text-slate-400 font-medium">NISN: {student.nis || '-'}</p>
                          </div>
                        </div>

                        {onDeleteStudent && (
                          <button
                            onClick={() => setStudentToDelete(student)}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all"
                            title="Hapus Data Siswa"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold border-t border-slate-100 pt-2.5">
                        <div className="space-y-0.5">
                          <p className="text-slate-400 font-medium">Wali Murid</p>
                          <p className="text-slate-700">{student.parentName || '-'}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-slate-400 font-medium">No. Handphone Ortu</p>
                          <p className="text-slate-700">{student.phone || '-'}</p>
                        </div>
                        <div className="col-span-2 space-y-0.5 border-t border-slate-50 pt-1.5">
                          <p className="text-slate-400 font-medium">Alamat Rumah</p>
                          <p className="text-slate-700 leading-normal">{student.address || '-'}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Custom Confirmation Modal for Student Deletion */}
        {studentToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-blue/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <div className="bg-rose-100 p-2.5 rounded-2xl">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h4 className="font-display font-black text-slate-900 text-sm">Konfirmasi Hapus Siswa</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-2">
                <p className="leading-relaxed">
                  Apakah Anda yakin ingin menghapus data siswa <strong>{studentToDelete.name}</strong>?
                </p>
                <div className="border-t border-slate-200/50 pt-2 text-[10px] space-y-1">
                  <p>• Seluruh data nilai, spp, dan absensi akan terhapus.</p>
                  <p>• Akun login wali murid ({studentToDelete.parentName}) juga akan dinonaktifkan.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setStudentToDelete(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-display font-bold text-xs py-3 rounded-xl transition-colors focus:outline-none"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    if (onDeleteStudent) {
                      onDeleteStudent(studentToDelete.id);
                    }
                    setStudentToDelete(null);
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-display font-bold text-xs py-3 rounded-xl custom-shadow transition-colors focus:outline-none"
                  id="confirm-student-delete-btn"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Calendar and Agenda Modal Sheet */}
        {showCalendarModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-blue/60 backdrop-blur-sm p-0 sm:p-4">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-slate-50 w-full max-w-xl rounded-t-[2.5rem] sm:rounded-b-[2.5rem] p-6 max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl relative border border-slate-100"
            >
              <button
                onClick={() => {
                  setShowCalendarModal(false);
                  setCalendarSuccessMsg('');
                }}
                className="absolute top-6 right-6 p-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full transition-all z-10 focus:outline-none"
                id="close-calendar-modal-btn"
              >
                <X size={18} />
              </button>

              <div className="pr-10">
                <h3 className="font-display font-extrabold text-lg text-slate-950">📅 Agenda & Kalender Kelas</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Lihat agenda sekolah, libur akademik, dan tambahkan agenda baru.
                </p>
              </div>

              {/* Part 1: Full Calendar Widget */}
              <div className="bg-white rounded-3xl p-1 border border-slate-100 shadow-sm overflow-hidden">
                <CalendarClockWidget events={calendarEvents} compact={false} onDeleteEvent={onDeleteCalendarEvent} />
              </div>

              {/* Part 2: Form to Add New Agenda */}
              {onAddCalendarEvent && (
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-sky-600">
                    <CalendarDays size={18} />
                    <h4 className="font-display font-bold text-xs text-slate-900 uppercase tracking-wider">Tambah Agenda Baru</h4>
                  </div>

                  {calendarSuccessMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs py-2.5 px-3 rounded-xl font-semibold"
                    >
                      {calendarSuccessMsg}
                    </motion.div>
                  )}

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!eventTitle.trim() || !eventDate || !eventDescription.trim()) {
                        alert('Harap isi semua kolom agenda!');
                        return;
                      }

                      onAddCalendarEvent({
                        title: eventTitle,
                        date: eventDate,
                        type: eventType,
                        description: eventDescription,
                        visibility: eventVisibility
                      });

                      setEventTitle('');
                      setEventDate('');
                      setEventDescription('');
                      setEventVisibility('both');
                      setCalendarSuccessMsg('🎉 Agenda baru berhasil ditambahkan!');
                      setTimeout(() => setCalendarSuccessMsg(''), 4000);
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Judul Agenda</label>
                      <input
                        type="text"
                        placeholder="Contoh: Pertemuan Komite Sekolah"
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 text-xs px-3.5 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-700 placeholder-slate-400 font-medium"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Jenis Agenda</label>
                        <select
                          value={eventType}
                          onChange={(e) => setEventType(e.target.value as 'academic' | 'holiday' | 'event')}
                          className="w-full bg-slate-50 border border-slate-100 text-xs px-3.5 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-700 font-semibold"
                        >
                          <option value="academic">Akademik</option>
                          <option value="event">Acara Sekolah</option>
                          <option value="holiday">Libur Sekolah</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Tanggal Kegiatan</label>
                        <input
                          type="date"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 text-xs px-3.5 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-700 font-semibold"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Keterangan Singkat</label>
                      <textarea
                        placeholder="Tuliskan detail mengenai kegiatan / agenda yang bersangkutan..."
                        value={eventDescription}
                        onChange={(e) => setEventDescription(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 text-xs px-3.5 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-700 placeholder-slate-400 min-h-[70px] resize-none font-medium"
                        required
                      ></textarea>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Visibilitas Tampilan</label>
                      <p className="text-[10px] text-slate-400 -mt-0.5 mb-2 leading-relaxed">
                        Pilih siapa saja yang dapat melihat agenda ini di aplikasinya.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setEventVisibility('both')}
                          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-[11px] font-bold border transition-all focus:outline-none ${
                            eventVisibility === 'both'
                              ? 'bg-sky-50 text-sky-600 border-sky-200 shadow-sm'
                              : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
                          }`}
                        >
                          <Users size={13} />
                          <span>Guru & Wali Murid</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEventVisibility('teacher')}
                          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-[11px] font-bold border transition-all focus:outline-none ${
                            eventVisibility === 'teacher'
                              ? 'bg-amber-50 text-amber-600 border-amber-200 shadow-sm'
                              : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
                          }`}
                        >
                          <AlertTriangle size={13} />
                          <span>Hanya Guru</span>
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-sky-600 hover:bg-sky-700 text-white font-display font-bold text-xs py-3 rounded-xl transition-all custom-shadow mt-2 focus:outline-none"
                    >
                      Simpan Agenda Baru
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* MODAL: JADWAL PELAJARAN MANAGEMENT */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-slate-50 w-full sm:max-w-xl h-[85vh] sm:h-[80vh] sm:rounded-[2.5rem] rounded-t-[2.5rem] p-6 shadow-2xl relative overflow-y-auto no-scrollbar flex flex-col gap-5 border border-slate-100"
              id="schedule-manager-modal"
            >
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setSchedSuccessMsg('');
                }}
                className="absolute top-6 right-6 p-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full transition-all z-10 focus:outline-none"
                id="close-schedule-modal-btn"
              >
                <X size={18} />
              </button>

              <div className="pr-10 shrink-0 text-left">
                <h3 className="font-display font-black text-xl text-slate-950 flex items-center gap-2">
                  <span className="p-1.5 bg-violet-100 text-violet-600 rounded-xl">
                    <BookOpen size={20} />
                  </span>
                  Atur Jadwal Pelajaran
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 font-medium leading-relaxed">
                  Guru kelas dapat menyusun jadwal pelajaran {className}. Semua perubahan akan otomatis muncul di aplikasi wali murid.
                </p>
              </div>

              {/* Day Tabs */}
              <div className="flex gap-1.5 overflow-x-auto py-1 no-scrollbar select-none shrink-0">
                {(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const).map((day) => {
                  const isSelected = selectedDay === day;
                  const daySchedulesCount = schedules.filter(s => s.day === day).length;
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 focus:outline-none ${
                        isSelected
                          ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-fuchsia-100'
                          : 'bg-white border border-slate-100 hover:bg-slate-100 text-slate-600 shadow-sm'
                      }`}
                    >
                      {day}
                      {daySchedulesCount > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {daySchedulesCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Toggle to Add Form */}
              <div className="flex items-center justify-between shrink-0">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Jadwal Pelajaran Hari {selectedDay}</h4>
                <button
                  type="button"
                  onClick={() => setIsAddingSched(!isAddingSched)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all focus:outline-none ${
                    isAddingSched 
                      ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                      : 'bg-violet-50 text-violet-600 border border-violet-100'
                  }`}
                >
                  <Plus size={14} className={isAddingSched ? 'rotate-45 transition-transform' : 'transition-transform'} />
                  <span>{isAddingSched ? 'Batal' : 'Tambah Mapel'}</span>
                </button>
              </div>

              {/* ADD SCHEDULE FORM BLOCK */}
              <AnimatePresence>
                {isAddingSched && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAddScheduleSubmit}
                    className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4 shrink-0 overflow-hidden text-left"
                  >
                    <div className="flex items-center gap-2 text-violet-600">
                      <PlusCircle size={18} />
                      <h4 className="font-display font-bold text-xs text-slate-900 uppercase tracking-wider">Tambah Pelajaran Baru</h4>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Mata Pelajaran</label>
                      <input
                        type="text"
                        placeholder="Contoh: Menggambar & Mewarnai, Mengaji, Istirahat..."
                        value={schedSubject}
                        onChange={(e) => setSchedSubject(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 text-xs px-3.5 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-slate-700 placeholder-slate-400 font-medium"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Jam Mulai</label>
                        <input
                          type="text"
                          placeholder="e.g. 08:00"
                          value={schedStartTime}
                          onChange={(e) => setSchedStartTime(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 text-xs px-3.5 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-slate-700 font-semibold text-center"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Jam Selesai</label>
                        <input
                          type="text"
                          placeholder="e.g. 09:30"
                          value={schedEndTime}
                          onChange={(e) => setSchedEndTime(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 text-xs px-3.5 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-slate-700 font-semibold text-center"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Ruangan (Opsional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Sentra Balok / Kelas Utama"
                          value={schedRoom}
                          onChange={(e) => setSchedRoom(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 text-xs px-3.5 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-slate-700 font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Guru Pengajar</label>
                        <input
                          type="text"
                          placeholder="Nama Guru Pengampu"
                          value={schedTeacherName}
                          onChange={(e) => setSchedTeacherName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 text-xs px-3.5 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-slate-700 font-medium"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Warna Tampilan Kartu</label>
                      <div className="flex gap-2 flex-wrap">
                        {(['indigo', 'emerald', 'amber', 'rose', 'sky', 'violet', 'pink'] as const).map((color) => {
                          const isColorSelected = schedColor === color;
                          const bgColors: Record<string, string> = {
                            indigo: 'bg-indigo-500',
                            emerald: 'bg-emerald-500',
                            amber: 'bg-amber-500',
                            rose: 'bg-rose-500',
                            sky: 'bg-sky-500',
                            violet: 'bg-violet-500',
                            pink: 'bg-pink-500'
                          };
                          return (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setSchedColor(color)}
                              className={`w-6 h-6 rounded-full ${bgColors[color]} relative transition-all focus:outline-none ${
                                isColorSelected ? 'ring-2 ring-offset-2 ring-violet-600 scale-110' : 'hover:scale-105'
                              }`}
                            >
                              {isColorSelected && (
                                <span className="absolute inset-0 flex items-center justify-center text-white text-[10px]">✓</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-95 text-white font-display font-bold text-xs py-3 rounded-xl transition-all shadow-md focus:outline-none"
                    >
                      Simpan Jadwal Baru
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              {schedSuccessMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs py-2.5 px-3 rounded-xl font-semibold shrink-0 text-left"
                >
                  {schedSuccessMsg}
                </motion.div>
              )}

              {/* LIST OF EXISTING SCHEDULES */}
              <div className="flex-1 space-y-3.5">
                {(() => {
                  const filteredSchedules = schedules.filter(s => s.day === selectedDay);
                  if (filteredSchedules.length === 0) {
                    return (
                      <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 text-xs font-medium space-y-2">
                        <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-semibold text-slate-500">Tidak ada pelajaran hari {selectedDay}</p>
                        <p className="text-[10px] text-slate-400 text-center">Tekan tombol 'Tambah Mapel' di atas untuk menyusun jadwal baru.</p>
                      </div>
                    );
                  }

                  const COLOR_MAPS: Record<string, { bg: string, border: string, text: string, iconBg: string, icon: string }> = {
                    indigo: { bg: 'bg-indigo-50/70', border: 'border-indigo-100', text: 'text-indigo-900', iconBg: 'bg-indigo-100/80', icon: 'text-indigo-600' },
                    emerald: { bg: 'bg-emerald-50/70', border: 'border-emerald-100', text: 'text-emerald-900', iconBg: 'bg-emerald-100/80', icon: 'text-emerald-600' },
                    amber: { bg: 'bg-amber-50/70', border: 'border-amber-100', text: 'text-amber-900', iconBg: 'bg-amber-100/80', icon: 'text-amber-600' },
                    rose: { bg: 'bg-rose-50/70', border: 'border-rose-100', text: 'text-rose-900', iconBg: 'bg-rose-100/80', icon: 'text-rose-600' },
                    sky: { bg: 'bg-sky-50/70', border: 'border-sky-100', text: 'text-sky-900', iconBg: 'bg-sky-100/80', icon: 'text-sky-600' },
                    violet: { bg: 'bg-violet-50/70', border: 'border-violet-100', text: 'text-violet-900', iconBg: 'bg-violet-100/80', icon: 'text-violet-600' },
                    pink: { bg: 'bg-pink-50/70', border: 'border-pink-100', text: 'text-pink-900', iconBg: 'bg-pink-100/80', icon: 'text-pink-600' }
                  };

                  return (
                    <div className="space-y-3 pb-6">
                      {filteredSchedules.map((item) => {
                        const map = COLOR_MAPS[item.color] || COLOR_MAPS.indigo;
                        return (
                          <div
                            key={item.id}
                            className={`p-4 rounded-3xl border bg-white border-slate-100 flex items-center justify-between transition-all group shadow-sm`}
                          >
                            <div className="flex gap-3 items-center text-left">
                              <div className={`w-10 h-10 rounded-2xl ${map.iconBg} flex items-center justify-center shrink-0`}>
                                <span className="text-sm">🏫</span>
                              </div>
                              <div className="space-y-0.5 text-left">
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${map.bg} ${map.text}`}>
                                  {item.startTime} - {item.endTime}
                                </span>
                                <h4 className="font-display font-black text-xs text-slate-800 leading-normal">{item.subject}</h4>
                                <p className="text-[10px] text-slate-400 font-semibold leading-none flex items-center gap-1">
                                  {item.teacherName} {item.room && `• Ruang: ${item.room}`}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteSchedule(item.id)}
                              className="p-2.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all focus:outline-none shrink-0"
                              title="Hapus Jadwal"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
