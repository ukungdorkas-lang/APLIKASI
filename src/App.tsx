import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import EmergencyForm from './components/EmergencyForm';
import FormLaporan from './components/FormLaporan';
import DashboardStats from './components/DashboardStats';
import ReportList from './components/ReportList';
import { useReports } from './hooks/useReports';
import { supabase } from './lib/supabase';
import { generateNewsFromReport } from './lib/gemini';
import { collection, addDoc, getDoc, getDocs, doc, query, where, orderBy, limit, onSnapshot, updateDoc } from '@/src/lib/supabase-adapter';
import { db, auth } from './lib/db';
import { ShieldAlert, Info, Newspaper, ArrowRight, Flame, Phone, Calendar, MapPin, ExternalLink, Activity, AlertTriangle, Lock } from 'lucide-react';
import { NewsArticle, BannerConfig, AppConfig } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeProvider } from './contexts/ThemeContext';
import { LoadingSpinner, Skeleton } from './components/Loading';
import DynamicBanner from './components/DynamicBanner';
import WeatherWidget from './components/WeatherWidget';
import StatusPoskoTerpadu from './components/StatusPoskoTerpadu';
import { cn } from './lib/utils';

import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import Profile from './pages/Profile';
import StrukturOrganisasiPage from './pages/StrukturOrganisasiPage';
import Education from './pages/Education';
import Documentation from './pages/Documentation';
import Contact from './pages/Contact';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import OperationalDashboard from './pages/OperationalDashboard';
import OperationalForms from './pages/OperationalForms';
import MasterData from './pages/MasterData';
import CheckTicket from './pages/CheckTicket';
import Footer from './components/Footer';
import AiAssistant from './components/AiAssistant';

function Home() {
  const [news, setNews] = React.useState<NewsArticle[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [banner, setBanner] = React.useState<BannerConfig | null>(null);
  const [config, setConfig] = React.useState<AppConfig | null>(null);
  const { reports: emergencyReports } = useReports();
  const recentReports = emergencyReports.slice(0, 3);

  const [opsReports, setOpsReports] = React.useState<any[]>([]);

  React.useEffect(() => {
    const unsubReports = onSnapshot(query(collection(db, 'operational_reports'), orderBy('date', 'desc'), limit(50)), (s: any) => {
      setOpsReports(s.docs.map((d: any) => ({id: d.id, ...d.data()})));
    }, (err: any) => console.warn("unsubReports failed", err));

    const unsubBanner = onSnapshot(doc(db, 'banners', 'home'), (snap: any) => {
      if (snap.exists()) setBanner(snap.data() as BannerConfig);
    }, (err: any) => console.warn("unsubBanner failed", err));

    const unsubConfig = onSnapshot(doc(db, 'settings', 'app'), (snap: any) => {
      if (snap.exists()) setConfig(snap.data() as AppConfig);
    }, (err: any) => console.warn("unsubConfig failed", err));

    const unsubNews = onSnapshot(query(collection(db, 'news'), where('status', '==', 'Publish Otomatis'), orderBy('date', 'desc'), limit(3)), (s: any) => {
      setNews(s.docs.map((d: any) => ({id: d.id, ...d.data()} as NewsArticle)));
      setLoading(false);
    }, (err: any) => console.warn("unsubNews failed", err));

    return () => {
      unsubReports();
      unsubBanner();
      unsubConfig();
      unsubNews();
    };
  }, []);

  const iconMap: Record<string, React.ReactNode> = {
    Flame: <Flame className="w-8 h-8" />,
    ShieldAlert: <ShieldAlert className="w-8 h-8" />,
    Phone: <Phone className="w-8 h-8" />,
    Info: <Info className="w-8 h-8" />,
    Activity: <Activity className="w-8 h-8" />
  };

  const activeActions = config?.homeLayout?.quickActions 
    ? config.homeLayout.quickActions.filter(a => a.enabled) 
    : [
        { title: 'Kebakaran', icon: 'Flame', label: 'TANGGAP API', color: 'bg-red-500' },
        { title: 'Evakuasi', icon: 'ShieldAlert', label: 'EVAKUASI', color: 'bg-orange-500' },
        { title: 'Penyelamatan', icon: 'Phone', label: 'SAR TEAM', color: 'bg-blue-500' },
        { title: 'Perbantuan', icon: 'Info', label: 'SUPPORT', color: 'bg-slate-700' },
      ];

  const counterStats = banner?.stats && banner.stats.length >= 4 ? banner.stats : [
    { label: 'POS WILAYAH', value: '05' },
    { label: 'PERSONEL AKTIF', value: '45' },
    { label: 'ARMADA TAKTIS', value: '12' },
    { label: 'UNIT SIAGA', value: '24h' },
  ];

  return (
    <div 
      className="space-y-32 relative" 
      style={{ 
        backgroundColor: banner?.backgroundColor || 'var(--app-bg)',
        backgroundImage: banner?.backgroundImageUrl ? `url(${banner.backgroundImageUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
       {config?.homeLayout?.showAnnouncement && (
          <div 
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-6"
          >
             <motion.div 
               initial={{ y: 50, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="rounded-2xl py-5 px-8 flex items-center gap-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl border-2 border-white/20 bg-brand-dark/90"
             >
                <div className="bg-brand-red p-2.5 rounded-xl animate-pulse shadow-lg shadow-red-900/40"><AlertTriangle className="w-5 h-5 text-white" /></div>
                <div className="flex-1 overflow-hidden">
                   <p className="text-[10px] font-black italic uppercase tracking-widest text-slate-400 mb-1 leading-none">Pengumuman Penting</p>
                   <p className="text-xs sm:text-sm font-bold text-white leading-tight italic truncate">{config.homeLayout.announcementText}</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-brand-red rounded-lg text-[9px] font-black text-white italic tracking-widest">LIVE</div>
             </motion.div>
          </div>
       )}

      <Hero />
      
      {/* Quick Action Navigation */}
      {(!config?.homeLayout || config.homeLayout.quickActions?.length > 0) && (
        <section className="max-w-7xl mx-auto px-6 sm:px-10 -mt-24 relative z-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10">
            {activeActions.map((action, i) => (
              <Link 
                key={i} 
                to={`/report?type=${action.title}`}
                className="group bg-white rounded-[2rem] p-5 md:p-8 sm:p-10 border border-slate-50 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 flex flex-col items-center text-center overflow-hidden relative"
              >
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6 transition-transform group-hover:scale-110 duration-500", action.color)}>
                   {iconMap[action.icon] || <Info className="w-8 h-8" />}
                </div>
                <h3 className="text-xl sm:text-2xl font-display font-black uppercase italic tracking-tighter text-slate-900 leading-none mb-4">{action.title}</h3>
                <span className="text-[9px] font-black tracking-[0.2em] text-slate-400 group-hover:text-brand-red uppercase">{action.label}</span>
                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 -mr-12 -mt-12 rounded-full group-hover:bg-brand-red/5 transition-colors" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Weather Widget */}
      <WeatherWidget />

      {/* Latest News Section */}
      {(!config?.homeLayout || config.homeLayout.showNewsSection) && (
        <section className="max-w-7xl mx-auto px-6 sm:px-10 mt-16 sm:mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16">
          <div className="max-w-2xl">
             <div className="flex items-center gap-3 mb-6">
                <span className="w-12 h-0.5 bg-brand-red"></span>
                <span className="text-[10px] font-black text-brand-red uppercase tracking-[0.4em]">Media Center Damkar</span>
             </div>
             <h2 className="text-5xl sm:text-7xl font-display font-black text-slate-900 uppercase italic tracking-tighter leading-[0.85]">Liputan <span className="text-brand-red">Publik.</span></h2>
             <p className="mt-8 text-lg font-medium text-slate-500 leading-relaxed italic">
                Transparansi operasional dalam setiap penanganan darurat dan penyelamatan di seluruh wilayah Kabupaten Malinau.
             </p>
          </div>
          <Link to="/news" className="group flex items-center gap-3 text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] hover:text-brand-red transition-all">
             LIHAT SEMUA BERITA <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center group-hover:bg-brand-red group-hover:text-white transition-all"><ArrowRight className="w-4 h-4" /></div>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-[2.5rem] p-6 border border-slate-50">
                <Skeleton className="aspect-video rounded-[2rem] mb-8" />
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))
          ) : news.length === 0 ? (
            <div className="col-span-full py-40 text-center border-2 border-dashed border-slate-200 rounded-[3rem]">
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Belum ada berita dipublikasikan</p>
            </div>
          ) : news.map((item, idx) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-white rounded-[2.5rem] p-4 border border-slate-50 hover:border-slate-100 hover:shadow-2xl transition-all flex flex-col"
            >
              <div className="aspect-video relative overflow-hidden rounded-[2rem] bg-slate-100 mb-8">
                {(item.imageUrl || (item.photos && item.photos[0])) ? (
                  <img src={item.imageUrl || item.photos[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale-[0.2] group-hover:grayscale-0" alt={item.title} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-200">
                    <Newspaper className="w-16 h-16" />
                  </div>
                )}
                <div className="absolute top-6 left-6 flex gap-2">
                   <span className="bg-brand-red text-white text-[8px] font-black uppercase px-5 py-2.5 rounded-full shadow-xl tracking-widest">{item.type || 'OPERASIONAL'}</span>
                </div>
              </div>
              
              <div className="px-6 pb-6 flex-1 flex flex-col">
                <div className="flex items-center gap-4 mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                   <Calendar className="w-4 h-4 text-brand-red" />
                   {new Date(item.date).toLocaleDateString('id-ID')}
                </div>
                <h3 className="text-2xl font-display font-black text-slate-900 uppercase italic tracking-tighter mb-4 group-hover:text-brand-red transition-colors leading-none line-clamp-2">{item.title}</h3>
                <p className="text-sm font-medium text-slate-500 mb-10 leading-relaxed italic line-clamp-3">
                  {item.summary || (item.content ? (item.content.length > 150 ? item.content.substring(0, 150) + '...' : item.content) : 'Selengkapnya...')}
                </p>
                
                <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                  <Link to={`/news/${item.id}`} className="flex items-center gap-3 text-[10px] font-black text-slate-900 uppercase tracking-widest hover:text-brand-red transition-all">
                    BACA SELENGKAPNYA <ExternalLink className="w-4 h-4 text-brand-red" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
      )}

      {/* Status Posko Terpadu */}
      <section className="max-w-7xl mx-auto px-6 sm:px-10 mt-16 sm:mt-24">
        <StatusPoskoTerpadu />
      </section>



      {/* Recent Cases Section */}
      {(!config?.homeLayout || config.homeLayout.showGallerySection) && (
        <section className="bg-white py-32">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20">
            <div className="max-w-2xl">
               <div className="flex items-center gap-3 mb-6">
                  <span className="w-12 h-1 bg-brand-red"></span>
                  <span className="text-[10px] font-black text-brand-red uppercase tracking-[0.4em]">Live Intelligence Unit</span>
               </div>
               <h2 className="text-4xl sm:text-6xl font-display font-black text-slate-900 uppercase italic tracking-tighter leading-[0.85]">Kasus <span className="text-brand-red">Terakhir.</span></h2>
               <p className="mt-8 text-lg font-medium text-slate-500 leading-relaxed italic">
                  Data real-time laporan darurat yang masuk dan sedang dalam penanganan tim operasional di lapangan.
               </p>
            </div>
            <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-3xl border-2 border-slate-100">
               <div className="w-3 h-3 bg-brand-red rounded-full animate-ping" />
               <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Sistem Monitoring Aktif</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentReports.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-200">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Tidak ada laporan terbaru</p>
              </div>
            ) : recentReports.map((report, idx) => (
              <motion.div 
                key={report.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-brand-dark p-6 md:p-10 rounded-[3.5rem] text-white border-4 border-slate-900 shadow-2xl relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-8">
                  <ShieldAlert className="w-10 h-10 text-brand-red opacity-20 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <div className="flex items-center gap-4 mb-10">
                   <div className="px-5 py-2 bg-brand-red/20 border border-brand-red/30 rounded-full text-brand-red text-[10px] font-black uppercase tracking-widest">
                     {report.type}
                   </div>
                   <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                     {new Date(report.createdAt).toLocaleTimeString()}
                   </div>
                </div>

                <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter mb-6 leading-none">Kejadian {report.type}</h3>
                
                <div className="space-y-4 mb-10">
                  <div className="flex items-center gap-3 text-slate-400">
                    <MapPin className="w-5 h-5 text-brand-red shrink-0" />
                    <p className="text-sm font-bold truncate italic">{report.location.address}</p>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <Activity className="w-5 h-5 text-brand-red shrink-0" />
                    <p className="text-sm font-black uppercase italic tracking-widest">{report.status}</p>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5">
                   <p className="text-xs font-medium text-slate-500 line-clamp-2 italic leading-relaxed">
                     {report.description}
                   </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      )}
      <section className="bg-brand-dark py-40 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-16 text-center">
          {counterStats.slice(0, 4).map((stat, i) => (
            <div key={i}>
              <p className="text-6xl sm:text-8xl font-black italic text-brand-red mb-3 tracking-tighter">{stat.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
        <div className="absolute top-1/2 left-0 w-full h-[500px] border-y border-white/5 -rotate-6 transform -translate-y-1/2 pointer-events-none" />
      </section>

      {/* Featured Education Snippet */}
      {(!config?.homeLayout || config.homeLayout.showEducationSection) && (
        <section className="max-w-7xl mx-auto px-6 sm:px-10 py-32 grid lg:grid-cols-12 gap-20 items-center">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-red/5 rounded-full blur-3xl -z-10" />
        
        <div className="lg:col-span-4">
          <h2 className="text-5xl md:text-6xl font-display font-black italic uppercase tracking-tighter mb-8 leading-[0.85]">Kesiapan <br /> <span className="text-brand-red">Warga.</span></h2>
          <p className="text-slate-500 font-bold mb-8 leading-relaxed max-w-xs">
            Kecepatan penanganan dimulai dari ketepatan pelaporan. Lindungi Kabupaten Malinau bersama tim kami.
          </p>
          <Link to="/education" className="emergency-btn inline-flex items-center gap-4 group">
             PANDUAN KESELAMATAN <ArrowRight className="w-6 h-6 group-hover:translate-x-3 transition-transform" />
          </Link>
        </div>

        <div className="lg:col-span-8 grid md:grid-cols-2 gap-8">
          <div className="bg-slate-50 p-6 md:p-10 rounded-[2rem] border-4 border-slate-100 hover:border-brand-red transition-all cursor-pointer group">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-8 group-hover:bg-brand-red group-hover:text-white transition-all transform group-hover:rotate-6">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4 text-brand-dark">Respon Kilat</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Sistem pelaporan real-time yang terhubung langsung ke unit taktis lapangan.</p>
          </div>
          <div className="bg-slate-50 p-6 md:p-10 rounded-[2rem] border-4 border-slate-100 hover:border-brand-red transition-all cursor-pointer group">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-8 group-hover:bg-brand-red group-hover:text-white transition-all transform group-hover:-rotate-6">
              <Newspaper className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4 text-brand-dark">Transparansi</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Berita otomatis hasil penanganan di lapangan untuk informasi publik yang akurat.</p>
          </div>
        </div>
      </section>
      )}
    </div>
  );
}

function Report() {
  return (
    <div className="pb-20">
      <DynamicBanner 
        pageId="report"
        defaultTitle="LAPORAN DARURAT"
        defaultSubtitle="Respon Anda Menentukan Keselamatan Kita Bersama. Laporkan segera setiap kejadian darurat untuk penanganan kilat."
        defaultImage="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=2069"
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-8 -mt-20 relative z-20">
        <div className="bg-white p-6 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-3xl border-8 border-slate-900">
           <FormLaporan />
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { reports, loading, updateStatus } = useReports();

  const handleGenerateNews = async (report: any) => {
    try {
      const news = await generateNewsFromReport(report);
      if (news) {
        // Simpan ke Supabase tabel 'news' via firestore adapter
        try {
          await addDoc(collection(db, 'news'), {
            report_id: report.id,
            title: news.title,
            content: news.content,
            summary: news.summary,
            date: Date.now(),
            location: report.location?.address || 'Malinau',
            status: "Publish Otomatis",
            is_ai_generated: true,
            photos: report.documentation?.photos || [],
            videos: report.documentation?.videos || [],
            personnel_count: news.personnelCount || report.documentation?.personnel || 0,
            units_used: news.unitsUsed || report.documentation?.units || [],
          });
        } catch (e) {
          console.error("Gagal simpan news otomatis:", e);
        }

        try {
          await updateDoc(doc(db, 'reports', report.id), {
             news_generated: true
          });
        } catch (e) {
          console.error("Gagal update report news_generated:", e);
        }

        alert('Berita berhasil digenerate otomatis!');
      }
    } catch (error: any) {
      if (error?.message?.includes("leaked")) {
        alert("Gagal: API Key Anda terdeteksi bocor (Leaked). Harap perbarui di pengaturan Admin.");
      } else if (error?.message?.includes("429") || error?.message?.includes("quota") || error?.message?.includes("RESOURCE_EXHAUSTED")) {
        alert("Gagal: Kuota API Key telah habis (Quota Exceeded). Harap gunakan API Key berbayar atau tunggu beberapa saat.");
      } else {
        alert("Gagal memproses berita AI: " + (error?.message || "Terjadi kesalahan"));
      }
    }
  };

  return (
    <div className="pt-48 pb-20 max-w-7xl mx-auto px-8">
      <div className="flex items-end justify-between mb-16 border-b-[12px] border-brand-dark pb-10">
        <div>
          <h2 className="text-5xl md:text-7xl font-display font-black italic uppercase tracking-tighter text-brand-dark">Dashboard <span className="text-brand-red">Pusat.</span></h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">PUSAT KOMANDO SATUAN TUGAS MALINAU</p>
        </div>
        <div className="hidden lg:flex gap-4">
          <div className="bg-brand-red text-white px-8 py-4 rounded-xl font-black uppercase text-sm tracking-widest shadow-2xl shadow-red-200 animate-pulse">
            SISTEM AKTIF
          </div>
        </div>
      </div>

      <DashboardStats reports={reports} />
      
      <div className="mt-24">
        <h3 className="text-4xl font-display font-black italic uppercase tracking-tighter mb-12 border-l-[12px] border-brand-red pl-8">Antrian Laporan</h3>
        <ReportList 
          reports={reports} 
          onUpdateStatus={updateStatus} 
          onGenerateNews={handleGenerateNews}
        />
      </div>
    </div>
  );
}

// Auth Protection Wrapper
function RequireAuth({ children, role }: { children: React.ReactNode, role?: 'admin' | 'staff' }) {
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    let mounted = true;
    
    const checkAuthStatus = async (session: any) => {
      const u = session?.user;
      if (u) {
        // Special case for root admin
        if (u.email === 'ukungdorkas@gmail.com') {
          if (mounted) {
             setUser(u);
             setLoading(false);
          }
          return;
        }

        // Check in admins collection
        const adminQ = query(collection(db, 'admins'), where('user_id', '==', u.id));
        const adminSnap = await getDocs(adminQ);
        const adminData = !adminSnap.empty ? adminSnap.docs[0].data() : null;
          
        if (adminData) {
          if (adminData.status === 'pending') {
            if (mounted) {
              setError('Akun Anda sedang menunggu verifikasi administrator untuk akses penuh.');
              setLoading(false);
            }
            return;
          }
          if (mounted) {
             setUser(u);
             setLoading(false);
          }
          return;
        }

        // Check in personnel collection
        const persQ = query(collection(db, 'personnel'), where('user_id', '==', u.id));
        const persSnap = await getDocs(persQ);
        const personnelData = !persSnap.empty ? persSnap.docs[0].data() : null;
          
        if (personnelData) {
          if (personnelData.status === 'pending') {
            if (mounted) {
              setError('Akun personil Anda sedang menunggu verifikasi Danru/Admin.');
              setLoading(false);
            }
            return;
          }
          
          if (role === 'admin' && personnelData.role !== 'admin') {
            supabase.auth.signOut();
            navigate('/login');
            return;
          }
          if (mounted) {
            setUser(u);
            setLoading(false);
          }
          return;
        }

        // Neither admin nor personnel
        supabase.auth.signOut();
        navigate('/login');
      } else {
        navigate('/login');
      }
      if (mounted) setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      checkAuthStatus(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        checkAuthStatus(session);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, role]);

  if (loading) return (
    <div key="auth-loading-wrapper" className="min-h-screen bg-brand-dark flex items-center justify-center">
      <LoadingSpinner key="auth-verification-spinner" fullPage message="MEMVERIFIKASI AKSES OTORITAS..." />
    </div>
  );

  if (error) {
    return (
      <div key="auth-error-wrapper" className="min-h-screen bg-brand-dark flex items-center justify-center p-6 text-slate-100">
        <motion.div 
          key="auth-error-box"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-6 lg:p-12 rounded-[3.5rem] border-[12px] border-slate-900 max-w-lg w-full text-center"
        >
          <div className="w-24 h-24 bg-brand-red/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <Lock className="w-10 h-10 text-brand-red animate-pulse" />
          </div>
          <h2 className="text-3xl font-display font-black italic uppercase tracking-tighter text-brand-dark mb-4">Akses Tertunda.</h2>
          <p className="text-slate-500 font-bold leading-relaxed mb-10 italic">
            {error}
          </p>
          <div className="space-y-4">
             <button 
               onClick={() => {
                 supabase.auth.signOut();
                 navigate('/login');
               }}
               className="emergency-btn w-full py-4 uppercase tracking-widest text-sm"
             >
               Kembali ke Login
             </button>
             <Link 
               to="/" 
               className="block text-[10px] font-black text-slate-400 hover:text-brand-red uppercase tracking-[0.2em] transition-all"
             >
               Beranda Publik
             </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return <div id="authenticated-site-root" key="authenticated-content-wrapper" className="min-h-screen">{children}</div>;
}

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-5 md:p-8 text-center">
          <AlertTriangle className="w-20 h-20 text-brand-red mb-8 animate-bounce" />
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4">Terjadi Gangguan Sistem</h1>
          <div className="max-w-xl bg-black/30 border border-white/10 p-6 rounded-2xl mb-8">
            <p className="text-brand-red font-mono text-xs mb-4 text-left">Error: {this.state.error?.message}</p>
            <p className="text-slate-400 font-bold italic text-sm">Maaf, aplikasi mengalami kesalahan teknis. Silakan muat ulang halaman.</p>
          </div>
          <button onClick={() => window.location.reload()} className="emergency-btn">Muat Ulang Halaman</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function AppContent() {
  const location = useLocation();
  const [quotaExceeded, setQuotaExceeded] = React.useState(
    typeof window !== 'undefined' ? !!(window as any).__firebaseQuotaExceeded : false
  );

  React.useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('firebase-quota-exceeded', handleQuota);
    return () => window.removeEventListener('firebase-quota-exceeded', handleQuota);
  }, []);

  const isAdminRoute = 
    location.pathname.startsWith('/admin') || 
    location.pathname.startsWith('/staff') || 
    location.pathname === '/dashboard' || 
    location.pathname === '/login';

  return (
    <div className="min-h-screen relative flex flex-col" key="app-root-container">
      {quotaExceeded && (
        <div id="firebase-quota-warning-banner" className="bg-amber-500 text-slate-950 px-6 py-2 text-center text-xs font-black uppercase tracking-wider flex items-center justify-center gap-3 z-[9999] sticky top-0 shadow-lg border-b border-amber-600">
          <AlertTriangle className="w-4 h-4 animate-bounce text-slate-950 shrink-0" />
          <span>⚠️ Batas Kuota Harian Firebase Tercapai (Free Tier Exhausted). Mohon tunggu reset kuota harian atau aktifkan penagihan pada konsol Firebase Anda.</span>
        </div>
      )}
      <div 
         id="navbar-persistent-container" 
         key="navbar-wrapper" 
         className={cn(isAdminRoute ? "hidden" : "contents")}
      >
        <Navbar key="public-navbar-component" />
      </div>
      
      <main id="app-main-view" className={cn("flex-1", !isAdminRoute && "pt-20")} key="app-main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/report" element={<Report />} />
          <Route path="/login" element={<Login />} />
          
          {/* SI-DAMKAR Pro Routes */}
          <Route 
            path="/staff/ops" 
            element={
              <RequireAuth>
                <OperationalDashboard />
              </RequireAuth>
            } 
          />
          <Route 
            path="/staff/reports" 
            element={
              <RequireAuth>
                <OperationalForms />
              </RequireAuth>
            } 
          />
          <Route 
            path="/staff/master/*" 
            element={
              <RequireAuth role="admin">
                <MasterData />
              </RequireAuth>
            } 
          />

          <Route 
            path="/staff/settings" 
            element={
              <RequireAuth role="admin">
                <AdminDashboard initialTab="settings" />
              </RequireAuth>
            } 
          />

          <Route 
            path="/dashboard" 
            element={
              <RequireAuth>
                <AdminDashboard />
              </RequireAuth>
            } 
          />
          <Route 
            path="/admin/*" 
            element={
              <RequireAuth>
                <AdminDashboard />
              </RequireAuth>
            } 
          />
          <Route path="/news" element={<News />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="/check-ticket" element={<CheckTicket />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:slug" element={<Profile />} />
          <Route path="/struktur-organisasi" element={<StrukturOrganisasiPage />} />
          <Route path="/education" element={<Education />} />
          <Route path="/documentation" element={<Documentation />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-5 md:p-8 text-center">
               <ShieldAlert className="w-20 h-20 text-brand-red mb-8" />
               <h1 className="text-6xl font-black text-slate-900 uppercase italic tracking-tighter mb-4 leading-none">404</h1>
               <p className="text-slate-500 font-bold mb-8 italic uppercase tracking-widest text-[10px]">Halaman Tidak Ditemukan</p>
               <Link to="/" className="emergency-btn">Kembali ke Beranda</Link>
            </div>
          } />
        </Routes>
      </main>

      <div 
        id="footer-persistent-container" 
        key="footer-wrapper" 
        className={cn(isAdminRoute ? "hidden" : "contents")}
      >
        <Footer key="public-footer-component" />
      </div>
      <AiAssistant />
    </div>
  );
}
