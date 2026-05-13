import React from 'react';
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, Shield, ArrowRight, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppConfig } from '../types';
import Markdown from 'react-markdown';

export default function Footer() {
  const [settings, setSettings] = React.useState<AppConfig | null>(null);

  React.useEffect(() => {
    return onSnapshot(doc(db, 'settings', 'app'), (snap) => {
      if (snap.exists()) setSettings(snap.data() as AppConfig);
    });
  }, []);

  const socialLinks = settings?.socialMedia || {
    instagram: '',
    facebook: '',
    twitter: '',
    youtube: ''
  };

  const socialIcons = [
    { Icon: Facebook, url: socialLinks.facebook, label: 'Facebook' },
    { Icon: Instagram, url: socialLinks.instagram, label: 'Instagram' },
    { Icon: Twitter, url: socialLinks.twitter, label: 'Twitter' },
    { Icon: Youtube, url: socialLinks.youtube, label: 'Youtube' }
  ].filter(s => s.url);

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
                <div className="w-12 h-12 bg-brand-red rounded-xl flex items-center justify-center shadow-lg shadow-red-900/40 overflow-hidden">
                  {settings?.logoUrl ? (
                    <img src={settings.logoUrl} className="w-full h-full object-contain p-2" alt="Logo" />
                  ) : (
                    <Shield className="w-6 h-6 text-white" />
                  )}
                </div>
                <h2 className="text-3xl font-display font-black tracking-tighter uppercase italic">
                  {settings?.agencyName?.split(' ')[0] || 'Damkar'} <span className="text-brand-red">{settings?.agencyName?.split(' ').slice(1).join(' ') || 'Malinau'}</span>
                </h2>
              </div>
              <div className="text-slate-400 font-medium leading-relaxed max-w-sm italic prose prose-invert prose-sm">
                {settings?.footerText ? (
                  <Markdown>{settings.footerText}</Markdown>
                ) : (
                  "Pelayanan Pemadam Kebakaran dan Penyelamatan. Bekerja dengan cepat, tepat, dan selamat untuk perlindungan masyarakat."
                )}
              </div>
            </div>
            
            <div className="flex gap-4">
              {socialIcons.map(({ Icon, url, label }, i) => (
                <a 
                  key={i} 
                  href={url.startsWith('http') ? url : `https://${label.toLowerCase()}.com/${url}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-brand-red transition-all group"
                  title={label}
                >
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
                         <p className="text-4xl font-display font-black tracking-tighter text-white italic leading-none">
                           {settings?.emergencyNumber || '0553 2021476'}
                         </p>
                         <p className="text-[9px] font-black text-brand-red uppercase animate-pulse mt-1">Ready for response</p>
                      </div>
                   </div>
                   <a 
                    href={`https://wa.me/${settings?.contact?.replace(/[^0-9]/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full block text-center py-4 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                   >
                      Kontak via WhatsApp
                   </a>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/10 blur-[60px] rounded-full" />
             </div>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">
            {settings?.footerCopyright || `© ${new Date().getFullYear()} BPBD Pemadam Kebakaran Malinau. All Rights Reserved.`}
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
