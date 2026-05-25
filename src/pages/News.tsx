import React from 'react';
import { Newspaper, Calendar, MapPin, ArrowRight, X, User, Truck, Camera, Video, Share2, AlertCircle } from 'lucide-react';
import { db } from '../lib/db';
import { collection, query, where, orderBy, onSnapshot } from '@/src/lib/supabase-adapter';
import { NewsArticle } from '../types';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { LoadingSpinner, Skeleton } from '../components/Loading';

import { useNavigate, Link } from 'react-router-dom';

import DynamicBanner from '../components/DynamicBanner';

export default function News() {
  const [news, setNews] = React.useState<NewsArticle[]>([]);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    const q = query(
      collection(db, 'news'),
      where('status', '==', 'Publish Otomatis'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNews(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        reportId: doc.data().report_id,
        isAIGenerated: doc.data().is_ai_generated || doc.data().isAIGenerated,
        personnelCount: doc.data().personnel_count || doc.data().personnelCount,
        unitsUsed: doc.data().units_used || doc.data().unitsUsed,
        imageUrl: doc.data().image_url || doc.data().imageUrl
      } as NewsArticle)));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching news:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="pb-20">
      <DynamicBanner 
        pageId="news"
        defaultTitle="WARTA PUBLIK"
        defaultSubtitle="Informasi resmi, transparan, dan akurat mengenai penanganan darurat dan kegiatan BPBD Kabupaten Malinau."
        defaultImage="https://images.unsplash.com/photo-1544265734-7db3df75765d?auto=format&fit=crop&q=80"
      />
      
      <div className="max-w-7xl mx-auto px-6 sm:px-10 -mt-20 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-20 bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-slate-900">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
               <span className="w-12 h-0.5 bg-brand-red"></span>
               <span className="text-[10px] font-bold text-brand-red uppercase tracking-[0.4em]">Media Center Damkar Malinau</span>
            </div>
            <h2 className="text-4xl sm:text-7xl font-display font-black text-brand-dark uppercase tracking-tighter leading-[0.85] italic">
               INFORMASI <span className="text-brand-red">TERINTEGRASI.</span>
            </h2>
          </div>
          <div className="flex flex-col items-start lg:items-end gap-3 bg-brand-dark p-8 rounded-3xl text-white">
             <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">Total PublikASI</div>
             <div className="text-6xl font-display font-black leading-none text-brand-red">{news.length}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-[2.5rem] p-4 border border-slate-50">
              <Skeleton className="aspect-[4/3] rounded-[2rem] mb-8" />
              <div className="px-4 space-y-4">
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          ))
        ) : news.map((item, i) => (
          <motion.div 
            key={item.id} 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="group cursor-pointer flex flex-col h-full bg-white rounded-[2.5rem] p-4 border border-slate-50 hover:border-slate-100 hover:shadow-2xl transition-all"
            onClick={() => navigate(`/news/${item.id}`)}
          >
            <div className="aspect-[4/3] relative rounded-[2rem] overflow-hidden mb-8">
              <img 
                src={item.imageUrl || item.photos?.[0] || 'https://images.unsplash.com/photo-1544265734-7db3df75765d?auto=format&fit=crop&q=80'} 
                className="w-full h-full object-cover grayscale-0 group-hover:scale-110 transition-all duration-1000"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="absolute top-6 left-6 flex gap-2">
                <div className="bg-brand-red text-[8px] font-black text-white px-4 py-2 rounded-full tracking-[0.2em] uppercase shadow-xl transform -translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                  {item.isAIGenerated ? 'LIPUTAN AI' : 'RESMI'}
                </div>
              </div>
            </div>
            
            <div className="px-4 pb-4 flex flex-col flex-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-brand-red uppercase tracking-widest italic">
                  <MapPin className="w-3.5 h-3.5" />
                  {item.location || 'Malinau'}
                </div>
              </div>

              <h3 className="text-2xl font-display font-black text-slate-900 group-hover:text-brand-red transition-colors leading-[1.1] mb-5 uppercase tracking-tighter italic">
                {item.title}
              </h3>
              
              <p className="text-sm font-medium text-slate-500 line-clamp-3 mb-8 leading-relaxed italic">
                {item.summary || (item.content ? (item.content.length > 150 ? item.content.substring(0, 150) + '...' : item.content) : 'Selengkapnya...')}
              </p>

              <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-3">
                   Baca Selengkapnya
                   <ArrowRight className="w-4 h-4 text-brand-red group-hover:translate-x-2 transition-transform" />
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {news.length === 0 && (
        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           className="text-center py-40 bg-white rounded-[3rem] border-2 border-dashed border-slate-100"
        >
          <Newspaper className="w-16 h-16 text-slate-200 mx-auto mb-6" />
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">BELUM ADA WARTA TERPUBLIKASI</p>
        </motion.div>
      )}
    </div>
  );
}
