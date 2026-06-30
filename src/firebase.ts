import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  setDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  arrayUnion,
  query,
  where
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import config from '../firebase-applet-config.json';
import { Student, EPermit, CalendarEvent, Announcement, LiaisonEntry, User, Grade, LiaisonMessage, CounselingRecord, Bill, School, SavingsTransaction, Schedule, AppNotification } from './types';
import { INITIAL_STUDENTS, INITIAL_PERMITS, CALENDAR_EVENTS, ANNOUNCEMENTS, INITIAL_LIAISON_ENTRIES, INITIAL_COUNSELING_RECORDS } from './data';

const app = initializeApp(config);
export const db = config.firestoreDatabaseId 
  ? getFirestore(app, config.firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);

// Pre-configured default users for simulation (Only Super Admin)
const DEFAULT_USERS: User[] = [
  {
    id: 'user-superadmin',
    email: 'superadmin',
    password: '123',
    fullName: 'Super Admin Global',
    role: 'superadmin'
  }
];

// Helper to seed initial data if collections are empty
export async function seedInitialData() {
  try {
    // Check if the specific super admin user document exists
    const superAdminDoc = await getDoc(doc(db, 'users', 'user-superadmin'));
    if (!superAdminDoc.exists()) {
      console.log('[Firebase] Seeding initial Super Admin user');
      for (const item of DEFAULT_USERS) {
        await setDoc(doc(db, 'users', item.id), item);
      }
    }
    await seedInitialSchedules();
    console.log('[Firebase] Initial data seeding complete or already populated.');
  } catch (error) {
    console.error('[Firebase] Error seeding initial data:', error);
  }
}

// Multi-Tenant DB Operations (Super Admin)
export async function dbAddSchool(school: School, yayasanUser: User) {
  await setDoc(doc(db, 'schools', school.id), school);
  await setDoc(doc(db, 'users', yayasanUser.id), yayasanUser);
}

export async function dbUpdateSchoolStatus(schoolId: string, status: 'active' | 'suspended') {
  await updateDoc(doc(db, 'schools', schoolId), { status });
}

export async function dbUpdateSchoolPremiumStatus(schoolId: string, isPremium: boolean) {
  await updateDoc(doc(db, 'schools', schoolId), { isPremium });
}

export async function dbUpdateSchoolLogo(schoolId: string, logoBase64: string) {
  await updateDoc(doc(db, 'schools', schoolId), { logoUrl: logoBase64 });
}

export async function dbUpdateSchoolPaymentSettings(
  schoolId: string,
  settings: {
    bankAccountName?: string;
    bankAccountType?: string;
    bankAccountNumber?: string;
    paymentGatewayType?: 'manual' | 'midtrans' | 'duitku' | 'other';
    paymentGatewayApiKey?: string;
    paymentGatewayMerchantCode?: string;
  }
) {
  await updateDoc(doc(db, 'schools', schoolId), settings);
}

export async function dbUpdateSchoolAndYayasan(
  schoolId: string,
  schoolName: string,
  yayasanUserId: string | undefined,
  yayasanData: { fullName: string; email: string; password?: string }
) {
  // Update school name
  await updateDoc(doc(db, 'schools', schoolId), { name: schoolName });

  if (yayasanUserId) {
    const updateData: any = {
      fullName: yayasanData.fullName,
      email: yayasanData.email,
    };
    if (yayasanData.password) {
      updateData.password = yayasanData.password;
    }
    await updateDoc(doc(db, 'users', yayasanUserId), updateData);
  } else {
    // If no yayasan user exists for this school, create one!
    const newYayasan: User = {
      id: `user-yayasan-${Date.now()}`,
      email: yayasanData.email,
      password: yayasanData.password || '123',
      fullName: yayasanData.fullName,
      role: 'yayasan',
      schoolId: schoolId
    };
    await setDoc(doc(db, 'users', newYayasan.id), newYayasan);
  }
}

export async function dbUpdateUserPassword(userId: string, newPassword: string) {
  await updateDoc(doc(db, 'users', userId), { password: newPassword });
}

export async function dbGetSuperAdminUser(): Promise<User | null> {
  const docSnap = await getDoc(doc(db, 'users', 'user-superadmin'));
  if (docSnap.exists()) {
    return docSnap.data() as User;
  }
  return null;
}

// Multi-Tenant DB Operations (Yayasan)
export async function dbAddTeacher(teacher: User) {
  await setDoc(doc(db, 'users', teacher.id), teacher);
}

export async function dbDeleteTeacher(teacherId: string) {
  await deleteDoc(doc(db, 'users', teacherId));
}

// 1. Add Student Flow
export async function dbAddStudent(
  student: Student,
  liaisonEntry: LiaisonEntry,
  parentUser: User
) {
  await setDoc(doc(db, 'students', student.id), student);
  await setDoc(doc(db, 'liaisonEntries', liaisonEntry.id), liaisonEntry);
  await setDoc(doc(db, 'users', parentUser.id), parentUser);
}

// 2. Delete Student Flow (Cascades)
export async function dbDeleteStudent(studentId: string) {
  // Delete student
  await deleteDoc(doc(db, 'students', studentId));

  // Find & delete permits of this student
  const permitsSnapshot = await getDocs(collection(db, 'permits'));
  permitsSnapshot.docs.forEach(async (d) => {
    const permit = d.data() as EPermit;
    if (permit.studentId === studentId) {
      await deleteDoc(doc(db, 'permits', d.id));
    }
  });

  // Find & delete liaison entries of this student
  const liaisonSnapshot = await getDocs(collection(db, 'liaisonEntries'));
  liaisonSnapshot.docs.forEach(async (d) => {
    const entry = d.data() as LiaisonEntry;
    if (entry.studentId === studentId) {
      await deleteDoc(doc(db, 'liaisonEntries', d.id));
    }
  });

  // Find & delete user accounts for parent linked to this student
  const usersSnapshot = await getDocs(collection(db, 'users'));
  usersSnapshot.docs.forEach(async (d) => {
    const u = d.data() as User;
    if (u.studentId === studentId && u.role === 'parent') {
      await deleteDoc(doc(db, 'users', d.id));
    }
  });
}

// 3. Submit Permit
export async function dbSubmitPermit(permit: EPermit, studentId: string) {
  await setDoc(doc(db, 'permits', permit.id), permit);
  
  // Update student attendance status temporarily
  const stdRef = doc(db, 'students', studentId);
  const stdSnap = await getDoc(stdRef);
  if (stdSnap.exists()) {
    await updateDoc(stdRef, { attendanceToday: 'BELUM ABSEN' });
  }
}

// 4. Approve Permit
export async function dbApprovePermit(permitId: string, studentId: string, type: 'Sakit' | 'Keperluan Keluarga') {
  await updateDoc(doc(db, 'permits', permitId), { status: 'Approved' });
  await updateDoc(doc(db, 'students', studentId), {
    attendanceToday: type === 'Sakit' ? 'SAKIT' : 'IZIN',
    attendanceTime: 'Disetujui Guru'
  });
}

// 5. Reject Permit
export async function dbRejectPermit(permitId: string) {
  await updateDoc(doc(db, 'permits', permitId), { status: 'Rejected' });
}

// 6. Update Attendance Manually
export async function dbUpdateAttendance(studentId: string, status: Student['attendanceToday'], time?: string) {
  await updateDoc(doc(db, 'students', studentId), {
    attendanceToday: status,
    attendanceTime: time || null
  });
}

// 7. Add Student Grade
export async function dbAddGrade(studentId: string, grade: Grade) {
  const stdRef = doc(db, 'students', studentId);
  const stdSnap = await getDoc(stdRef);
  if (stdSnap.exists()) {
    const grades = stdSnap.data().grades || [];
    await updateDoc(stdRef, {
      grades: [grade, ...grades]
    });
  }
}

// 7b. Delete Student Grade
export async function dbDeleteGrade(studentId: string, gradeIndex: number) {
  const stdRef = doc(db, 'students', studentId);
  const stdSnap = await getDoc(stdRef);
  if (stdSnap.exists()) {
    const grades = [...(stdSnap.data().grades || [])];
    if (gradeIndex >= 0 && gradeIndex < grades.length) {
      grades.splice(gradeIndex, 1);
      await updateDoc(stdRef, { grades });
    }
  }
}

// 8. Add Announcement
export async function dbAddAnnouncement(announcement: Announcement) {
  await setDoc(doc(db, 'announcements', announcement.id), announcement);
}

// 9. Add Calendar Event
export async function dbAddCalendarEvent(event: CalendarEvent) {
  await setDoc(doc(db, 'calendarEvents', event.id), event);
}

// 10. Delete Calendar Event
export async function dbDeleteCalendarEvent(eventId: string) {
  await deleteDoc(doc(db, 'calendarEvents', eventId));
}

// 11. Add Liaison Reply Message
export async function dbAddLiaisonReply(entryId: string, replyMsg: LiaisonMessage, lastUpdated: string) {
  const entryRef = doc(db, 'liaisonEntries', entryId);
  const entrySnap = await getDoc(entryRef);
  if (entrySnap.exists()) {
    const messages = entrySnap.data().messages || [];
    await updateDoc(entryRef, {
      messages: [...messages, replyMsg],
      lastUpdated
    });
  }
}

// 12. Update Liaison Status
export async function dbUpdateLiaisonStatus(entryId: string, status: LiaisonEntry['status'], lastUpdated: string) {
  await updateDoc(doc(db, 'liaisonEntries', entryId), {
    status,
    lastUpdated
  });
}

// 13. Delete Liaison Entry
export async function dbDeleteLiaisonEntry(entryId: string) {
  await deleteDoc(doc(db, 'liaisonEntries', entryId));
}

// 14. Pay SPP Bill (sets status to Pending, waiting for teacher approval)
export async function dbPayBill(studentId: string, billId: string, paidAt: string, paymentMethod?: string) {
  const stdRef = doc(db, 'students', studentId);
  const stdSnap = await getDoc(stdRef);
  if (stdSnap.exists()) {
    const studentData = stdSnap.data() as Student;
    const updatedBills = studentData.sppBills.map((b) =>
      b.id === billId ? { ...b, status: 'Pending' as const, paidAt, paymentMethod: paymentMethod || 'M-Banking' } : b
    );
    await updateDoc(stdRef, { sppBills: updatedBills });
  }
}

// 14b. Verify / Approve SPP Bill Payment
export async function dbVerifyBillPayment(studentId: string, billId: string, approve: boolean) {
  const stdRef = doc(db, 'students', studentId);
  const stdSnap = await getDoc(stdRef);
  if (stdSnap.exists()) {
    const studentData = stdSnap.data() as Student;
    const updatedBills = studentData.sppBills.map((b) => {
      if (b.id === billId) {
        return {
          ...b,
          status: approve ? ('Paid' as const) : ('Unpaid' as const),
          paidAt: approve ? (b.paidAt || new Date().toLocaleDateString('id-ID')) : undefined
        };
      }
      return b;
    });
    
    // Auto calculate if all bills are paid to update sppStatus
    const hasUnpaid = updatedBills.some(b => b.status === 'Unpaid' || b.status === 'Pending');
    const sppStatus = hasUnpaid ? 'Belum Lunas' : 'Lunas';
    
    await updateDoc(stdRef, { sppBills: updatedBills, sppStatus });
  }
}

// 14c. Create Class Bill
export async function dbCreateClassBill(className: string, billTemplate: Omit<Bill, 'id'>, schoolId: string) {
  const q = query(collection(db, 'students'), where('class', '==', className), where('schoolId', '==', schoolId));
  const snapshot = await getDocs(q);
  const batch: Promise<void>[] = [];
  snapshot.forEach((studentDoc) => {
    const studentData = studentDoc.data() as Student;
    const newBill: Bill = {
      ...billTemplate,
      id: 'bill-' + Math.random().toString(36).substr(2, 9)
    };
    const updatedBills = [newBill, ...(studentData.sppBills || [])];
    batch.push(updateDoc(studentDoc.ref, { sppBills: updatedBills, sppStatus: 'Belum Lunas' }));
  });
  await Promise.all(batch);
}

// 14d. Create Single Student Bill
export async function dbCreateStudentBill(studentId: string, billTemplate: Omit<Bill, 'id'>) {
  const stdRef = doc(db, 'students', studentId);
  const stdSnap = await getDoc(stdRef);
  if (stdSnap.exists()) {
    const studentData = stdSnap.data() as Student;
    const newBill: Bill = {
      ...billTemplate,
      id: 'bill-' + Math.random().toString(36).substr(2, 9)
    };
    const updatedBills = [newBill, ...(studentData.sppBills || [])];
    await updateDoc(stdRef, { sppBills: updatedBills, sppStatus: 'Belum Lunas' });
  }
}

// 15. Register User (from AuthScreen)
export async function dbAddUser(user: User) {
  await setDoc(doc(db, 'users', user.id), user);
}

// 17. Add Liaison Entry
export async function dbAddLiaisonEntry(entry: LiaisonEntry) {
  await setDoc(doc(db, 'liaisonEntries', entry.id), entry);
}

// 18. Counseling / Developmental Notes
export async function dbAddCounselingRecord(record: CounselingRecord) {
  await setDoc(doc(db, 'counselingRecords', record.id), record);
}

export async function dbUpdateCounselingRecord(recordId: string, updates: Partial<CounselingRecord>) {
  await updateDoc(doc(db, 'counselingRecords', recordId), updates);
}

export async function dbDeleteCounselingRecord(recordId: string) {
  await deleteDoc(doc(db, 'counselingRecords', recordId));
}

// 19. Savings (Tabungan) Transactions
export async function dbAddSavingsTransaction(tx: SavingsTransaction) {
  await setDoc(doc(db, 'savings', tx.id), tx);
}

export async function dbDeleteSavingsTransaction(txId: string) {
  await deleteDoc(doc(db, 'savings', txId));
}

// 16. Reset Database to initial simulation condition
export async function dbResetToInitial() {
  // Delete all existing documents in these collections first, then seed
  const collectionsToReset = ['schools', 'students', 'permits', 'announcements', 'calendarEvents', 'liaisonEntries', 'users', 'counselingRecords', 'savings', 'schedules', 'notifications'];
  for (const cName of collectionsToReset) {
    const snapshot = await getDocs(collection(db, cName));
    for (const d of snapshot.docs) {
      await deleteDoc(doc(db, cName, d.id));
    }
  }
  await seedInitialData();
  await seedInitialSchedules();
}

// 20. Schedule Operations
export async function dbGetSchedules(schoolId: string, className?: string): Promise<Schedule[]> {
  try {
    const collRef = collection(db, 'schedules');
    let q;
    if (className) {
      q = query(collRef, where('schoolId', '==', schoolId), where('className', '==', className));
    } else {
      q = query(collRef, where('schoolId', '==', schoolId));
    }
    const snap = await getDocs(q);
    const list: Schedule[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...(d.data() as any) } as Schedule);
    });
    return list;
  } catch (error) {
    console.error('[Firebase] Error getting schedules:', error);
    return [];
  }
}

export async function dbAddSchedule(schedule: Schedule) {
  await setDoc(doc(db, 'schedules', schedule.id), schedule);
}

export async function dbDeleteSchedule(scheduleId: string) {
  await deleteDoc(doc(db, 'schedules', scheduleId));
}

async function seedInitialSchedules() {
  try {
    const snapshot = await getDocs(collection(db, 'schedules'));
    if (snapshot.empty) {
      console.log('[Firebase] Seeding initial schedules');
      const initialSchedules: Schedule[] = [
        {
          id: 'sched-1',
          className: 'Kelas 1-A',
          day: 'Senin',
          subject: 'Upacara & Tematik',
          startTime: '07:30',
          endTime: '09:00',
          room: 'Ruang Kelas 1-A',
          teacherName: 'Rina Wijaya, S.Pd.',
          schoolId: 'school-1',
          color: 'indigo'
        },
        {
          id: 'sched-2',
          className: 'Kelas 1-A',
          day: 'Senin',
          subject: 'Pendidikan Agama',
          startTime: '09:30',
          endTime: '11:00',
          room: 'Ruang Kelas 1-A',
          teacherName: 'Ustadz Ahmad',
          schoolId: 'school-1',
          color: 'emerald'
        },
        {
          id: 'sched-3',
          className: 'Kelas 1-A',
          day: 'Selasa',
          subject: 'Matematika',
          startTime: '07:30',
          endTime: '09:00',
          room: 'Ruang Kelas 1-A',
          teacherName: 'Budi Santoso, S.Pd.',
          schoolId: 'school-1',
          color: 'amber'
        },
        {
          id: 'sched-4',
          className: 'Kelas 1-A',
          day: 'Selasa',
          subject: 'Bahasa Indonesia',
          startTime: '09:30',
          endTime: '11:00',
          room: 'Ruang Kelas 1-A',
          teacherName: 'Rina Wijaya, S.Pd.',
          schoolId: 'school-1',
          color: 'sky'
        },
        {
          id: 'sched-5',
          className: 'Kelas 1-A',
          day: 'Rabu',
          subject: 'Seni Budaya & Prakarya',
          startTime: '07:30',
          endTime: '09:00',
          room: 'Aula Seni',
          teacherName: 'Siti Aminah, S.Sn.',
          schoolId: 'school-1',
          color: 'rose'
        },
        {
          id: 'sched-6',
          className: 'Kelas 1-A',
          day: 'Rabu',
          subject: 'Pendidikan Jasmani',
          startTime: '09:30',
          endTime: '11:00',
          room: 'Lapangan Olahraga',
          teacherName: 'Joko Susilo, S.Pd.',
          schoolId: 'school-1',
          color: 'violet'
        },
        {
          id: 'sched-7',
          className: 'Kelas 1-B',
          day: 'Senin',
          subject: 'Matematika',
          startTime: '07:30',
          endTime: '09:00',
          room: 'Ruang Kelas 1-B',
          teacherName: 'Budi Santoso, S.Pd.',
          schoolId: 'school-1',
          color: 'amber'
        },
        {
          id: 'sched-8',
          className: 'Kelas 1-B',
          day: 'Senin',
          subject: 'Bahasa Inggris',
          startTime: '09:30',
          endTime: '11:00',
          room: 'Lab Bahasa',
          teacherName: 'Lina Marlina, M.Pd.',
          schoolId: 'school-1',
          color: 'pink'
        }
      ];

      for (const sched of initialSchedules) {
        await setDoc(doc(db, 'schedules', sched.id), sched);
      }
    }
  } catch (error) {
    console.error('[Firebase] Error seeding initial schedules:', error);
  }
}

// 21. Notification Operations
export async function dbAddNotification(notif: Omit<AppNotification, 'id' | 'createdAt' | 'readBy'> & { id?: string }) {
  try {
    const notifId = notif.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const fullNotif: AppNotification = {
      ...notif,
      id: notifId,
      createdAt: new Date().toISOString(),
      readBy: []
    };
    await setDoc(doc(db, 'notifications', notifId), fullNotif);
    return fullNotif;
  } catch (error) {
    console.error('[Firebase] Error adding notification:', error);
  }
}

export async function dbMarkNotificationAsRead(notifId: string, userId: string) {
  try {
    await updateDoc(doc(db, 'notifications', notifId), {
      readBy: arrayUnion(userId)
    });
  } catch (error) {
    console.error('[Firebase] Error marking notification as read:', error);
  }
}

export async function dbMarkAllNotificationsAsRead(userId: string, schoolId: string) {
  try {
    const collRef = collection(db, 'notifications');
    const q = query(collRef, where('schoolId', '==', schoolId));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      const data = d.data() as AppNotification;
      if (!data.readBy.includes(userId)) {
        await updateDoc(doc(db, 'notifications', d.id), {
          readBy: arrayUnion(userId)
        });
      }
    }
  } catch (error) {
    console.error('[Firebase] Error marking all notifications as read:', error);
  }
}

export async function dbDeleteNotification(notifId: string) {
  try {
    await deleteDoc(doc(db, 'notifications', notifId));
  } catch (error) {
    console.error('[Firebase] Error deleting notification:', error);
  }
}


