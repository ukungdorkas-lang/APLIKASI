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
            
            <h1 className="text-[12vw] lg:text-[7vw] font-display font-black leading-[0.85] text-white uppercase tracking-tighter mb-8">
              {banner?.title || defaultTitle}
            </h1>
            
            <p className="text-lg lg:text-xl text-slate-400 font-medium mb-12 max-w-xl leading-relaxed italic border-l-4 border-brand-red pl-6">
              {banner?.subtitle || config?.slogan || 'Kami siap melindungi masyarakat dari bahaya kebakaran dengan pelayanan cepat, akurat, dan terpercaya selama 24 jam penuh.'}
            </p>

            <div className="flex flex-wrap gap-6 mb-16">
              <Link to={banner?.ctaLink || "/report"} className="emergency-btn group flex items-center gap-4 py-5 px-10 text-xl">
                <span>{banner?.ctaText || "BUAT LAPORAN"}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </Link>
              <a 
                href={`tel:${config?.emergencyNumber?.replace(/[^0-9]/g, '') || '05532021476'}`} 
                className="bg-white/10 backdrop-blur-md border border-white/20 px-10 py-5 rounded-xl font-black italic uppercase tracking-tighter text-xl text-white hover:bg-white hover:text-brand-dark transition-all flex items-center gap-4 shadow-2xl"
              >
                <Phone className="w-6 h-6 text-brand-red animate-pulse" /> HUBUNGI KAMI
              </a>
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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, delay: 0.2 }}
            className="hidden lg:block relative"
          >
            <div className="relative z-10 rounded-[3rem] overflow-hidden border-[16px] border-white/5 shadow-3xl aspect-[4/5] max-w-md mx-auto">
              <img 
                src="https://images.unsplash.com/photo-1516562309708-05f3b2b2c238?auto=format&fit=crop&q=80&w=600"
                alt="Firefighter Action"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-red/80 via-transparent to-transparent" />
              <div className="absolute bottom-10 left-10 p-8 glass-dark rounded-3xl right-10">
                 <p className="text-[11px] font-black uppercase tracking-widest text-white/50 mb-2">Kasus Terakhir</p>
                 <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Kebakaran Gudang Industri</h2>
                 <p className="text-sm text-white/70 font-medium mt-2">Dapat dipadamkan dalam waktu 45 menit oleh Tim Satria.</p>
              </div>
            </div>
            
            {/* Floating decoration */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-red/20 blur-[100px] rounded-full" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-brand-orange/10 blur-[120px] rounded-full" />
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 animate-bounce cursor-pointer">
        <span className="text-[9px] font-black uppercase tracking-[0.4em]">Scroll untuk lanjut</span>
        <div className="w-1 h-8 bg-gradient-to-b from-brand-red to-transparent rounded-full shadow-[0_0_10px_rgba(193,18,31,0.5)]" />
      </div>
    </section>
  );
}
