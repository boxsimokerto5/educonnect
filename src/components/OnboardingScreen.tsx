import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  MessageSquare, 
  Calendar, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  UserCheck, 
  CreditCard,
  X,
  FileSpreadsheet
} from 'lucide-react';

interface OnboardingScreenProps {
  onComplete: () => void;
  key?: string;
}

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  bgColor: string;
  textColor: string;
  badgeBg: string;
  badgeText: string;
  accentClass: string;
  icon: React.ElementType;
  illustration: React.ReactNode;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right

  const slides: Slide[] = [
    {
      id: 0,
      title: "Selamat Datang di",
      subtitle: "EduConnect Portal",
      description: "Ekosistem digital modern yang menyatukan Yayasan, Sekolah, Guru, dan Wali Murid dalam satu portal komunikasi yang transparan, real-time, dan mudah digunakan.",
      bgColor: "from-sky-500/20 via-blue-500/10 to-[#F8FAFC]",
      textColor: "text-blue-600",
      badgeBg: "bg-blue-500/10",
      badgeText: "text-blue-500",
      accentClass: "border-blue-500/30 shadow-blue-500/10",
      icon: GraduationCap,
      illustration: (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Animated decorative shapes */}
          <div className="absolute w-48 h-48 bg-blue-400/20 rounded-full blur-2xl animate-pulse" />
          <div className="absolute w-32 h-32 bg-sky-400/20 rounded-full blur-xl translate-x-12 -translate-y-8 animate-bounce duration-4000" />
          
          {/* Main graphic */}
          <div className="relative bg-white p-6 rounded-3xl shadow-xl border border-slate-100 max-w-xs w-full flex flex-col gap-4">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
              <div className="p-2.5 bg-blue-500 text-white rounded-2xl shadow-md shadow-blue-500/20">
                <GraduationCap size={24} />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-800 tracking-tight">SD EduConnect</h4>
                <p className="text-[10px] text-slate-400 font-medium">Sistem Informasi Sekolah</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-2xl border border-slate-100/50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-slate-600 font-bold">Data Terintegrasi</span>
                </div>
                <span className="text-[9px] text-slate-400 font-mono">Real-time</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-2xl border border-slate-100/50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                  <span className="text-[10px] text-slate-600 font-bold">Koneksi Orang Tua</span>
                </div>
                <span className="text-[9px] text-blue-500 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded-md">Aktif</span>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-sky-600 bg-sky-500/10 py-2 rounded-2xl">
              <Sparkles size={12} />
              <span>Semua Fitur Dalam Satu Genggaman</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 1,
      title: "Interaksi Nyaman Lewat",
      subtitle: "Buku Penghubung Digital",
      description: "Guru dan wali murid kini dapat bertukar laporan perkembangan siswa, saran pembelajaran, hingga tanggapan resmi secara langsung tanpa perantara kertas.",
      bgColor: "from-emerald-500/20 via-teal-500/10 to-[#F8FAFC]",
      textColor: "text-emerald-600",
      badgeBg: "bg-emerald-500/10",
      badgeText: "text-emerald-500",
      accentClass: "border-emerald-500/30 shadow-emerald-500/10",
      icon: MessageSquare,
      illustration: (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute w-44 h-44 bg-emerald-400/15 rounded-full blur-2xl" />
          
          <div className="relative flex flex-col gap-3 max-w-[280px] w-full">
            {/* Teacher Chat */}
            <div className="bg-emerald-600 text-white p-3.5 rounded-2xl rounded-tl-none shadow-lg max-w-[85%] self-start border border-emerald-500/20">
              <p className="text-[11px] font-semibold leading-relaxed">Selamat pagi Bapak/Ibu. Hari ini Ananda berpartisipasi aktif dalam praktikum sains dan mendapatkan nilai penuh! 🌟</p>
              <span className="text-[8px] text-emerald-200 mt-1 block font-mono text-right">08:15 WIB - Wali Kelas</span>
            </div>
            
            {/* Parent Chat */}
            <div className="bg-white text-slate-800 p-3.5 rounded-2xl rounded-tr-none shadow-md max-w-[85%] self-end border border-slate-100">
              <p className="text-[11px] font-semibold leading-relaxed text-slate-600">Alhamdulillah, terima kasih banyak atas bimbingannya Ibu Rina. Sangat memotivasi anak kami.</p>
              <span className="text-[8px] text-slate-400 mt-1 block font-mono text-right">08:20 WIB - Wali Murid</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "Pantau Absensi & Ajukan",
      subtitle: "Izin Sakit & Keperluan",
      description: "Kemudahan mengajukan perizinan secara online lengkap dengan unggah surat dokter. Orang tua langsung menerima notifikasi saat absensi harian diperbarui oleh guru kelas.",
      bgColor: "from-amber-500/20 via-orange-500/10 to-[#F8FAFC]",
      textColor: "text-amber-600",
      badgeBg: "bg-amber-500/10",
      badgeText: "text-amber-500",
      accentClass: "border-amber-500/30 shadow-amber-500/10",
      icon: Calendar,
      illustration: (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute w-44 h-44 bg-amber-400/20 rounded-full blur-2xl" />
          
          <div className="relative bg-white p-5 rounded-3xl shadow-xl border border-slate-100 max-w-xs w-full flex flex-col gap-3.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-extrabold text-slate-800 tracking-tight">Pengajuan Izin Siswa</span>
              <span className="text-[9px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-black">PENDING</span>
            </div>
            
            <div className="space-y-2 border-y border-slate-50 py-3">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400 font-medium">Jenis Izin</span>
                <span className="font-bold text-slate-700 bg-amber-500/10 px-2 py-0.5 rounded-lg text-amber-600">Sakit (Demam)</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400 font-medium">Durasi</span>
                <span className="font-bold text-slate-700">29 Jun - 30 Jun 2026</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-emerald-500/10 p-2.5 rounded-2xl border border-emerald-500/20">
              <div className="bg-emerald-500 text-white p-1 rounded-lg">
                <UserCheck size={14} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-emerald-800 leading-none">Presensi Terverifikasi</p>
                <p className="text-[8px] text-emerald-600/80 font-medium mt-0.5">Sudah Diabsen oleh Wali Kelas</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "Transparansi Biaya &",
      subtitle: "Pembayaran SPP Lancar",
      description: "Dapatkan pemberitahuan otomatis untuk tagihan SPP bulanan. Lakukan simulasi pembayaran cepat via Duitku Simulator atau unggah langsung bukti transaksi Anda secara mandiri.",
      bgColor: "from-indigo-500/20 via-purple-500/10 to-[#F8FAFC]",
      textColor: "text-indigo-600",
      badgeBg: "bg-indigo-500/10",
      badgeText: "text-indigo-500",
      accentClass: "border-indigo-500/30 shadow-indigo-500/10",
      icon: CreditCard,
      illustration: (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute w-44 h-44 bg-indigo-400/20 rounded-full blur-2xl" />
          
          <div className="relative bg-white p-5 rounded-3xl shadow-xl border border-slate-100 max-w-xs w-full flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="p-1.5 bg-indigo-500 text-white rounded-xl">
                  <CreditCard size={14} />
                </div>
                <span className="text-[10px] font-black text-slate-800">SPP Bulan Juni</span>
              </div>
              <span className="text-[8px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">LUNAS</span>
            </div>
            
            <div className="bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100/50">
              <span className="text-[9px] text-slate-400 font-medium block">Jumlah Tagihan</span>
              <span className="text-sm font-black text-indigo-700 font-mono tracking-tight">Rp 350.000</span>
            </div>
            
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
              <CheckCircle2 size={12} className="text-emerald-500" />
              <span>Diverifikasi oleh Yayasan & Keuangan</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentSlide === slides.length - 1) {
      // Complete onboarding
      localStorage.setItem('hasCompletedOnboarding', 'true');
      onComplete();
    } else {
      setDirection(1);
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('hasCompletedOnboarding', 'true');
    onComplete();
  };

  const activeSlide = slides[currentSlide];
  const IconComponent = activeSlide.icon;

  // Slide transition variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 120 : -120,
      opacity: 0,
      scale: 0.98
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring', stiffness: 380, damping: 28 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 }
      }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -120 : 120,
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: 'spring', stiffness: 380, damping: 28 },
        opacity: { duration: 0.15 },
        scale: { duration: 0.15 }
      }
    })
  };

  return (
    <div className={`fixed inset-0 z-[9995] flex flex-col items-center justify-center bg-gradient-to-b ${activeSlide.bgColor} transition-all duration-700 ease-out p-4 md:p-8 select-none font-sans overflow-hidden`}>
      {/* Absolute Header with Skip Button */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-[9996]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-950/20 border border-slate-800">
            <GraduationCap className="text-yellow-400" size={18} />
          </div>
          <span className="font-display font-black text-xs text-slate-900 tracking-tight">EduConnect</span>
        </div>
        
        <button
          onClick={handleSkip}
          className="flex items-center gap-1 px-3.5 py-1.5 bg-slate-900/10 hover:bg-slate-900/15 text-slate-800 text-[11px] font-extrabold rounded-full active:scale-95 transition-all"
        >
          <span>Skip</span>
          <X size={12} />
        </button>
      </div>

      {/* Main Slide Card Container */}
      <div className="w-full max-w-lg bg-white/90 backdrop-blur-xl rounded-[40px] shadow-[0_20px_50px_rgba(15,23,42,0.12)] border border-white/60 p-6 md:p-8 flex flex-col justify-between h-[82vh] max-h-[640px] relative overflow-hidden">
        
        {/* Animated Slide Content */}
        <div className="flex-1 flex flex-col justify-between mt-4">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex-1 flex flex-col"
            >
              {/* Slide Graphic / Illustration Area */}
              <div className="flex-1 min-h-[180px] max-h-[260px] flex items-center justify-center rounded-[32px] bg-slate-50/50 border border-slate-100 p-4 relative overflow-hidden">
                {activeSlide.illustration}
              </div>

              {/* Title & Badge */}
              <div className="mt-6 text-center space-y-2.5">
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 mx-auto">
                  <IconComponent size={10} className={activeSlide.textColor} />
                  <span>Fitur Unggulan {currentSlide + 1} of {slides.length}</span>
                </div>
                
                <h3 className="text-lg md:text-xl font-display font-black text-slate-900 leading-tight">
                  {activeSlide.title} <br />
                  <span className={activeSlide.textColor}>{activeSlide.subtitle}</span>
                </h3>
                
                <p className="text-[12px] md:text-xs text-slate-500 font-semibold leading-relaxed px-2 md:px-6">
                  {activeSlide.description}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer / Controls Section */}
        <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-100">
          {/* Back Button */}
          <button
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className={`p-3 rounded-2xl flex items-center justify-center border transition-all ${
              currentSlide === 0 
                ? "border-slate-100 text-slate-300 cursor-not-allowed" 
                : "border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95"
            }`}
            aria-label="Kembali"
          >
            <ArrowLeft size={16} />
          </button>

          {/* Dots Indicator */}
          <div className="flex items-center gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => {
                  setDirection(index > currentSlide ? 1 : -1);
                  setCurrentSlide(index);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? `w-6 bg-slate-900` 
                    : "w-2 bg-slate-200 hover:bg-slate-300"
                }`}
                aria-label={`Slide ke-${index + 1}`}
              />
            ))}
          </div>

          {/* Next / Finish Button */}
          <button
            onClick={handleNext}
            className={`flex items-center gap-1.5 px-5 py-3 rounded-2xl text-[12px] font-black transition-all active:scale-95 shadow-md ${
              currentSlide === slides.length - 1
                ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20"
                : "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-950/20"
            }`}
          >
            <span>{currentSlide === slides.length - 1 ? "Mulai Sekarang" : "Lanjut"}</span>
            <ArrowRight size={14} />
          </button>
        </div>

      </div>

      {/* Modern Bright Glows background circles */}
      <div className="absolute top-1/4 -right-20 w-80 h-80 bg-pink-400/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-teal-400/10 rounded-full blur-[80px] pointer-events-none" />
    </div>
  );
}
