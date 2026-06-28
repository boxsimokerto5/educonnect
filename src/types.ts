export interface Student {
  id: string;
  name: string;
  class: string;
  avatar: string;
  attendanceToday: 'HADIR' | 'IZIN' | 'SAKIT' | 'ALFA' | 'BELUM ABSEN';
  attendanceTime?: string;
  parentName: string;
  sppStatus: 'Belum Lunas' | 'Lunas';
  sppBills: Bill[];
  grades: Grade[];
  nis?: string;
  address?: string;
  phone?: string;
  schoolId?: string;
}

export interface Bill {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  status: 'Unpaid' | 'Pending' | 'Paid';
  paidAt?: string;
  paymentMethod?: string;
}

export interface Grade {
  subject: string;
  score: number;
  maxScore: number;
  type: 'Tugas' | 'UTS' | 'UAS';
  date: string;
}

export interface EPermit {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  type: 'Sakit' | 'Keperluan Keluarga';
  startDate: string;
  endDate: string;
  reason: string;
  attachmentName?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedAt: string;
  schoolId?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'academic' | 'holiday' | 'event';
  description: string;
  visibility?: 'both' | 'teacher';
  schoolId?: string;
}

export interface Announcement {
  id: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  content: string;
  schoolId?: string;
}

export interface User {
  id: string;
  email: string;
  password?: string;
  fullName: string;
  role: 'superadmin' | 'yayasan' | 'teacher' | 'parent';
  schoolId?: string;
  studentId?: string;
  className?: string;
}

export interface School {
  id: string;
  name: string;
  status: 'active' | 'suspended';
  createdAt: string;
  logoUrl?: string;
}

export interface LiaisonMessage {
  id: string;
  senderRole: 'parent' | 'teacher';
  senderName: string;
  message: string;
  timestamp: string;
}

export interface LiaisonEntry {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  taskTitle: string;
  subject: string;
  status: 'Perlu Perhatian' | 'Sudah Dikerjakan' | 'Butuh Bimbingan' | 'Selesai';
  lastUpdated: string;
  messages: LiaisonMessage[];
  schoolId?: string;
}

export interface CounselingRecord {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  date: string;
  category: 'Perkembangan Fisik' | 'Perkembangan Kognitif' | 'Sosial Emosional' | 'Konseling Perilaku' | 'Lainnya';
  title: string;
  notes: string;
  recommendation: string;
  teacherName: string;
  status: 'Draft' | 'Terpublikasi';
  schoolId?: string;
}


