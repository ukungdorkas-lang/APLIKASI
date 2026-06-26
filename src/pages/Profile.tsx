import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { ProfileSection } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Info, ArrowRight, ShieldAlert, Target, Users, MapPin, ChevronRight, History } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '../lib/utils';
import { LoadingSpinner } from '../components/Loading';

import DynamicBanner from '../components/DynamicBanner';
import StrukturOrganisasi from '../components/StrukturOrganisasi';

export default function Profile() {
  const { slug } = useParams<{ slug?: string }>();
  const [sections, setSections] = React.useState<ProfileSection[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeSection, setActiveSection] = React.useState<ProfileSection | null>(null);

  const [fullScreen, setFullScreen] = React.useState(false);

  React.useEffect(() => {
    const unsub = onSnapshot(collection(db, 'profile_sections'), (snapshot) => {
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProfileSection))
        .filter(s => s.isActive)
        .sort((a, b) => a.order - b.order);
        
      data.push({
        id: 'struktur-organisasi',
        title: 'Struktur Organisasi',
        slug: 'struktur-organisasi',
        isActive: true,
        order: 999,
        content: 'struktur-organisasi-component',
        createdAt: 0,
        updatedAt: 0
      } as ProfileSection);

      setSections(data);
      
      if (slug) {
        const found = data.find(s => s.slug === slug);
        setActiveSection(found || data[0] || null);
      } else {
        setActiveSection(data[0] || null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Profile onSnapshot error:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [slug]);

  if (loading) {
    return <LoadingSpinner fullPage message="Membuka Profil Instansi..." />;
  }

  if (sections.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-10 text-center">
        <ShieldAlert className="w-20 h-20 text-slate-200 mb-6" />
        <h2 className="text-4xl font-display font-black text-slate-900 uppercase italic tracking-tighter mb-4">Profil Belum Tersedia</h2>
        <p className="text-slate-500 font-medium mb-10 max-w-md">Informasi profil instansi sedang dalam tahap pemutakhiran data oleh admin.</p>
        <Link to="/" className="bg-brand-red text-white font-black px-10 py-4 rounded-xl shadow-xl uppercase italic tracking-tighter hover:scale-105 transition-all">Kembali ke Beranda</Link>
      </div>
    );
  }

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'History': return <History className="w-6 h-6" />;
      case 'Target': return <Target className="w-6 h-6" />;
      case 'Users': return <Users className="w-6 h-6" />;
      case 'MapPin': return <MapPin className="w-6 h-6" />;
      default: return <Info className="w-6 h-6" />;
    }
  };

  return (
    <div className="pb-40 min-h-screen bg-[#f8fafc]">
      <DynamicBanner 
        pageId="profile"
        defaultTitle="PROFIL INSTANSI"
        defaultSubtitle="Mengenal lebih dekat Satuan Polisi Pamong Praja dan Pemadam Kebakaran Kabupaten Malinau."
        defaultImage="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=2069"
      />
      
      <div className="max-w-7xl mx-auto px-6 sm:px-10 -mt-20 relative z-10">
        <div className="grid lg:grid-cols-12 gap-16">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-4 space-y-10">
            <div className="bg-brand-dark p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/10 blur-[60px] rounded-full" />
               <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Navigasi Profil</h3>
               <div className="space-y-2">
                 {sections.map(section => (
                   <Link 
                     key={section.id}
                     to={`/profile/${section.slug}`}
                     className={cn(
                       "flex items-center justify-between p-5 rounded-2xl transition-all group/item",
                       activeSection?.id === section.id 
                         ? "bg-brand-red text-white shadow-xl shadow-red-900/40 translate-x-2" 
                         : "hover:bg-white/5 text-slate-400 hover:text-white"
                     )}
                   >
                     <div className="flex items-center gap-4">
                       <div className={cn(
                         "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                         activeSection?.id === section.id ? "bg-white/20" : "bg-white/5"
                       )}>
                         {getIcon(section.icon)}
                       </div>
                       <span className="font-display font-black uppercase italic tracking-tighter text-lg">{section.title}</span>
                     </div>
                     <ChevronRight className={cn(
                       "w-5 h-5 transition-transform",
                       activeSection?.id === section.id ? "rotate-90 opacity-100" : "opacity-0 group-hover/item:opacity-40"
                     )} />
                   </Link>
                 ))}
               </div>
            </div>

            <div className="p-10 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
               <h4 className="text-xl font-display font-black text-slate-900 uppercase italic tracking-tighter mb-8">Pusat Layanan</h4>
               <div className="space-y-6">
                  <a href="tel:112" className="flex items-center gap-5 p-5 bg-slate-50 rounded-2xl hover:bg-brand-red hover:text-white transition-all group">
                     <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Phone className="w-6 h-6 text-brand-red" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white/60">Emergency Call</p>
                        <p className="text-xl font-display font-black italic tracking-tight">112</p>
                     </div>
                  </a>
                  <div className="p-5 bg-slate-50 rounded-2xl">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Alamat Kantor</p>
                     <p className="text-sm font-bold text-slate-600 leading-relaxed italic">Jl. Raja Alam, RT. 06, Malinau Kota, Kab. Malinau - Kalimantan Utara</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection?.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-[4rem] p-12 sm:p-20 shadow-2xl border border-slate-50 relative overflow-hidden group/card"
              >
                {activeSection?.imageUrl && (
                  <div 
                    onClick={() => setFullScreen(true)}
                    className="aspect-[21/9] rounded-[2.5rem] overflow-hidden mb-16 border-4 border-slate-100 relative group cursor-zoom-in"
                  >
                    <img src={activeSection.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s]" alt={activeSection.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-brand-dark/20 backdrop-blur-[2px]">
                       <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl scale-50 group-hover:scale-100 transition-transform">
                          <Maximize2 className="w-8 h-8 text-brand-dark" />
                       </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 mb-8">
                   <div className="w-16 h-1 bg-brand-red rounded-full" />
                   <span className="text-[10px] font-black text-brand-red uppercase tracking-[0.4em]">Profil Resmi Damkar</span>
                </div>

                <h1 className="text-6xl sm:text-8xl font-display font-black text-slate-900 uppercase italic tracking-tighter leading-[0.8] mb-16">
                  {activeSection?.title.split(' ').map((word, i) => (
                    <span key={i} className={i % 2 !== 0 ? 'text-brand-red' : ''}>
                      {word}{' '}
                    </span>
                  ))}
                </h1>

                {activeSection?.content === 'struktur-organisasi-component' ? (
                  <div className="mb-10 w-full overflow-x-auto" onClick={(e) => e.stopPropagation()}>
                     <StrukturOrganisasi />
                  </div>
                ) : (
                  <div 
                    onClick={() => setFullScreen(true)}
                    className="prose prose-xl prose-slate max-w-none prose-headings:font-display prose-headings:font-black prose-headings:uppercase prose-headings:italic prose-headings:tracking-tighter font-medium text-slate-600 leading-relaxed italic border-l-8 border-brand-red pl-10 mb-10 cursor-zoom-in hover:bg-slate-50 p-6 rounded-2xl transition-colors"
                  >
                    <Markdown>{activeSection?.content}</Markdown>
                  </div>
                )}

                <div className="mt-24 pt-16 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-10">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-brand-dark rounded-xl flex items-center justify-center"><ShieldAlert className="text-white w-6 h-6" /></div>
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Update Terakhir</p>
                         <p className="text-sm font-bold text-slate-900 italic">{new Date(activeSection?.updatedAt || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <button className="p-4 bg-slate-50 rounded-xl text-slate-400 hover:text-brand-red transition-all shadow-sm"><Share2 className="w-6 h-6" /></button>
                      <button onClick={() => window.print()} className="p-4 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm">Cetak Dokumen</button>
                   </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* FULLSCREEN MODAL */}
      <AnimatePresence>
        {fullScreen && activeSection && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-20"
          >
            <div onClick={() => setFullScreen(false)} className="absolute inset-0 bg-brand-dark/95 backdrop-blur-xl" />
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-6xl rounded-[4rem] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-slate-900 p-8 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-brand-red rounded-xl flex items-center justify-center shadow-lg"><Info className="w-6 h-6" /></div>
                   <h3 className="text-2xl font-black italic uppercase tracking-tighter">Detail Profil Pelayanan</h3>
                </div>
                <button onClick={() => setFullScreen(false)} className="w-12 h-12 bg-white/10 hover:bg-brand-red rounded-xl transition-all flex items-center justify-center group">
                  <X className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </button>
              </div>
              <div className="p-10 sm:p-20 overflow-y-auto custom-scrollbar flex-1">
                {activeSection.imageUrl && (
                  <div className="aspect-video rounded-[3rem] overflow-hidden mb-16 shadow-2xl border-8 border-slate-50">
                    <img src={activeSection.imageUrl} className="w-full h-full object-cover" alt={activeSection.title} />
                  </div>
                )}
                <h2 className="text-5xl sm:text-7xl font-display font-black text-slate-900 uppercase italic tracking-tighter mb-10 leading-none">
                  {activeSection.title}
                </h2>
                {activeSection.content === 'struktur-organisasi-component' ? (
                   <div className="w-full">
                     <StrukturOrganisasi />
                   </div>
                ) : (
                  <div className="prose prose-2xl prose-slate max-w-none prose-headings:font-display prose-headings:font-black prose-headings:uppercase prose-headings:italic prose-headings:tracking-tighter font-medium text-slate-700 leading-relaxed italic border-l-8 border-brand-red pl-12">
                     <Markdown>{activeSection.content}</Markdown>
                  </div>
                )}
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-center">
                 <button onClick={() => setFullScreen(false)} className="bg-brand-dark text-white px-12 py-5 rounded-2xl font-black italic uppercase tracking-tighter shadow-xl hover:bg-brand-red transition-all">Tutup Jendela Detail</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { Phone, Share2, Maximize2, X } from 'lucide-react';
