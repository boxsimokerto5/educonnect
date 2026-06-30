import React, { useState, useEffect, useRef } from 'react';
import { Student, EPermit, Grade, CalendarEvent, Announcement, User as AuthUser, LiaisonEntry, CounselingRecord, Bill, School, AppNotification } from './types';
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
import SplashScreen from './components/SplashScreen';
import OnboardingScreen from './components/OnboardingScreen';
import AdBanner from './components/AdBanner';
import { sendNativeNotification, playNotificationChime } from './utils/notifications';
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
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
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
  dbCreateStudentBill,
  dbAddNotification,
  dbMarkNotificationAsRead,
  dbMarkAllNotificationsAsRead,
  dbDeleteNotification
} from './firebase';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Live local/web notifications state
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; body: string }>>([]);
  const [dbNotifications, setDbNotifications] = useState<AppNotification[]>([]);

  // Use refs to track previous states for change detection to avoid double firing & spamming on initial loads
  const prevPermitsRef = useRef<EPermit[]>([]);
  const prevLiaisonRef = useRef<LiaisonEntry[]>([]);
  const prevStudentsRef = useRef<Student[]>([]);
  const prevAnnouncementsRef = useRef<Announcement[]>([]);
  const prevNotificationsRef = useRef<AppNotification[]>([]);

  const triggerInAppNotification = (title: string, body: string) => {
    // 1. Trigger native push notification & play the lovely Audio chime
    sendNativeNotification(title, body);

    // 2. Add to local UI notification list
    const newNotif = {
      id: 'notif-' + Math.random().toString(36).substring(2, 11),
      title,
      body
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Auto-remove after 6 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
    }, 6000);
  };
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
  const [initialKeuanganTab, setInitialKeuanganTab] = useState<'approval' | 'create' | 'status' | 'savings'>('approval');
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

  const handleTeacherTabChange = (
    newTab: 'home' | 'approval' | 'presensi' | 'akademik' | 'pesan' | 'profil' | 'konseling' | 'keuangan',
    subTab?: 'approval' | 'create' | 'status' | 'savings'
  ) => {
    const teacherTabOrder = ['home', 'approval', 'presensi', 'akademik', 'pesan', 'profil', 'konseling', 'keuangan'];
    const currentIdx = teacherTabOrder.indexOf(teacherTab);
    const newIdx = teacherTabOrder.indexOf(newTab);
    setTeacherDirection(newIdx >= currentIdx ? 1 : -1);
    setTeacherTab(newTab);
    if (subTab) {
      setInitialKeuanganTab(subTab);
    } else if (newTab === 'keuangan') {
      setInitialKeuanganTab('approval');
    }
  };

  const handleNotificationNavigation = (type: string, relatedId?: string) => {
    if (!currentUser) return;
    
    if (currentUser.role === 'parent') {
      switch (type) {
        case 'announcement':
          handleParentTabChange('home');
          break;
        case 'permit':
          handleParentTabChange('permit');
          break;
        case 'liaison':
          handleParentTabChange('pesan');
          break;
        case 'grade':
          handleParentTabChange('akademik');
          break;
        case 'attendance':
          handleParentTabChange('presensi');
          break;
        case 'counseling':
          handleParentTabChange('konseling');
          break;
        case 'spp':
        case 'keuangan':
          handleParentTabChange('home');
          break;
        default:
          handleParentTabChange('home');
      }
    } else if (currentUser.role === 'teacher') {
      switch (type) {
        case 'announcement':
          handleTeacherTabChange('home');
          break;
        case 'permit':
          handleTeacherTabChange('approval');
          break;
        case 'liaison':
          handleTeacherTabChange('pesan');
          break;
        case 'grade':
          handleTeacherTabChange('akademik');
          break;
        case 'attendance':
          handleTeacherTabChange('presensi');
          break;
        case 'counseling':
          handleTeacherTabChange('konseling');
          break;
        case 'spp':
        case 'keuangan':
          handleTeacherTabChange('keuangan', 'approval');
          break;
        default:
          handleTeacherTabChange('home');
      }
    }
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

  // Auto-archive student attendance history after 18:00 (6:00 PM)
  useEffect(() => {
    if (students.length === 0) return;

    const checkAndArchiveAttendance = async () => {
      const now = new Date();
      const currentHour = now.getHours();

      // Only archive after 18:00 (6 PM) local time
      if (currentHour >= 18) {
        const todayFormatted = now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });

        for (const student of students) {
          // If the student has today's attendance filled (not BELUM ABSEN)
          if (student.attendanceToday && student.attendanceToday !== 'BELUM ABSEN') {
            const history = student.attendanceHistory || [];
            const alreadyArchived = history.some((log) => log.date === todayFormatted);

            if (!alreadyArchived) {
              console.log(`[Auto-Archive] Archiving attendance for ${student.name} on ${todayFormatted}`);
              const newLog = {
                date: todayFormatted,
                status: student.attendanceToday,
                time: student.attendanceTime || (student.attendanceToday === 'HADIR' ? '07:15 WIB' : '-')
              };
              const updatedHistory = [newLog, ...history];

              try {
                const stdRef = doc(db, 'students', student.id);
                await updateDoc(stdRef, {
                  attendanceHistory: updatedHistory,
                  attendanceToday: 'BELUM ABSEN',
                  attendanceTime: null
                });
              } catch (error) {
                console.error(`[Auto-Archive] Failed to archive attendance for ${student.name}:`, error);
              }
            }
          }
        }
      }
    };

    // Run when students list loads or updates
    checkAndArchiveAttendance();

    // Check periodically (every 1 minute)
    const interval = setInterval(checkAndArchiveAttendance, 60000);
    return () => clearInterval(interval);
  }, [students]);

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

        if (prevStudentsRef.current.length > 0) {
          list.forEach((student) => {
            const prevStudent = prevStudentsRef.current.find(s => s.id === student.id);
            if (prevStudent) {
              // Check bills status changes
              const prevBills = prevStudent.sppBills || [];
              const currentBills = student.sppBills || [];

              currentBills.forEach((bill) => {
                const prevBill = prevBills.find(b => b.id === bill.id);
                if (!prevBill) {
                  if (currentUser?.role === 'parent' && currentUser.studentId === student.id) {
                    triggerInAppNotification(
                      'Tagihan Baru Diterbitkan',
                      `Tagihan "${bill.title}" sebesar Rp ${bill.amount.toLocaleString('id-ID')} telah diterbitkan.`
                    );
                  }
                } else if (prevBill.status !== bill.status) {
                  if (bill.status === 'Pending') {
                    if (currentUser?.role === 'teacher') {
                      const isMyClass = !currentUser.className || currentUser.className === student.class;
                      if (isMyClass) {
                        triggerInAppNotification(
                          'Bukti Pembayaran SPP',
                          `Wali murid ${student.name} mengunggah bukti pembayaran untuk "${bill.title}".`
                        );
                      }
                    }
                  } else if (bill.status === 'Paid') {
                    if (currentUser?.role === 'parent' && currentUser.studentId === student.id) {
                      triggerInAppNotification(
                        'Pembayaran SPP Disetujui',
                        `Pembayaran untuk "${bill.title}" telah diverifikasi dan dinyatakan LUNAS.`
                      );
                    }
                  }
                }
              });

              // Check grades added
              const prevGrades = prevStudent.grades || [];
              const currentGrades = student.grades || [];
              if (currentGrades.length > prevGrades.length) {
                const latestGrade = currentGrades[0];
                if (currentUser?.role === 'parent' && currentUser.studentId === student.id) {
                  triggerInAppNotification(
                    'Nilai Akademik Baru',
                    `Nilai ${latestGrade.type} untuk mata pelajaran ${latestGrade.subject} telah dimasukkan: ${latestGrade.score}/${latestGrade.maxScore}.`
                  );
                }
              }

              // Check attendance updates
              if (prevStudent.attendanceToday !== student.attendanceToday && student.attendanceToday !== 'BELUM ABSEN') {
                if (currentUser?.role === 'parent' && currentUser.studentId === student.id) {
                  triggerInAppNotification(
                    'Status Presensi Hari Ini',
                    `Presensi ${student.name} diperbarui menjadi: ${student.attendanceToday} ${student.attendanceTime ? `(${student.attendanceTime})` : ''}`
                  );
                }
              }
            }
          });
        }
        prevStudentsRef.current = list;

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

        if (prevPermitsRef.current.length > 0) {
          list.forEach((permit) => {
            const prevPermit = prevPermitsRef.current.find(p => p.id === permit.id);
            if (!prevPermit) {
              if (currentUser?.role === 'teacher' && permit.status === 'Pending') {
                const isMyClass = !currentUser.className || currentUser.className === permit.className;
                if (isMyClass) {
                  triggerInAppNotification(
                    'Pengajuan Izin Online',
                    `${permit.studentName} mengajukan izin ${permit.type} untuk tanggal ${permit.startDate}.`
                  );
                }
              }
            } else if (prevPermit.status !== permit.status) {
              if (currentUser?.role === 'parent' && currentUser.studentId === permit.studentId) {
                triggerInAppNotification(
                  'Status Izin Online Diperbarui',
                  `Pengajuan izin untuk ${permit.studentName} telah ${permit.status === 'Approved' ? 'DISETUJUI' : 'DITOLAK'} oleh guru.`
                );
              }
            }
          });
        }
        prevPermitsRef.current = list;

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

        if (prevAnnouncementsRef.current.length > 0) {
          list.forEach((announcement) => {
            const prevAnn = prevAnnouncementsRef.current.find(a => a.id === announcement.id);
            if (!prevAnn) {
              if (currentUser?.role === 'parent' || currentUser?.role === 'teacher') {
                triggerInAppNotification(
                  'Pengumuman Sekolah Baru',
                  announcement.title
                );
              }
            }
          });
        }
        prevAnnouncementsRef.current = list;

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

        if (prevLiaisonRef.current.length > 0) {
          list.forEach((entry) => {
            const prevEntry = prevLiaisonRef.current.find(e => e.id === entry.id);
            if (prevEntry) {
              const prevMsgs = prevEntry.messages || [];
              const currentMsgs = entry.messages || [];
              if (currentMsgs.length > prevMsgs.length) {
                const latestMsg = currentMsgs[currentMsgs.length - 1];
                if (currentUser?.role === 'teacher' && latestMsg.senderRole === 'parent') {
                  const isMyClass = !currentUser.className || currentUser.className === entry.className;
                  if (isMyClass) {
                    triggerInAppNotification(
                      `Pesan Buku Penghubung - ${entry.studentName}`,
                      latestMsg.message
                    );
                  }
                } else if (currentUser?.role === 'parent' && latestMsg.senderRole === 'teacher' && currentUser.studentId === entry.studentId) {
                  triggerInAppNotification(
                    'Balasan Buku Penghubung',
                    latestMsg.message
                  );
                }
              }
            }
          });
        }
        prevLiaisonRef.current = list;

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

    // Listen to notifications real-time
    const unsubNotifications = onSnapshot(
      query(collection(db, 'notifications'), where('schoolId', '==', schoolId)),
      (snapshot) => {
        const list: AppNotification[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as AppNotification);
        });
        // Sort by createdAt descending
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (prevNotificationsRef.current.length > 0) {
          list.forEach((notif) => {
            const alreadyExists = prevNotificationsRef.current.some(n => n.id === notif.id);
            if (!alreadyExists) {
              const isRelevant = 
                notif.userId === currentUser?.id ||
                (notif.studentId && notif.studentId === currentUser?.studentId) ||
                (notif.className && currentUser?.className && currentUser.className.split(',').map(c => c.trim()).includes(notif.className)) ||
                notif.role === currentUser?.role ||
                notif.role === 'all';

              if (isRelevant) {
                try {
                  playNotificationChime();
                } catch (e) {}
                triggerInAppNotification(notif.title, notif.body);
              }
            }
          });
        }
        prevNotificationsRef.current = list;
        setDbNotifications(list);
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
      unsubNotifications();
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
      await dbAddNotification({
        schoolId: currentUser?.schoolId || '',
        title: 'Pengajuan Izin Online Baru',
        body: `${newPermit.studentName} mengajukan izin ${newPermit.type} untuk tanggal ${newPermit.startDate}.`,
        type: 'permit',
        className: newPermit.className,
        role: 'teacher',
        studentId: newPermit.studentId,
        relatedId: newPermit.id
      });
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
      await dbAddNotification({
        schoolId: currentUser?.schoolId || '',
        title: 'Pengajuan Izin Disetujui',
        body: `Pengajuan izin ${permit.type} untuk ${permit.studentName} telah disetujui oleh wali kelas.`,
        type: 'permit',
        studentId: permit.studentId,
        role: 'parent',
        relatedId: permitId
      });
    } catch (e) {
      console.error('[Firebase] Error approving permit:', e);
    }
  };

  // Callback when teacher rejects a permit
  const handleRejectPermit = async (permitId: string) => {
    const permit = permits.find((p) => p.id === permitId);
    if (!permit) return;
    try {
      await dbRejectPermit(permitId);
      await dbAddNotification({
        schoolId: currentUser?.schoolId || '',
        title: 'Pengajuan Izin Ditolak',
        body: `Pengajuan izin ${permit.type} untuk ${permit.studentName} telah ditolak oleh wali kelas.`,
        type: 'permit',
        studentId: permit.studentId,
        role: 'parent',
        relatedId: permitId
      });
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
      attendanceHistory: [],
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
      const student = students.find((s) => s.id === studentId);
      if (student && status !== 'BELUM ABSEN') {
        await dbAddNotification({
          schoolId: currentUser?.schoolId || '',
          title: 'Presensi Harian Siswa',
          body: `Presensi ${student.name} hari ini diperbarui menjadi: ${status} ${time ? `(${time})` : ''}.`,
          type: 'attendance',
          studentId: studentId,
          role: 'parent'
        });
      }
    } catch (e) {
      console.error('[Firebase] Error updating attendance:', e);
    }
  };

  // Callback when teacher adds a grade
  const handleAddGrade = async (studentId: string, grade: Grade) => {
    try {
      await dbAddGrade(studentId, grade);
      const student = students.find((s) => s.id === studentId);
      if (student) {
        await dbAddNotification({
          schoolId: currentUser?.schoolId || '',
          title: 'Nilai Akademik Baru',
          body: `Nilai ${grade.type} untuk mata pelajaran ${grade.subject} telah dimasukkan: ${grade.score}/${grade.maxScore}.`,
          type: 'grade',
          studentId: studentId,
          role: 'parent'
        });
      }
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
      if (record.status === 'Terpublikasi') {
        await dbAddNotification({
          schoolId: currentUser?.schoolId || '',
          title: 'Catatan Perkembangan Siswa',
          body: `Wali kelas mempublikasikan catatan baru untuk ${record.studentName}: "${record.title}".`,
          type: 'counseling',
          studentId: record.studentId,
          role: 'parent',
          relatedId: record.id
        });
      }
    } catch (e) {
      console.error('[Firebase] Error adding counseling record:', e);
    }
  };

  const handleUpdateCounselingRecord = async (recordId: string, updates: Partial<CounselingRecord>) => {
    try {
      await dbUpdateCounselingRecord(recordId, updates);
      if (updates.status === 'Terpublikasi') {
        const record = counselingRecords.find((r) => r.id === recordId);
        if (record) {
          await dbAddNotification({
            schoolId: currentUser?.schoolId || '',
            title: 'Catatan Perkembangan Siswa',
            body: `Wali kelas mempublikasikan catatan baru untuk ${record.studentName}: "${record.title}".`,
            type: 'counseling',
            studentId: record.studentId,
            role: 'parent',
            relatedId: recordId
          });
        }
      }
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
      await dbAddNotification({
        schoolId: currentUser?.schoolId || '',
        title: 'Pengumuman Sekolah Baru',
        body: newAnn.title,
        type: 'announcement',
        role: 'all',
        relatedId: newAnn.id
      });
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
      await dbAddNotification({
        schoolId: currentUser?.schoolId || '',
        title: 'Agenda Sekolah Baru',
        body: `Agenda "${newEvt.title}" telah ditambahkan untuk tanggal ${newEvt.date}.`,
        type: 'calendar',
        role: newEvt.visibility === 'teacher' ? 'teacher' : 'all',
        relatedId: newEvt.id
      });
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
      await dbAddNotification({
        schoolId: currentUser?.schoolId || '',
        title: 'Buku Penghubung Baru',
        body: `Wali kelas membuat catatan Buku Penghubung baru untuk ${newEntry.studentName}: ${newEntry.taskTitle}.`,
        type: 'liaison',
        studentId: newEntry.studentId,
        role: 'parent',
        relatedId: newEntry.id
      });
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
      const entry = liaisonEntries.find((e) => e.id === entryId);
      if (entry) {
        if (currentUser.role === 'parent') {
          await dbAddNotification({
            schoolId: currentUser.schoolId || '',
            title: `Pesan Buku Penghubung - ${entry.studentName}`,
            body: `${currentUser.fullName}: ${messageText}`,
            type: 'liaison',
            className: entry.className,
            role: 'teacher',
            studentId: entry.studentId,
            relatedId: entryId
          });
        } else {
          await dbAddNotification({
            schoolId: currentUser.schoolId || '',
            title: `Balasan Buku Penghubung`,
            body: `${currentUser.fullName}: ${messageText}`,
            type: 'liaison',
            studentId: entry.studentId,
            role: 'parent',
            relatedId: entryId
          });
        }
      }
    } catch (e) {
      console.error('[Firebase] Error adding liaison replyMessage:', e);
    }
  };

  // Callback when updating the status of an entry task
  const handleUpdateLiaisonStatus = async (entryId: string, status: LiaisonEntry['status']) => {
    const lastUpdated = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    try {
      await dbUpdateLiaisonStatus(entryId, status, lastUpdated);
      const entry = liaisonEntries.find((e) => e.id === entryId);
      if (entry) {
        if (currentUser?.role === 'teacher') {
          await dbAddNotification({
            schoolId: currentUser.schoolId || '',
            title: `Status Buku Penghubung Diperbarui`,
            body: `Status Buku Penghubung ${entry.studentName} diperbarui menjadi: ${status}.`,
            type: 'liaison',
            studentId: entry.studentId,
            role: 'parent',
            relatedId: entryId
          });
        }
      }
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
      const student = students.find((s) => s.id === studentId);
      const bill = student?.sppBills.find((b) => b.id === billId);
      if (student && bill) {
        await dbAddNotification({
          schoolId: currentUser?.schoolId || '',
          title: 'Unggah Bukti Pembayaran SPP',
          body: `Wali murid ${student.name} mengunggah bukti pembayaran untuk "${bill.title}" (Rp ${bill.amount.toLocaleString('id-ID')}).`,
          type: 'keuangan',
          studentId: studentId,
          role: 'teacher',
          className: student.class,
          relatedId: billId
        });
      }
    } catch (e) {
      console.error('[Firebase] Error paying bill:', e);
    }
  };

  // Callback when teacher adds a new bill for the entire class
  const handleAddClassBill = async (billTemplate: Omit<Bill, 'id'>) => {
    try {
      const targetClass = activeTeacherClass || currentUser?.className || 'TK-A';
      await dbCreateClassBill(targetClass, billTemplate, currentUser?.schoolId || '');
      await dbAddNotification({
        schoolId: currentUser?.schoolId || '',
        title: 'Tagihan SPP Baru Diterbitkan',
        body: `Tagihan "${billTemplate.title}" sebesar Rp ${billTemplate.amount.toLocaleString('id-ID')} telah diterbitkan untuk kelas ${targetClass}.`,
        type: 'keuangan',
        className: targetClass,
        role: 'parent'
      });
    } catch (e) {
      console.error('[Firebase] Error adding class bill:', e);
    }
  };

  // Callback when teacher adds a new bill for a single student
  const handleAddStudentBill = async (studentId: string, billTemplate: Omit<Bill, 'id'>) => {
    try {
      await dbCreateStudentBill(studentId, billTemplate);
      const student = students.find((s) => s.id === studentId);
      if (student) {
        await dbAddNotification({
          schoolId: currentUser?.schoolId || '',
          title: 'Tagihan SPP Baru Diterbitkan',
          body: `Tagihan "${billTemplate.title}" sebesar Rp ${billTemplate.amount.toLocaleString('id-ID')} telah diterbitkan untuk ${student.name}.`,
          type: 'keuangan',
          studentId: studentId,
          role: 'parent'
        });
      }
    } catch (e) {
      console.error('[Firebase] Error adding student bill:', e);
    }
  };

  // Callback when teacher approves or rejects a pending bill payment
  const handleVerifyPayment = async (studentId: string, billId: string, approve: boolean) => {
    try {
      await dbVerifyBillPayment(studentId, billId, approve);
      const student = students.find((s) => s.id === studentId);
      const bill = student?.sppBills.find((b) => b.id === billId);
      if (student && bill) {
        await dbAddNotification({
          schoolId: currentUser?.schoolId || '',
          title: approve ? 'Pembayaran SPP Disetujui' : 'Pembayaran SPP Ditolak',
          body: approve 
            ? `Pembayaran untuk "${bill.title}" (${student.name}) telah terverifikasi LUNAS.`
            : `Bukti pembayaran untuk "${bill.title}" (${student.name}) ditolak. Silakan unggah ulang.`,
          type: 'keuangan',
          studentId: studentId,
          role: 'parent',
          relatedId: billId
        });
      }
    } catch (e) {
      console.error('[Firebase] Error verifying payment:', e);
    }
  };

  // Simulated notification counts
  const pendingApprovalCount = permits.filter((p) => p.status === 'Pending').length;

  // Computed values for Parent Portal
  const activeParentStudent = currentUser && activeRole === 'parent' ? students.find((s) => s.id === selectedStudentId) : null;
  const activeParentStudentClass = activeParentStudent?.class;
  const activeParentStudentTeacher = activeParentStudentClass ? teachers.find((t) => t.className === activeParentStudentClass) : null;
  const resolvedTeacherName = activeParentStudentTeacher?.fullName || 'Wali Kelas';

  // Computed values for Teacher Portal
  const teacherClasses = currentUser && activeRole === 'teacher' && currentUser.className
    ? currentUser.className.split(',').map(c => c.trim())
    : [];

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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col antialiased selection:bg-brand-accent selection:text-white font-sans">
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash-screen-wrapper"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[9999]"
          >
            <SplashScreen onComplete={() => {
              setShowSplash(false);
              if (!localStorage.getItem('hasCompletedOnboarding')) {
                setShowOnboarding(true);
              }
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            key="onboarding-screen-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[9995]"
          >
            <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Interactive Push Notifications */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] flex flex-col gap-2.5 w-full max-w-sm px-4 pointer-events-none">
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="bg-slate-900/95 text-white p-4 rounded-3xl shadow-[0_10px_30px_rgba(15,23,42,0.25)] border border-slate-800/80 backdrop-blur-md flex items-start gap-3.5 relative overflow-hidden group select-none cursor-pointer pointer-events-auto"
              onClick={() => {
                setNotifications(prev => prev.filter(n => n.id !== notif.id));
              }}
            >
              <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-yellow-400" />
              <div className="bg-yellow-400/10 text-yellow-400 p-2 rounded-2xl shrink-0 border border-yellow-400/25">
                <svg className="w-5 h-5 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <div className="space-y-0.5 flex-1 min-w-0 pr-4">
                <h4 className="font-display font-extrabold text-xs tracking-tight text-white line-clamp-1">{notif.title}</h4>
                <p className="text-[11px] text-slate-300 font-semibold leading-relaxed line-clamp-2">{notif.body}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setNotifications(prev => prev.filter(n => n.id !== notif.id));
                }}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors focus:outline-none shrink-0"
              >
                <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main Sandbox Layout with Full Width Container */}
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col bg-white shadow-sm relative min-h-screen">
        


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
                ) : activeRole === 'parent' ? (
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
                              onReplayOnboarding={() => setShowOnboarding(true)}
                              isPremium={currentSchool?.isPremium}
                              notifications={dbNotifications}
                              currentUser={currentUser}
                              onMarkNotificationAsRead={(id) => dbMarkNotificationAsRead(id, currentUser?.id || '')}
                              onMarkAllNotificationsAsRead={() => dbMarkAllNotificationsAsRead(currentUser?.id || '', currentUser?.schoolId || '')}
                              onDeleteNotification={dbDeleteNotification}
                              onNavigateToNotification={handleNotificationNavigation}
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
                ) : activeRole === 'teacher' ? (
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
                            onGoToFinances={(subTab) => handleTeacherTabChange('keuangan', subTab)}
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
                            onReplayOnboarding={() => setShowOnboarding(true)}
                            isPremium={currentSchool?.isPremium}
                            notifications={dbNotifications}
                            currentUser={currentUser}
                            onMarkNotificationAsRead={(id) => dbMarkNotificationAsRead(id, currentUser?.id || '')}
                            onMarkAllNotificationsAsRead={() => dbMarkAllNotificationsAsRead(currentUser?.id || '', currentUser?.schoolId || '')}
                            onDeleteNotification={dbDeleteNotification}
                            onNavigateToNotification={handleNotificationNavigation}
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
                            initialTab={initialKeuanganTab}
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
                ) : null}
              </AnimatePresence>
            </div>

            {currentUser && (activeRole === 'parent' || activeRole === 'teacher') && (
              <AdBanner currentSchool={currentSchool} />
            )}

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
