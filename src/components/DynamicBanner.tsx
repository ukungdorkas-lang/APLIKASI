import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { db } from '../lib/db';
import { doc, onSnapshot } from '@/src/lib/supabase-adapter';
import { BannerConfig } from '../types';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface DynamicBannerProps {
  pageId: string;
  defaultTitle: string;
  defaultSubtitle: string;
  defaultImage: string;
}

export default function DynamicBanner({ pageId, defaultTitle, defaultSubtitle, defaultImage }: DynamicBannerProps) {
  const [banner, setBanner] = useState<BannerConfig | null>(null);
  
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'banners', pageId), (snap) => {
      if (snap.exists()) {
        setBanner(snap.data() as BannerConfig);
      }
    });
    return () => unsub();
  }, [pageId]);

  const title = banner?.title || defaultTitle;
  const subtitle = banner?.subtitle || defaultSubtitle;
  const imageUrl = banner?.imageUrl || defaultImage;

  return (
    <section 
      className="relative pt-32 pb-20 overflow-hidden" 
      style={{ 
        backgroundColor: banner?.backgroundColor || '#0f172a',
        backgroundImage: banner?.backgroundImageUrl ? `url(${banner.backgroundImageUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <motion.div className="absolute inset-0" style={{ y }}>
        <img 
          src={imageUrl}
          className="w-full h-full object-cover scale-110"
          alt={title}
        />
        <div 
          className="absolute inset-0 bg-brand-dark transition-opacity duration-700" 
          style={{ opacity: banner?.overlayOpacity ?? 0.4 }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-dark/20 to-brand-dark" />
      </motion.div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8 }}
           className="max-w-4xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-[2px] bg-brand-red" />
            <span className="text-brand-red font-black uppercase tracking-[0.4em] text-[10px]">HALAMAN {pageId}</span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-display font-black leading-[0.85] text-white uppercase tracking-tighter mb-8">
            {title}
          </h1>

          <p className="text-xl text-slate-400 font-medium max-w-xl leading-relaxed italic border-l-4 border-brand-red pl-6">
            {subtitle}
          </p>

          {banner?.ctaText && banner?.ctaLink && (
            <Link 
              to={banner.ctaLink}
              className="mt-10 inline-flex items-center gap-4 bg-brand-red text-white px-10 py-5 rounded-2xl font-black italic uppercase tracking-tighter hover:bg-white hover:text-brand-red transition-all shadow-2xl shadow-red-900/40 group"
            >
              {banner.ctaText}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </Link>
          )}
        </motion.div>
      </div>

      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] border border-white/5 rounded-full pointer-events-none translate-x-1/2 translate-y-1/2" />
    </section>
  );
}
