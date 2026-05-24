import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { NewsArticle } from '../types';
import { Calendar, MapPin, User, Truck, ArrowLeft, Share2, AlertCircle, Newspaper, Bookmark, X, Maximize2, Image as ImageIcon, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { LoadingSpinner } from '../components/Loading';

export default function NewsDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArticle() {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('news')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
          setArticle({
            ...data,
            reportId: data.report_id,
            isAIGenerated: data.is_ai_generated,
            personnelCount: data.personnel_count,
            unitsUsed: data.units_used,
            imageUrl: data.image_url
          } as NewsArticle);
        }
      } catch (error) {
        console.error("Error fetching article:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchArticle();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return <LoadingSpinner fullPage message="Membuka Arsip Warta..." />;
  }

  if (!article) {
    return (
      <div className="pt-48 pb-20 min-h-screen container mx-auto px-6 text-center">
        <h1 className="text-4xl font-display font-black text-slate-900 mb-6">BERITA TIDAK DITEMUKAN</h1>
        <button onClick={() => navigate('/news')} className="bg-brand-red text-white px-8 py-3 rounded-xl font-bold">
          Kembali ke Berita
        </button>
      </div>
    );
  }

  return (
    <div className="pt-48 pb-24 bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-6 sm:px-10">
        {/* Navigation Breadcrumb */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-12 flex items-center gap-6"
        >
          <button 
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:text-brand-red hover:border-brand-red transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <Link to="/news" className="hover:text-brand-red">Warta Publik</Link>
            <span>/</span>
            <span className="text-slate-900">Liputan Terkini</span>
          </div>
        </motion.div>

        {/* Article Header */}
        <header className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-brand-red/5 px-4 py-2 rounded-lg border border-brand-red/10">
              <span className="text-[10px] font-black text-brand-red uppercase tracking-widest italic">
                {article.isAIGenerated ? 'LIPUTAN AI GENERATED' : 'RILIS RESMI'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
              <Calendar className="w-4 h-4" />
              {new Date(article.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-7xl font-display font-black text-slate-900 uppercase tracking-tighter italic leading-[0.85] mb-12"
          >
            {article.title}
          </motion.h1>

          <div className="flex flex-wrap gap-8 items-center border-y border-slate-50 py-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                <MapPin className="w-4 h-4 text-brand-red" />
              </div>
              <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Lokasi</p>
                <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{article.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                <User className="w-4 h-4 text-brand-red" />
              </div>
              <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Personel</p>
                <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{article.personnelCount} Anggota</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                <Truck className="w-4 h-4 text-brand-red" />
              </div>
              <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Armada</p>
                <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{article.unitsUsed?.length || 1} Unit</p>
              </div>
            </div>
            <div className="ml-auto flex gap-3">
              <button className="w-10 h-10 rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-brand-red transition-all">
                <Share2 className="w-4 h-4" />
              </button>
              <button className="w-10 h-10 rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-brand-red transition-all">
                <Bookmark className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {(article.imageUrl || (article.photos && article.photos.length > 0)) && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setSelectedPhoto(article.imageUrl || article.photos[0])}
            className="mb-20 rounded-[3rem] overflow-hidden shadow-2xl relative group cursor-pointer"
          >
            <img src={article.imageUrl || article.photos[0]} className="w-full h-auto aspect-video object-cover" alt="Main" />
            <div className="absolute inset-0 bg-brand-red/10 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
               <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl scale-50 group-hover:scale-100 transition-all duration-500">
                  <Maximize2 className="w-8 h-8 text-brand-red" />
               </div>
            </div>
            <div className="absolute bottom-10 left-10 text-white z-10 hidden sm:block">
               <p className="text-[8px] font-bold uppercase tracking-[0.4em] opacity-60 mb-2">Dokumentasi Lapangan</p>
               <p className="text-sm font-display font-black italic uppercase tracking-tighter">Unit Reaksi Cepat Damkar Malinau</p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60" />
          </motion.div>
        )}

        {/* Article Body */}
        <div className="grid lg:grid-cols-12 gap-20">
          <div className="lg:col-span-8 prose prose-xl prose-slate max-w-none prose-headings:font-display prose-headings:font-black prose-headings:uppercase prose-headings:italic prose-headings:tracking-tighter font-medium text-slate-700 leading-relaxed italic">
            {article.summary && (
              <div className="p-10 bg-slate-50 rounded-[2.5rem] border-l-[8px] border-brand-red mb-16 font-display font-black text-3xl text-slate-900 italic tracking-tight shadow-inner">
                {article.summary}
              </div>
            )}
            <div className="news-content">
              <Markdown>{article.content || ''}</Markdown>
            </div>

            {/* Photo Gallery Grid */}
            {article.photos && article.photos.length > 1 && (
              <div className="grid grid-cols-2 gap-6 mt-20 not-prose">
                {article.photos.slice(1).map((photo, i) => (
                  <div 
                    key={i} 
                    onClick={() => setSelectedPhoto(photo)}
                    className="group cursor-pointer rounded-3xl overflow-hidden aspect-[4/3] shadow-lg border border-slate-50 relative"
                  >
                    <img src={photo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={`img-${i}`} />
                    <div className="absolute inset-0 bg-brand-red/10 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                       <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-xl scale-50 group-hover:scale-100 transition-all">
                          <Maximize2 className="w-4 h-4 text-brand-red" />
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-12">
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-3">
                <AlertCircle className="w-3 h-3 text-brand-red" /> Informasi Penting
              </h4>
              <p className="text-xs font-bold text-slate-600 leading-relaxed mb-8 italic">
                Laporan ini merupakan rilis resmi dari Media Center Damkar Malinau berdasarkan data operasional di lapangan.
              </p>
              <div className="space-y-4">
                 <div className="p-5 bg-white rounded-2xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:border-brand-red transition-all">
                    <span className="text-[10px] font-black uppercase italic tracking-tighter">Status Penanganan</span>
                    <span className="text-[8px] bg-green-50 text-green-600 px-3 py-1 rounded-full font-bold">SELESAI</span>
                 </div>
                 <div className="p-5 bg-white rounded-2xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:border-brand-red transition-all">
                    <span className="text-[10px] font-black uppercase italic tracking-tighter">Sertifikasi Data</span>
                    <span className="text-[8px] bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold">VERIFIED</span>
                 </div>
              </div>
            </div>

            <div className="bg-slate-950 p-10 rounded-[3rem] text-white overflow-hidden relative group">
              <div className="relative z-10">
                <Newspaper className="w-10 h-10 text-brand-red mb-8 opacity-50" />
                <h4 className="text-xl font-display font-black italic uppercase tracking-tighter leading-none mb-4">Butuh Akses <br /> Data Publik?</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-8 italic">Pusat Layanan Informasi Publik (PPID)</p>
                <button className="w-full py-4 bg-brand-red text-white rounded-xl font-black italic text-xs uppercase tracking-tighter hover:scale-105 transition-all shadow-xl shadow-red-900/40">
                  Ajukan Permohonan
                </button>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/10 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2" />
            </div>
          </aside>
        </div>

        {/* Footer Navigation */}
        <div className="mt-32 pt-16 border-t border-slate-100 flex justify-between items-center">
          <Link to="/news" className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-brand-red transition-all">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Warta
          </Link>
          <div className="flex gap-4">
             <div className="w-2 h-2 rounded-full bg-brand-red" />
             <div className="w-2 h-2 rounded-full bg-slate-100" />
             <div className="w-2 h-2 rounded-full bg-slate-100" />
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
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
              onClick={() => setSelectedPhoto(null)} 
              className="absolute inset-0 bg-brand-dark/95 backdrop-blur-2xl" 
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-7xl bg-white rounded-[3.5rem] border-8 border-slate-900 shadow-2xl overflow-hidden flex flex-col lg:flex-row max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-6 right-6 z-20 w-12 h-12 bg-white rounded-2xl border-4 border-slate-900 flex items-center justify-center hover:bg-brand-red hover:text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="lg:w-2/3 bg-slate-900 relative group flex items-center justify-center p-4 lg:p-0">
                <img 
                  src={selectedPhoto} 
                  alt={article.title}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="lg:w-1/3 p-10 sm:p-12 overflow-y-auto bg-white">
                <div className="flex items-center gap-3 mb-8">
                  <span className="bg-brand-red text-white text-[10px] font-black uppercase px-6 py-2.5 rounded-full shadow-red-200 tracking-widest">DOKUMENTASI WARTA</span>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">{new Date(article.date).toLocaleDateString('id-ID', { dateStyle: 'full' })}</span>
                </div>

                <h2 className="text-3xl font-display font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-8">{article.title}</h2>
                
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-slate-400">
                      <Info className="w-5 h-5 text-brand-red" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Konteks Laporan</span>
                    </div>
                    <p className="text-slate-600 font-medium italic text-lg leading-relaxed border-l-8 border-slate-100 pl-8">
                      {article.summary || article.title}
                    </p>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100">
                    <div className="flex items-center gap-4 text-slate-400 mb-4">
                      <MapPin className="w-5 h-5 text-brand-red" />
                      <span className="text-sm font-black uppercase italic tracking-tight text-slate-900">{article.location}</span>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">
                       DATA DOKUMENTASI TERVERIFIKASI UNIT MEDIA CENTER PEMADAM KEBAKARAN MALINAU
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
