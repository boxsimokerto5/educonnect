import React, { useState, useEffect } from 'react';
import { CheckCircle2, ShieldAlert, CreditCard, AlertCircle, RefreshCw } from 'lucide-react';

interface DuitkuSimulatorProps {
  onBackToApp: () => void;
}

export default function DuitkuSimulator({ onBackToApp }: DuitkuSimulatorProps) {
  const [params, setParams] = useState({
    merchantOrderId: '',
    paymentAmount: 0,
    paymentMethod: '',
    productDetails: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const orderId = query.get('merchantOrderId') || '';
    const amountStr = query.get('paymentAmount') || '0';
    const method = query.get('paymentMethod') || 'QRIS';
    const product = query.get('productDetails') || 'Pembayaran Sekolah';

    setParams({
      merchantOrderId: orderId,
      paymentAmount: parseInt(amountStr, 10),
      paymentMethod: method,
      productDetails: product,
    });
  }, []);

  const handleSimulateSuccess = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/duitku/simulate-callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantOrderId: params.merchantOrderId,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Gagal mengirimkan simulasi callback pembayaran.');
      }
    } catch (e: any) {
      setError(e.message || 'Terjadi kesalahan koneksi ke server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center p-4 selection:bg-rose-500 selection:text-white" id="duitku-simulator-view">
      {/* Sandbox Indicator badge */}
      <div className="absolute top-4 bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[10px] tracking-wider font-bold py-1 px-3 rounded-full uppercase">
        ⚡ DUITKU SANDBOX SIMULATOR
      </div>

      <div className="w-full max-w-md bg-slate-800 rounded-3xl border border-slate-700/60 shadow-2xl p-6 space-y-6 relative overflow-hidden">
        {/* Header decoration */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500"></div>

        {!success ? (
          <>
            <div className="space-y-1.5 text-center pt-2">
              <div className="flex items-center justify-center gap-2 mb-1">
                {/* Custom Duitku Mock logo */}
                <div className="w-7 h-7 bg-rose-500 rounded-lg flex items-center justify-center font-bold text-sm tracking-tighter">
                  D
                </div>
                <span className="font-display font-black tracking-tight text-lg text-rose-500">duitku</span>
                <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono">V2 Inquiry</span>
              </div>
              <h2 className="font-display font-extrabold text-base text-slate-100">Gateway Pembayaran EduConnect</h2>
              <p className="text-xs text-slate-400">Silakan selesaikan pembayaran tagihan sekolah</p>
            </div>

            <div className="bg-slate-850/80 border border-slate-700/40 p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">No. Order</span>
                <span className="font-mono text-slate-200 font-bold">{params.merchantOrderId || 'N/A'}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Deskripsi</span>
                <span className="text-slate-200 font-medium max-w-[200px] text-right truncate">{params.productDetails}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Metode</span>
                <span className="text-slate-100 font-bold bg-slate-700/60 px-2 py-1 rounded uppercase tracking-wide text-[10px]">
                  {params.paymentMethod}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-700 flex justify-between items-center">
                <span className="text-xs text-slate-300 font-medium">Total Bayar</span>
                <span className="text-lg font-display font-extrabold text-rose-400">
                  Rp {params.paymentAmount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-xl flex gap-2 items-start text-xs text-rose-300 leading-normal animate-shake">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                onClick={handleSimulateSuccess}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-display font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-xs"
                id="simulate-success-btn"
              >
                {loading ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    Memproses Simulasi...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Simulasikan Pembayaran Berhasil
                  </>
                )}
              </button>

              <button
                onClick={onBackToApp}
                disabled={loading}
                className="w-full bg-slate-700 hover:bg-slate-650 disabled:opacity-50 text-slate-200 font-display font-bold py-3.5 rounded-xl transition-all text-xs"
                id="simulate-cancel-btn"
              >
                Batal & Kembali
              </button>
            </div>

            <div className="text-center text-[10px] text-slate-500 pt-1 leading-normal">
              Informasi ini bersifat simulasi testing sandbox. Dalam production, Anda akan diarahkan ke link Duitku resmi.
            </div>
          </>
        ) : (
          <div className="text-center py-6 space-y-6 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
              <CheckCircle2 size={36} className="stroke-[2.5px]" />
            </div>

            <div className="space-y-2">
              <h3 className="font-display font-extrabold text-lg text-slate-100">Pembayaran Berhasil!</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-normal">
                Sistem Duitku Sandbox telah berhasil mengirimkan callback IPN ke EduConnect. Status tagihan diperbarui otomatis secara real-time.
              </p>
            </div>

            <div className="bg-slate-850/50 p-4 rounded-xl max-w-sm mx-auto border border-slate-700/30 text-xs text-slate-300 flex items-center gap-2">
              <ShieldAlert size={16} className="text-emerald-400" />
              <span>Callback IPN sukses diverifikasi.</span>
            </div>

            <button
              onClick={onBackToApp}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white font-display font-bold py-3.5 rounded-xl shadow-lg transition-colors text-xs"
              id="back-to-app-btn"
            >
              Kembali ke EduConnect
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
