import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, X, MapPin, Calendar, Info, Maximize2, Download } from 'lucide-react';
import DynamicBanner from '../components/DynamicBanner';
import { cn } from '../lib/utils';

interface GalleryItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  description?: string;
  createdAt: number;
}

export default function Documentation() {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [filter, setFilter] = useState('SEMUA');

  useEffect(() => {
    const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setGallery(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryItem)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const categories = ['SEMUA', 'OPERASIONAL', 'KEGIATAN', 'PELATIHAN', 'ALUTSISTA'];
  const filteredGallery = filter === 'SEMUA' ? gallery : gallery.filter(item => item.category === filter);

  return (
    <div className="pb-32 min-h-screen bg-slate-50">
      <DynamicBanner 
        pageId="documentation"
        defaultTitle="DOKUMENTASI KAMI"
        defaultSubtitle="Rekam jejak operasional, pelatihan, dan kegiatan sosial kami dalam menjaga keselamatan Kabupaten Malinau."
        defaultImage="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=2069"
      />

      <div className="max-w-7xl mx-auto px-6 sm:px-10 -mt-20 relative z-20">
        {/* Category Filters */}
        <div className="bg-white p-8 sm:p-10 rounded-[3rem] shadow-3xl border-8 border-slate-900 mb-20 overflow-x-auto">
          <div className="flex items-center gap-4 min-w-max">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={cn(
                  "px-8 py-4 rounded-2xl font-display font-black italic uppercase tracking-tighter text-sm transition-all",
                  filter === cat 
                    ? "bg-brand-red text-white shadow-xl shadow-red-200 scale-105" 
                    : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-square bg-white rounded-[2.5rem] border-4 border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : filteredGallery.length === 0 ? (
          <div className="py-40 text-center bg-white rounded-[3.5rem] border-8 border-slate-900 shadow-2xl">
            <ImageIcon className="w-16 h-16 text-slate-200 mx-auto mb-6" />
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Belum ada dokumentasi di kategori ini</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {filteredGallery.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedImage(item)}
                className="group cursor-pointer bg-white p-6 rounded-[3rem] border-4 border-slate-100 hover:border-brand-red hover:shadow-2xl transition-all"
              >
                <div className="aspect-square relative overflow-hidden rounded-[2rem] bg-slate-100 mb-6">
                  <img 
                    src={item.imageUrl} 
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-brand-red/0 group-hover:bg-brand-red/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl scale-50 group-hover:scale-100 transition-all duration-500">
                      <Maximize2 className="w-8 h-8 text-brand-red" />
                    </div>
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-brand-red text-white text-[8px] font-black uppercase px-4 py-2 rounded-full shadow-lg tracking-widest">{item.category}</span>
                  </div>
                </div>
                <h3 className="text-xl font-display font-black text-slate-900 uppercase italic tracking-tighter leading-tight line-clamp-2">{item.title}</h3>
                <p className="mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(item.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox / Fullscreen View */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10"
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)} 
              className="absolute inset-0 bg-brand-dark/95 backdrop-blur-2xl px-10 py-5" 
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-7xl bg-white rounded-[3.5rem] border-8 border-slate-900 shadow-2xl overflow-hidden flex flex-col lg:flex-row max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-6 right-6 z-20 w-12 h-12 bg-white rounded-2xl border-4 border-slate-900 flex items-center justify-center hover:bg-brand-red hover:text-white transition-all hover:scale-110 active:scale-95"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="lg:w-3/5 bg-slate-900 relative group flex items-center justify-center p-8 lg:p-0 overflow-hidden">
                <img 
                  src={selectedImage.imageUrl} 
                  alt={selectedImage.title}
                  className="w-full h-full object-contain"
                />
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a 
                    href={selectedImage.imageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-brand-red transition-all flex items-center gap-3"
                  >
                    Buka Original <ImageIcon className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="lg:w-2/5 p-10 sm:p-16 overflow-y-auto bg-white">
                <div className="flex items-center gap-3 mb-8">
                  <span className="bg-brand-red text-white text-[10px] font-black uppercase px-6 py-2.5 rounded-full shadow-red-200 tracking-widest">{selectedImage.category}</span>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{new Date(selectedImage.createdAt).toLocaleDateString('id-ID', { dateStyle: 'full' })}</span>
                </div>

                <h2 className="text-4xl font-display font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-8">{selectedImage.title}</h2>
                
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-slate-400">
                      <Info className="w-5 h-5 text-brand-red" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Detail Dokumentasi</span>
                    </div>
                    {selectedImage.description ? (
                      <p className="text-slate-600 font-medium italic text-lg leading-relaxed border-l-8 border-slate-100 pl-8">
                        {selectedImage.description}
                      </p>
                    ) : (
                      <p className="text-slate-400 font-medium italic text-lg leading-relaxed border-l-8 border-slate-50 pl-8">
                        Dokumentasi visual kegiatan unit Pemadam Kebakaran Malinau tanpa deskripsi tambahan.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Unit Otoritas</p>
                      <p className="text-sm font-black uppercase italic tracking-tight text-slate-900 leading-none">DAMKAR MALINAU</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 text-center">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Media</p>
                       <p className="text-sm font-black uppercase italic tracking-tight text-brand-red leading-none">TERVERIFIKASI</p>
                    </div>
                  </div>

                  <div className="pt-10 border-t border-slate-100">
                     <p className="text-[9px] font-bold text-slate-400 italic leading-relaxed">
                        Data dokumentasi ini merupakan arsip resmi Media Center Damkar Malinau untuk keperluan publikasi dan transparansi operasional.
                     </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
