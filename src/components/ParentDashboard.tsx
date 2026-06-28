import React, { useState } from 'react';
import { Student, CalendarEvent, Announcement, Bill, EPermit } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import CalendarClockWidget from './CalendarClockWidget';
import {
  Bell,
  ChevronDown,
  CheckCircle,
  CreditCard,
  FileSpreadsheet,
  Calendar,
  GraduationCap,
  X,
  Plus,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Download,
  ChevronRight,
  Sparkles,
  Search,
  BookOpen,
  DollarSign,
  Camera,
  Smile
} from 'lucide-react';

interface ParentDashboardProps {
  students: Student[];
  selectedStudentId: string;
  onSelectStudent: (id: string) => void;
  onGoToPermit: () => void;
  onGoToPresensi?: () => void;
  onGoToKonseling?: () => void;
  calendarEvents: CalendarEvent[];
  announcements: Announcement[];
  permits: EPermit[];
  onPayBill: (studentId: string, billId: string) => void;
  parentName?: string;
  onUpdateAttendance?: (studentId: string, status: Student['attendanceToday'], time?: string) => void;
  schoolLogoUrl?: string;
  schoolName?: string;
}

export default function ParentDashboard({
  students,
  selectedStudentId,
  onSelectStudent,
  onGoToPermit,
  onGoToPresensi,
  onGoToKonseling,
  calendarEvents,
  announcements,
  permits,
  onPayBill,
  parentName = 'Ibu Maria',
  onUpdateAttendance,
  schoolLogoUrl,
  schoolName
}: ParentDashboardProps) {
  const currentStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  
  if (!currentStudent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
        <div>
          <h3 className="font-display font-black text-slate-800 text-sm">Memuat Data Siswa...</h3>
          <p className="text-xs text-slate-400 mt-1">Mengambil informasi profil anak Anda.</p>
        </div>
      </div>
    );
  }

  const [showChildDropdown, setShowChildDropdown] = useState(false);
  const [activeModal, setActiveModal] = useState<'spp' | 'agenda' | 'rapor' | 'announcement' | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  
  // Payment Simulation state
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<Bill | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'form' | 'success'>('form');
  const [paymentMethod, setPaymentMethod] = useState<'gopay' | 'bca' | 'mandiri' | 'shopeepay'>('gopay');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Detailed Billing System State
  const [selectedBillForDetail, setSelectedBillForDetail] = useState<Bill | null>(null);
  const [activeSppTab, setActiveSppTab] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [downloadingBillId, setDownloadingBillId] = useState<string | null>(null);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  // Count active unpaid bills
  const unpaidBillsCount = currentStudent.sppBills.filter((b) => b.status === 'Unpaid').length;
  const unpaidBills = currentStudent.sppBills.filter((b) => b.status === 'Unpaid');
  const nearestUnpaidBill = unpaidBills.length > 0 ? unpaidBills[0] : null;

  // Find if there's any pending or approved permit today for this child
  const childPermits = permits.filter((p) => p.studentId === currentStudent.id);
  const activePermit = childPermits.find((p) => p.status === 'Pending' || p.status === 'Approved');

  const handleOpenAnnouncement = (ann: Announcement) => {
    setSelectedAnnouncement(ann);
    setActiveModal('announcement');
  };

  const startPayment = (bill: Bill) => {
    setSelectedBillForPayment(bill);
    setPaymentStep('form');
    setIsPaying(true);
  };

  const handleConfirmPayment = () => {
    setPaymentStep('success');
    setTimeout(() => {
      onPayBill(currentStudent.id, selectedBillForPayment!.id);
      setIsPaying(false);
      setSelectedBillForPayment(null);
    }, 1500);
  };

  // Compute average score for the selected student
  const totalScores = currentStudent.grades.reduce((sum, g) => sum + g.score, 0);
  const averageScore = currentStudent.grades.length > 0 ? (totalScores / currentStudent.grades.length).toFixed(1) : '0.0';

  return (
    <div className="space-y-6 pb-20">
      {/* Curved Dark Header Backdrop */}
      <div className="bg-brand-blue text-white rounded-b-[2.5rem] px-5 pt-8 pb-12 relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute top-[-50px] right-[-50px] w-48 h-48 rounded-full bg-slate-800 opacity-30 blur-2xl"></div>
        <div className="absolute bottom-[-10px] left-[-30px] w-32 h-32 rounded-full bg-slate-800 opacity-20 blur-xl"></div>

        {/* Brand & Notifications Bar */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-2.5">
            {schoolLogoUrl ? (
              <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center overflow-hidden shadow-md shrink-0">
                <img src={schoolLogoUrl} alt="Logo Sekolah" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
              </div>
            ) : (
              <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md flex items-center justify-center shrink-0">
                {/* Custom SVG School Badge */}
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
          <div className="relative">
            <button className="p-2 bg-white/10 rounded-xl backdrop-blur-md relative hover:bg-white/20 transition-all">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-brand-blue"></span>
            </button>
          </div>
        </div>

        {/* Greeting & Quick Stats */}
        <div className="relative z-10 mb-6">
          <span className="text-xs text-slate-300 block">Selamat Pagi,</span>
          <h1 className="font-display font-bold text-2xl tracking-tight mt-0.5">{parentName}!</h1>
        </div>

        {/* Dropdown Pilih Anak */}
        <div className="relative z-20">
          <button
            onClick={() => setShowChildDropdown(!showChildDropdown)}
            className="w-full bg-white text-slate-800 p-3.5 rounded-2xl flex items-center justify-between shadow-lg hover:bg-slate-50 transition-all"
            id="child-selector-dropdown-btn"
          >
            <div className="flex items-center gap-3">
              <img
                src={currentStudent.avatar}
                alt={currentStudent.name}
                className="w-10 h-10 rounded-xl object-cover border-2 border-slate-100"
                referrerPolicy="no-referrer"
              />
              <div className="text-left">
                <span className="text-[10px] text-slate-400 font-semibold block">Anak Anda:</span>
                <span className="font-display font-bold text-sm text-brand-blue uppercase">{currentStudent.name}</span>
                <span className="text-xs text-slate-500 block">{currentStudent.class}</span>
              </div>
            </div>
            <ChevronDown size={18} className={`text-slate-400 transition-transform ${showChildDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {showChildDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 z-50 p-2"
              >
                {students.map((std) => (
                  <button
                    key={std.id}
                    onClick={() => {
                      onSelectStudent(std.id);
                      setShowChildDropdown(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      std.id === currentStudent.id ? 'bg-slate-50 text-brand-blue font-semibold' : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <img
                      src={std.avatar}
                      alt={std.name}
                      className="w-9 h-9 rounded-lg object-cover border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-left flex-1">
                      <span className="text-xs font-bold block">{std.name}</span>
                      <span className="text-[10px] text-slate-400 block">{std.class}</span>
                    </div>
                    {std.id === currentStudent.id && (
                      <span className="w-2 h-2 bg-brand-green rounded-full"></span>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Content (Negative margin brings it over the curved header slightly) */}
      <div className="px-5 -mt-8 relative z-30 space-y-5">
        {/* Nearing Due Date SPP Notification Alert/Banner */}
        {nearestUnpaidBill && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-3xl p-4.5 border border-red-400 shadow-lg relative overflow-hidden flex flex-col gap-3.5"
            id="spp-due-alert-banner"
          >
            {/* Absolute decorative background shapes */}
            <div className="absolute top-[-20px] right-[-20px] w-24 h-24 rounded-full bg-white/10 blur-xl"></div>
            <div className="absolute bottom-[-10px] left-[-10px] w-16 h-16 rounded-full bg-white/10 blur-lg"></div>

            <div className="flex items-start gap-3 relative z-10">
              <div className="bg-white/20 p-2.5 rounded-2xl shrink-0 text-white">
                <AlertTriangle size={20} className="animate-bounce" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] bg-white/25 text-white font-extrabold px-2 py-0.5 rounded-full tracking-wider uppercase">
                  Peringatan Jatuh Tempo
                </span>
                <h4 className="font-display font-black text-sm text-white tracking-tight leading-snug mt-1">
                  Tagihan {nearestUnpaidBill.title} Belum Selesai!
                </h4>
                <p className="text-[11px] text-red-100 font-medium leading-normal">
                  Jatuh tempo pada <strong className="text-yellow-300 font-bold">{nearestUnpaidBill.dueDate}</strong>. Segera selesaikan pembayaran administrasi untuk menghindari keterlambatan.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/20 pt-3 relative z-10">
              <div className="text-left">
                <span className="text-[9px] text-red-100 block font-medium">Total Nominal:</span>
                <strong className="text-sm font-display font-black text-white">
                  Rp {nearestUnpaidBill.amount.toLocaleString('id-ID')}
                </strong>
              </div>
              
              <button
                onClick={() => {
                  setActiveModal('spp');
                  setSelectedBillForDetail(nearestUnpaidBill);
                }}
                className="bg-white text-rose-600 hover:bg-rose-50 px-3.5 py-2 rounded-xl text-[11px] font-bold shadow-md transition-all flex items-center gap-1 focus:outline-none"
                id="spp-due-alert-action"
              >
                Bayar Sekarang
                <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Quick Attendance Status Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 custom-shadow">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block mb-3">Status Hari Ini</span>
          
          {activePermit && activePermit.status === 'Pending' ? (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between text-amber-800">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 text-amber-600 p-2.5 rounded-xl">
                  <AlertTriangle size={22} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm">Menunggu Validasi Izin</h4>
                  <p className="text-xs text-amber-600/80 mt-0.5">Izin: {activePermit.type} • {activePermit.reason.slice(0, 30)}...</p>
                </div>
              </div>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">Proses</span>
            </div>
          ) : activePermit && activePermit.status === 'Approved' ? (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between text-amber-800">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 text-amber-600 p-2.5 rounded-xl">
                  <CheckCircle size={22} />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm">KEHADIRAN: {activePermit.type.toUpperCase()}</h4>
                  <p className="text-xs text-amber-600/80 mt-0.5">Disetujui oleh Wali Kelas</p>
                </div>
              </div>
              <span className="text-[10px] bg-amber-600 text-white font-bold px-2.5 py-0.5 rounded-full">Izin Disetujui</span>
            </div>
          ) : currentStudent.attendanceToday === 'HADIR' ? (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between text-brand-green-dark">
              <div className="flex items-center gap-3">
                <div className="bg-brand-green/10 text-brand-green p-2.5 rounded-xl">
                  <CheckCircle size={22} />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-base uppercase tracking-tight text-emerald-800">KEHADIRAN: HADIR</h4>
                  <p className="text-xs text-brand-green-dark/80 mt-0.5">Siswa telah melakukan absen pukul {currentStudent.attendanceTime || '06:45'}</p>
                </div>
              </div>
              <span className="text-xs bg-emerald-500 text-white font-bold px-2.5 py-0.5 rounded-md">OK</span>
            </div>
          ) : currentStudent.attendanceToday === 'ALFA' ? (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 space-y-3 text-red-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 text-red-600 p-2.5 rounded-xl">
                    <AlertTriangle size={22} />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm">KEHADIRAN: TIDAK HADIR (ALFA)</h4>
                    <p className="text-xs text-red-600/80 mt-0.5">Belum ada keterangan masuk kelas hari ini.</p>
                  </div>
                </div>
                <span className="text-xs bg-red-600 text-white font-bold px-2 py-0.5 rounded-md">ALFA</span>
              </div>
              <button
                onClick={() => onGoToPresensi?.()}
                className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <Camera size={14} />
                Lakukan Presensi Mandiri
              </button>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3 text-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-200 text-slate-500 p-2.5 rounded-xl">
                    <Calendar size={22} />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm">BELUM ABSEN HARI INI</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Siswa belum terdaftar hadir hari ini.</p>
                  </div>
                </div>
                <span className="text-xs bg-slate-200 text-slate-600 font-semibold px-2 py-0.5 rounded-md">-</span>
              </div>
              <button
                onClick={() => onGoToPresensi?.()}
                className="w-full bg-brand-blue hover:bg-brand-blue-light text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
                id="do-online-attendance-btn"
              >
                <Camera size={14} />
                Lakukan Presensi Online Mandiri
              </button>
            </div>
          )}
        </div>

        {/* Real-time Clock & Calendar Compact Widget */}
        <CalendarClockWidget events={calendarEvents} compact={true} />

        {/* 2x2 Smart Grid Menu */}
        <div className="grid grid-cols-2 gap-4">
          {/* SPP & Tagihan */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveModal('spp')}
            className="bg-white p-4 rounded-3xl border border-slate-100 text-left custom-shadow relative overflow-hidden focus:outline-none"
            id="parent-menu-spp"
          >
            <div className="bg-amber-100 text-amber-600 p-3 rounded-2xl w-fit mb-4">
              <CreditCard size={20} />
            </div>
            <h3 className="font-display font-bold text-sm text-slate-800">SPP & Tagihan</h3>
            <p className={`text-xs mt-1.5 font-semibold ${unpaidBillsCount > 0 ? 'text-red-500' : 'text-slate-400'}`}>
              {unpaidBillsCount > 0 ? `${unpaidBillsCount} Tagihan Belum Dibayar` : 'Semua Tagihan Lunas'}
            </p>
            {unpaidBillsCount > 0 && (
              <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
            )}
          </motion.button>

          {/* Izin Online */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onGoToPermit}
            className="bg-white p-4 rounded-3xl border border-slate-100 text-left custom-shadow focus:outline-none"
            id="parent-menu-izin"
          >
            <div className="bg-emerald-100 text-brand-green p-3 rounded-2xl w-fit mb-4">
              <FileSpreadsheet size={20} />
            </div>
            <h3 className="font-display font-bold text-sm text-slate-800">Izin Online</h3>
            <p className="text-xs text-slate-400 mt-1.5">Ajukan Perizinan Absen</p>
          </motion.button>

          {/* Agenda & Kalender */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveModal('agenda')}
            className="bg-white p-4 rounded-3xl border border-slate-100 text-left custom-shadow focus:outline-none"
            id="parent-menu-agenda"
          >
            <div className="bg-blue-100 text-blue-600 p-3 rounded-2xl w-fit mb-4">
              <Calendar size={20} />
            </div>
            <h3 className="font-display font-bold text-sm text-slate-800">Agenda & Kalender</h3>
            <p className="text-xs text-slate-400 mt-1.5">{calendarEvents.length} Agenda Mendatang</p>
          </motion.button>

          {/* Rapor & Nilai */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveModal('rapor')}
            className="bg-white p-4 rounded-3xl border border-slate-100 text-left custom-shadow focus:outline-none"
            id="parent-menu-rapor"
          >
            <div className="bg-purple-100 text-purple-600 p-3 rounded-2xl w-fit mb-4">
              <GraduationCap size={20} />
            </div>
            <h3 className="font-display font-bold text-sm text-slate-800">Rapor & Nilai</h3>
            <p className="text-xs text-slate-400 mt-1.5">Rata-rata Tugas: {averageScore}</p>
          </motion.button>
        </div>

        {/* Catatan Perkembangan / Konseling Banner */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onGoToKonseling}
          className="bg-gradient-to-r from-rose-500 to-amber-500 p-4 rounded-[2rem] text-white flex items-center justify-between cursor-pointer shadow-md"
          id="parent-menu-counseling"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md text-white">
              <Smile size={24} />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-rose-100 block">Fitur Baru</span>
              <h3 className="font-display font-black text-sm text-white">Perkembangan & Bimbingan</h3>
              <p className="text-[10px] text-rose-50 mt-0.5 font-medium leading-tight">Observasi guru & rekomendasi di rumah</p>
            </div>
          </div>
          <div className="bg-white/20 text-white p-2 rounded-full backdrop-blur-md">
            <ChevronRight size={16} />
          </div>
        </motion.div>

        {/* Vertical Feed: Pengumuman Terbaru */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-base text-slate-800">Pengumuman Terbaru</h2>
            <span className="text-xs text-brand-blue font-semibold cursor-pointer hover:underline">Lihat Semua</span>
          </div>

          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                onClick={() => handleOpenAnnouncement(ann)}
                className="bg-white p-4 rounded-2xl border border-slate-100 custom-shadow flex gap-3.5 hover:border-slate-200 transition-all cursor-pointer items-start"
              >
                <div className="bg-slate-50 text-slate-700 p-3 rounded-xl border border-slate-100 flex items-center justify-center shrink-0">
                  <BookOpen size={20} className="text-brand-blue" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-brand-green bg-emerald-50 px-2 py-0.5 rounded-full">
                      {ann.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">{ann.date}</span>
                  </div>
                  <h4 className="font-display font-bold text-sm text-slate-800 leading-tight">
                    {ann.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-1 leading-normal">
                    {ann.excerpt}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL / BOTTOM SLIDE-OVERS */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-blue/60 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white w-full max-w-lg rounded-t-[2.5rem] p-6 max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl relative"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setActiveModal(null);
                  setSelectedBillForPayment(null);
                  setIsPaying(false);
                  setSelectedBillForDetail(null);
                  setDownloadSuccessMessage(null);
                }}
                className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-all"
                id="close-parent-modal-btn"
              >
                <X size={18} />
              </button>

              {/* Modal Content - SPP & TAGIHAN */}
              {activeModal === 'spp' && (() => {
                const activeBillDetail = selectedBillForDetail
                  ? currentStudent.sppBills.find(b => b.id === selectedBillForDetail.id) || selectedBillForDetail
                  : null;
                
                return (
                  <div className="space-y-5">
                    {/* Toast Download Success */}
                    {downloadSuccessMessage && (
                      <div className="absolute top-4 left-6 right-6 bg-slate-900 border border-slate-800 text-white p-3.5 rounded-2xl flex items-center gap-2 shadow-2xl z-50 text-xs animate-bounce">
                        <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                        <span className="font-semibold flex-1 text-slate-100">{downloadSuccessMessage}</span>
                      </div>
                    )}

                    {activeBillDetail ? (
                      /* ====== 1. DETAIL TAGIHAN VIEW ====== */
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setSelectedBillForDetail(null);
                              setSelectedBillForPayment(null);
                              setIsPaying(false);
                            }}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-600"
                            id="back-to-bills-list"
                          >
                            <ArrowLeft size={18} />
                          </button>
                          <div>
                            <h3 className="font-display font-extrabold text-base text-slate-950">Detail Tagihan</h3>
                            <p className="text-[11px] text-slate-500">Rincian administrasi & bukti pembayaran</p>
                          </div>
                        </div>

                        {/* Receipt/Invoice card layout */}
                        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 relative overflow-hidden custom-shadow">
                          {/* Status Stamp */}
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">TK MUTIARA BANGSA</span>
                              <span className="text-[9px] text-slate-400 block mt-0.5 font-mono">Invoice #{activeBillDetail.id.toUpperCase()}-{currentStudent.id.toUpperCase()}</span>
                            </div>
                            
                            {activeBillDetail.status === 'Paid' ? (
                              <span className="bg-emerald-50 text-brand-green border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                                <CheckCircle size={12} className="fill-emerald-50 text-emerald-600" />
                                LUNAS
                              </span>
                            ) : (
                              <span className="bg-rose-50 text-rose-600 border border-rose-200 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                                <AlertTriangle size={12} className="text-rose-500 animate-pulse" />
                                BELUM LUNAS
                              </span>
                            )}
                          </div>

                          <div className="py-2 border-b border-dashed border-slate-200 space-y-1">
                            <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Tagihan</h4>
                            <span className="text-2xl font-display font-black text-slate-900 block">
                              Rp {activeBillDetail.amount.toLocaleString('id-ID')}
                            </span>
                          </div>

                          {/* Invoice Metadata Grid */}
                          <div className="py-4 space-y-2.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-medium">Nama Siswa</span>
                              <span className="text-slate-800 font-bold uppercase">{currentStudent.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-medium">Kelas / Absen</span>
                              <span className="text-slate-800 font-bold">{currentStudent.class}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-medium">Jenis Tagihan</span>
                              <span className="text-slate-800 font-semibold text-right">{activeBillDetail.title}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-medium">Batas Pembayaran</span>
                              <span className="text-slate-800 font-semibold">{activeBillDetail.dueDate}</span>
                            </div>
                            {activeBillDetail.status === 'Paid' ? (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-medium">Waktu Pembayaran</span>
                                  <span className="text-brand-green font-bold">{activeBillDetail.paidAt || '25 Juni 2026'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400 font-medium">Metode Pembayaran</span>
                                  <span className="text-slate-800 font-bold uppercase">Digital Wallet (Auto)</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex justify-between">
                                <span className="text-slate-400 font-medium">Status Pembayaran</span>
                                <span className="text-rose-500 font-bold">Belum Dibayar</span>
                              </div>
                            )}
                          </div>

                          {/* Fancy Receipt barcode decoration */}
                          <div className="pt-4 border-t border-dashed border-slate-200 flex flex-col items-center justify-center gap-1.5 opacity-60">
                            <div className="w-full h-8 bg-slate-200 flex items-center justify-between px-4 overflow-hidden relative opacity-80" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #334155, #334155 2px, transparent 2px, transparent 8px)' }}>
                            </div>
                            <span className="text-[8px] font-mono tracking-widest text-slate-400 uppercase">EDUCONNECT-OFFICIAL-VERIFIED</span>
                          </div>
                        </div>

                        {/* Interactive Section */}
                        {activeBillDetail.status === 'Paid' ? (
                          /* For PAID bills: Download option */
                          <div className="space-y-3">
                            <button
                              onClick={() => {
                                setDownloadingBillId(activeBillDetail.id);
                                setTimeout(() => {
                                  setDownloadingBillId(null);
                                  setDownloadSuccessMessage(`Kuitansi ${activeBillDetail.title} berhasil diunduh ke perangkat Anda!`);
                                  setTimeout(() => {
                                    setDownloadSuccessMessage(null);
                                  }, 3000);
                                }, 1500);
                              }}
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-display font-bold py-3.5 rounded-2xl shadow-lg transition-colors flex items-center justify-center gap-2 text-xs"
                              disabled={downloadingBillId === activeBillDetail.id}
                              id="download-receipt-btn"
                            >
                              {downloadingBillId === activeBillDetail.id ? (
                                <>
                                  <span className="w-4 h-4 border-2 border-slate-300 border-t-white rounded-full animate-spin"></span>
                                  Mengunduh Kuitansi...
                                </>
                              ) : (
                                <>
                                  <Download size={16} />
                                  Unduh Kuitansi Resmi (PDF)
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          /* For UNPAID bills: Integrated Payment Simulator */
                          <div className="space-y-4">
                            {!isPaying ? (
                              <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-2xl space-y-3 text-xs">
                                <h4 className="font-bold text-rose-800 flex items-center gap-1.5">
                                  <AlertTriangle size={15} />
                                  Instruksi Pembayaran
                                </h4>
                                <p className="text-slate-600 leading-normal">
                                  Silakan pilih metode pembayaran pilihan Anda di bawah ini dan lakukan pembayaran virtual terpadu sebelum tanggal tenggat waktu.
                                </p>
                                
                                <button
                                  onClick={() => {
                                    setSelectedBillForPayment(activeBillDetail);
                                    setPaymentStep('form');
                                    setIsPaying(true);
                                  }}
                                  className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-display font-bold py-3 rounded-xl custom-shadow transition-colors text-xs flex items-center justify-center gap-2"
                                  id="start-payment-from-details"
                                >
                                  <CreditCard size={15} />
                                  Pilih Metode & Bayar Sekarang
                                </button>
                              </div>
                            ) : (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-4 animate-fade-in"
                              >
                                {paymentStep === 'form' ? (
                                  <>
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h5 className="font-display font-bold text-sm text-slate-800">Metode Pembayaran</h5>
                                        <p className="text-[11px] text-slate-400">Pilih channel pembayaran Anda</p>
                                      </div>
                                      <span className="text-xs font-bold text-brand-blue">Rp {activeBillDetail.amount.toLocaleString('id-ID')}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                      {['gopay', 'bca', 'mandiri', 'shopeepay'].map((method) => (
                                        <button
                                          key={method}
                                          type="button"
                                          onClick={() => setPaymentMethod(method as any)}
                                          className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                                            paymentMethod === method
                                              ? 'border-brand-accent bg-amber-50/50 font-bold text-slate-800'
                                              : 'border-slate-200 text-slate-600 bg-white'
                                          }`}
                                        >
                                          <span className="text-xs uppercase font-display">{method}</span>
                                          {paymentMethod === method && <CheckCircle size={14} className="text-brand-accent" />}
                                        </button>
                                      ))}
                                    </div>

                                    {paymentError && (
                                      <div className="mt-2 text-rose-500 font-bold text-[10px] text-center leading-normal bg-rose-50 border border-rose-100 p-2 rounded-xl">
                                        {paymentError}
                                      </div>
                                    )}

                                    <div className="pt-2">
                                      <button
                                        onClick={async () => {
                                          setPaymentLoading(true);
                                          setPaymentError('');
                                          try {
                                            const response = await fetch('/api/duitku/inquiry', {
                                              method: 'POST',
                                              headers: {
                                                'Content-Type': 'application/json'
                                              },
                                              body: JSON.stringify({
                                                studentId: currentStudent.id,
                                                billId: activeBillDetail.id,
                                                paymentMethod,
                                                amount: activeBillDetail.amount,
                                                billTitle: activeBillDetail.title,
                                                studentName: currentStudent.name,
                                                parentPhone: currentStudent.phone || '081234567890'
                                              })
                                            });
                                            const data = await response.json();
                                            if (response.ok && data.paymentUrl) {
                                              window.location.href = data.paymentUrl;
                                            } else {
                                              setPaymentError(data.error || 'Gagal memulai pembayaran Duitku.');
                                            }
                                          } catch (err: any) {
                                            setPaymentError(err.message || 'Terjadi kesalahan jaringan.');
                                          } finally {
                                            setPaymentLoading(false);
                                          }
                                        }}
                                        disabled={paymentLoading}
                                        className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow disabled:opacity-50"
                                        id="confirm-payment-btn"
                                      >
                                        {paymentLoading ? (
                                          <>
                                            <span className="w-4 h-4 border-2 border-slate-300 border-t-white rounded-full animate-spin"></span>
                                            Menghubungkan Duitku...
                                          </>
                                        ) : (
                                          `Konfirmasi & Bayar Rp ${activeBillDetail.amount.toLocaleString('id-ID')}`
                                        )}
                                      </button>
                                      
                                      <button
                                        onClick={() => setIsPaying(false)}
                                        disabled={paymentLoading}
                                        className="w-full mt-2 text-slate-400 hover:text-slate-600 font-bold text-[11px] transition-colors text-center py-1 disabled:opacity-50"
                                      >
                                        Batal
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-center py-4 space-y-2">
                                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2 text-emerald-600 animate-bounce">
                                      <CheckCircle size={24} />
                                    </div>
                                    <h6 className="font-display font-bold text-sm text-slate-800">Pembayaran Berhasil!</h6>
                                    <p className="text-xs text-slate-400">Tagihan Anda sudah lunas terverifikasi.</p>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* ====== 2. LIST VIEW WITH SUMMARIES & TABS ====== */
                      <div className="space-y-5 animate-fade-in">
                        <div>
                          <h3 className="font-display font-extrabold text-xl text-slate-950">SPP & Administrasi</h3>
                          <p className="text-xs text-slate-400">Kelola rincian tagihan keuangan {currentStudent.name}</p>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 gap-3">
                          {/* Summary Belum Lunas */}
                          <div className="bg-rose-50/50 border border-rose-100 p-3.5 rounded-2xl">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Belum Lunas</span>
                            <span className="font-display font-extrabold text-base text-rose-600 block mt-1">
                              Rp {currentStudent.sppBills.filter(b => b.status === 'Unpaid').reduce((sum, b) => sum + b.amount, 0).toLocaleString('id-ID')}
                            </span>
                            <span className="text-[9px] text-rose-500 font-medium block mt-0.5">
                              {currentStudent.sppBills.filter(b => b.status === 'Unpaid').length} Tagihan Aktif
                            </span>
                          </div>

                          {/* Summary Sudah Lunas */}
                          <div className="bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-2xl">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sudah Lunas</span>
                            <span className="font-display font-extrabold text-base text-brand-green-dark block mt-1">
                              Rp {currentStudent.sppBills.filter(b => b.status === 'Paid').reduce((sum, b) => sum + b.amount, 0).toLocaleString('id-ID')}
                            </span>
                            <span className="text-[9px] text-brand-green font-medium block mt-0.5">
                              {currentStudent.sppBills.filter(b => b.status === 'Paid').length} Transaksi Lunas
                            </span>
                          </div>
                        </div>

                        {/* Tab Selector Inside SPP Modal */}
                        <div className="flex border-b border-slate-100 p-0.5 bg-slate-50 rounded-xl">
                          <button
                            onClick={() => setActiveSppTab('all')}
                            className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${
                              activeSppTab === 'all'
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            Semua Tagihan
                          </button>
                          <button
                            onClick={() => setActiveSppTab('unpaid')}
                            className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all relative ${
                              activeSppTab === 'unpaid'
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            Belum Lunas
                            {currentStudent.sppBills.filter(b => b.status === 'Unpaid').length > 0 && (
                              <span className="absolute top-1 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                            )}
                          </button>
                          <button
                            onClick={() => setActiveSppTab('paid')}
                            className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${
                              activeSppTab === 'paid'
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            Riwayat Transaksi
                          </button>
                        </div>

                        {/* Bills Feed */}
                        <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1">
                          {currentStudent.sppBills
                            .filter((bill) => {
                              if (activeSppTab === 'unpaid') return bill.status === 'Unpaid';
                              if (activeSppTab === 'paid') return bill.status === 'Paid';
                              return true;
                            })
                            .length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-xs">
                              Tidak ada data tagihan dalam kategori ini.
                            </div>
                          ) : (
                            currentStudent.sppBills
                              .filter((bill) => {
                                if (activeSppTab === 'unpaid') return bill.status === 'Unpaid';
                                if (activeSppTab === 'paid') return bill.status === 'Paid';
                                return true;
                              })
                              .map((bill) => (
                                <div
                                  key={bill.id}
                                  onClick={() => setSelectedBillForDetail(bill)}
                                  className={`p-4 rounded-2xl border transition-all hover:border-slate-300 cursor-pointer flex items-center justify-between ${
                                    bill.status === 'Paid'
                                      ? 'bg-slate-50 border-slate-100/80 hover:bg-slate-100/50'
                                      : 'bg-rose-50/20 border-rose-100 hover:bg-rose-50/40'
                                  }`}
                                >
                                  <div className="space-y-1 flex-1 pr-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h5 className="font-display font-semibold text-xs text-slate-800 leading-tight">{bill.title}</h5>
                                      {bill.status === 'Paid' ? (
                                        <span className="bg-emerald-50 text-brand-green text-[8px] font-bold px-2 py-0.5 rounded-full border border-emerald-100 whitespace-nowrap">
                                          LUNAS
                                        </span>
                                      ) : (
                                        <span className="bg-rose-50 text-rose-600 text-[8px] font-bold px-2 py-0.5 rounded-full border border-rose-100 whitespace-nowrap">
                                          BELUM LUNAS
                                        </span>
                                      )}
                                    </div>
                                    
                                    <p className="text-[10px] text-slate-400">
                                      {bill.status === 'Paid' ? `Lunas pada: ${bill.paidAt || '25 Juni 2026'}` : `Tenggat: ${bill.dueDate}`}
                                    </p>
                                    <span className="text-xs font-bold text-slate-800 block">Rp {bill.amount.toLocaleString('id-ID')}</span>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                                    {bill.status === 'Paid' && (
                                      <button
                                        onClick={() => {
                                          setDownloadingBillId(bill.id);
                                          setTimeout(() => {
                                            setDownloadingBillId(null);
                                            setDownloadSuccessMessage(`Kuitansi ${bill.title} berhasil diunduh ke perangkat Anda!`);
                                            setTimeout(() => {
                                              setDownloadSuccessMessage(null);
                                            }, 3000);
                                          }, 1500);
                                        }}
                                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] flex items-center gap-1.5 transition-colors shadow-sm focus:outline-none"
                                        disabled={downloadingBillId === bill.id}
                                        id={`download-receipt-list-${bill.id}`}
                                      >
                                        {downloadingBillId === bill.id ? (
                                          <>
                                            <span className="w-3 h-3 border border-slate-400 border-t-white rounded-full animate-spin"></span>
                                            Unduh...
                                          </>
                                        ) : (
                                          <>
                                            <Download size={11} />
                                            Unduh Bukti
                                          </>
                                        )}
                                      </button>
                                    )}
                                    <button 
                                      onClick={() => setSelectedBillForDetail(bill)}
                                      className="flex items-center gap-1 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                                    >
                                      <span className="text-[10px] font-bold text-brand-blue hover:underline hidden sm:inline-block">Lihat Rincian</span>
                                      <ChevronRight size={16} />
                                    </button>
                                  </div>
                                </div>
                              ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Modal Content - AGENDA & KALENDER */}
              {activeModal === 'agenda' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-display font-extrabold text-xl text-slate-950">Agenda & Kegiatan</h3>
                    <p className="text-xs text-slate-400">Kalender akademik penting terdekat</p>
                  </div>

                  <CalendarClockWidget events={calendarEvents} compact={false} />
                </div>
              )}

              {/* Modal Content - RAPOR & NILAI */}
              {activeModal === 'rapor' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="font-display font-extrabold text-xl text-slate-950">Rapor & Nilai</h3>
                    <p className="text-xs text-slate-400">Perkembangan nilai tugas & ujian {currentStudent.name}</p>
                  </div>

                  {/* Summary Ringkasan Card */}
                  <div className="bg-gradient-to-r from-brand-blue to-brand-blue-light text-white p-5 rounded-3xl flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs text-slate-300 font-medium uppercase block">Rata-rata Tugas</span>
                      <h4 className="font-display font-extrabold text-3xl text-yellow-400">{averageScore}</h4>
                      <p className="text-[10px] text-slate-300 leading-normal">Berdasarkan {currentStudent.grades.length} nilai tugas terinput semester ini.</p>
                    </div>
                    <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md shrink-0">
                      <GraduationCap size={36} className="text-yellow-400" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Daftar Nilai Akademik</h4>
                    
                    {currentStudent.grades.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-sm">
                        Belum ada nilai terinput untuk {currentStudent.name}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {currentStudent.grades.map((grade, idx) => (
                          <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                            <div className="space-y-1">
                              <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded">
                                {grade.type} • {grade.date}
                              </span>
                              <h5 className="font-display font-bold text-xs text-slate-800">{grade.subject}</h5>
                            </div>
                            <div className="text-right">
                              <span className={`text-base font-extrabold block ${grade.score >= 80 ? 'text-brand-green' : 'text-slate-700'}`}>
                                {grade.score}
                              </span>
                              <span className="text-[10px] text-slate-400 block">KBM: 75</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Modal Content - ANNOUNCEMENT DETAIL */}
              {activeModal === 'announcement' && selectedAnnouncement && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-brand-green bg-emerald-50 px-2 py-0.5 rounded-full">
                      {selectedAnnouncement.category}
                    </span>
                    <h3 className="font-display font-extrabold text-lg text-slate-900 leading-snug">
                      {selectedAnnouncement.title}
                    </h3>
                    <span className="text-xs text-slate-400 font-semibold block">{selectedAnnouncement.date}</span>
                  </div>

                  <hr className="border-slate-100" />

                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {selectedAnnouncement.content}
                  </p>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50 text-xs text-slate-500 leading-normal flex items-start gap-2">
                    <Sparkles className="text-brand-accent shrink-0 mt-0.5" size={16} />
                    <span>Silakan hubungi Wali Kelas jika terdapat pertanyaan terkait edaran atau pengumuman ini.</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}


      </AnimatePresence>
    </div>
  );
}
