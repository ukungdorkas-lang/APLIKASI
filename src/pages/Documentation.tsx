import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Image as ImageIcon, X, MapPin, Calendar, Info, Maximize2, Download,
  Shield, AlertTriangle, Users, Clock, Heart
} from 'lucide-react';
import DynamicBanner from '../components/DynamicBanner';
import { cn } from '../lib/utils';

interface GalleryItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  description?: string;
  createdAt: number;
  source?: "manual" | "report";
  reportData?: any;
  type?: string;
}

export default function Documentation() {
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<any | null>(null);
  const [filter, setFilter] = useState('SEMUA');

  useEffect(() => {
    // 1. Subscribe to manual gallery collection
    const qGallery = query(
      collection(db, 'gallery'),
      orderBy('created_at', 'desc')
    );

    const unsubGallery = onSnapshot(qGallery, (snapshot) => {
      setGalleryItems(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        imageUrl: doc.data().url || doc.data().imageUrl,
        category: doc.data().type || doc.data().category || "OPERASIONAL",
        createdAt: doc.data().created_at || doc.data().createdAt || Date.now(),
        source: 'manual' as const,
        type: 'GALLERY' as const
      })));
    }, (error) => {
      console.error("Error fetching gallery:", error);
    });

    // 2. Subscribe to reports collection (citizen reports)
    const qReports = query(
      collection(db, 'reports'),
      orderBy('created_at', 'desc')
    );

    const unsubReports = onSnapshot(qReports, (snapshot) => {
      setReports(snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          createdAt: d.createdAt || d.created_at || Date.now(),
          reporterName: d.reporterName || d.reporter_name,
          phoneNumber: d.phoneNumber || d.phone_number,
          mediaUrl: d.mediaUrl || d.media_url,
          reportNumber: d.reportNumber || d.report_number,
          officerNotes: d.officerNotes || d.officer_notes,
        };
      }));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching reports:", error);
      setLoading(false);
    });

    return () => {
      unsubGallery();
      unsubReports();
    };
  }, []);

  // Sync / combine data exactly as done in AdminDashboard.tsx
  const combinedGallery = React.useMemo(() => {
    const manualGallery = galleryItems.map((item) => ({
      ...item,
      source: "manual" as const,
      type: "GALLERY" as const,
    }));

    const reportDocumentation = reports.flatMap((r) => {
      const allPhotos: string[] = [];
      if (r.photos && Array.isArray(r.photos)) {
        allPhotos.push(...r.photos);
      }
      if (
        r.documentation &&
        r.documentation.photos &&
        Array.isArray(r.documentation.photos)
      ) {
        allPhotos.push(...r.documentation.photos);
      }

      return allPhotos.map((photoUrl, index) => ({
        id: `report-${r.id}-p${index}`,
        title: `${r.type} - ${r.location?.address || "Malinau"}`,
        category: "OPERASIONAL",
        imageUrl: photoUrl,
        description: r.documentation?.chronology || r.description || "Laporan kejadian dari warga.",
        createdAt: r.createdAt || r.created_at || Date.now(),
        source: "report" as const,
        reportData: r,
        type: "REPORT_DOC" as const,
      }));
    });

    return [...manualGallery, ...reportDocumentation].sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );
  }, [galleryItems, reports]);

  const categories = ['SEMUA', 'OPERASIONAL', 'KEGIATAN', 'PELATIHAN', 'ALUTSISTA'];
  const filteredGallery = filter === 'SEMUA' ? combinedGallery : combinedGallery.filter(item => item.category === filter);

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

                  {/* Citizen Report Dossier / Detail Keterangan */}
                  {selectedImage.source === 'report' && selectedImage.reportData && (() => {
                    const r = selectedImage.reportData;
                    return (
                      <div className="mt-6 border-t-4 border-dashed border-slate-100 pt-6 space-y-6">
                        <div className="flex items-center gap-3 text-slate-400">
                          <Shield className="w-5 h-5 text-brand-red" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Informasi Laporan Warga</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-600">
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <span className="text-[9px] text-slate-400 block uppercase tracking-wider mb-1">No. Register Laporan</span>
                            <span className="font-mono text-slate-950 font-black">{r.reportNumber || r.id?.substring(0, 8).toUpperCase() || '-'}</span>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <span className="text-[9px] text-slate-400 block uppercase tracking-wider mb-1">Jenis Kejadian</span>
                            <span className="text-slate-950 font-black uppercase italic">{r.type || '-'}</span>
                          </div>
                        </div>

                        {r.location?.address && (
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                            <span className="text-[9px] text-slate-400 block uppercase tracking-wider mb-1">Lokasi TKP</span>
                            <p className="font-semibold text-slate-800 flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-brand-red flex-shrink-0" />
                              {r.location.address}
                            </p>
                          </div>
                        )}

                        <div className="bg-red-50/50 p-6 rounded-3xl border-2 border-red-100/40 text-xs space-y-4">
                          <div className="flex items-center gap-2 border-b border-red-100 pb-2">
                            <AlertTriangle className="w-4 h-4 text-brand-red" />
                            <span className="font-black text-brand-red uppercase tracking-wider text-[10px]">Arsip Penanganan Petugas</span>
                          </div>
                          
                          {r.description && (
                            <div>
                              <span className="text-[9px] text-red-400 font-extrabold uppercase tracking-wider block">Lapor Kejadian:</span>
                              <p className="text-slate-700 font-medium italic mt-1 pl-3 border-l-2 border-red-200">
                                "{r.description}"
                              </p>
                            </div>
                          )}

                          {r.documentation ? (
                            <div className="grid grid-cols-2 gap-3 pt-2 text-[11px]">
                              {r.documentation.personnel && (
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-slate-500" />
                                  <span><strong>{r.documentation.personnel}</strong> Personil</span>
                                </div>
                              )}
                              {r.documentation.duration && (
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-slate-500" />
                                  <span><strong>{r.documentation.duration}</strong> Operasi</span>
                                </div>
                              )}
                              {r.documentation.victims && (
                                <div className="col-span-2 flex items-center gap-2">
                                  <Heart className="w-4 h-4 text-slate-500" />
                                  <span>Korban: <strong>{r.documentation.victims}</strong></span>
                                </div>
                              )}
                              {r.documentation.actions && (
                                <div className="col-span-2 mt-2 pt-2 border-t border-slate-100">
                                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Tindakan Lapangan:</span>
                                  <p className="text-slate-700 font-semibold">{r.documentation.actions}</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-500 italic">
                              Status Laporan: <strong className="text-brand-red uppercase">{r.status}</strong>. Ditangani oleh personil piket siaga regu Damkar Malinau.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

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
