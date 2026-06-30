import React, { useState, useEffect } from 'react';
import { School, User } from '../types';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, dbAddSchool, dbUpdateSchoolStatus, dbUpdateUserPassword, dbGetSuperAdminUser, dbUpdateSchoolAndYayasan, dbUpdateSchoolPremiumStatus } from '../firebase';
import {
  School as SchoolIcon,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Power,
  Search,
  User as UserIcon,
  Mail,
  Lock,
  Building,
  AlertCircle,
  TrendingUp,
  X,
  FileSpreadsheet,
  Edit,
  Crown,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SuperAdminDashboardProps {
  onLogout: () => void;
  adminName: string;
}

export default function SuperAdminDashboard({ onLogout, adminName }: SuperAdminDashboardProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create School Modal / Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [schoolId, setSchoolId] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [yayasanName, setYayasanName] = useState('');
  const [yayasanEmail, setYayasanEmail] = useState('');
  const [yayasanPassword, setYayasanPassword] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Change Password Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPasswordInput, setOldPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [pwdErrorMsg, setPwdErrorMsg] = useState('');
  const [pwdSuccessMsg, setPwdSuccessMsg] = useState('');
  const [isPwdSubmitting, setIsPwdSubmitting] = useState(false);

  // Edit School & Yayasan states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSchoolId, setEditSchoolId] = useState('');
  const [editSchoolName, setEditSchoolName] = useState('');
  const [editYayasanUserId, setEditYayasanUserId] = useState('');
  const [editYayasanName, setEditYayasanName] = useState('');
  const [editYayasanEmail, setEditYayasanEmail] = useState('');
  const [editYayasanPassword, setEditYayasanPassword] = useState('');
  const [editIsPremium, setEditIsPremium] = useState(false);
  const [editErrorMsg, setEditErrorMsg] = useState('');
  const [editSuccessMsg, setEditSuccessMsg] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Confirm Status (Suspend/Activate) modal states
  const [showConfirmStatusModal, setShowConfirmStatusModal] = useState(false);
  const [selectedSchoolToToggle, setSelectedSchoolToToggle] = useState<School | null>(null);
  const [isToggleSubmitting, setIsToggleSubmitting] = useState(false);

  // Real-time listener for schools and users
  useEffect(() => {
    const unsubSchools = onSnapshot(collection(db, 'schools'), (snapshot) => {
      const list: School[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as School);
      });
      setSchools(list);
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const list: User[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as User);
      });
      setUsers(list);
    });

    return () => {
      unsubSchools();
      unsubUsers();
    };
  }, []);

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId.trim() || !schoolName.trim() || !yayasanName.trim() || !yayasanEmail.trim() || !yayasanPassword.trim()) {
      setErrorMsg('Semua kolom wajib diisi.');
      return;
    }

    const cleanSchoolId = schoolId.trim().toLowerCase().replace(/\s+/g, '-');
    
    // Validate uniqueness of school ID
    if (schools.some(s => s.id === cleanSchoolId)) {
      setErrorMsg('ID Sekolah (Tenant ID) ini sudah digunakan. Silakan buat ID unik.');
      return;
    }

    // Validate uniqueness of Yayasan email
    if (users.some(u => u.email.toLowerCase() === yayasanEmail.trim().toLowerCase())) {
      setErrorMsg('Email / Username Yayasan sudah terdaftar. Silakan gunakan email lain.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const newSchool: School = {
        id: cleanSchoolId,
        name: schoolName.trim(),
        status: 'active',
        createdAt: new Date().toISOString(),
        isPremium: isPremium
      };

      const newYayasan: User = {
        id: `user-yayasan-${Date.now()}`,
        email: yayasanEmail.trim().toLowerCase(),
        password: yayasanPassword.trim(),
        fullName: yayasanName.trim(),
        role: 'yayasan',
        schoolId: cleanSchoolId
      };

      await dbAddSchool(newSchool, newYayasan);
      
      setSuccessMsg(`Sekolah "${schoolName}" dan Akun Yayasan berhasil dibuat!`);
      
      // Reset form
      setSchoolId('');
      setSchoolName('');
      setYayasanName('');
      setYayasanEmail('');
      setYayasanPassword('');
      setIsPremium(false);
      
      setTimeout(() => {
        setShowAddModal(false);
        setSuccessMsg('');
      }, 1500);
    } catch (err: any) {
      setErrorMsg('Gagal membuat sekolah: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenToggleConfirm = (school: School) => {
    setSelectedSchoolToToggle(school);
    setShowConfirmStatusModal(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (!selectedSchoolToToggle) return;
    setIsToggleSubmitting(true);
    const newStatus = selectedSchoolToToggle.status === 'active' ? 'suspended' : 'active';
    try {
      await dbUpdateSchoolStatus(selectedSchoolToToggle.id, newStatus);
      setShowConfirmStatusModal(false);
      setSelectedSchoolToToggle(null);
    } catch (err: any) {
      alert('Gagal mengubah status: ' + err.message);
    } finally {
      setIsToggleSubmitting(false);
    }
  };

  const handleOpenEditModal = (school: School) => {
    setEditSchoolId(school.id);
    setEditSchoolName(school.name);
    setEditIsPremium(!!school.isPremium);
    
    // Find owner
    const schoolOwner = users.find(u => u.schoolId === school.id && u.role === 'yayasan');
    if (schoolOwner) {
      setEditYayasanUserId(schoolOwner.id);
      setEditYayasanName(schoolOwner.fullName);
      setEditYayasanEmail(schoolOwner.email);
      setEditYayasanPassword(schoolOwner.password || '');
    } else {
      setEditYayasanUserId('');
      setEditYayasanName('');
      setEditYayasanEmail('');
      setEditYayasanPassword('');
    }
    setEditErrorMsg('');
    setEditSuccessMsg('');
    setIsEditSubmitting(false);
    setShowEditModal(true);
  };

  const handleUpdateSchoolAndYayasanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditErrorMsg('');
    setEditSuccessMsg('');

    if (!editSchoolName.trim() || !editYayasanName.trim() || !editYayasanEmail.trim()) {
      setEditErrorMsg('Semua kolom wajib diisi.');
      return;
    }

    // Validate uniqueness of Yayasan email (excluding current user)
    const duplicateEmail = users.some(u => 
      u.email.toLowerCase() === editYayasanEmail.trim().toLowerCase() && 
      u.id !== editYayasanUserId
    );
    if (duplicateEmail) {
      setEditErrorMsg('Email / Username Yayasan sudah digunakan oleh akun lain.');
      return;
    }

    setIsEditSubmitting(true);
    try {
      await dbUpdateSchoolAndYayasan(
        editSchoolId,
        editSchoolName.trim(),
        editYayasanUserId || undefined,
        {
          fullName: editYayasanName.trim(),
          email: editYayasanEmail.trim().toLowerCase(),
          password: editYayasanPassword ? editYayasanPassword.trim() : undefined
        }
      );

      await dbUpdateSchoolPremiumStatus(editSchoolId, editIsPremium);

      setEditSuccessMsg('Sekolah dan Akun Yayasan berhasil diperbarui!');
      setTimeout(() => {
        setShowEditModal(false);
        setEditSuccessMsg('');
      }, 1500);
    } catch (err: any) {
      setEditErrorMsg('Gagal memperbarui: ' + err.message);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdErrorMsg('');
    setPwdSuccessMsg('');

    if (!oldPasswordInput || !newPasswordInput || !confirmPasswordInput) {
      setPwdErrorMsg('Semua kolom wajib diisi.');
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setPwdErrorMsg('Konfirmasi sandi baru tidak cocok.');
      return;
    }

    if (newPasswordInput.length < 3) {
      setPwdErrorMsg('Sandi baru minimal harus 3 karakter.');
      return;
    }

    setIsPwdSubmitting(true);
    try {
      const superAdminUser = await dbGetSuperAdminUser();
      if (!superAdminUser) {
        setPwdErrorMsg('Pengguna Super Admin tidak ditemukan di database.');
        setIsPwdSubmitting(false);
        return;
      }

      if (superAdminUser.password !== oldPasswordInput) {
        setPwdErrorMsg('Sandi saat ini salah.');
        setIsPwdSubmitting(false);
        return;
      }

      await dbUpdateUserPassword(superAdminUser.id, newPasswordInput);
      setPwdSuccessMsg('Sandi Super Admin berhasil diperbarui!');
      setOldPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPwdSuccessMsg('');
      }, 2000);
    } catch (err: any) {
      setPwdErrorMsg('Gagal merubah sandi: ' + err.message);
    } finally {
      setIsPwdSubmitting(false);
    }
  };

  const filteredSchools = schools.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = schools.filter(s => s.status === 'active').length;
  const suspendedCount = schools.filter(s => s.status === 'suspended').length;

  return (
    <div className="p-6 space-y-6" id="superadmin-dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 text-white rounded-3xl p-6 shadow-xl gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-emerald-400" size={24} />
            <h1 className="font-display font-black text-xl tracking-tight">Super Admin Global</h1>
          </div>
          <p className="text-xs text-slate-400">Selamat bekerja, {adminName}. Kelola pendaftaran tenant dan status sekolah di bawah ini.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow flex items-center gap-1.5"
            id="superadmin-change-password-btn"
          >
            <Lock size={14} />
            Ubah Kata Sandi
          </button>
          <button
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow"
            id="superadmin-logout-btn"
          >
            Keluar Sesi
          </button>
        </div>
      </div>

      {/* Stats Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Sekolah</span>
            <span className="text-xl font-bold text-slate-800">{schools.length} Tenant</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Power size={20} className="stroke-[2.5px]" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Aktif</span>
            <span className="text-xl font-bold text-emerald-600">{activeCount} Sekolah</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertCircle size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ditangguhkan</span>
            <span className="text-xl font-bold text-red-600">{suspendedCount} Sekolah</span>
          </div>
        </div>
      </div>

      {/* Schools List Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-4">
          <div className="space-y-1">
            <h2 className="font-display font-black text-slate-800 text-base">Daftar Tenant Sekolah</h2>
            <p className="text-xs text-slate-400">Kelola logical database isolation untuk sekolah mitra.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto bg-brand-blue hover:bg-brand-blue-light text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow flex items-center justify-center gap-1.5 transition-all"
            id="superadmin-add-school-btn"
          >
            <Plus size={16} />
            Daftarkan Sekolah Baru
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <span className="absolute left-3.5 top-3 text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Cari nama sekolah atau ID tenant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:border-brand-blue transition-all"
            id="superadmin-search-input"
          />
        </div>

        {/* Table / List */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Nama Sekolah & ID Tenant</th>
                <th className="py-3 px-4">Akun Yayasan</th>
                <th className="py-3 px-4">Tanggal Daftar</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold">
              {filteredSchools.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Building className="mx-auto text-slate-300 mb-2" size={32} />
                    Belum ada sekolah terdaftar. Silakan buat sekolah baru.
                  </td>
                </tr>
              ) : (
                filteredSchools.map((school) => {
                  const schoolOwner = users.find(u => u.schoolId === school.id && u.role === 'yayasan');
                  return (
                    <tr key={school.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            school.isPremium 
                              ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {school.isPremium ? <Crown size={18} className="fill-amber-400" /> : <SchoolIcon size={18} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-800 text-sm">{school.name}</span>
                              {school.isPremium ? (
                                <span className="bg-amber-100 text-amber-800 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-amber-200 shadow-sm">
                                  <Crown size={8} className="fill-amber-500 text-amber-500" />
                                  PREMIUM
                                </span>
                              ) : (
                                <span className="bg-slate-100 text-slate-500 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full border border-slate-200">
                                  FREE (ADS)
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-[10px] text-brand-blue font-bold px-1.5 py-0.5 bg-blue-50 rounded-md inline-block mt-1">
                              ID: {school.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {schoolOwner ? (
                          <div>
                            <span className="text-slate-700 block font-bold">{schoolOwner.fullName}</span>
                            <span className="text-[10px] text-slate-400">{schoolOwner.email}</span>
                          </div>
                        ) : (
                          <span className="text-red-500 text-[11px] italic">Wali/Yayasan tidak ditemukan</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-500 font-mono">
                        {school.createdAt ? new Date(school.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        }) : '-'}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          school.status === 'active' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {school.status === 'active' ? 'Aktif' : 'Ditangguhkan'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(school)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all hover:scale-105 focus:outline-none"
                            title="Edit Tenant & Akun Yayasan"
                            id={`edit-school-${school.id}`}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenToggleConfirm(school)}
                            className={`p-2 rounded-xl transition-all hover:scale-105 focus:outline-none ${
                              school.status === 'active'
                                ? 'bg-red-50 hover:bg-red-100 text-red-600'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                            }`}
                            title={school.status === 'active' ? 'Tangguhkan Sekolah' : 'Aktifkan Sekolah'}
                            id={`toggle-status-${school.id}`}
                          >
                            <Power size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add School Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Building size={20} className="text-emerald-400" />
                  <h3 className="font-display font-black text-sm uppercase tracking-wide">Daftarkan Tenant Sekolah</h3>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setErrorMsg('');
                  }}
                  className="text-slate-400 hover:text-white transition-colors focus:outline-none p-1.5 rounded-full bg-slate-800"
                  id="close-add-modal-btn"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleCreateSchool} className="p-6 space-y-4">
                {errorMsg && (
                  <div className="bg-red-50 border border-red-100 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2 font-semibold">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                
                {successMsg && (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-3 rounded-xl flex items-center gap-2 font-semibold animate-pulse">
                    <ShieldCheck size={16} className="shrink-0 text-emerald-600" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-1">Detail Tenant (Sekolah)</h4>
                  
                  {/* School ID */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Tenant ID (ID Sekolah Unik)</label>
                    <input
                      type="text"
                      placeholder="Contoh: tk-mutiara-bangsa"
                      value={schoolId}
                      onChange={(e) => setSchoolId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-brand-blue"
                      required
                      id="input-school-id"
                    />
                    <span className="text-[9px] text-slate-400 italic block">Akan dikonversi otomatis menjadi lowercase dengan tanda hubung.</span>
                  </div>

                  {/* School Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Lengkap Sekolah</label>
                    <input
                      type="text"
                      placeholder="Contoh: TK Mutiara Bangsa"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-brand-blue"
                      required
                      id="input-school-name"
                    />
                  </div>

                  {/* Premium Tier Toggle */}
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 flex justify-between items-center">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Crown size={14} className="text-amber-500 fill-amber-500" />
                        <span className="text-[11px] font-bold text-amber-900 uppercase">Layanan Premium</span>
                      </div>
                      <p className="text-[10px] text-amber-700 leading-normal">
                        Bebas iklan untuk seluruh wali siswa dan guru di sekolah ini.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPremium}
                        onChange={(e) => setIsPremium(e.target.checked)}
                        className="sr-only peer"
                        id="toggle-is-premium"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pt-3 pb-1">Detail Akun Yayasan (Tenant Admin)</h4>

                  {/* Yayasan Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Pengelola Yayasan</label>
                    <input
                      type="text"
                      placeholder="Contoh: Bapak H. Gunawan"
                      value={yayasanName}
                      onChange={(e) => setYayasanName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-brand-blue"
                      required
                      id="input-yayasan-name"
                    />
                  </div>

                  {/* Yayasan Email */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Email / Username Yayasan</label>
                    <input
                      type="text"
                      placeholder="Contoh: yayasan.mutiara / yayasan@mutiara.sch.id"
                      value={yayasanEmail}
                      onChange={(e) => setYayasanEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-brand-blue"
                      required
                      id="input-yayasan-email"
                    />
                  </div>

                  {/* Yayasan Password */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Sandi Akses Yayasan</label>
                    <input
                      type="password"
                      placeholder="Minimal 3 karakter"
                      value={yayasanPassword}
                      onChange={(e) => setYayasanPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-brand-blue"
                      required
                      minLength={3}
                      id="input-yayasan-password"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setErrorMsg('');
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs py-2.5 rounded-xl transition-all"
                    id="cancel-add-school-btn"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-brand-blue hover:bg-brand-blue-light disabled:bg-slate-300 text-white font-bold text-xs py-2.5 rounded-xl shadow transition-all"
                    id="submit-add-school-btn"
                  >
                    {isSubmitting ? 'Memproses...' : 'Daftarkan & Buat Akun'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Lock size={20} className="text-emerald-400" />
                  <h3 className="font-display font-black text-sm uppercase tracking-wide">Ubah Sandi Super Admin</h3>
                </div>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPwdErrorMsg('');
                    setPwdSuccessMsg('');
                  }}
                  className="text-slate-400 hover:text-white transition-colors focus:outline-none p-1.5 rounded-full bg-slate-800"
                  id="close-password-modal-btn"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                {pwdErrorMsg && (
                  <div className="bg-red-50 border border-red-100 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2 font-semibold">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{pwdErrorMsg}</span>
                  </div>
                )}
                
                {pwdSuccessMsg && (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-3 rounded-xl flex items-center gap-2 font-semibold animate-pulse">
                    <ShieldCheck size={16} className="shrink-0 text-emerald-600" />
                    <span>{pwdSuccessMsg}</span>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Old Password */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Sandi Saat Ini (Sandi Lama)</label>
                    <input
                      type="password"
                      placeholder="Masukkan sandi saat ini"
                      value={oldPasswordInput}
                      onChange={(e) => setOldPasswordInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:border-brand-blue"
                      required
                      id="input-old-password"
                    />
                  </div>

                  {/* New Password */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Sandi Baru</label>
                    <input
                      type="password"
                      placeholder="Minimal 3 karakter"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:border-brand-blue"
                      required
                      minLength={3}
                      id="input-new-password"
                    />
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Konfirmasi Sandi Baru</label>
                    <input
                      type="password"
                      placeholder="Ulangi sandi baru"
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:border-brand-blue"
                      required
                      minLength={3}
                      id="input-confirm-password"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPwdErrorMsg('');
                      setPwdSuccessMsg('');
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs py-2.5 rounded-xl transition-all"
                    id="cancel-password-btn"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPwdSubmitting}
                    className="flex-1 bg-brand-blue hover:bg-brand-blue-light disabled:bg-slate-300 text-white font-bold text-xs py-2.5 rounded-xl shadow transition-all"
                    id="submit-password-btn"
                  >
                    {isPwdSubmitting ? 'Memproses...' : 'Simpan Sandi Baru'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Edit School & Yayasan Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Edit size={20} className="text-emerald-400" />
                  <h3 className="font-display font-black text-sm uppercase tracking-wide">Edit Tenant & Akun Yayasan</h3>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditErrorMsg('');
                  }}
                  className="text-slate-400 hover:text-white transition-colors focus:outline-none p-1.5 rounded-full bg-slate-800"
                  id="close-edit-modal-btn"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleUpdateSchoolAndYayasanSubmit} className="p-6 space-y-4">
                {editErrorMsg && (
                  <div className="bg-red-50 border border-red-100 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2 font-semibold">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{editErrorMsg}</span>
                  </div>
                )}
                
                {editSuccessMsg && (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-3 rounded-xl flex items-center gap-2 font-semibold animate-pulse">
                    <ShieldCheck size={16} className="shrink-0 text-emerald-600" />
                    <span>{editSuccessMsg}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-1">Detail Tenant (Sekolah)</h4>
                  
                  {/* School ID (Read-only since modifying it breaks foreign key relationships in Firestore) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Tenant ID (ID Sekolah - Tidak Dapat Diubah)</label>
                    <input
                      type="text"
                      value={editSchoolId}
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none"
                      id="edit-input-school-id"
                    />
                  </div>

                  {/* School Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Sekolah / Tenant</label>
                    <input
                      type="text"
                      placeholder="Masukkan nama sekolah baru"
                      value={editSchoolName}
                      onChange={(e) => setEditSchoolName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-brand-blue"
                      required
                      id="edit-input-school-name"
                    />
                  </div>

                  {/* Premium Tier Toggle */}
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 flex justify-between items-center">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Crown size={14} className="text-amber-500 fill-amber-500" />
                        <span className="text-[11px] font-bold text-amber-900 uppercase">Layanan Premium</span>
                      </div>
                      <p className="text-[10px] text-amber-700 leading-normal">
                        Bebas iklan untuk seluruh wali siswa dan guru di sekolah ini.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editIsPremium}
                        onChange={(e) => setEditIsPremium(e.target.checked)}
                        className="sr-only peer"
                        id="toggle-edit-is-premium"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pt-2 pb-1">Pemilik Yayasan (Penanggung Jawab)</h4>
                  
                  {/* Yayasan Full Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Lengkap Pemilik Yayasan</label>
                    <input
                      type="text"
                      placeholder="Masukkan nama pemilik yayasan baru"
                      value={editYayasanName}
                      onChange={(e) => setEditYayasanName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-brand-blue"
                      required
                      id="edit-input-yayasan-name"
                    />
                  </div>

                  {/* Yayasan Username/Email */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Username / Email Yayasan</label>
                    <input
                      type="text"
                      placeholder="Contoh: yayasan.sekolah@gmail.com"
                      value={editYayasanEmail}
                      onChange={(e) => setEditYayasanEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-brand-blue"
                      required
                      id="edit-input-yayasan-email"
                    />
                  </div>

                  {/* Yayasan Password */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Kata Sandi Baru (Opsional)</label>
                    <input
                      type="password"
                      placeholder="Biarkan kosong jika tidak ingin merubah sandi"
                      value={editYayasanPassword}
                      onChange={(e) => setEditYayasanPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-brand-blue"
                      id="edit-input-yayasan-password"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditErrorMsg('');
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs py-2.5 rounded-xl transition-all"
                    id="cancel-edit-school-btn"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isEditSubmitting}
                    className="flex-1 bg-brand-blue hover:bg-brand-blue-light disabled:bg-slate-300 text-white font-bold text-xs py-2.5 rounded-xl shadow transition-all"
                    id="submit-edit-school-btn"
                  >
                    {isEditSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Status Toggle (Suspend / Activate) Modal */}
      <AnimatePresence>
        {showConfirmStatusModal && selectedSchoolToToggle && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={20} className="text-amber-400" />
                  <h3 className="font-display font-black text-sm uppercase tracking-wide">
                    Konfirmasi {selectedSchoolToToggle.status === 'active' ? 'Suspend' : 'Aktivasi'}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowConfirmStatusModal(false);
                    setSelectedSchoolToToggle(null);
                  }}
                  className="text-slate-400 hover:text-white transition-colors focus:outline-none p-1.5 rounded-full bg-slate-800"
                  id="close-confirm-status-modal-btn"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 p-4 rounded-2xl text-slate-700 text-xs">
                  <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-1 font-semibold">
                    <p className="text-sm font-bold text-slate-900">
                      Apakah Anda yakin ingin {selectedSchoolToToggle.status === 'active' ? 'MENANGGUHKAN (suspend)' : 'MENGAKTIFKAN kembali'} sekolah "{selectedSchoolToToggle.name}"?
                    </p>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      {selectedSchoolToToggle.status === 'active' 
                        ? 'Setelah ditangguhkan, semua Guru, Yayasan, dan Wali Murid dari sekolah ini tidak akan dapat login atau menggunakan sistem ini sampai diaktifkan kembali.'
                        : 'Setelah diaktifkan kembali, semua akun pengguna di sekolah ini akan dapat masuk dan menggunakan sistem seperti biasa.'}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowConfirmStatusModal(false);
                      setSelectedSchoolToToggle(null);
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs py-2.5 rounded-xl transition-all"
                    id="cancel-toggle-status-btn"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleConfirmToggleStatus}
                    disabled={isToggleSubmitting}
                    className={`flex-1 text-white font-bold text-xs py-2.5 rounded-xl shadow transition-all ${
                      selectedSchoolToToggle.status === 'active'
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-emerald-500 hover:bg-emerald-600'
                    }`}
                    id="submit-toggle-status-btn"
                  >
                    {isToggleSubmitting ? 'Memproses...' : selectedSchoolToToggle.status === 'active' ? 'Ya, Tangguhkan' : 'Ya, Aktifkan'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
