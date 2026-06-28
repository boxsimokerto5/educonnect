import React, { useState, useEffect } from 'react';
import { User, Student, School } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  Lock,
  User as UserIcon,
  GraduationCap,
  Users,
  AlertCircle,
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db, dbAddUser } from '../firebase';

interface AuthScreenProps {
  students: Student[];
  onLoginSuccess: (user: User) => void;
}

// Initial default users for simulation
const DEFAULT_USERS: User[] = [
  {
    id: 'user-superadmin',
    email: 'superadmin',
    password: '123',
    fullName: 'Super Admin Global',
    role: 'superadmin'
  }
];

export default function AuthScreen({ students, onLoginSuccess }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Registration Role Selector
  const [regRole, setRegRole] = useState<'parent' | 'teacher'>('parent');

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || 'rian');
  const [selectedClass, setSelectedClass] = useState('TK-A');

  // Validation / Feedback states
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Users and Schools loaded from Firestore in real-time
  const [usersList, setUsersList] = useState<User[]>(DEFAULT_USERS);
  const [schoolsList, setSchoolsList] = useState<School[]>([]);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const users: User[] = [];
      snapshot.forEach((doc) => {
        users.push(doc.data() as User);
      });
      if (users.length > 0) {
        setUsersList(users);
      }
    });

    const unsubSchools = onSnapshot(collection(db, 'schools'), (snapshot) => {
      const schools: School[] = [];
      snapshot.forEach((doc) => {
        schools.push(doc.data() as School);
      });
      setSchoolsList(schools);
    });

    return () => {
      unsubUsers();
      unsubSchools();
    };
  }, []);

  // Reset error when switching tab
  useEffect(() => {
    setErrorMsg('');
    setSuccessMsg('');
    setEmail('');
    setPassword('');
    setFullName('');
  }, [activeTab, regRole]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Silakan isi email/username dan kata sandi Anda.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      const users = usersList;
      const matchedUser = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (matchedUser) {
        // Enforce Multi-Tenant Isolation and School Active Check
        if (matchedUser.role !== 'superadmin' && matchedUser.schoolId) {
          const school = schoolsList.find((s) => s.id === matchedUser.schoolId);
          if (school && school.status === 'suspended') {
            setErrorMsg('Akses ditolak: Sekolah Anda saat ini ditangguhkan (suspended) oleh Super Admin.');
            setIsLoading(false);
            return;
          }
        }

        setIsLoading(false);
        setSuccessMsg(`Selamat datang kembali, ${matchedUser.fullName}!`);
        setTimeout(() => {
          onLoginSuccess(matchedUser);
        }, 1000);
      } else {
        setIsLoading(false);
        setErrorMsg('Email/Username atau Kata Sandi salah. Gunakan tombol masuk cepat di bawah!');
      }
    }, 800);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      setErrorMsg('Semua kolom pendaftaran wajib diisi.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const users = usersList;
      const isEmailTaken = users.some((u) => u.email.toLowerCase() === email.toLowerCase());

      if (isEmailTaken) {
        setErrorMsg('Email/Username ini sudah terdaftar. Silakan gunakan nama lain.');
        setIsLoading(false);
        return;
      }

      const newUser: User = {
        id: `user-${Date.now()}`,
        email: email.trim(),
        password: password,
        fullName: fullName.trim(),
        role: regRole,
        studentId: regRole === 'parent' ? selectedStudentId : undefined,
        className: regRole === 'teacher' ? selectedClass : undefined
      };

      await dbAddUser(newUser);

      setIsLoading(false);
      setSuccessMsg('Pendaftaran Berhasil! Silakan masuk dengan akun Anda.');
      
      // Auto-fill and switch to login tab
      const registeredEmail = newUser.email;
      const registeredPassword = newUser.password || '';
      
      setTimeout(() => {
        setActiveTab('login');
        setEmail(registeredEmail);
        setPassword(registeredPassword);
        setSuccessMsg('');
      }, 1500);
    } catch (e: any) {
      setErrorMsg('Pendaftaran gagal: ' + e.message);
      setIsLoading(false);
    }
  };

  // Helper function for demo auto-login
  const handleQuickLogin = (role: 'superadmin' | 'parent' | 'teacher' | 'yayasan') => {
    setIsLoading(true);
    setErrorMsg('');
    setTimeout(() => {
      const users = usersList;
      let matchedUser: User | undefined;
      
      if (role === 'superadmin') {
        matchedUser = users.find((u) => u.role === 'superadmin') || DEFAULT_USERS[0];
      } else {
        // Find first user with that role
        matchedUser = users.find((u) => u.role === role);
      }

      setIsLoading(false);
      if (matchedUser) {
        // School suspend check
        if (matchedUser.role !== 'superadmin' && matchedUser.schoolId) {
          const school = schoolsList.find((s) => s.id === matchedUser.schoolId);
          if (school && school.status === 'suspended') {
            setErrorMsg('Akses ditolak: Sekolah Anda saat ini ditangguhkan (suspended) oleh Super Admin.');
            return;
          }
        }

        setSuccessMsg(`Login Simulasi Berhasil sebagai ${matchedUser.fullName}!`);
        setTimeout(() => {
          onLoginSuccess(matchedUser!);
        }, 800);
      } else {
        setErrorMsg(`Belum ada akun dengan role ${role}. Silakan masuk sebagai Super Admin untuk membuatnya terlebih dahulu.`);
      }
    }, 400);
  };

  return (
    <div className="h-full flex flex-col justify-between bg-[#F8FAFC]">
      {/* Branding Header Area */}
      <div className="bg-brand-blue text-white rounded-b-[2.5rem] px-6 pt-10 pb-12 relative overflow-hidden shrink-0">
        <div className="absolute top-[-30px] right-[-30px] w-40 h-40 rounded-full bg-slate-800 opacity-30 blur-xl"></div>
        <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 rounded-full bg-slate-800 opacity-20 blur-lg"></div>

        <div className="flex flex-col items-center text-center relative z-10 space-y-3">
          <div className="bg-white/10 p-3.5 rounded-2xl backdrop-blur-md flex items-center justify-center border border-white/10 shadow-inner">
            <svg className="w-9 h-9 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L1 21h22L12 2zm0 4l6.5 11h-13L12 6zm-1 8h2v2h-2v-2zm0-4h2v3h-2V10z" />
            </svg>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-yellow-400 font-extrabold uppercase tracking-widest block">TK MUTIARA BANGSA</span>
            <h1 className="font-display font-black text-2xl tracking-tight text-white">EduConnect</h1>
            <p className="text-xs text-slate-300 leading-snug">Satu Aplikasi Multi-User untuk Wali Murid & Guru</p>
          </div>
        </div>
      </div>

      {/* Tabs Switcher Inside Portal (Login / Daftar) */}
      <div className="px-6 -mt-6 relative z-20 flex-1 flex flex-col justify-start">
        {/* Registration is closed on student side, only class teacher can add new students */}
        <div className="bg-slate-100 p-3 rounded-2xl border border-slate-200/50 mb-6 flex items-center justify-center gap-2">
          <ShieldCheck size={16} className="text-brand-blue shrink-0" />
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider text-center">
            Pendaftaran Mandiri Ditutup (Gunakan Akun dari Wali Kelas)
          </span>
        </div>

        {/* Feedback Messages */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-2xl text-[11px] font-semibold leading-relaxed flex items-start gap-2 mb-4"
              id="auth-error-alert"
            >
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-emerald-50 border border-emerald-100 text-brand-green-dark p-3 rounded-2xl text-[11px] font-semibold leading-relaxed flex items-center gap-2 mb-4"
              id="auth-success-alert"
            >
              <CheckCircle2 size={16} className="text-brand-green shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Body */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 custom-shadow flex-1 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {activeTab === 'login' ? (
              /* LOGIN FORM */
              <motion.form
                key="login-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Username / Email</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3.5 text-slate-400">
                        <Mail size={16} />
                      </span>
                      <input
                        type="text"
                        placeholder="Contoh: maria / budi"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-blue focus:bg-white transition-all"
                        required
                        id="login-input-email"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kata Sandi</label>
                      <span className="text-[10px] text-brand-blue font-bold hover:underline cursor-pointer">Lupa?</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-3.5 text-slate-400">
                        <Lock size={16} />
                      </span>
                      <input
                        type="password"
                        placeholder="Masukkan sandi (default: 123)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-blue focus:bg-white transition-all"
                        required
                        id="login-input-password"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-brand-blue hover:bg-brand-blue-light disabled:bg-slate-300 text-white font-display font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 shadow"
                  id="login-submit-btn"
                >
                  {isLoading ? 'Memproses Masuk...' : 'Masuk Ke Portal'}
                  {!isLoading && <ArrowRight size={14} />}
                </button>
              </motion.form>
            ) : (
              /* REGISTER FORM */
              <motion.form
                key="register-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleRegister}
                className="space-y-3.5"
              >
                {/* Role Switcher in Register */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Daftar Sebagai</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegRole('parent')}
                      className={`py-2 px-3 text-[11px] font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all focus:outline-none ${
                        regRole === 'parent'
                          ? 'border-brand-blue bg-blue-50 text-brand-blue'
                          : 'border-slate-200 text-slate-500 bg-white'
                      }`}
                      id="reg-role-parent"
                    >
                      <Users size={14} />
                      Wali Murid
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegRole('teacher')}
                      className={`py-2 px-3 text-[11px] font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all focus:outline-none ${
                        regRole === 'teacher'
                          ? 'border-brand-blue bg-blue-50 text-brand-blue'
                          : 'border-slate-200 text-slate-500 bg-white'
                      }`}
                      id="reg-role-teacher"
                    >
                      <GraduationCap size={14} />
                      Guru Kelas
                    </button>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nama Lengkap</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400">
                      <UserIcon size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="Contoh: Ibu Ani / Pak Ahmad"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-blue transition-all"
                      required
                      id="reg-input-name"
                    />
                  </div>
                </div>

                {/* Email / Username */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Username / Email Pendaftaran</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400">
                      <Mail size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="Contoh: ani123 / ahmad@sekolah.id"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-blue transition-all"
                      required
                      id="reg-input-email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kata Sandi</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400">
                      <Lock size={14} />
                    </span>
                    <input
                      type="password"
                      placeholder="Minimal 3 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-blue transition-all"
                      required
                      minLength={3}
                      id="reg-input-password"
                    />
                  </div>
                </div>

                {/* Conditional fields based on role */}
                {regRole === 'parent' ? (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sambungkan ke Siswa (Anak)</label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-blue"
                      id="reg-select-student"
                    >
                      {students.map((std) => (
                        <option key={std.id} value={std.id}>
                          {std.name} ({std.class})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Wali Kelas Untuk</label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-blue"
                      id="reg-select-class"
                    >
                      <option value="TK-A">TK-A</option>
                      <option value="TK-B">TK-B</option>
                      <option value="KELAS 1 SD">KELAS 1 SD</option>
                      <option value="KELAS 2 SD">KELAS 2 SD</option>
                      <option value="KELAS 3 SD">KELAS 3 SD</option>
                      <option value="KELAS 4 SD">KELAS 4 SD</option>
                      <option value="KELAS 5 SD">KELAS 5 SD</option>
                      <option value="KELAS 6 SD">KELAS 6 SD</option>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-brand-blue hover:bg-brand-blue-light disabled:bg-slate-300 text-white font-display font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow mt-2"
                  id="reg-submit-btn"
                >
                  {isLoading ? 'Mendaftarkan Akun...' : 'Daftar Akun Baru'}
                  {!isLoading && <ArrowRight size={14} />}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
