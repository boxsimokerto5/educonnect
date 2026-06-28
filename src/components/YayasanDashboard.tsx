import React, { useState, useEffect } from 'react';
import { School, User, Student } from '../types';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, dbAddTeacher, dbDeleteTeacher, dbUpdateSchoolLogo } from '../firebase';
import {
  Users,
  GraduationCap,
  Plus,
  Trash2,
  Building,
  UserCheck,
  Search,
  User as UserIcon,
  Mail,
  Lock,
  Calendar,
  X,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  Upload,
  Image as ImageIcon,
  Edit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface YayasanDashboardProps {
  currentUser: User;
  onLogout: () => void;
}

export default function YayasanDashboard({ currentUser, onLogout }: YayasanDashboardProps) {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [school, setSchool] = useState<School | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [assignedClasses, setAssignedClasses] = useState<string[]>(['TK-A']);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit teacher modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);
  const [editTeacherName, setEditTeacherName] = useState('');
  const [editTeacherEmail, setEditTeacherEmail] = useState('');
  const [editTeacherPassword, setEditTeacherPassword] = useState('');
  const [editAssignedClasses, setEditAssignedClasses] = useState<string[]>([]);
  const [editErrorMsg, setEditErrorMsg] = useState('');
  const [editSuccessMsg, setEditSuccessMsg] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Logo Upload States
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [logoSuccess, setLogoSuccess] = useState('');

  // Fetch school details, teachers, and students associated with this schoolId
  useEffect(() => {
    if (!currentUser.schoolId) return;

    // Listen to current school info
    const unsubSchool = onSnapshot(collection(db, 'schools'), (snapshot) => {
      snapshot.forEach((doc) => {
        if (doc.id === currentUser.schoolId) {
          setSchool(doc.data() as School);
        }
      });
    });

    // Listen to teachers of this school
    const qTeachers = query(
      collection(db, 'users'), 
      where('schoolId', '==', currentUser.schoolId), 
      where('role', '==', 'teacher')
    );
    const unsubTeachers = onSnapshot(qTeachers, (snapshot) => {
      const list: User[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as User);
      });
      setTeachers(list);
    });

    // Listen to students of this school
    const qStudents = query(
      collection(db, 'students'),
      where('schoolId', '==', currentUser.schoolId)
    );
    const unsubStudents = onSnapshot(qStudents, (snapshot) => {
      const list: Student[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Student);
      });
      setStudents(list);
    });

    return () => {
      unsubSchool();
      unsubTeachers();
      unsubStudents();
    };
  }, [currentUser.schoolId]);

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim() || !teacherEmail.trim() || !teacherPassword.trim()) {
      setErrorMsg('Semua kolom wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const newTeacher: User = {
        id: `user-teacher-${Date.now()}`,
        email: teacherEmail.trim().toLowerCase(),
        password: teacherPassword.trim(),
        fullName: teacherName.trim(),
        role: 'teacher',
        schoolId: currentUser.schoolId,
        className: assignedClasses.join(', ')
      };

      await dbAddTeacher(newTeacher);
      
      setSuccessMsg(`Akun Guru "${teacherName}" berhasil ditambahkan!`);
      
      // Reset form
      setTeacherName('');
      setTeacherEmail('');
      setTeacherPassword('');
      setAssignedClasses(['TK-A']);
      
      setTimeout(() => {
        setShowAddModal(false);
        setSuccessMsg('');
      }, 1500);
    } catch (err: any) {
      setErrorMsg('Gagal menambahkan guru: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (teacher: User) => {
    setEditingTeacher(teacher);
    setEditTeacherName(teacher.fullName);
    setEditTeacherEmail(teacher.email);
    setEditTeacherPassword(teacher.password);
    const classes = teacher.className ? teacher.className.split(',').map(c => c.trim()) : [];
    setEditAssignedClasses(classes.length > 0 ? classes : ['TK-A']);
    setEditErrorMsg('');
    setEditSuccessMsg('');
    setShowEditModal(true);
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    if (!editTeacherName.trim() || !editTeacherEmail.trim() || !editTeacherPassword.trim()) {
      setEditErrorMsg('Semua kolom wajib diisi.');
      return;
    }
    if (editAssignedClasses.length === 0) {
      setEditErrorMsg('Guru harus diampu minimal 1 kelas.');
      return;
    }

    setIsEditSubmitting(true);
    setEditErrorMsg('');
    setEditSuccessMsg('');

    try {
      const updatedTeacher: User = {
        ...editingTeacher,
        email: editTeacherEmail.trim().toLowerCase(),
        password: editTeacherPassword.trim(),
        fullName: editTeacherName.trim(),
        className: editAssignedClasses.join(', ')
      };

      await dbAddTeacher(updatedTeacher);
      
      setEditSuccessMsg(`Akun Guru "${editTeacherName}" berhasil diperbarui!`);
      
      setTimeout(() => {
        setShowEditModal(false);
        setEditSuccessMsg('');
        setEditingTeacher(null);
      }, 1500);
    } catch (err: any) {
      setEditErrorMsg('Gagal memperbarui guru: ' + err.message);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDelete = async (teacher: User) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus akun guru "${teacher.fullName}"?`)) {
      try {
        await dbDeleteTeacher(teacher.id);
      } catch (err: any) {
        alert('Gagal menghapus: ' + err.message);
      }
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLogoError('Berkas harus berupa gambar (PNG/JPEG/GIF).');
      return;
    }

    // Limit to 500 KB to keep firestore doc sizes low and performance snappy
    if (file.size > 512000) {
      setLogoError('Ukuran berkas terlalu besar. Batas maksimum adalah 500 KB.');
      return;
    }

    setIsUploadingLogo(true);
    setLogoError('');
    setLogoSuccess('');

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        if (!currentUser.schoolId) {
          throw new Error('ID Sekolah tidak ditemukan.');
        }
        await dbUpdateSchoolLogo(currentUser.schoolId, base64String);
        setLogoSuccess('Logo sekolah berhasil diperbarui!');
        setTimeout(() => setLogoSuccess(''), 3000);
      } catch (err: any) {
        setLogoError('Gagal mengunggah logo: ' + err.message);
      } finally {
        setIsUploadingLogo(false);
      }
    };
    reader.onerror = () => {
      setLogoError('Gagal membaca gambar.');
      setIsUploadingLogo(false);
    };
    reader.readAsDataURL(file);
  };

  const filteredTeachers = teachers.filter(t => 
    t.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.className && t.className.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6" id="yayasan-dashboard">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-3xl p-6 shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {school?.logoUrl ? (
            <div className="w-16 h-16 rounded-2xl bg-white p-1.5 shadow-md shrink-0 flex items-center justify-center overflow-hidden border border-white/20">
              <img src={school.logoUrl} alt="Logo Sekolah" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-white/10 shrink-0 flex items-center justify-center text-blue-200 border border-white/10">
              <Building size={28} />
            </div>
          )}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest block font-mono">
              Tenant Admin Portal • {school?.name || 'Sekolah Mitra'}
            </span>
            <h1 className="font-display font-black text-xl tracking-tight flex items-center gap-2">
              Dashboard Yayasan
            </h1>
            <p className="text-xs text-blue-100 font-medium">Selamat datang kembali, {currentUser.fullName}. Kelola operasional internal sekolah Anda.</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="bg-white/10 hover:bg-white/20 px-4 py-2 text-xs font-bold rounded-xl transition-all border border-white/10 shrink-0 self-end sm:self-auto"
          id="yayasan-logout-btn"
        >
          Keluar Sesi
        </button>
      </div>

      {/* Statistics Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <GraduationCap size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Guru / Wali Kelas</span>
            <span className="text-xl font-bold text-slate-800">{teachers.length} Akun</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Siswa</span>
            <span className="text-xl font-bold text-slate-800">{students.length} Anak</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck size={20} className="stroke-[2.5px]" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status Sekolah</span>
            <span className="text-sm font-bold text-emerald-600 flex items-center gap-1 mt-0.5 uppercase tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              {school?.status === 'active' ? 'Aktif / Operasional' : 'Suspend'}
            </span>
          </div>
        </div>
      </div>

      {/* School Logo Config Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="border-b border-slate-50 pb-4">
          <h2 className="font-display font-black text-slate-800 text-base flex items-center gap-2">
            <ImageIcon size={18} className="text-brand-blue" />
            Pengaturan Logo Sekolah
          </h2>
          <p className="text-xs text-slate-400 mt-1">Unggah logo resmi sekolah Anda. Logo ini akan secara otomatis tampil secara proporsional di dashboard Yayasan, Guru Kelas, dan Wali Murid.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-stretch">
          {/* Logo Preview */}
          <div className="w-full lg:w-1/3 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100 min-h-[160px] text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-4">Pratinjau Logo Aktif</span>
            {school?.logoUrl ? (
              <div className="w-32 h-32 rounded-2xl bg-white p-3 shadow-md flex items-center justify-center overflow-hidden border border-slate-100">
                <img src={school.logoUrl} alt="Pratinjau Logo Sekolah" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-2xl bg-white flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200">
                <Building size={36} className="text-slate-300" />
                <span className="text-[10px] font-semibold text-slate-400 mt-2">Belum Ada Logo</span>
              </div>
            )}
            {school?.logoUrl && (
              <p className="text-[10px] font-semibold text-slate-400 mt-3 font-mono">{school.name}</p>
            )}
          </div>

          {/* Upload Form */}
          <div className="flex-1 w-full flex flex-col justify-center space-y-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Unggah Gambar Logo Baru</label>
            
            <div className="relative group border-2 border-dashed border-slate-200 hover:border-brand-blue rounded-2xl p-6 transition-all bg-slate-50/50 hover:bg-slate-50/20 text-center flex flex-col items-center justify-center cursor-pointer">
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/gif"
                onChange={handleLogoChange}
                disabled={isUploadingLogo}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                id="school-logo-file-input"
              />
              <Upload size={28} className="text-slate-400 group-hover:text-brand-blue group-hover:scale-110 transition-all mb-2" />
              <p className="text-xs font-bold text-slate-700 group-hover:text-brand-blue transition-colors">
                {isUploadingLogo ? 'Sedang Memproses Gambar...' : 'Klik atau seret gambar ke sini untuk mengunggah'}
              </p>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium leading-relaxed">
                Mendukung berkas PNG, JPG, atau GIF. Ukuran maksimum: <span className="font-bold text-slate-500">500 KB</span>.
              </p>
            </div>

            {logoError && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2 font-semibold">
                <AlertCircle size={16} className="shrink-0" />
                <span>{logoError}</span>
              </div>
            )}

            {logoSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-3 rounded-xl flex items-center gap-2 font-semibold animate-pulse">
                <CheckCircle size={16} className="shrink-0 text-emerald-600" />
                <span>{logoSuccess}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Teachers management section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-4">
          <div className="space-y-1">
            <h2 className="font-display font-black text-slate-800 text-base">Kelola Guru Kelas</h2>
            <p className="text-xs text-slate-400">Buat dan atur penugasan wali kelas untuk operasional sekolah.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto bg-brand-blue hover:bg-brand-blue-light text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow flex items-center justify-center gap-1.5 transition-all"
            id="yayasan-add-teacher-btn"
          >
            <Plus size={16} />
            Tambah Guru Baru
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <span className="absolute left-3.5 top-3 text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Cari guru berdasarkan nama, email, atau kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:border-brand-blue transition-all"
            id="yayasan-search-input"
          />
        </div>

        {/* Teachers List */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Nama Guru</th>
                <th className="py-3 px-4">Email / Username</th>
                <th className="py-3 px-4 text-center">Kelas Pengampu</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <GraduationCap className="mx-auto text-slate-300 mb-2" size={32} />
                    Belum ada guru kelas terdaftar. Silakan daftarkan guru baru.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold uppercase text-xs">
                          {teacher.fullName.slice(0, 2)}
                        </div>
                        <span className="font-bold text-slate-800 text-sm">{teacher.fullName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {teacher.email}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-100">
                        {teacher.className || 'Tidak Ada'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditClick(teacher)}
                          className="p-2 rounded-xl transition-all hover:scale-105 focus:outline-none bg-blue-50 hover:bg-blue-100 text-blue-600"
                          title="Edit Akun Guru"
                          id={`edit-teacher-${teacher.id}`}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(teacher)}
                          className="p-2 rounded-xl transition-all hover:scale-105 focus:outline-none bg-red-50 hover:bg-red-100 text-red-600"
                          title="Hapus Akun Guru"
                          id={`delete-teacher-${teacher.id}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Teacher Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <GraduationCap size={20} className="text-amber-400" />
                  <h3 className="font-display font-black text-sm uppercase tracking-wide">Daftarkan Guru Baru</h3>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setErrorMsg('');
                  }}
                  className="text-white/60 hover:text-white transition-colors focus:outline-none p-1.5 rounded-full bg-white/10"
                  id="close-add-modal-btn"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateTeacher} className="p-6 space-y-4">
                {errorMsg && (
                  <div className="bg-red-50 border border-red-100 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2 font-semibold">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                
                {successMsg && (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-3 rounded-xl flex items-center gap-2 font-semibold animate-pulse">
                    <CheckCircle size={16} className="shrink-0 text-emerald-600" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Lengkap Guru</label>
                    <input
                      type="text"
                      placeholder="Contoh: Pak Budi Santoso / Bu Retno"
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                      required
                      id="input-teacher-name"
                    />
                  </div>

                  {/* Email / Username */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Email / Username Login</label>
                    <input
                      type="text"
                      placeholder="Contoh: budi / budi@sekolah.sch.id"
                      value={teacherEmail}
                      onChange={(e) => setTeacherEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                      required
                      id="input-teacher-email"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Kata Sandi</label>
                    <input
                      type="password"
                      placeholder="Minimal 3 karakter"
                      value={teacherPassword}
                      onChange={(e) => setTeacherPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                      required
                      minLength={3}
                      id="input-teacher-password"
                    />
                  </div>

                  {/* Class Assigned */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Kelas Diampu (Bisa pilih lebih dari 1 kelas)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['TK-A', 'TK-B', 'KELAS 1 SD', 'KELAS 2 SD', 'KELAS 3 SD', 'KELAS 4 SD', 'KELAS 5 SD', 'KELAS 6 SD'].map((cls) => {
                        const isChecked = assignedClasses.includes(cls);
                        return (
                          <label
                            key={cls}
                            className={`flex items-center gap-2 px-3 py-2 border rounded-xl cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
                                : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setAssignedClasses(assignedClasses.filter((c) => c !== cls));
                                } else {
                                  setAssignedClasses([...assignedClasses, cls]);
                                }
                              }}
                              className="accent-indigo-600 w-3.5 h-3.5"
                            />
                            <span className="text-xs">{cls}</span>
                          </label>
                        );
                      })}
                    </div>
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
                    id="cancel-add-teacher-btn"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-blue-700 to-indigo-800 hover:opacity-90 disabled:bg-slate-300 text-white font-bold text-xs py-2.5 rounded-xl shadow transition-all"
                    id="submit-add-teacher-btn"
                  >
                    {isSubmitting ? 'Mendaftarkan...' : 'Daftarkan Guru'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
