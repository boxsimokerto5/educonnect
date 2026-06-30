import React, { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing, Check, Volume2, HelpCircle, X, Info, Settings, ShieldAlert } from 'lucide-react';
import { requestNotificationPermission, playNotificationChime } from '../utils/notifications';

export default function NotificationActivator() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleActivate = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
  };

  const handleTestSound = () => {
    // Play the premium synthesized chime so they can verify sound notifications
    playNotificationChime();
    
    // Also trigger a browser notification to verify native notifications
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('EduConnect Aktif!', {
          body: 'Notifikasi sistem telah berhasil terhubung ke HP / perangkat Anda.',
          icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
        });
      } catch (e) {
        console.log(e);
      }
    }
  };

  if (!('Notification' in window)) {
    return (
      <div className="flex items-center gap-1.5 bg-rose-500/10 text-rose-300 text-[10px] font-semibold px-2.5 py-1 rounded-xl border border-rose-500/20">
        <BellOff size={12} />
        <span>Browser Tidak Mendukung Notif HP</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {permission === 'denied' && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowGuide(true)}
            className="flex items-center gap-1.5 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-[10px] font-black px-2.5 py-1.5 rounded-xl border border-rose-500/20 shadow-sm transition-all active:scale-95 cursor-pointer animate-pulse"
            title="Notifikasi diblokir browser. Klik untuk melihat panduan mengaktifkan."
          >
            <BellOff size={12} className="text-rose-400 animate-bounce" />
            <span>Notif HP Diblokir (Klik)</span>
            <HelpCircle size={10} className="text-rose-300/80 shrink-0" />
          </button>
        </div>
      )}

      {permission === 'granted' && (
        <button
          onClick={handleTestSound}
          className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-3 py-1.5 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/30 active:scale-95 transition-all shadow-sm group"
          title="Klik untuk uji bunyi bel notifikasi!"
        >
          <BellRing size={12} className="text-emerald-400 animate-pulse group-hover:scale-110 transition-transform" />
          <span className="max-xs:hidden">Notif HP Aktif</span>
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
          <Volume2 size={11} className="text-emerald-300 opacity-80" />
        </button>
      )}

      {permission === 'default' && (
        <button
          onClick={handleActivate}
          className="flex items-center gap-1.5 bg-amber-500 text-slate-950 text-[10px] font-black px-3 py-1.5 rounded-xl hover:bg-amber-400 active:scale-95 transition-all shadow-md animate-pulse shrink-0"
        >
          <Bell size={12} className="animate-bounce" />
          <span>Aktifkan Notif HP</span>
        </button>
      )}

      {/* Unblock/Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] text-slate-100">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="bg-rose-500/10 text-rose-400 p-2 rounded-xl border border-rose-500/20 shrink-0">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-sm tracking-tight text-white leading-tight">Panduan Notifikasi HP</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Buka blokir izin notifikasi untuk info aktivitas instan</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto max-h-[380px] space-y-4 custom-scrollbar text-xs">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 flex gap-2.5 text-amber-300">
                <Info size={16} className="shrink-0 mt-0.5" />
                <p className="leading-relaxed font-semibold text-[11px]">
                  Browser mendeteksi bahwa izin notifikasi untuk EduConnect telah dinonaktifkan/diblokir di HP atau browser Anda. Anda harus membukanya secara manual.
                </p>
              </div>

              {/* Steps for Android Chrome */}
              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-black text-[10px]">1</span>
                  Google Chrome (Android / HP biasa)
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 pl-6 text-slate-300 leading-relaxed font-medium text-[11px]">
                  <li>Tekan ikon <span className="text-white font-bold inline-flex items-center gap-0.5"><Settings size={10} className="inline" /> Gembok / Setelan</span> di sebelah kiri alamat bar browser (tempat mengetik nama web di atas).</li>
                  <li>Pilih menu <span className="text-white font-bold">Izin (Permissions)</span> atau <span className="text-white font-bold">Setelan Situs</span>.</li>
                  <li>Cari opsi <span className="text-white font-bold">Notifikasi</span> dan ganti dari <span className="text-rose-400 font-bold">Blokir</span> menjadi <span className="text-emerald-400 font-bold">Izinkan (Allow)</span>.</li>
                  <li>Segarkan / <span className="text-yellow-400 font-bold">Refresh</span> halaman web EduConnect ini.</li>
                </ol>
              </div>

              {/* Steps for iOS Safari */}
              <div className="space-y-2 pt-1 border-t border-slate-800/40">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-black text-[10px]">2</span>
                  iOS Safari (iPhone / iPad)
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 pl-6 text-slate-300 leading-relaxed font-medium text-[11px]">
                  <li>Di Safari, tekan tombol <span className="text-white font-bold">Bagikan (Share)</span> (kotak panah ke atas) di alamat bar bawah.</li>
                  <li>Pilih <span className="text-yellow-400 font-bold">Tambahkan ke Layar Utama (Add to Home Screen)</span> agar aplikasi terpasang seperti aplikasi HP biasa.</li>
                  <li>Buka aplikasi dari ikon di layar utama iPhone Anda tersebut.</li>
                  <li>Masuk kembali (Login) lalu tekan <span className="text-emerald-400 font-bold">"Aktifkan Notif HP"</span> jika diminta.</li>
                </ol>
              </div>

              {/* Steps for other browsers */}
              <div className="space-y-2 pt-1 border-t border-slate-800/40">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-black text-[10px]">3</span>
                  Browser Lain (Samsung / Mi / Edge)
                </h4>
                <p className="pl-6 text-slate-300 leading-relaxed font-medium text-[11px]">
                  Buka pengaturan browser Anda, lalu cari <span className="text-white font-bold">Setelan Situs</span> &gt; <span className="text-white font-bold">Notifikasi</span> &gt; Izinkan untuk alamat website ini.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowGuide(false);
                  window.location.reload();
                }}
                className="px-3.5 py-1.5 bg-yellow-400 text-slate-950 text-xs font-black rounded-xl hover:bg-yellow-300 active:scale-95 transition-all cursor-pointer shadow-md"
              >
                Refresh Halaman
              </button>
              <button
                onClick={() => setShowGuide(false)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

