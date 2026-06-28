import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  UserCheck, 
  Users, 
  HelpCircle 
} from 'lucide-react';
import { Student } from '../types';

interface TeacherAttendanceTabProps {
  students: Student[];
  onUpdateAttendance: (studentId: string, status: Student['attendanceToday'], time?: string) => void;
  className?: string;
}

export function TeacherAttendanceTab({ 
  students, 
  onUpdateAttendance, 
  className = 'TK-A' 
}: TeacherAttendanceTabProps) {
  const classStudents = students.filter(s => s.class === className);
  const [successId, setSuccessId] = useState<string | null>(null);

  // Stats calculation
  const totalStudents = classStudents.length;
  const countHadir = classStudents.filter(s => s.attendanceToday === 'HADIR').length;
  const countIzin = classStudents.filter(s => s.attendanceToday === 'IZIN').length;
  const countSakit = classStudents.filter(s => s.attendanceToday === 'SAKIT').length;
  const countAlfa = classStudents.filter(s => s.attendanceToday === 'ALFA').length;
  const countBelum = classStudents.filter(s => s.attendanceToday === 'BELUM ABSEN').length;

  const handleStatusChange = async (studentId: string, newStatus: Student['attendanceToday']) => {
    const timeNow = newStatus === 'HADIR' 
      ? new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
      : undefined;
    
    onUpdateAttendance(studentId, newStatus, timeNow);
    setSuccessId(studentId);
    setTimeout(() => {
      setSuccessId(null);
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-24 text-left">
      {/* Header Block */}
      <div className="flex items-center justify-between">
        <div className="text-left">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">TK MUTIARA BANGSA</span>
          <h2 className="font-display font-black text-xl text-slate-950">Kelola Kehadiran Kelas</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Rekapitulasi dan update kehadiran siswa hari ini</p>
        </div>
        <div className="bg-emerald-100 text-brand-green p-2.5 rounded-2xl">
          <UserCheck size={24} />
        </div>
      </div>

      {/* Class Attendance Summary Cards */}
      <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-xs text-slate-800 uppercase tracking-wider">Ringkasan Hari Ini</h3>
          <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full font-mono">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5 text-center">
          <div className="bg-emerald-50 border border-emerald-100/50 p-2 rounded-xl">
            <span className="block text-[8px] font-bold text-emerald-700 uppercase">HADIR</span>
            <span className="font-display font-black text-sm text-emerald-600 mt-0.5 block">{countHadir}</span>
          </div>

          <div className="bg-blue-50 border border-blue-100/50 p-2 rounded-xl">
            <span className="block text-[8px] font-bold text-blue-700 uppercase">IZIN</span>
            <span className="font-display font-black text-sm text-blue-600 mt-0.5 block">{countIzin}</span>
          </div>

          <div className="bg-amber-50 border border-amber-100/50 p-2 rounded-xl">
            <span className="block text-[8px] font-bold text-amber-700 uppercase">SAKIT</span>
            <span className="font-display font-black text-sm text-amber-600 mt-0.5 block">{countSakit}</span>
          </div>

          <div className="bg-red-50 border border-red-100/50 p-2 rounded-xl">
            <span className="block text-[8px] font-bold text-red-700 uppercase">ALFA</span>
            <span className="font-display font-black text-sm text-red-600 mt-0.5 block">{countAlfa}</span>
          </div>

          <div className="bg-slate-100 border border-slate-200/50 p-2 rounded-xl">
            <span className="block text-[8px] font-bold text-slate-500 uppercase">BELUM</span>
            <span className="font-display font-black text-sm text-slate-600 mt-0.5 block">{countBelum}</span>
          </div>
        </div>
      </div>

      {/* Interactive Attendance List */}
      <div className="space-y-3">
        <h3 className="font-display font-extrabold text-xs text-slate-800 uppercase tracking-wider">Kehadiran Siswa ({totalStudents})</h3>
        
        <div className="space-y-3">
          {classStudents.map((std) => {
            const isSuccess = successId === std.id;
            return (
              <div key={std.id} className="bg-white border border-slate-100 p-3.5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm relative overflow-hidden">
                {/* Visual success blink */}
                {isSuccess && (
                  <div className="absolute inset-0 bg-emerald-500/10 border-2 border-emerald-500 rounded-2xl pointer-events-none animate-pulse"></div>
                )}

                <div className="flex items-center gap-3 text-left">
                  <img src={std.avatar} alt={std.name} className="w-9 h-9 rounded-full object-cover" />
                  <div>
                    <h4 className="font-display font-extrabold text-xs text-slate-800 uppercase">{std.name}</h4>
                    <p className="text-[9px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                      <Clock size={10} /> 
                      {std.attendanceToday === 'HADIR' && std.attendanceTime 
                        ? `Absen pada: ${std.attendanceTime}` 
                        : `Status: ${std.attendanceToday}`}
                    </p>
                  </div>
                </div>

                {/* Status Toggles */}
                <div className="flex bg-slate-100 p-0.5 rounded-xl font-bold text-[9px] w-full sm:w-auto overflow-x-auto">
                  {([
                    { key: 'HADIR', label: 'HADIR', activeClass: 'bg-emerald-500 text-white shadow-sm' },
                    { key: 'IZIN', label: 'IZIN', activeClass: 'bg-blue-500 text-white shadow-sm' },
                    { key: 'SAKIT', label: 'SAKIT', activeClass: 'bg-amber-500 text-white shadow-sm' },
                    { key: 'ALFA', label: 'ALFA', activeClass: 'bg-red-500 text-white shadow-sm' }
                  ] as const).map(item => (
                    <button
                      key={item.key}
                      onClick={() => handleStatusChange(std.id, item.key)}
                      className={`flex-1 px-2.5 py-1.5 rounded-lg transition-all text-center ${
                        std.attendanceToday === item.key 
                          ? item.activeClass 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
