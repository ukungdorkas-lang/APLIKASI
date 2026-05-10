import React from 'react';
import { Mail, Phone, MapPin, Clock, MessageSquare, Send } from 'lucide-react';
import { motion } from 'motion/react';
import DynamicBanner from '../components/DynamicBanner';

export default function Contact() {
  return (
    <div className="pb-32">
      <DynamicBanner 
        pageId="contact"
        defaultTitle="HUBUNGI KAMI"
        defaultSubtitle="Pusat komunikasi resmi Satuan Polisi Pamong Praja dan Pemadam Kebakaran Kabupaten Malinau."
        defaultImage="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=2069"
      />

      <div className="max-w-7xl mx-auto px-6 sm:px-10 -mt-24 relative z-10">
        <div className="grid lg:grid-cols-12 gap-10">
          {/* Contact Info Cards */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-brand-dark p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/20 blur-[80px] rounded-full" />
               <h3 className="text-3xl font-display font-black uppercase italic tracking-tighter mb-10 leading-none">Informasi <span className="text-brand-red">Kontak.</span></h3>
               
               <div className="space-y-10">
                 <div className="flex gap-6">
                   <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                     <MapPin className="w-6 h-6 text-brand-red" />
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Kantor Pusat</p>
                     <p className="text-lg font-bold leading-relaxed italic">Jl. Raja Alam, RT. 06, Malinau Kota, Kab. Malinau, Kalimantan Utara</p>
                   </div>
                 </div>

                 <div className="flex gap-6">
                   <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                     <Phone className="w-6 h-6 text-brand-red" />
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Emergency Call</p>
                     <p className="text-3xl font-display font-black italic tracking-tighter text-brand-red">112</p>
                   </div>
                 </div>

                 <div className="flex gap-6">
                   <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                     <Mail className="w-6 h-6 text-brand-red" />
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Email Resmi</p>
                     <p className="text-lg font-bold italic">kontak@damkarmalinau.go.id</p>
                   </div>
                 </div>
               </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border-4 border-slate-900 shadow-xl">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-display font-black uppercase italic tracking-tighter">Waktu Ops</h4>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">SIAGA PENUH</p>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">DARURAT</p>
                    <p className="font-display font-black text-brand-red italic">24 JAM</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">ADMINISTRASI</p>
                    <p className="font-display font-black text-slate-900 italic text-xs">SENIN - JUMAT</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7">
            <div className="bg-white p-12 sm:p-20 rounded-[4rem] shadow-2xl border-8 border-slate-900 h-full">
               <div className="max-w-xl">
                 <h2 className="text-5xl font-display font-black uppercase italic tracking-tighter mb-4 text-slate-900">Kirim <span className="text-brand-red">Pesan.</span></h2>
                 <p className="text-slate-500 font-bold mb-12 italic leading-relaxed">Punya pertanyaan non-darurat? Silakan kirimkan pesan Anda melalui formulir di bawah ini.</p>
                 
                 <form className="space-y-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Lengkap</label>
                     <input type="text" className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-2xl font-bold outline-none focus:border-brand-red transition-all" placeholder="Masukkan nama Anda..." />
                   </div>
                   
                   <div className="grid sm:grid-cols-2 gap-6">
                     <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email</label>
                       <input type="email" className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-2xl font-bold outline-none focus:border-brand-red transition-all" placeholder="nama@email.com" />
                     </div>
                     <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sektor</label>
                       <select className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-2xl font-bold outline-none focus:border-brand-red transition-all">
                         <option>Informasi Umum</option>
                         <option>Pengaduan</option>
                         <option>Kerjasama</option>
                         <option>Lainnya</option>
                       </select>
                     </div>
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pesan</label>
                     <textarea rows={6} className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-2xl font-bold outline-none focus:border-brand-red transition-all resize-none" placeholder="Tuliskan pesan Anda di sini..."></textarea>
                   </div>

                   <button type="submit" className="w-full py-6 bg-brand-red text-white rounded-[2rem] font-display font-black italic uppercase tracking-tighter text-xl shadow-2xl shadow-red-900/40 hover:bg-brand-dark transition-all flex items-center justify-center gap-4 group">
                     KIRIM PESAN SEKARANG
                     <Send className="w-6 h-6 group-hover:translate-x-3 group-hover:-translate-y-3 transition-transform" />
                   </button>
                 </form>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
