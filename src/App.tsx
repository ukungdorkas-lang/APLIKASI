import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import EmergencyForm from './components/EmergencyForm';
import DashboardStats from './components/DashboardStats';
import ReportList from './components/ReportList';
import { useReports } from './hooks/useReports';
import { generateNewsFromReport } from './lib/gemini';
import { collection, addDoc, getDoc, doc, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, auth } from './lib/firebase';
import { ShieldAlert, Info, Newspaper, ArrowRight, Flame, Phone, Calendar, MapPin, ExternalLink, Activity } from 'lucide-react';
import { NewsArticle, BannerConfig } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { LoadingSpinner, Skeleton } from './components/Loading';
import { cn } from './lib/utils';

function Home() {
  const [news, setNews] = React.useState<NewsArticle[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [banner, setBanner] = React.useState<BannerConfig | null>(null);
  const { reports } = useReports();
  const recentReports = reports.slice(0, 3);

  React.useEffect(() => {
    const q = query(
      collection(db, 'news'),
      where('status', '==', 'Publish Otomatis'),
      orderBy('date', 'desc'),
      limit(3)
    );

    const unsubNews = onSnapshot(q, (snapshot) => {
      setNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsArticle)));
      setLoading(false);
    });

    const unsubBanner = onSnapshot(doc(db, 'banners', 'home'), (snap) => {
      if (snap.exists()) setBanner(snap.data() as BannerConfig);
    });

    return () => {
      unsubNews();
      unsubBanner();
    };
  }, []);

  const counterStats = banner?.stats && banner.stats.length >= 4 ? banner.stats : [
    { label: 'POS WILAYAH', value: '05' },
    { label: 'PERSONEL AKTIF', value: '45' },
    { label: 'ARMADA TAKTIS', value: '12' },
    { label: 'UNIT SIAGA', value: '24h' },
  ];

  return (
    <div 
      className="space-y-32" 
      style={{ 
        backgroundColor: banner?.backgroundColor || 'var(--app-bg)',
        backgroundImage: banner?.backgroundImageUrl ? `url(${banner.backgroundImageUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <Hero />
      
      {/* Quick Action Navigation */}
      <section className="max-w-7xl mx-auto px-6 sm:px-10 -mt-24 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10">
          {[
            { title: 'Kebakaran', icon: <Flame className="w-8 h-8" />, label: 'TANGGAP API', color: 'bg-red-500' },
            { title: 'Evakuasi', icon: <ShieldAlert className="w-8 h-8" />, label: 'EVAKUASI', color: 'bg-orange-500' },
            { title: 'Penyelamatan', icon: <Phone className="w-8 h-8" />, label: 'SAR TEAM', color: 'bg-blue-500' },
            { title: 'Perbantuan', icon: <Info className="w-8 h-8" />, label: 'SUPPORT', color: 'bg-slate-700' },
          ].map((action, i) => (
            <Link 
              key={i} 
              to={`/report?type=${action.title}`}
              className="group bg-white rounded-[2rem] p-8 sm:p-10 border border-slate-50 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 flex flex-col items-center text-center overflow-hidden relative"
            >
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6 transition-transform group-hover:scale-110 duration-500", action.color)}>
                 {action.icon}
              </div>
              <h3 className="text-xl sm:text-2xl font-display font-black uppercase italic tracking-tighter text-slate-900 leading-none mb-4">{action.title}</h3>
              <span className="text-[9px] font-black tracking-[0.2em] text-slate-400 group-hover:text-brand-red uppercase">{action.label}</span>
              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 -mr-12 -mt-12 rounded-full group-hover:bg-brand-red/5 transition-colors" />
            </Link>
          ))}
        </div>
      </section>

      {/* Latest News Section */}
      <section className="max-w-7xl mx-auto px-6 sm:px-10">
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
                {item.photos && item.photos[0] ? (
                  <img src={item.photos[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale-[0.2] group-hover:grayscale-0" alt={item.title} />
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
                  {item.summary || item.content.substring(0, 150) + '...'}
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

      {/* Recent Cases Section */}
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
                className="bg-brand-dark p-10 rounded-[3.5rem] text-white border-4 border-slate-900 shadow-2xl relative overflow-hidden group"
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
      <section className="max-w-7xl mx-auto px-6 sm:px-10 py-32 grid lg:grid-cols-12 gap-20 items-center">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-red/5 rounded-full blur-3xl -z-10" />
        
        <div className="lg:col-span-4">
          <h2 className="text-6xl font-display font-black italic uppercase tracking-tighter mb-8 leading-[0.85]">Kesiapan <br /> <span className="text-brand-red">Warga.</span></h2>
          <p className="text-slate-500 font-bold mb-8 leading-relaxed max-w-xs">
            Kecepatan penanganan dimulai dari ketepatan pelaporan. Lindungi Kabupaten Malinau bersama tim kami.
          </p>
          <Link to="/education" className="emergency-btn inline-flex items-center gap-4 group">
             PANDUAN KESELAMATAN <ArrowRight className="w-6 h-6 group-hover:translate-x-3 transition-transform" />
          </Link>
        </div>

        <div className="lg:col-span-8 grid md:grid-cols-2 gap-8">
          <div className="bg-slate-50 p-10 rounded-[2rem] border-4 border-slate-100 hover:border-brand-red transition-all cursor-pointer group">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-8 group-hover:bg-brand-red group-hover:text-white transition-all transform group-hover:rotate-6">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4 text-brand-dark">Respon Kilat</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Sistem pelaporan real-time yang terhubung langsung ke unit taktis lapangan.</p>
          </div>
          <div className="bg-slate-50 p-10 rounded-[2rem] border-4 border-slate-100 hover:border-brand-red transition-all cursor-pointer group">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-8 group-hover:bg-brand-red group-hover:text-white transition-all transform group-hover:-rotate-6">
              <Newspaper className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4 text-brand-dark">Transparansi</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Berita otomatis hasil penanganan di lapangan untuk informasi publik yang akurat.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

import DynamicBanner from './components/DynamicBanner';

function Report() {
  const { submitReport } = useReports();
  return (
    <div className="pb-20">
      <DynamicBanner 
        pageId="report"
        defaultTitle="LAPORAN DARURAT"
        defaultSubtitle="Respon Anda Menentukan Keselamatan Kita Bersama. Laporkan segera setiap kejadian darurat untuk penanganan kilat."
        defaultImage="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=2069"
      />
      <div className="max-w-5xl mx-auto px-8 -mt-20 relative z-20">
        <div className="bg-white p-12 rounded-[3.5rem] shadow-3xl border-8 border-slate-900">
           <EmergencyForm onSubmit={submitReport} />
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { reports, loading, updateStatus } = useReports();

  const handleGenerateNews = async (report: any) => {
    const news = await generateNewsFromReport(report);
    if (news) {
      await addDoc(collection(db, 'news'), {
        ...news,
        reportId: report.id,
        date: Date.now(),
        location: report.location.address || 'Malinau'
      });
      alert('Berita berhasil digenerate otomatis!');
    }
  };

  return (
    <div className="pt-48 pb-20 max-w-7xl mx-auto px-8">
      <div className="flex items-end justify-between mb-16 border-b-[12px] border-brand-dark pb-10">
        <div>
          <h2 className="text-7xl font-display font-black italic uppercase tracking-tighter text-brand-dark">Dashboard <span className="text-brand-red">Pusat.</span></h2>
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

import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import Profile from './pages/Profile';
import Education from './pages/Education';
import Contact from './pages/Contact';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import Footer from './components/Footer';

// Auth Protection Wrapper
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (u) {
        // Double check admin role in Firestore
        const docRef = doc(db, 'admins', u.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUser(u);
        } else {
          auth.signOut();
          navigate('/login');
        }
      } else {
        navigate('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  if (loading) return <LoadingSpinner fullPage message="MEMVERIFIKASI AKSES OTORITAS..." />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen relative flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/report" element={<Report />} />
              <Route path="/login" element={<Login />} />
              <Route 
                path="/dashboard" 
                element={
                  <RequireAdmin>
                    <AdminDashboard />
                  </RequireAdmin>
                } 
              />
              <Route 
                path="/admin/*" 
                element={
                  <RequireAdmin>
                    <AdminDashboard />
                  </RequireAdmin>
                } 
              />
              <Route path="/news" element={<News />} />
              <Route path="/news/:id" element={<NewsDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:slug" element={<Profile />} />
              <Route path="/education" element={<Education />} />
              <Route path="/documentation" element={<Education />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  );
}
