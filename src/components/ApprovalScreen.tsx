import React, { useState } from 'react';
import { EPermit } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, CheckCircle, XCircle, FileText, Image, ExternalLink, Calendar, Check, X, ShieldAlert } from 'lucide-react';

interface ApprovalScreenProps {
  permits: EPermit[];
  onBack: () => void;
  onApprove: (permitId: string) => void;
  onReject: (permitId: string) => void;
}

export default function ApprovalScreen({ permits, onBack, onApprove, onReject }: ApprovalScreenProps) {
  const [selectedAttachment, setSelectedAttachment] = useState<string | null>(null);

  return (
    <div className="max-w-md mx-auto space-y-5 pb-20">
      {/* Header */}
      <div className="bg-brand-blue text-white p-5 pb-8 relative rounded-b-3xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-xl hover:bg-slate-800 transition-colors"
            id="back-from-approval-btn"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="font-display font-bold text-lg">Validasi Izin Siswa</h2>
            <p className="text-xs text-slate-300">Konfirmasi status ketidakhadiran online</p>
          </div>
        </div>
      </div>

      {/* Permits List */}
      <div className="px-4 -mt-4 relative z-30 space-y-4">
        {permits.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 custom-shadow space-y-3">
            <div className="bg-slate-50 text-slate-400 p-4 rounded-full w-fit mx-auto">
              <CheckCircle size={36} />
            </div>
            <h3 className="font-display font-bold text-slate-800 text-sm">Semua Pengajuan Selesai</h3>
            <p className="text-xs text-slate-400">Tidak ada perizinan yang sedang mengantre saat ini.</p>
          </div>
        ) : (
          permits.map((permit) => {
            // Calculate day duration
            const days = Math.max(
              1,
              Math.ceil(
                (new Date(permit.endDate).getTime() - new Date(permit.startDate).getTime()) / (1000 * 60 * 60 * 24)
              ) + 1
            );

            return (
              <motion.div
                key={permit.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-3xl p-5 border border-slate-100 custom-shadow space-y-4 relative overflow-hidden"
              >
                {/* Stamp overlay for completed state */}
                {permit.status !== 'Pending' && (
                  <div className={`absolute top-4 right-4 rotate-12 border-2 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-widest ${
                    permit.status === 'Approved' ? 'border-brand-green text-brand-green bg-emerald-50/50' : 'border-red-500 text-red-500 bg-red-50/50'
                  }`}>
                    {permit.status === 'Approved' ? 'DISETUJUI' : 'DITOLAK'}
                  </div>
                )}

                {/* Student Profile Info */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-brand-green bg-emerald-50 px-2 py-0.5 rounded-full">
                      {permit.type}
                    </span>
                    <h3 className="font-display font-extrabold text-sm text-slate-800 uppercase mt-1.5">
                      {permit.studentName}
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold">{permit.className}</p>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Detail Izin */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-600 text-xs">
                    <Calendar size={14} className="text-slate-400 shrink-0" />
                    <span className="font-bold">{permit.startDate} s.d {permit.endDate}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                      {days} Hari
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/50">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Keterangan:</span>
                    <p className="text-xs text-slate-600 leading-normal font-medium">{permit.reason}</p>
                  </div>
                </div>

                {/* File Attachment Badge */}
                {permit.attachmentName && (
                  <div
                    onClick={() => setSelectedAttachment(permit.attachmentName || null)}
                    className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 text-slate-600">
                      {permit.type === 'Sakit' ? (
                        <FileText size={16} className="text-red-500" />
                      ) : (
                        <Image size={16} className="text-blue-500" />
                      )}
                      <span className="text-[11px] font-bold text-slate-700 truncate max-w-[180px]">
                        {permit.attachmentName}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-brand-blue flex items-center gap-1">
                      Lihat Dok <ExternalLink size={10} />
                    </span>
                  </div>
                )}

                {/* Actions (Only if Pending) */}
                {permit.status === 'Pending' && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => onReject(permit.id)}
                      className="border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500 text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all"
                      id={`reject-btn-${permit.id}`}
                    >
                      <X size={14} /> Tolak
                    </button>
                    <button
                      onClick={() => onApprove(permit.id)}
                      className="bg-brand-blue hover:bg-brand-blue-light text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow"
                      id={`approve-btn-${permit.id}`}
                    >
                      <Check size={14} /> Setujui
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Simulated Document Viewer Modal */}
      <AnimatePresence>
        {selectedAttachment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-blue/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center border border-slate-100"
            >
              <div className="flex justify-between items-center">
                <h4 className="font-display font-extrabold text-sm text-slate-900 truncate flex-1 text-left pr-4">
                  📄 {selectedAttachment}
                </h4>
                <button
                  onClick={() => setSelectedAttachment(null)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full"
                  id="close-doc-viewer-btn"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Simulated Paper Document */}
              <div className="border border-slate-200 bg-amber-50/10 p-5 rounded-2xl min-h-[220px] flex flex-col justify-between text-left space-y-4 shadow-inner relative overflow-hidden">
                {/* Decorative clinic water stamp */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none rotate-12">
                  <ShieldAlert size={140} />
                </div>

                <div className="space-y-3">
                  <div className="border-b border-slate-300 pb-2 flex justify-between items-center">
                    <div>
                      <h5 className="font-bold text-xs uppercase text-slate-700 tracking-tight">Klinik Sehat Medika</h5>
                      <p className="text-[8px] text-slate-400">Jl. Harapan No. 42, Surabaya</p>
                    </div>
                    <span className="text-[8px] border border-brand-green text-brand-green px-1 rounded uppercase font-bold">ASLI</span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Surat Keterangan Dokter</span>
                    <p className="text-[10px] text-slate-600 leading-normal">
                      Menerangkan bahwa pasien anak bernama <strong>RIAN HIDAYAT</strong> berada dalam kondisi kurang sehat dan membutuhkan istirahat selama 2 (dua) hari terhitung sejak tanggal 26 Juni 2026.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-end border-t border-slate-100 pt-3">
                  <div className="text-[8px] text-slate-400">
                    Sistem Verifikasi QR Code <br />
                    <span className="font-mono text-[7px] text-slate-300">SECURE_DOC_85402</span>
                  </div>
                  <div className="text-right">
                    <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded p-1 mx-auto flex items-center justify-center mb-1">
                      {/* Simulating a small QR code */}
                      <div className="grid grid-cols-3 gap-0.5 w-full h-full">
                        <div className="bg-slate-800"></div><div className="bg-white"></div><div className="bg-slate-800"></div>
                        <div className="bg-white"></div><div className="bg-slate-800"></div><div className="bg-white"></div>
                        <div className="bg-slate-800"></div><div className="bg-white"></div><div className="bg-slate-800"></div>
                      </div>
                    </div>
                    <span className="text-[8px] font-bold text-slate-500 block">dr. Andi Hermawan</span>
                    <span className="text-[7px] text-slate-400 block">NIP. 19850123912</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedAttachment(null)}
                className="w-full bg-brand-blue hover:bg-brand-blue-light text-white font-display font-bold text-xs py-2.5 rounded-xl transition-colors"
                id="close-viewer-footer-btn"
              >
                Tutup Dokumen
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
