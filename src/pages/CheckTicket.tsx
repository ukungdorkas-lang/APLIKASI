import React from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { EmergencyReport } from '../types';
import { Search, ShieldAlert, MapPin, Clock, CheckCircle2, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';
import DynamicBanner from '../components/DynamicBanner';
import { cn } from '../lib/utils';

export default function CheckTicket() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTicket = queryParams.get('ticket') || '';

  const [ticketNumber, setTicketNumber] = React.useState(initialTicket);
  const [report, setReport] = React.useState<EmergencyReport | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const performSearch = React.useCallback(async (ticket: string) => {
    if (!ticket.trim()) return;

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const q = query(
        collection(db, 'reports'),
        where('reportNumber', '==', ticket.trim().toUpperCase()),
        limit(1)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError('Laporan tidak ditemukan. Pastikan nomor tiket yang Anda masukkan benar.');
      } else {
        setReport({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as EmergencyReport);
      }
    } catch (err) {
      console.error('Error fetching ticket:', err);
      setError('Terjadi kesalahan saat mencari tiket. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (initialTicket) {
      performSearch(initialTicket);
    }
  }, [initialTicket, performSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(ticketNumber);
  };

  const getStatusColor = (status: EmergencyReport['status']) => {
    switch (status) {
      case 'Menunggu':
      case 'Menunggu Penanganan':
        return 'bg-amber-500 text-white';
      case 'Diproses':
      case 'Dalam Penanganan':
        return 'bg-blue-500 text-white';
      case 'Selesai Ditangani':
        return 'bg-green-500 text-white';
      default:
        return 'bg-slate-500 text-white';
    }
  };

  return (
    <div className="pb-32">
      <DynamicBanner 
        pageId="check-ticket"
        defaultTitle="CEK STATUS LAPORAN"
        defaultSubtitle="Pantau kemajuan penanganan laporan darurat Anda secara real-time melalui sistem integrasi kami."
        defaultImage="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=2070"
      />

      <div className="max-w-4xl mx-auto px-6 sm:px-10 -mt-20 relative z-20">
        <div className="bg-white p-8 sm:p-12 rounded-[3.5rem] shadow-3xl border-8 border-slate-900">
          <form onSubmit={handleSearch} className="space-y-8">
            <div className="text-center space-y-4 mb-10">
               <h2 className="text-3xl font-display font-black uppercase italic italic tracking-tighter text-slate-900">Masukkan Nomor Tiket</h2>
               <p className="text-slate-500 font-medium italic">Nomor tiket Anda dimulai dengan kode <span className="font-black text-brand-red">DMK-</span></p>
            </div>

            <div className="relative group">
              <input 
                type="text" 
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value)}
                placeholder="CONTOH: DMK-20240510-001"
                className="w-full bg-slate-50 border-4 border-slate-100 rounded-[2rem] p-8 pl-16 text-xl font-black italic uppercase tracking-widest outline-none focus:border-brand-red focus:bg-white transition-all transition-all"
              />
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-brand-red transition-colors" />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-8 bg-brand-red text-white font-black italic uppercase tracking-widest rounded-[2rem] shadow-xl shadow-red-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin" />
                  SEDANG MENCARI...
                </>
              ) : (
                <>
                  PERIKSA STATUS <ArrowRight className="w-8 h-8" />
                </>
              )}
            </button>
          </form>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-12 p-8 bg-red-50 border-4 border-red-100 rounded-[2.5rem] flex items-center gap-6 text-red-700"
              >
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center shrink-0">
                   <AlertTriangle className="w-8 h-8" />
                </div>
                <p className="text-lg font-black italic tracking-tight">{error}</p>
              </motion.div>
            )}

            {report && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-16 space-y-12"
              >
                <div className="border-t-8 border-slate-900 pt-12">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                      <div className="space-y-2">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Detail Kejadian</span>
                         <h3 className="text-4xl font-display font-black uppercase italic tracking-tighter text-slate-900">{report.type}</h3>
                      </div>
                      <div className={cn("px-10 py-5 rounded-3xl font-black italic uppercase tracking-tighter text-xl", getStatusColor(report.status))}>
                         {report.status}
                      </div>
                   </div>

                   <div className="grid md:grid-cols-2 gap-10">
                      <div className="space-y-8">
                         <div className="flex items-start gap-6 group">
                            <div className="w-16 h-16 bg-slate-50 border-4 border-slate-100 rounded-2xl flex items-center justify-center shrink-0 group-hover:border-brand-red transition-all">
                               <MapPin className="w-8 h-8 text-brand-red" />
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lokasi Kejadian</p>
                               <p className="text-lg font-bold italic text-slate-700 leading-tight">{report.location.address}</p>
                            </div>
                         </div>
                         <div className="flex items-start gap-6 group">
                            <div className="w-16 h-16 bg-slate-50 border-4 border-slate-100 rounded-2xl flex items-center justify-center shrink-0 group-hover:border-brand-red transition-all">
                               <Clock className="w-8 h-8 text-brand-red" />
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Waktu Pelaporan</p>
                               <p className="text-lg font-bold italic text-slate-700">{new Date(report.createdAt).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</p>
                            </div>
                         </div>
                      </div>

                      <div className="bg-slate-50 p-8 rounded-[2.5rem] border-4 border-slate-100 italic">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Ringkasan Laporan</p>
                         <p className="text-slate-600 font-medium leading-relaxed">{report.description}</p>
                      </div>
                   </div>

                   {report.officerNotes && (
                     <div className="mt-12 p-8 bg-brand-red/5 border-4 border-brand-red/10 rounded-[2.5rem]">
                        <div className="flex items-center gap-4 mb-4">
                           <ShieldAlert className="w-6 h-6 text-brand-red" />
                           <h4 className="text-sm font-black uppercase italic tracking-widest text-brand-red">Catatan Petugas Lapangan</h4>
                        </div>
                        <p className="text-slate-700 font-bold italic leading-relaxed">{report.officerNotes}</p>
                     </div>
                   )}

                   {report.status === 'Selesai Ditangani' && report.documentation && (
                     <div className="mt-12 p-10 bg-slate-900 rounded-[3rem] text-white">
                        <div className="flex items-center gap-4 mb-8">
                           <CheckCircle2 className="w-10 h-10 text-green-500" />
                           <h4 className="text-2xl font-display font-black italic uppercase tracking-tighter">Hasil Penanganan</h4>
                        </div>
                        <div className="space-y-6">
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                              <div className="bg-white/5 p-6 rounded-2xl text-center">
                                 <p className="text-brand-red text-2xl font-black italic">{report.documentation.personnel}</p>
                                 <p className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Personel</p>
                              </div>
                              <div className="bg-white/5 p-6 rounded-2xl text-center">
                                 <p className="text-brand-red text-2xl font-black italic">{report.documentation.units.length}</p>
                                 <p className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Unit Armada</p>
                              </div>
                              <div className="bg-white/5 p-6 rounded-2xl text-center">
                                 <p className="text-brand-red text-2xl font-black italic">{report.documentation.duration}</p>
                                 <p className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Durasi</p>
                              </div>
                              <div className="bg-white/5 p-6 rounded-2xl text-center">
                                 <p className="text-brand-red text-2xl font-black italic">{report.documentation.victims || 'Nihil'}</p>
                                 <p className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Korban</p>
                              </div>
                           </div>
                           <p className="text-slate-400 font-medium italic leading-relaxed border-t border-white/10 pt-6">
                              {report.documentation.chronology}
                           </p>
                        </div>
                     </div>
                   )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
