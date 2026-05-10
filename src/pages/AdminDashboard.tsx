import React from 'react';
import { useReports } from '../hooks/useReports';
import DashboardStats from '../components/DashboardStats';
import ReportList from '../components/ReportList';
import { db, auth } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { generateNewsFromReport } from '../lib/gemini';
import { 
  BarChart3, 
  Users, 
  Settings, 
  Newspaper, 
  Map as MapIcon, 
  AlertTriangle, 
  AlertCircle,
  LogOut, 
  ChevronRight, 
  Bell, 
  Search, 
  Plus,
  Trash2,
  Edit,
  X as CloseIcon,
  CheckCircle,
  Clock,
  ShieldAlert,
  LayoutDashboard,
  Info,
  MapPin,
  Radio,
  Filter,
  Image,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import Markdown from 'react-markdown';

import { logAudit } from '../lib/auditLogger';
import NotificationManagement from '../components/NotificationManagement';
import { handleFirestoreError } from '../lib/errorHandler';
import { OperationType } from '../types';

import { FileUpload } from '../components/FileUpload';
import { useTheme } from '../contexts/ThemeContext';
import { LoadingSpinner, Skeleton } from '../components/Loading';

type AdminTab = 'overview' | 'reports' | 'maps' | 'notifications' | 'news' | 'users' | 'gallery' | 'education' | 'profiles' | 'banners' | 'settings' | 'logs' | 'themes';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { reports, loading: reportsLoading, updateStatus } = useReports();
  const [activeTab, setActiveTab] = React.useState<AdminTab>('overview');
  const [news, setNews] = React.useState<any[]>([]);
  const [users, setUsers] = React.useState<any[]>([]);
  const [logs, setLogs] = React.useState<any[]>([]);
  const [gallery, setGallery] = React.useState<any[]>([]);
  const [education, setEducation] = React.useState<any[]>([]);
  const [profileSections, setProfileSections] = React.useState<any[]>([]);
  const [banners, setBanners] = React.useState<any[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [prevReportsCount, setPrevReportsCount] = React.useState(reports.length);

  const [dataLoading, setDataLoading] = React.useState({
    news: true,
    users: true,
    logs: true,
    gallery: true,
    education: true,
    profiles: true,
    banners: true,
    settings: true
  });

  // Success Toast State
  const [toast, setToast] = React.useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Form States
  const [showReportModal, setShowReportModal] = React.useState(false);
  const [showNewsModal, setShowNewsModal] = React.useState(false);
  const [showUserModal, setShowUserModal] = React.useState(false);
  const [showGalleryModal, setShowGalleryModal] = React.useState(false);
  const [showEduModal, setShowEduModal] = React.useState(false);
  const [showProfileModal, setShowProfileModal] = React.useState(false);
  const [showBannerModal, setShowBannerModal] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<any>(null);

  const [reportForm, setReportForm] = React.useState({
    type: 'Kebakaran',
    location: { address: '', lat: 3.58, lng: 116.63 },
    reporterName: '',
    reporterPhone: '',
    description: '',
    level: 'normal'
  });

  const [showDocsModal, setShowDocsModal] = React.useState(false);
  const [docsForm, setDocsForm] = React.useState({
    chronology: '',
    photos: [] as string[],
    videos: [] as string[],
    personnel: 5,
    units: ['Unit Gajah 01'],
    duration: '1 Jam',
    victims: 'Nihil',
    actions: 'Pemadaman total dan pendinginan'
  });
  const [selectedReport, setSelectedReport] = React.useState<any>(null);

  const [newsForm, setNewsForm] = React.useState({
    title: '',
    content: '',
    category: 'WARTA',
    imageUrl: 'https://images.unsplash.com/photo-1542343607-16076fe95b7b?auto=format&fit=crop&q=80'
  });

  const [userForm, setUserForm] = React.useState({
    email: '',
    password: '',
    role: 'admin'
  });

  const [galleryForm, setGalleryForm] = React.useState({
    title: '',
    category: 'OPERASIONAL',
    imageUrl: ''
  });

  const [eduForm, setEduForm] = React.useState({
    title: '',
    category: 'PENCEGAHAN',
    content: '',
    imageUrl: ''
  });

  const [profileForm, setProfileForm] = React.useState({
    title: '',
    slug: '',
    content: '',
    order: 0,
    isActive: true,
    icon: 'Info',
    imageUrl: ''
  });

  const [bannerForm, setBannerForm] = React.useState({
    id: '', // Page ID
    title: '',
    subtitle: '',
    imageUrl: '',
    ctaText: '',
    ctaLink: '',
    overlayOpacity: 0.4,
    backgroundColor: '#0f172a',
    backgroundImageUrl: '',
    stats: [] as { label: string; value: string; icon?: string }[]
  });

  const [filter, setFilter] = React.useState<'SEMUA' | 'MENUNGGU' | 'PROSES' | 'SELESAI'>('SEMUA');

  const filteredReports = reports.filter(r => {
    if (filter === 'SEMUA') return true;
    if (filter === 'MENUNGGU') return r.status === 'Menunggu Penanganan' || r.status === 'Menunggu';
    if (filter === 'PROSES') return r.status === 'Diproses' || r.status === 'Dalam Penanganan';
    if (filter === 'SELESAI') return r.status === 'Selesai Ditangani';
    return true;
  });

  const { themes, applyTheme, seedThemes, loading: themesLoading } = useTheme();

  // Theme Form State
  const [showThemeModal, setShowThemeModal] = React.useState(false);
  const [themeForm, setThemeForm] = React.useState({
    name: '',
    primaryColor: '#e11d48',
    secondaryColor: '#0f172a',
    accentColor: '#fbbf24',
    backgroundColor: '#f1f5f9',
    surfaceColor: '#ffffff',
    textColor: '#0f172a',
    fontFamily: 'Inter',
    isDark: false,
    thumbnailUrl: '' as string | undefined
  });

  const [settingsForm, setSettingsForm] = React.useState({
    agencyName: 'DAMKAR MALINAU',
    slogan: 'Pantang Pulang Sebelum Padam',
    contact: '0551-21113',
    emergencyNumber: '112 / 081122334455',
    logoUrl: '',
    faviconUrl: '',
    email: '',
    address: ''
  });

  const handleSaveTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateDoc(doc(db, 'themes', editingItem.id), themeForm);
        showToast('Tema diperbarui');
      } else {
        await addDoc(collection(db, 'themes'), { ...themeForm, isActive: false });
        showToast('Tema baru berhasil ditambahkan');
      }
      setShowThemeModal(false);
      setEditingItem(null);
    } catch (err) {
      showToast('Gagal menyimpan tema', 'error');
    }
  };

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'reports'), {
        ...reportForm,
        phoneNumber: reportForm.reporterPhone,
        status: 'Menunggu',
        createdAt: Date.now(),
        newsGenerated: false
      });
      setShowReportModal(false);
      showToast('Laporan manual berhasil disimpan');
    } catch (err) {
      showToast('Gagal menyimpan laporan', 'error');
    }
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateDoc(doc(db, 'news', editingItem.id), newsForm);
        showToast('Berita diperbarui');
      } else {
        await addDoc(collection(db, 'news'), { 
          ...newsForm, 
          date: Date.now(),
          status: 'Publish Otomatis',
          isAIGenerated: false,
          photos: [newsForm.imageUrl],
          videos: [],
          personnelCount: 0,
          unitsUsed: [],
          location: 'Malinau'
        });
        showToast('Berita berhasil diterbitkan');
      }
      setShowNewsModal(false);
      setEditingItem(null);
    } catch (err) {
      showToast('Gagal menyimpan berita', 'error');
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // In a real app we'd use Firebase Admin or a cloud function to create the user with password
      // For this prototype, we'll just add to the admins collection
      await addDoc(collection(db, 'admins'), {
        email: userForm.email,
        role: userForm.role,
        createdAt: Date.now()
      });
      setShowUserModal(false);
      showToast('Petugas berhasil ditambahkan');
    } catch (err) {
      showToast('Gagal menambahkan petugas', 'error');
    }
  };

  const handleDeleteItem = async (col: string, id: string) => {
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    try {
      await deleteDoc(doc(db, col, id));
      showToast('Data berhasil dihapus');
    } catch (err) {
      showToast('Gagal menghapus data', 'error');
    }
  };

  const handleSaveGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'gallery'), { ...galleryForm, createdAt: Date.now() });
      setShowGalleryModal(false);
      showToast('Media berhasil diunggah');
    } catch (err) {
      showToast('Gagal mengunggah media', 'error');
    }
  };

  const handleSaveEdu = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateDoc(doc(db, 'education', editingItem.id), eduForm);
        showToast('Materi diperbarui');
      } else {
        await addDoc(collection(db, 'education'), { ...eduForm, createdAt: Date.now() });
        showToast('Materi edukasi berhasil disimpan');
      }
      setShowEduModal(false);
      setEditingItem(null);
    } catch (err) {
      showToast('Gagal menyimpan materi', 'error');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateDoc(doc(db, 'profile_sections', editingItem.id), {
          ...profileForm,
          updatedAt: Date.now()
        });
        showToast('Konten profil diperbarui');
      } else {
        await addDoc(collection(db, 'profile_sections'), { 
          ...profileForm, 
          updatedAt: Date.now() 
        });
        showToast('Konten profil baru ditambahkan');
      }
      setShowProfileModal(false);
      setEditingItem(null);
    } catch (err) {
      showToast('Gagal menyimpan profil', 'error');
    }
  };

  const seedProfiles = async () => {
    try {
      showToast('Menginisialisasi profil default...');
      const defaults = [
        { title: 'Sejarah Damkar Malinau', slug: 'sejarah', content: '# Sejarah Damkar Malinau\n\nSatuan Pemadam Kebakaran Kabupaten Malinau dibentuk berdasarkan kebutuhan akan perlindungan keselamatan warga dari bahaya kebakaran dan bencana lainnya. Sejak berdirinya, tim kami telah berkembang menjadi satuan yang tangguh dan responsif.', order: 1, icon: 'History', isActive: true },
        { title: 'Visi & Misi', slug: 'visi-misi', content: '# Visi & Misi\n\n## Visi\nTerwujudnya Masyarakat Kabupaten Malinau yang Aman dan Terlindungi dari Bahaya Kebakaran.\n\n## Misi\n1. Meningkatkan respon kilat penanganan kebakaran.\n2. Mengedukasi masyarakat tentang pencegahan dini.\n3. Membangun sarana dan prasarana yang modern.', order: 2, icon: 'Target', isActive: true },
        { title: 'Struktur Organisasi', slug: 'struktur', content: '# Struktur Organisasi\n\nStruktur organisasi Pemadam Kebakaran Kabupaten Malinau terdiri dari Kepala Satuan, Sekretaris, serta berbagai Bidang Operasional dan Pencegahan.', order: 3, icon: 'Users', isActive: true },
        { title: 'Letak Pos Damkar', slug: 'pos-lokasi', content: '# Letak Pos Damkar\n\nDamkar Malinau memiliki pos-pos strategis yang tersebar:\n\n1. **Pos Komando Pusat**: Jl. Raja Alam\n2. **Pos Wilayah Utara**\n3. **Pos Wilayah Selatan**', order: 4, icon: 'MapPin', isActive: true },
      ];

      for (const item of defaults) {
        // Check if slug already exists to avoid duplicates
        const existing = profileSections.find(s => s.slug === item.slug);
        if (!existing) {
          await addDoc(collection(db, 'profile_sections'), {
            ...item,
            updatedAt: Date.now(),
            imageUrl: 'https://images.unsplash.com/photo-1542343607-16076fe95b7b?auto=format&fit=crop&q=80'
          });
        }
      }
      showToast('Profil default berhasil disiapkan');
    } catch (err) {
      showToast('Gagal inisialisasi profil', 'error');
    }
  };

  const handleSaveSettings = async () => {
    try {
      // Typically settings go in a singleton doc
      await updateDoc(doc(db, 'settings', 'general'), settingsForm);
      showToast('Pengaturan sistem diperbarui');
    } catch (err) {
      // If doc doesn't exist, try setting it
      try {
        const { setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'settings', 'general'), settingsForm);
        showToast('Pengaturan sistem diperbarui');
      } catch (e) {
        showToast('Gagal menyimpan pengaturan', 'error');
      }
    }
  };

  React.useEffect(() => {
    if (reports.length > prevReportsCount) {
      const newReport = reports[0];
      if (newReport?.status === 'Menunggu Penanganan' || newReport?.status === 'Menunggu') {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        audio.play().catch(e => console.log('Audio play failed:', e));
        showToast(`Laporan Baru: ${newReport.type || 'KEJADIAN'} di ${newReport.location?.address || 'Malinau'}`);
      }
    }
    setPrevReportsCount(reports.length);
  }, [reports, prevReportsCount]);

  React.useEffect(() => {
    const unsubNews = onSnapshot(query(collection(db, 'news'), orderBy('date', 'desc')), (sn) => {
      setNews(sn.docs.map(d => ({ id: d.id, ...d.data() })));
      setDataLoading(prev => ({ ...prev, news: false }));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'news', auth);
      setDataLoading(prev => ({ ...prev, news: false }));
    });

    const unsubUsers = onSnapshot(query(collection(db, 'admins')), (sn) => {
      setUsers(sn.docs.map(d => ({ id: d.id, ...d.data() })));
      setDataLoading(prev => ({ ...prev, users: false }));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'admins', auth);
      setDataLoading(prev => ({ ...prev, users: false }));
    });

    const unsubLogs = onSnapshot(query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc')), (sn) => {
      setLogs(sn.docs.map(d => ({ id: d.id, ...d.data() })));
      setDataLoading(prev => ({ ...prev, logs: false }));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'audit_logs', auth);
      setDataLoading(prev => ({ ...prev, logs: false }));
    });

    const unsubGallery = onSnapshot(query(collection(db, 'gallery'), orderBy('createdAt', 'desc')), (sn) => {
      setGallery(sn.docs.map(d => ({ id: d.id, ...d.data() })));
      setDataLoading(prev => ({ ...prev, gallery: false }));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'gallery', auth);
      setDataLoading(prev => ({ ...prev, gallery: false }));
    });

    const unsubEducation = onSnapshot(query(collection(db, 'education'), orderBy('createdAt', 'desc')), (sn) => {
      setEducation(sn.docs.map(d => ({ id: d.id, ...d.data() })));
      setDataLoading(prev => ({ ...prev, education: false }));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'education', auth);
      setDataLoading(prev => ({ ...prev, education: false }));
    });

    const unsubProfiles = onSnapshot(query(collection(db, 'profile_sections'), orderBy('order', 'asc')), (sn) => {
      setProfileSections(sn.docs.map(d => ({ id: d.id, ...d.data() })));
      setDataLoading(prev => ({ ...prev, profiles: false }));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'profile_sections', auth);
      setDataLoading(prev => ({ ...prev, profiles: false }));
    });

    const unsubBanners = onSnapshot(collection(db, 'banners'), (sn) => {
      setBanners(sn.docs.map(d => ({ id: d.id, ...d.data() })));
      setDataLoading(prev => ({ ...prev, banners: false }));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'banners', auth);
      setDataLoading(prev => ({ ...prev, banners: false }));
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'general'), (snap) => {
      if (snap.exists()) {
        setSettingsForm(prev => ({ ...prev, ...snap.data() }));
      }
      setDataLoading(prev => ({ ...prev, settings: false }));
    }, () => setDataLoading(prev => ({ ...prev, settings: false })));

    return () => {
      unsubNews(); unsubUsers(); unsubLogs(); unsubGallery(); unsubEducation(); unsubProfiles(); unsubBanners(); unsubSettings();
    };
  }, []);

  const seedBanners = async () => {
    try {
      showToast('Menyiapkan banner default...');
      const defaults = [
        { id: 'home', title: 'CEPAT TANGGAP DAN PROFESIONAL', subtitle: 'Kami siap melindungi masyarakat dari bahaya kebakaran dengan pelayanan cepat, akurat, dan terpercaya selama 24 jam penuh.', imageUrl: 'https://images.unsplash.com/photo-1542343607-16076fe95b7b?auto=format&fit=crop&q=80', ctaText: 'LAPOR SEKARANG', ctaLink: '/report', overlayOpacity: 0.4 },
        { id: 'news', title: 'WARTA DAMKAR', subtitle: 'Informasi terkini seputar operasional, sosialisasi, dan edukasi pencegahan kebakaran di Kabupaten Malinau.', imageUrl: 'https://images.unsplash.com/photo-1542343607-16076fe95b7b?auto=format&fit=crop&q=80', overlayOpacity: 0.6 },
        { id: 'report', title: 'PUSAT PELAPORAN', subtitle: 'Laporkan kejadian darurat dengan cepat untuk penanganan segera oleh tim profesional kami.', imageUrl: 'https://images.unsplash.com/photo-1542343607-16076fe95b7b?auto=format&fit=crop&q=80', overlayOpacity: 0.7 },
        { id: 'documentation', title: 'GALERI EDUKASI', subtitle: 'Pelajari cara pencegahan dan penanganan dini kebakaran melalui materi edukasi kami.', imageUrl: 'https://images.unsplash.com/photo-1542343607-16076fe95b7b?auto=format&fit=crop&q=80', overlayOpacity: 0.5 },
        { id: 'profile', title: 'PROFIL INSTANSI', subtitle: 'Kenali lebih dekat Satuan Pemadam Kebakaran Kabupaten Malinau, tugas, dan fungsi kami.', imageUrl: 'https://images.unsplash.com/photo-1542343607-16076fe95b7b?auto=format&fit=crop&q=80', overlayOpacity: 0.6 },
        { id: 'contact', title: 'HUBUNGI KAMI', subtitle: 'Layanan bantuan dan informasi 24 jam. Siaga melindungi masyarakat Malinau.', imageUrl: 'https://images.unsplash.com/photo-1542343607-16076fe95b7b?auto=format&fit=crop&q=80', overlayOpacity: 0.6 },
      ];

      const { setDoc } = await import('firebase/firestore');
      for (const b of defaults) {
        await setDoc(doc(db, 'banners', b.id), { ...b, updatedAt: Date.now() });
      }
      showToast('Banner default berhasil disiapkan');
    } catch (err) {
      showToast('Gagal inisialisasi banner', 'error');
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'banners', bannerForm.id), { ...bannerForm, updatedAt: Date.now() });
      showToast('Banner berhasil diperbarui');
      setShowBannerModal(false);
    } catch (err) {
      showToast('Gagal memperbarui banner', 'error');
    }
  };

  const handleLogout = async () => {
    await logAudit('LOGOUT', 'User logged out from control panel');
    await auth.signOut();
    navigate('/login');
  };

  const handleSaveDocs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    try {
      await updateStatus(selectedReport.id, 'Selesai Ditangani', undefined, docsForm);
      showToast('Dokumentasi disimpan. Memproses berita AI...');
      
      const updatedReport = { ...selectedReport, status: 'Selesai Ditangani', documentation: docsForm };
      const newsData = await generateNewsFromReport(updatedReport);
      
      if (newsData) {
        await addDoc(collection(db, 'news'), {
          ...newsData,
          reportId: selectedReport.id,
          date: Date.now(),
          location: selectedReport.location.address || 'Malinau',
          status: 'Publish Otomatis',
          isAIGenerated: true,
          photos: docsForm.photos,
          videos: docsForm.videos,
          personnelCount: newsData.personnelCount || docsForm.personnel,
          unitsUsed: newsData.unitsUsed || docsForm.units
        });
        
        await updateDoc(doc(db, 'reports', selectedReport.id), { newsGenerated: true });
        showToast('Berita AI berhasil dipublikasikan!');
      }
      
      setShowDocsModal(false);
      setSelectedReport(null);
    } catch (err) {
      showToast('Gagal memproses dokumentasi', 'error');
    }
  };

  const handleGenerateNews = async (report: any) => {
    try {
      showToast('Membangun narasi AI...');
      const newsData = await generateNewsFromReport(report);
      if (newsData) {
        await addDoc(collection(db, 'news'), {
          ...newsData,
          reportId: report.id,
          date: Date.now(),
          location: report.location.address || 'Malinau',
          status: 'Publish Otomatis',
          isAIGenerated: true,
          photos: report.documentation?.photos || [],
          videos: report.documentation?.videos || [],
          personnelCount: newsData.personnelCount || report.documentation?.personnel || 0,
          unitsUsed: newsData.unitsUsed || report.documentation?.units || []
        });
        await updateDoc(doc(db, 'reports', report.id), { newsGenerated: true });
        await logAudit('NEWS_GENERATED', `Automated news generated for report ${report.id}`);
        showToast('Berita berhasil dipublikasi!');
      }
    } catch (e) {
      showToast('Gagal memproses berita', 'error');
    }
  };

  const sidebarItems = [
    { id: 'overview', name: 'Overview', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'reports', name: 'Laporan Masuk', icon: <AlertTriangle className="w-5 h-5" /> },
    { id: 'maps', name: 'Monitoring Maps', icon: <MapIcon className="w-5 h-5" /> },
    { id: 'news', name: 'Warta & Berita', icon: <Newspaper className="w-5 h-5" /> },
    { id: 'gallery', name: 'Galeri Media', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'education', name: 'Edukasi Warga', icon: <Info className="w-5 h-5" /> },
    { id: 'profiles', name: 'Manajemen Profil', icon: <User className="w-5 h-5" /> },
    { id: 'banners', name: 'Manajemen Banner', icon: <Image className="w-5 h-5" /> },
    { id: 'notifications', name: 'Sistem Notif', icon: <Bell className="w-5 h-5" /> },
    { id: 'users', name: 'Admin & Petugas', icon: <Users className="w-5 h-5" /> },
    { id: 'logs', name: 'Audit & Riwayat', icon: <Clock className="w-5 h-5" /> },
    { id: 'settings', name: 'Pengaturan', icon: <Settings className="w-5 h-5" /> },
    { id: 'themes', name: 'Manajemen Tema', icon: <LayoutDashboard className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex overflow-hidden">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
              "fixed bottom-10 right-10 z-[100] px-8 py-4 rounded-2xl font-black italic uppercase tracking-tighter shadow-2xl flex items-center gap-3 border-4",
              toast.type === 'success' ? "bg-slate-900 text-white border-brand-red" : "bg-red-500 text-white border-red-900"
            )}
          >
            {toast.type === 'success' ? <CheckCircle className="w-6 h-6 text-brand-red" /> : <AlertTriangle className="w-6 h-6" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-72 bg-brand-dark flex flex-col fixed h-full z-40 border-r border-white/5">
        <div className="p-10">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-red rounded-lg flex items-center justify-center shadow-lg shadow-red-900/40">
              <ShieldAlert className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display font-black tracking-tighter text-lg leading-none text-white uppercase">DAMKAR <span className="text-brand-red">CTRL</span></h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Malinau Admin</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as AdminTab)}
              className={cn(
                "w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all font-bold text-sm",
                activeTab === item.id 
                  ? "bg-brand-red text-white shadow-xl shadow-red-900/20" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <span className={cn(activeTab === item.id ? "text-white" : "text-slate-500")}>
                {item.icon}
              </span>
              <span className="uppercase tracking-widest text-[11px]">{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5">
          <div className="bg-white/5 rounded-2xl p-4 mb-4 border border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 overflow-hidden">
               <User className="text-slate-400 w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{auth.currentUser?.email?.split('@')[0] || 'Admin'}</p>
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em]">Operator</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 py-3 bg-white/5 hover:bg-brand-red hover:text-white text-slate-400 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-72 overflow-y-auto min-h-screen">
        {/* Header Bar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 h-20 flex items-center justify-between px-10 sticky top-0 z-30">
          <div className="flex items-center gap-10 flex-1">
            <div className="flex items-baseline gap-2">
              <h2 className="text-xl font-display font-black text-slate-900 uppercase tracking-tighter">
                {sidebarItems.find(i => i.id === activeTab)?.name}
              </h2>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-2" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dashboard</span>
            </div>

            <div className="relative max-w-sm w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-brand-red transition-colors" />
              <input 
                className="w-full bg-slate-100 border-none rounded-xl py-2.5 pl-12 pr-4 focus:bg-white focus:ring-2 focus:ring-brand-red/10 outline-none font-medium text-sm transition-all"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex -space-x-2">
               {[1,2,3].map(i => (
                 <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                    OP
                 </div>
               ))}
               <div className="w-8 h-8 rounded-full border-2 border-white bg-brand-red text-white flex items-center justify-center text-[10px] font-bold">
                  +5
               </div>
            </div>

            <button className="relative p-2.5 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all group">
              <Bell className="w-5 h-5 text-slate-500 group-hover:text-brand-red" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-brand-red rounded-full border-2 border-white" />
            </button>
            <div className="h-8 w-px bg-slate-100" />
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-900 leading-none">Status: <span className="text-green-500 uppercase tracking-widest text-[9px]">Online</span></div>
                <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Server Malinau-01</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-green-50 border-4 border-white shadow-sm flex items-center justify-center">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="p-12">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
                <DashboardStats reports={reports} />
                <div className="grid lg:grid-cols-12 gap-10 mt-10">
                  <div className="lg:col-span-8 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-10">
                      <h3 className="text-lg font-display font-black text-slate-900 uppercase tracking-tighter italic">Live Monitor <span className="text-brand-red">Realtime</span></h3>
                      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-500 uppercase">
                         <div className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse" />
                         Updated 2m ago
                      </div>
                    </div>
                    <div className="aspect-[16/9] bg-slate-100 rounded-3xl overflow-hidden relative border border-slate-50">
                      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80')] bg-cover opacity-20 grayscale" />
                      <div className="absolute inset-0 flex items-center justify-center">
                         <div className="text-center p-12">
                            <MapPin className="w-12 h-12 text-brand-red mx-auto mb-4 opacity-50" />
                            <p className="text-slate-400 font-bold italic uppercase tracking-[0.3em] text-xs">
                               Interactive Maps Interface <br />
                               <span className="text-[10px] opacity-70 mt-4 block">Visualisasi area rawan kejadian</span>
                            </p>
                         </div>
                      </div>
                      {/* Floating marker simulation */}
                      <div className="absolute top-1/4 left-1/3 w-10 h-10 bg-brand-red/20 rounded-full flex items-center justify-center">
                         <div className="w-3 h-3 bg-brand-red rounded-full shadow-[0_0_15px_rgba(193,18,31,1)]" />
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-4 flex flex-col gap-8">
                     <div className="bg-brand-dark p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group border border-white/5">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-brand-red/10 blur-[100px] rounded-full" />
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Total Respon</h4>
                        <div className="text-6xl font-display font-black italic tracking-tighter text-brand-red mb-2 leading-none">1.242</div>
                        <p className="text-xs font-medium text-slate-400 mt-4">Peningkatan respon 15% dibanding bulan lalu.</p>
                        <div className="h-1 bg-white/5 rounded-full mt-6 overflow-hidden">
                           <div className="h-full bg-brand-red w-3/4" />
                        </div>
                     </div>
                     <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="w-10 h-10 bg-brand-red/10 rounded-xl flex items-center justify-center">
                             <Radio className="w-5 h-5 text-brand-red" />
                          </div>
                          <h4 className="text-lg font-display font-black text-slate-900 uppercase tracking-tighter">Quick <span className="text-brand-red">Broadcast</span></h4>
                        </div>
                        <textarea 
                           className="w-full bg-slate-50 border-none rounded-xl p-4 text-xs font-semibold mb-6 outline-none resize-none focus:ring-2 focus:ring-brand-red/10 transition-all" 
                           placeholder="Tulis pesan darurat untuk semua unit..." 
                           rows={4} 
                        />
                        <button 
                          className="w-full py-4 bg-brand-dark text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-red transition-all shadow-xl shadow-slate-900/10 active:scale-95" 
                          onClick={() => showToast('Broadcast terkirim ke semua petugas!')}
                        >
                          Push to WhatsApp
                        </button>
                     </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div key="reports" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                <div className="flex flex-wrap justify-between items-center gap-6 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                   <div className="flex flex-wrap gap-2">
                      {['SEMUA', 'MENUNGGU', 'PROSES', 'SELESAI'].map(f => (
                         <button 
                           key={f} 
                           onClick={() => setFilter(f as any)}
                           className={cn(
                             "px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase",
                             filter === f 
                               ? "bg-brand-red text-white shadow-lg shadow-red-900/20" 
                               : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                           )}
                         >
                           {f}
                         </button>
                      ))}
                   </div>
                   <button 
                     className="flex items-center gap-3 bg-brand-dark text-white font-black text-[10px] tracking-widest uppercase px-8 py-4 rounded-xl shadow-xl hover:bg-brand-red transition-all active:scale-95" 
                     onClick={() => setShowReportModal(true)}
                   >
                     <Plus className="w-4 h-4" /> Create Manual Report
                   </button>
                </div>

                <div className="grid gap-6">
                  {filteredReports.length === 0 ? (
                    <div className="bg-white/50 backdrop-blur-sm p-24 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
                      <ShieldAlert className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold italic uppercase tracking-[0.4em] text-xs">No reports found in this category</p>
                    </div>
                  ) : (
                    filteredReports.map(report => (
                      <motion.div 
                        layout
                        key={report.id} 
                        className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all relative group overflow-hidden"
                      >
                         <div className="flex flex-wrap justify-between items-start gap-8">
                            <div className="flex items-start gap-6 flex-1 min-w-[300px]">
                               <div className={cn(
                                 "w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-display font-black leading-none shrink-0 shadow-inner",
                                 report.level === 'critical' ? 'bg-red-50 text-brand-red' : 'bg-slate-50 text-slate-900'
                               )}>
                                  <span className="text-[9px] opacity-50 mb-1 uppercase tracking-tighter">Level</span>
                                  <span className="text-3xl tracking-tighter">{report.level === 'critical' ? '01' : '03'}</span>
                               </div>
                               <div className="flex-1">
                                  <div className="flex items-center gap-4 mb-3">
                                     <h4 className="text-2xl font-display font-black text-slate-900 uppercase tracking-tighter group-hover:text-brand-red transition-colors">{report.type}</h4>
                                     <span className={cn(
                                       "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border", 
                                       (report.status === 'Menunggu Penanganan' || report.status === 'Menunggu') ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                       report.status === 'Diproses' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                       report.status === 'Dalam Penanganan' ? 'bg-brand-red/5 text-brand-red border-brand-red/10' :
                                       'bg-green-50 text-green-600 border-green-100'
                                     )}>
                                       {report.status}
                                     </span>
                                  </div>
                                  <p className="text-slate-500 font-medium mb-6 flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-brand-red" /> {report.location.address || 'Malinau Seberang'}</p>
                                  
                                  <div className="flex flex-wrap gap-8 py-6 border-t border-slate-50">
                                     <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Reporter</p>
                                        <p className="text-sm font-black text-slate-900 uppercase font-display italic tracking-tighter">{report.reporterName}</p>
                                     </div>
                                     <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contact</p>
                                        <p className="text-sm font-black text-slate-900 uppercase font-display italic tracking-tighter">{report.phoneNumber}</p>
                                     </div>
                                     <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Time Received</p>
                                        <p className="text-sm font-black text-slate-400 uppercase font-display italic tracking-tighter">{new Date(report.createdAt).toLocaleTimeString('id-ID')}</p>
                                     </div>
                                  </div>
                               </div>
                            </div>

                            <div className="flex flex-col items-end gap-3 self-center">
                               <div className="flex gap-2">
                                  {(report.status === 'Menunggu Penanganan' || report.status === 'Menunggu') && (
                                    <button onClick={() => updateStatus(report.id, 'Diproses')} className="p-4 bg-brand-dark text-white rounded-xl shadow-lg hover:bg-brand-red transition-all hover:scale-110" title="Proses Laporan"><Radio className="w-5 h-5" /></button>
                                  )}
                                  {report.status === 'Diproses' && (
                                    <button onClick={() => updateStatus(report.id, 'Dalam Penanganan')} className="p-4 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all hover:scale-110" title="Tangani Kejadian"><AlertCircle className="w-5 h-5" /></button>
                                  )}
                                  {(report.status === 'Diproses' || report.status === 'Dalam Penanganan') && (
                                    <button 
                                      onClick={() => {
                                        setSelectedReport(report);
                                        setDocsForm({
                                          chronology: report.description,
                                          photos: [],
                                          videos: [],
                                          personnel: 5,
                                          units: ['Unit Gajah 01'],
                                          duration: '1 Jam',
                                          victims: 'Nihil',
                                          actions: ''
                                        });
                                        setShowDocsModal(true);
                                      }} 
                                      className="p-4 bg-green-500 text-white rounded-xl shadow-lg hover:bg-green-600 transition-all hover:scale-110" 
                                      title="Selesaikan & Dokumentasi"
                                    >
                                      <CheckCircle className="w-5 h-5" />
                                    </button>
                                  )}
                                  {report.status === 'Selesai Ditangani' && !report.newsGenerated && (
                                    <button onClick={() => handleGenerateNews(report)} className="p-4 bg-brand-red text-white rounded-xl shadow-lg hover:bg-brand-dark transition-all hover:scale-110" title="Generate Berita AI"><Newspaper className="w-5 h-5" /></button>
                                  )}
                                  <button onClick={() => handleDeleteItem('reports', report.id)} className="p-4 text-slate-300 hover:text-red-500 transition-colors" title="Delete Report">
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                               </div>
                            </div>
                         </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'profiles' && (
              <motion.div key="profiles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                <div className="bg-brand-dark p-12 rounded-[3.5rem] relative overflow-hidden shadow-2xl">
                  <div className="relative z-10">
                    <h3 className="text-5xl text-white font-black uppercase italic tracking-tighter mb-4">Profil & <span className="text-brand-red">Informasi Instansi</span></h3>
                    <p className="text-slate-400 font-bold max-w-xl text-lg">Kelola sejarah, visi misi, struktur organisasi, dan profil resmi Damkar Malinau.</p>
                  </div>
                  <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-brand-red rounded-full blur-[120px] opacity-20" />
                </div>
                <div className="flex justify-between items-center mb-8">
                   <h4 className="text-3xl font-black uppercase italic tracking-tighter">Menu <span className="text-brand-red">Profil</span></h4>
                   <div className="flex gap-4">
                     <button onClick={seedProfiles} className="bg-slate-900 px-8 py-3 rounded-xl text-white font-black italic uppercase tracking-tighter hover:bg-slate-800 transition-all">Setup Default</button>
                     <button className="bg-brand-red px-8 py-3 rounded-xl text-white font-black italic uppercase tracking-tighter hover:scale-105 transition-all" onClick={() => {
                        setEditingItem(null);
                        setProfileForm({ title: '', slug: '', content: '', order: profileSections.length + 1, isActive: true, icon: 'Info', imageUrl: '' });
                        setShowProfileModal(true);
                     }}>Tambah Menu Profil</button>
                   </div>
                </div>
                <div className="grid gap-6">
                   {dataLoading.profiles ? (
                     <LoadingSpinner message="Menyusun Struktur Profil..." />
                   ) : profileSections.length === 0 ? (
                     <div className="p-20 text-center bg-white rounded-[2rem] border-4 border-dashed border-slate-200 font-black italic text-slate-300 uppercase tracking-[0.4em]">Belum Ada Konten Profil...</div>
                   ) : profileSections.map(item => (
                     <div key={item.id} className="bg-white p-8 rounded-[2rem] border-4 border-brand-dark shadow-2xl flex gap-8 items-center">
                        <div className="w-24 h-24 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 border-4 border-slate-100 overflow-hidden">
                           {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <Info className="w-8 h-8 text-slate-300" />}
                        </div>
                        <div className="flex-1">
                           <div className="flex gap-3 mb-2">
                              <span className="bg-slate-900 text-white text-[8px] font-black uppercase px-3 py-1 rounded-full">/{item.slug}</span>
                              <span className={cn("text-white text-[8px] font-black uppercase px-3 py-1 rounded-full", item.isActive ? "bg-green-500" : "bg-slate-400")}>{item.isActive ? 'AKTIF' : 'NON-AKTIF'}</span>
                           </div>
                           <h5 className="text-xl font-black italic uppercase tracking-tighter mb-1">{item.title}</h5>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Urutan: {item.order}</p>
                        </div>
                        <div className="flex gap-3">
                           <button onClick={() => {
                              setEditingItem(item);
                              setProfileForm({ 
                                title: item.title, 
                                slug: item.slug, 
                                content: item.content, 
                                order: item.order, 
                                isActive: item.isActive, 
                                icon: item.icon || 'Info', 
                                imageUrl: item.imageUrl || '' 
                              });
                              setShowProfileModal(true);
                           }} className="p-4 bg-slate-50 text-slate-400 rounded-xl border-2 border-slate-100 hover:bg-slate-900 hover:text-white transition-all"><Edit className="w-5 h-5" /></button>
                           <button onClick={() => handleDeleteItem('profile_sections', item.id)} className="p-4 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-5 h-5" /></button>
                        </div>
                     </div>
                   ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div key="notifications" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                <NotificationManagement />
              </motion.div>
            )}

            {activeTab === 'maps' && (
              <motion.div key="maps" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="bg-slate-900 rounded-[2.5rem] border-8 border-white shadow-2xl overflow-hidden h-[650px] relative">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80')] bg-cover opacity-30 mix-blend-overlay" />
                  <div className="relative h-full flex flex-col p-12">
                    <div className="flex justify-between items-start">
                      <div className="space-y-4">
                         <div className="bg-brand-red/90 inline-block px-6 py-2 rounded-xl text-white font-black italic uppercase tracking-tighter">Live Monitor</div>
                         <h3 className="text-5xl text-white font-black uppercase italic tracking-tighter">Kabupaten <span className="text-brand-red">Malinau</span></h3>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 grid grid-cols-2 gap-8 divide-x-2 divide-white/10">
                        <div className="text-center"><p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Unit Aktif</p><p className="text-3xl text-white font-black">12</p></div>
                        <div className="text-center pl-8"><p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Laporan</p><p className="text-3xl text-brand-red font-black">3</p></div>
                      </div>
                    </div>
                    <div className="mt-auto flex justify-between items-end">
                       <div className="bg-slate-950/80 backdrop-blur border-2 border-white/10 p-6 rounded-2xl">
                          <p className="text-[10px] font-black text-brand-red uppercase mb-4">LEGENDA MONITORING</p>
                          <div className="space-y-2">
                             <div className="flex items-center gap-3 text-xs font-bold text-white/60"><div className="w-3 h-3 bg-red-500 rounded-full animate-ping" /> Laporan Aktif</div>
                             <div className="flex items-center gap-3 text-xs font-bold text-white/60"><div className="w-3 h-3 bg-blue-500 rounded-full" /> Armada Penyelamatan</div>
                          </div>
                       </div>
                       <button className="bg-white text-slate-900 font-black italic uppercase tracking-tighter px-10 py-4 rounded-xl shadow-2xl hover:bg-brand-red hover:text-white transition-all">Segarkan Peta</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'news' && (
              <motion.div key="news" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="flex justify-between items-center bg-white p-8 rounded-3xl border-4 border-brand-dark shadow-2xl">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center"><Newspaper className="w-6 h-6 text-white" /></div>
                      <div><h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Draft Berita</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Warta Otomatis DAMKAR Malinau</p></div>
                   </div>
                   <div className="flex gap-4">
                     <button className="bg-brand-red px-8 py-3 rounded-xl text-white font-black italic uppercase tracking-tighter hover:scale-105 transition-all shadow-xl" onClick={() => {
                        setEditingItem(null);
                        setNewsForm({ title: '', content: '', category: 'WARTA', imageUrl: 'https://images.unsplash.com/photo-1542343607-16076fe95b7b?auto=format&fit=crop&q=80' });
                        setShowNewsModal(true);
                     }}>Tambah Berita</button>
                     <button className="bg-slate-900 px-8 py-3 rounded-xl text-white font-black italic uppercase tracking-tighter hover:bg-slate-800 transition-all" onClick={() => showToast('Broadcast Warta dimulai')}>Informasi Publik</button>
                   </div>
                </div>
                <div className="grid gap-6">
                   {dataLoading.news ? (
                     <LoadingSpinner message="Sinkronisasi Data Berita..." />
                   ) : news.length === 0 ? (
                     <div className="bg-white p-20 rounded-[2.5rem] border-4 border-dashed border-slate-200 text-center">
                        <p className="text-slate-300 font-black italic uppercase tracking-[0.4em]">Belum Ada Berita Terbit</p>
                     </div>
                   ) : (
                     news.map(article => (
                       <article key={article.id} className="bg-white p-8 rounded-[2rem] border-4 border-brand-dark shadow-2xl group flex gap-8">
                          <div className="w-48 h-48 bg-slate-50 rounded-2xl border-4 border-slate-100 flex items-center justify-center shrink-0 overflow-hidden relative">
                            <img src={`https://picsum.photos/seed/${article.id}/400/400`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-1 py-2">
                             <div className="flex justify-between items-start mb-4">
                                <span className={cn("px-4 py-1.5 text-white text-[10px] font-black italic uppercase tracking-widest rounded-lg bg-brand-red")}>{article.category || 'WARTA'}</span>
                                <span className="text-[10px] font-black text-slate-300 uppercase italic">{new Date(article.date).toLocaleDateString('id-ID')}</span>
                             </div>
                             <h4 className="text-2xl font-black italic uppercase tracking-tighter mb-4 group-hover:text-brand-red transition-colors leading-none">{article.title}</h4>
                             <div className="text-slate-500 font-bold text-sm line-clamp-3 mb-6 bg-slate-50 p-4 rounded-xl border-l-4 border-slate-200"><Markdown>{article.content}</Markdown></div>
                             <div className="flex gap-4">
                               <button className="bg-slate-900 text-white font-black italic uppercase tracking-tighter px-6 py-2 rounded-lg text-xs hover:bg-brand-red transition-colors" onClick={() => {
                                 setEditingItem(article);
                                 setNewsForm({ title: article.title, content: article.content, category: article.category || 'WARTA', imageUrl: article.imageUrl || '' });
                                 setShowNewsModal(true);
                               }}>Edit Warta</button>
                               <button className="bg-red-50 text-red-500 font-black italic uppercase tracking-tighter px-6 py-2 rounded-lg text-xs hover:bg-red-500 hover:text-white transition-colors" onClick={() => handleDeleteItem('news', article.id)}>Hapus</button>
                             </div>
                          </div>
                       </article>
                     ))
                   )}
                </div>
              </motion.div>
            )}

            {activeTab === 'gallery' && (
              <motion.div key="gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="flex justify-between items-center bg-white p-8 rounded-3xl border-4 border-brand-dark shadow-2xl">
                   <div className="flex gap-4"> {['SEMUA', 'OPERASIONAL', 'KEGIATAN'].map(f => (<button key={f} className="px-6 py-2 rounded-lg font-black text-xs uppercase italic tracking-tighter bg-slate-50 border-2 border-slate-100">{f}</button>))} </div>
                   <button className="bg-brand-red px-8 py-3 rounded-xl text-white font-black italic uppercase tracking-tighter hover:scale-105 transition-all" onClick={() => setShowGalleryModal(true)}>Unggah Dokumentasi</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {dataLoading.gallery ? (
                    <div className="col-span-full py-20 px-4 text-center">
                       <LoadingSpinner message="Menyiapkan Galeri Digital..." />
                    </div>
                  ) : gallery.length === 0 ? [1,2,3,4,5,6,7,8].map(i => (
                    <div key={i} className="aspect-square bg-slate-100 rounded-3xl border-4 border-slate-900 overflow-hidden relative group">
                      <img src={`https://picsum.photos/seed/gal_${i}/400/400`} className="w-full h-full object-cover group-hover:blur-sm transition-all" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-brand-dark/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-4">
                        <button className="p-3 bg-white rounded-xl hover:rotate-12 transition-transform shadow-xl"><Edit className="w-5 h-5 text-brand-dark" /></button>
                        <button className="p-3 bg-brand-red rounded-xl hover:-rotate-12 transition-transform shadow-xl"><Trash2 className="w-5 h-5 text-white" /></button>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 translate-y-10 group-hover:translate-y-0 transition-all">
                        <p className="text-[8px] text-white font-black uppercase tracking-widest bg-slate-950 p-2 rounded truncate">Dokumentasi #{i}</p>
                      </div>
                    </div>
                  )) : gallery.map(item => (
                    <div key={item.id} className="aspect-square bg-white rounded-3xl border-4 border-slate-900 overflow-hidden relative group shadow-xl">
                      <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-brand-dark/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-4">
                         <button onClick={() => {
                            setEditingItem(item);
                            setGalleryForm({ title: item.title, category: item.category || 'OPERASIONAL', imageUrl: item.imageUrl });
                            setShowGalleryModal(true);
                         }} className="p-3 bg-white rounded-xl hover:scale-110 transition-transform"><Edit className="w-5 h-5 text-brand-dark" /></button>
                         <button onClick={() => handleDeleteItem('gallery', item.id)} className="p-3 bg-brand-red rounded-xl hover:scale-110 transition-transform"><Trash2 className="w-5 h-5 text-white" /></button>
                      </div>
                      <div className="absolute top-4 right-4">
                         <span className="bg-brand-red text-white text-[8px] font-black uppercase px-3 py-1 rounded-full">{item.category || 'MEDIA'}</span>
                      </div>
                      <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                         <p className="text-[10px] text-white font-bold truncate italic">{item.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'education' && (
              <motion.div key="education" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                <div className="bg-brand-dark p-12 rounded-[3.5rem] relative overflow-hidden shadow-2xl">
                  <div className="relative z-10">
                    <h3 className="text-5xl text-white font-black uppercase italic tracking-tighter mb-4">Edukasi & <span className="text-brand-red">Literasi Bahaya Api</span></h3>
                    <p className="text-slate-400 font-bold max-w-xl text-lg">Kelola materi edukasi, poster keselamatan, dan video tutorial untuk warga Malinau.</p>
                  </div>
                  <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-brand-red rounded-full blur-[120px] opacity-20" />
                </div>
                <div className="flex justify-between items-center mb-8">
                   <h4 className="text-3xl font-black uppercase italic tracking-tighter">Materi <span className="text-brand-red">Terbit</span></h4>
                   <button className="bg-brand-red px-8 py-3 rounded-xl text-white font-black italic uppercase tracking-tighter hover:scale-105 transition-all" onClick={() => {
                      setEditingItem(null);
                      setEduForm({ title: '', category: 'PENCEGAHAN', content: '', imageUrl: '' });
                      setShowEduModal(true);
                   }}>Tambah Materi</button>
                </div>
                <div className="grid gap-6">
                   {dataLoading.education ? (
                     <LoadingSpinner message="Menyusun Materi Literasi..." />
                   ) : education.length === 0 ? (
                     <div className="p-20 text-center bg-white rounded-[2rem] border-4 border-dashed border-slate-200 font-black italic text-slate-300 uppercase tracking-[0.4em]">Belum Ada Materi Edukasi...</div>
                   ) : education.map(item => (
                     <div key={item.id} className="bg-white p-8 rounded-[2rem] border-4 border-brand-dark shadow-2xl flex gap-8 items-center">
                        <div className="w-24 h-24 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 border-4 border-slate-100 overflow-hidden">
                           {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <Info className="w-8 h-8 text-slate-300" />}
                        </div>
                        <div className="flex-1">
                           <div className="flex gap-3 mb-2">
                              <span className="bg-slate-900 text-white text-[8px] font-black uppercase px-3 py-1 rounded-full">{item.category}</span>
                              <span className="bg-brand-red text-white text-[8px] font-black uppercase px-3 py-1 rounded-full">{new Date(item.createdAt).toLocaleDateString('id-ID')}</span>
                           </div>
                           <h5 className="text-xl font-black italic uppercase tracking-tighter mb-2">{item.title}</h5>
                           <p className="text-xs font-bold text-slate-400 line-clamp-1 italic">"{item.content}"</p>
                        </div>
                        <div className="flex gap-3">
                           <button onClick={() => {
                              setEditingItem(item);
                              setEduForm({ title: item.title, category: item.category, content: item.content, imageUrl: item.imageUrl || '' });
                              setShowEduModal(true);
                           }} className="p-4 bg-slate-50 text-slate-400 rounded-xl border-2 border-slate-100 hover:bg-slate-900 hover:text-white transition-all"><Edit className="w-5 h-5" /></button>
                           <button onClick={() => handleDeleteItem('education', item.id)} className="p-4 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-5 h-5" /></button>
                        </div>
                     </div>
                   ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="flex justify-between items-center bg-white p-8 rounded-3xl border-4 border-brand-dark shadow-2xl">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center"><Users className="w-6 h-6 text-white" /></div>
                      <div><h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Petugas & Admin</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manajemen Hak Akses</p></div>
                   </div>
                   <button className="bg-brand-red px-8 py-3 rounded-xl text-white font-black italic uppercase tracking-tighter shadow-xl hover:scale-105 transition-all" onClick={() => setShowUserModal(true)}>Tambah Petugas</button>
                </div>

                {dataLoading.users ? (
                  <LoadingSpinner message="Sinkronisasi Anggota Tim..." />
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {users.length === 0 ? (
                      <div className="col-span-full p-20 text-center bg-white rounded-[2rem] border-4 border-dashed border-slate-200 font-black italic text-slate-300 uppercase tracking-[0.4em]">Belum Ada Pengguna...</div>
                    ) : users.map(u => (
                    <div key={u.id} className="bg-white p-10 rounded-[2.5rem] border-4 border-slate-900 relative shadow-2xl overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-[3rem] border-l-4 border-b-4 border-slate-900 flex flex-col items-center justify-center font-black italic text-brand-red group-hover:bg-brand-red group-hover:text-white transition-all">
                        <span className="text-[8px] uppercase tracking-widest mb-1">ROLE</span>
                        <span className="text-2xl leading-none">{u.role === 'super' ? 'S' : 'A'}</span>
                      </div>
                      <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center mb-8 font-black text-4xl text-slate-300 italic group-hover:scale-110 transition-transform shadow-inner">{u.email?.[0]?.toUpperCase() || '?'}</div>
                      <h4 className="text-2xl font-black uppercase italic tracking-tighter mb-1 truncate">{u.email?.split('@')?.[0] || 'ADMIN'}</h4>
                      <p className="text-xs font-bold text-slate-400 mb-10 italic">{u.email}</p>
                      <div className="flex gap-4">
                        <button className="flex-1 bg-slate-900 text-white font-black italic uppercase tracking-tighter py-4 rounded-xl text-[10px] shadow-lg hover:bg-brand-red transition-colors" onClick={() => showToast('Edit hak akses: ' + u.email)}>Konfigurasi</button>
                        <button className="p-4 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg" onClick={() => showToast('Yakin ingin hapus?', 'error')}><Trash2 className="w-6 h-6" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
            )}

            {activeTab === 'logs' && (
              <motion.div key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="bg-white rounded-[2.5rem] border-4 border-slate-900 shadow-2xl overflow-hidden">
                   <div className="p-10 border-b-4 border-slate-900 bg-slate-50 flex justify-between items-center">
                      <h3 className="text-2xl font-black uppercase italic tracking-tighter">Audit Log Keamanan</h3>
                      <button className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-brand-red transition-all" onClick={() => showToast('Filter log diaktifkan')}>
                        <Filter className="w-5 h-5" /> Filter Riwayat
                      </button>
                   </div>
                   {dataLoading.logs ? (
                     <div className="p-20"><LoadingSpinner message="Mengambil Catatan Aktivitas..." /></div>
                   ) : (
                     <table className="w-full text-left">
                        <tbody className="divide-y-4 divide-slate-50">
                          {logs.length === 0 ? (
                            <tr><td colSpan={3} className="p-20 text-center font-black italic text-slate-200 uppercase tracking-widest">Tidak ada record aktivitas</td></tr>
                          ) : logs.map(log => (
                          <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-10 font-mono text-[10px] text-slate-400 w-64">{new Date(log.timestamp).toLocaleString('id-ID')}</td>
                            <td className="p-10">
                              <span className="px-4 py-2 bg-slate-900 text-white text-[8px] font-black italic uppercase tracking-widest rounded-lg border-2 border-slate-800 shadow-md">{log.action}</span>
                            </td>
                            <td className="p-10">
                               <p className="text-sm font-bold text-slate-600 mb-1">{log.userEmail}</p>
                               <p className="text-xs font-bold text-slate-400 italic">"{log.details}"</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                   )}
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl">
                {dataLoading.settings ? (
                  <LoadingSpinner message="Sinkronisasi Konfigurasi Sistem..." />
                ) : (
                  <div className="grid md:grid-cols-2 gap-12">
                   <div className="bg-white p-12 rounded-[3.5rem] border-4 border-slate-900 shadow-2xl space-y-10">
                      <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-6 border-b-8 border-brand-red pb-4 inline-block">Konfigurasi <span className="text-brand-red">Inti</span></h3>
                       <div className="space-y-6">
                         <div className="flex items-center gap-6">
                            <div className="w-24 h-24 bg-slate-50 border-4 border-slate-100 rounded-2xl flex items-center justify-center font-black italic text-brand-red text-3xl overflow-hidden shadow-inner shrink-0 text-center">
                               {settingsForm.logoUrl ? <img src={settingsForm.logoUrl} className="w-full h-full object-contain p-2" /> : 'DM'}
                            </div>
                            <div className="flex-1">
                               <FileUpload 
                                 label="Ganti Logo Instansi"
                                 onUploadSuccess={(url) => setSettingsForm(prev => ({ ...prev, logoUrl: url }))}
                               />
                            </div>
                         </div>
                        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nama Instansi</label>
                          <input 
                            value={settingsForm.agencyName} 
                            onChange={e => setSettingsForm(prev => ({ ...prev, agencyName: e.target.value }))}
                            className="w-full bg-slate-50 border-4 border-slate-100 rounded-2xl p-5 font-black italic outline-none focus:border-brand-red" 
                          />
                        </div>
                        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Slogan Operasional</label>
                          <input 
                            value={settingsForm.slogan} 
                            onChange={e => setSettingsForm(prev => ({ ...prev, slogan: e.target.value }))}
                            className="w-full bg-slate-50 border-4 border-slate-100 rounded-2xl p-5 font-black italic outline-none focus:border-brand-red" 
                          />
                        </div>
                        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Kontak Utama</label>
                          <input 
                            value={settingsForm.contact} 
                            onChange={e => setSettingsForm(prev => ({ ...prev, contact: e.target.value }))}
                            className="w-full bg-slate-50 border-4 border-slate-100 rounded-2xl p-5 font-black italic outline-none focus:border-brand-red" 
                          />
                        </div>
                      </div>
                      <button className="w-full py-5 bg-brand-red text-white font-black italic uppercase tracking-tighter rounded-2xl shadow-xl shadow-red-200 mt-4 hover:scale-[1.02] transition-all" onClick={handleSaveSettings}>Update Identitas</button>
                   </div>
                   <div className="space-y-12">
                      <div className="bg-white p-12 rounded-[3.5rem] border-4 border-slate-900 shadow-2xl">
                         <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-10 pb-4 border-b-8 border-slate-900 inline-block">Sistem <span className="text-brand-red">API</span></h3>
                         <div className="space-y-6">
                            <div className="p-6 bg-slate-50 rounded-2xl border-4 border-slate-100">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">WA Gateway Status</p>
                               <div className="flex justify-between items-center"><span className="text-lg font-black italic uppercase tracking-tighter text-green-500">TERHUBUNG</span><div className="w-3 h-3 bg-green-500 rounded-full animate-ping" /></div>
                            </div>
                            <div className="p-6 bg-slate-50 rounded-2xl border-4 border-slate-100">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Backup Database</p>
                               <div className="flex justify-between items-center"><span className="text-sm font-bold text-slate-500 italic">Otomatis / 24 Jam</span><button className="tag-label bg-slate-900 text-white px-6 py-2 rounded-lg" onClick={() => showToast('Dump database dimulai...')}>Backup Sekarang</button></div>
                            </div>
                         </div>
                      </div>
                      <div className="bg-brand-dark p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                          <h4 className="text-xl font-black uppercase italic italic mb-4">Update Versi App</h4>
                          <p className="text-slate-500 text-xs font-bold mb-6">Versi saat ini: 2.4.0 (Stable)<br />Terakhir diperbarui: 8 Mei 2026</p>
                          <button className="w-full py-4 bg-brand-red rounded-xl font-black italic uppercase tracking-tighter shadow-xl shadow-red-900/40">Periksa Update</button>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/10 blur-3xl" />
                      </div>
                   </div>
                  </div>
                )}
              </motion.div>
            )}
            {activeTab === 'themes' && (
              <motion.div key="themes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                <div className="flex justify-between items-center bg-white p-8 rounded-3xl border-4 border-slate-900 shadow-2xl">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-brand-red rounded-xl flex items-center justify-center shadow-lg"><LayoutDashboard className="w-6 h-6 text-white" /></div>
                      <div><h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Theme Manager</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Atur Tampilan Visual Aplikasi</p></div>
                   </div>
                   <button className="bg-brand-dark px-8 py-3 rounded-xl text-white font-black italic uppercase tracking-tighter hover:bg-brand-red transition-all shadow-xl" onClick={() => {
                      setEditingItem(null);
                      setThemeForm({
                        name: '',
                        primaryColor: '#e11d48',
                        secondaryColor: '#0f172a',
                        accentColor: '#fbbf24',
                        backgroundColor: '#f1f5f9',
                        surfaceColor: '#ffffff',
                        textColor: '#0f172a',
                        fontFamily: 'Inter',
                        isDark: false,
                        thumbnailUrl: ''
                      });
                      setShowThemeModal(true);
                   }}>Tambah Tema Baru</button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {themes.length === 0 ? (
                    <div className="col-span-full p-20 text-center bg-white rounded-[2rem] border-4 border-dashed border-slate-200">
                      <p className="text-slate-300 font-black italic uppercase tracking-[0.4em] mb-8">Belum ada katalog tema</p>
                      <button 
                        onClick={seedThemes}
                        className="bg-brand-red px-8 py-3 rounded-xl text-white font-black italic uppercase tracking-tighter hover:bg-brand-dark transition-all shadow-xl"
                      >
                        Gunakan Tema Bawaan
                      </button>
                    </div>
                  ) : themes.map(theme => (
                    <div key={theme.id} className={cn(
                      "bg-white rounded-[2.5rem] border-4 p-8 relative shadow-2xl transition-all group overflow-hidden",
                      theme.isActive ? "border-brand-red scale-[1.02]" : "border-slate-900 hover:border-brand-red opacity-80 hover:opacity-100"
                    )}>
                      {theme.isActive && (
                        <div className="absolute top-0 right-0 bg-brand-red text-white py-2 px-6 rounded-bl-[2rem] font-black italic uppercase text-[10px] tracking-widest shadow-lg z-10">TEMA AKTIF</div>
                      )}
                      
                      {/* Theme Colors Preview */}
                      <div className="aspect-video bg-slate-50 rounded-2xl mb-6 relative overflow-hidden border-2 border-slate-100 flex items-center justify-center">
                        <div className="absolute inset-0 flex">
                          <div className="flex-1" style={{ backgroundColor: theme.primaryColor }}></div>
                          <div className="flex-1" style={{ backgroundColor: theme.secondaryColor }}></div>
                          <div className="flex-1" style={{ backgroundColor: theme.backgroundColor }}></div>
                        </div>
                        <div className="relative z-10 bg-white/90 backdrop-blur-md p-4 rounded-xl border border-white font-black italic tracking-tighter text-slate-900 text-sm">{theme.name}</div>
                      </div>

                      <h4 className="text-2xl font-black uppercase italic tracking-tighter mb-2">{theme.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8 italic">Font: {theme.fontFamily} • Mode: {theme.isDark ? 'Gelap' : 'Terang'}</p>

                      <div className="flex gap-4">
                        {!theme.isActive && (
                          <button 
                            onClick={() => applyTheme(theme.id)}
                            className="flex-1 bg-brand-dark text-white font-black italic uppercase tracking-tighter py-4 rounded-xl text-[10px] hover:bg-brand-red transition-all shadow-lg"
                          >
                            Terapkan Tema
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setEditingItem(theme);
                            setThemeForm({
                              name: theme.name,
                              primaryColor: theme.primaryColor,
                              secondaryColor: theme.secondaryColor,
                              accentColor: theme.accentColor,
                              backgroundColor: theme.backgroundColor,
                              surfaceColor: theme.surfaceColor,
                              textColor: theme.textColor,
                              fontFamily: theme.fontFamily,
                              isDark: theme.isDark,
                              thumbnailUrl: theme.thumbnailUrl || ''
                            });
                            setShowThemeModal(true);
                          }}
                          className="flex-1 bg-slate-50 border-2 border-slate-100 font-black italic uppercase tracking-tighter py-4 rounded-xl text-[10px] text-slate-400 hover:border-brand-dark hover:text-brand-dark transition-all"
                        >
                          Kustomisasi
                        </button>
                        {!theme.isActive && (
                          <button 
                            onClick={() => handleDeleteItem('themes', theme.id)}
                            className="p-4 bg-red-50 text-brand-red rounded-xl hover:bg-brand-red hover:text-white transition-all shadow-md"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Default Preset Themes Tip */}
                <div className="bg-brand-dark p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden border-8 border-brand-red">
                   <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                      <div className="w-40 h-40 bg-brand-red rounded-full flex items-center justify-center shrink-0 shadow-2xl shadow-red-900/50">
                        <Settings className="w-20 h-20 text-white animate-spin-slow" />
                      </div>
                      <div className="flex-1 text-center lg:text-left">
                        <h3 className="text-4xl font-black uppercase italic tracking-tighter mb-4 leading-none">Theme <span className="text-brand-red">Import Wizard</span></h3>
                        <p className="text-slate-400 font-bold mb-8">Administrator dapat menambahkan tema kustom melalui file JSON atau ZIP konfigurasi. Semua aset warna, font, dan layout akan terintegrasi otomatis ke seluruh modul sistem.</p>
                        <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                           <button className="bg-white text-brand-dark px-10 py-4 rounded-xl font-black italic uppercase tracking-tighter text-sm shadow-xl hover:scale-105 transition-all">Upload ZIP Tema</button>
                           <button className="bg-slate-800 text-slate-400 border border-slate-700 px-10 py-4 rounded-xl font-black italic uppercase tracking-tighter text-sm transition-all hover:text-white">Ekspor Konfigurasi</button>
                        </div>
                      </div>
                   </div>
                   <div className="absolute top-0 right-0 w-[500px] h-[500px] border border-white/5 rounded-full pointer-events-none translate-x-1/2 -translate-y-1/2" />
                </div>
              </motion.div>
            )}
            {activeTab === 'banners' && (
              <motion.div key="banners" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                <div className="bg-brand-dark p-12 rounded-[3.5rem] relative overflow-hidden shadow-2xl">
                  <div className="relative z-10">
                    <h3 className="text-5xl text-white font-black uppercase italic tracking-tighter mb-4">Manajemen <span className="text-brand-red">Banner & Visual</span></h3>
                    <p className="text-slate-400 font-bold max-w-xl text-lg">Kustomisasi tampilan hero section untuk setiap halaman utama aplikasi anda.</p>
                  </div>
                  <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-brand-red rounded-full blur-[120px] opacity-20" />
                </div>

                <div className="flex justify-between items-center mb-8">
                   <h4 className="text-3xl font-black uppercase italic tracking-tighter">Daftar <span className="text-brand-red">Banner</span></h4>
                   <button onClick={seedBanners} className="bg-slate-900 px-8 py-3 rounded-xl text-white font-black italic uppercase tracking-tighter hover:bg-slate-800 transition-all">Setup Default Banner</button>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                   {dataLoading.banners ? (
                     <div className="col-span-full py-20 px-4 text-center">
                        <LoadingSpinner message="Sinkronisasi Elemen Visual..." />
                     </div>
                   ) : banners.length === 0 ? (
                     <div className="col-span-full p-20 text-center bg-white rounded-[2rem] border-4 border-dashed border-slate-200 font-black italic text-slate-300 uppercase tracking-[0.4em]">Belum Ada Konfigurasi Banner...</div>
                   ) : banners.map(banner => (
                     <div key={banner.id} className="bg-white rounded-[2.5rem] border-4 border-slate-900 overflow-hidden shadow-2xl group flex flex-col">
                        <div className="h-48 relative overflow-hidden">
                           <img src={banner.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                           <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                           <div className="absolute bottom-4 left-6">
                              <span className="bg-brand-red text-white text-[8px] font-black uppercase px-3 py-1 rounded-full mb-2 inline-block">PAGE ID: {banner.id}</span>
                              <h5 className="text-xl text-white font-black italic uppercase tracking-tighter shadow-sm">{banner.title}</h5>
                           </div>
                        </div>
                        <div className="p-8 flex-1 flex flex-col">
                           <p className="text-xs font-bold text-slate-400 italic line-clamp-2 mb-6 flex-1">"{banner.subtitle}"</p>
                           <button 
                             onClick={() => {
                               setEditingItem(banner);
                               setBannerForm({
                                 id: banner.id,
                                 title: banner.title,
                                 subtitle: banner.subtitle,
                                 imageUrl: banner.imageUrl,
                                 ctaText: banner.ctaText || '',
                                 ctaLink: banner.ctaLink || '',
                                 overlayOpacity: banner.overlayOpacity ?? 0.4,
                                 backgroundColor: banner.backgroundColor || '#0f172a',
                                 backgroundImageUrl: banner.backgroundImageUrl || '',
                                 stats: banner.stats || []
                               });
                               setShowBannerModal(true);
                             }}
                             className="w-full py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-black italic uppercase tracking-tighter flex items-center justify-center gap-3 hover:bg-brand-red hover:text-white hover:border-brand-red transition-all"
                           >
                             <Edit className="w-4 h-4" /> Edit Banner Visual
                           </button>
                        </div>
                     </div>
                   ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* MODALS */}
      <AnimatePresence>
        {/* THEME MODAL */}
        {showThemeModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowThemeModal(false)} className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white w-full max-w-4xl rounded-[3rem] border-8 border-slate-900 shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
               <div className="bg-slate-900 p-8 text-white flex justify-between items-center shrink-0">
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter">{editingItem ? 'Edit Tema Visual' : 'Tambah Tema Baru'}</h3>
                  <button onClick={() => setShowThemeModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><CloseIcon className="w-6 h-6" /></button>
               </div>
               <form onSubmit={handleSaveTheme} className="p-10 space-y-8 overflow-y-auto">
                  <div className="grid md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Tema</label>
                        <input required value={themeForm.name} onChange={e => setThemeForm({...themeForm, name: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red" placeholder="Contoh: Modern Clean" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Warna Primary</label>
                          <div className="flex gap-2">
                            <input type="color" value={themeForm.primaryColor} onChange={e => setThemeForm({...themeForm, primaryColor: e.target.value})} className="w-12 h-12 bg-white rounded-lg border-2 border-slate-100 cursor-pointer" />
                            <input value={themeForm.primaryColor} onChange={e => setThemeForm({...themeForm, primaryColor: e.target.value})} className="flex-1 bg-slate-50 border-2 border-slate-100 p-3 rounded-lg font-bold text-xs" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Warna Secondary</label>
                          <div className="flex gap-2">
                            <input type="color" value={themeForm.secondaryColor} onChange={e => setThemeForm({...themeForm, secondaryColor: e.target.value})} className="w-12 h-12 bg-white rounded-lg border-2 border-slate-100 cursor-pointer" />
                            <input value={themeForm.secondaryColor} onChange={e => setThemeForm({...themeForm, secondaryColor: e.target.value})} className="flex-1 bg-slate-50 border-2 border-slate-100 p-3 rounded-lg font-bold text-xs" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Background</label>
                          <div className="flex gap-2">
                            <input type="color" value={themeForm.backgroundColor} onChange={e => setThemeForm({...themeForm, backgroundColor: e.target.value})} className="w-12 h-12 bg-white rounded-lg border-2 border-slate-100 cursor-pointer" />
                            <input value={themeForm.backgroundColor} onChange={e => setThemeForm({...themeForm, backgroundColor: e.target.value})} className="flex-1 bg-slate-50 border-2 border-slate-100 p-3 rounded-lg font-bold text-xs" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Warna Teks</label>
                          <div className="flex gap-2">
                            <input type="color" value={themeForm.textColor} onChange={e => setThemeForm({...themeForm, textColor: e.target.value})} className="w-12 h-12 bg-white rounded-lg border-2 border-slate-100 cursor-pointer" />
                            <input value={themeForm.textColor} onChange={e => setThemeForm({...themeForm, textColor: e.target.value})} className="flex-1 bg-slate-50 border-2 border-slate-100 p-3 rounded-lg font-bold text-xs" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Font Family</label>
                        <select value={themeForm.fontFamily} onChange={e => setThemeForm({...themeForm, fontFamily: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red">
                          <option value="Inter">Inter (Default)</option>
                          <option value="Space Grotesk">Space Grotesk (Tech)</option>
                          <option value="JetBrains Mono">JetBrains Mono (Mono)</option>
                          <option value="Outfit">Outfit (Clean)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="p-8 bg-slate-900 rounded-[2rem] text-white">
                         <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-red mb-6">PREVIEW REALTIME</h4>
                         <div className="space-y-4">
                            <div className="h-10 w-full rounded-lg" style={{ backgroundColor: themeForm.primaryColor }}></div>
                            <div className="h-20 w-full rounded-2xl p-4 flex flex-col justify-end" style={{ backgroundColor: themeForm.backgroundColor, color: themeForm.textColor }}>
                               <p className="text-xl font-black italic uppercase leading-none" style={{ fontFamily: themeForm.fontFamily }}>Contoh Heading</p>
                               <p className="text-[8px] font-bold uppercase tracking-widest opacity-60">Visual Layout System</p>
                            </div>
                            <div className="flex gap-3">
                               <div className="w-12 h-12 rounded-xl" style={{ backgroundColor: themeForm.accentColor }}></div>
                               <div className="w-12 h-12 rounded-xl flex-1" style={{ backgroundColor: themeForm.surfaceColor }}></div>
                            </div>
                         </div>
                      </div>

                      <FileUpload 
                        label="Upload Thumbnail Tema (ZIP Package Support)"
                        onUploadSuccess={(url) => setThemeForm({...themeForm, thumbnailUrl: url})}
                      />
                    </div>
                  </div>

                  <div className="pt-8 border-t-4 border-slate-50">
                    <button type="submit" className="w-full py-6 bg-brand-red text-white font-black italic uppercase tracking-tighter rounded-2xl shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-4">
                      <CheckCircle className="w-6 h-6" /> {editingItem ? 'Perbarui Tema' : 'Simpan Tema Baru'}
                    </button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
        {showReportModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowReportModal(false)} className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white w-full max-w-2xl rounded-[3rem] border-8 border-slate-900 shadow-2xl relative z-10 overflow-hidden">
               <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter">Tambah Laporan Manual</h3>
                  <button onClick={() => setShowReportModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><CloseIcon className="w-6 h-6" /></button>
               </div>
               <form onSubmit={handleSaveReport} className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jenis Kejadian</label>
                       <select value={reportForm.type} onChange={e => setReportForm({...reportForm, type: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red">
                          <option>KEBAKARAN</option>
                          <option>PENYELAMATAN</option>
                          <option>MEDIS</option>
                          <option>LAINNYA</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Level Urgensi</label>
                       <select value={reportForm.level} onChange={e => setReportForm({...reportForm, level: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red">
                          <option value="normal">NORMAL (HIJAU)</option>
                          <option value="critical">KRITIS (MERAH)</option>
                       </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lokasi / Alamat</label>
                     <input required value={reportForm.location.address} onChange={e => setReportForm({...reportForm, location: {...reportForm.location, address: e.target.value}})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red" placeholder="Alamat lengkap kejadian..." />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Pelapor</label>
                       <input required value={reportForm.reporterName} onChange={e => setReportForm({...reportForm, reporterName: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nomor HP</label>
                       <input required value={reportForm.reporterPhone} onChange={e => setReportForm({...reportForm, reporterPhone: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red" placeholder="08..." />
                    </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deskripsi / Catatan Petugas</label>
                     <textarea value={reportForm.description} onChange={e => setReportForm({...reportForm, description: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red resize-none" rows={3} placeholder="Detail kejadian..." />
                  </div>
                  <button type="submit" className="w-full py-5 bg-brand-red text-white font-black italic uppercase tracking-tighter rounded-2xl shadow-xl hover:scale-[1.02] transition-all">Simpan Laporan</button>
               </form>
            </motion.div>
          </div>
        )}

        {/* NEWS MODAL */}
        {showNewsModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNewsModal(false)} className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white w-full max-w-3xl rounded-[3rem] border-8 border-slate-900 shadow-2xl relative z-10 overflow-hidden">
               <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter">{editingItem ? 'Edit Warta Berita' : 'Tambah Warta Baru'}</h3>
                  <button onClick={() => setShowNewsModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><CloseIcon className="w-6 h-6" /></button>
               </div>
               <form onSubmit={handleSaveNews} className="p-8 space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Judul Berita</label>
                     <input required value={newsForm.title} onChange={e => setNewsForm({...newsForm, title: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kategori</label>
                       <select value={newsForm.category} onChange={e => setNewsForm({...newsForm, category: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red">
                          <option>WARTA</option>
                          <option>KEGIATAN</option>
                          <option>EDUKASI</option>
                          <option>PENGUMUMAN</option>
                       </select>
                    </div>
                    <FileUpload 
                      label="Upload Gambar Berita"
                      onUploadSuccess={(url) => setNewsForm({...newsForm, imageUrl: url})}
                    />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Konten Berita (Markdown)</label>
                     <textarea required value={newsForm.content} onChange={e => setNewsForm({...newsForm, content: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red resize-none h-64" placeholder="Tulis rincian warta di sini..." />
                  </div>
                  <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black italic uppercase tracking-tighter rounded-2xl shadow-xl hover:scale-[1.02] transition-all">Publish Warta</button>
               </form>
            </motion.div>
          </div>
        )}

        {/* USER MODAL */}
        {showUserModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowUserModal(false)} className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white w-full max-w-md rounded-[3rem] border-8 border-slate-900 shadow-2xl relative z-10 overflow-hidden">
               <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter">Tambah Akses Petugas</h3>
                  <button onClick={() => setShowUserModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><CloseIcon className="w-6 h-6" /></button>
               </div>
               <form onSubmit={handleSaveUser} className="p-8 space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Petugas</label>
                     <input required type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Role Akses</label>
                     <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red">
                        <option value="admin">ADMIN (OPERASIONAL)</option>
                        <option value="super">SUPER ADMIN (KONTROL PENUH)</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Password Sementara</label>
                     <input required type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red" placeholder="Minimal 6 karakter" />
                  </div>
                  <button type="submit" className="w-full py-5 bg-brand-red text-white font-black italic uppercase tracking-tighter rounded-2xl shadow-xl hover:scale-[1.02] transition-all">Simpan Petugas</button>
               </form>
            </motion.div>
          </div>
        )}

        {/* GALLERY MODAL */}
        {showGalleryModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowGalleryModal(false)} className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white w-full max-w-md rounded-[3rem] border-8 border-slate-900 shadow-2xl relative z-10 overflow-hidden">
               <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter">Unggah Media Baru</h3>
                  <button onClick={() => setShowGalleryModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><CloseIcon className="w-6 h-6" /></button>
               </div>
               <form onSubmit={handleSaveGallery} className="p-8 space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Judul Media</label>
                     <input required value={galleryForm.title} onChange={e => setGalleryForm({...galleryForm, title: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red" placeholder="Contoh: Pemadaman di Pasar..." />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kategori</label>
                     <select value={galleryForm.category} onChange={e => setGalleryForm({...galleryForm, category: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red">
                        <option>OPERASIONAL</option>
                        <option>KEGIATAN</option>
                        <option>PELATIHAN</option>
                        <option>ALUTSISTA</option>
                     </select>
                  </div>
                  <FileUpload 
                    label="Unggah Dokumentasi Media"
                    onUploadSuccess={(url) => setGalleryForm({...galleryForm, imageUrl: url})}
                  />
                  {galleryForm.imageUrl && <div className="mt-4 rounded-xl overflow-hidden border-2 border-slate-100 aspect-video"><img src={galleryForm.imageUrl} className="w-full h-full object-cover" /></div>}
                  <button type="submit" className="w-full py-5 bg-brand-red text-white font-black italic uppercase tracking-tighter rounded-2xl shadow-xl hover:scale-[1.02] transition-all">Selesai Unggah</button>
               </form>
            </motion.div>
          </div>
        )}

        {/* EDUCATION MODAL */}
        {showEduModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEduModal(false)} className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white w-full max-w-2xl rounded-[3rem] border-8 border-slate-900 shadow-2xl relative z-10 overflow-hidden text-slate-900">
               <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter">{editingItem ? 'Edit Materi Edukasi' : 'Tambah Materi Edukasi'}</h3>
                  <button onClick={() => setShowEduModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><CloseIcon className="w-6 h-6" /></button>
               </div>
               <form onSubmit={handleSaveEdu} className="p-8 space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Judul Materi</label>
                     <input required value={eduForm.title} onChange={e => setEduForm({...eduForm, title: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kategori</label>
                       <select value={eduForm.category} onChange={e => setEduForm({...eduForm, category: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red">
                          <option>PENCEGAHAN</option>
                          <option>EVAKUASI</option>
                          <option>PERTOLONGAN</option>
                          <option>INFO UMUM</option>
                          <option>ALAT PEMADAM</option>
                          <option>PERTOLONGAN PERTAMA</option>
                       </select>
                    </div>
                    <FileUpload 
                      label="Upload Materi (PDF/IMG/VIDEO)"
                      onUploadSuccess={(url) => setEduForm({...eduForm, imageUrl: url})}
                    />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Isi Artikel / Konten</label>
                     <textarea required value={eduForm.content} onChange={e => setEduForm({...eduForm, content: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red resize-none h-48" />
                  </div>
                  <button type="submit" className="w-full py-5 bg-brand-red text-white font-black italic uppercase tracking-tighter rounded-2xl shadow-xl hover:scale-[1.02] transition-all">Simpan Materi</button>
               </form>
            </motion.div>
          </div>
        )}

        {/* PROFILE MODAL */}
        {showProfileModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowProfileModal(false)} className="absolute inset-0 bg-brand-dark/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white w-full max-w-4xl rounded-[3rem] border-8 border-slate-900 shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] text-slate-900">
               <div className="bg-slate-900 p-8 text-white flex justify-between items-center shrink-0">
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter">{editingItem ? 'Edit Konten Profil' : 'Tambah Konten Profil'}</h3>
                  <button onClick={() => setShowProfileModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><CloseIcon className="w-6 h-6" /></button>
               </div>
               <form onSubmit={handleSaveProfile} className="p-10 space-y-8 overflow-y-auto">
                  <div className="grid md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Judul Menu</label>
                          <input required value={profileForm.title} onChange={e => {
                            const newSlug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                            setProfileForm({...profileForm, title: e.target.value, slug: editingItem ? profileForm.slug : newSlug});
                          }} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red" placeholder="Contoh: Visi & Misi" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Slug URL (URL Friendly)</label>
                          <input required value={profileForm.slug} onChange={e => setProfileForm({...profileForm, slug: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red" placeholder="visi-misi" />
                       </div>
                       <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Urutan Tampil</label>
                           <input type="number" value={profileForm.order} onChange={e => setProfileForm({...profileForm, order: parseInt(e.target.value)})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red" />
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</label>
                           <select value={profileForm.isActive ? 'true' : 'false'} onChange={e => setProfileForm({...profileForm, isActive: e.target.value === 'true'})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red">
                             <option value="true">AKTIF</option>
                             <option value="false">NON-AKTIF</option>
                           </select>
                         </div>
                       </div>
                       <FileUpload 
                         label="Upload Gambar Header Profil (Opsional)"
                         onUploadSuccess={(url) => setProfileForm({...profileForm, imageUrl: url})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Konten Detail (Markdown)</label>
                       <textarea required value={profileForm.content} onChange={e => setProfileForm({...profileForm, content: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red h-[400px] resize-none font-sans" placeholder="Tulis rincian profil di sini... Dukungan format Markdown." />
                    </div>
                  </div>
                  <button type="submit" className="w-full py-6 bg-brand-red text-white font-black italic uppercase tracking-tighter rounded-2xl shadow-xl hover:scale-[1.01] transition-all">Simpan Konten Profil</button>
               </form>
            </motion.div>
          </div>
        )}

        {/* DOCUMENTATION MODAL */}
        {showDocsModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDocsModal(false)} className="absolute inset-0 bg-brand-dark/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white w-full max-w-5xl rounded-[3rem] border-8 border-slate-900 shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
               <div className="bg-slate-900 p-8 text-white flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-brand-red rounded-xl flex items-center justify-center shadow-lg"><CheckCircle className="w-6 h-6 text-white" /></div>
                     <div><h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Dokumentasi Penanganan</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {selectedReport?.id}</p></div>
                  </div>
                  <button onClick={() => setShowDocsModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><CloseIcon className="w-6 h-6" /></button>
               </div>
               <form onSubmit={handleSaveDocs} className="p-10 space-y-8 overflow-y-auto">
                  <div className="grid md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kronologi Kejadian (Narasi Lengkap)</label>
                          <textarea required value={docsForm.chronology} onChange={e => setDocsForm({...docsForm, chronology: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red h-48 resize-none" placeholder="Rincikan kejadian dari awal hingga akhir penanganan..." />
                       </div>

                       <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jumlah Personel</label>
                             <input type="number" required value={docsForm.personnel} onChange={e => setDocsForm({...docsForm, personnel: parseInt(e.target.value)})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Durasi Penanganan</label>
                             <input required value={docsForm.duration} onChange={e => setDocsForm({...docsForm, duration: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red" placeholder="Contoh: 1 Jam 30 Menit" />
                          </div>
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tindakan Yang Diambil</label>
                          <textarea required value={docsForm.actions} onChange={e => setDocsForm({...docsForm, actions: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red h-24 resize-none" placeholder="Langkah-langkah taktis petugas..." />
                       </div>
                    </div>

                    <div className="space-y-6">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 underline decoration-brand-red decoration-2">Dokumentasi Media (Foto & Video)</label>
                          <div className="grid grid-cols-2 gap-4">
                             <FileUpload 
                               label="Tambahkan Foto"
                               allowedTypes={['image/*']}
                               onUploadSuccess={(url) => setDocsForm({...docsForm, photos: [...docsForm.photos, url]})}
                             />
                             <FileUpload 
                               label="Tambahkan Video"
                               allowedTypes={['video/*']}
                               onUploadSuccess={(url) => setDocsForm({...docsForm, videos: [...docsForm.videos, url]})}
                             />
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-6 mt-4">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unit Terlibat</label>
                             <input required value={docsForm.units.join(', ')} onChange={e => setDocsForm({...docsForm, units: e.target.value.split(', ')})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red" placeholder="Contoh: Unit 01, Unit 05" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Informasi Korban</label>
                             <input required value={docsForm.victims} onChange={e => setDocsForm({...docsForm, victims: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red" />
                          </div>
                       </div>

                       <div className="p-6 bg-slate-900 rounded-[2rem] border-l-8 border-brand-red text-white flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-brand-red rounded-lg flex items-center justify-center"><Newspaper className="w-6 h-6" /></div>
                             <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Automation Feature</p><p className="text-sm font-black italic uppercase italic">Generate Berita AI (Auto)</p></div>
                          </div>
                          <div className="w-4 h-4 bg-green-500 rounded-full animate-ping" />
                       </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t-4 border-slate-50">
                    <button type="submit" className="w-full py-6 bg-brand-red text-white font-black italic uppercase tracking-tighter rounded-2xl shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-4">
                      <CheckCircle className="w-6 h-6" /> Simpan Dokumentasi & Terbitkan Berita AI
                    </button>
                    <p className="text-center text-[10px] font-bold text-slate-400 mt-4 uppercase italic">Sistem akan secara otomatis membangun narasi berita berdasarkan data di atas.</p>
                  </div>
               </form>
            </motion.div>
          </div>
        )}

        {/* BANNER MODAL */}
        {showBannerModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBannerModal(false)} className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white w-full max-w-2xl rounded-[3rem] border-8 border-slate-900 shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
               <div className="bg-slate-900 p-8 text-white flex justify-between items-center shrink-0">
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter">Manajemen Banner</h3>
                  <button onClick={() => setShowBannerModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><CloseIcon className="w-6 h-6" /></button>
               </div>
               <form onSubmit={handleSaveBanner} className="p-10 space-y-6 overflow-y-auto">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Page ID</label>
                    <input disabled value={bannerForm.id} className="w-full bg-slate-100 border-2 border-slate-100 p-4 rounded-xl font-bold opacity-60" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Judul Banner (Heading)</label>
                    <input required value={bannerForm.title} onChange={e => setBannerForm({...bannerForm, title: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sub-judul / Slogan</label>
                    <textarea required value={bannerForm.subtitle} onChange={e => setBannerForm({...bannerForm, subtitle: e.target.value})} rows={3} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red resize-none" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Teks Tombol (Opsional)</label>
                      <input value={bannerForm.ctaText} onChange={e => setBannerForm({...bannerForm, ctaText: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Link Tombol (Opsional)</label>
                      <input value={bannerForm.ctaLink} onChange={e => setBannerForm({...bannerForm, ctaLink: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Warna Latar (Banner)</label>
                      <div className="flex gap-2">
                        <input type="color" value={bannerForm.backgroundColor} onChange={e => setBannerForm({...bannerForm, backgroundColor: e.target.value})} className="w-12 h-12 bg-white rounded-lg border-2 border-slate-100 cursor-pointer" />
                        <input value={bannerForm.backgroundColor} onChange={e => setBannerForm({...bannerForm, backgroundColor: e.target.value})} className="flex-1 bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold text-xs" />
                      </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Page ID</label>
                       <div className="bg-slate-100 p-4 rounded-xl text-slate-500 font-bold uppercase text-[10px] tracking-widest">{bannerForm.id}</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tingkat Kegelapan Overlay (Brightness)</label>
                      <span className="text-brand-red font-black">{(bannerForm.overlayOpacity * 100).toFixed(0)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.05" 
                      value={bannerForm.overlayOpacity} 
                      onChange={e => setBannerForm({...bannerForm, overlayOpacity: parseFloat(e.target.value)})}
                      className="w-full accent-brand-red"
                    />
                    <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>Terang (0%)</span>
                      <span>Gelap (100%)</span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 pb-4 border-b border-slate-100">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Latar Belakang Seluruh Halaman (Opsional)</label>
                     <div className="flex gap-4 items-end">
                        <div className="flex-1">
                           <FileUpload 
                             label="Upload Background Halaman"
                             onUploadSuccess={(url) => setBannerForm({...bannerForm, backgroundImageUrl: url})}
                           />
                        </div>
                        {bannerForm.backgroundImageUrl && (
                          <button 
                            type="button" 
                            onClick={() => setBannerForm({...bannerForm, backgroundImageUrl: ''})}
                            className="p-4 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                     </div>
                     {bannerForm.backgroundImageUrl && (
                       <div className="h-20 w-32 rounded-xl border-2 border-slate-100 overflow-hidden">
                          <img src={bannerForm.backgroundImageUrl} className="w-full h-full object-cover" />
                       </div>
                     )}
                  </div>

                  {bannerForm.id === 'home' && (
                    <div className="space-y-6 pt-4">
                      <div className="flex items-center justify-between">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Statistik Beranda (Detail)</label>
                         <button 
                           type="button"
                           onClick={() => setBannerForm({...bannerForm, stats: [...bannerForm.stats, { label: 'Baru', value: '0' }]})}
                           className="text-[10px] font-black uppercase tracking-widest text-brand-red bg-red-50 px-4 py-2 rounded-lg hover:bg-brand-red hover:text-white transition-all"
                         >
                           + Tambah Stat
                         </button>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {bannerForm.stats.map((stat, idx) => (
                          <div key={idx} className="flex gap-3 items-end bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 group">
                            <div className="flex-1 space-y-2">
                               <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Label</label>
                               <input value={stat.label} onChange={e => {
                                 const newStats = [...bannerForm.stats];
                                 newStats[idx].label = e.target.value;
                                 setBannerForm({...bannerForm, stats: newStats});
                               }} className="w-full bg-white border border-slate-200 p-2 rounded-lg font-bold text-sm" />
                            </div>
                            <div className="flex-1 space-y-2">
                               <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Nilai</label>
                               <input value={stat.value} onChange={e => {
                                 const newStats = [...bannerForm.stats];
                                 newStats[idx].value = e.target.value;
                                 setBannerForm({...bannerForm, stats: newStats});
                               }} className="w-full bg-white border border-slate-200 p-2 rounded-lg font-bold text-sm" />
                            </div>
                            <button 
                              type="button"
                              onClick={() => {
                                const newStats = bannerForm.stats.filter((_, i) => i !== idx);
                                setBannerForm({...bannerForm, stats: newStats});
                              }}
                              className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 pt-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Banner Image Background (Preview)</label>
                     <div className="h-64 w-full bg-slate-100 rounded-3xl border-4 border-slate-900 overflow-hidden relative border-dashed group">
                        {bannerForm.imageUrl ? (
                          <>
                            <img src={bannerForm.imageUrl} className="w-full h-full object-cover" />
                            <div 
                              className="absolute inset-0 bg-brand-dark transition-opacity duration-300" 
                              style={{ opacity: bannerForm.overlayOpacity }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center p-8">
                               <h4 className="text-white text-3xl font-black uppercase italic tracking-tighter text-center">{bannerForm.title || 'Contoh Judul'}</h4>
                            </div>
                          </>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-black italic uppercase tracking-widest">No Image Selected</div>
                        )}
                     </div>
                     <FileUpload 
                       label="Update Banner Image"
                       onUploadSuccess={(url) => setBannerForm({...bannerForm, imageUrl: url})}
                     />
                  </div>

                  <button type="submit" className="w-full py-5 bg-brand-red text-white rounded-2xl font-black italic uppercase tracking-tighter shadow-2xl hover:bg-brand-dark transition-all mt-4">Simpan Konfigurasi Visual</button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-components helpers
function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
