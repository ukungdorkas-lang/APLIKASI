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
    <footer className="bg-brand-dark text-white relative overflow-hidden pt-32 pb-16 border-t-8 border-brand-red">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-red/10 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-orange/5 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid lg:grid-cols-12 gap-20 mb-32">
          <div className="lg:col-span-4 space-y-12">
            <div>
              <div className="flex items-center gap-5 mb-8">
                <div className="w-16 h-16 bg-brand-red rounded-2xl flex items-center justify-center shadow-emergency group transition-transform hover:rotate-6">
                  {settings?.logoUrl ? (
                    <img src={settings.logoUrl} className="w-full h-full object-contain p-2" alt="Logo" />
                  ) : (
                    <Shield className="w-8 h-8 text-white" />
                  )}
                </div>
                <h2 className="text-4xl font-display font-black tracking-tighter uppercase italic leading-none flex flex-col">
                  <span>{settings?.agencyName?.split(' ')[0] || 'DAMKAR'}</span>
                  <span className="text-brand-red -mt-1">{settings?.agencyName?.split(' ').slice(1).join(' ') || 'MALINAU'}</span>
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

          <div className="lg:col-span-4">
             <div className="bg-slate-900 p-10 rounded-[3rem] border-4 border-brand-red shadow-emergency relative group overflow-hidden">
                <div className="relative z-10">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-8 uppercase italic">Pusat Komando 24 Jam</h4>
                   <div className="flex items-center gap-4 sm:gap-6 lg:gap-8 mb-10">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-brand-red rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl shadow-red-900 group-hover:rotate-12 transition-transform shrink-0">
                         <Phone className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      </div>
                      <div className="overflow-hidden min-w-0">
                         <p className="text-[26px] font-display font-black tracking-tighter text-white italic leading-none break-all">
                           {settings?.emergencyNumber || '112'}
                         </p>
                         <p className="text-[10px] font-black text-brand-red uppercase animate-pulse mt-2 tracking-widest italic truncate">Ready for response</p>
                      </div>
                   </div>
                   <a 
                    href={`https://wa.me/${settings?.contact?.replace(/[^0-9]/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-3 py-5 bg-brand-red text-white text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-brand-dark transition-all rounded-2xl italic"
                   >
                      Hubungi Operator (WA) <ArrowRight className="w-4 h-4" />
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
