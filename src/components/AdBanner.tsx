import React, { useState, useEffect } from 'react';
import { School } from '../types';
import { Crown, Megaphone, X, ExternalLink, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdBannerProps {
  currentSchool: School | null;
}

interface SimulatedAd {
  id: string;
  title: string;
  tagline: string;
  sponsor: string;
  badge: string;
  gradient: string;
  icon: string;
  color: string;
}

const SIMULATED_ADS: SimulatedAd[] = [
  {
    id: 'ad-calistung',
    title: 'Bimbingan Belajar Anak Juara',
    tagline: 'Metode kilat membaca, menulis & berhitung menyenangkan untuk anak usia TK/PAUD!',
    sponsor: 'Bimbel Juara Kids',
    badge: 'KURSUS POPULER',
    gradient: 'from-emerald-500 to-teal-600',
    icon: '✏️',
    color: 'emerald'
  },
  {
    id: 'ad-milk',
    title: 'Susu NutriGrow Anak Pintar',
    tagline: 'Kaya akan DHA, omega 3, dan vitamin C untuk menunjang tumbuh kembang kognitif si kecil.',
    sponsor: 'NutriGrow Indonesia',
    badge: 'SPONSOR UTAMA',
    gradient: 'from-blue-500 to-indigo-600',
    icon: '🥛',
    color: 'blue'
  },
  {
    id: 'ad-book',
    title: 'Seri Ensiklopedia Anak Kreatif',
    tagline: 'Buka cakrawala si kecil dengan buku visual petualangan dinosaurus & antariksa!',
    sponsor: 'Penerbit Mutiara Ilmu',
    badge: 'DISKON 35%',
    gradient: 'from-amber-500 to-orange-600',
    icon: '📚',
    color: 'amber'
  },
  {
    id: 'ad-honey',
    title: 'Madu Kids Immun Booster',
    tagline: '100% Madu murni + ekstrak Temulawak menjaga daya tahan tubuh anak dari flu & demam.',
    sponsor: 'Herbal Alami Sehat',
    badge: 'REKOMENDASI IBU',
    gradient: 'from-rose-500 to-pink-600',
    icon: '🍯',
    color: 'rose'
  }
];

export default function AdBanner({ currentSchool }: AdBannerProps) {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Auto rotate ads every 8 seconds
  useEffect(() => {
    if (currentSchool?.isPremium) return;
    const interval = setInterval(() => {
      setCurrentAdIndex((prevIndex) => (prevIndex + 1) % SIMULATED_ADS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [currentSchool?.isPremium]);

  // If school is premium, strictly do not show advertisements!
  if (currentSchool?.isPremium) {
    return null;
  }

  const ad = SIMULATED_ADS[currentAdIndex];

  return (
    <>
      <div className="w-full px-6 py-3" id="ad-banner-container">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative group">
          {/* Top Info Bar */}
          <div className="bg-slate-50 px-4 py-1.5 flex justify-between items-center border-b border-slate-100">
            <span className="text-[9px] font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <Megaphone size={10} className="text-slate-400" />
              PROMOSI MITRA EDUCONNECT (AKUN GRATIS)
            </span>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="text-[9px] font-black text-amber-600 hover:text-amber-700 uppercase flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100 transition-colors"
            >
              <Crown size={9} className="fill-amber-500 text-amber-500" />
              HILANGKAN IKLAN
            </button>
          </div>

          {/* Ad Body */}
          <AnimatePresence mode="wait">
            <motion.div
              key={ad.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className="p-4 flex flex-col sm:flex-row items-center sm:items-start gap-4"
            >
              {/* Ad Visual Icon */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${ad.gradient} text-white flex items-center justify-center text-3xl shadow-md shrink-0`}>
                {ad.icon}
              </div>

              {/* Ad Text Details */}
              <div className="space-y-1 text-center sm:text-left flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                  <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full inline-block">
                    {ad.badge}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">Oleh {ad.sponsor}</span>
                </div>
                <h4 className="font-display font-black text-slate-800 text-sm tracking-tight">{ad.title}</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2 sm:line-clamp-1">
                  {ad.tagline}
                </p>
              </div>

              {/* Ad Action Call Button */}
              <button
                onClick={() => {
                  alert(`[Simulasi Promosi] Membuka halaman sponsor: ${ad.sponsor}. Upgrade ke Premium untuk menghilangkan iklan ini.`);
                }}
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] py-2 px-3.5 rounded-xl flex items-center justify-center gap-1 shrink-0 mt-2 sm:mt-0 shadow-sm transition-all self-center"
              >
                Kunjungi Situs
                <ExternalLink size={10} />
              </button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Upgrade Premium Explanation Dialog */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Crown size={20} className="fill-white animate-pulse" />
                  <h3 className="font-display font-black text-sm uppercase tracking-wide">Aktivasi EduConnect Premium</h3>
                </div>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="text-white/80 hover:text-white transition-colors focus:outline-none p-1.5 rounded-full bg-black/10"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 p-4 rounded-2xl text-slate-700 text-xs">
                  <Sparkles size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 font-semibold">
                    <p className="text-sm font-bold text-slate-900">
                      Bebas Iklan & Dukung Sekolah Anda!
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Saat ini, Sekolah mitra terhubung menggunakan paket <strong>EduConnect Regular (Gratis)</strong>, sehingga kami menyertakan iklan pendidikan/anak yang aman untuk membiayai operasional cloud server.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <h4 className="text-xs font-bold text-slate-800">💎 Keuntungan Akun Premium:</h4>
                  <ul className="space-y-2 text-xs font-semibold text-slate-600">
                    <li className="flex items-center gap-2">
                      <span className="text-amber-500 font-bold">✓</span>
                      Bebas dari seluruh iklan promosi selamanya
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-amber-500 font-bold">✓</span>
                      Akses cepat realtime database prioritas
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-amber-500 font-bold">✓</span>
                      Dukungan kustomisasi logo & nama domain sekolah
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-amber-500 font-bold">✓</span>
                      Kapasitas data log tak terbatas untuk guru & murid
                    </li>
                  </ul>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-slate-500 text-[10px] flex items-start gap-1.5 font-medium leading-relaxed">
                  <AlertCircle size={14} className="text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Bagaimana cara mengaktifkannya?</strong> Silakan hubungi <strong>Pihak Yayasan / Kepala Sekolah</strong> Anda. Pengelola sekolah dapat menghubungi Super Admin Global EduConnect untuk memproses lisensi premium instan.
                  </span>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowUpgradeModal(false)}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl shadow transition-all text-center"
                  >
                    Saya Mengerti
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
