import React, { useEffect, useState } from 'react';
import { BookOpen, ShieldCheck, Flame, Droplets, Info, ExternalLink, FileText, Video, Image as ImageIcon, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { X, Download } from 'lucide-react';

import DynamicBanner from '../components/DynamicBanner';

export default function Education() {
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'education'),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setContent(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().created_at || doc.data().createdAt
      })));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching education:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="pb-24">
      <DynamicBanner 
        pageId="documentation"
        defaultTitle="PUSAT EDUKASI"
        defaultSubtitle="Masyarakat yang teredukasi adalah garis pertahanan pertama. Pelajari langkah-langkah dasar untuk perlindungan mandiri."
        defaultImage="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=2069"
      />
      
      <div className="max-w-7xl mx-auto px-6 sm:px-10 -mt-20 relative z-10">
        <div className="mb-24 bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-slate-900">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
             <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-6">
                   <span className="w-12 h-0.5 bg-brand-red"></span>
                   <span className="text-[10px] font-bold text-brand-red uppercase tracking-[0.4em]">Resource Center</span>
                </div>
                <h2 className="text-4xl sm:text-5xl font-display font-black text-slate-900 uppercase tracking-tighter leading-[0.85] italic">
                   INFORMASI <span className="text-brand-red">KESELAMATAN.</span>
                </h2>
             </div>
             <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hidden lg:flex flex-col items-end gap-2 text-slate-400"
             >
                <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                   <div className="w-1/2 h-full bg-brand-red" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Safety Compliance v2.0</span>
             </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {loading ? (
          [1,2,3].map(i => (
            <div key={i} className="bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm animate-pulse">
               <div className="aspect-video bg-slate-100 rounded-2xl mb-8" />
               <div className="h-6 bg-slate-100 rounded-full w-3/4 mb-4" />
               <div className="h-4 bg-slate-100 rounded-full w-full mb-2" />
               <div className="h-4 bg-slate-100 rounded-full w-2/3" />
            </div>
          ))
        ) : content.length === 0 ? (
          <div className="col-span-full py-40 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
             <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-6" />
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Belum Ada Materi Tersedia</p>
          </div>
        ) : content.map((item, idx) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="group h-full bg-white rounded-[2.5rem] p-4 border border-slate-50 hover:border-slate-100 hover:shadow-2xl transition-all flex flex-col"
          >
            <div className="aspect-video relative overflow-hidden rounded-[2rem] bg-slate-100 mb-8">
              {item.imageUrl && item.imageUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                <img 
                  src={item.imageUrl} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale-[0.5] group-hover:grayscale-0" 
                  alt={item.title}
                />
              ) : item.imageUrl && item.imageUrl.match(/\.(mp4|webm)$/i) ? (
                <video 
                  src={item.imageUrl} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale-[0.5] group-hover:grayscale-0"
                  muted 
                  loop 
                  playsInline
                />
              ) : item.imageUrl && !item.imageUrl.match(/\.(jpeg|jpg|gif|png|mp4|webm)$/i) ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50 group-hover:bg-slate-100 transition-colors">
                  <FileText className="w-16 h-16 mb-2" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Dokumen</span>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-200 bg-slate-50">
                  <BookOpen className="w-16 h-16" />
                </div>
              )}
              {item.category && (
                <div className="absolute top-6 left-6">
                   <span className="bg-brand-red text-white text-[8px] font-black uppercase px-5 py-2.5 rounded-full shadow-xl tracking-widest">{item.category}</span>
                </div>
              )}
              {item.imageUrl?.includes('video') && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/20 group-hover:bg-slate-900/40 transition-all">
                   <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 text-white group-hover:scale-110 transition-transform">
                      <Video className="w-8 h-8 ml-1" />
                   </div>
                </div>
              )}
            </div>
            
            <div className="px-6 pb-6 flex-1 flex flex-col">
              <h3 className="text-2xl font-display font-black text-slate-900 uppercase italic tracking-tighter mb-4 group-hover:text-brand-red transition-colors leading-none">{item.title}</h3>
              <p className="text-sm font-medium text-slate-500 mb-10 leading-relaxed italic line-clamp-3">
                {item.content}
              </p>
              
              <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                <button 
                  onClick={() => setSelectedItem(item)}
                  className="flex items-center gap-3 text-[10px] font-black text-slate-900 uppercase tracking-widest hover:text-brand-red transition-all cursor-pointer z-10"
                >
                  LIHAT MATERI <ExternalLink className="w-4 h-4 text-brand-red" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      </div>

      <AnimatePresence>
        {selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/90 backdrop-blur-xl overflow-y-auto"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2rem] sm:rounded-[3rem] w-full max-w-5xl overflow-hidden shadow-2xl my-auto"
            >
              <div className="flex justify-between items-center p-6 sm:px-10 sm:py-8 border-b border-slate-100">
                <h3 className="text-xl sm:text-3xl font-display font-black italic uppercase tracking-tighter text-slate-900">
                  {selectedItem.title}
                </h3>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="p-3 bg-slate-100 rounded-full hover:bg-brand-red hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 sm:p-10">
                {selectedItem.imageUrl && selectedItem.imageUrl.match(/\.(jpeg|jpg|png|gif|webp)$/i) && (
                  <div 
                    className="mb-8 rounded-2xl overflow-hidden bg-slate-50 border-4 border-slate-100 text-center flex justify-center cursor-zoom-in relative group"
                    onClick={() => setFullScreenImage(selectedItem.imageUrl)}
                  >
                    <img 
                      src={selectedItem.imageUrl} 
                      alt={selectedItem.title}
                      className="w-full h-auto object-contain max-h-[60vh] max-w-full transition-transform duration-300 group-hover:scale-[1.02]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="bg-black/50 text-white px-4 py-2 rounded-full font-bold text-sm tracking-wider uppercase backdrop-blur-sm">Lihat Penuh</span>
                    </div>
                  </div>
                )}
                {selectedItem.imageUrl && selectedItem.imageUrl.match(/\.(mp4|webm)$/i) && (
                  <div className="mb-8 rounded-2xl overflow-hidden bg-slate-50 border-4 border-slate-100 text-center flex justify-center">
                    <video 
                      src={selectedItem.imageUrl} 
                      controls
                      className="w-full h-auto object-contain max-h-[60vh] max-w-full"
                    />
                  </div>
                )}
                {selectedItem.imageUrl && !selectedItem.imageUrl.match(/\.(jpeg|jpg|gif|png|mp4|webm)$/i) && (
                   <div className="mb-8 rounded-2xl overflow-hidden bg-slate-50 border-4 border-slate-100 p-10 flex flex-col items-center justify-center text-slate-400">
                     <FileText className="w-16 h-16 mb-4" />
                     <p className="font-bold text-sm uppercase tracking-widest">File Dokumen Tersedia</p>
                   </div>
                )}
                
                <div className="prose prose-slate max-w-none text-slate-600 mb-10 text-base sm:text-lg italic font-medium leading-relaxed">
                  {selectedItem.content}
                </div>
                
                <div className="flex flex-wrap gap-4 items-center pt-8 border-t border-slate-100">
                  {selectedItem.imageUrl && (
                    <a 
                      href={selectedItem.imageUrl}
                      download 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex flex-1 sm:flex-none justify-center items-center gap-3 bg-brand-red text-white px-8 py-4 rounded-xl font-black italic uppercase tracking-widest text-xs hover:bg-brand-dark transition-all"
                    >
                      <Download className="w-4 h-4" /> 
                      {selectedItem.imageUrl.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? 'Unduh Gambar' : 
                       selectedItem.imageUrl.match(/\.(mp4|webm)$/i) ? 'Unduh Video' : 'Unduh Lampiran'}
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {fullScreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setFullScreenImage(null)}
          >
            <button
              onClick={() => setFullScreenImage(null)}
              className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-10 h-10" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={fullScreenImage}
              className="max-w-full max-h-screen object-contain"
              alt="Full Screen"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-32">
         <div className="bg-brand-dark rounded-[4rem] p-12 sm:p-20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-red/10 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3" />
            <div className="relative z-10 grid lg:grid-cols-12 gap-12 items-center">
               <div className="lg:col-span-7">
                  <h3 className="text-4xl sm:text-5xl font-display font-black text-white uppercase italic tracking-tighter leading-none mb-6">Sosialisasi <br /> <span className="text-brand-red">Masyarakat.</span></h3>
                  <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-xl italic">
                    Kami menyediakan layanan edukasi dan simulasi pemadaman kebakaran untuk sekolah, instansi, dan lingkungan publik tanpa biaya.
                  </p>
               </div>
               <div className="lg:col-span-5 flex flex-col sm:items-end gap-6 text-center sm:text-right">
                  <a href="tel:112" className="inline-flex items-center gap-6 bg-brand-red text-white px-10 py-5 rounded-2xl font-display font-black italic text-2xl tracking-tighter hover:scale-105 transition-all shadow-2xl shadow-red-900/40">
                    <Phone className="w-8 h-8" /> CALL 112
                  </a>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Layanan Siap Saji 24/7</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
