export interface AttendanceLog {
  date: string;
  status: 'HADIR' | 'IZIN' | 'SAKIT' | 'ALFA' | 'BELUM ABSEN';
  time?: string;
}

export interface Student {
  id: string;
  name: string;
  class: string;
  avatar: string;
  attendanceToday: 'HADIR' | 'IZIN' | 'SAKIT' | 'ALFA' | 'BELUM ABSEN';
  attendanceTime?: string;
  attendanceHistory?: AttendanceLog[];
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
  isPremium?: boolean;
  bankAccountName?: string;
  bankAccountType?: string;
  bankAccountNumber?: string;
  paymentGatewayType?: 'manual' | 'midtrans' | 'duitku' | 'other';
  paymentGatewayApiKey?: string;
  paymentGatewayMerchantCode?: string;
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

export interface SavingsTransaction {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  date: string; // ISO or local date string
  type: 'setor' | 'tarik';
  amount: number;
  description: string;
  teacherName: string;
  schoolId?: string;
}

export interface Schedule {
  id: string;
  className: string;
  day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
  subject: string;
  startTime: string;
  endTime: string;
  room?: string;
  teacherName: string;
  schoolId: string;
  color: string; // e.g. 'emerald' | 'amber' | 'rose' | 'indigo' | 'sky' | 'violet' | 'pink'
}

export interface AppNotification {
  id: string;
  schoolId: string;
  title: string;
  body: string;
  type: 'announcement' | 'permit' | 'liaison' | 'grade' | 'attendance' | 'spp' | 'counseling' | 'calendar' | 'keuangan' | 'general';
  relatedId?: string;
  userId?: string;
  role?: 'parent' | 'teacher' | 'yayasan' | 'all';
  className?: string;
  studentId?: string;
  createdAt: string;
  readBy: string[];
}




