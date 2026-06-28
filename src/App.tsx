import React, { useState, useEffect } from 'react';
import { Student, EPermit, Grade, CalendarEvent, Announcement, User as AuthUser, LiaisonEntry, CounselingRecord, Bill, School } from './types';
import { INITIAL_STUDENTS, INITIAL_PERMITS, CALENDAR_EVENTS, ANNOUNCEMENTS, INITIAL_LIAISON_ENTRIES, INITIAL_COUNSELING_RECORDS } from './data';
import ParentDashboard from './components/ParentDashboard';
import EPermitForm from './components/EPermitForm';
import TeacherDashboard from './components/TeacherDashboard';
import ApprovalScreen from './components/ApprovalScreen';
import AuthScreen from './components/AuthScreen';
import LiaisonNotebook from './components/LiaisonNotebook';
import ParentAttendanceTab from './components/ParentAttendanceTab';
import { ParentAcademicTab } from './components/ParentAcademicTab';
import { TeacherAcademicTab } from './components/TeacherAcademicTab';
import { TeacherAttendanceTab } from './components/TeacherAttendanceTab';
import { ParentCounselingTab } from './components/ParentCounselingTab';
import { TeacherCounselingTab } from './components/TeacherCounselingTab';
import { TeacherFinancesTab } from './components/TeacherFinancesTab';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import YayasanDashboard from './components/YayasanDashboard';
import DuitkuSimulator from './components/DuitkuSimulator';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Smartphone,
  CheckCircle2,
  Calendar,
  Layers,
  GraduationCap,
  MessageSquare,
  Home,
  User,
  Heart,
  RotateCcw,
  Wifi,
  Battery,
  Award,
  BookOpen
} from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import {
  db,
  seedInitialData,
  dbAddStudent,
  dbDeleteStudent,
  dbSubmitPermit,
  dbApprovePermit,
  dbRejectPermit,
  dbUpdateAttendance,
  dbAddGrade,
  dbDeleteGrade,
  dbAddAnnouncement,
  dbAddCalendarEvent,
  dbDeleteCalendarEvent,
  dbAddLiaisonEntry,
  dbAddLiaisonReply,
  dbUpdateLiaisonStatus,
  dbDeleteLiaisonEntry,
  dbPayBill,
  dbResetToInitial,
  dbAddCounselingRecord,
  dbUpdateCounselingRecord,
  dbDeleteCounselingRecord,
  dbVerifyBillPayment,
  dbCreateClassBill,
  dbCreateStudentBill
} from './firebase';

export default function App() {
  // Global synchronized states with Firestore real-time onSnapshot listeners (initialized empty to remove confusing dummy data)
  const [students, setStudents] = useState<Student[]>([]);
  const [permits, setPermits] = useState<EPermit[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [liaisonEntries, setLiaisonEntries] = useState<LiaisonEntry[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [counselingRecords, setCounselingRecords] = useState<CounselingRecord[]>([]);
  const [teachers, setTeachers] = useState<AuthUser[]>([]);

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [currentSchool, setCurrentSchool] = useState<School | null>(null);
  
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('educonnect_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeRole, setActiveRole] = useState<'superadmin' | 'yayasan' | 'teacher' | 'parent'>(() => {
    const savedUser = localStorage.getItem('educonnect_current_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        return u.role;
      } catch (e) {}
    }
    return 'parent';
  });
  
  // Tab Views inside portals
  const [parentTab, setParentTab] = useState<'home' | 'permit' | 'presensi' | 'akademik' | 'pesan' | 'profil' | 'konseling'>('home');
  const [teacherTab, setTeacherTab] = useState<'home' | 'approval' | 'presensi' | 'akademik' | 'pesan' | 'profil' | 'konseling' | 'keuangan'>('home');
  const [parentDirection, setParentDirection] = useState(1);
  const [teacherDirection, setTeacherDirection] = useState(1);
  const [activeTeacherClass, setActiveTeacherClass] = useState<string>('');

  useEffect(() => {
    if (currentUser && currentUser.role === 'teacher') {
      const teacherClasses = currentUser.className ? currentUser.className.split(',').map(c => c.trim()) : ['TK-A'];
      if (teacherClasses.length > 0 && !teacherClasses.includes(activeTeacherClass)) {
        setActiveTeacherClass(teacherClasses[0]);
      }
    }
  }, [currentUser]);

  const handleParentTabChange = (newTab: 'home' | 'permit' | 'presensi' | 'akademik' | 'pesan' | 'profil' | 'konseling') => {
    const parentTabOrder = ['home', 'permit', 'presensi', 'akademik', 'pesan', 'profil', 'konseling'];
    const currentIdx = parentTabOrder.indexOf(parentTab);
    const newIdx = parentTabOrder.indexOf(newTab);
    setParentDirection(newIdx >= currentIdx ? 1 : -1);
    setParentTab(newTab);
  };

  const handleTeacherTabChange = (newTab: 'home' | 'approval' | 'presensi' | 'akademik' | 'pesan' | 'profil' | 'konseling' | 'keuangan') => {
    const teacherTabOrder = ['home', 'approval', 'presensi', 'akademik', 'pesan', 'profil', 'konseling', 'keuangan'];
    const currentIdx = teacherTabOrder.indexOf(teacherTab);
    const newIdx = teacherTabOrder.indexOf(newTab);
    setTeacherDirection(newIdx >= currentIdx ? 1 : -1);
    setTeacherTab(newTab);
  };

  // Time state for the mock status bar
  const [timeString, setTimeString] = useState('09:41 AM');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }).toUpperCase()
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // 1. Initial Seeding and Firestore Real-time Listeners
  useEffect(() => {
    const initFirebase = async () => {
      await seedInitialData();
    };
    initFirebase();

    if (!currentUser || !currentUser.schoolId) {
      setStudents([]);
      setPermits([]);
      setAnnouncements([]);
      setLiaisonEntries([]);
      setCalendarEvents([]);
      setCounselingRecords([]);
      setCurrentSchool(null);
      return;
    }

    const schoolId = currentUser.schoolId;

    // Listen to current school info
    const unsubSchool = onSnapshot(collection(db, 'schools'), (snapshot) => {
      snapshot.forEach((doc) => {
        if (doc.id === schoolId) {
          setCurrentSchool(doc.data() as School);
        }
      });
    });

    // Listen to students
    const unsubStudents = onSnapshot(
      query(collection(db, 'students'), where('schoolId', '==', schoolId)),
      (snapshot) => {
        const list: Student[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Student);
        });
        setStudents(list);
        if (list.length > 0 && !selectedStudentId) {
          setSelectedStudentId(list[0].id);
        }
      }
    );

    // Listen to permits
    const unsubPermits = onSnapshot(
      query(collection(db, 'permits'), where('schoolId', '==', schoolId)),
      (snapshot) => {
        const list: EPermit[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as EPermit);
        });
        // Sort by submittedAt descending
        list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        setPermits(list);
      }
    );

    // Listen to announcements
    const unsubAnnouncements = onSnapshot(
      query(collection(db, 'announcements'), where('schoolId', '==', schoolId)),
      (snapshot) => {
        const list: Announcement[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Announcement);
        });
        setAnnouncements(list);
      }
    );

    // Listen to liaison entries
    const unsubLiaison = onSnapshot(
      query(collection(db, 'liaisonEntries'), where('schoolId', '==', schoolId)),
      (snapshot) => {
        const list: LiaisonEntry[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as LiaisonEntry);
        });
        setLiaisonEntries(list);
      }
    );

    // Listen to calendar events
    const unsubCalendar = onSnapshot(
      query(collection(db, 'calendarEvents'), where('schoolId', '==', schoolId)),
      (snapshot) => {
        const list: CalendarEvent[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as CalendarEvent);
        });
        setCalendarEvents(list);
      }
    );

    // Listen to counseling records
    const unsubCounseling = onSnapshot(
      query(collection(db, 'counselingRecords'), where('schoolId', '==', schoolId)),
      (snapshot) => {
        const list: CounselingRecord[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as CounselingRecord);
        });
        setCounselingRecords(list);
      }
    );

    // Listen to teachers
    const unsubTeachers = onSnapshot(
      query(collection(db, 'users'), where('schoolId', '==', schoolId), where('role', '==', 'teacher')),
      (snapshot) => {
        const list: AuthUser[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as AuthUser);
        });
        setTeachers(list);
      }
    );

    return () => {
      unsubSchool();
      unsubStudents();
      unsubPermits();
      unsubAnnouncements();
      unsubLiaison();
      unsubCalendar();
      unsubCounseling();
      unsubTeachers();
    };
  }, [currentUser]);

  // RESET state to default
  const handleResetData = async () => {
    if (window.confirm('Apakah Anda ingin menyetel ulang semua data simulasi ke kondisi awal?')) {
      try {
        await dbResetToInitial();
        localStorage.removeItem('educonnect_current_user');
        setCurrentUser(null);
        setSelectedStudentId('rian');
        setParentTab('home');
        setTeacherTab('home');
      } catch (e) {
        console.error('[Firebase] Reset failed:', e);
      }
    }
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    localStorage.setItem('educonnect_current_user', JSON.stringify(user));
    setActiveRole(user.role);
    
    // If they are a parent and have linked child, select that child
    if (user.role === 'parent' && user.studentId) {
      setSelectedStudentId(user.studentId);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('educonnect_current_user');
    setParentTab('home');
    setTeacherTab('home');
  };

  // Callback when a parent submits a new permit
  const handleSubmitPermit = async (newPermitData: Omit<EPermit, 'id' | 'submittedAt' | 'status'>) => {
    const newPermit: EPermit = {
      ...newPermitData,
      id: `permit-${Date.now()}`,
      status: 'Pending',
      submittedAt: new Date().toISOString(),
      schoolId: currentUser?.schoolId
    };
    try {
      await dbSubmitPermit(newPermit, newPermitData.studentId);
    } catch (e) {
      console.error('[Firebase] Error submitting permit:', e);
    }
  };

  // Callback when teacher approves a permit
  const handleApprovePermit = async (permitId: string) => {
    const permit = permits.find((p) => p.id === permitId);
    if (!permit) return;
    try {
      await dbApprovePermit(permitId, permit.studentId, permit.type);
    } catch (e) {
      console.error('[Firebase] Error approving permit:', e);
    }
  };

  // Callback when teacher rejects a permit
  const handleRejectPermit = async (permitId: string) => {
    try {
      await dbRejectPermit(permitId);
    } catch (e) {
      console.error('[Firebase] Error rejecting permit:', e);
    }
  };

  // Callback when teacher registers a new student with complete data and parent account credentials
  const handleAddStudent = async (studentData: {
    name: string;
    class: string;
    parentName: string;
    username: string;
    password: string;
    nis?: string;
    address?: string;
    phone?: string;
  }) => {
    const studentId = `student-${Date.now()}`;
    const newStudent: Student = {
      id: studentId,
      name: studentData.name,
      class: studentData.class,
      avatar: `https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=150&q=80`,
      attendanceToday: 'BELUM ABSEN',
      parentName: studentData.parentName,
      sppStatus: 'Belum Lunas',
      sppBills: [
        {
          id: `bill-${Date.now()}`,
          title: 'SPP Bulanan - Juni 2026',
          amount: 350000,
          dueDate: '10 Juli 2026',
          status: 'Unpaid'
        }
      ],
      grades: [],
      nis: studentData.nis || '',
      address: studentData.address || '',
      phone: studentData.phone || '',
      schoolId: currentUser?.schoolId || ''
    };

    // Create welcoming Liaison Entry
    const newLiaisonEntry: LiaisonEntry = {
      id: `liaison-${Date.now()}`,
      studentId: studentId,
      studentName: studentData.name,
      className: studentData.class,
      taskTitle: 'Buku Penghubung Baru',
      subject: 'Umum',
      status: 'Selesai',
      lastUpdated: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      messages: [
        {
          id: `msg-${Date.now()}`,
          senderRole: 'teacher',
          senderName: currentUser?.fullName || 'Pak Budi',
          message: `Selamat datang ${studentData.name} di kelas ${studentData.class}! Buku penghubung ini dapat digunakan oleh Wali Murid (${studentData.parentName}) untuk memantau tugas dan berkomunikasi langsung dengan guru.`,
          timestamp: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ', 08:00'
        }
      ],
      schoolId: currentUser?.schoolId || ''
    };

    const newParentAccount: AuthUser = {
      id: `user-${Date.now()}`,
      email: studentData.username.trim(),
      password: studentData.password,
      fullName: studentData.parentName,
      role: 'parent',
      studentId: studentId,
      schoolId: currentUser?.schoolId || ''
    };

    try {
      await dbAddStudent(newStudent, newLiaisonEntry, newParentAccount);
    } catch (e) {
      console.error('[Firebase] Error adding student:', e);
    }
  };

  // Callback when teacher deletes a student from data list
  const handleDeleteStudent = async (studentId: string) => {
    try {
      await dbDeleteStudent(studentId);
      if (selectedStudentId === studentId) {
        const updated = students.filter((student) => student.id !== studentId);
        if (updated.length > 0) {
          setSelectedStudentId(updated[0].id);
        } else {
          setSelectedStudentId('');
        }
      }
    } catch (e) {
      console.error('[Firebase] Error deleting student:', e);
    }
  };

  // Callback when teacher changes student attendance manually
  const handleUpdateAttendance = async (studentId: string, status: Student['attendanceToday'], time?: string) => {
    try {
      await dbUpdateAttendance(studentId, status, time);
    } catch (e) {
      console.error('[Firebase] Error updating attendance:', e);
    }
  };

  // Callback when teacher adds a grade
  const handleAddGrade = async (studentId: string, grade: Grade) => {
    try {
      await dbAddGrade(studentId, grade);
    } catch (e) {
      console.error('[Firebase] Error adding grade:', e);
    }
  };

  // Callback when teacher deletes a grade
  const handleDeleteGrade = async (studentId: string, gradeIndex: number) => {
    try {
      await dbDeleteGrade(studentId, gradeIndex);
    } catch (e) {
      console.error('[Firebase] Error deleting grade:', e);
    }
  };

  // Callbacks for counseling records
  const handleAddCounselingRecord = async (record: CounselingRecord) => {
    try {
      await dbAddCounselingRecord({
        ...record,
        schoolId: currentUser?.schoolId || ''
      });
    } catch (e) {
      console.error('[Firebase] Error adding counseling record:', e);
    }
  };

  const handleUpdateCounselingRecord = async (recordId: string, updates: Partial<CounselingRecord>) => {
    try {
      await dbUpdateCounselingRecord(recordId, updates);
    } catch (e) {
      console.error('[Firebase] Error updating counseling record:', e);
    }
  };

  const handleDeleteCounselingRecord = async (recordId: string) => {
    try {
      await dbDeleteCounselingRecord(recordId);
    } catch (e) {
      console.error('[Firebase] Error deleting counseling record:', e);
    }
  };

  // Callback when teacher adds a new announcement
  const handleAddAnnouncement = async (newAnnouncementData: Omit<Announcement, 'id' | 'date'>) => {
    const newAnn: Announcement = {
      ...newAnnouncementData,
      id: `ann-${Date.now()}`,
      date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      schoolId: currentUser?.schoolId || '',
      excerpt: newAnnouncementData.excerpt || ''
    };
    try {
      await dbAddAnnouncement(newAnn);
    } catch (e) {
      console.error('[Firebase] Error adding announcement:', e);
    }
  };

  // Callback when teacher adds a new calendar event (agenda)
  const handleAddCalendarEvent = async (newEventData: Omit<CalendarEvent, 'id'>) => {
    const newEvt: CalendarEvent = {
      ...newEventData,
      id: `event-${Date.now()}`,
      schoolId: currentUser?.schoolId || ''
    };
    try {
      await dbAddCalendarEvent(newEvt);
    } catch (e) {
      console.error('[Firebase] Error adding calendar event:', e);
    }
  };

  // Callback when teacher deletes a calendar event (agenda)
  const handleDeleteCalendarEvent = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus agenda ini?')) {
      try {
        await dbDeleteCalendarEvent(id);
      } catch (e) {
        console.error('[Firebase] Error deleting calendar event:', e);
      }
    }
  };

  // Callback when adding a new Liaison Notebook entry
  const handleAddLiaisonEntry = async (newEntryData: Omit<LiaisonEntry, 'id' | 'lastUpdated'>) => {
    const newEntry: LiaisonEntry = {
      ...newEntryData,
      id: `liaison-${Date.now()}`,
      lastUpdated: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      schoolId: currentUser?.schoolId || ''
    };
    try {
      await dbAddLiaisonEntry(newEntry);
    } catch (e) {
      console.error('[Firebase] Error adding liaison entry:', e);
    }
  };

  // Callback when adding a message to an entry thread
  const handleAddLiaisonReply = async (entryId: string, messageText: string) => {
    if (!currentUser) return;
    const newMsg = {
      id: `msg-${Date.now()}`,
      senderRole: currentUser.role,
      senderName: currentUser.fullName,
      message: messageText,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };
    const lastUpdated = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    try {
      await dbAddLiaisonReply(entryId, newMsg, lastUpdated);
    } catch (e) {
      console.error('[Firebase] Error adding liaison replyMessage:', e);
    }
  };

  // Callback when updating the status of an entry task
  const handleUpdateLiaisonStatus = async (entryId: string, status: LiaisonEntry['status']) => {
    const lastUpdated = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    try {
      await dbUpdateLiaisonStatus(entryId, status, lastUpdated);
    } catch (e) {
      console.error('[Firebase] Error updating liaison status:', e);
    }
  };

  // Callback when deleting a Liaison Notebook entry
  const handleDeleteLiaisonEntry = async (entryId: string) => {
    try {
      await dbDeleteLiaisonEntry(entryId);
    } catch (e) {
      console.error('[Firebase] Error deleting liaison entry:', e);
    }
  };

  // Callback when parent pays an unpaid bill
  const handlePayBill = async (studentId: string, billId: string) => {
    const paidAt = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    try {
      await dbPayBill(studentId, billId, paidAt, 'Transfer M-Banking');
    } catch (e) {
      console.error('[Firebase] Error paying bill:', e);
    }
  };

  // Callback when teacher adds a new bill for the entire class
  const handleAddClassBill = async (billTemplate: Omit<Bill, 'id'>) => {
    try {
      const targetClass = activeTeacherClass || currentUser?.className || 'TK-A';
      await dbCreateClassBill(targetClass, billTemplate, currentUser?.schoolId || '');
    } catch (e) {
      console.error('[Firebase] Error adding class bill:', e);
    }
  };

  // Callback when teacher adds a new bill for a single student
  const handleAddStudentBill = async (studentId: string, billTemplate: Omit<Bill, 'id'>) => {
    try {
      await dbCreateStudentBill(studentId, billTemplate);
    } catch (e) {
      console.error('[Firebase] Error adding student bill:', e);
    }
  };

  // Callback when teacher approves or rejects a pending bill payment
  const handleVerifyPayment = async (studentId: string, billId: string, approve: boolean) => {
    try {
      await dbVerifyBillPayment(studentId, billId, approve);
    } catch (e) {
      console.error('[Firebase] Error verifying payment:', e);
    }
  };

  // Simulated notification counts
  const pendingApprovalCount = permits.filter((p) => p.status === 'Pending').length;

  // Intercept for Duitku payment simulator screen
  const queryParams = new URLSearchParams(window.location.search);
  const isSimulator = window.location.pathname === '/duitku-simulator' || queryParams.has('merchantOrderId');

  if (isSimulator) {
    return (
      <DuitkuSimulator
        onBackToApp={() => {
          window.location.href = '/';
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col antialiased selection:bg-brand-accent selection:text-white">
      

      {/* Main Sandbox Layout with Full Width Container */}
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col bg-white shadow-sm relative min-h-screen">
        
        {/* Top Header Information Bar */}
        <div className="bg-brand-blue text-white px-6 py-2.5 flex items-center justify-between text-xs font-semibold tracking-tight shrink-0 relative z-40 shadow-sm">
          <span className="flex items-center gap-1.5 font-display font-bold uppercase tracking-wider text-[10px] text-sky-200">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            {activeRole === 'superadmin' 
              ? 'EduConnect Super Admin Global' 
              : activeRole === 'yayasan'
              ? 'EduConnect Portal Yayasan'
              : 'EduConnect TK Mutiara Bangsa'}
          </span>
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span>Sistem Aktif • {timeString}</span>
          </div>
        </div>

        {/* Simulated App Content with Staggered Animations */}
        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] focus:outline-none pb-20">
              <AnimatePresence mode="wait">
                {!currentUser ? (
                  <motion.div
                    key="auth-screen"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="h-full"
                  >
                    <AuthScreen students={students} onLoginSuccess={handleLoginSuccess} />
                  </motion.div>
                ) : activeRole === 'superadmin' ? (
                  /* SUPER ADMIN PORTAL */
                  <motion.div
                    key="superadmin-portal"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="h-full"
                  >
                    <SuperAdminDashboard onLogout={handleLogout} adminName={currentUser.fullName} />
                  </motion.div>
                ) : activeRole === 'yayasan' ? (
                  /* YAYASAN PORTAL */
                  <motion.div
                    key="yayasan-portal"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="h-full"
                  >
                    <YayasanDashboard currentUser={currentUser} onLogout={handleLogout} />
                  </motion.div>
                ) : activeRole === 'parent' ? (() => {
                  const activeParentStudent = students.find((s) => s.id === selectedStudentId);
                  const activeParentStudentClass = activeParentStudent?.class;
                  const activeParentStudentTeacher = teachers.find((t) => t.className === activeParentStudentClass);
                  const resolvedTeacherName = activeParentStudentTeacher?.fullName || 'Wali Kelas';
                  return (
                    /* PARENT PORTAL */
                    <motion.div
                      key="parent-portal"
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 15 }}
                      className="h-full"
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        {parentTab === 'home' && (
                          <motion.div
                            key="parent-home"
                            initial={{ opacity: 0, x: parentDirection * 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -parentDirection * 30 }}
                            transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
                          >
                            <ParentDashboard
                              students={students}
                              selectedStudentId={selectedStudentId}
                              onSelectStudent={setSelectedStudentId}
                              onGoToPermit={() => handleParentTabChange('permit')}
                              onGoToPresensi={() => handleParentTabChange('presensi')}
                              onGoToKonseling={() => handleParentTabChange('konseling')}
                              calendarEvents={calendarEvents.filter(e => e.visibility !== 'teacher')}
                              announcements={announcements}
                              permits={permits}
                              onPayBill={handlePayBill}
                              parentName={currentUser.fullName}
                              onUpdateAttendance={handleUpdateAttendance}
                              schoolLogoUrl={currentSchool?.logoUrl}
                              schoolName={currentSchool?.name}
                            />
                          </motion.div>
                        )}

                        {parentTab === 'permit' && (
                          <motion.div
                            key="parent-permit"
                            initial={{ opacity: 0, x: parentDirection * 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -parentDirection * 30 }}
                            transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
                          >
                            <EPermitForm
                              student={students.find((s) => s.id === selectedStudentId) || students[0]}
                              onBack={() => handleParentTabChange('home')}
                              onSubmitPermit={handleSubmitPermit}
                              teacherName={resolvedTeacherName}
                            />
                          </motion.div>
                        )}

                        {parentTab === 'profil' && (
                          <motion.div
                            key="parent-profil"
                            initial={{ opacity: 0, x: parentDirection * 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -parentDirection * 30 }}
                            transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
                            className="p-6 space-y-6 pt-8"
                          >
                            <div className="text-center space-y-3">
                              <div className="w-20 h-20 bg-brand-blue text-white rounded-full mx-auto flex items-center justify-center font-display font-black text-2xl shadow-md uppercase">
                                {currentUser.fullName.slice(0, 2)}
                              </div>
                              <div>
                                <h3 className="font-display font-black text-slate-800 text-base">{currentUser.fullName}</h3>
                                <span className="text-xs bg-blue-100 text-brand-blue font-bold px-2.5 py-1 rounded-full uppercase mt-1 inline-block">
                                  Wali Murid
                                </span>
                              </div>
                            </div>

                            <div className="bg-white rounded-3xl p-5 border border-slate-100 custom-shadow space-y-3">
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detail Akun</h4>
                              <div className="space-y-2 text-xs font-semibold">
                                <div className="flex justify-between border-b border-slate-50 pb-2">
                                  <span className="text-slate-400">Username / Email</span>
                                  <span className="text-slate-700">{currentUser.email}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-50 pb-2">
                                  <span className="text-slate-400">Anak Terhubung</span>
                                  <span className="text-slate-700 uppercase">
                                    {students.find((s) => s.id === selectedStudentId)?.name || 'Rian Hidayat'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Sekolah</span>
                                  <span className="text-slate-700">TK Mutiara Bangsa</span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={handleLogout}
                              className="w-full bg-red-500 hover:bg-red-600 text-white font-display font-bold text-xs py-3 rounded-2xl shadow-lg transition-colors flex items-center justify-center gap-2"
                              id="parent-logout-btn"
                            >
                              Keluar dari Akun
                            </button>
                          </motion.div>
                        )}

                        {parentTab === 'presensi' && (
                          <motion.div
                            key="parent-presensi"
                            initial={{ opacity: 0, x: parentDirection * 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -parentDirection * 30 }}
                            transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
                          >
                            <ParentAttendanceTab
                              student={students.find((s) => s.id === selectedStudentId) || students[0]}
                              permits={permits}
                              onUpdateAttendance={handleUpdateAttendance}
                              onGoToPermit={() => handleParentTabChange('permit')}
                            />
                          </motion.div>
                        )}

                        {parentTab === 'akademik' && (
                          <motion.div
                            key="parent-akademik"
                            initial={{ opacity: 0, x: parentDirection * 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -parentDirection * 30 }}
                            transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
                            className="p-6"
                          >
                            <ParentAcademicTab
                              student={students.find((s) => s.id === selectedStudentId) || students[0]}
                              calendarEvents={calendarEvents}
                              teacherName={resolvedTeacherName}
                            />
                          </motion.div>
                        )}

                        {parentTab === 'pesan' && (
                          <motion.div
                            key="parent-pesan"
                            initial={{ opacity: 0, x: parentDirection * 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -parentDirection * 30 }}
                            transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
                            className="p-6"
                          >
                            <LiaisonNotebook
                              currentUser={currentUser}
                              students={students}
                              selectedStudentId={selectedStudentId}
                              entries={liaisonEntries}
                              onAddEntry={handleAddLiaisonEntry}
                              onAddReply={handleAddLiaisonReply}
                              onUpdateStatus={handleUpdateLiaisonStatus}
                              onDeleteEntry={handleDeleteLiaisonEntry}
                            />
                          </motion.div>
                        )}

                        {parentTab === 'konseling' && (
                          <motion.div
                            key="parent-konseling"
                            initial={{ opacity: 0, x: parentDirection * 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -parentDirection * 30 }}
                            transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
                            className="p-6"
                          >
                            <ParentCounselingTab
                              student={students.find((s) => s.id === selectedStudentId) || students[0]}
                              counselingRecords={counselingRecords}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })() : (() => {
                  const teacherClasses = currentUser?.className ? currentUser.className.split(',').map(c => c.trim()) : [];
                  return (
                    /* TEACHER PORTAL */
                    <motion.div
                      key="teacher-portal"
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -15 }}
                      className="h-full"
                    >
                      {currentUser && teacherClasses.length > 1 && (
                        <div className="sticky top-0 z-40 bg-white border-b border-slate-100 px-5 py-3 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-brand-blue animate-pulse"></span>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Pilih Kelas:</span>
                          </div>
                          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                            {teacherClasses.map((cls) => (
                              <button
                                key={cls}
                                onClick={() => setActiveTeacherClass(cls)}
                                className={`px-3 py-1 rounded-xl text-[10px] font-black transition-all uppercase whitespace-nowrap ${
                                  activeTeacherClass === cls
                                    ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/20 scale-105'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                }`}
                              >
                                {cls}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <AnimatePresence mode="wait" initial={false}>
                      {teacherTab === 'home' && (
                        <motion.div
                          key="teacher-home"
                          initial={{ opacity: 0, x: teacherDirection * 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -teacherDirection * 30 }}
                          transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
                        >
                          <TeacherDashboard
                            students={students}
                            permits={permits}
                            onGoToApproval={() => handleTeacherTabChange('approval')}
                            onGoToKonseling={() => handleTeacherTabChange('konseling')}
                            onGoToFinances={() => handleTeacherTabChange('keuangan')}
                            onUpdateAttendance={handleUpdateAttendance}
                            onAddGrade={handleAddGrade}
                            teacherName={currentUser.fullName}
                            className={activeTeacherClass || currentUser.className || 'TK-A'}
                            calendarEvents={calendarEvents}
                            onAddCalendarEvent={handleAddCalendarEvent}
                            onDeleteCalendarEvent={handleDeleteCalendarEvent}
                            announcements={announcements}
                            onAddAnnouncement={handleAddAnnouncement}
                            onAddStudent={handleAddStudent}
                            onDeleteStudent={handleDeleteStudent}
                            schoolLogoUrl={currentSchool?.logoUrl}
                            schoolName={currentSchool?.name}
                          />
                        </motion.div>
                      )}

                      {teacherTab === 'approval' && (
                        <motion.div
                          key="teacher-approval"
                          initial={{ opacity: 0, x: teacherDirection * 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -teacherDirection * 30 }}
                          transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
                        >
                          <ApprovalScreen
                            permits={permits}
                            onBack={() => handleTeacherTabChange('home')}
                            onApprove={handleApprovePermit}
                            onReject={handleRejectPermit}
                          />
                        </motion.div>
                      )}

                      {teacherTab === 'keuangan' && (
                        <motion.div
                          key="teacher-keuangan"
                          initial={{ opacity: 0, x: teacherDirection * 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -teacherDirection * 30 }}
                          transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
                        >
                          <div className="flex items-center px-4 pt-4">
                            <button
                              onClick={() => handleTeacherTabChange('home')}
                              className="text-slate-400 hover:text-slate-600 font-bold text-xs flex items-center gap-1 focus:outline-none"
                            >
                              &larr; Kembali ke Beranda
                            </button>
                          </div>
                          <TeacherFinancesTab
                            students={students}
                            onAddClassBill={handleAddClassBill}
                            onAddStudentBill={handleAddStudentBill}
                            onVerifyPayment={handleVerifyPayment}
                            className={activeTeacherClass || currentUser.className || 'TK-A'}
                            teacherName={currentUser.fullName}
                          />
                        </motion.div>
                      )}

                      {teacherTab === 'profil' && (
                        <motion.div
                          key="teacher-profil"
                          initial={{ opacity: 0, x: teacherDirection * 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -teacherDirection * 30 }}
                          transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
                          className="p-6 space-y-6 pt-8"
                        >
                          <div className="text-center space-y-3">
                            <div className="w-20 h-20 bg-amber-500 text-white rounded-full mx-auto flex items-center justify-center font-display font-black text-2xl shadow-md uppercase">
                              {currentUser.fullName.slice(0, 2)}
                            </div>
                            <div>
                              <h3 className="font-display font-black text-slate-800 text-base">{currentUser.fullName}</h3>
                              <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2.5 py-1 rounded-full uppercase mt-1 inline-block">
                                Wali Kelas / Guru
                              </span>
                            </div>
                          </div>

                          <div className="bg-white rounded-3xl p-5 border border-slate-100 custom-shadow space-y-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detail Akun</h4>
                            <div className="space-y-2 text-xs font-semibold">
                              <div className="flex justify-between border-b border-slate-50 pb-2">
                                <span className="text-slate-400">Username / Email</span>
                                <span className="text-slate-700">{currentUser.email}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-50 pb-2">
                                <span className="text-slate-400">Kelas Diampu</span>
                                <span className="text-slate-700">{currentUser.className || 'TK-A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Instansi</span>
                                <span className="text-slate-700">TK Mutiara Bangsa</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={handleLogout}
                            className="w-full bg-red-500 hover:bg-red-600 text-white font-display font-bold text-xs py-3 rounded-2xl shadow-lg transition-colors flex items-center justify-center gap-2"
                            id="teacher-logout-btn"
                          >
                            Keluar dari Akun
                          </button>
                        </motion.div>
                      )}

                      {teacherTab === 'presensi' && (
                        <motion.div
                          key="teacher-presensi"
                          initial={{ opacity: 0, x: teacherDirection * 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -teacherDirection * 30 }}
                          transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
                          className="p-6"
                        >
                          <TeacherAttendanceTab
                            students={students}
                            onUpdateAttendance={handleUpdateAttendance}
                            className={activeTeacherClass || currentUser?.className || 'TK-A'}
                          />
                        </motion.div>
                      )}

                      {teacherTab === 'akademik' && (
                        <motion.div
                          key="teacher-akademik"
                          initial={{ opacity: 0, x: teacherDirection * 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -teacherDirection * 30 }}
                          transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
                          className="p-6"
                        >
                          <TeacherAcademicTab
                            students={students}
                            onAddGrade={handleAddGrade}
                            onDeleteGrade={handleDeleteGrade}
                            className={activeTeacherClass || currentUser?.className || 'TK-A'}
                          />
                        </motion.div>
                      )}

                      {teacherTab === 'pesan' && (
                        <motion.div
                          key="teacher-pesan"
                          initial={{ opacity: 0, x: teacherDirection * 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -teacherDirection * 30 }}
                          transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
                          className="p-6"
                        >
                          <LiaisonNotebook
                            currentUser={currentUser}
                            students={students}
                            entries={liaisonEntries}
                            onAddEntry={handleAddLiaisonEntry}
                            onAddReply={handleAddLiaisonReply}
                            onUpdateStatus={handleUpdateLiaisonStatus}
                            onDeleteEntry={handleDeleteLiaisonEntry}
                            activeClassName={activeTeacherClass || currentUser?.className || 'TK-A'}
                          />
                        </motion.div>
                      )}

                      {teacherTab === 'konseling' && (
                        <motion.div
                          key="teacher-konseling"
                          initial={{ opacity: 0, x: teacherDirection * 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -teacherDirection * 30 }}
                          transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
                          className="p-6"
                        >
                          <TeacherCounselingTab
                            students={students}
                            counselingRecords={counselingRecords}
                            onAddRecord={handleAddCounselingRecord}
                            onUpdateRecord={handleUpdateCounselingRecord}
                            onDeleteRecord={handleDeleteCounselingRecord}
                            className={activeTeacherClass || currentUser?.className || 'TK-A'}
                            teacherName={currentUser?.fullName || 'Pak Budi'}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })()}
              </AnimatePresence>
            </div>

            {/* Bottom Navigation Bar - Fixed/Sticky at the bottom */}
            {currentUser && (activeRole === 'parent' || activeRole === 'teacher') && (
              <div className="bg-white border-t border-slate-100 px-6 py-3.5 flex items-center justify-between text-slate-400 shrink-0 sticky bottom-0 z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
                {activeRole === 'parent' ? (
                  <>
                    <button
                      onClick={() => handleParentTabChange('home')}
                      className={`flex flex-col items-center gap-1 focus:outline-none ${parentTab === 'home' ? 'text-brand-blue font-bold scale-105' : 'hover:text-slate-600'}`}
                      id="parent-nav-home"
                    >
                      <Home size={20} className={parentTab === 'home' ? 'stroke-[2.5px]' : 'stroke-2'} />
                      <span className="text-[9px] tracking-tight">Home</span>
                    </button>
 
                    <button
                      onClick={() => handleParentTabChange('presensi')}
                      className={`flex flex-col items-center gap-1 focus:outline-none ${parentTab === 'presensi' ? 'text-brand-blue font-bold scale-105' : 'hover:text-slate-600'}`}
                      id="parent-nav-presensi"
                    >
                      <CheckCircle2 size={20} className={parentTab === 'presensi' ? 'stroke-[2.5px]' : 'stroke-2'} />
                      <span className="text-[9px] tracking-tight">Presensi</span>
                    </button>
 
                    <button
                      onClick={() => handleParentTabChange('akademik')}
                      className={`flex flex-col items-center gap-1 focus:outline-none ${parentTab === 'akademik' ? 'text-brand-blue font-bold scale-105' : 'hover:text-slate-600'}`}
                      id="parent-nav-akademik"
                    >
                      <GraduationCap size={20} className={parentTab === 'akademik' ? 'stroke-[2.5px]' : 'stroke-2'} />
                      <span className="text-[9px] tracking-tight">Akademik</span>
                    </button>
 
                    <button
                      onClick={() => handleParentTabChange('pesan')}
                      className={`flex flex-col items-center gap-1 focus:outline-none ${parentTab === 'pesan' ? 'text-brand-blue font-bold scale-105' : 'hover:text-slate-600'}`}
                      id="parent-nav-pesan"
                    >
                      <BookOpen size={20} className={parentTab === 'pesan' ? 'stroke-[2.5px]' : 'stroke-2'} />
                      <span className="text-[9px] tracking-tight">Penghubung</span>
                    </button>
 
                    <button
                      onClick={() => handleParentTabChange('profil')}
                      className={`flex flex-col items-center gap-1 focus:outline-none ${parentTab === 'profil' ? 'text-brand-blue font-bold scale-105' : 'hover:text-slate-600'}`}
                      id="parent-nav-profil"
                    >
                      <User size={20} className={parentTab === 'profil' ? 'stroke-[2.5px]' : 'stroke-2'} />
                      <span className="text-[9px] tracking-tight">Profil</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleTeacherTabChange('home')}
                      className={`flex flex-col items-center gap-1 focus:outline-none ${teacherTab === 'home' || teacherTab === 'approval' ? 'text-brand-blue font-bold scale-105' : 'hover:text-slate-600'}`}
                      id="teacher-nav-home"
                    >
                      <Home size={20} className={teacherTab === 'home' || teacherTab === 'approval' ? 'stroke-[2.5px]' : 'stroke-2'} />
                      <span className="text-[9px] tracking-tight">Home</span>
                    </button>
 
                    <button
                      onClick={() => handleTeacherTabChange('presensi')}
                      className={`flex flex-col items-center gap-1 focus:outline-none ${teacherTab === 'presensi' ? 'text-brand-blue font-bold scale-105' : 'hover:text-slate-600'}`}
                      id="teacher-nav-presensi"
                    >
                      <CheckCircle2 size={20} className={teacherTab === 'presensi' ? 'stroke-[2.5px]' : 'stroke-2'} />
                      <span className="text-[9px] tracking-tight">Presensi</span>
                    </button>
 
                    <button
                      onClick={() => handleTeacherTabChange('akademik')}
                      className={`flex flex-col items-center gap-1 focus:outline-none ${teacherTab === 'akademik' ? 'text-brand-blue font-bold scale-105' : 'hover:text-slate-600'}`}
                      id="teacher-nav-akademik"
                    >
                      <GraduationCap size={20} className={teacherTab === 'akademik' ? 'stroke-[2.5px]' : 'stroke-2'} />
                      <span className="text-[9px] tracking-tight">Akademik</span>
                    </button>
 
                    <button
                      onClick={() => handleTeacherTabChange('pesan')}
                      className={`flex flex-col items-center gap-1 focus:outline-none ${teacherTab === 'pesan' ? 'text-brand-blue font-bold scale-105' : 'hover:text-slate-600'}`}
                      id="teacher-nav-pesan"
                    >
                      <BookOpen size={20} className={teacherTab === 'pesan' ? 'stroke-[2.5px]' : 'stroke-2'} />
                      <span className="text-[9px] tracking-tight">Penghubung</span>
                    </button>
 
                    <button
                      onClick={() => handleTeacherTabChange('profil')}
                      className={`flex flex-col items-center gap-1 focus:outline-none ${teacherTab === 'profil' ? 'text-brand-blue font-bold scale-105' : 'hover:text-slate-600'}`}
                      id="teacher-nav-profil"
                    >
                      <User size={20} className={teacherTab === 'profil' ? 'stroke-[2.5px]' : 'stroke-2'} />
                      <span className="text-[9px] tracking-tight">Profil</span>
                    </button>
                  </>
                )}
              </div>
            )}

        </div>



    </div>
  );
}
