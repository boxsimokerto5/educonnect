import React, { useState } from 'react';
import { Student, EPermit } from '../types';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  UserCheck,
  ChevronRight,
  FileText,
  Sparkles,
  Check,
  Building,
  UserCheck2,
  AlertCircle
} from 'lucide-react';

interface ParentAttendanceTabProps {
  student: Student;
  permits: EPermit[];
  onUpdateAttendance?: (studentId: string, status: Student['attendanceToday'], time?: string) => void;
  onGoToPermit: () => void;
}

export default function ParentAttendanceTab({
  student,
  permits,
  onUpdateAttendance,
  onGoToPermit
}: ParentAttendanceTabProps) {
  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
        <div>
          <h3 className="font-display font-black text-slate-800 text-sm">Memuat Data Presensi...</h3>
          <p className="text-xs text-slate-400 mt-1">Mengambil informasi status kehadiran.</p>
        </div>
      </div>
    );
  }

  const [historyTab, setHistoryTab] = useState<'kehadiran' | 'perizinan'>('kehadiran');
  const studentPermits = permits.filter((p) => p.studentId === student.id);

  // Date representation
  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const historyLogs = student.attendanceHistory || [];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'HADIR':
        return {
          iconClass: 'bg-emerald-50 text-emerald-600',
          badgeClass: 'bg-emerald-100 text-emerald-700'
        };
      case 'SAKIT':
      case 'IZIN':
        return {
          iconClass: 'bg-amber-50 text-amber-600',
          badgeClass: 'bg-amber-100 text-amber-700'
        };
      case 'ALFA':
        return {
          iconClass: 'bg-rose-50 text-rose-600',
          badgeClass: 'bg-rose-100 text-rose-700'
        };
      default:
        return {
          iconClass: 'bg-slate-50 text-slate-600',
          badgeClass: 'bg-slate-100 text-slate-700'
        };
    }
  };

  return (
    <div className="p-6 space-y-6 pt-8 pb-24" id="parent-attendance-monitoring">
      {/* Curved Header Block */}
      <div className="flex items-center justify-between">
        <div className="text-left">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block font-mono">PANTAU REKAPITULASI</span>
          <h2 className="font-display font-black text-xl text-slate-950">Presensi Kelas Real-time</h2>
        </div>
        <div className="bg-slate-100 text-slate-600 font-display font-bold text-[10px] px-3 py-1.5 rounded-full font-mono shadow-sm border border-slate-200">
          {todayFormatted}
        </div>
      </div>

      {/* Selected Student Summary Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <img
              src={student.avatar}
              alt={student.name}
              className={`w-14 h-14 rounded-2xl object-cover border-4 ${
                student.attendanceToday === 'HADIR' ? 'border-emerald-100' : 'border-slate-100'
              }`}
              referrerPolicy="no-referrer"
            />
            {student.attendanceToday === 'HADIR' && (
              <span className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 text-white p-1 rounded-full border-2 border-white shadow-sm">
                <Check size={10} className="stroke-[3.5px]" />
              </span>
            )}
          </div>
          <div className="text-left">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Siswa Terpilih:</span>
            <h3 className="font-display font-black text-sm text-slate-900 uppercase tracking-tight">{student.name}</h3>
            <span className="text-xs text-slate-500 font-semibold block">{student.class} • NIS: {student.nis || '120485'}</span>
          </div>
        </div>

        {/* Current status badge */}
        <div>
          {student.attendanceToday === 'HADIR' ? (
            <span className="text-[10px] bg-emerald-500 text-white font-extrabold px-3 py-1.5 rounded-xl shadow-sm tracking-wider font-mono">
              HADIR
            </span>
          ) : student.attendanceToday === 'SAKIT' ? (
            <span className="text-[10px] bg-amber-500 text-white font-extrabold px-3 py-1.5 rounded-xl shadow-sm tracking-wider font-mono">
              SAKIT
            </span>
          ) : student.attendanceToday === 'IZIN' ? (
            <span className="text-[10px] bg-sky-500 text-white font-extrabold px-3 py-1.5 rounded-xl shadow-sm tracking-wider font-mono">
              IZIN
            </span>
          ) : student.attendanceToday === 'ALFA' ? (
            <span className="text-[10px] bg-red-600 text-white font-extrabold px-3 py-1.5 rounded-xl shadow-sm tracking-wider font-mono">
              ALFA
            </span>
          ) : (
            <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-3 py-1.5 rounded-xl tracking-wider font-mono">
              BELUM DIINPUT GURU
            </span>
          )}
        </div>
      </div>

      {/* Main Monitoring Stage */}
      <div className="space-y-6">
        {/* Status Panel Box */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-[2rem] p-6 relative overflow-hidden shadow-xl border border-slate-800">
          {/* Absensi Background glow */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-brand-blue/15 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-white/10 text-emerald-400 p-2 rounded-xl backdrop-blur-sm">
                <UserCheck2 size={18} />
              </div>
              <div className="text-left">
                <span className="text-[9px] text-slate-400 font-extrabold tracking-wider block uppercase font-mono">Panel Informasi Presensi</span>
                <h4 className="font-display font-extrabold text-xs text-slate-100">Status Kehadiran Hari Ini</h4>
              </div>
            </div>

            <div className="border-t border-white/10 pt-5 flex flex-col justify-center items-center text-center space-y-3">
              {student.attendanceToday === 'HADIR' ? (
                <>
                  <div className="bg-emerald-500 text-white p-4 rounded-full shadow-lg shadow-emerald-500/25">
                    <CheckCircle2 size={36} />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-display font-black text-sm text-emerald-400">Telah Terdaftar Hadir oleh Guru</h5>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-xs">
                      Ananda <strong>{student.name}</strong> telah dicatat dan terverifikasi <strong>Hadir</strong> di kelas oleh Wali Kelas pada pukul <strong>{student.attendanceTime || '07:15 WIB'}</strong>.
                    </p>
                  </div>
                </>
              ) : student.attendanceToday === 'SAKIT' || student.attendanceToday === 'IZIN' ? (
                <>
                  <div className="bg-sky-500 text-white p-4 rounded-full shadow-lg shadow-sky-500/25">
                    <Clock size={36} />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-display font-black text-sm text-sky-400">Izin Kehadiran Aktif</h5>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-xs">
                      Ananda terdaftar tidak masuk kelas dengan keterangan resmi <strong>{student.attendanceToday === 'SAKIT' ? 'Sakit' : 'Izin Khusus'}</strong> yang telah dikonfirmasi dan disetujui oleh sekolah.
                    </p>
                  </div>
                </>
              ) : student.attendanceToday === 'ALFA' ? (
                <>
                  <div className="bg-red-500 text-white p-4 rounded-full shadow-lg shadow-red-500/25">
                    <AlertTriangle size={36} />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-display font-black text-sm text-red-400">Tidak Hadir (Tanpa Keterangan)</h5>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-xs">
                      Ananda dicatat <strong>Tidak Hadir (Alfa)</strong> oleh guru kelas untuk hari ini. Silakan hubungi wali kelas jika ada kekeliruan atau kendala teknis.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-slate-700 text-slate-300 p-4 rounded-full shadow-lg shadow-slate-700/25">
                    <Clock size={36} />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-display font-black text-sm text-slate-300">Menunggu Input Wali Kelas</h5>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                      Wali kelas belum mengonfirmasi presensi harian untuk <strong>{student.name}</strong> pada hari ini. Status akan diperbarui secara real-time setelah guru melakukan pencatatan di kelas.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Informational Box informing parents about policy */}
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 flex items-start gap-3.5 text-left text-slate-800">
          <div className="bg-slate-200/60 p-2 rounded-xl text-slate-600 shrink-0">
            <AlertCircle size={18} />
          </div>
          <div className="text-xs space-y-1 flex-1">
            <h5 className="font-display font-bold text-slate-900">Kebijakan Presensi Siswa</h5>
            <p className="text-slate-500 leading-relaxed font-medium">
              Demi akurasi dan ketertiban akademik, pencatatan kehadiran dilakukan sepenuhnya oleh Guru Wali Kelas di sekolah demi menghindari manipulasi. Orang tua hanya dapat memantau rekapitulasinya secara langsung di halaman ini.
            </p>
          </div>
        </div>

        {/* History & Permit Tabs Block */}
        <div className="space-y-4">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
            <button
              onClick={() => setHistoryTab('kehadiran')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                historyTab === 'kehadiran'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Riwayat Kehadiran
            </button>
            <button
              onClick={() => setHistoryTab('perizinan')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                historyTab === 'perizinan'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Riwayat Perizinan ({studentPermits.length})
            </button>
          </div>

          {historyTab === 'kehadiran' ? (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-left font-mono">Kehadiran Harian</h4>
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                {historyLogs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 space-y-2">
                    <Calendar size={28} className="mx-auto text-slate-300 stroke-[1.5]" />
                    <p className="text-xs font-semibold">Belum ada riwayat kehadiran.</p>
                    <p className="text-[10px] text-slate-400 leading-normal font-medium max-w-[240px] mx-auto">
                      Riwayat presensi harian akan terekam otomatis setiap pukul 18:00 WIB setelah dilakukan pencatatan.
                    </p>
                  </div>
                ) : (
                  historyLogs.map((log, index) => {
                    const style = getStatusStyle(log.status);
                    return (
                      <div key={index} className="p-4 flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${style.iconClass}`}>
                            <Calendar size={14} />
                          </div>
                          <span className="text-slate-700 text-left font-medium">{log.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {log.time && <span className="text-[10px] text-slate-400 font-bold font-mono">{log.time}</span>}
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono ${style.badgeClass}`}>
                            {log.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-left font-mono">Daftar Pengajuan Izin (Sakit / Lainnya)</h4>
              {studentPermits.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                  <FileText size={28} className="mx-auto text-slate-300 stroke-[1.5]" />
                  <p className="text-xs font-semibold">Belum ada riwayat perizinan.</p>
                  <p className="text-[10px] text-slate-400 leading-normal font-medium max-w-[240px] mx-auto">
                    Semua pengajuan izin sakit atau keperluan lainnya akan tercatat di sini beserta status persetujuannya.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {studentPermits.map((permit) => {
                    const isSakit = permit.type === 'Sakit';
                    const statusColors = {
                      Pending: 'bg-amber-50 text-amber-700 border-amber-100',
                      Approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                      Rejected: 'bg-rose-50 text-rose-700 border-rose-100',
                    };
                    const statusLabel = {
                      Pending: 'Menunggu',
                      Approved: 'Disetujui',
                      Rejected: 'Ditolak',
                    };

                    return (
                      <div key={permit.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3 text-left">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border ${
                              isSakit ? 'bg-red-50 text-red-600 border-red-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                            }`}>
                              {isSakit ? 'Sakit' : 'Lainnya'}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold font-mono">
                              {new Date(permit.submittedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${statusColors[permit.status]}`}>
                            {statusLabel[permit.status]}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-slate-700 font-bold">
                            <Calendar size={13} className="text-slate-400" />
                            <span>{permit.startDate} s/d {permit.endDate}</span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            <strong className="text-slate-600">Alasan:</strong> {permit.reason}
                          </p>
                          {permit.attachmentName && (
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-brand-blue font-bold bg-slate-50 px-2 py-0.5 rounded w-fit">
                              <FileText size={11} />
                              <span className="truncate max-w-[180px]">{permit.attachmentName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Link to Request Permit */}
        <div
          onClick={onGoToPermit}
          className="bg-amber-50/40 hover:bg-amber-50 border border-amber-100 rounded-3xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-sm group"
        >
          <div className="flex items-center gap-3.5 text-left">
            <div className="bg-amber-100 text-amber-700 p-2.5 rounded-xl group-hover:scale-105 transition-transform">
              <FileText size={18} />
            </div>
            <div>
              <h5 className="font-display font-extrabold text-xs text-slate-800">Siswa berhalangan hadir?</h5>
              <p className="text-[10px] text-slate-400 font-semibold leading-normal">Kirimkan dokumen surat izin resmi (sakit/keperluan) melalui menu E-Permit.</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-amber-500" />
        </div>
      </div>
    </div>
  );
}
