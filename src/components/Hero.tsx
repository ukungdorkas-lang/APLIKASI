import React, { useEffect, useState } from 'react';
import { ShieldAlert, Flame, Users, Activity, Phone, ArrowRight, Play } from 'lucide-react';
import { motion, useScroll, useTransform } from 'motion/react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { AppConfig, BannerConfig } from '../types';

export default function Hero() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [banner, setBanner] = useState<BannerConfig | null>(null);
  
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 500], [0.4, 0.1]);

  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, 'settings', 'app'), (snap) => {
      if (snap.exists()) {
        setConfig(snap.data() as AppConfig);
      }
    });

    const unsubBanner = onSnapshot(doc(db, 'banners', 'home'), (snap) => {
      if (snap.exists()) {
        setBanner(snap.data() as BannerConfig);
      }
    });

    return () => {
      unsubConfig();
      unsubBanner();
    };
  }, []);

  const defaultTitle = (
    <>
      SIGAP, TANGGAP, <br />
      DAN <span className="text-brand-red">PROFESIONAL</span>
    </>
  );

  const stats = (banner?.stats && banner.stats.length > 0) ? banner.stats : [
    { label: 'Siaga Penuh', value: '24 Jam' },
    { label: 'Tanggap Darurat', value: 'Cepat' },
    { label: 'Terpercaya', value: 'Profesional' },
  ];

  const icons = [
    <Activity className="w-5 h-5" />,
    <Flame className="w-5 h-5" />,
    <ShieldAlert className="w-5 h-5" />
  ];

  return (
    <section 
      className="relative min-h-screen flex items-center pt-24 overflow-hidden" 
      style={{ 
        backgroundColor: banner?.backgroundColor || '#0f172a',
        backgroundImage: banner?.backgroundImageUrl ? `url(${banner.backgroundImageUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Background with cinematic overlay */}
      <motion.div 
        className="absolute inset-0 z-0"
        style={{ y: y1, opacity }}
      >
        {config?.homeLayout?.heroVideoUrl ? (
          <div className="absolute inset-0 w-full h-full overflow-hidden">
             <iframe 
               src={`${config.homeLayout.heroVideoUrl}${config.homeLayout.heroVideoUrl.includes('?') ? '&' : '?'}autoplay=1&mute=1&loop=1&controls=0&background=1&playlist=${config.homeLayout.heroVideoUrl.split('/').pop()?.split('?')[0]}`}
               className="w-[100vw] h-[100vh] min-w-full min-h-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[1.5] pointer-events-none"
               allow="autoplay; fullscreen"
             />
          </div>
        ) : (
          <img 
            src={banner?.imageUrl || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=2069"} 
            alt="Firefighters Background"
            className="w-full h-full object-cover scale-110"
            referrerPolicy="no-referrer"
          />
        )}
        <div 
          className="absolute inset-0 bg-brand-dark transition-opacity duration-700" 
          style={{ opacity: banner?.overlayOpacity ?? 0.4 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark to-transparent" />
      </motion.div>

      <div className="container mx-auto px-6 lg:px-12 relative z-10 pt-20">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-[2px] bg-brand-red" />
              <span className="text-brand-red font-black uppercase tracking-[0.4em] text-[10px]">{config?.agencyName || 'DINAS PEMADAM KEBAKARAN'}</span>
            </div>
            
            <h1 className="text-5xl sm:text-[84px] font-['Georgia'] font-bold leading-tight sm:leading-[83px] text-white uppercase tracking-tighter mb-10 italic break-words hyphens-auto">
              {banner?.title || defaultTitle}
            </h1>
            
            <p className="text-lg lg:text-xl text-slate-400 font-medium mb-12 max-w-xl leading-relaxed italic border-l-4 border-brand-red pl-6">
              {banner?.subtitle || config?.slogan || 'Kami siap melindungi masyarakat dari bahaya kebakaran dengan pelayanan cepat, akurat, dan terpercaya selama 24 jam penuh.'}
            </p>

            <div className="flex overflow-x-auto sm:overflow-x-visible sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-6 mb-20 w-full max-w-4xl lg:max-w-none snap-x snap-mandatory pb-4 sm:pb-0 -mx-6 px-6 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <Link 
                to={banner?.ctaLink || "/report"} 
                className="shrink-0 snap-start emergency-btn group w-[85vw] sm:w-[240px] sm:h-[77px] px-6 py-5 sm:py-0 flex items-center justify-between sm:justify-center gap-4 whitespace-nowrap"
              >
                <span className="truncate text-[14px]">{banner?.ctaText || "BUAT LAPORAN"}</span>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white min-w-[2rem] sm:min-w-[2.5rem] transition-all">
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:text-brand-red group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
              
              <Link 
                to="/staff/ops" 
                className="shrink-0 snap-start bg-brand-dark/80 backdrop-blur-xl border-2 border-white/10 w-[85vw] sm:w-[240px] sm:h-[77px] px-6 py-5 sm:py-0 rounded-2xl font-black italic uppercase tracking-tighter text-white hover:bg-white hover:text-brand-dark transition-all flex items-center justify-center sm:justify-start gap-3 sm:gap-4 shadow-2xl group whitespace-nowrap"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-brand-red/20 flex items-center justify-center group-hover:bg-brand-red min-w-[2rem] sm:min-w-[2.5rem] transition-all">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-brand-red group-hover:text-white transition-all" />
                </div>
                <span className="truncate text-[15px]">LOGIN PETUGAS</span>
              </Link>
              
              <Link 
                to="/profile" 
                className="shrink-0 snap-start bg-slate-900/80 backdrop-blur-xl border-2 border-slate-700 w-[60vw] sm:w-[201px] px-6 md:px-8 py-5 sm:py-6 rounded-2xl font-black italic uppercase tracking-tighter text-sm sm:text-lg text-white hover:bg-white hover:text-slate-900 transition-all flex items-center justify-center shadow-xl group text-center"
              >
                PROFIL
              </Link>
              
              <Link 
                to="/education" 
                className="shrink-0 snap-start bg-brand-red/90 backdrop-blur-xl border-2 border-brand-red w-[60vw] sm:w-[201px] px-6 py-5 sm:py-6 rounded-2xl font-black italic uppercase tracking-tighter text-sm sm:text-lg text-white hover:bg-white hover:text-brand-red transition-all flex items-center justify-center shadow-xl group text-center leading-tight sm:leading-none sm:whitespace-nowrap flex-row gap-2"
              >
                <span>EDUKASI WARGA</span>
              </Link>
              {/* spacer for end masking */}
              <div className="shrink-0 w-2 sm:hidden relative"></div>
            </div>

            <div className="flex items-center gap-10">
              {stats.slice(0, 3).map((item, i) => (
                <div key={i} className="flex flex-col gap-2 border-l border-white/10 pl-6">
                  <div className="flex items-center gap-2 text-brand-red">
                    {icons[i] || <Activity className="w-5 h-5" />}
                    <span className="text-2xl font-black italic tracking-tighter text-white">{item.value}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.5 }}
            className="hidden lg:flex items-center justify-center relative"
          />
        </div>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 animate-bounce cursor-pointer">
        <span className="text-[9px] font-black uppercase tracking-[0.4em]">Scroll untuk lanjut</span>
        <div className="w-1 h-8 bg-gradient-to-b from-brand-red to-transparent rounded-full shadow-[0_0_10px_rgba(193,18,31,0.5)]" />
      </div>
    </section>
  );
}
