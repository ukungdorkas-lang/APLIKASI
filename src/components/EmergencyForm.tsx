import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert, Send, AlertTriangle, User, Phone, MapPin, CheckCircle2, Radio, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { IncidentType } from '../types';
import { cn } from '../lib/utils';

export default function EmergencyForm({ onSubmit }: { onSubmit: (data: any) => Promise<any> }) {
  const locationState = useLocation();
  const queryParams = new URLSearchParams(locationState.search);
  const initialType = (queryParams.get('type') as IncidentType) || 'Kebakaran';

  const [formData, setFormData] = useState({
    reporterName: '',
    phoneNumber: '',
    type: initialType,
    level: 'normal' as 'low' | 'medium' | 'high' | 'critical' | 'normal',
    description: '',
    location: { lat: 3.5833, lng: 116.6333, address: '' },
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const incidentTypes: IncidentType[] = ['Kebakaran', 'Evakuasi', 'Penyelamatan', 'Pohon Tumbang', 'Hewan Berbahaya', 'Banjir', 'Perbantuan', 'Lainnya'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await onSubmit(formData) as any;
      if (result && result.reportNumber) {
        setSuccess(result.reportNumber);
      } else {
        setSuccess('DMK-' + Date.now().toString().slice(-8));
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat mengirim laporan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto bg-white rounded-[2.5rem] p-12 text-center shadow-3xl border border-slate-100"
      >
        <div className="w-24 h-24 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-10">
          <CheckCircle2 className="text-green-500 w-12 h-12" />
        </div>
        <h2 className="text-4xl font-display font-black text-slate-900 uppercase tracking-tighter mb-4">Laporan Diterima</h2>
        <p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto">Tim kami sedang memproses laporan Anda. Harap tetap tenang dan siapkan jalur komunikasi.</p>
        
        <div className="bg-slate-50 p-8 rounded-2xl mb-12 border border-slate-100 relative overflow-hidden">
           <div className="flex justify-between items-center relative z-10">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID LAPORAN</span>
              <span className="text-xl font-display font-black text-brand-red uppercase">{success}</span>
           </div>
           <div className="absolute top-0 right-0 w-24 h-24 bg-brand-red opacity-[0.03] -translate-y-1/2 translate-x-1/2 rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link 
            to={`/check-ticket?ticket=${success}`}
            className="w-full flex items-center justify-center gap-3 py-5 bg-brand-red text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-red-700 transition-all shadow-xl shadow-red-200"
          >
            Cek Status <ArrowRight className="w-4 h-4" />
          </Link>
          <button 
            onClick={() => setSuccess(null)}
            className="w-full py-5 bg-brand-dark text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:opacity-90 transition-all shadow-xl"
          >
            Lapor Lagi
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-12 text-center sm:text-left">
        <h2 className="text-5xl font-display font-black text-white uppercase tracking-tighter mb-3">
          FORM <span className="text-brand-red underline decoration-8 underline-offset-8">LAPORAN</span>
        </h2>
        <p className="text-slate-400 font-medium uppercase tracking-[0.3em] text-[10px]">Pusat Komando & Penyelamatan Kabupaten Malinau</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-[3rem] p-8 md:p-16 shadow-2xl relative">
        <div className="absolute top-10 right-10 hidden sm:block">
           <ShieldAlert className="w-16 h-16 text-brand-red opacity-10" />
        </div>

        <div className="grid md:grid-cols-2 gap-10 mb-10">
          <div className="space-y-3 group">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 group-focus-within:text-brand-red transition-colors">
              <User className="w-3.5 h-3.5" /> Nama Lengkap Pelapor
            </label>
            <input 
              required
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-6 py-4 focus:bg-white focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red outline-none font-bold text-slate-900 transition-all"
              placeholder="Masukkan nama Anda"
              value={formData.reporterName}
              onChange={(e) => setFormData({...formData, reporterName: e.target.value})}
            />
          </div>
          <div className="space-y-3 group">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 group-focus-within:text-brand-red transition-colors">
              <Phone className="w-3.5 h-3.5" /> No. WhatsApp Aktif
            </label>
            <input 
              required
              type="tel"
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-6 py-4 focus:bg-white focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red outline-none font-bold text-slate-900 transition-all"
              placeholder="0812-XXXX-XXXX"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-10 mb-10">
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Jenis Kejadian</label>
            <div className="relative group">
              <select 
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-6 py-4 appearance-none font-bold text-slate-900 outline-none cursor-pointer focus:bg-white focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red transition-all"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as IncidentType})}
              >
                {incidentTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                 <Radio className="w-5 h-5 group-focus-within:text-brand-red transition-colors" />
              </div>
            </div>
          </div>
          <div className="space-y-3 group">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 group-focus-within:text-brand-red transition-colors">
              <MapPin className="w-3.5 h-3.5" /> Lokasi / Alamat Kejadian
            </label>
            <input 
              required
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-6 py-4 focus:bg-white focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red outline-none font-bold text-slate-900 transition-all"
              placeholder="Jl. Raya Malinau No. 123"
              value={formData.location.address}
              onChange={(e) => setFormData({...formData, location: { ...formData.location, address: e.target.value }})}
            />
          </div>
        </div>

        <div className="space-y-3 group mb-12">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 group-focus-within:text-brand-red transition-colors">
            <AlertTriangle className="w-3.5 h-3.5" /> Deskripsi Singkat Kronologi
          </label>
          <textarea 
            rows={5}
            required
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 focus:bg-white focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red outline-none resize-none font-medium text-slate-900 transition-all"
            placeholder="Jelaskan kondisi di lokasi kejadian..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-10">
           <div className="max-w-xs text-center md:text-left">
              <p className="text-[9px] font-black uppercase underline decoration-brand-red text-slate-900 mb-2">Peringatan Penyalahgunaan</p>
              <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight italic">Laporan palsu akan ditindak tegas sesuai hukum. ID IP dan Perangkat Anda dicatat secara otomatis.</p>
           </div>
           
           <button
            disabled={loading}
            className={cn(
              "emergency-btn min-w-[280px] py-6 text-xl flex items-center justify-center gap-4 group",
              loading && "opacity-50 pointer-events-none"
            )}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-sm font-black tracking-widest uppercase">Mengirim...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                <span className="text-sm font-black tracking-[0.2em] uppercase">Kirim Laporan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
