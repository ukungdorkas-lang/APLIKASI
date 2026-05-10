import React from 'react';
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, Shield, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-white relative overflow-hidden pt-32 pb-12 border-t border-white/5">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-red to-transparent" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-red/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <div className="grid lg:grid-cols-12 gap-16 mb-24">
          <div className="lg:col-span-5 space-y-10">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-brand-red rounded-xl flex items-center justify-center shadow-lg shadow-red-900/40">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl font-display font-black tracking-tighter uppercase italic">Damkar <span className="text-brand-red">Malinau</span></h2>
              </div>
              <p className="text-slate-400 font-medium leading-relaxed max-w-sm italic">
                Pelayanan Pemadam Kebakaran dan Penyelamatan Kabupaten Malinau. Bekerja dengan cepat, tepat, dan selamat untuk perlindungan masyarakat.
              </p>
            </div>
            
            <div className="flex gap-4">
              {[Facebook, Instagram, Twitter].map((Icon, i) => (
                <a key={i} href="#" className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-brand-red transition-all group">
                   <Icon className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 grid grid-cols-2 gap-8">
            <div className="space-y-6">
               <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-red">Navigasi</h4>
               <ul className="space-y-4">
                 {['Home', 'Laporan', 'Berita', 'Edukasi', 'Kontak'].map((item) => (
                   <li key={item}>
                     <Link to={item === 'Home' ? '/' : `/${item.toLowerCase()}`} className="text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2 group">
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all text-brand-red" />
                        {item}
                     </Link>
                   </li>
                 ))}
               </ul>
            </div>
            <div className="space-y-6">
               <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-red">Pos Wilayah</h4>
               <ul className="space-y-4 text-sm font-bold text-slate-400 italic">
                 <li>Malinau Kota (Pusat)</li>
                 <li>Malinau Utara</li>
                 <li>Malinau Barat</li>
                 <li>Malinau Selatan</li>
               </ul>
            </div>
          </div>

          <div className="lg:col-span-3">
             <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-lg relative group overflow-hidden">
                <div className="relative z-10">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Pusat Bantuan 24/7</h4>
                   <div className="flex items-center gap-6 mb-8">
                      <div className="w-16 h-16 bg-brand-red rounded-2xl flex items-center justify-center shadow-2xl shadow-red-900 group-hover:scale-110 transition-transform">
                         <Phone className="w-8 h-8 text-white" />
                      </div>
                      <div>
                         <p className="text-4xl font-display font-black tracking-tighter text-white italic leading-none">112</p>
                         <p className="text-[9px] font-black text-brand-red uppercase animate-pulse mt-1">Ready for response</p>
                      </div>
                   </div>
                   <button className="w-full py-4 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                      Kontak via WhatsApp
                   </button>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/10 blur-[60px] rounded-full" />
             </div>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">
            © 2026 BPBD Pemadam Kebakaran Malinau. All Rights Reserved.
          </p>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Systems Operational</span>
             </div>
             <div className="h-4 w-px bg-white/10" />
             <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">v2.5.0-Release</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
