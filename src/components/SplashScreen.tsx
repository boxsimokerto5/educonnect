import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, ArrowRight, Layers } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  key?: string;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Progress bar simulation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 4;
      });
    }, 60);

    // Auto complete after progress reaches 100
    const timeout = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-gradient-to-br from-slate-900 via-brand-blue to-indigo-950 text-white p-8 overflow-hidden select-none"
    >
      {/* Decorative Background Glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Section - Brand Name Badge */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full backdrop-blur-md mt-6"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-sky-200">
          EduConnect Ecosystem
        </span>
      </motion.div>

      {/* Center Section - Logo and Slogan */}
      <div className="flex flex-col items-center text-center max-w-sm px-4">
        {/* Animated Logo Shield */}
        <motion.div
          initial={{ scale: 0.3, opacity: 0, rotate: -15 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 15,
            delay: 0.1,
          }}
          className="relative w-24 h-24 mb-6 flex items-center justify-center"
        >
          {/* Pulsing Outer Rings */}
          <div className="absolute inset-0 bg-white/5 rounded-[2rem] border border-white/10 rotate-12 scale-105 animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-tr from-sky-400 to-indigo-500 rounded-[2rem] shadow-[0_0_40px_rgba(56,189,248,0.3)] transform -rotate-6" />
          
          {/* Inner Shield */}
          <div className="absolute inset-[3px] bg-slate-900 rounded-[1.8rem] flex items-center justify-center">
            <GraduationCap className="w-12 h-12 text-sky-400" strokeWidth={1.5} />
          </div>

          {/* Decorative floating dots/icons */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 p-1.5 rounded-lg shadow-md"
          >
            <Layers className="w-3.5 h-3.5" />
          </motion.div>
        </motion.div>

        {/* Brand Name Text */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-4xl font-display font-black tracking-tight mb-2 bg-gradient-to-r from-white via-sky-100 to-sky-300 bg-clip-text text-transparent"
        >
          EduConnect
        </motion.h1>

        {/* Tagline / Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-sm text-slate-300 font-semibold leading-relaxed"
        >
          Menghubungkan Sekolah, Guru, &amp; Wali Murid dalam Satu Genggaman
        </motion.p>
      </div>

      {/* Bottom Section - Progress and Skip Button */}
      <div className="w-full max-w-xs flex flex-col items-center gap-6 mb-8">
        {/* Progress Bar Container */}
        <div className="w-full space-y-2">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 font-bold px-1">
            <span>MEMUAT DATA SIMULASI...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden p-[1px]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear" }}
              className="h-full bg-gradient-to-r from-sky-400 to-indigo-400 rounded-full shadow-[0_0_12px_rgba(56,189,248,0.5)]"
            />
          </div>
        </div>

        {/* Skip button with elegant hover/tap active state */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          onClick={onComplete}
          className="flex items-center gap-1.5 text-xs text-sky-300/80 hover:text-sky-300 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl transition-all font-bold active:scale-95 focus:outline-none"
        >
          Lewati 
          <ArrowRight className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </div>
  );
}
