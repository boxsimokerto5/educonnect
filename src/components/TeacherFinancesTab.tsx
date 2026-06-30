import React, { useState, useEffect } from 'react';
import { Student, Bill, SavingsTransaction } from '../types';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, dbAddSavingsTransaction, dbDeleteSavingsTransaction } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  FileText, 
  Check, 
  X, 
  Plus, 
  Search, 
  User, 
  Calendar, 
  AlertCircle, 
  TrendingUp, 
  Clock, 
  ArrowLeft,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  CreditCard
} from 'lucide-react';

interface TeacherFinancesTabProps {
  students: Student[];
  onAddClassBill: (billTemplate: Omit<Bill, 'id'>) => Promise<void>;
  onAddStudentBill: (studentId: string, billTemplate: Omit<Bill, 'id'>) => Promise<void>;
  onVerifyPayment: (studentId: string, billId: string, approve: boolean) => Promise<void>;
  className?: string;
  teacherName?: string;
  initialTab?: 'approval' | 'create' | 'status' | 'savings';
}

export function TeacherFinancesTab({
  students,
  onAddClassBill,
  onAddStudentBill,
  onVerifyPayment,
  className = 'TK-A',
  teacherName = 'Pak Budi',
  initialTab
}: TeacherFinancesTabProps) {
  // Filter students by class
  const classStudents = students.filter(s => s.class === className);
  
  // Tabs: 'approval' | 'create' | 'status' | 'savings'
  const [activeTab, setActiveTab] = useState<'approval' | 'create' | 'status' | 'savings'>('approval');

  // Sync activeTab with initialTab when it changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  
  // Search state for status tab
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  // Savings states
  const [savings, setSavings] = useState<SavingsTransaction[]>([]);
  const [savingsStudentId, setSavingsStudentId] = useState('');
  const [savingsType, setSavingsType] = useState<'setor' | 'tarik'>('setor');
  const [savingsAmount, setSavingsAmount] = useState('');
  const [savingsDescription, setSavingsDescription] = useState('');
  const [savingsSubmitting, setSavingsSubmitting] = useState(false);
  const [savingsSuccess, setSavingsSuccess] = useState(false);
  const [savingsError, setSavingsError] = useState('');
  const [expandedSavingsStudentId, setExpandedSavingsStudentId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  // Subscribe to real-time savings
  useEffect(() => {
    const q = query(
      collection(db, 'savings'),
      where('className', '==', className)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const txs: SavingsTransaction[] = [];
      snapshot.forEach((doc) => {
        txs.push({ id: doc.id, ...doc.data() } as SavingsTransaction);
      });
      txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setSavings(txs);
    }, (err) => {
      console.error("Error loading savings:", err);
    });
    return () => unsub();
  }, [className]);

  // Handle adding a savings transaction
  const handleAddSavings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!savingsStudentId) {
      setSavingsError('Pilih siswa terlebih dahulu.');
      return;
    }
    const amt = parseFloat(savingsAmount);
    if (isNaN(amt) || amt <= 0) {
      setSavingsError('Nominal harus lebih besar dari 0.');
      return;
    }

    const targetStudent = classStudents.find(s => s.id === savingsStudentId);
    if (!targetStudent) {
      setSavingsError('Siswa tidak valid.');
      return;
    }

    // Verify balance for withdrawals
    const studentTxs = savings.filter(tx => tx.studentId === savingsStudentId);
    const currentBal = studentTxs.reduce((sum, tx) => {
      if (tx.type === 'setor') return sum + tx.amount;
      if (tx.type === 'tarik') return sum - tx.amount;
      return sum;
    }, 0);

    if (savingsType === 'tarik' && amt > currentBal) {
      setSavingsError(`Saldo tidak mencukupi. Saldo saat ini: Rp ${currentBal.toLocaleString('id-ID')}`);
      return;
    }

    setSavingsSubmitting(true);
    setSavingsError('');
    try {
      const tx: SavingsTransaction = {
        id: `save-${Date.now()}`,
        studentId: savingsStudentId,
        studentName: targetStudent.name,
        className: className,
        date: new Date().toISOString(),
        type: savingsType,
        amount: amt,
        description: savingsDescription.trim() || (savingsType === 'setor' ? 'Setoran Tabungan' : 'Penarikan Tabungan'),
        teacherName: teacherName,
        schoolId: targetStudent.schoolId || ''
      };

      await dbAddSavingsTransaction(tx);
      setSavingsSuccess(true);
      setSavingsAmount('');
      setSavingsDescription('');
      setTimeout(() => {
        setSavingsSuccess(false);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setSavingsError('Gagal menyimpan transaksi.');
    } finally {
      setSavingsSubmitting(false);
    }
  };

  const handleDeleteSavings = async (txId: string) => {
    try {
      await dbDeleteSavingsTransaction(txId);
      setConfirmingDeleteId(null);
    } catch (err) {
      console.error("Gagal menghapus transaksi:", err);
    }
  };

  // Bill creation form state
  const [billType, setBillType] = useState<'SPP' | 'Iuran Kegiatan' | 'Buku & Seragam' | 'Lainnya'>('SPP');
  const [billTitle, setBillTitle] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billDueDate, setBillDueDate] = useState('');
  const [billTarget, setBillTarget] = useState<'all' | string>('all'); // 'all' or studentId
  
  // Form submission feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Collect all pending payments across all class students
  const pendingPayments: { student: Student; bill: Bill }[] = [];
  classStudents.forEach(student => {
    if (student.sppBills) {
      student.sppBills.forEach(bill => {
        if (bill.status === 'Pending') {
          pendingPayments.push({ student, bill });
        }
      });
    }
  });

  // Financial statistics
  let totalCollected = 0;
  let totalPending = 0;
  let totalUnpaid = 0;

  classStudents.forEach(student => {
    if (student.sppBills) {
      student.sppBills.forEach(bill => {
        if (bill.status === 'Paid') {
          totalCollected += bill.amount;
        } else if (bill.status === 'Pending') {
          totalPending += bill.amount;
        } else if (bill.status === 'Unpaid') {
          totalUnpaid += bill.amount;
        }
      });
    }
  });

  // Handle billing submission
  const handleSubmitBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billTitle.trim()) {
      setSubmitError('Judul tagihan tidak boleh kosong.');
      return;
    }
    const amountNum = parseFloat(billAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setSubmitError('Nominal pembayaran harus lebih besar dari 0.');
      return;
    }
    if (!billDueDate) {
      setSubmitError('Pilih tanggal jatuh tempo.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    try {
      const template = {
        title: `[${billType}] ${billTitle}`,
        amount: amountNum,
        dueDate: billDueDate,
        status: 'Unpaid' as const
      };

      if (billTarget === 'all') {
        await onAddClassBill(template);
      } else {
        await onAddStudentBill(billTarget, template);
      }

      setSubmitSuccess(true);
      // Reset form
      setBillTitle('');
      setBillAmount('');
      setBillDueDate('');
      setBillTarget('all');
      
      setTimeout(() => {
        setSubmitSuccess(false);
        setActiveTab('status');
      }, 1800);
    } catch (err: any) {
      setSubmitError('Gagal membuat tagihan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (studentId: string, billId: string, approve: boolean) => {
    try {
      await onVerifyPayment(studentId, billId, approve);
    } catch (err) {
      console.error('Failed to verify payment:', err);
    }
  };

  const filteredStudents = classStudents.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-md mx-auto space-y-4 pb-20">
      {/* Header */}
      <div className="bg-brand-blue text-white p-5 pb-8 relative rounded-b-[2rem] overflow-hidden">
        <div className="absolute top-[-40px] right-[-40px] w-36 h-36 rounded-full bg-slate-800 opacity-30 blur-xl"></div>
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-2xl">
            <Wallet size={20} className="text-brand-accent" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-base">SPP & Keuangan {className}</h2>
            <p className="text-[10px] text-slate-300">Buat penagihan & persetujuan pembayaran iuran</p>
          </div>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="px-4 -mt-6 relative z-10 grid grid-cols-3 gap-2">
        <div className="bg-white rounded-2xl p-2.5 border border-slate-100 shadow-sm text-center">
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Lunas</span>
          <span className="font-display font-black text-slate-800 text-xs block mt-1 text-emerald-600">
            Rp {totalCollected.toLocaleString('id-ID')}
          </span>
        </div>
        <div className="bg-white rounded-2xl p-2.5 border border-slate-100 shadow-sm text-center">
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Pending</span>
          <span className="font-display font-black text-slate-800 text-xs block mt-1 text-amber-500">
            Rp {totalPending.toLocaleString('id-ID')}
          </span>
        </div>
        <div className="bg-white rounded-2xl p-2.5 border border-slate-100 shadow-sm text-center">
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Tagihan</span>
          <span className="font-display font-black text-slate-800 text-xs block mt-1 text-rose-500">
            Rp {totalUnpaid.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Custom Tabs Navigation */}
      <div className="px-4">
        <div className="bg-slate-100/80 p-1 rounded-2xl flex border border-slate-200/40 gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('approval')}
            className={`flex-1 text-center py-2 px-1 text-[10px] font-bold rounded-xl transition-all relative whitespace-nowrap ${
              activeTab === 'approval' 
                ? 'bg-white text-brand-blue shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Persetujuan
            {pendingPayments.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-accent text-white font-black text-[8px] h-4 w-4 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                {pendingPayments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 text-center py-2 px-1 text-[10px] font-bold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'create' 
                ? 'bg-white text-brand-blue shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Buat Tagihan
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 text-center py-2 px-1 text-[10px] font-bold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'status' 
                ? 'bg-white text-brand-blue shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Daftar Siswa
          </button>
          <button
            onClick={() => setActiveTab('savings')}
            className={`flex-1 text-center py-2 px-1 text-[10px] font-bold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'savings' 
                ? 'bg-white text-brand-blue shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Tabungan
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="px-4">
        <AnimatePresence mode="wait">
          {/* 1. APPROVAL TAB */}
          {activeTab === 'approval' && (
            <motion.div
              key="approval-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {pendingPayments.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 custom-shadow space-y-3">
                  <div className="bg-emerald-50 text-emerald-500 p-3 rounded-full w-fit mx-auto">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="font-display font-extrabold text-slate-800 text-sm">Semua Pembayaran Lunas</h3>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Belum ada pengajuan pembayaran baru dari wali murid yang membutuhkan verifikasi.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                    Menunggu Verifikasi ({pendingPayments.length})
                  </span>
                  
                  {pendingPayments.map(({ student, bill }) => (
                    <motion.div
                      key={`${student.id}-${bill.id}`}
                      layout
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white border border-slate-100 rounded-3xl p-4 custom-shadow space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                          <img 
                            src={student.avatar} 
                            alt={student.name} 
                            className="w-10 h-10 rounded-full object-cover border-2 border-slate-50"
                          />
                          <div>
                            <h4 className="font-display font-bold text-xs text-slate-800 uppercase leading-none mt-1">
                              {student.name}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-semibold mt-1">Wali: {student.parentName}</p>
                          </div>
                        </div>
                        <span className="text-[9px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-bold border border-amber-100/50">
                          Pending
                        </span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-2xl space-y-1.5 border border-slate-100">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-400">Jenis Tagihan</span>
                          <span className="text-[11px] text-slate-700 font-bold max-w-[180px] truncate">{bill.title}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-400">Nominal Transfer</span>
                          <span className="text-xs text-slate-800 font-black">Rp {bill.amount.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-400">Metode & Waktu</span>
                          <span className="text-[10px] text-slate-600 font-bold flex items-center gap-1">
                            <CreditCard size={10} className="text-slate-400" />
                            {bill.paymentMethod || 'M-Banking'} ({bill.paidAt})
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() => handleVerify(student.id, bill.id, false)}
                          className="border border-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 text-slate-500 font-bold py-2 rounded-xl text-[10px] transition-all flex items-center justify-center gap-1"
                        >
                          <X size={12} /> Tolak Bukti
                        </button>
                        <button
                          onClick={() => handleVerify(student.id, bill.id, true)}
                          className="bg-brand-blue hover:bg-brand-blue-light text-white font-bold py-2 rounded-xl text-[10px] transition-all flex items-center justify-center gap-1 shadow"
                        >
                          <Check size={12} /> Setujui Pembayaran
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* 2. CREATE BILL TAB */}
          {activeTab === 'create' && (
            <motion.div
              key="create-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-3xl border border-slate-100 p-5 custom-shadow space-y-4"
            >
              <div>
                <h3 className="font-display font-extrabold text-sm text-slate-900">Buat Tagihan Baru</h3>
                <p className="text-[10px] text-slate-400">Terbitkan tagihan SPP, iuran kegiatan, atau kebutuhan lainnya</p>
              </div>

              {submitSuccess ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 animate-bounce">
                    <CheckCircle size={24} />
                  </div>
                  <h4 className="font-display font-bold text-xs text-slate-800">Tagihan Berhasil Diterbitkan!</h4>
                  <p className="text-[10px] text-slate-400">Notifikasi tagihan telah dikirimkan ke wali murid yang bersangkutan.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitBill} className="space-y-4">
                  {submitError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 font-semibold text-[10px] flex items-center gap-2">
                      <AlertCircle size={14} />
                      {submitError}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kategori Tagihan</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['SPP', 'Iuran Kegiatan', 'Buku & Seragam', 'Lainnya'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setBillType(type as any)}
                          className={`py-2 px-3 text-[10px] font-bold rounded-xl border text-center transition-all ${
                            billType === type
                              ? 'bg-brand-blue/5 border-brand-blue text-brand-blue'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nama / Judul Tagihan</label>
                    <input
                      type="text"
                      value={billTitle}
                      onChange={(e) => setBillTitle(e.target.value)}
                      placeholder="Contoh: SPP Bulan Juli 2026, Uang Pentas Seni"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-blue"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nominal Tagihan (Rp)</label>
                    <input
                      type="number"
                      value={billAmount}
                      onChange={(e) => setBillAmount(e.target.value)}
                      placeholder="Contoh: 250000"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-blue"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Jatuh Tempo</label>
                      <input
                        type="date"
                        value={billDueDate}
                        onChange={(e) => setBillDueDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-blue"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Penerima Tagihan</label>
                      <select
                        value={billTarget}
                        onChange={(e) => setBillTarget(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-brand-blue"
                      >
                        <option value="all">Semua Siswa ({classStudents.length})</option>
                        {classStudents.map(student => (
                          <option key={student.id} value={student.id}>{student.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 bg-brand-accent hover:bg-brand-accent-hover text-white py-3 rounded-2xl text-xs font-bold transition-all shadow flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <span>Memproses...</span>
                    ) : (
                      <>
                        <Plus size={14} /> Terbitkan Tagihan Baru
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          )}

          {/* 3. STUDENT BILLING STATUS TAB */}
          {activeTab === 'status' && (
            <motion.div
              key="status-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {/* Search Bar */}
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama siswa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-100 rounded-2xl py-3 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:border-brand-blue shadow-sm"
                />
              </div>

              {/* Students list */}
              <div className="space-y-2">
                {filteredStudents.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-6">Tidak ditemukan siswa dengan nama tersebut.</p>
                ) : (
                  filteredStudents.map((student) => {
                    // Statistics per student
                    const bills = student.sppBills || [];
                    const unpaidBills = bills.filter(b => b.status === 'Unpaid');
                    const pendingBills = bills.filter(b => b.status === 'Pending');
                    const paidBills = bills.filter(b => b.status === 'Paid');

                    const totalUnpaidAmount = unpaidBills.reduce((sum, b) => sum + b.amount, 0);
                    const isExpanded = expandedStudentId === student.id;

                    return (
                      <div 
                        key={student.id}
                        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                      >
                        {/* Summary Row */}
                        <div 
                          onClick={() => setExpandedStudentId(isExpanded ? null : student.id)}
                          className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <img 
                              src={student.avatar} 
                              alt={student.name} 
                              className="w-9 h-9 rounded-full object-cover border border-slate-100"
                            />
                            <div>
                              <h4 className="font-display font-bold text-xs text-slate-800 uppercase leading-tight">
                                {student.name}
                              </h4>
                              <p className="text-[9px] text-slate-400 mt-0.5">
                                Wali: {student.parentName}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              {totalUnpaidAmount > 0 ? (
                                <span className="text-[10px] font-black text-rose-600">
                                  Tunggakan: Rp {totalUnpaidAmount.toLocaleString('id-ID')}
                                </span>
                              ) : pendingBills.length > 0 ? (
                                <span className="text-[10px] font-black text-amber-500">
                                  Menunggu Verifikasi
                                </span>
                              ) : (
                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                  Lunas
                                </span>
                              )}
                              <p className="text-[8px] text-slate-400 mt-0.5 font-medium">
                                {paidBills.length} dari {bills.length} Lunas
                              </p>
                            </div>
                            {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                          </div>
                        </div>

                        {/* Expanded details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              className="bg-slate-50/50 border-t border-slate-100 overflow-hidden"
                            >
                              <div className="p-3.5 space-y-2.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Detail Tagihan Siswa</span>
                                
                                {bills.length === 0 ? (
                                  <p className="text-[10px] text-slate-400 italic">Siswa belum memiliki tagihan pembayaran.</p>
                                ) : (
                                  <div className="space-y-1.5">
                                    {bills.map((bill) => (
                                      <div 
                                        key={bill.id}
                                        className="bg-white border border-slate-100/60 rounded-xl p-2.5 flex items-center justify-between"
                                      >
                                        <div>
                                          <span className="text-[10px] text-slate-700 font-bold block max-w-[180px] truncate">{bill.title}</span>
                                          <span className="text-[9px] text-slate-400 font-medium block mt-0.5">Tempo: {bill.dueDate}</span>
                                        </div>
                                        <div className="text-right">
                                          <span className="text-[10px] font-bold text-slate-800 block">Rp {bill.amount.toLocaleString('id-ID')}</span>
                                          
                                          {bill.status === 'Paid' ? (
                                            <span className="text-[8px] text-emerald-600 font-black bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 mt-1 inline-block">
                                              LUNAS
                                            </span>
                                          ) : bill.status === 'Pending' ? (
                                            <div className="flex items-center gap-1 mt-1 justify-end">
                                              <span className="text-[8px] text-amber-500 font-black bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 inline-block">
                                                PENDING
                                              </span>
                                              <button
                                                onClick={() => handleVerify(student.id, bill.id, true)}
                                                className="bg-brand-blue text-white p-0.5 rounded hover:bg-brand-blue-light"
                                                title="Setujui Pembayaran"
                                              >
                                                <Check size={8} />
                                              </button>
                                            </div>
                                          ) : (
                                            <span className="text-[8px] text-rose-600 font-black bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 mt-1 inline-block">
                                              BELUM LUNAS
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          {/* 4. SAVINGS TAB */}
          {activeTab === 'savings' && (
            <motion.div
              key="savings-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Stats Recap Card for Savings */}
              {(() => {
                const totalClassSetor = savings.reduce((sum, tx) => tx.type === 'setor' ? sum + tx.amount : sum, 0);
                const totalClassTarik = savings.reduce((sum, tx) => tx.type === 'tarik' ? sum + tx.amount : sum, 0);
                const totalClassSaldo = totalClassSetor - totalClassTarik;

                return (
                  <div className="bg-gradient-to-r from-sky-500 to-indigo-600 text-white p-4.5 rounded-3xl flex items-center justify-between shadow-md">
                    <div className="space-y-1">
                      <span className="text-[10px] text-sky-100 font-bold uppercase tracking-wider block">Total Saldo Tabungan Kelas</span>
                      <h4 className="font-display font-black text-2xl text-yellow-300">
                        Rp {totalClassSaldo.toLocaleString('id-ID')}
                      </h4>
                      <p className="text-[9px] text-sky-100/95 font-medium">
                        Setor: Rp {totalClassSetor.toLocaleString('id-ID')} • Tarik: Rp {totalClassTarik.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Form Input Transaksi Baru */}
              <div className="bg-white border border-slate-100 rounded-3xl p-4.5 custom-shadow space-y-3.5">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-sky-100 text-sky-600 rounded-xl">
                    <Plus size={16} />
                  </span>
                  <h3 className="font-display font-bold text-xs text-slate-800">Pencatatan Transaksi Baru</h3>
                </div>

                <form onSubmit={handleAddSavings} className="space-y-3">
                  {/* Pilih Siswa */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pilih Siswa</label>
                    <select
                      value={savingsStudentId}
                      onChange={(e) => setSavingsStudentId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-sky-500"
                    >
                      <option value="">-- Pilih Siswa --</option>
                      {classStudents.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Jenis Transaksi */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Jenis Transaksi</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSavingsType('setor')}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                          savingsType === 'setor'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100/50'
                        }`}
                      >
                        Setor Tunai
                      </button>
                      <button
                        type="button"
                        onClick={() => setSavingsType('tarik')}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                          savingsType === 'tarik'
                            ? 'bg-rose-50 text-rose-600 border-rose-200'
                            : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100/50'
                        }`}
                      >
                        Tarik Tunai
                      </button>
                    </div>
                  </div>

                  {/* Nominal & Deskripsi */}
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nominal (Rp)</label>
                      <input
                        type="number"
                        placeholder="Contoh: 10000"
                        value={savingsAmount}
                        onChange={(e) => setSavingsAmount(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Keterangan (Opsional)</label>
                      <input
                        type="text"
                        placeholder="Setoran Mingguan"
                        value={savingsDescription}
                        onChange={(e) => setSavingsDescription(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  {savingsError && (
                    <div className="text-[10px] text-red-600 bg-red-50 px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1">
                      <AlertCircle size={12} />
                      <span>{savingsError}</span>
                    </div>
                  )}

                  {savingsSuccess && (
                    <div className="text-[10px] text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 animate-pulse">
                      <CheckCircle size={12} />
                      <span>Transaksi tabungan berhasil dicatat!</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={savingsSubmitting}
                    className="w-full bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
                  >
                    {savingsSubmitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-white rounded-full animate-spin"></span>
                        Menyimpan...
                      </>
                    ) : (
                      'Simpan Catatan Tabungan'
                    )}
                  </button>
                </form>
              </div>

              {/* Rekap Tabungan Semua Siswa */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                  Rekap Saldo Tabungan Siswa
                </span>

                {classStudents.length === 0 ? (
                  <div className="bg-white rounded-3xl p-6 text-center text-slate-400 text-xs italic border border-slate-100">
                    Tidak ada siswa di kelas ini.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {classStudents.map((student) => {
                      const studentTxs = savings.filter(tx => tx.studentId === student.id);
                      const studentSaldo = studentTxs.reduce((sum, tx) => {
                        if (tx.type === 'setor') return sum + tx.amount;
                        if (tx.type === 'tarik') return sum - tx.amount;
                        return sum;
                      }, 0);

                      const isExpanded = expandedSavingsStudentId === student.id;

                      return (
                        <div
                          key={student.id}
                          className="bg-white border border-slate-100 rounded-3xl overflow-hidden custom-shadow transition-all hover:border-slate-200"
                        >
                          {/* Row Header */}
                          <div
                            onClick={() => setExpandedSavingsStudentId(isExpanded ? null : student.id)}
                            className="p-4 flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={student.avatar}
                                alt={student.name}
                                className="w-9 h-9 rounded-full object-cover border border-slate-50"
                              />
                              <div>
                                <h4 className="font-display font-bold text-xs text-slate-800 uppercase leading-tight">
                                  {student.name}
                                </h4>
                                <p className="text-[9px] text-slate-400 mt-0.5">
                                  Wali: {student.parentName}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5">
                              <div className="text-right">
                                <span className={`text-xs font-black block ${studentSaldo > 0 ? 'text-sky-600' : 'text-slate-400'}`}>
                                  Rp {studentSaldo.toLocaleString('id-ID')}
                                </span>
                                <span className="text-[8px] text-slate-400 block font-medium">
                                  {studentTxs.length} Transaksi
                                </span>
                              </div>
                              {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                            </div>
                          </div>

                          {/* Collapsible Dropdown Riwayat */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="bg-slate-50/50 border-t border-slate-100 overflow-hidden"
                              >
                                <div className="p-3.5 space-y-2">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Riwayat Detail Transaksi</span>
                                  
                                  {studentTxs.length === 0 ? (
                                    <p className="text-[10px] text-slate-400 italic">Belum ada riwayat setoran atau penarikan tabungan.</p>
                                  ) : (
                                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
                                      {studentTxs.map((tx) => (
                                        <div
                                          key={tx.id}
                                          className="bg-white border border-slate-100/60 rounded-xl p-2.5 flex items-center justify-between shadow-sm"
                                        >
                                          <div>
                                            <div className="flex items-center gap-1">
                                              <span className={`text-[8px] font-black px-1 rounded ${
                                                tx.type === 'setor' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                              }`}>
                                                {tx.type === 'setor' ? 'SETOR' : 'TARIK'}
                                              </span>
                                              <span className="text-[9px] text-slate-400 font-mono">
                                                {new Date(tx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                              </span>
                                            </div>
                                            <span className="text-[10px] text-slate-700 font-bold block mt-1 leading-normal">
                                              {tx.description}
                                            </span>
                                          </div>
                                          
                                          <div className="flex items-center gap-3">
                                            <span className={`text-xs font-black ${
                                              tx.type === 'setor' ? 'text-emerald-600' : 'text-rose-600'
                                            }`}>
                                              {tx.type === 'setor' ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
                                            </span>
                                            {confirmingDeleteId === tx.id ? (
                                              <div className="flex items-center gap-1.5 animate-pulse">
                                                <button
                                                  onClick={() => handleDeleteSavings(tx.id)}
                                                  className="bg-rose-500 hover:bg-rose-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md transition-all shadow-sm"
                                                  title="Yakin Hapus"
                                                >
                                                  Hapus?
                                                </button>
                                                <button
                                                  onClick={() => setConfirmingDeleteId(null)}
                                                  className="bg-slate-200 hover:bg-slate-300 text-slate-600 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md transition-all"
                                                  title="Batal"
                                                >
                                                  Batal
                                                </button>
                                              </div>
                                            ) : (
                                              <button
                                                onClick={() => setConfirmingDeleteId(tx.id)}
                                                className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                                title="Hapus Transaksi"
                                              >
                                                <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
