import React, { useState } from 'react';
import { Student, Bill } from '../types';
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
}

export function TeacherFinancesTab({
  students,
  onAddClassBill,
  onAddStudentBill,
  onVerifyPayment,
  className = 'TK-A',
  teacherName = 'Pak Budi'
}: TeacherFinancesTabProps) {
  // Filter students by class
  const classStudents = students.filter(s => s.class === className);
  
  // Tabs: 'approval' | 'create' | 'status'
  const [activeTab, setActiveTab] = useState<'approval' | 'create' | 'status'>('approval');
  
  // Search state for status tab
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

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
        <div className="bg-slate-100/80 p-1 rounded-2xl flex border border-slate-200/40">
          <button
            onClick={() => setActiveTab('approval')}
            className={`flex-1 text-center py-2 text-[10px] font-bold rounded-xl transition-all relative ${
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
            className={`flex-1 text-center py-2 text-[10px] font-bold rounded-xl transition-all ${
              activeTab === 'create' 
                ? 'bg-white text-brand-blue shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Buat Tagihan
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 text-center py-2 text-[10px] font-bold rounded-xl transition-all ${
              activeTab === 'status' 
                ? 'bg-white text-brand-blue shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Daftar Siswa
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
        </AnimatePresence>
      </div>
    </div>
  );
}
