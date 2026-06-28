import React, { useState } from 'react';
import { EPermit, Student } from '../types';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar, FileText, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

interface EPermitFormProps {
  student: Student;
  onBack: () => void;
  onSubmitPermit: (permit: Omit<EPermit, 'id' | 'submittedAt' | 'status'>) => void;
  teacherName?: string;
}

export default function EPermitForm({ student, onBack, onSubmitPermit, teacherName }: EPermitFormProps) {
  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 mt-4 text-xs">Memuat data siswa...</p>
      </div>
    );
  }

  const [type, setType] = useState<'Sakit' | 'Keperluan Keluarga'>('Sakit');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fakeFileName, setFakeFileName] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      setFakeFileName(droppedFile.name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFakeFileName(selectedFile.name);
    }
  };

  // Simulate picking a preset medical certificate or parent note
  const handleSimulateUpload = () => {
    const names = type === 'Sakit' ? ['Surat_Dokter_Rian.jpg', 'Surat_Klinik_Sehat.png'] : ['Surat_Acara_Keluarga.pdf', 'Surat_Izin_Orangtua.docx'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    setFakeFileName(randomName);
    setFile({ name: randomName } as File);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setError('Mohon isi tanggal mulai dan tanggal selesai perizinan.');
      return;
    }
    if (!reason.trim()) {
      setError('Mohon tuliskan alasan perizinan.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('Tanggal mulai tidak boleh melebihi tanggal selesai.');
      return;
    }

    setError('');
    onSubmitPermit({
      studentId: student.id,
      studentName: student.name,
      className: student.class,
      type,
      startDate,
      endDate,
      reason,
      attachmentName: fakeFileName || (type === 'Sakit' ? 'SuratDokter_Rian.jpg' : 'SuratKeperluan_Rian.png')
    });

    setIsSuccess(true);
    setTimeout(() => {
      onBack();
    }, 1800);
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 15 }}
          className="bg-emerald-50 text-brand-green p-4 rounded-full mb-6 custom-shadow"
        >
          <CheckCircle2 size={64} className="animate-pulse" />
        </motion.div>
        <h3 className="font-display font-bold text-2xl text-slate-900 mb-2">Izin Berhasil Dikirim</h3>
        <p className="text-slate-500 max-w-sm">
          Pengajuan izin {student.name} sedang diteruskan ke {teacherName || 'Wali Kelas'} untuk divalidasi.
        </p>
        <span className="text-xs text-slate-400 mt-8 block animate-bounce">Mengarahkan kembali...</span>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-3xl overflow-hidden custom-shadow border border-slate-100">
      {/* Header */}
      <div className="bg-brand-blue text-white p-5 pb-8 relative rounded-b-3xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-xl hover:bg-slate-800 transition-colors"
            id="back-from-permit-btn"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="font-display font-bold text-lg">E-Permit Form</h2>
            <p className="text-xs text-slate-300">Pengajuan Izin Online • {student.name}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5 -mt-4 bg-white rounded-t-3xl relative">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm"
          >
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Jenis Izin */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Pilih Jenis Izin</label>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                type === 'Sakit'
                  ? 'border-brand-green bg-emerald-50/50 text-slate-800 font-semibold'
                  : 'border-slate-100 hover:border-slate-200 text-slate-500'
              }`}
              onClick={() => setType('Sakit')}
            >
              <input
                type="radio"
                name="permitType"
                checked={type === 'Sakit'}
                onChange={() => setType('Sakit')}
                className="sr-only"
              />
              <span className={`w-2.5 h-2.5 rounded-full ${type === 'Sakit' ? 'bg-brand-green' : 'bg-slate-300'}`}></span>
              Sakit
            </label>

            <label
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                type === 'Keperluan Keluarga'
                  ? 'border-amber-500 bg-amber-50/30 text-slate-800 font-semibold'
                  : 'border-slate-100 hover:border-slate-200 text-slate-500'
              }`}
              onClick={() => setType('Keperluan Keluarga')}
            >
              <input
                type="radio"
                name="permitType"
                checked={type === 'Keperluan Keluarga'}
                onChange={() => setType('Keperluan Keluarga')}
                className="sr-only"
              />
              <span className={`w-2.5 h-2.5 rounded-full ${type === 'Keperluan Keluarga' ? 'bg-amber-500' : 'bg-slate-300'}`}></span>
              Keperluan Keluarga
            </label>
          </div>
        </div>

        {/* Tanggal Mulai & Akhir */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500">Mulai Tanggal</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:border-brand-blue"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500">s.d Tanggal</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:border-brand-blue"
              />
            </div>
          </div>
        </div>

        {/* Alasan */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700">Alasan / Keterangan</label>
          <textarea
            required
            rows={3}
            placeholder={
              type === 'Sakit'
                ? 'Tuliskan gejala atau diagnosa dokter singkat...'
                : 'Tuliskan keperluan keluarga yang mengharuskan anak tidak hadir...'
            }
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm focus:outline-none focus:border-brand-blue resize-none"
          />
        </div>

        {/* Upload Lampiran */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-slate-700">Lampiran Bukti</label>
            <button
              type="button"
              onClick={handleSimulateUpload}
              className="text-xs text-brand-blue font-semibold hover:underline"
              id="simulate-upload-btn"
            >
              Simulasi Upload Cepat
            </button>
          </div>
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
              fakeFileName
                ? 'border-brand-green bg-emerald-50/20'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <input
              type="file"
              id="permit-file-upload"
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,application/pdf"
            />
            <label htmlFor="permit-file-upload" className="cursor-pointer block">
              {fakeFileName ? (
                <div className="flex flex-col items-center">
                  <div className="bg-emerald-100 text-brand-green p-3 rounded-full mb-2">
                    <FileText size={24} />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 break-all">{fakeFileName}</span>
                  <span className="text-xs text-slate-400 mt-1">Siap dikirimkan (klik untuk ganti)</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="bg-slate-100 text-slate-500 p-3 rounded-full mb-2">
                    <Upload size={20} />
                  </div>
                  <span className="text-sm font-semibold text-slate-600 block">
                    Unggah Surat Keterangan
                  </span>
                  <span className="text-xs text-slate-400 mt-0.5">
                    Drag-and-drop atau klik untuk pilih file
                  </span>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Kirim Tombol */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white py-3.5 px-4 rounded-xl font-display font-semibold transition-colors flex items-center justify-center gap-2 custom-shadow"
          id="submit-permit-btn"
        >
          Kirim Pengajuan Izin
        </motion.button>
      </form>
    </div>
  );
}
