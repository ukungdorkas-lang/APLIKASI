import React from "react";
import { defaultOrgData } from "../components/StrukturOrganisasi";
import { defaultPoskoData } from "../components/StatusPoskoTerpadu";
import { useReports } from "../hooks/useReports";
import DashboardStats from "../components/DashboardStats";
import ReportList from "../components/ReportList";
import ReportChart from "../components/ReportChart";
import { db, auth } from '../lib/firebase';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  doc,
  updateDoc, limit,
  deleteDoc,
  getDocs,
  where,
} from 'firebase/firestore';
import { storage } from '../lib/firebase';
import { ref, deleteObject } from 'firebase/storage';
import { generateNewsFromReport, developNarrative } from "../lib/gemini";
import {
  Bot,
  MessageSquare,
  Database,
  FileText,
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
  UserPlus,
  MapPin,
  Radio,
  Filter,
  Image as ImageIcon,
  User,
  PenTool,
  Sparkles,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  CloudLightning,
  Droplets,
  Waves,
  CloudRain,
  PlayCircle,
  FileDown,
  Eye,
  Menu,
  Siren,
  HardDrive,
  Save,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, Link } from "react-router-dom";
import { cn } from "../lib/utils";
import Markdown from "react-markdown";

import NotificationManagement from "../components/NotificationManagement";
import { handleFirestoreError } from "../lib/errorHandler";
import { OperationType } from "../types";
import WeatherWidget from "../components/WeatherWidget";

import { FileUpload } from "../components/FileUpload";
import { useTheme } from "../contexts/ThemeContext";
import { LoadingSpinner, Skeleton } from "../components/Loading";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import DashboardProfilWilayah from "./admin/DashboardProfilWilayah";

type AdminTab =
  | "overview"
  | "reports"
  | "monitoring"
  | "notifications"
  | "news"
  | "users"
  | "ai_chats"
  | "gallery"
  | "education"
  | "profiles"
  | "org_structure"
  | "posko_status"
  | "banners"
  | "settings"
  | "bank_data"
  | "logs"
  | "themes"
  | "files"
  | "internal_ops"
  | "internal_reports"
  | "internal_master";

export default function AdminDashboard({
  initialTab,
}: {
  initialTab?: AdminTab;
}) {
  const navigate = useNavigate();
  const { reports, loading: reportsLoading, updateStatus } = useReports();
  const [currentUserRole, setCurrentUserRole] = React.useState<string | null>(null);
  const [roleLoading, setRoleLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<AdminTab>(
    initialTab || "overview",
  );

  React.useEffect(() => {
    let active = true;
    const fetchRole = async () => {
      const email = auth.currentUser?.email;
      const uid = auth.currentUser?.uid;
      if (!uid) {
        if (active) setRoleLoading(false);
        return;
      }
      if (email === "ukungdorkas@gmail.com") {
        if (active) {
          setCurrentUserRole("super");
          setRoleLoading(false);
        }
        return;
      }

      try {
        // Search in admins first
        const adminQ = query(collection(db, "admins"), where("user_id", "==", uid));
        const adminSnap = await getDocs(adminQ);
        if (!adminSnap.empty) {
          const data = adminSnap.docs[0].data();
          if (active) {
            setCurrentUserRole(data.role || "admin");
            setRoleLoading(false);
          }
          return;
        }

        // Search in personnel
        const persQ = query(collection(db, "personnel"), where("user_id", "==", uid));
        const persSnap = await getDocs(persQ);
        if (!persSnap.empty) {
          const data = persSnap.docs[0].data();
          if (active) {
            setCurrentUserRole(data.role || "field_personnel");
            setRoleLoading(false);
          }
          return;
        }
      } catch (err) {
        console.error("Error fetching user role on dashboard:", err);
      }
      if (active) setRoleLoading(false);
    };

    fetchRole();
    return () => {
      active = false;
    };
  }, []);

  // Update default active tab if user is restricted
  React.useEffect(() => {
    if (!roleLoading && currentUserRole) {
      if (currentUserRole === "officer" || currentUserRole === "field_personnel") {
        if (!initialTab || initialTab === "overview") {
          setActiveTab("internal_ops");
        }
      }
    }
  }, [roleLoading, currentUserRole, initialTab]);

  // Security guard check
  React.useEffect(() => {
    if (!roleLoading && currentUserRole) {
      if (!isTabAllowed(activeTab, currentUserRole)) {
        if (currentUserRole === "officer" || currentUserRole === "field_personnel") {
          setActiveTab("internal_ops");
        } else {
          setActiveTab("overview");
        }
      }
    }
  }, [activeTab, currentUserRole, roleLoading]);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [news, setNews] = React.useState<any[]>([]);
  const [users, setUsers] = React.useState<any[]>([]);
    const [aiChats, setAiChats] = React.useState<any[]>([]);
  const [gallery, setGallery] = React.useState<any[]>([]);
  const [education, setEducation] = React.useState<any[]>([]);
  const [profileSections, setProfileSections] = React.useState<any[]>([]);
  const [bankData, setBankData] = React.useState<any[]>([]);
  const [banners, setBanners] = React.useState<any[]>([]);
  const [weatherUpstream, setWeatherUpstream] = React.useState<any[]>([]);
  const [mediaFiles, setMediaFiles] = React.useState<any[]>([]);
  const [filesLoading, setFilesLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [galleryFilter, setGalleryFilter] = React.useState<
    "SEMUA" | "OPERASIONAL" | "KEGIATAN"
  >("SEMUA");
  const [prevReportsCount, setPrevReportsCount] = React.useState(
    reports.length,
  );

  const [dataLoading, setDataLoading] = React.useState({
    news: true,
    users: true,
        gallery: true,
    education: true,
    profiles: true,
    org_structure: true,
    posko_status: true,
    banners: true,
    bank_data: true,
    settings: true,
    monitoring: true,
  });

  React.useEffect(() => {
    if (activeTab === "files") {
      loadMediaFiles();
    }
  }, [activeTab]);

  const loadMediaFiles = async () => {
    setFilesLoading(true);
    try {
      const res = await fetch("/api/files");
      const json = await res.json();
      if (json.success) {
        setMediaFiles(json.files);
      } else {
        showToast("Gagal memuat list file: " + json.error, "error");
      }
    } catch (err) {
      showToast("Gagal menload media files", "error");
    } finally {
      setFilesLoading(false);
    }
  };

  const [toast, setToast] = React.useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isFetchingAiWeather, setIsFetchingAiWeather] = React.useState(false);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
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
  const [showFloodModal, setShowFloodModal] = React.useState(false);
  const [showBankDataModal, setShowBankDataModal] = React.useState(false);
  const [showWeatherModal, setShowWeatherModal] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<any>(null);
  
  // File management models
  const [fileToRename, setFileToRename] = React.useState<{name: string} | null>(null);
  const [renameInput, setRenameInput] = React.useState("");
  const [fileToDelete, setFileToDelete] = React.useState<{name: string} | null>(null);
  const [bankDataFilter, setBankDataFilter] = React.useState("SEMUA");

  const [reportForm, setReportForm] = React.useState({
    type: "Kebakaran",
    location: { address: "", lat: 3.58, lng: 116.63 },
    reporterName: "",
    reporterPhone: "",
    description: "",
    level: "normal",
    photos: [] as string[],
  });

  const [showDocsModal, setShowDocsModal] = React.useState(false);
  const [showDetailModal, setShowDetailModal] = React.useState(false);
  const [selectedReportDetail, setSelectedReportDetail] =
    React.useState<any>(null);
  const [docsForm, setDocsForm] = React.useState({
    chronology: "",
    photos: [] as string[],
    videos: [] as string[],
    personnel: 5,
    units: ["Unit Gajah 01"],
    duration: "1 Jam",
    victims: "Nihil",
    actions: "Pemadaman total dan pendinginan",
  });
  const [selectedReport, setSelectedReport] = React.useState<any>(null);

  const [newsForm, setNewsForm] = React.useState({
    title: "",
    content: "",
    category: "WARTA",
    imageUrl:
      "https://images.unsplash.com/photo-1542343607-16076fe95b7b?auto=format&fit=crop&q=80",
  });

  const [userForm, setUserForm] = React.useState({
    email: "",
    password: "",
    role: "admin",
  });

  const [galleryForm, setGalleryForm] = React.useState({
    title: "",
    category: "OPERASIONAL",
    imageUrl: "",
    description: "",
  });

  const [eduForm, setEduForm] = React.useState({
    title: "",
    category: "PENCEGAHAN",
    content: "",
    imageUrl: "",
  });

  const [profileForm, setProfileForm] = React.useState({
    title: "",
    slug: "",
    content: "",
    order: 0,
    isActive: true,
    icon: "Info",
    imageUrl: "",
  });

  const [bannerForm, setBannerForm] = React.useState({
    id: "", // Page ID
    title: "",
    subtitle: "",
    imageUrl:
      "https://images.unsplash.com/photo-1516562309708-05f3b2b2c238?auto=format&fit=crop&q=80",
    ctaText: "",
    ctaLink: "",
    overlayOpacity: 0.4,
    backgroundColor: "#0f172a",
    backgroundImageUrl:
      "https://images.unsplash.com/photo-1516562309708-05f3b2b2c238?auto=format&fit=crop&q=80",
    stats: [] as { label: string; value: string; icon?: string }[],
  });

  const [orgDataForm, setOrgDataForm] = React.useState<any>(defaultOrgData);
  const [poskoDataForm, setPoskoDataForm] = React.useState<any[]>(defaultPoskoData);

  const [bankDataForm, setBankDataForm] = React.useState({
    title: "",
    category: "Dokumen Internal",
    fileUrl: "",
    fileType: "PDF",
    description: "",
    department: "TU",
  });

  const [riverForm, setRiverForm] = React.useState({
    locationName: "",
    waterLevel: 0,
    status: "Aman" as "Aman" | "Waspada" | "Siaga" | "Bahaya",
    trend: "stable" as "stable" | "rising" | "falling",
  });

  const [weatherForm, setWeatherForm] = React.useState({
    location: "Hulu Sungai Malinau",
    condition: "Cerah",
    rainfall: 0,
    overflowPotential: "Rendah" as
      | "Rendah"
      | "Sedang"
      | "Tinggi"
      | "Sangat Tinggi",
    summary: "",
    recommendation: "Tetap waspada dan pantau informasi resmi.",
  });

  const [filter, setFilter] = React.useState<
    "SEMUA" | "MENUNGGU" | "PROSES" | "SELESAI"
  >("SEMUA");

  const filteredReports = reports.filter((r) => {
    if (filter === "SEMUA") return true;
    if (filter === "MENUNGGU")
      return r.status === "Menunggu Penanganan" || r.status === "Menunggu";
    if (filter === "PROSES")
      return r.status === "Diproses" || r.status === "Dalam Penanganan";
    if (filter === "SELESAI") return r.status === "Selesai Ditangani";
    return true;
  });

  const { themes, applyTheme, seedThemes, loading: themesLoading } = useTheme();

  // Theme Form State
  const [showThemeModal, setShowThemeModal] = React.useState(false);
  const [themeForm, setThemeForm] = React.useState({
    name: "",
    primaryColor: "#e11d48",
    secondaryColor: "#0f172a",
    accentColor: "#fbbf24",
    backgroundColor: "#f1f5f9",
    surfaceColor: "#ffffff",
    textColor: "#0f172a",
    fontFamily: "Inter",
    isDark: false,
    thumbnailUrl: "" as string | undefined,
  });

  const THEME_PRESETS = [
    {
      name: "Classic Damkar",
      primaryColor: "#e11d48",
      secondaryColor: "#0f172a",
      accentColor: "#fbbf24",
      backgroundColor: "#f1f5f9",
      surfaceColor: "#ffffff",
      textColor: "#0f172a",
      isDark: false,
    },
    {
      name: "Night Rescue",
      primaryColor: "#f43f5e",
      secondaryColor: "#020617",
      accentColor: "#38bdf8",
      backgroundColor: "#020617",
      surfaceColor: "#0f172a",
      textColor: "#f8fafc",
      isDark: true,
    },
    {
      name: "Forest Protection",
      primaryColor: "#059669",
      secondaryColor: "#064e3b",
      accentColor: "#fbbf24",
      backgroundColor: "#f0fdf4",
      surfaceColor: "#ffffff",
      textColor: "#064e3b",
      isDark: false,
    },
    {
      name: "Steel Industrial",
      primaryColor: "#475569",
      secondaryColor: "#0f172a",
      accentColor: "#fbbf24",
      backgroundColor: "#f8fafc",
      surfaceColor: "#ffffff",
      textColor: "#1e293b",
      isDark: false,
    },
  ];

  const [settingsForm, setSettingsForm] = React.useState({
    agencyName: "DAMKAR MALINAU",
    slogan: "Pantang Pulang Sebelum Padam",
    contact: "0551-21113",
    emergencyNumber: "0553 2021476",
    logoUrl: "",
    faviconUrl: "",
    email: "",
    address: "",
    geminiApiKey: "",
    socialMedia: {
      instagram: "",
      facebook: "",
      twitter: "",
      youtube: "",
      tiktok: "",
    },
    footerText: "",
    footerCopyright: `© ${new Date().getFullYear()} PEMADAM KEBAKARAN KABUPATEN MALINAU. ALL RIGHTS RESERVED.`,
    homeLayout: {
      showAnnouncement: false,
      announcementText:
        "🚨 SIAGA DARURAT: Tetap waspada terhadap titik api di wilayah pemukiman padat.",
      announcementColor: "#e11d48",
      heroVideoUrl: "",
      showNewsSection: true,
      showGallerySection: true,
      showEducationSection: true,
      quickActions: [
        {
          title: "Kebakaran",
          label: "TANGGAP API",
          color: "bg-red-500",
          icon: "Flame",
          enabled: true,
        },
        {
          title: "Evakuasi",
          label: "EVAKUASI",
          color: "bg-orange-500",
          icon: "ShieldAlert",
          enabled: true,
        },
        {
          title: "Penyelamatan",
          label: "SAR TEAM",
          color: "bg-blue-500",
          icon: "Phone",
          enabled: true,
        },
        {
          title: "Perbantuan",
          label: "SUPPORT",
          color: "bg-slate-700",
          icon: "Info",
          enabled: true,
        },
      ],
    },
  });

  const [isAiDeveloping, setIsAiDeveloping] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleDevelopNarrative = async () => {
    if (!newsForm.content || newsForm.content.length < 20) {
      showToast("Tulis kerangka berita minimal 20 karakter", "error");
      return;
    }

    setIsAiDeveloping(true);
    try {
      const result = await developNarrative(
        newsForm.content,
        settingsForm as any,
      );
      if (result) {
        setNewsForm((prev) => ({
          ...prev,
          title: result.title || prev.title,
          content: result.content || prev.content,
        }));
        showToast("Narasi AI berhasil dikembangkan");
      } else {
        showToast("Gagal menghubungkan ke AI", "error");
      }
    } catch (err: any) {
      if (err?.message?.includes("leaked")) {
        showToast("Gagal: API Key Anda terdeteksi bocor (Leaked). Harap perbarui di pengaturan.", "error");
      } else if (err?.message?.includes("429") || err?.message?.includes("quota") || err?.message?.includes("RESOURCE_EXHAUSTED")) {
        showToast("Gagal: Kuota API Key telah habis (Quota Exceeded). Harap gunakan API Key berbayar atau tunggu beberapa saat.", "error");
      } else {
        showToast(err?.message || "Terjadi kesalahan saat menghubungi AI", "error");
      }
    } finally {
      setIsAiDeveloping(false);
    }
  };

  const handleSaveTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateDoc(doc(db, "themes", editingItem.id), themeForm);
        showToast("Tema diperbarui");
      } else {
        await addDoc(collection(db, "themes"), {
          ...themeForm,
          isActive: false,
        });
        showToast("Tema baru berhasil ditambahkan");
      }
      setShowThemeModal(false);
      setEditingItem(null);
    } catch (err) {
      showToast("Gagal menyimpan tema", "error");
    }
  };

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...reportForm,
        phoneNumber: reportForm.reporterPhone,
        status: editingItem ? editingItem.status : "Menunggu",
        createdAt: editingItem ? editingItem.createdAt : Date.now(),
        created_at: editingItem ? (editingItem.created_at || editingItem.createdAt) : Date.now(),
        newsGenerated: editingItem ? editingItem.newsGenerated : false,
      };

      if (editingItem && activeTab === "reports") {
        await updateDoc(doc(db, "reports", editingItem.id), data);
        showToast("Laporan Berhasil diperbarui");
      } else {
        await addDoc(collection(db, "reports"), data);
        showToast("Laporan manual berhasil disimpan");
      }
      setShowReportModal(false);
      setEditingItem(null);
      setReportForm({
        type: "Kebakaran",
        location: { address: "", lat: 3.58, lng: 116.63 },
        reporterName: "",
        reporterPhone: "",
        description: "",
        level: "normal",
        photos: [],
      });
    } catch (err) {
      showToast("Gagal menyimpan laporan", "error");
    }
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newsData = {
        ...newsForm,
        photos: newsForm.imageUrl ? [newsForm.imageUrl] : [],
      };

      if (editingItem) {
        await updateDoc(doc(db, "news", editingItem.id), newsData);
        showToast("Berita diperbarui");
      } else {
        await addDoc(collection(db, "news"), {
          ...newsData,
          date: Date.now(),
          status: "Publish Otomatis",
          isAIGenerated: false,
          videos: [],
          personnelCount: 0,
          unitsUsed: [],
          location: "Malinau",
        });
        showToast("Berita berhasil diterbitkan");
      }
      setShowNewsModal(false);
      setEditingItem(null);
    } catch (err) {
      showToast("Gagal menyimpan berita", "error");
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (auth.currentUser?.email !== "ukungdorkas@gmail.com") {
      showToast("Akses ditolak: Hanya Admin Utama yang dapat menambahkan petugas baru.", "error");
      return;
    }
    try {
      // In a real app we'd use Firebase Admin or a cloud function to create the user with password
      // For this prototype, we'll just add to the admins collection
      await addDoc(collection(db, "admins"), {
        email: userForm.email,
        role: userForm.role,
        createdAt: Date.now(),
      });
      setShowUserModal(false);
      showToast("Petugas berhasil ditambahkan");
    } catch (err) {
      showToast("Gagal menambahkan petugas", "error");
    }
  };

  const handleDeleteItem = async (col: string, id: string) => {
    try {
      await deleteDoc(doc(db, col, id));
      showToast("Data berhasil dihapus");
    } catch (err) {
      showToast("Gagal menghapus data", "error");
    }
  };

  const handleSaveGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateDoc(doc(db, "gallery", editingItem.id), galleryForm);
        showToast("Media diperbarui");
      } else {
        await addDoc(collection(db, "gallery"), {
          ...galleryForm,
          createdAt: Date.now(),
          created_at: Date.now(),
        });
        showToast("Media berhasil diunggah");
      }
      setShowGalleryModal(false);
      setEditingItem(null);
      setGalleryForm({
        title: "",
        category: "OPERASIONAL",
        imageUrl: "",
        description: "",
      });
    } catch (err) {
      showToast("Gagal memproses media", "error");
    }
  };

  const handleSaveEdu = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateDoc(doc(db, "education", editingItem.id), eduForm);
        showToast("Materi diperbarui");
      } else {
        await addDoc(collection(db, "education"), {
          ...eduForm,
          createdAt: Date.now(),
          created_at: Date.now(),
        });
        showToast("Materi edukasi berhasil disimpan");
      }
      setShowEduModal(false);
      setEditingItem(null);
    } catch (err) {
      showToast("Gagal menyimpan materi", "error");
    }
  };

  const exportReportsPDF = () => {
    try {
      const doc = new jsPDF();
      const timestamp = new Date().toLocaleString("id-ID");

      // Header
      doc.setFontSize(22);
      doc.setTextColor(225, 29, 72); // Brand Red
      doc.text(settingsForm.agencyName.toUpperCase(), 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("REKAPITULASI LAPORAN MASUK (EMERGENCY REPORTS)", 14, 30);
      doc.text(`Dicetak pada: ${timestamp}`, 14, 35);

      // Statistics summary
      const stats = {
        total: reports.length,
        fire: reports.filter((r) => r.type === "Kebakaran").length,
        rescue: reports.filter(
          (r) => r.type === "Penyelamatan" || r.type === "Evakuasi",
        ).length,
        resolved: reports.filter((r) => r.status === "Selesai Ditangani")
          .length,
        pending: reports.filter(
          (r) => r.status === "Menunggu" || r.status === "Menunggu Penanganan",
        ).length,
      };

      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text("RINGKASAN STATISTIK:", 14, 45);

      autoTable(doc, {
        startY: 50,
        head: [["Kategori", "Jumlah"]],
        body: [
          ["Total Laporan", stats.total.toString()],
          ["Kebakaran", stats.fire.toString()],
          ["Penyelamatan/Evakuasi", stats.rescue.toString()],
          ["Selesai Ditangani", stats.resolved.toString()],
          ["Masih Menunggu", stats.pending.toString()],
        ],
        theme: "striped",
        headStyles: { fillColor: [15, 23, 42] },
      });

      // Data Table
      doc.addPage();
      doc.setFontSize(16);
      doc.text("RINCIAN LAPORAN (DETAIL)", 14, 20);

      const tableRows = reports.map((r) => [
        new Date(r.createdAt).toLocaleString("id-ID"),
        r.type,
        r.location.address || "Malinau",
        r.reporterName,
        r.status,
        r.documentation?.personnel
          ? `${r.documentation.personnel} Petugas`
          : "-",
        r.description?.substring(0, 50) + "..." || "-",
      ]);

      autoTable(doc, {
        startY: 25,
        head: [
          [
            "Tanggal & Waktu",
            "Jenis",
            "Lokasi",
            "Pelapor",
            "Status",
            "Petugas",
            "Detail Singkat",
          ],
        ],
        body: tableRows,
        theme: "grid",
        headStyles: { fillColor: [225, 29, 72] },
        styles: { fontSize: 7, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 25 },
          2: { cellWidth: 40 },
          6: { cellWidth: 40 },
        },
      });

      doc.save(`Rekap_Laporan_Damkar_${new Date().getTime()}.pdf`);
      showToast("Rekap laporan berhasil diunduh (PDF)");
    } catch (err) {
      console.error(err);
      showToast("Gagal mengekspor PDF", "error");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateDoc(doc(db, "profile_sections", editingItem.id), {
          ...profileForm,
          updatedAt: Date.now(),
        });
        showToast("Konten profil diperbarui");
      } else {
        await addDoc(collection(db, "profile_sections"), {
          ...profileForm,
          updatedAt: Date.now(),
        });
        showToast("Konten profil baru ditambahkan");
      }
      setShowProfileModal(false);
      setEditingItem(null);
    } catch (err) {
      showToast("Gagal menyimpan profil", "error");
    }
  };

  const handleSavePoskoData = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "settings", "status_posko"), { data: poskoDataForm });
      showToast("Data posko berhasil diperbarui");
    } catch (err: any) {
      try {
        const { setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, "settings", "status_posko"), { data: poskoDataForm });
        showToast("Data posko berhasil diperbarui");
      } catch (e2) {
        showToast("Gagal menyimpan posko", "error");
      }
    }
  };

  const handleSaveOrgStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "settings", "org_structure"), { data: orgDataForm });
      showToast("Struktur organisasi berhasil diperbarui");
    } catch (err: any) {
      if (err.name === 'SyntaxError') {
         showToast("Format JSON tidak valid!", "error");
      } else {
         // Create the doc if it doesn't exist
         try {
           const { setDoc } = await import('firebase/firestore');
           await setDoc(doc(db, "settings", "org_structure"), { data: orgDataForm });
           showToast("Struktur organisasi berhasil diperbarui");
         } catch (e2) {
           showToast("Gagal menyimpan struktur", "error");
         }
      }
    }
  };

  const seedProfiles = async () => {
    try {
      showToast("Menginisialisasi profil default...");
      const defaults = [
        {
          title: "Sejarah Damkar Malinau",
          slug: "sejarah",
          content:
            "# Sejarah Damkar Malinau\n\nSatuan Pemadam Kebakaran Kabupaten Malinau dibentuk berdasarkan kebutuhan akan perlindungan keselamatan warga dari bahaya kebakaran dan bencana lainnya. Sejak berdirinya, tim kami telah berkembang menjadi satuan yang tangguh dan responsif.",
          order: 1,
          icon: "History",
          isActive: true,
        },
        {
          title: "Visi & Misi",
          slug: "visi-misi",
          content:
            "# Visi & Misi\n\n## Visi\nTerwujudnya Masyarakat Kabupaten Malinau yang Aman dan Terlindungi dari Bahaya Kebakaran.\n\n## Misi\n1. Meningkatkan respon kilat penanganan kebakaran.\n2. Mengedukasi masyarakat tentang pencegahan dini.\n3. Membangun sarana dan prasarana yang modern.",
          order: 2,
          icon: "Target",
          isActive: true,
        },
        {
          title: "Struktur Organisasi",
          slug: "struktur",
          content:
            "# Struktur Organisasi\n\nStruktur organisasi Pemadam Kebakaran Kabupaten Malinau terdiri dari Kepala Satuan, Sekretaris, serta berbagai Bidang Operasional dan Pencegahan.",
          order: 3,
          icon: "Users",
          isActive: true,
        },
        {
          title: "Letak Pos Damkar",
          slug: "pos-lokasi",
          content:
            "# Letak Pos Damkar\n\nDamkar Malinau memiliki pos-pos strategis yang tersebar:\n\n1. **Pos Komando Pusat**: Jl. Raja Alam\n2. **Pos Wilayah Utara**\n3. **Pos Wilayah Selatan**",
          order: 4,
          icon: "MapPin",
          isActive: true,
        },
      ];

      for (const item of defaults) {
        // Check if slug already exists to avoid duplicates
        const existing = profileSections.find((s) => s.slug === item.slug);
        if (!existing) {
          await addDoc(collection(db, "profile_sections"), {
            ...item,
            updatedAt: Date.now(),
            imageUrl:
              "https://images.unsplash.com/photo-1542343607-16076fe95b7b?auto=format&fit=crop&q=80",
          });
        }
      }
      showToast("Profil default berhasil disiapkan");
    } catch (err) {
      showToast("Gagal inisialisasi profil", "error");
    }
  };

  const handleFetchAiWeather = async () => {
    setIsFetchingAiWeather(true);
    try {
      let lat = 3.073;
      let lon = 116.461; // Default Hulu Sungai Malinau
      const locLower = weatherForm.location.toLowerCase();
      if (locLower.includes("kota") || locLower.includes("hilir")) {
        lat = 3.588; lon = 116.623;
      } else if (locLower.includes("mentarang")) {
        lat = 3.780; lon = 116.150;
      }

      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,precipitation,weather_code&timezone=Asia%2FJakarta`);
      const data = await response.json();
      
      let conditionText = 'Cerah';
      const code = data.current.weather_code || 0;
      if (code <= 3) conditionText = 'Berawan';
      else if (code <= 48) conditionText = 'Berkabut';
      else if (code <= 57) conditionText = 'Gerimis';
      else if (code <= 67) conditionText = 'Hujan';
      else if (code <= 82) conditionText = 'Hujan Deras';
      else if (code >= 95) conditionText = 'Badai Petir';
      
      const rainfall = data.current.precipitation || 0;
      let overflow = "Rendah";
      let recommendationText = "Tetap waspada dan pantau kondisi secara berkala.";
      if (rainfall > 50) {
        overflow = "Sangat Tinggi";
        recommendationText = "Segera siapkan tim evakuasi dan peringatkan warga bantaran sungai.";
      } else if (rainfall > 20) {
        overflow = "Tinggi";
        recommendationText = "Siagakan personel dan pantau debit air sungai secara intensif.";
      } else if (rainfall > 5) {
        overflow = "Sedang";
      }

      setWeatherForm({
        ...weatherForm,
        condition: `${conditionText} (${data.current.temperature_2m}°C, Angin: ${data.current.wind_speed_10m}km/j)`,
        rainfall: rainfall,
        overflowPotential: overflow as any,
        summary: `Cuaca saat ini ${conditionText.toLowerCase()} berdasarkan data satelit Open-Meteo pada koordinat ${lat}, ${lon}. Suhu tercatat ${data.current.temperature_2m}°C dengan kecepatan angin ${data.current.wind_speed_10m} km/jam.`,
        recommendation: recommendationText,
      });
      showToast("Data cuaca hulu berhasil ditarik via Open-Meteo (Satelit)");
    } catch (err) {
      console.error(err);
      showToast("Gagal memantau cuaca hulu via Satelit", "error");
    } finally {
      setIsFetchingAiWeather(false);
    }
  };

  const handleUpdateWeatherInline = async (id: string, locationName: string) => {
    setIsFetchingAiWeather(true);
    try {
      let lat = 3.073;
      let lon = 116.461;
      const locLower = locationName.toLowerCase();
      if (locLower.includes("kota") || locLower.includes("hilir")) {
        lat = 3.588; lon = 116.623;
      } else if (locLower.includes("mentarang")) {
        lat = 3.780; lon = 116.150;
      }

      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,precipitation,weather_code&timezone=Asia%2FJakarta`);
      const data = await response.json();
      
      let conditionText = 'Cerah';
      const code = data.current.weather_code || 0;
      if (code <= 3) conditionText = 'Berawan';
      else if (code <= 48) conditionText = 'Berkabut';
      else if (code <= 57) conditionText = 'Gerimis';
      else if (code <= 67) conditionText = 'Hujan';
      else if (code <= 82) conditionText = 'Hujan Deras';
      else if (code >= 95) conditionText = 'Badai Petir';
      
      const rainfall = data.current.precipitation || 0;
      let overflow = "Rendah";
      let recommendationText = "Tetap waspada dan pantau kondisi secara berkala.";
      if (rainfall > 50) {
        overflow = "Sangat Tinggi";
        recommendationText = "Segera siapkan tim evakuasi dan peringatkan warga bantaran sungai.";
      } else if (rainfall > 20) {
        overflow = "Tinggi";
        recommendationText = "Siagakan personel dan pantau debit air sungai secara intensif.";
      } else if (rainfall > 5) {
        overflow = "Sedang";
      }

      await updateDoc(doc(db, "weather_upstream", id), {
        condition: `${conditionText} (${data.current.temperature_2m}°C, Angin: ${data.current.wind_speed_10m}km/j)`,
        rainfall: rainfall,
        overflowPotential: overflow,
        summary: `Cuaca saat ini ${conditionText.toLowerCase()} berdasarkan data satelit Open-Meteo pada koordinat ${lat}, ${lon}. Suhu tercatat ${data.current.temperature_2m}°C dengan kecepatan angin ${data.current.wind_speed_10m} km/jam.`,
        recommendation: recommendationText,
        updatedAt: Date.now()
      });
      showToast(`Data cuaca ${locationName} berhasil diperbarui`);
    } catch (err) {
      console.error(err);
      showToast(`Gagal update cuaca ${locationName}`, "error");
    } finally {
      setIsFetchingAiWeather(false);
    }
  };

  
  const handleSaveWeather = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateDoc(doc(db, "weather_upstream", editingItem.id), {
          ...weatherForm,
          updatedAt: Date.now(),
        });
        showToast("Cuaca hulu diperbarui");
      } else {
        await addDoc(collection(db, "weather_upstream"), {
          ...weatherForm,
          updatedAt: Date.now(),
        });
        showToast("Data cuaca baru ditambahkan");
      }
      setShowWeatherModal(false);
      setEditingItem(null);
    } catch (err) {
      showToast("Gagal menyimpan data cuaca hulu", "error");
    }
  };

  const handleSaveRiver = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateDoc(doc(db, "river_monitoring", editingItem.id), riverForm);
        showToast("Data sungai diperbarui");
      } else {
        await addDoc(collection(db, "river_monitoring"), {
          ...riverForm,
          updatedAt: Date.now(),
        });
        showToast("Data sungai ditambahkan");
      }
      setShowFloodModal(false);
      setEditingItem(null);
      setRiverForm({
        locationName: "",
        waterLevel: 0,
        status: "Aman",
        trend: "stable",
      });
    } catch (err) {
      showToast("Gagal menyimpan data sungai", "error");
    }
  };

  
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Typically settings go in a singleton doc
      await updateDoc(doc(db, "settings", "app"), settingsForm);
      showToast("Pengaturan sistem diperbarui");
    } catch (err) {
      // If doc doesn't exist, try setting it
      try {
        const { setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, "settings", "app"), settingsForm);
        showToast("Pengaturan sistem diperbarui");
      } catch (e) {
        showToast("Gagal menyimpan pengaturan", "error");
      }
    }
  };

  React.useEffect(() => {
    if (reports.length > prevReportsCount) {
      const newReport = reports[0];
      if (
        newReport?.status === "Menunggu Penanganan" ||
        newReport?.status === "Menunggu"
      ) {
        const audio = new Audio(
          "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3",
        );
        audio.play().catch((e) => console.log("Audio play failed:", e));
        showToast(
          `Laporan Baru: ${newReport.type || "KEJADIAN"} di ${newReport.location?.address || "Malinau"}`,
        );
      }
    }
    setPrevReportsCount(reports.length);
  }, [reports, prevReportsCount]);

  
  React.useEffect(() => {
    if (activeTab !== "news" && activeTab !== "overview") return;
    const unsubNews = onSnapshot(
      query(collection(db, "news"), orderBy("date", "desc"), limit(25)),
      (sn) => {
        setNews(sn.docs.map((d) => ({ id: d.id, ...d.data() })));
        setDataLoading((prev) => ({ ...prev, news: false }));
      },
      (err) => {
        console.warn("Listener failed for collection: news", err);
        handleFirestoreError(err, OperationType.LIST, "news", auth);
        setDataLoading((prev) => ({ ...prev, news: false }));
      }
    );
    return () => unsubNews();
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab !== "users") return;

    let adminUsers: any[] = [];
    let personnelUsers: any[] = [];

    const updateUsers = () => {
      setUsers([...adminUsers, ...personnelUsers]);
      setDataLoading((prev) => ({ ...prev, users: false }));
    };

    const unsubUsers = onSnapshot(
      query(collection(db, "admins")),
      (snAdmins) => {
        adminUsers = snAdmins.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          role: d.data().role || "admin",
          collection: "admins",
        }));
        updateUsers();
      },
      (err) => {
        console.warn("Listener failed for collection: admins", err);
        updateUsers();
      }
    );

    const unsubPers = onSnapshot(
      query(collection(db, "personnel")),
      (snPersonnel) => {
        personnelUsers = snPersonnel.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          role: d.data().role || "field_personnel",
          collection: "personnel",
        }));
        updateUsers();
      },
      (err) => {
        console.warn("Listener failed for collection: personnel", err);
        updateUsers();
      }
    );

    return () => {
      unsubUsers();
      unsubPers();
    };
  }, [activeTab]);

  
  React.useEffect(() => {
    if (activeTab !== "ai_chats") return;
    const unsubAiChats = onSnapshot(
      query(collection(db, "ai_chats"), orderBy("timestamp", "desc"), limit(20)),
      (sn) => {
        setAiChats(sn.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => console.warn("Listener failed for collection: ai_chats", err)
    );
    return () => unsubAiChats();
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab !== "gallery" && activeTab !== "overview") return;
    const unsubGallery = onSnapshot(
      query(collection(db, "gallery"), orderBy("createdAt", "desc"), limit(25)),
      (sn) => {
        setGallery(sn.docs.map((d) => ({ id: d.id, ...d.data() })));
        setDataLoading((prev) => ({ ...prev, gallery: false }));
      },
      (err) => {
        console.warn("Listener failed for collection: gallery", err);
        handleFirestoreError(err, OperationType.LIST, "gallery", auth);
        setDataLoading((prev) => ({ ...prev, gallery: false }));
      }
    );
    return () => unsubGallery();
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab !== "education") return;
    const unsubEducation = onSnapshot(
      query(collection(db, "education"), orderBy("createdAt", "desc"), limit(20)),
      (sn) => {
        setEducation(sn.docs.map((d) => ({ id: d.id, ...d.data() })));
        setDataLoading((prev) => ({ ...prev, education: false }));
      },
      (err) => {
        console.warn("Listener failed for collection: education", err);
        handleFirestoreError(err, OperationType.LIST, "education", auth);
        setDataLoading((prev) => ({ ...prev, education: false }));
      }
    );
    return () => unsubEducation();
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab !== "profiles") return;
    const unsubProfiles = onSnapshot(
      query(collection(db, "profile_sections"), orderBy("order", "asc")),
      (sn) => {
        setProfileSections(sn.docs.map((d) => ({ id: d.id, ...d.data() })));
        setDataLoading((prev) => ({ ...prev, profiles: false }));
      },
      (err) => {
        console.warn("Listener failed for collection: profile_sections", err);
        handleFirestoreError(err, OperationType.LIST, "profile_sections", auth);
        setDataLoading((prev) => ({ ...prev, profiles: false }));
      }
    );
    return () => unsubProfiles();
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab !== "banners") return;
    const unsubBanners = onSnapshot(
      collection(db, "banners"),
      (sn) => {
        setBanners(sn.docs.map((d) => ({ id: d.id, ...d.data() })));
        setDataLoading((prev) => ({ ...prev, banners: false }));
      },
      (err) => {
        console.warn("Listener failed for collection: banners", err);
        handleFirestoreError(err, OperationType.LIST, "banners", auth);
        setDataLoading((prev) => ({ ...prev, banners: false }));
      }
    );
    return () => unsubBanners();
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab !== "org_structure") return;
    const unsubOrg = onSnapshot(doc(db, "settings", "org_structure"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().data) {
        setOrgDataForm(docSnap.data().data);
      }
      setDataLoading((prev) => ({ ...prev, org_structure: false }));
    }, (err) => {
      console.warn("Listener failed for collection: org_structure", err);
      setDataLoading((prev) => ({ ...prev, org_structure: false }));
    });
    return () => unsubOrg();
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab !== "posko_status") return;
    const unsubPosko = onSnapshot(doc(db, "settings", "status_posko"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().data) {
        setPoskoDataForm(docSnap.data().data);
      }
      setDataLoading((prev) => ({ ...prev, posko_status: false }));
    }, (err) => {
      console.warn("Listener failed for collection: status_posko", err);
      setDataLoading((prev) => ({ ...prev, posko_status: false }));
    });
    return () => unsubPosko();
  }, [activeTab]);

  React.useEffect(() => {
    // Always fetch settings to display logo in sidebar
    const unsubSettings = onSnapshot(
      doc(db, "settings", "app"),
      (snap) => {
        if (snap.exists()) {
          setSettingsForm((prev) => ({ ...prev, ...snap.data() }));
        }
        setDataLoading((prev) => ({ ...prev, settings: false }));
      },
      (err) => {
        console.warn("Listener failed for document: settings/app", err);
        handleFirestoreError(err, OperationType.GET, "settings/app", auth);
        setDataLoading((prev) => ({ ...prev, settings: false }));
      }
    );
    return () => unsubSettings();
  }, []);

  React.useEffect(() => {
    if (activeTab !== "monitoring" && activeTab !== "overview") return;
        const unsubWeather = onSnapshot(
      query(collection(db, "weather_upstream"), orderBy("updatedAt", "desc"), limit(20)),
      (sn) => {
        setWeatherUpstream(sn.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.warn("Listener failed for collection: weather_upstream", err);
        handleFirestoreError(err, OperationType.LIST, "weather_upstream", auth);
      }
    );
    return () => { unsubWeather(); };
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab !== "bank_data") return;
    const unsubBankData = onSnapshot(
      query(collection(db, "bank_data"), orderBy("createdAt", "desc"), limit(25)),
      (sn) => {
        setBankData(sn.docs.map((d) => ({ id: d.id, ...d.data() })));
        setDataLoading((prev) => ({ ...prev, bank_data: false }));
      },
      (err) => {
        console.warn("Listener failed for collection: bank_data", err);
        handleFirestoreError(err, OperationType.LIST, "bank_data", auth);
        setDataLoading((prev) => ({ ...prev, bank_data: false }));
      }
    );
    return () => unsubBankData();
  }, [activeTab]);
  

  const seedBanners = async () => {
    try {
      showToast("Menyiapkan banner default...");
      const defaults = [
        {
          id: "home",
          title: "CEPAT TANGGAP DAN PROFESIONAL",
          subtitle:
            "Kami siap melindungi masyarakat dari bahaya kebakaran dengan pelayanan cepat, akurat, dan terpercaya selama 24 jam penuh.",
          imageUrl:
            "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80",
          ctaText: "LAPOR SEKARANG",
          ctaLink: "/report",
          overlayOpacity: 0.4,
        },
        {
          id: "news",
          title: "WARTA DAMKAR",
          subtitle:
            "Informasi terkini seputar operasional, sosialisasi, dan edukasi pencegahan kebakaran di Kabupaten Malinau.",
          imageUrl:
            "https://images.unsplash.com/photo-1542343607-16076fe95b7b?auto=format&fit=crop&q=80",
          overlayOpacity: 0.6,
        },
        {
          id: "report",
          title: "PUSAT PELAPORAN",
          subtitle:
            "Laporkan kejadian darurat dengan cepat untuk penanganan segera oleh tim profesional kami.",
          imageUrl:
            "https://images.unsplash.com/photo-1629813204127-909565652516?auto=format&fit=crop&q=80",
          overlayOpacity: 0.7,
        },
        {
          id: "documentation",
          title: "GALERI EDUKASI",
          subtitle:
            "Pelajari cara pencegahan dan penanganan dini kebakaran melalui materi edukasi kami.",
          imageUrl:
            "https://images.unsplash.com/photo-1588612140404-03a893cb6294?auto=format&fit=crop&q=80",
          overlayOpacity: 0.5,
        },
        {
          id: "profile",
          title: "PROFIL INSTANSI",
          subtitle:
            "Kenali lebih dekat Satuan Pemadam Kebakaran Kabupaten Malinau, tugas, dan fungsi kami.",
          imageUrl:
            "https://images.unsplash.com/photo-1534062835843-0975877c8e54?auto=format&fit=crop&q=80",
          overlayOpacity: 0.6,
        },
        {
          id: "contact",
          title: "HUBUNGI KAMI",
          subtitle:
            "Layanan bantuan dan informasi 24 jam. Siaga melindungi masyarakat Malinau.",
          imageUrl:
            "https://images.unsplash.com/photo-1518112166137-859095980004?auto=format&fit=crop&q=80",
          overlayOpacity: 0.6,
        },
      ];

      const { setDoc } = await import('firebase/firestore');
      for (const b of defaults) {
        await setDoc(doc(db, "banners", b.id), { ...b, updatedAt: Date.now() });
      }
      showToast("Banner default berhasil disiapkan");
    } catch (err) {
      showToast("Gagal inisialisasi banner", "error");
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, "banners", bannerForm.id), {
        ...bannerForm,
        updatedAt: Date.now(),
      });
      showToast("Banner berhasil diperbarui");
      setShowBannerModal(false);
    } catch (err) {
      showToast("Gagal memperbarui banner", "error");
    }
  };

  const handleSaveBankData = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (
        !bankDataForm.fileUrl ||
        bankDataForm.fileUrl.includes("example.com")
      ) {
        showToast("Harap unggah file terlebih dahulu", "error");
        return;
      }

      const data = {
        ...bankDataForm,
        updatedAt: Date.now(),
      };

      if (editingItem && activeTab === "bank_data") {
        await updateDoc(doc(db, "bank_data", editingItem.id), data);
        showToast("Data berhasil diperbarui");
      } else {
        await addDoc(collection(db, "bank_data"), {
          ...data,
          createdAt: Date.now(),
          uploadedBy:
            auth.currentUser?.displayName || auth.currentUser?.email || "Admin",
        });
        showToast("Data berhasil disimpan");
      }
      setShowBankDataModal(false);
      setEditingItem(null);
      setBankDataForm({
        title: "",
        category: "Dokumen Internal",
        fileUrl: "",
        fileType: "PDF",
        description: "",
        department: "TU",
      });
    } catch (err) {
      showToast("Gagal menyimpan data", "error");
    }
  };

  const handleDownloadFile = (url: string, fileName: string) => {
    if (!url || url.includes("example.com")) {
      showToast("Link file tidak valid atau rusak", "error");
      return;
    }

    try {
      // If it's one of our local uploads, use the forced download API
      if (url.startsWith("/uploads/")) {
        const actualFileName = url.replace("/uploads/", "");
        window.location.href = `/api/download/${actualFileName}`;
        showToast("Download dimulai...");
        return;
      }

      // Fallback for base64 or other URLs
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName || "download");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Download dimulai...");
    } catch (err) {
      window.open(url, "_blank");
    }
  };

  const handleLogout = async () => {
        await auth.signOut();
    navigate("/login");
  };

  const handleSaveDocs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    try {
      await updateStatus(
        selectedReport.id,
        "Selesai Ditangani",
        undefined,
        docsForm,
      );
      showToast("Dokumentasi disimpan. Memproses berita AI...");

      const updatedReport = {
        ...selectedReport,
        status: "Selesai Ditangani",
        documentation: docsForm,
      };
      const newsData = await generateNewsFromReport(updatedReport);

      if (newsData) {
        await addDoc(collection(db, "news"), {
          ...newsData,
          reportId: selectedReport.id,
          date: Date.now(),
          location: selectedReport.location.address || "Malinau",
          status: "Publish Otomatis",
          isAIGenerated: true,
          photos: docsForm.photos,
          videos: docsForm.videos,
          personnelCount: newsData.personnelCount || docsForm.personnel,
          unitsUsed: newsData.unitsUsed || docsForm.units,
        });

        await updateDoc(doc(db, "reports", selectedReport.id), {
          newsGenerated: true,
        });
        showToast("Berita AI berhasil dipublikasikan!");
      }

      setShowDocsModal(false);
      setSelectedReport(null);
    } catch (err) {
      showToast("Gagal memproses dokumentasi", "error");
    }
  };

  const handleGenerateNews = async (report: any) => {
    try {
      showToast("Membangun narasi AI...");
      const newsData = await generateNewsFromReport(report, settingsForm as any);
      if (newsData) {
        await addDoc(collection(db, "news"), {
          ...newsData,
          reportId: report.id,
          date: Date.now(),
          location: report.location.address || "Malinau",
          status: "Publish Otomatis",
          isAIGenerated: true,
          photos: report.documentation?.photos || [],
          videos: report.documentation?.videos || [],
          personnelCount:
            newsData.personnelCount || report.documentation?.personnel || 0,
          unitsUsed: newsData.unitsUsed || report.documentation?.units || [],
        });
        await updateDoc(doc(db, "reports", report.id), { newsGenerated: true });

        showToast("Berita berhasil dipublikasi!");
      }
    } catch (e: any) {
      if (e?.message?.includes("leaked")) {
        showToast("Gagal: API Key Anda terdeteksi bocor (Leaked). Harap perbarui di pengaturan.", "error");
      } else if (e?.message?.includes("429") || e?.message?.includes("quota") || e?.message?.includes("RESOURCE_EXHAUSTED")) {
        showToast("Gagal: Kuota API Key telah habis (Quota Exceeded). Harap gunakan API Key berbayar atau tunggu beberapa saat.", "error");
      } else {
        showToast(e?.message || "Gagal memproses berita", "error");
      }
    }
  };

  const baseSidebarGroups = [
    {
      title: "Layanan Publik",
      items: [
        {
          id: "overview",
          name: "Overview",
          icon: <BarChart3 className="w-5 h-5" />,
        },
        {
          id: "reports",
          name: "Laporan Masuk",
          icon: <AlertTriangle className="w-5 h-5" />,
        },
        {
          id: "monitoring",
          name: "Monitoring Banjir",
          icon: <Waves className="w-5 h-5" />,
        },
        {
          id: "news",
          name: "Warta & Berita",
          icon: <Newspaper className="w-5 h-5" />,
        },
        {
          id: "gallery",
          name: "Dokumentasi",
          icon: <ImageIcon className="w-5 h-5" />,
        },
        {
          id: "education",
          name: "Edukasi Warga",
          icon: <Info className="w-5 h-5" />,
        },
        {
          id: "profiles",
          name: "Manajemen Profil",
          icon: <User className="w-5 h-5" />,
        },
        {
          id: "org_structure",
          name: "Struktur Organisasi",
          icon: <Users className="w-5 h-5" />,
        },
        {
          id: "posko_status",
          name: "Kesiapan Posko",
          icon: <Siren className="w-5 h-5" />,
        },
        {
          id: "banners",
          name: "Manajemen Banner",
          icon: <ImageIcon className="w-5 h-5" />,
        },
        {
          id: "notifications",
          name: "Sistem Notif",
          icon: <Bell className="w-5 h-5" />,
        },
      ],
    },
    {
      title: "Layanan Internal",
      items: [
        {
          id: "internal_ops",
          name: "Dashboard Piket",
          icon: <LayoutDashboard className="w-5 h-5" />,
          path: "/staff/ops",
        },
        {
          id: "internal_reports",
          name: "Input Laporan",
          icon: <FileText className="w-5 h-5" />,
          path: "/staff/reports",
        },
        {
          id: "internal_master",
          name: "Data Master",
          icon: <Database className="w-5 h-5" />,
          path: "/staff/master/personnel",
        },
        {
          id: "bank_data",
          name: "Bank Data",
          icon: <FileDown className="w-5 h-5" />,
        },
      ],
    },
    {
      title: "Sistem",
      items: [
        {
          id: "users",
          name: "Admin & Petugas",
          icon: <Users className="w-5 h-5" />,
        },
                {
          id: "ai_chats",
          name: "Riwayat Chat AI",
          icon: <Bot className="w-5 h-5" />,
        },
        {
          id: "themes",
          name: "Manajemen Tema",
          icon: <Sparkles className="w-5 h-5" />,
        },
        {
          id: "files",
          name: "Pengelola File",
          icon: <HardDrive className="w-5 h-5" />,
        },
        {
          id: "settings",
          name: "Pengaturan",
          icon: <Settings className="w-5 h-5" />,
        },
      ],
    },
  ];

  const filteredSidebarGroups = React.useMemo(() => {
    if (roleLoading) return [];
    if (currentUserRole === "super") {
      return baseSidebarGroups;
    }
    if (currentUserRole === "admin") {
      return baseSidebarGroups.filter(
        (group) => group.title === "Layanan Publik" || group.title === "Layanan Internal"
      );
    }
    if (currentUserRole === "officer" || currentUserRole === "field_personnel") {
      return baseSidebarGroups.filter(
        (group) => group.title === "Layanan Internal"
      );
    }
    return baseSidebarGroups.filter(
      (group) => group.title === "Layanan Internal"
    );
  }, [currentUserRole, roleLoading]);

  const isTabAllowed = (tab: AdminTab, role: string | null) => {
    if (!role) return false;
    if (role === "super") return true; 
    
    if (role === "admin") {
      const allowedPublik = [
        "overview", "reports", "monitoring", "news", "gallery", 
        "education", "profiles", "org_structure", "posko_status", 
        "banners", "notifications"
      ];
      const allowedInternal = [
        "internal_ops", "internal_reports", "internal_master", "bank_data"
      ];
      return allowedPublik.includes(tab) || allowedInternal.includes(tab);
    }
    
    if (role === "officer" || role === "field_personnel") {
      const allowedInternal = [
        "internal_ops", "internal_reports", "internal_master", "bank_data"
      ];
      return allowedInternal.includes(tab);
    }
    
    return false;
  };

  const sidebarItems = filteredSidebarGroups.flatMap((g) => g.items);

  if (roleLoading) {
    return (
      <div key="role-loading-wrapper" className="min-h-screen bg-brand-dark flex items-center justify-center">
        <LoadingSpinner message="MEMVERIFIKASI OTORITAS AKSES PANEL..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex overflow-hidden">
      {/* Toast Notification */}
      <div id="toast-container" key="toast-wrapper">
        <AnimatePresence mode="wait">
          {toast && (
            <motion.div
              key={`toast-${toast.type}`}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                "fixed bottom-10 right-10 z-[100] px-8 py-4 rounded-2xl font-black italic uppercase tracking-tighter shadow-2xl flex items-center gap-3 border-4",
                toast.type === "success"
                  ? "bg-slate-900 text-white border-brand-red"
                  : "bg-red-500 text-white border-red-900",
              )}
            >
              {toast.type === "success" ? (
                <CheckCircle className="w-6 h-6 text-brand-red" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sidebar Desktop & Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <aside className={cn(
        "w-72 bg-brand-dark flex flex-col fixed h-full z-50 border-r border-white/5 transition-transform duration-300",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-10 text-center relative">
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl transition-all"
            aria-label="Close menu"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
          <Link to="/" className="flex flex-col items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="w-12 h-12 bg-brand-red rounded-xl flex items-center justify-center shadow-lg shadow-red-900/40 relative overflow-hidden">
              {settingsForm.logoUrl ? (
                <img src={settingsForm.logoUrl} alt="Logo" className="w-full h-full object-contain p-1.5 relative z-10" />
              ) : (
                <ShieldAlert className="text-white w-7 h-7 relative z-10" />
              )}
            </div>
            <div>
              <h1 className="font-display font-black tracking-tighter text-xl leading-none text-white uppercase italic">
                SI-<span className="text-brand-red">DAMKAR</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">
                MALINAU PRO
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar pb-10">
          {filteredSidebarGroups.map((group) => (
            <div key={group.title}>
              <p className="px-6 mb-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] italic">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.path) {
                        navigate(item.path);
                      } else {
                        setActiveTab(item.id as AdminTab);
                      }
                      setIsMobileMenuOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all font-bold text-sm",
                      activeTab === item.id
                        ? "bg-brand-red text-white shadow-xl shadow-red-900/20"
                        : "text-slate-400 hover:text-white hover:bg-white/5",
                    )}
                  >
                    <span
                      className={cn(
                        activeTab === item.id ? "text-white" : "text-slate-500",
                      )}
                    >
                      {item.icon}
                    </span>
                    <span className="uppercase tracking-widest text-[11px] italic leading-none">
                      {item.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5">
          <div className="bg-white/5 rounded-2xl p-4 mb-4 border border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 overflow-hidden">
              <User className="text-slate-400 w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">
                {auth.currentUser?.email?.split("@")[0] || "Admin"}
              </p>
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                Operator
              </p>
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
      <main className="flex-1 lg:ml-72 overflow-x-auto overflow-y-auto min-h-screen w-full">
        {/* Header Bar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 h-20 flex items-center justify-between px-6 md:px-10 sticky top-0 z-30">
          <div className="flex items-center gap-4 md:gap-10 flex-1">
            <button
              className="lg:hidden p-2 text-slate-500 hover:text-brand-red bg-slate-100 rounded-xl transition-all"
              onClick={() => setIsMobileMenuOpen(true)}
            >
               <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-baseline gap-2 hidden md:flex">
              <h2 className="text-xl font-display font-black text-slate-900 uppercase tracking-tighter">
                {sidebarItems.find((i) => i.id === activeTab)?.name}
              </h2>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-2" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Dashboard
              </span>
            </div>

            <div className="relative max-w-sm w-full group hidden sm:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-brand-red transition-colors" />
              <input
                className="w-full bg-slate-100 border-none rounded-xl py-2.5 pl-12 pr-4 focus:bg-white focus:ring-2 focus:ring-brand-red/10 outline-none font-medium text-sm transition-all"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex -space-x-2 hidden md:flex">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500"
                >
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
            <div className="h-8 w-px bg-slate-100 hidden sm:block" />
            <div className="flex items-center gap-4 hidden sm:flex">
              <div className="text-right hidden md:block">
                <div className="text-xs font-bold text-slate-900 leading-none">
                  Status:{" "}
                  <span className="text-green-500 uppercase tracking-widest text-[9px]">
                    Online
                  </span>
                </div>
                <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">
                  Server Malinau-01
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-green-50 border-4 border-white shadow-sm flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>
            </div>
          </div>
        </header>

        <div
          id="admin-main-content"
          className="p-4 sm:p-6 md:p-10 lg:p-12"
          key="admin-dynamic-content-wrapper"
        >
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === "overview" && (
              <motion.div
                key="overview-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-12"
              >
                <DashboardStats reports={reports} />
                <div className="grid lg:grid-cols-12 gap-10 mt-10">
                  <div className="lg:col-span-8 bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-10">
                      <h3 className="text-lg font-display font-black text-slate-900 uppercase tracking-tighter italic">
                        Live Monitor{" "}
                        <span className="text-brand-red">Realtime</span>
                      </h3>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={exportReportsPDF}
                          className="flex items-center gap-2 bg-brand-red text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-brand-dark transition-all shadow-md"
                        >
                          <FileDown className="w-3 h-3" /> Unduh Rekap Laporan
                        </button>
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-500 uppercase">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse" />
                          Updated 2m ago
                        </div>
                      </div>
                    </div>
                    <div className="aspect-[16/9] w-full min-h-[400px] h-full sm:min-h-0 bg-slate-50 rounded-3xl overflow-hidden relative border border-slate-100 p-2 md:p-6 pb-0">
                      <ReportChart reports={reports} />
                    </div>

                    <div className="mt-10 pt-10 border-t border-slate-100">
                      <h4 className="text-sm font-black uppercase italic tracking-tighter mb-6 flex items-center gap-3">
                        <CloudLightning className="w-5 h-5 text-brand-red" />{" "}
                        Akses Cepat{" "}
                        <span className="text-brand-red">Layanan Pro</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <button
                          onClick={() => navigate("/staff/ops")}
                          className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-brand-red hover:bg-white hover:shadow-xl transition-all group text-left"
                        >
                          <LayoutDashboard className="w-6 h-6 text-slate-400 group-hover:text-brand-red mb-3" />
                          <p className="text-[10px] font-black uppercase italic tracking-tighter">
                            Dashboard Piket
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase italic">
                            Operasional Personil
                          </p>
                        </button>
                        <button
                          onClick={() => navigate("/staff/reports")}
                          className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-brand-red hover:bg-white hover:shadow-xl transition-all group text-left"
                        >
                          <FileText className="w-6 h-6 text-slate-400 group-hover:text-brand-red mb-3" />
                          <p className="text-[10px] font-black uppercase italic tracking-tighter">
                            Input Laporan
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase italic">
                            Log Kejadian Internal
                          </p>
                        </button>
                        <button
                          onClick={() => navigate("/staff/master/personnel")}
                          className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-brand-red hover:bg-white hover:shadow-xl transition-all group text-left"
                        >
                          <Database className="w-6 h-6 text-slate-400 group-hover:text-brand-red mb-3" />
                          <p className="text-[10px] font-black uppercase italic tracking-tighter">
                            Data Master
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase italic">
                            Personil & Regu
                          </p>
                        </button>
                        <button
                          onClick={() => {
                            if (
                              window.location.pathname.startsWith(
                                "/staff/settings",
                              )
                            ) {
                              setActiveTab("settings");
                            } else {
                              navigate("/staff/settings");
                            }
                          }}
                          className="p-6 bg-brand-red/5 rounded-2xl border-2 border-brand-red/20 hover:border-brand-red hover:bg-white hover:shadow-xl transition-all group text-left"
                        >
                          <Settings className="w-6 h-6 text-brand-red group-hover:rotate-45 transition-transform mb-3" />
                          <p className="text-[10px] font-black uppercase italic tracking-tighter text-brand-red">
                            Pengaturan Sistem
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase italic">
                            Konfigurasi & AI
                          </p>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-4 flex flex-col gap-8">
                    <div className="bg-brand-dark p-5 md:p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group border border-white/5">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-brand-red/10 blur-[100px] rounded-full" />
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 italic">
                        Tutorial Login & Akses
                      </h4>
                      <div className="space-y-4">
                        <div className="flex gap-4 items-start">
                          <div className="w-6 h-6 bg-brand-red rounded-lg flex items-center justify-center shrink-0 font-black italic text-xs">
                            1
                          </div>
                          <p className="text-[11px] font-bold text-slate-300 leading-relaxed italic">
                            Gunakan Tombol{" "}
                            <span className="text-white underline">
                              LOGIN PETUGAS
                            </span>{" "}
                            di halaman utama untuk masuk sebagai personil.
                          </p>
                        </div>
                        <div className="flex gap-4 items-start">
                          <div className="w-6 h-6 bg-brand-red rounded-lg flex items-center justify-center shrink-0 font-black italic text-xs">
                            2
                          </div>
                          <p className="text-[11px] font-bold text-slate-300 leading-relaxed italic">
                            Setelah login, anda akan diarahkan ke{" "}
                            <span className="text-white">Dashboard Piket</span>{" "}
                            khusus operasional.
                          </p>
                        </div>
                        <div className="flex gap-4 items-start">
                          <div className="w-6 h-6 bg-brand-red rounded-lg flex items-center justify-center shrink-0 font-black italic text-xs">
                            3
                          </div>
                          <p className="text-[11px] font-bold text-slate-300 leading-relaxed italic">
                            Menu{" "}
                            <span className="text-brand-red uppercase">
                              Layanan Internal
                            </span>{" "}
                            di sidebar kiri menghubungkan semua modul Si-Damkar
                            Pro.
                          </p>
                        </div>
                        <div className="flex gap-4 items-start">
                          <div className="w-6 h-6 bg-brand-red rounded-lg flex items-center justify-center shrink-0 font-black italic text-xs">
                            4
                          </div>
                          <p className="text-[11px] font-bold text-slate-300 leading-relaxed italic">
                            Gunakan Menu{" "}
                            <span className="text-white">Pengaturan</span> untuk
                            menyesuaikan logo, nama instansi, dan integrasi AI.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-5 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-brand-red/10 rounded-xl flex items-center justify-center">
                          <Radio className="w-5 h-5 text-brand-red" />
                        </div>
                        <h4 className="text-lg font-display font-black text-slate-900 uppercase tracking-tighter">
                          Quick{" "}
                          <span className="text-brand-red">Broadcast</span>
                        </h4>
                      </div>
                      <textarea
                        className="w-full bg-slate-50 border-none rounded-xl p-4 text-xs font-semibold mb-6 outline-none resize-none focus:ring-2 focus:ring-brand-red/10 transition-all"
                        placeholder="Tulis pesan darurat untuk semua unit..."
                        rows={4}
                      />
                      <button
                        className="w-full py-4 bg-brand-dark text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-red transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                        onClick={() =>
                          showToast("Broadcast terkirim ke semua petugas!")
                        }
                      >
                        Push to WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "reports" && (
              <motion.div
                key="reports"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <div className="flex flex-wrap justify-between items-center gap-6 bg-white p-5 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none max-w-full shrink-0">
                    {["SEMUA", "MENUNGGU", "PROSES", "SELESAI"].map((f) => (
                      <button
                        key={`report-filter-${f}`}
                        onClick={() => setFilter(f as any)}
                        className={cn(
                          "px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase",
                          filter === f
                            ? "bg-brand-red text-white shadow-lg shadow-red-900/20"
                            : "bg-slate-50 text-slate-400 hover:bg-slate-100",
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
                  <button
                    className="flex items-center gap-3 bg-white border-2 border-slate-900 text-slate-900 font-black text-[10px] tracking-widest uppercase px-8 py-4 rounded-xl shadow-xl hover:bg-slate-50 transition-all active:scale-95"
                    onClick={exportReportsPDF}
                  >
                    <FileDown className="w-4 h-4" /> Export Recap
                  </button>
                </div>

                <div className="grid gap-6">
                  {filteredReports.length === 0 ? (
                    <div className="bg-white/50 backdrop-blur-sm p-12 md:p-24 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
                      <ShieldAlert className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold italic uppercase tracking-[0.4em] text-xs">
                        No reports found in this category
                      </p>
                    </div>
                  ) : (
                    filteredReports.map((report) => (
                      <motion.div
                        layout
                        key={report.id}
                        className="bg-white p-5 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all relative group overflow-hidden"
                      >
                        <div className="flex flex-wrap justify-between items-start gap-8">
                          <div className="flex items-start gap-6 flex-1 min-w-[300px]">
                            <div
                              className={cn(
                                "w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-display font-black leading-none shrink-0 shadow-inner",
                                report.level === "critical"
                                  ? "bg-red-50 text-brand-red"
                                  : "bg-slate-50 text-slate-900",
                              )}
                            >
                              <span className="text-[9px] opacity-50 mb-1 uppercase tracking-tighter">
                                Level
                              </span>
                              <span className="text-3xl tracking-tighter">
                                {report.level === "critical" ? "01" : "03"}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-3">
                                <h4 className="text-2xl font-display font-black text-slate-900 uppercase tracking-tighter group-hover:text-brand-red transition-colors">
                                  {report.type}
                                </h4>
                                <span
                                  className={cn(
                                    "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                    report.status === "Menunggu Penanganan" ||
                                      report.status === "Menunggu"
                                      ? "bg-amber-50 text-amber-600 border-amber-100"
                                      : report.status === "Diproses"
                                        ? "bg-blue-50 text-blue-600 border-blue-100"
                                        : report.status === "Dalam Penanganan"
                                          ? "bg-brand-red/5 text-brand-red border-brand-red/10"
                                          : "bg-green-50 text-green-600 border-green-100",
                                  )}
                                >
                                  {report.status}
                                </span>
                              </div>
                              <p className="text-slate-500 font-medium mb-6 flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-brand-red" />{" "}
                                {report.location.address || "Malinau Seberang"}
                              </p>

                              <div className="flex flex-wrap gap-8 py-6 border-t border-slate-50">
                                <div>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    Reporter
                                  </p>
                                  <p className="text-sm font-black text-slate-900 uppercase font-display italic tracking-tighter">
                                    {report.reporterName}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    Contact
                                  </p>
                                  <p className="text-sm font-black text-slate-900 uppercase font-display italic tracking-tighter">
                                    {report.phoneNumber}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    Time Received
                                  </p>
                                  <p className="text-sm font-black text-slate-400 uppercase font-display italic tracking-tighter">
                                    {new Date(
                                      report.createdAt,
                                    ).toLocaleTimeString("id-ID")}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-3 self-center">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedReportDetail(report);
                                  setShowDetailModal(true);
                                }}
                                className="p-4 bg-slate-900 text-white rounded-xl shadow-inner hover:bg-brand-red transition-all"
                                title="Lihat Detail Riwayat"
                              >
                                <Search className="w-5 h-5" />
                              </button>
                              {(report.status === "Menunggu Penanganan" ||
                                report.status === "Menunggu") && (
                                <button
                                  onClick={() =>
                                    updateStatus(report.id, "Diproses")
                                  }
                                  className="p-4 bg-brand-dark text-white rounded-xl shadow-lg hover:bg-brand-red transition-all hover:scale-110"
                                  title="Proses Laporan"
                                >
                                  <Radio className="w-5 h-5" />
                                </button>
                              )}
                              {report.status === "Diproses" && (
                                <button
                                  onClick={() =>
                                    updateStatus(report.id, "Dalam Penanganan")
                                  }
                                  className="p-4 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all hover:scale-110"
                                  title="Tangani Kejadian"
                                >
                                  <AlertCircle className="w-5 h-5" />
                                </button>
                              )}
                              {(report.status === "Diproses" ||
                                report.status === "Dalam Penanganan") && (
                                <button
                                  onClick={() => {
                                    setSelectedReport(report);
                                    setDocsForm({
                                      chronology: report.description,
                                      photos: [],
                                      videos: [],
                                      personnel: 5,
                                      units: ["Unit Gajah 01"],
                                      duration: "1 Jam",
                                      victims: "Nihil",
                                      actions: "",
                                    });
                                    setShowDocsModal(true);
                                  }}
                                  className="p-4 bg-green-500 text-white rounded-xl shadow-lg hover:bg-green-600 transition-all hover:scale-110"
                                  title="Selesaikan & Dokumentasi"
                                >
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                              )}
                              {report.status === "Selesai Ditangani" &&
                                !report.newsGenerated && (
                                  <button
                                    onClick={() => handleGenerateNews(report)}
                                    className="p-4 bg-brand-red text-white rounded-xl shadow-lg hover:bg-brand-dark transition-all hover:scale-110"
                                    title="Generate Berita AI"
                                  >
                                    <Newspaper className="w-5 h-5" />
                                  </button>
                                )}
                              <button
                                onClick={() =>
                                  handleDeleteItem("reports", report.id)
                                }
                                className="p-4 text-slate-300 hover:text-red-500 transition-colors"
                                title="Delete Report"
                              >
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

            {activeTab === "profiles" && (
              <motion.div
                key="profiles"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-12"
              >
                <div className="bg-brand-dark p-6 lg:p-12 rounded-[3.5rem] relative overflow-hidden shadow-2xl">
                  <div className="relative z-10">
                    <h3 className="text-3xl md:text-5xl text-white font-black uppercase italic tracking-tighter mb-4">
                      Profil &{" "}
                      <span className="text-brand-red">Informasi Instansi</span>
                    </h3>
                    <p className="text-slate-400 font-bold max-w-xl text-lg">
                      Kelola sejarah, visi misi, struktur organisasi, dan profil
                      resmi Damkar Malinau.
                    </p>
                  </div>
                  <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-brand-red rounded-full blur-[120px] opacity-20" />
                </div>
                <div className="flex justify-between items-center mb-8">
                  <h4 className="text-3xl font-black uppercase italic tracking-tighter">
                    Menu <span className="text-brand-red">Profil</span>
                  </h4>
                  <div className="flex gap-4">
                    <button
                      onClick={seedProfiles}
                      className="bg-slate-900 px-8 py-3 rounded-xl text-white font-black italic uppercase tracking-tighter hover:bg-slate-800 transition-all"
                    >
                      Setup Default
                    </button>
                    <button
                      className="bg-brand-red px-8 py-3 rounded-xl text-white font-black italic uppercase tracking-tighter hover:scale-105 transition-all"
                      onClick={() => {
                        setEditingItem(null);
                        setProfileForm({
                          title: "",
                          slug: "",
                          content: "",
                          order: profileSections.length + 1,
                          isActive: true,
                          icon: "Info",
                          imageUrl: "",
                        });
                        setShowProfileModal(true);
                      }}
                    >
                      Tambah Menu Profil
                    </button>
                  </div>
                </div>
                <div className="grid gap-6">
                  {dataLoading.profiles ? (
                    <LoadingSpinner message="Menyusun Struktur Profil..." />
                  ) : profileSections.length === 0 ? (
                    <div className="p-20 text-center bg-white rounded-[2rem] border-4 border-dashed border-slate-200 font-black italic text-slate-300 uppercase tracking-[0.4em]">
                      Belum Ada Konten Profil...
                    </div>
                  ) : (
                    profileSections.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white p-5 md:p-8 rounded-[2rem] border-4 border-brand-dark shadow-2xl flex gap-8 items-center"
                      >
                        <div className="w-24 h-24 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 border-4 border-slate-100 overflow-hidden">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Info className="w-8 h-8 text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex gap-3 mb-2">
                            <span className="bg-slate-900 text-white text-[8px] font-black uppercase px-3 py-1 rounded-full">
                              /{item.slug}
                            </span>
                            <span
                              className={cn(
                                "text-white text-[8px] font-black uppercase px-3 py-1 rounded-full",
                                item.isActive ? "bg-green-500" : "bg-slate-400",
                              )}
                            >
                              {item.isActive ? "AKTIF" : "NON-AKTIF"}
                            </span>
                          </div>
                          <h5 className="text-xl font-black italic uppercase tracking-tighter mb-1">
                            {item.title}
                          </h5>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Urutan: {item.order}
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setProfileForm({
                                title: item.title,
                                slug: item.slug,
                                content: item.content,
                                order: item.order,
                                isActive: item.isActive,
                                icon: item.icon || "Info",
                                imageUrl: item.imageUrl || "",
                              });
                              setShowProfileModal(true);
                            }}
                            className="p-4 bg-slate-50 text-slate-400 rounded-xl border-2 border-slate-100 hover:bg-slate-900 hover:text-white transition-all"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteItem("profile_sections", item.id)
                            }
                            className="p-4 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-12">
                  <DashboardProfilWilayah />
                </div>
              </motion.div>
            )}

            {activeTab === "org_structure" && (
              <motion.div
                key="org_structure"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-12"
              >
                <div className="bg-brand-dark p-6 lg:p-12 rounded-[3.5rem] relative overflow-hidden shadow-2xl">
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                      <h3 className="text-3xl md:text-5xl text-white font-black uppercase italic tracking-tighter mb-4">
                        Struktur <span className="text-brand-red">Organisasi</span>
                      </h3>
                      <p className="text-slate-400 font-bold max-w-xl text-lg">
                        Ubah data diagram pohon pegawai. Edit bagian JSON di bawah untuk mengubah formasi pegawai.
                      </p>
                    </div>
                  </div>
                  <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-brand-red rounded-full blur-[120px] opacity-20" />
                </div>

                <div className="bg-white p-6 md:p-10 rounded-[3.5rem] border-2 border-slate-100 shadow-2xl">
                  <form onSubmit={handleSaveOrgStructure} className="space-y-6">
                    <div className="space-y-12">
                      {/* Top Level Management */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Kepala Dinas */}
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                          <h4 className="font-bold text-slate-800 text-lg mb-6 border-b border-slate-200 pb-3 uppercase">Kepala Dinas</h4>
                          <div className="space-y-5">
                            <div>
                              <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">Nama Lengkap</label>
                              <input type="text" value={orgDataForm?.kepala?.nama || ''} onChange={(e) => { const nd = JSON.parse(JSON.stringify(orgDataForm)); nd.kepala.nama = e.target.value; setOrgDataForm(nd); }} className="w-full border-2 border-slate-200 px-4 py-3 rounded-xl bg-white font-medium text-slate-800 focus:border-brand-red focus:outline-none transition-colors" placeholder="Masukkan nama..." />
                            </div>
                            <div>
                              <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">Jabatan</label>
                              <input type="text" value={orgDataForm?.kepala?.jabatan || ''} onChange={(e) => { const nd = JSON.parse(JSON.stringify(orgDataForm)); nd.kepala.jabatan = e.target.value; setOrgDataForm(nd); }} className="w-full border-2 border-slate-200 px-4 py-3 rounded-xl bg-white font-medium text-slate-800 focus:border-brand-red focus:outline-none transition-colors" placeholder="Masukkan jabatan..." />
                            </div>
                            <div>
                              <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">Foto URL</label>
                              <FileUpload label="Upload Foto" initialUrl={orgDataForm?.kepala?.foto} onUploadSuccess={(url) => { const nd = JSON.parse(JSON.stringify(orgDataForm)); nd.kepala.foto = url; setOrgDataForm(nd); }} />
                            </div>
                          </div>
                        </div>

                        {/* Sekretaris */}
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                          <h4 className="font-bold text-slate-800 text-lg mb-6 border-b border-slate-200 pb-3 uppercase">Sekretaris</h4>
                          <div className="space-y-5">
                            <div>
                              <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">Nama Lengkap</label>
                              <input type="text" value={orgDataForm?.sekretaris?.nama || ''} onChange={(e) => { const nd = JSON.parse(JSON.stringify(orgDataForm)); nd.sekretaris.nama = e.target.value; setOrgDataForm(nd); }} className="w-full border-2 border-slate-200 px-4 py-3 rounded-xl bg-white font-medium text-slate-800 focus:border-brand-red focus:outline-none transition-colors" placeholder="Masukkan nama..." />
                            </div>
                            <div>
                              <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">Jabatan</label>
                              <input type="text" value={orgDataForm?.sekretaris?.jabatan || ''} onChange={(e) => { const nd = JSON.parse(JSON.stringify(orgDataForm)); nd.sekretaris.jabatan = e.target.value; setOrgDataForm(nd); }} className="w-full border-2 border-slate-200 px-4 py-3 rounded-xl bg-white font-medium text-slate-800 focus:border-brand-red focus:outline-none transition-colors" placeholder="Masukkan jabatan..." />
                            </div>
                            <div>
                              <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">Foto URL</label>
                              <FileUpload label="Upload Foto" initialUrl={orgDataForm?.sekretaris?.foto} onUploadSuccess={(url) => { const nd = JSON.parse(JSON.stringify(orgDataForm)); nd.sekretaris.foto = url; setOrgDataForm(nd); }} />
                            </div>
                          </div>
                        </div>

                        {/* Jabatan Fungsional */}
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                          <h4 className="font-bold text-slate-800 text-lg mb-6 border-b border-slate-200 pb-3 uppercase">Jab. Fungsional</h4>
                          <div className="space-y-5">
                            <div>
                              <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">Nama Lengkap</label>
                              <input type="text" value={orgDataForm?.fungsional?.nama || ''} onChange={(e) => { const nd = JSON.parse(JSON.stringify(orgDataForm)); nd.fungsional.nama = e.target.value; setOrgDataForm(nd); }} className="w-full border-2 border-slate-200 px-4 py-3 rounded-xl bg-white font-medium text-slate-800 focus:border-brand-red focus:outline-none transition-colors" placeholder="Masukkan nama..." />
                            </div>
                            <div>
                              <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">Jabatan</label>
                              <input type="text" value={orgDataForm?.fungsional?.jabatan || ''} onChange={(e) => { const nd = JSON.parse(JSON.stringify(orgDataForm)); nd.fungsional.jabatan = e.target.value; setOrgDataForm(nd); }} className="w-full border-2 border-slate-200 px-4 py-3 rounded-xl bg-white font-medium text-slate-800 focus:border-brand-red focus:outline-none transition-colors" placeholder="Masukkan jabatan..." />
                            </div>
                            <div>
                              <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">Foto URL</label>
                              <FileUpload label="Upload Foto" initialUrl={orgDataForm?.fungsional?.foto} onUploadSuccess={(url) => { const nd = JSON.parse(JSON.stringify(orgDataForm)); nd.fungsional.foto = url; setOrgDataForm(nd); }} />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t-4 border-slate-100 pt-12 mt-12">
                        <div className="text-center mb-10">
                           <h4 className="font-black text-slate-900 text-3xl uppercase italic tracking-tighter">Subbagian & Bidang</h4>
                           <p className="font-medium text-slate-500">Sesuaikan struktur bawahan langsung dan bidang fungsional.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                          
                          {/* SUBBAGIAN SECTION */}
                          <div className="bg-slate-50 p-6 md:p-8 rounded-[2.5rem] border-2 border-slate-200">
                            <h5 className="font-black text-slate-800 text-center bg-white p-4 rounded-2xl mb-8 border border-slate-200 shadow-sm uppercase tracking-wide text-lg">Subbagian</h5>
                            <div className="space-y-6">
                              {orgDataForm?.subbag?.map((item: any, idx: number) => (
                                <div key={`subbag-${idx}`} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                  <h4 className="font-bold text-slate-500 mb-5 border-b border-slate-100 pb-2 flex justify-between items-center">
                                    <span>SUBBAG {idx + 1}</span>
                                    {/* Action buttons could go here */}
                                  </h4>
                                  <div className="space-y-4">
                                    <div><label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Nama Lengkap</label><input type="text" value={item.nama || ''} onChange={(e) => { const nd = JSON.parse(JSON.stringify(orgDataForm)); nd.subbag[idx].nama = e.target.value; setOrgDataForm(nd); }} className="w-full border-2 border-slate-100 px-4 py-2 font-medium rounded-xl bg-slate-50 focus:bg-white focus:border-brand-red transition-all outline-none" /></div>
                                    <div><label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Jabatan</label><input type="text" value={item.jabatan || ''} onChange={(e) => { const nd = JSON.parse(JSON.stringify(orgDataForm)); nd.subbag[idx].jabatan = e.target.value; setOrgDataForm(nd); }} className="w-full border-2 border-slate-100 px-4 py-2 font-medium rounded-xl bg-slate-50 focus:bg-white focus:border-brand-red transition-all outline-none" /></div>
                                    <div><FileUpload label="Upload Foto" initialUrl={item.foto} onUploadSuccess={(url) => { const nd = JSON.parse(JSON.stringify(orgDataForm)); nd.subbag[idx].foto = url; setOrgDataForm(nd); }} /></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                      
                          {/* BIDANG PENCEGAHAN */}
                          <div className="bg-slate-50 p-6 md:p-8 rounded-[2.5rem] border-2 border-slate-200">
                            <h5 className="font-black text-slate-800 text-center bg-white p-4 rounded-2xl mb-8 border border-slate-200 shadow-sm uppercase tracking-wide text-lg">{orgDataForm?.bidangPencegahan?.jabatan || "Bidang Pencegahan"}</h5>
                            
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md mb-8">
                                <h4 className="font-bold text-brand-red mb-5 border-b border-brand-red/10 pb-2 uppercase tracking-wide">Kepala Bidang</h4>
                                <div className="space-y-4">
                                  <div><label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Nama Lengkap</label><input type="text" value={orgDataForm?.bidangPencegahan?.nama || ''} onChange={(e) => { const nd = JSON.parse(JSON.stringify(orgDataForm)); nd.bidangPencegahan.nama = e.target.value; setOrgDataForm(nd); }} className="w-full border-2 border-slate-100 px-4 py-2 font-medium rounded-xl bg-slate-50 focus:bg-white focus:border-brand-red transition-all outline-none" /></div>
                                  <div><label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Jabatan</label><input type="text" value={orgDataForm?.bidangPencegahan?.jabatan || ''} onChange={(e) => { const nd = JSON.parse(JSON.stringify(orgDataForm)); nd.bidangPencegahan.jabatan = e.target.value; setOrgDataForm(nd); }} className="w-full border-2 border-slate-100 px-4 py-2 font-medium rounded-xl bg-slate-50 focus:bg-white focus:border-brand-red transition-all outline-none" /></div>
                                  <div><FileUpload label="Upload Foto" initialUrl={orgDataForm?.bidangPencegahan?.foto} onUploadSuccess={(url) => { const nd = JSON.parse(JSON.stringify(orgDataForm)); nd.bidangPencegahan.foto = url; setOrgDataForm(nd); }} /></div>
                                </div>
                            </div>
                            
                            <h5 className="font-bold text-slate-600 text-sm mb-4 px-3 uppercase tracking-widest flex items-center justify-between">
                              Sebaran Seksi:
                            </h5>
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {orgDataForm?.bidangPencegahan?.seksi?.map((item: any, idx: number) => (
                              <div key={`sek-peng-${idx}`} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative">
                                <h6 className="text-[10px] uppercase font-black text-slate-400 mb-4 bg-slate-100 py-1 px-3 rounded-lg inline-block">Seksi {idx + 1}</h6>
                                <div className="space-y-4">
                                  <div><label className="block text-[10px] font-bold text-slate-400 mb-1">Nama</label><input type="text" value={item.nama || ''} onChange={(e) => { const nd = JSON.parse(JSON.stringify(orgDataForm)); nd.bidangPencegahan.seksi[idx].nama = e.target.value; setOrgDataForm(nd); }} className="w-full border-2 border-slate-100 px-3 py-1.5 font-medium rounded-lg bg-slate-50 text-sm focus:bg-white focus:border-brand-red outline-none" /></div>
                                  <div><label className="block text-[10px] font-bold text-slate-400 mb-1">Jabatan</label><input type="text" value={item.jabatan || ''} onChange={(e) => { const nd = JSON.parse(JSON.stringify(orgDataForm)); nd.bidangPencegahan.seksi[idx].jabatan = e.target.value; setOrgDataForm(nd); }} className="w-full border-2 border-slate-100 px-3 py-1.5 font-medium rounded-lg bg-slate-50 text-sm focus:bg-white focus:border-brand-red outline-none" /></div>
                                  <div><FileUpload label="Upload Foto" initialUrl={item.foto} onUploadSuccess={(url) => { const nd = JSON.parse(JSON.stringify(orgDataForm)); nd.bidangPencegahan.seksi[idx].foto = url; setOrgDataForm(nd); }} /></div>
                                </div>
                              </div>
                            ))}
                            </div>
                          </div>
                          
                          {/* BIDANG PEMADAM */}
                          <div className="bg-slate-50 p-6 md:p-8 rounded-[2.5rem] border-2 border-slate-200 lg:col-span-2 xl:col-span-1">
                            <h5 className="font-black text-slate-800 text-center bg-white p-4 rounded-2xl mb-8 border border-slate-200 shadow-sm uppercase tracking-wide text-lg">{orgDataForm?.bidangPemadam?.jabatan || "Bidang Pemadam"}</h5>
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md mb-8">
                                <h4 className="font-bold text-brand-red mb-5 border-b border-brand-red/10 pb-2 uppercase tracking-wide">Kepala Bidang</h4>
                                <div className="space-y-4">
                                  <div><label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Nama Lengkap</label><input type="text" value={orgDataForm?.bidangPemadam?.nama || ''} onChange={(e) => { const nd = JSON.parse(JSON.stringify(orgDataForm)); nd.bidangPemadam.nama = e.target.value; setOrgDataForm(nd); }} className="w-full border-2 border-slate-100 px-4 py-2 font-medium rounded-xl bg-slate-50 focus:bg-white focus:border-brand-red transition-all outline-none" /></div>
                                  <div><label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Jabatan</label><input type="text" value={orgDataForm?.bidangPemadam?.jabatan || ''} onChange={(e) => { const nd = JSON.parse(JSON.stringify(orgDataForm)); nd.bidangPemadam.jabatan = e.target.value; setOrgDataForm(nd); }} className="w-full border-2 border-slate-100 px-4 py-2 font-medium rounded-xl bg-slate-50 focus:bg-white focus:border-brand-red transition-all outline-none" /></div>
                                  <div><FileUpload label="Upload Foto" initialUrl={orgDataForm?.bidangPemadam?.foto} onUploadSuccess={(url) => { const nd = JSON.parse(JSON.stringify(orgDataForm)); nd.bidangPemadam.foto = url; setOrgDataForm(nd); }} /></div>
                                </div>
                            </div>
                            
                            <h5 className="font-bold text-slate-600 text-sm mb-4 px-3 uppercase tracking-widest flex items-center justify-between">
                              Sebaran Seksi:
                            </h5>
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {orgDataForm?.bidangPemadam?.seksi?.map((item: any, idx: number) => (
                              <div key={`sek-pem-${idx}`} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative">
                                <h6 className="text-[10px] uppercase font-black text-slate-400 mb-4 bg-slate-100 py-1 px-3 rounded-lg inline-block">Seksi {idx + 1}</h6>
                                <div className="space-y-4">
                                  <div><label className="block text-[10px] font-bold text-slate-400 mb-1">Nama</label><input type="text" value={item.nama || ''} onChange={(e) => { const nd = JSON.parse(JSON.stringify(orgDataForm)); nd.bidangPemadam.seksi[idx].nama = e.target.value; setOrgDataForm(nd); }} className="w-full border-2 border-slate-100 px-3 py-1.5 font-medium rounded-lg bg-slate-50 text-sm focus:bg-white focus:border-brand-red outline-none" /></div>
                                  <div><label className="block text-[10px] font-bold text-slate-400 mb-1">Jabatan</label><input type="text" value={item.jabatan || ''} onChange={(e) => { const nd = JSON.parse(JSON.stringify(orgDataForm)); nd.bidangPemadam.seksi[idx].jabatan = e.target.value; setOrgDataForm(nd); }} className="w-full border-2 border-slate-100 px-3 py-1.5 font-medium rounded-lg bg-slate-50 text-sm focus:bg-white focus:border-brand-red outline-none" /></div>
                                  <div><FileUpload label="Upload Foto" initialUrl={item.foto} onUploadSuccess={(url) => { const nd = JSON.parse(JSON.stringify(orgDataForm)); nd.bidangPemadam.seksi[idx].foto = url; setOrgDataForm(nd); }} /></div>
                                </div>
                              </div>
                            ))}
                            </div>
                          </div>
                      
                        </div>
                      </div>
                      
                    </div>
                    <div className="pt-8 mt-4 border-t-2 border-slate-100">
                      <button
                        type="submit"
                        className="w-full bg-brand-red text-white py-5 rounded-[1.5rem] text-lg font-black uppercase italic tracking-widest hover:bg-brand-dark transition-all transform hover:scale-[1.01] shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 group"
                      >
                        <CheckCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        Simpan Formasi Pegawai
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {activeTab === "posko_status" && (
              <motion.div
                key="posko_status"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-12"
              >
                <div className="bg-brand-dark p-6 lg:p-12 rounded-[3.5rem] relative overflow-hidden shadow-2xl">
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                      <h3 className="text-3xl md:text-5xl text-white font-black uppercase italic tracking-tighter mb-4">
                        Kesiapan <span className="text-brand-red">Posko</span>
                      </h3>
                      <p className="text-slate-400 font-bold max-w-xl text-lg">
                        Edit JSON pergantian piket: nama posko, danru siaga, armada dan personil yang bertugas hari ini.
                      </p>
                    </div>
                  </div>
                  <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-brand-red rounded-full blur-[120px] opacity-20" />
                </div>

                <div className="bg-white p-6 md:p-10 rounded-[3.5rem] border-2 border-slate-100 shadow-2xl">
                  <form onSubmit={handleSavePoskoData} className="space-y-12">
                    {poskoDataForm.map((posko, pIdx) => (
                      <div key={pIdx} className="bg-slate-50 p-6 md:p-8 rounded-[2.5rem] border-2 border-slate-200 shadow-sm relative overflow-visible">
                        <div className="flex justify-between items-center mb-6 border-b-2 border-slate-200 pb-4">
                           <h4 className="font-black text-slate-800 text-xl uppercase italic">POSKO {pIdx + 1}</h4>
                           <button type="button" onClick={() => { const nd = [...poskoDataForm]; nd.splice(pIdx, 1); setPoskoDataForm(nd); }} className="text-brand-red bg-brand-red/10 px-3 py-1.5 rounded-lg text-xs font-bold uppercase hover:bg-brand-red hover:text-white transition-all">Hapus Posko</button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                           <div>
                              <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">Nama Posko</label>
                              <input type="text" value={posko.namaPosko || ""} onChange={(e) => { const nd = [...poskoDataForm]; nd[pIdx].namaPosko = e.target.value; setPoskoDataForm(nd); }} className="w-full border-2 border-slate-200 px-4 py-3 rounded-xl bg-white font-medium focus:border-brand-red focus:outline-none transition-colors" placeholder="Cth: POSKO INDUK DAMKAR" />
                           </div>
                           <div>
                              <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">Danru Siaga</label>
                              <input type="text" value={posko.danruSiaga || ""} onChange={(e) => { const nd = [...poskoDataForm]; nd[pIdx].danruSiaga = e.target.value; setPoskoDataForm(nd); }} className="w-full border-2 border-slate-200 px-4 py-3 rounded-xl bg-white font-medium focus:border-brand-red focus:outline-none transition-colors" placeholder="Cth: Komandan Asep..." />
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                           <div className="md:col-span-2">
                              <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">Alamat Lengkap</label>
                              <input type="text" value={posko.address || ""} onChange={(e) => { const nd = [...poskoDataForm]; nd[pIdx].address = e.target.value; setPoskoDataForm(nd); }} className="w-full border-2 border-slate-200 px-4 py-3 rounded-xl bg-white font-medium focus:border-brand-red focus:outline-none transition-colors" placeholder="Cth: Jl. Pusat Pemerintahan..." />
                           </div>
                           <div>
                              <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">No WA / Panggilan Cepat</label>
                              <input type="text" value={posko.phone || ""} onChange={(e) => { const nd = [...poskoDataForm]; nd[pIdx].phone = e.target.value; setPoskoDataForm(nd); }} className="w-full border-2 border-slate-200 px-4 py-3 rounded-xl bg-white font-medium focus:border-brand-red focus:outline-none transition-colors" placeholder="Cth: 081112223334" />
                           </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                           {/* Armada Editor */}
                           <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                                 <h5 className="font-bold text-slate-700 uppercase">Armada ({posko.armada?.length || 0})</h5>
                                 <button type="button" onClick={() => { const nd = [...poskoDataForm]; if(!nd[pIdx].armada) nd[pIdx].armada = []; nd[pIdx].armada.push({id: Date.now().toString(), nama: "", plat: "", status: "Siaga"}); setPoskoDataForm(nd); }} className="text-brand-red text-xs font-bold uppercase hover:underline">+ Tambah Armada</button>
                              </div>
                              <div className="space-y-4">
                                 {posko.armada?.map((arm, aIdx) => (
                                    <div key={aIdx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative">
                                       <button type="button" onClick={() => { const nd = [...poskoDataForm]; nd[pIdx].armada.splice(aIdx, 1); setPoskoDataForm(nd); }} className="absolute -top-3 -right-3 w-6 h-6 bg-brand-red text-white rounded-full flex items-center justify-center shadow-md font-bold">&times;</button>
                                       <div className="space-y-3">
                                         <div><input type="text" value={arm.nama} onChange={(e) => { const nd = [...poskoDataForm]; nd[pIdx].armada[aIdx].nama = e.target.value; setPoskoDataForm(nd); }} className="w-full border border-slate-200 px-3 py-2 rounded-lg bg-white text-sm" placeholder="Nama Unit..." /></div>
                                         <div className="grid grid-cols-2 gap-3">
                                           <input type="text" value={arm.plat} onChange={(e) => { const nd = [...poskoDataForm]; nd[pIdx].armada[aIdx].plat = e.target.value; setPoskoDataForm(nd); }} className="w-full border border-slate-200 px-3 py-2 rounded-lg bg-white text-sm uppercase" placeholder="Plat Nomor" />
                                           <select value={arm.status} onChange={(e) => { const nd = [...poskoDataForm]; nd[pIdx].armada[aIdx].status = e.target.value; setPoskoDataForm(nd); }} className="w-full border border-slate-200 px-3 py-2 rounded-lg bg-white text-sm">
                                             <option value="Siaga">Siaga</option>
                                             <option value="Bertugas">Bertugas</option>
                                             <option value="Perawatan">Perawatan</option>
                                           </select>
                                         </div>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </div>

                           {/* Personil Editor */}
                           <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                                 <h5 className="font-bold text-slate-700 uppercase">Personil Bertugas ({posko.personil?.length || 0})</h5>
                                 <button type="button" onClick={() => { const nd = [...poskoDataForm]; if(!nd[pIdx].personil) nd[pIdx].personil = []; nd[pIdx].personil.push({id: Date.now().toString(), nama: "", peran: "Anggota"}); setPoskoDataForm(nd); }} className="text-brand-dark text-xs font-bold uppercase hover:underline">+ Tambah Personil</button>
                              </div>
                              <div className="space-y-4">
                                 {posko.personil?.map((per, rIdx) => (
                                    <div key={rIdx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative">
                                       <button type="button" onClick={() => { const nd = [...poskoDataForm]; nd[pIdx].personil.splice(rIdx, 1); setPoskoDataForm(nd); }} className="absolute -top-3 -right-3 w-6 h-6 bg-slate-800 text-white rounded-full flex items-center justify-center shadow-md font-bold">&times;</button>
                                       <div className="grid grid-cols-3 gap-3 mb-2">
                                         <div className="col-span-2"><input type="text" value={per.nama} onChange={(e) => { const nd = [...poskoDataForm]; nd[pIdx].personil[rIdx].nama = e.target.value; setPoskoDataForm(nd); }} className="w-full border border-slate-200 px-3 py-2 rounded-lg bg-white text-sm" placeholder="Nama Personil..." /></div>
                                         <div className="col-span-1">
                                           <select value={per.peran} onChange={(e) => { const nd = [...poskoDataForm]; nd[pIdx].personil[rIdx].peran = e.target.value; setPoskoDataForm(nd); }} className="w-full border border-slate-200 px-3 py-2 rounded-lg bg-white text-sm font-bold">
                                             <option value="Anggota">Anggota</option>
                                             <option value="Rescue">Rescue</option>
                                             <option value="Driver">Driver</option>
                                           </select>
                                         </div>
                                       </div>
                                       <div>
                                          <input type="text" value={per.foto || ""} onChange={(e) => { const nd = [...poskoDataForm]; nd[pIdx].personil[rIdx].foto = e.target.value; setPoskoDataForm(nd); }} className="w-full border border-slate-200 px-3 py-2 rounded-lg bg-white text-[10px]" placeholder="URL Foto Profil (opsional)" />
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                      </div>
                    ))}
                    
                    <button type="button" onClick={() => { setPoskoDataForm([...poskoDataForm, {id: Date.now().toString(), namaPosko: "POSKO BARU", danruSiaga: "", armada: [], personil: []}]); }} className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold uppercase border-2 border-dashed border-slate-300 hover:border-brand-red hover:text-brand-red transition-all">
                       + Tambah Posko Baru
                    </button>

                    <div className="pt-8 mt-8 border-t-2 border-slate-100">
                      <button
                        type="submit"
                        className="w-full bg-brand-dark text-white py-5 rounded-[1.5rem] text-xl font-black uppercase italic tracking-widest hover:bg-brand-red transition-all transform hover:scale-[1.01] shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 group"
                      >
                        <CheckCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />
                        Simpan Laporan Piket
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {activeTab === "notifications" && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                <NotificationManagement />
              </motion.div>
            )}

            {activeTab === "monitoring" && (
              <motion.div
                key="monitoring"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12"
              >
                <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6 bg-white p-5 md:p-8 rounded-3xl border-4 border-brand-dark shadow-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-red rounded-xl flex items-center justify-center shadow-lg shadow-red-900/20">
                      <Waves className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none">
                        Monitoring{" "}
                        <span className="text-brand-red">Banjir & Sungai</span>
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Deteksi Dini & Mitigasi Bencana
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      className="bg-slate-900 px-8 py-3 rounded-xl text-white font-black italic uppercase tracking-tighter shadow-xl hover:bg-brand-red transition-all"
                      onClick={() => {
                        setWeatherForm({
                          location: "Hulu Sungai Malinau",
                          condition: "Cerah",
                          rainfall: 0,
                          overflowPotential: "Rendah",
                          summary: "",
                          recommendation: "Tetap waspada.",
                        });
                        setEditingItem(null);
                        setShowWeatherModal(true);
                      }}
                    >
                      Update Cuaca Hulu
                    </button>
                    <button
                      className="bg-brand-red px-8 py-3 rounded-xl text-white font-black italic uppercase tracking-tighter shadow-xl hover:scale-105 transition-all"
                      onClick={() => {
                        setRiverForm({
                          locationName: "",
                          waterLevel: 0,
                          status: "Aman",
                          trend: "stable",
                        });
                        setEditingItem(null);
                        setShowFloodModal(true);
                      }}
                    >
                      Tambah Sensor Sungai
                    </button>
                  </div>
                </div>

                {/* Open-Meteo Satellite Data */}
                <div className="-mx-10 scale-[0.98] origin-top">
                  <WeatherWidget />
                </div>


              </motion.div>
            )}

            {activeTab === "news" && (
              <motion.div
                key="news"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6 bg-white p-5 md:p-8 rounded-3xl border-4 border-brand-dark shadow-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
                      <Newspaper className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none">
                        Draft Berita
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Warta Otomatis DAMKAR Malinau
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      className="bg-brand-red px-8 py-3 rounded-xl text-white font-black italic uppercase tracking-tighter hover:scale-105 transition-all shadow-xl text-center"
                      onClick={() => {
                        setEditingItem(null);
                        setNewsForm({
                          title: "",
                          content: "",
                          category: "WARTA",
                          imageUrl:
                            "https://images.unsplash.com/photo-1542343607-16076fe95b7b?auto=format&fit=crop&q=80",
                        });
                        setShowNewsModal(true);
                      }}
                    >
                      Tambah Berita
                    </button>
                    <button
                      className="bg-slate-900 px-8 py-3 rounded-xl text-white font-black italic uppercase tracking-tighter hover:bg-slate-800 transition-all text-center"
                      onClick={() => showToast("Broadcast Warta dimulai")}
                    >
                      Informasi Publik
                    </button>
                  </div>
                </div>
                <div className="grid gap-6">
                  {dataLoading.news ? (
                    <LoadingSpinner message="Sinkronisasi Data Berita..." />
                  ) : news.length === 0 ? (
                    <div className="bg-white p-10 md:p-20 rounded-[2.5rem] border-4 border-dashed border-slate-200 text-center">
                      <p className="text-slate-300 font-black italic uppercase tracking-[0.4em]">
                        Belum Ada Berita Terbit
                      </p>
                    </div>
                  ) : (
                    news.map((article) => (
                      <article
                        key={article.id}
                        className="bg-white p-5 md:p-8 rounded-[2rem] border-4 border-brand-dark shadow-2xl group flex flex-col sm:flex-row gap-6 md:gap-8"
                      >
                        <div className="w-full sm:w-48 h-48 bg-slate-50 rounded-2xl border-4 border-slate-100 flex items-center justify-center shrink-0 overflow-hidden relative">
                          {article.imageUrl ? (
                            <img
                              src={article.imageUrl}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <img
                              src={`https://picsum.photos/seed/${article.id}/400/400`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </div>
                        <div className="flex-1 py-2">
                          <div className="flex justify-between items-start mb-4">
                            <span
                              className={cn(
                                "px-4 py-1.5 text-white text-[10px] font-black italic uppercase tracking-widest rounded-lg bg-brand-red",
                              )}
                            >
                              {article.category || "WARTA"}
                            </span>
                            <span className="text-[10px] font-black text-slate-300 uppercase italic">
                              {new Date(article.date).toLocaleDateString(
                                "id-ID",
                              )}
                            </span>
                          </div>
                          <h4 className="text-2xl font-black italic uppercase tracking-tighter mb-4 group-hover:text-brand-red transition-colors leading-none">
                            {article.title}
                          </h4>
                          <div className="text-slate-500 font-bold text-sm line-clamp-3 mb-6 bg-slate-50 p-4 rounded-xl border-l-4 border-slate-200">
                            <Markdown>{article.content || ""}</Markdown>
                          </div>
                          <div className="flex gap-4">
                            <button
                              className="bg-slate-900 text-white font-black italic uppercase tracking-tighter px-6 py-2 rounded-lg text-xs hover:bg-brand-red transition-colors"
                              onClick={() => {
                                setEditingItem(article);
                                setNewsForm({
                                  title: article.title,
                                  content: article.content,
                                  category: article.category || "WARTA",
                                  imageUrl: article.imageUrl || "",
                                });
                                setShowNewsModal(true);
                              }}
                            >
                              Edit Warta
                            </button>
                            <button
                              className="bg-red-50 text-red-500 font-black italic uppercase tracking-tighter px-6 py-2 rounded-lg text-xs hover:bg-red-500 hover:text-white transition-colors"
                              onClick={() =>
                                handleDeleteItem("news", article.id)
                              }
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "gallery" && (
              <motion.div
                key="gallery"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6 bg-white p-5 md:p-8 rounded-3xl border-4 border-brand-dark shadow-2xl">
                  <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-2 scrollbar-none max-w-full shrink-0">
                    {["SEMUA", "OPERASIONAL", "KEGIATAN"].map((f) => (
                      <button
                        key={`gallery-filter-${f}`}
                        onClick={() =>
                          setGalleryFilter(
                            f as "SEMUA" | "OPERASIONAL" | "KEGIATAN",
                          )
                        }
                        className={cn(
                          "px-6 py-2 rounded-lg font-black text-[10px] uppercase italic tracking-tighter transition-all",
                          galleryFilter === f
                            ? "bg-brand-red text-white shadow-lg"
                            : "bg-slate-50 border-2 border-slate-100 text-slate-400 hover:bg-slate-100",
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <button
                    className="bg-brand-red px-8 py-3 rounded-xl text-white font-black italic uppercase tracking-tighter hover:scale-105 transition-all shadow-xl"
                    onClick={() => {
                      setEditingItem(null);
                      setGalleryForm({
                        title: "",
                        category: "OPERASIONAL",
                        imageUrl: "",
                        description: "",
                      });
                      setShowGalleryModal(true);
                    }}
                  >
                    Unggah Media Umum
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  {dataLoading.gallery ? (
                    <div className="col-span-full py-12 md:py-20 px-4 text-center">
                      <LoadingSpinner message="Menyiapkan Galeri Digital..." />
                    </div>
                  ) : (
                    (() => {
                      const manualGallery = gallery.map((item) => ({
                        ...item,
                        source: "manual",
                        type: "GALLERY",
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
                          description:
                            r.documentation?.chronology || r.description,
                          createdAt: r.createdAt,
                          source: "report",
                          reportData: r,
                          type: "REPORT_DOC",
                        }));
                      });

                      const combined = [
                        ...manualGallery,
                        ...reportDocumentation,
                      ]
                        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                        .filter((item) => {
                          if (galleryFilter === "SEMUA") return true;
                          return (
                            (item.category || "OPERASIONAL") === galleryFilter
                          );
                        });

                      if (combined.length === 0) {
                        return (
                          <div className="col-span-full py-12 md:py-20 text-center bg-white rounded-3xl border-4 border-dashed border-slate-100">
                            <p className="text-slate-300 font-black italic uppercase tracking-[0.4em]">
                              Belum Ada Dokumentasi Tersedia
                            </p>
                          </div>
                        );
                      }

                      return combined.map((item) => (
                        <div
                          key={`${item.source}-${item.id}`}
                          className="aspect-square bg-white rounded-3xl border-4 border-slate-900 overflow-hidden relative group shadow-xl"
                        >
                          <img
                            src={item.imageUrl}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-brand-dark/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-4">
                            {item.source === "report" ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedReportDetail(item.reportData);
                                    setShowDetailModal(true);
                                  }}
                                  className="px-6 py-2 bg-white text-brand-dark font-black text-[10px] uppercase italic rounded-xl hover:bg-brand-red hover:text-white transition-all shadow-2xl"
                                >
                                  Lihat Detail
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedReport(item.reportData);
                                    setDocsForm({
                                      chronology:
                                        item.reportData.documentation
                                          ?.chronology ||
                                        item.reportData.description ||
                                        "",
                                      photos:
                                        item.reportData.documentation?.photos ||
                                        item.reportData.photos ||
                                        [],
                                      videos:
                                        item.reportData.documentation?.videos ||
                                        [],
                                      personnel:
                                        item.reportData.documentation
                                          ?.personnel || 5,
                                      units: item.reportData.documentation
                                        ?.units || ["Unit Gajah 01"],
                                      duration:
                                        item.reportData.documentation
                                          ?.duration || "1 Jam",
                                      victims:
                                        item.reportData.documentation
                                          ?.victims || "Nihil",
                                      actions:
                                        item.reportData.documentation
                                          ?.actions || "",
                                    });
                                    setShowDocsModal(true);
                                  }}
                                  className="p-3 bg-brand-red rounded-xl hover:scale-110 transition-transform shadow-xl"
                                  title="Edit Dokumentasi Laporan"
                                >
                                  <Edit className="w-5 h-5 text-white" />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (
                                      !confirm(
                                        "Yakin ingin menghapus foto ini dari dokumentasi laporan?",
                                      )
                                    )
                                      return;
                                    try {
                                      const photos = (
                                        item.reportData.documentation?.photos ||
                                        item.reportData.photos ||
                                        []
                                      ).filter(
                                        (p: string) => p !== item.imageUrl,
                                      );
                                      if (item.reportData.documentation) {
                                        await updateDoc(
                                          doc(
                                            db,
                                            "reports",
                                            item.reportData.id,
                                          ),
                                          {
                                            "documentation.photos": photos,
                                          },
                                        );
                                      } else {
                                        await updateDoc(
                                          doc(
                                            db,
                                            "reports",
                                            item.reportData.id,
                                          ),
                                          {
                                            photos: photos,
                                          },
                                        );
                                      }

                                      // Hapus fisik jika ada
                                      const url = item.imageUrl;
                                      if (url) {
                                        try {
                                          if (url.startsWith('/uploads/')) {
                                            const fname = url.split('/').pop();
                                            if (fname) await fetch(`/api/files/${fname}`, { method: 'DELETE' });
                                          } else if (url.includes('supabase.co')) {
                                            const fname = url.split('/').pop();
                                            if (fname) {
                                              const { error } = await deleteObject(ref(storage, `gallery/${fname}`)).then(() => ({error: null})).catch(e => ({error: e}));
                                              if (error) console.error("Gagal menghapus gambar Supabase:", error.message);
                                            }
                                          }
                                        } catch(e) {}
                                      }

                                      showToast(
                                        "Foto dokumentasi berhasil dihapus",
                                      );
                                    } catch (err) {
                                      showToast(
                                        "Gagal menghapus foto",
                                        "error",
                                      );
                                    }
                                  }}
                                  className="p-3 bg-brand-dark rounded-xl hover:scale-110 transition-transform shadow-xl"
                                  title="Hapus Foto Dokumentasi"
                                >
                                  <Trash2 className="w-5 h-5 text-white" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingItem(item);
                                    setGalleryForm({
                                      title: item.title,
                                      category: item.category || "OPERASIONAL",
                                      imageUrl: item.imageUrl,
                                      description: item.description || "",
                                    });
                                    setShowGalleryModal(true);
                                  }}
                                  className="p-3 bg-white rounded-xl hover:scale-110 transition-transform shadow-xl"
                                >
                                  <Edit className="w-5 h-5 text-brand-dark" />
                                </button>
                                <button
                                  onClick={async() => {
                                    if (confirm("Hapus item ini beserta filenya?")) {
                                      const url = item.imageUrl;
                                      if (url) {
                                        try {
                                          if (url.startsWith('/uploads/')) {
                                            const fname = url.split('/').pop();
                                            if (fname) await fetch(`/api/files/${fname}`, { method: 'DELETE' });
                                          } else if (url.includes('supabase.co')) {
                                            const fname = url.split('/').pop();
                                            if (fname) {
                                              const { error } = await deleteObject(ref(storage, `gallery/${fname}`)).then(() => ({error: null})).catch(e => ({error: e}));
                                              if (error) console.error("Gagal menghapus gambar Supabase:", error.message);
                                            }
                                          }
                                        } catch(e) { console.error(e); }
                                      }
                                      handleDeleteItem("gallery", item.id);
                                    }
                                  }}
                                  className="p-3 bg-brand-red rounded-xl hover:scale-110 transition-transform shadow-xl"
                                >
                                  <Trash2 className="w-5 h-5 text-white" />
                                </button>
                              </>
                            )}
                          </div>
                          <div className="absolute top-4 left-4">
                            <span className="bg-slate-900/80 backdrop-blur-md text-white text-[8px] font-black uppercase px-3 py-1 rounded-full border border-white/10">
                              {item.source === "report"
                                ? "Laporan Masuk"
                                : "Upload Umum"}
                            </span>
                          </div>
                          <div className="absolute top-4 right-4">
                            <span
                              className={cn(
                                "text-white text-[8px] font-black uppercase px-3 py-1 rounded-full",
                                item.category === "KEGIATAN"
                                  ? "bg-blue-600"
                                  : "bg-brand-red",
                              )}
                            >
                              {item.category || "OPERASIONAL"}
                            </span>
                          </div>
                          <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-[10px] text-white font-bold truncate italic">
                              {item.title}
                            </p>
                            <p className="text-[8px] text-slate-300 font-medium uppercase mt-1">
                              {new Date(item.createdAt).toLocaleDateString(
                                "id-ID",
                              )}
                            </p>
                          </div>
                        </div>
                      ));
                    })()
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "bank_data" && (
              <motion.div
                key="bank_data"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-end gap-10">
                  <div className="flex-1">
                    <h3 className="text-4xl font-black italic uppercase tracking-tighter mb-4">
                      Bank{" "}
                      <span className="text-brand-red">Data & Dokumen</span>
                    </h3>
                    <div className="relative group max-w-xl">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-brand-red transition-colors" />
                      <input
                        type="text"
                        placeholder="Cari dokumen, surat, atau regulasi..."
                        className="w-full bg-white border-4 border-slate-900 px-12 py-4 rounded-2xl font-bold tracking-tight focus:ring-0 focus:border-brand-red transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setBankDataForm({
                        title: "",
                        category: "Dokumen Internal",
                        fileUrl: "",
                        fileType: "PDF",
                        description: "",
                        department: "TU",
                      });
                      setShowBankDataModal(true);
                    }}
                    className="bg-brand-red text-white px-10 py-5 rounded-2xl font-black italic uppercase tracking-widest hover:scale-105 transition-all shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
                  >
                    Tambah Data Baru
                  </button>
                </div>

                {/* Category Filtering Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                  {[
                    "SEMUA",
                    "Dokumen Internal",
                    "Regulasi & Peraturan",
                    "SOP & Instruksi Kerja",
                    "Arsip Kepegawaian",
                    "Aset & Inventaris",
                    "Laporan Keuangan",
                    "Lainnya",
                  ].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setBankDataFilter(cat)}
                      className={cn(
                        "px-6 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase whitespace-nowrap border-2",
                        bankDataFilter === cat
                          ? "bg-slate-900 text-white border-slate-900 shadow-lg scale-105"
                          : "bg-white text-slate-400 border-slate-100 hover:border-slate-300",
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid gap-6">
                  {dataLoading.bank_data ? (
                    <LoadingSpinner message="Menyusun Arsip Digital..." />
                  ) : bankData.filter((d) => {
                      const matchesSearch =
                        d.title
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                        d.category
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                        d.department
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase());
                      const matchesCategory =
                        bankDataFilter === "SEMUA" ||
                        d.category === bankDataFilter;
                      return matchesSearch && matchesCategory;
                    }).length === 0 ? (
                    <div className="py-20 text-center bg-white rounded-3xl border-4 border-dashed border-slate-100 italic font-black uppercase text-slate-300 tracking-[0.4em]">
                      Data tidak ditemukan
                    </div>
                  ) : (
                    bankData
                      .filter((d) => {
                        const matchesSearch =
                          d.title
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase()) ||
                          d.category
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase()) ||
                          d.department
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase());
                        const matchesCategory =
                          bankDataFilter === "SEMUA" ||
                          d.category === bankDataFilter;
                        return matchesSearch && matchesCategory;
                      })
                      .map((doc) => (
                        <div
                          key={doc.id}
                          className="bg-white p-5 md:p-8 rounded-3xl border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(15,23,42,0.05)] hover:shadow-[12px_12px_0px_0px_rgba(225,29,72,0.1)] transition-all flex items-center gap-8 group"
                        >
                          <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center border-4 border-slate-100 group-hover:border-brand-red transition-colors shrink-0">
                            <FileDown className="w-8 h-8 text-slate-300 group-hover:text-brand-red transition-colors" />
                          </div>
                          <div className="flex-1">
                            <div className="flex gap-2 mb-2">
                              <span className="bg-slate-900 text-white text-[8px] font-black uppercase px-2 py-1 rounded">
                                {doc.category}
                              </span>
                              <span className="bg-brand-red text-white text-[8px] font-black uppercase px-2 py-1 rounded">
                                {doc.department}
                              </span>
                              <span className="bg-blue-600 text-white text-[8px] font-black uppercase px-2 py-1 rounded">
                                {doc.fileType}
                              </span>
                            </div>
                            <h4 className="text-xl font-bold italic uppercase tracking-tighter mb-1">
                              {doc.title}
                            </h4>
                            <p className="text-xs text-slate-400 font-medium italic">
                              {doc.description || "Tidak ada deskripsi."}
                            </p>
                            <div className="flex gap-4 mt-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                              <span>Diupload oleh: {doc.uploadedBy}</span>
                              <span>•</span>
                              <span>
                                {new Date(doc.createdAt).toLocaleDateString(
                                  "id-ID",
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            {doc.fileUrl &&
                              !doc.fileUrl.includes("example.com") && (
                                <>
                                  <a
                                    href={doc.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-4 bg-slate-100 text-slate-900 rounded-xl hover:scale-110 transition-all border-2 border-slate-200"
                                    title="Lihat Dokumen"
                                  >
                                    <Eye className="w-5 h-5" />
                                  </a>
                                  <button
                                    onClick={() =>
                                      handleDownloadFile(doc.fileUrl, doc.title)
                                    }
                                    className="px-6 py-4 bg-slate-900 text-white rounded-xl hover:scale-105 flex items-center gap-3 transition-all"
                                    title="Download"
                                  >
                                    <FileDown className="w-5 h-5" />
                                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
                                      Download
                                    </span>
                                  </button>
                                </>
                              )}
                            <button
                              onClick={() => {
                                setEditingItem(doc);
                                setBankDataForm({
                                  title: doc.title,
                                  category: doc.category,
                                  fileUrl: doc.fileUrl,
                                  fileType: doc.fileType,
                                  description: doc.description || "",
                                  department: doc.department,
                                });
                                setShowBankDataModal(true);
                              }}
                              className="p-4 bg-white border-2 border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-all"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteItem("bank_data", doc.id)
                              }
                              className="p-4 bg-red-50 text-brand-red rounded-xl hover:bg-brand-red hover:text-white transition-all shadow-sm"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "education" && (
              <motion.div
                key="education"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-12"
              >
                <div className="bg-brand-dark p-6 lg:p-12 rounded-[3.5rem] relative overflow-hidden shadow-2xl">
                  <div className="relative z-10">
                    <h3 className="text-5xl text-white font-black uppercase italic tracking-tighter mb-4">
                      Edukasi &{" "}
                      <span className="text-brand-red">
                        Literasi Bahaya Api
                      </span>
                    </h3>
                    <p className="text-slate-400 font-bold max-w-xl text-lg">
                      Kelola materi edukasi, poster keselamatan, dan video
                      tutorial untuk warga Malinau.
                    </p>
                  </div>
                  <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-brand-red rounded-full blur-[120px] opacity-20" />
                </div>
                <div className="flex justify-between items-center mb-8">
                  <h4 className="text-3xl font-black uppercase italic tracking-tighter">
                    Materi <span className="text-brand-red">Terbit</span>
                  </h4>
                  <button
                    className="bg-brand-red px-8 py-3 rounded-xl text-white font-black italic uppercase tracking-tighter hover:scale-105 transition-all"
                    onClick={() => {
                      setEditingItem(null);
                      setEduForm({
                        title: "",
                        category: "PENCEGAHAN",
                        content: "",
                        imageUrl: "",
                      });
                      setShowEduModal(true);
                    }}
                  >
                    Tambah Materi
                  </button>
                </div>
                <div className="grid gap-6">
                  {dataLoading.education ? (
                    <LoadingSpinner message="Menyusun Materi Literasi..." />
                  ) : education.length === 0 ? (
                    <div className="p-20 text-center bg-white rounded-[2rem] border-4 border-dashed border-slate-200 font-black italic text-slate-300 uppercase tracking-[0.4em]">
                      Belum Ada Materi Edukasi...
                    </div>
                  ) : (
                    education.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white p-5 md:p-8 rounded-[2rem] border-4 border-brand-dark shadow-2xl flex gap-8 items-center"
                      >
                        <div className="w-24 h-24 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 border-4 border-slate-100 overflow-hidden">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Info className="w-8 h-8 text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex gap-3 mb-2">
                            <span className="bg-slate-900 text-white text-[8px] font-black uppercase px-3 py-1 rounded-full">
                              {item.category}
                            </span>
                            <span className="bg-brand-red text-white text-[8px] font-black uppercase px-3 py-1 rounded-full">
                              {new Date(item.createdAt).toLocaleDateString(
                                "id-ID",
                              )}
                            </span>
                          </div>
                          <h5 className="text-xl font-black italic uppercase tracking-tighter mb-2">
                            {item.title}
                          </h5>
                          <p className="text-xs font-bold text-slate-400 line-clamp-1 italic">
                            "{item.content}"
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setEduForm({
                                title: item.title,
                                category: item.category,
                                content: item.content,
                                imageUrl: item.imageUrl || "",
                              });
                              setShowEduModal(true);
                            }}
                            className="p-4 bg-slate-50 text-slate-400 rounded-xl border-2 border-slate-100 hover:bg-slate-900 hover:text-white transition-all"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteItem("education", item.id)
                            }
                            className="p-4 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "users" && (
              <motion.div
                key="users"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6 bg-white p-5 md:p-8 rounded-3xl border-4 border-brand-dark shadow-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none">
                        Petugas & Admin
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Manajemen Hak Akses & Verifikasi
                      </p>
                    </div>
                  </div>
                  <button
                    className="bg-brand-red px-8 py-3 rounded-xl text-white font-black italic uppercase tracking-tighter shadow-xl hover:scale-105 transition-all"
                    onClick={() => {
                      if (auth.currentUser?.email !== "ukungdorkas@gmail.com") {
                        showToast("Akses ditolak: Hanya Admin Utama yang dapat menambahkan petugas baru.", "error");
                        return;
                      }
                      setUserForm({ email: "", password: "", role: "admin" });
                      setEditingItem(null);
                      setShowUserModal(true);
                    }}
                  >
                    Tambah Petugas
                  </button>
                </div>

                {/* Pending Verification Section */}
                {users.filter((u) => u.status === "pending").length > 0 && (
                  <div className="bg-amber-50 rounded-[2.5rem] border-4 border-dashed border-amber-200 p-10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center animate-pulse">
                        <UserPlus className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="text-lg font-black italic uppercase tracking-tighter text-amber-900">
                        Permintaan Verifikasi Akun Baru
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {users
                        .filter((u) => u.status === "pending")
                        .map((pendingUser) => (
                          <motion.div
                            key={pendingUser.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-amber-100 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex justify-between items-start mb-4">
                                <span className="bg-amber-100 text-amber-700 text-[8px] font-black uppercase px-3 py-1.5 rounded-full tracking-widest">
                                  Waiting Approval
                                </span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase">
                                  {pendingUser.role}
                                </span>
                              </div>
                              <h5 className="font-black italic uppercase tracking-tighter text-slate-900 leading-none mb-1 truncate">
                                {pendingUser.name ||
                                  pendingUser.email?.split("@")[0]}
                              </h5>
                              <p className="text-[10px] font-bold text-slate-400 truncate mb-6">
                                {pendingUser.email}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  try {
                                    if (auth.currentUser?.email !== "ukungdorkas@gmail.com") {
                                      showToast("Akses ditolak: Hanya Admin Utama yang dapat menyetujui pendaftaran.", "error");
                                      return;
                                    }
                                    const col =
                                      pendingUser.collection ||
                                      (pendingUser.role === "admin"
                                        ? "admins"
                                        : "personnel");
                                    await updateDoc(
                                      doc(db, col, pendingUser.id),
                                      { status: "active" },
                                    );
                                    showToast(
                                      `Akun ${pendingUser.name || pendingUser.email} telah diaktifkan!`,
                                    );
                                  } catch (err) {
                                    console.error(err);
                                    showToast(
                                      "Gagal memverifikasi akun",
                                      "error",
                                    );
                                  }
                                }}
                                className="flex-1 py-3 bg-green-500 text-white text-[10px] font-black uppercase rounded-xl hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
                              >
                                Setujui
                              </button>
                              <button
                                onClick={async () => {
                                  if (auth.currentUser?.email !== "ukungdorkas@gmail.com") {
                                    showToast("Akses ditolak: Hanya Admin Utama yang dapat menolak pendaftaran.", "error");
                                    return;
                                  }
                                  if (
                                    confirm(
                                      "Tolak dan hapus data pendaftaran ini?",
                                    )
                                  ) {
                                    try {
                                      const col =
                                        pendingUser.collection ||
                                        (pendingUser.role === "admin"
                                          ? "admins"
                                          : "personnel");
                                      await deleteDoc(
                                        doc(db, col, pendingUser.id),
                                      );
                                      showToast(
                                        "Pendaftaran ditolak",
                                        "success",
                                      );
                                    } catch (err) {
                                      console.error(err);
                                      showToast("Gagal menolak akun", "error");
                                    }
                                  }
                                }}
                                className="px-4 py-3 bg-slate-100 text-slate-400 text-[10px] font-black uppercase rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors"
                              >
                                Tolak
                              </button>
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  </div>
                )}

                {dataLoading.users ? (
                  <LoadingSpinner message="Sinkronisasi Anggota Tim..." />
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {users.length === 0 ? (
                      <div className="col-span-full p-10 md:p-20 text-center bg-white rounded-[2rem] border-4 border-dashed border-slate-200 font-black italic text-slate-300 uppercase tracking-[0.4em]">
                        Belum Ada Pengguna...
                      </div>
                    ) : (
                      users.map((u) => (
                        <div
                          key={u.id}
                          className="bg-white p-6 md:p-10 rounded-[2.5rem] border-4 border-slate-900 relative shadow-2xl overflow-hidden group"
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-[3rem] border-l-4 border-b-4 border-slate-900 flex flex-col items-center justify-center font-black italic text-brand-red group-hover:bg-brand-red group-hover:text-white transition-all">
                            <span className="text-[8px] uppercase tracking-widest mb-1">
                              ROLE
                            </span>
                            <span className="text-2xl leading-none">
                              {u.role === "super"
                                ? "S"
                                : u.role === "admin"
                                ? "A"
                                : u.role === "officer"
                                ? "D"
                                : "P"}
                            </span>
                          </div>
                          <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center mb-8 font-black text-4xl text-slate-300 italic group-hover:scale-110 transition-transform shadow-inner">
                            {u.email?.[0]?.toUpperCase() || "?"}
                          </div>
                          <h4 className="text-2xl font-black uppercase italic tracking-tighter mb-1 truncate">
                            {u.name || u.email?.split("@")?.[0] || "ADMIN"}
                          </h4>
                          <p className="text-xs font-bold text-slate-400 mb-2 italic">
                            {u.email}
                          </p>
                          <div className="mb-8">
                            <span
                              className={cn(
                                "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider",
                                u.role === "super"
                                  ? "bg-red-50 text-brand-red"
                                  : u.role === "admin"
                                  ? "bg-blue-50 text-blue-600"
                                  : u.role === "officer"
                                  ? "bg-amber-50 text-amber-600"
                                  : "bg-green-50 text-green-600"
                              )}
                            >
                              {u.role === "super"
                                ? "Admin Utama"
                                : u.role === "admin"
                                ? "Admin"
                                : u.role === "officer"
                                ? "Danru"
                                : "Petugas"}
                            </span>
                          </div>
                          <div className="flex gap-4">
                            <button
                              className="flex-1 bg-slate-900 text-white font-black italic uppercase tracking-tighter py-4 rounded-xl text-[10px] shadow-lg hover:bg-brand-red transition-colors"
                              onClick={() =>
                                showToast("Edit hak akses: " + u.email)
                              }
                            >
                              Konfigurasi
                            </button>
                            <button
                              className="p-4 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg"
                              onClick={async () => {
                                if (
                                  auth.currentUser?.email !==
                                  "ukungdorkas@gmail.com"
                                ) {
                                  showToast(
                                    "Akses ditolak: Hanya Admin Utama yang dapat menghapus akun.",
                                    "error",
                                  );
                                  return;
                                }
                                if (u.email === "ukungdorkas@gmail.com") {
                                  showToast(
                                    "Gagal: Admin Utama tidak dapat dihapus!",
                                    "error",
                                  );
                                  return;
                                }
                                if (
                                  confirm(
                                    `Hapus akun ${u.name || u.email} secara permanen? Semua data akses akan hilang.`,
                                  )
                                ) {
                                  try {
                                    const col =
                                      u.collection ||
                                      (u.role === "admin"
                                        ? "admins"
                                        : "personnel");
                                    await deleteDoc(doc(db, col, u.id));
                                    showToast(
                                      "Akun berhasil dihapus secara permanen.",
                                      "success",
                                    );
                                  } catch (err) {
                                    console.error(err);
                                    showToast(
                                      "Gagal melakukan penghapusan.",
                                      "error",
                                    );
                                  }
                                }
                              }}
                            >
                              <Trash2 className="w-6 h-6" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "ai_chats" && (
              <motion.div
                key="ai_chats"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6 bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                      <Bot className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black italic uppercase tracking-tighter">
                        Riwayat Chat AI
                      </h2>
                      <p className="text-slate-500 font-medium">
                        Histori percakapan Asisten AI dengan pengguna.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-8 border-b-4 border-slate-50">
                    <h3 className="font-black italic uppercase tracking-widest text-slate-400">
                      Daftar Percakapan
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {aiChats.length === 0 ? (
                      <div className="p-20 text-center">
                        <MessageSquare className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest">
                          Belum ada history percakapan.
                        </p>
                      </div>
                    ) : (
                      aiChats.map((chat) => (
                        <div
                          key={chat.id}
                          className="p-8 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                              {new Date(chat.timestamp).toLocaleString("id-ID")}
                            </div>
                            <button
                              onClick={() =>
                                handleDeleteItem("ai_chats", chat.id)
                              }
                              className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm"
                              title="Hapus Percakapan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-4">
                            <div className="flex gap-4">
                              <div className="w-10 h-10 bg-slate-200 rounded-xl flex-shrink-0 flex items-center justify-center">
                                <User className="w-5 h-5 text-slate-500" />
                              </div>
                              <div className="flex-1 bg-slate-100 p-4 rounded-2xl rounded-tl-none">
                                <p className="text-slate-700 font-medium">
                                  {chat.userMessage}
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-4 flex-row-reverse">
                              <div className="w-10 h-10 bg-brand-red rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg">
                                <Sparkles className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 bg-brand-red/10 border border-brand-red/20 p-4 rounded-2xl rounded-tr-none">
                                <div className="prose prose-sm max-w-none text-slate-700">
                                  <Markdown>{chat.assistantMessage}</Markdown>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            

            {activeTab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-4xl"
              >
                {dataLoading.settings ? (
                  <LoadingSpinner message="Sinkronisasi Konfigurasi Sistem..." />
                ) : (
                  <div className="grid md:grid-cols-2 gap-12">
                    <div className="bg-white p-6 lg:p-12 rounded-[3.5rem] border-4 border-slate-900 shadow-2xl space-y-10 overflow-y-auto max-h-[80vh]">
                      <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-6 border-b-8 border-brand-red pb-4 inline-block">
                        Ekosistem{" "}
                        <span className="text-brand-red">Digital</span>
                      </h3>
                      <div className="space-y-6">
                        <div className="flex items-center gap-6">
                          <div className="w-24 h-24 bg-slate-50 border-4 border-slate-100 rounded-2xl flex items-center justify-center font-black italic text-brand-red text-3xl overflow-hidden shadow-inner shrink-0 text-center">
                            {settingsForm.logoUrl ? (
                              <img
                                src={settingsForm.logoUrl}
                                className="w-full h-full object-contain p-2"
                              />
                            ) : (
                              "DM"
                            )}
                          </div>
                          <div className="flex-1">
                            <FileUpload
                              label="Ganti Logo Instansi"
                              allowedTypes={["image/*"]}
                              initialUrl={settingsForm.logoUrl}
                              onUploadSuccess={(url) =>
                                setSettingsForm((prev) => ({
                                  ...prev,
                                  logoUrl: url,
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                            Nama Instansi
                          </label>
                          <input
                            value={settingsForm.agencyName}
                            onChange={(e) =>
                              setSettingsForm((prev) => ({
                                ...prev,
                                agencyName: e.target.value,
                              }))
                            }
                            className="w-full bg-slate-50 border-4 border-slate-100 rounded-2xl p-5 font-black italic outline-none focus:border-brand-red"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                            Slogan Operasional
                          </label>
                          <input
                            value={settingsForm.slogan}
                            onChange={(e) =>
                              setSettingsForm((prev) => ({
                                ...prev,
                                slogan: e.target.value,
                              }))
                            }
                            className="w-full bg-slate-50 border-4 border-slate-100 rounded-2xl p-5 font-black italic outline-none focus:border-brand-red"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                              Kontak Utama
                            </label>
                            <input
                              value={settingsForm.contact}
                              onChange={(e) =>
                                setSettingsForm((prev) => ({
                                  ...prev,
                                  contact: e.target.value,
                                }))
                              }
                              className="w-full bg-slate-50 border-4 border-slate-100 rounded-2xl p-5 font-black italic outline-none focus:border-brand-red"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                              Nomor Darurat
                            </label>
                            <input
                              value={settingsForm.emergencyNumber}
                              onChange={(e) =>
                                setSettingsForm((prev) => ({
                                  ...prev,
                                  emergencyNumber: e.target.value,
                                }))
                              }
                              className="w-full bg-slate-50 border-4 border-slate-100 rounded-2xl p-5 font-black italic outline-none focus:border-brand-red text-brand-red"
                            />
                          </div>
                        </div>

                        <div className="pt-6 border-t-4 border-slate-50">
                          <h4 className="text-sm font-black uppercase italic tracking-widest mb-6 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-brand-red" />{" "}
                            Konfigurasi Gemini AI
                          </h4>
                          <div className="space-y-4">
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                                Gemini API Key (Dinamis)
                              </label>
                              <input
                                type="password"
                                placeholder="Masukan API Key Gemini untuk Fitur AI"
                                value={settingsForm.geminiApiKey}
                                onChange={(e) =>
                                  setSettingsForm((prev) => ({
                                    ...prev,
                                    geminiApiKey: e.target.value,
                                  }))
                                }
                                className="w-full bg-slate-50 border-4 border-slate-100 rounded-2xl p-5 font-black italic outline-none focus:border-brand-red"
                              />
                              <p className="text-[8px] font-bold text-slate-400 mt-2 italic">
                                *Kosongkan jika ingin menggunakan API Key
                                sistem/default.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-6 border-t-4 border-slate-50">
                          <h4 className="text-sm font-black uppercase italic tracking-widest mb-6 flex items-center gap-2">
                            <Radio className="w-4 h-4 text-brand-red" /> Media
                            Sosial
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="relative font-bold">
                              <Instagram className="absolute left-4 top-4 w-5 h-5 text-slate-300" />
                              <input
                                placeholder="Username Instagram"
                                value={settingsForm.socialMedia.instagram}
                                onChange={(e) =>
                                  setSettingsForm((prev) => ({
                                    ...prev,
                                    socialMedia: {
                                      ...prev.socialMedia,
                                      instagram: e.target.value,
                                    },
                                  }))
                                }
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 pl-12 font-bold outline-none focus:border-brand-red"
                              />
                            </div>
                            <div className="relative font-bold">
                              <Facebook className="absolute left-4 top-4 w-5 h-5 text-slate-300" />
                              <input
                                placeholder="Link Facebook"
                                value={settingsForm.socialMedia.facebook}
                                onChange={(e) =>
                                  setSettingsForm((prev) => ({
                                    ...prev,
                                    socialMedia: {
                                      ...prev.socialMedia,
                                      facebook: e.target.value,
                                    },
                                  }))
                                }
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 pl-12 font-bold outline-none focus:border-brand-red"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="pt-6 border-t-4 border-slate-50">
                          <h4 className="text-sm font-black uppercase italic tracking-widest mb-6 flex items-center gap-2">
                            Footer Website
                          </h4>
                          <div className="space-y-4">
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                                Teks Footer (Markdown)
                              </label>
                              <textarea
                                value={settingsForm.footerText}
                                onChange={(e) =>
                                  setSettingsForm((prev) => ({
                                    ...prev,
                                    footerText: e.target.value,
                                  }))
                                }
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none focus:border-brand-red resize-none h-32"
                                placeholder="Masukan deskripsi instansi yang akan tampil di bagian bawah website..."
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                                Hak Cipta / Copyright
                              </label>
                              <input
                                value={settingsForm.footerCopyright}
                                onChange={(e) =>
                                  setSettingsForm((prev) => ({
                                    ...prev,
                                    footerCopyright: e.target.value,
                                  }))
                                }
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none focus:border-brand-red"
                              />
                            </div>
                          </div>
                        </div>

                        {/* DETAILED HOME PAGE SETTINGS */}
                        <div className="pt-8 mt-8 border-t-4 border-slate-900">
                          <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-8 text-brand-red flex items-center gap-4">
                            <LayoutDashboard className="w-8 h-8" /> Kustomisasi
                            Beranda
                          </h3>

                          <div className="space-y-8">
                            <div className="p-8 bg-slate-900 rounded-[2.5rem] border-l-8 border-brand-red text-white shadow-2xl">
                              <div className="flex items-center justify-between mb-6">
                                <h4 className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2">
                                  <Bell className="w-4 h-4 text-brand-red" />{" "}
                                  Bar Pengumuman
                                </h4>
                                <div className="flex items-center gap-3">
                                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                                    {(settingsForm as any).homeLayout
                                      ?.showAnnouncement
                                      ? "AKTIF"
                                      : "NON-AKTIF"}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSettingsForm((prev) => ({
                                        ...prev,
                                        homeLayout: {
                                          ...(prev as any).homeLayout,
                                          showAnnouncement: !(prev as any)
                                            .homeLayout?.showAnnouncement,
                                        },
                                      }))
                                    }
                                    className={cn(
                                      "w-12 h-6 rounded-full transition-all relative",
                                      (settingsForm as any).homeLayout
                                        ?.showAnnouncement
                                        ? "bg-brand-red"
                                        : "bg-slate-700",
                                    )}
                                  >
                                    <div
                                      className={cn(
                                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                                        (settingsForm as any).homeLayout
                                          ?.showAnnouncement
                                          ? "right-1"
                                          : "left-1",
                                      )}
                                    />
                                  </button>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <textarea
                                  value={
                                    (settingsForm as any).homeLayout
                                      ?.announcementText
                                  }
                                  onChange={(e) =>
                                    setSettingsForm((prev) => ({
                                      ...prev,
                                      homeLayout: {
                                        ...(prev as any).homeLayout,
                                        announcementText: e.target.value,
                                      },
                                    }))
                                  }
                                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 font-bold text-xs outline-none focus:border-brand-red min-h-[80px]"
                                  placeholder="Teks pengumuman darurat atau informasi penting..."
                                />
                                <div className="flex items-center gap-4">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    Warna Bar
                                  </label>
                                  <input
                                    type="color"
                                    value={
                                      (settingsForm as any).homeLayout
                                        ?.announcementColor
                                    }
                                    onChange={(e) =>
                                      setSettingsForm((prev) => ({
                                        ...prev,
                                        homeLayout: {
                                          ...(prev as any).homeLayout,
                                          announcementColor: e.target.value,
                                        },
                                      }))
                                    }
                                    className="w-10 h-10 rounded-lg bg-transparent cursor-pointer"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100">
                              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 italic">
                                Hero Section (Video & Media)
                              </h4>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                                    URL Video Hero (YouTube/Direct Link -
                                    Opsional)
                                  </label>
                                  <input
                                    value={
                                      (settingsForm as any).homeLayout
                                        ?.heroVideoUrl
                                    }
                                    onChange={(e) =>
                                      setSettingsForm((prev) => ({
                                        ...prev,
                                        homeLayout: {
                                          ...(prev as any).homeLayout,
                                          heroVideoUrl: e.target.value,
                                        },
                                      }))
                                    }
                                    className="w-full bg-white border-2 border-slate-200 p-4 rounded-xl font-bold text-sm outline-none focus:border-brand-red"
                                    placeholder="https://..."
                                  />
                                  <p className="text-[8px] font-bold text-slate-400 italic">
                                    Jika diisi, video ini akan menggantikan
                                    gambar hero di halaman utama.
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100">
                              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 italic">
                                Kontrol Visibilitas Bagian
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[
                                  {
                                    key: "showNewsSection",
                                    label: "BERITA",
                                    icon: <Newspaper className="w-4 h-4" />,
                                  },
                                  {
                                    key: "showGallerySection",
                                    label: "GALERI",
                                    icon: <ImageIcon className="w-4 h-4" />,
                                  },
                                  {
                                    key: "showEducationSection",
                                    label: "EDUKASI",
                                    icon: <PenTool className="w-4 h-4" />,
                                  },
                                ].map((sec) => (
                                  <button
                                    key={sec.key}
                                    type="button"
                                    onClick={() =>
                                      setSettingsForm((prev) => ({
                                        ...prev,
                                        homeLayout: {
                                          ...(prev as any).homeLayout,
                                          [sec.key]: !(prev as any)
                                            .homeLayout?.[sec.key],
                                        },
                                      }))
                                    }
                                    className={cn(
                                      "p-6 rounded-2xl border-4 transition-all flex flex-col items-center gap-3",
                                      (settingsForm as any).homeLayout?.[
                                        sec.key
                                      ]
                                        ? "bg-slate-900 border-brand-red text-white"
                                        : "bg-white border-slate-200 text-slate-300 opacity-60",
                                    )}
                                  >
                                    {sec.icon}
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                      {sec.label}
                                    </span>
                                    <div
                                      className={cn(
                                        "px-4 py-1 rounded-full text-[8px] font-black",
                                        (settingsForm as any).homeLayout?.[
                                          sec.key
                                        ]
                                          ? "bg-brand-red"
                                          : "bg-slate-200 text-slate-400",
                                      )}
                                    >
                                      {(settingsForm as any).homeLayout?.[
                                        sec.key
                                      ]
                                        ? "ON"
                                        : "OFF"}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* QUICK ACTIONS EDITOR */}
                            <div className="p-8 bg-white rounded-[2.5rem] border-4 border-slate-900">
                              <h4 className="text-sm font-black uppercase italic tracking-widest mb-6 border-b-2 border-slate-100 pb-4">
                                Navigasi Tombol Cepat (Beranda)
                              </h4>
                              <div className="space-y-4">
                                {(
                                  settingsForm as any
                                ).homeLayout?.quickActions?.map(
                                  (action: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="flex flex-col sm:flex-row gap-4 p-6 bg-slate-50 rounded-2xl border-2 border-slate-100"
                                    >
                                      <div className="flex-1 space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                          <div className="space-y-1">
                                            <label className="text-[8px] font-black text-slate-400 uppercase">
                                              Judul Tombol
                                            </label>
                                            <input
                                              value={action.title}
                                              onChange={(e) => {
                                                const newActions = [
                                                  ...(settingsForm as any)
                                                    .homeLayout!.quickActions,
                                                ];
                                                newActions[idx].title =
                                                  e.target.value;
                                                setSettingsForm((prev) => ({
                                                  ...prev,
                                                  homeLayout: {
                                                    ...(prev as any)
                                                      .homeLayout!,
                                                    quickActions: newActions,
                                                  },
                                                }));
                                              }}
                                              className="w-full bg-white p-2 rounded-lg border border-slate-200 font-bold text-xs"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[8px] font-black text-slate-400 uppercase">
                                              Label Kecil
                                            </label>
                                            <input
                                              value={action.label}
                                              onChange={(e) => {
                                                const newActions = [
                                                  ...(settingsForm as any)
                                                    .homeLayout!.quickActions,
                                                ];
                                                newActions[idx].label =
                                                  e.target.value;
                                                setSettingsForm((prev) => ({
                                                  ...prev,
                                                  homeLayout: {
                                                    ...(prev as any)
                                                      .homeLayout!,
                                                    quickActions: newActions,
                                                  },
                                                }));
                                              }}
                                              className="w-full bg-white p-2 rounded-lg border border-slate-200 font-bold text-xs"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newActions = [
                                              ...(settingsForm as any)
                                                .homeLayout!.quickActions,
                                            ];
                                            newActions[idx].enabled =
                                              !newActions[idx].enabled;
                                            setSettingsForm((prev) => ({
                                              ...prev,
                                              homeLayout: {
                                                ...(prev as any).homeLayout!,
                                                quickActions: newActions,
                                              },
                                            }));
                                          }}
                                          className={cn(
                                            "px-6 py-2 rounded-lg font-black text-[10px] uppercase transition-all shadow-sm",
                                            action.enabled
                                              ? "bg-brand-red text-white"
                                              : "bg-slate-200 text-slate-400",
                                          )}
                                        >
                                          {action.enabled
                                            ? "AKTIF"
                                            : "NONAKTIF"}
                                        </button>
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        className="w-full py-5 bg-brand-red text-white font-black italic uppercase tracking-tighter rounded-2xl shadow-xl shadow-red-200 mt-4 hover:scale-[1.02] transition-all"
                        onClick={handleSaveSettings}
                      >
                        Update Konfigurasi Sistem
                      </button>
                    </div>

                    <div className="space-y-12">
                      <div className="bg-white p-6 lg:p-12 rounded-[3.5rem] border-4 border-slate-900 shadow-2xl">
                        <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-10 pb-4 border-b-8 border-slate-900 inline-block">
                          Sistem <span className="text-brand-red">API</span>
                        </h3>
                        <div className="space-y-6">
                          <div className="p-6 bg-slate-50 rounded-2xl border-4 border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                              WA Gateway Status
                            </p>
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-black italic uppercase tracking-tighter text-green-500">
                                TERHUBUNG
                              </span>
                              <div className="w-3 h-3 bg-green-500 rounded-full animate-ping" />
                            </div>
                          </div>
                          <div className="p-6 bg-slate-50 rounded-2xl border-4 border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                              Backup Database
                            </p>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-slate-500 italic">
                                Otomatis / 24 Jam
                              </span>
                              <button
                                className="tag-label bg-slate-900 text-white px-6 py-2 rounded-lg"
                                onClick={() =>
                                  showToast("Dump database dimulai...")
                                }
                              >
                                Backup Sekarang
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-brand-dark p-6 md:p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                          <h4 className="text-xl font-black uppercase italic italic mb-4">
                            Update Versi App
                          </h4>
                          <p className="text-slate-500 text-xs font-bold mb-6">
                            Versi saat ini: 2.4.0 (Stable)
                            <br />
                            Terakhir diperbarui: 8 Mei 2026
                          </p>
                          <button className="w-full py-4 bg-brand-red rounded-xl font-black italic uppercase tracking-tighter shadow-xl shadow-red-900/40">
                            Periksa Update
                          </button>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/10 blur-3xl" />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
            {activeTab === "themes" && (
              <motion.div
                key="themes"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-12"
              >
                <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6 bg-white p-5 md:p-8 rounded-3xl border-4 border-slate-900 shadow-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-red rounded-xl flex items-center justify-center shadow-lg">
                      <LayoutDashboard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none">
                        Theme Manager
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Atur Tampilan Visual Aplikasi
                      </p>
                    </div>
                  </div>
                  <button
                    className="bg-brand-dark px-8 py-3 rounded-xl text-white font-black italic uppercase tracking-tighter hover:bg-brand-red transition-all shadow-xl"
                    onClick={() => {
                      setEditingItem(null);
                      setThemeForm({
                        name: "",
                        primaryColor: "#e11d48",
                        secondaryColor: "#0f172a",
                        accentColor: "#fbbf24",
                        backgroundColor: "#f1f5f9",
                        surfaceColor: "#ffffff",
                        textColor: "#0f172a",
                        fontFamily: "Inter",
                        isDark: false,
                        thumbnailUrl: "",
                      });
                      setShowThemeModal(true);
                    }}
                  >
                    Tambah Tema Baru
                  </button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {themes.length === 0 ? (
                    <div className="col-span-full p-10 md:p-20 text-center bg-white rounded-[2rem] border-4 border-dashed border-slate-200">
                      <p className="text-slate-300 font-black italic uppercase tracking-[0.4em] mb-8">
                        Belum ada katalog tema
                      </p>
                      <button
                        onClick={seedThemes}
                        className="bg-brand-red px-8 py-3 rounded-xl text-white font-black italic uppercase tracking-tighter hover:bg-brand-dark transition-all shadow-xl"
                      >
                        Gunakan Tema Bawaan
                      </button>
                    </div>
                  ) : (
                    themes.map((theme) => (
                      <div
                        key={theme.id}
                        className={cn(
                          "bg-white rounded-[2.5rem] border-4 p-5 md:p-8 relative shadow-2xl transition-all group overflow-hidden",
                          theme.isActive
                            ? "border-brand-red scale-[1.02]"
                            : "border-slate-900 hover:border-brand-red opacity-80 hover:opacity-100",
                        )}
                      >
                        {theme.isActive && (
                          <div className="absolute top-0 right-0 bg-brand-red text-white py-2 px-6 rounded-bl-[2rem] font-black italic uppercase text-[10px] tracking-widest shadow-lg z-10">
                            TEMA AKTIF
                          </div>
                        )}

                        {/* Theme Colors Preview */}
                        <div className="aspect-video bg-slate-50 rounded-2xl mb-6 relative overflow-hidden border-2 border-slate-100 flex items-center justify-center">
                          <div className="absolute inset-0 flex">
                            <div
                              className="flex-1"
                              style={{ backgroundColor: theme.primaryColor }}
                            ></div>
                            <div
                              className="flex-1"
                              style={{ backgroundColor: theme.secondaryColor }}
                            ></div>
                            <div
                              className="flex-1"
                              style={{ backgroundColor: theme.backgroundColor }}
                            ></div>
                          </div>
                          <div className="relative z-10 bg-white/90 backdrop-blur-md p-4 rounded-xl border border-white font-black italic tracking-tighter text-slate-900 text-sm">
                            {theme.name}
                          </div>
                        </div>

                        <h4 className="text-2xl font-black uppercase italic tracking-tighter mb-2">
                          {theme.name}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8 italic">
                          Font: {theme.fontFamily} • Mode:{" "}
                          {theme.isDark ? "Gelap" : "Terang"}
                        </p>

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
                                thumbnailUrl: theme.thumbnailUrl || "",
                              });
                              setShowThemeModal(true);
                            }}
                            className="flex-1 bg-slate-50 border-2 border-slate-100 font-black italic uppercase tracking-tighter py-4 rounded-xl text-[10px] text-slate-400 hover:border-brand-dark hover:text-brand-dark transition-all"
                          >
                            Kustomisasi
                          </button>
                          {!theme.isActive && (
                            <button
                              onClick={() =>
                                handleDeleteItem("themes", theme.id)
                              }
                              className="p-4 bg-red-50 text-brand-red rounded-xl hover:bg-brand-red hover:text-white transition-all shadow-md"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Default Preset Themes Tip */}
                <div className="bg-brand-dark p-6 lg:p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden border-8 border-brand-red">
                  <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                    <div className="w-40 h-40 bg-brand-red rounded-full flex items-center justify-center shrink-0 shadow-2xl shadow-red-900/50">
                      <Settings className="w-20 h-20 text-white animate-spin-slow" />
                    </div>
                    <div className="flex-1 text-center lg:text-left">
                      <h3 className="text-4xl font-black uppercase italic tracking-tighter mb-4 leading-none">
                        Theme{" "}
                        <span className="text-brand-red">Import Wizard</span>
                      </h3>
                      <p className="text-slate-400 font-bold mb-8">
                        Administrator dapat menambahkan tema kustom melalui file
                        JSON atau ZIP konfigurasi. Semua aset warna, font, dan
                        layout akan terintegrasi otomatis ke seluruh modul
                        sistem.
                      </p>
                      <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                        <button className="bg-white text-brand-dark px-10 py-4 rounded-xl font-black italic uppercase tracking-tighter text-sm shadow-xl hover:scale-105 transition-all">
                          Upload ZIP Tema
                        </button>
                        <button className="bg-slate-800 text-slate-400 border border-slate-700 px-10 py-4 rounded-xl font-black italic uppercase tracking-tighter text-sm transition-all hover:text-white">
                          Ekspor Konfigurasi
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-[500px] h-[500px] border border-white/5 rounded-full pointer-events-none translate-x-1/2 -translate-y-1/2" />
                </div>
              </motion.div>
            )}
            {activeTab === "files" && (
              <motion.div
                key="files"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-12"
              >
                <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6 bg-white p-5 md:p-8 rounded-3xl border-4 border-slate-900 shadow-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                      <HardDrive className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-3xl font-display font-black uppercase tracking-tighter text-slate-900">
                        Pengelola File Media
                      </h2>
                      <p className="text-slate-500 font-medium mt-1">
                        Kelola data gambar/video yang diunggah ke server
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={loadMediaFiles}
                    className="h-14 px-8 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-2xl font-bold transition-all shadow-md flex items-center justify-center gap-3"
                  >
                    <RefreshCw size={20} />
                    <span>Muat Ulang</span>
                  </button>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border-4 border-slate-900">
                  {filesLoading ? (
                    <div className="flex justify-center p-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {mediaFiles.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-slate-400 font-bold italic">
                          Belum ada file
                        </div>
                      ) : (
                        mediaFiles.map((file, idx) => (
                          <div key={idx} className="group relative bg-slate-50 rounded-2xl border-2 border-slate-200 overflow-hidden flex flex-col">
                            <div className="h-40 bg-slate-200 relative overflow-hidden flex items-center justify-center">
                              {file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <img src={file.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              ) : (
                                <PlayCircle className="w-16 h-16 text-slate-400" />
                              )}
                            </div>
                            <div className="p-4 flex flex-col flex-grow">
                              <span className="font-mono text-sm break-all font-bold text-slate-800 line-clamp-2" title={file.name}>
                                {file.name}
                              </span>
                              <div className="flex justify-between items-center mt-auto pt-4 relative z-10">
                                <span className="text-xs text-slate-500 font-medium">
                                  {(file.size / 1024).toFixed(1)} KB
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setFileToRename({ name: file.name });
                                      setRenameInput(file.name);
                                    }}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setFileToDelete({ name: file.name });
                                    }}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "banners" && (
              <motion.div
                key="banners"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-12"
              >
                <div className="bg-brand-dark p-6 lg:p-12 rounded-[3.5rem] relative overflow-hidden shadow-2xl">
                  <div className="relative z-10">
                    <h3 className="text-5xl text-white font-black uppercase italic tracking-tighter mb-4">
                      Manajemen{" "}
                      <span className="text-brand-red">Banner & Visual</span>
                    </h3>
                    <p className="text-slate-400 font-bold max-w-xl text-lg">
                      Kustomisasi tampilan hero section untuk setiap halaman
                      utama aplikasi anda.
                    </p>
                  </div>
                  <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-brand-red rounded-full blur-[120px] opacity-20" />
                </div>

                <div className="flex justify-between items-center mb-8">
                  <h4 className="text-3xl font-black uppercase italic tracking-tighter">
                    Daftar <span className="text-brand-red">Banner</span>
                  </h4>
                  <button
                    onClick={seedBanners}
                    className="bg-slate-900 px-8 py-3 rounded-xl text-white font-black italic uppercase tracking-tighter hover:bg-slate-800 transition-all"
                  >
                    Setup Default Banner
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {dataLoading.banners ? (
                    <div className="col-span-full py-12 md:py-20 px-4 text-center">
                      <LoadingSpinner message="Sinkronisasi Elemen Visual..." />
                    </div>
                  ) : banners.length === 0 ? (
                    <div className="col-span-full p-10 md:p-20 text-center bg-white rounded-[2rem] border-4 border-dashed border-slate-200 font-black italic text-slate-300 uppercase tracking-[0.4em]">
                      Belum Ada Konfigurasi Banner...
                    </div>
                  ) : (
                    banners.map((banner) => (
                      <div
                        key={banner.id}
                        className="bg-white rounded-[2.5rem] border-4 border-slate-900 overflow-hidden shadow-2xl group flex flex-col"
                      >
                        <div className="h-48 relative overflow-hidden">
                          <img
                            src={banner.imageUrl}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                          <div className="absolute bottom-4 left-6">
                            <span className="bg-brand-red text-white text-[8px] font-black uppercase px-3 py-1 rounded-full mb-2 inline-block">
                              PAGE ID: {banner.id}
                            </span>
                            <h5 className="text-xl text-white font-black italic uppercase tracking-tighter shadow-sm">
                              {banner.title}
                            </h5>
                          </div>
                        </div>
                        <div className="p-8 flex-1 flex flex-col">
                          <p className="text-xs font-bold text-slate-400 italic line-clamp-2 mb-6 flex-1">
                            "{banner.subtitle}"
                          </p>
                          <button
                            onClick={() => {
                              setEditingItem(banner);
                              setBannerForm({
                                id: banner.id,
                                title: banner.title,
                                subtitle: banner.subtitle,
                                imageUrl: banner.imageUrl,
                                ctaText: banner.ctaText || "",
                                ctaLink: banner.ctaLink || "",
                                overlayOpacity: banner.overlayOpacity ?? 0.4,
                                backgroundColor:
                                  banner.backgroundColor || "#0f172a",
                                backgroundImageUrl:
                                  banner.backgroundImageUrl || "",
                                stats: banner.stats || [],
                              });
                              setShowBannerModal(true);
                            }}
                            className="w-full py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-black italic uppercase tracking-tighter flex items-center justify-center gap-3 hover:bg-brand-red hover:text-white hover:border-brand-red transition-all"
                          >
                            <Edit className="w-4 h-4" /> Edit Banner Visual
                          </button>
                        </div>
                      </div>
                    ))
                  )}
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowThemeModal(false)}
              className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-4xl rounded-[3rem] border-8 border-slate-900 shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-slate-900 p-5 md:p-8 text-white flex justify-between items-center shrink-0">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">
                  {editingItem ? "Edit Tema Visual" : "Tambah Tema Baru"}
                </h3>
                <button
                  onClick={() => setShowThemeModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
              <form
                onSubmit={handleSaveTheme}
                className="p-10 space-y-8 overflow-y-auto w-full"
              >
                {/* Color Presets */}
                <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 mb-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 text-center">
                    🎨 Preset Tema Profesional (Akses Cepat)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {THEME_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() =>
                          setThemeForm({ ...themeForm, ...preset })
                        }
                        className="group p-4 bg-white rounded-xl border-2 border-slate-200 hover:border-brand-red hover:shadow-lg transition-all text-left"
                      >
                        <div className="flex h-3 w-full rounded-full overflow-hidden mb-3 shadow-inner">
                          <div
                            style={{ backgroundColor: preset.primaryColor }}
                            className="flex-1"
                            title="Primary"
                          />
                          <div
                            style={{ backgroundColor: preset.secondaryColor }}
                            className="flex-1"
                            title="Secondary"
                          />
                          <div
                            style={{ backgroundColor: preset.accentColor }}
                            className="flex-1"
                            title="Accent"
                          />
                        </div>
                        <p className="text-[10px] font-black uppercase italic tracking-tighter text-slate-600 group-hover:text-brand-red truncate">
                          {preset.name}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-10">
                  {/* Left Column: Form Controls */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Nama Tema Identitas
                      </label>
                      <input
                        required
                        value={themeForm.name}
                        onChange={(e) =>
                          setThemeForm({ ...themeForm, name: e.target.value })
                        }
                        className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red transition-colors"
                        placeholder="Contoh: Tactical Command"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Warna Utama (Primary)
                        </label>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              value={themeForm.primaryColor}
                              onChange={(e) =>
                                setThemeForm({
                                  ...themeForm,
                                  primaryColor: e.target.value,
                                })
                              }
                              className="w-14 h-14 bg-white rounded-xl border-4 border-slate-100 cursor-pointer shadow-sm active:scale-95 transition-transform"
                            />
                            <div className="flex-1 bg-slate-50 border-2 border-slate-100 p-3 rounded-lg font-mono text-[10px] uppercase font-bold text-slate-400 tabular-nums text-center">
                              {themeForm.primaryColor}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 justify-center">
                            {[
                              "#e11d48",
                              "#ef4444",
                              "#f97316",
                              "#3b82f6",
                              "#10b981",
                              "#6366f1",
                            ].map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() =>
                                  setThemeForm({
                                    ...themeForm,
                                    primaryColor: c,
                                  })
                                }
                                className={cn(
                                  "w-6 h-6 rounded-full border-2 transition-all hover:scale-110",
                                  themeForm.primaryColor === c
                                    ? "border-brand-red"
                                    : "border-white",
                                )}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Warna Sekunder
                        </label>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              value={themeForm.secondaryColor}
                              onChange={(e) =>
                                setThemeForm({
                                  ...themeForm,
                                  secondaryColor: e.target.value,
                                })
                              }
                              className="w-14 h-14 bg-white rounded-xl border-4 border-slate-100 cursor-pointer shadow-sm active:scale-95 transition-transform"
                            />
                            <div className="flex-1 bg-slate-50 border-2 border-slate-100 p-3 rounded-lg font-mono text-[10px] uppercase font-bold text-slate-400 tabular-nums text-center">
                              {themeForm.secondaryColor}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 justify-center">
                            {[
                              "#0f172a",
                              "#1e293b",
                              "#020617",
                              "#334155",
                              "#475569",
                            ].map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() =>
                                  setThemeForm({
                                    ...themeForm,
                                    secondaryColor: c,
                                  })
                                }
                                className={cn(
                                  "w-6 h-6 rounded-full border-2 transition-all hover:scale-110",
                                  themeForm.secondaryColor === c
                                    ? "border-brand-red"
                                    : "border-white",
                                )}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Warna Latar (BG)
                        </label>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              value={themeForm.backgroundColor}
                              onChange={(e) =>
                                setThemeForm({
                                  ...themeForm,
                                  backgroundColor: e.target.value,
                                })
                              }
                              className="w-14 h-14 bg-white rounded-xl border-4 border-slate-100 cursor-pointer shadow-sm active:scale-95 transition-transform"
                            />
                            <div className="flex-1 bg-slate-50 border-2 border-slate-100 p-3 rounded-lg font-mono text-[10px] uppercase font-bold text-slate-400 tabular-nums text-center">
                              {themeForm.backgroundColor}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 justify-center">
                            {[
                              "#f1f5f9",
                              "#ffffff",
                              "#020617",
                              "#111827",
                              "#000000",
                            ].map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() =>
                                  setThemeForm({
                                    ...themeForm,
                                    backgroundColor: c,
                                  })
                                }
                                className={cn(
                                  "w-6 h-6 rounded-full border-2 transition-all hover:scale-110",
                                  themeForm.backgroundColor === c
                                    ? "border-brand-red"
                                    : "border-white",
                                )}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Warna Teks Konten
                        </label>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              value={themeForm.textColor}
                              onChange={(e) =>
                                setThemeForm({
                                  ...themeForm,
                                  textColor: e.target.value,
                                })
                              }
                              className="w-14 h-14 bg-white rounded-xl border-4 border-slate-100 cursor-pointer shadow-sm active:scale-95 transition-transform"
                            />
                            <div className="flex-1 bg-slate-50 border-2 border-slate-100 p-3 rounded-lg font-mono text-[10px] uppercase font-bold text-slate-400 tabular-nums text-center">
                              {themeForm.textColor}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 justify-center">
                            {[
                              "#0f172a",
                              "#1e293b",
                              "#f8fafc",
                              "#ffffff",
                              "#94a3b8",
                            ].map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() =>
                                  setThemeForm({ ...themeForm, textColor: c })
                                }
                                className={cn(
                                  "w-6 h-6 rounded-full border-2 transition-all hover:scale-110",
                                  themeForm.textColor === c
                                    ? "border-brand-red"
                                    : "border-white",
                                )}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Warna Aksen
                        </label>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              value={themeForm.accentColor}
                              onChange={(e) =>
                                setThemeForm({
                                  ...themeForm,
                                  accentColor: e.target.value,
                                })
                              }
                              className="w-14 h-14 bg-white rounded-xl border-4 border-slate-100 cursor-pointer shadow-sm active:scale-95 transition-transform"
                            />
                            <div className="flex-1 bg-slate-50 border-2 border-slate-100 p-3 rounded-lg font-mono text-[10px] uppercase font-bold text-slate-400 tabular-nums text-center">
                              {themeForm.accentColor}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 justify-center">
                            {[
                              "#fbbf24",
                              "#38bdf8",
                              "#10b981",
                              "#f43f5e",
                              "#ffffff",
                            ].map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() =>
                                  setThemeForm({ ...themeForm, accentColor: c })
                                }
                                className={cn(
                                  "w-6 h-6 rounded-full border-2 transition-all hover:scale-110",
                                  themeForm.accentColor === c
                                    ? "border-brand-red"
                                    : "border-white",
                                )}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Psikologi Mode
                        </label>
                        <div className="flex bg-slate-100 p-1.5 rounded-xl gap-1.5 h-[5.5rem] items-center">
                          <button
                            type="button"
                            onClick={() =>
                              setThemeForm({ ...themeForm, isDark: false })
                            }
                            className={cn(
                              "flex-1 h-full rounded-lg font-black text-[10px] uppercase transition-all flex flex-col items-center justify-center gap-2",
                              !themeForm.isDark
                                ? "bg-white text-slate-900 shadow-xl scale-100"
                                : "text-slate-400 hover:text-slate-600 scale-95",
                            )}
                          >
                            <div className="w-4 h-4 rounded-full bg-slate-100 border-2 border-slate-300" />
                            Terang
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setThemeForm({ ...themeForm, isDark: true })
                            }
                            className={cn(
                              "flex-1 h-full rounded-lg font-black text-[10px] uppercase transition-all flex flex-col items-center justify-center gap-2",
                              themeForm.isDark
                                ? "bg-slate-900 text-white shadow-xl scale-100"
                                : "text-slate-400 hover:text-slate-600 scale-95",
                            )}
                          >
                            <div className="w-4 h-4 rounded-full bg-white animate-pulse" />
                            Gelap
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Preview & Font */}
                  <div className="space-y-8">
                    <div className="bg-slate-900 p-6 md:p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group border-4 border-white/5">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 blur-3xl rounded-full" />
                      <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-red mb-8 italic">
                        PREVIEW KONFIGURASI LIVE
                      </h4>
                      <div className="space-y-6">
                        <div
                          className="h-14 w-full rounded-xl shadow-lg flex items-center px-6"
                          style={{ backgroundColor: themeForm.primaryColor }}
                        >
                          <div className="w-6 h-6 bg-white/20 rounded-lg animate-pulse" />
                        </div>
                        <div
                          className="h-40 w-full rounded-3xl p-5 md:p-8 flex flex-col justify-center gap-2 border shadow-inner transition-colors duration-500"
                          style={{
                            backgroundColor: themeForm.backgroundColor,
                            color: themeForm.textColor,
                            borderColor: themeForm.surfaceColor,
                          }}
                        >
                          <p
                            className="text-3xl font-black italic uppercase leading-none tracking-tighter"
                            style={{ fontFamily: themeForm.fontFamily }}
                          >
                            Sample Text
                          </p>
                          <p className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-50 italic">
                            Sistem Informasi Damkar Malinau
                          </p>
                          <div className="mt-4 flex gap-2">
                            <div className="px-3 py-1 bg-brand-red/10 text-brand-red text-[8px] font-black uppercase rounded-full">
                              Badge Preview
                            </div>
                            <div className="px-3 py-1 bg-slate-100 text-slate-500 text-[8px] font-black uppercase rounded-full">
                              System Tag
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div
                            className="w-16 h-16 rounded-[1.5rem] shadow-xl flex items-center justify-center transition-transform hover:rotate-12"
                            style={{ backgroundColor: themeForm.accentColor }}
                          >
                            <Sparkles className="w-8 h-8 text-white/50" />
                          </div>
                          <div className="flex-1 h-16 rounded-[1.5rem] border-2 border-dashed border-white/10 flex items-center justify-center font-black italic uppercase tracking-tighter text-xs opacity-30">
                            Module Preview Area
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Tipografi (Font Family)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          {
                            id: "Inter",
                            name: "Inter (UI Modern)",
                            class: "font-sans",
                          },
                          {
                            id: "Space Grotesk",
                            name: "Grotesk (Brutalist)",
                            class: "font-display",
                          },
                          {
                            id: "JetBrains Mono",
                            name: "Mono (Technical)",
                            class: "font-mono",
                          },
                          {
                            id: "Outfit",
                            name: "Outfit (Geometric)",
                            class: "font-sans",
                          },
                        ].map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() =>
                              setThemeForm({ ...themeForm, fontFamily: f.id })
                            }
                            className={cn(
                              "p-4 rounded-xl border-2 text-left transition-all",
                              themeForm.fontFamily === f.id
                                ? "border-brand-red bg-white shadow-md scale-105"
                                : "border-slate-100 bg-slate-50 text-slate-400 grayscale",
                            )}
                          >
                            <p className="text-[10px] font-black truncate">
                              {f.name}
                            </p>
                            <p
                              className="text-xl font-bold italic tracking-tighter mt-1"
                              style={{ fontFamily: f.id }}
                            >
                              AaBb
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t-8 border-slate-900 mt-10">
                  <button
                    type="submit"
                    className="group w-full py-6 bg-brand-red text-white font-black italic uppercase tracking-tighter rounded-3xl shadow-[0_20px_50px_rgba(225,29,72,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-6"
                  >
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-180 transition-transform">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <span className="text-xl">
                      {editingItem
                        ? "INKORPORASI PERUBAHAN TEMA"
                        : "AKTIVASI KONTROL TEMA BARU"}
                    </span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {showReportModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReportModal(false)}
              className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] border-8 border-slate-900 shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-slate-900 p-5 md:p-8 text-white flex justify-between items-center shrink-0">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">
                  Tambah Laporan Manual
                </h3>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSaveReport} className="p-8 space-y-6 overflow-y-auto w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Jenis Kejadian
                    </label>
                    <select
                      value={reportForm.type}
                      onChange={(e) =>
                        setReportForm({ ...reportForm, type: e.target.value })
                      }
                      className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                    >
                      <option>KEBAKARAN</option>
                      <option>PENYELAMATAN</option>
                      <option>MEDIS</option>
                      <option>LAINNYA</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Level Urgensi
                    </label>
                    <select
                      value={reportForm.level}
                      onChange={(e) =>
                        setReportForm({ ...reportForm, level: e.target.value })
                      }
                      className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                    >
                      <option value="normal">NORMAL (HIJAU)</option>
                      <option value="critical">KRITIS (MERAH)</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Lokasi / Alamat
                  </label>
                  <input
                    required
                    value={reportForm.location.address}
                    onChange={(e) =>
                      setReportForm({
                        ...reportForm,
                        location: {
                          ...reportForm.location,
                          address: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                    placeholder="Alamat lengkap kejadian..."
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Nama Pelapor
                    </label>
                    <input
                      required
                      value={reportForm.reporterName}
                      onChange={(e) =>
                        setReportForm({
                          ...reportForm,
                          reporterName: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Nomor HP
                    </label>
                    <input
                      required
                      value={reportForm.reporterPhone}
                      onChange={(e) =>
                        setReportForm({
                          ...reportForm,
                          reporterPhone: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                      placeholder="08..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Deskripsi / Catatan Petugas
                  </label>
                  <textarea
                    value={reportForm.description}
                    onChange={(e) =>
                      setReportForm({
                        ...reportForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red resize-none"
                    rows={3}
                    placeholder="Detail kejadian..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Foto Dokumentasi Awal
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FileUpload
                      label="Upload Foto"
                      allowedTypes={["image/*"]}
                      onUploadSuccess={(url) =>
                        setReportForm({
                          ...reportForm,
                          photos: [...(reportForm.photos || []), url],
                        })
                      }
                    />
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {reportForm.photos?.map((p, i) => (
                        <div key={i} className="relative w-16 h-16 shrink-0">
                          <img
                            src={p}
                            className="w-full h-full object-cover rounded-lg border-2 border-slate-100"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setReportForm({
                                ...reportForm,
                                photos: reportForm.photos.filter(
                                  (_, idx) => idx !== i,
                                ),
                              })
                            }
                            className="absolute -top-1 -right-1 bg-brand-red text-white p-0.5 rounded-full"
                          >
                            <CloseIcon className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-5 bg-brand-red text-white font-black italic uppercase tracking-tighter rounded-2xl shadow-xl hover:scale-[1.02] transition-all"
                >
                  {editingItem ? "Perbarui Laporan" : "Simpan Laporan"}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* NEWS MODAL */}
        {showNewsModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewsModal(false)}
              className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-3xl rounded-[3rem] border-8 border-slate-900 shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-slate-900 p-5 md:p-8 text-white flex justify-between items-center shrink-0">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">
                  {editingItem ? "Edit Warta Berita" : "Tambah Warta Baru"}
                </h3>
                <button
                  onClick={() => setShowNewsModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSaveNews} className="p-8 space-y-6 overflow-y-auto w-full">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Judul Berita
                  </label>
                  <input
                    required
                    value={newsForm.title}
                    onChange={(e) =>
                      setNewsForm({ ...newsForm, title: e.target.value })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Kategori
                    </label>
                    <select
                      value={newsForm.category}
                      onChange={(e) =>
                        setNewsForm({ ...newsForm, category: e.target.value })
                      }
                      className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                    >
                      <option>WARTA</option>
                      <option>KEGIATAN</option>
                      <option>EDUKASI</option>
                      <option>PENGUMUMAN</option>
                    </select>
                  </div>
                  <FileUpload
                    label="Upload Gambar Berita"
                    allowedTypes={["image/*"]}
                    initialUrl={newsForm.imageUrl}
                    onUploadSuccess={(url) =>
                      setNewsForm({ ...newsForm, imageUrl: url })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-end mb-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Konten Berita (Markdown)
                    </label>
                    <button
                      type="button"
                      onClick={handleDevelopNarrative}
                      disabled={isAiDeveloping}
                      className="flex items-center gap-2 bg-brand-red/10 text-brand-red px-4 py-1.5 rounded-full text-[10px] font-black italic uppercase tracking-widest hover:bg-brand-red hover:text-white transition-all disabled:opacity-50"
                    >
                      {isAiDeveloping ? (
                        <>
                          <CloudLightning className="w-3 h-3 animate-bounce" />{" "}
                          Mengembangkan...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" /> Pena Narasi AI
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    required
                    value={newsForm.content}
                    onChange={(e) =>
                      setNewsForm({ ...newsForm, content: e.target.value })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red resize-none h-64"
                    placeholder="Tulis rincian warta atau kerangka draf di sini..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-5 bg-slate-900 text-white font-black italic uppercase tracking-tighter rounded-2xl shadow-xl hover:scale-[1.02] transition-all"
                >
                  Publish Warta
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* USER MODAL */}
        {showUserModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUserModal(false)}
              className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[3rem] border-8 border-slate-900 shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-slate-900 p-5 md:p-8 text-white flex justify-between items-center shrink-0">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">
                  Tambah Akses Petugas
                </h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSaveUser} className="p-8 space-y-6 overflow-y-auto w-full">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Email Petugas
                  </label>
                  <input
                    required
                    type="email"
                    value={userForm.email}
                    onChange={(e) =>
                      setUserForm({ ...userForm, email: e.target.value })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Role Akses
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) =>
                      setUserForm({ ...userForm, role: e.target.value })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                  >
                    <option value="admin">ADMIN (OPERASIONAL)</option>
                    <option value="officer">KOMANDAN REGU (DANRU)</option>
                    <option value="super">SUPER ADMIN (KONTROL PENUH)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Password Sementara
                  </label>
                  <input
                    required
                    type="password"
                    value={userForm.password}
                    onChange={(e) =>
                      setUserForm({ ...userForm, password: e.target.value })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                    placeholder="Minimal 6 karakter"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-5 bg-brand-red text-white font-black italic uppercase tracking-tighter rounded-2xl shadow-xl hover:scale-[1.02] transition-all"
                >
                  Simpan Petugas
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* FLOOD SENSOR MODAL */}
        {showFloodModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFloodModal(false)}
              className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[3rem] border-8 border-slate-900 shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-slate-900 p-5 md:p-8 text-white flex justify-between items-center shrink-0">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">
                  {editingItem ? "Edit" : "Tambah"} Sensor Sungai
                </h3>
                <button
                  onClick={() => setShowFloodModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSaveRiver} className="p-8 space-y-6 overflow-y-auto w-full">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Nama Lokasi / Area
                  </label>
                  <input
                    required
                    value={riverForm.locationName}
                    onChange={(e) =>
                      setRiverForm({
                        ...riverForm,
                        locationName: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                    placeholder="Contoh: Kuala Lapang, Malinau Kota"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Tinggi Air (Meter)
                    </label>
                    <input
                      required
                      type="number"
                      step="0.1"
                      value={riverForm.waterLevel}
                      onChange={(e) =>
                        setRiverForm({
                          ...riverForm,
                          waterLevel: parseFloat(e.target.value),
                        })
                      }
                      className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Trend
                    </label>
                    <select
                      value={riverForm.trend}
                      onChange={(e) =>
                        setRiverForm({
                          ...riverForm,
                          trend: e.target.value as any,
                        })
                      }
                      className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                    >
                      <option value="stable">STABIL (→)</option>
                      <option value="rising">NAIK (↑)</option>
                      <option value="falling">TURUN (↓)</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Status Kesiagaan
                  </label>
                  <select
                    value={riverForm.status}
                    onChange={(e) =>
                      setRiverForm({
                        ...riverForm,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                  >
                    <option value="Aman">AMAN (NORMAL)</option>
                    <option value="Waspada">WASPADA (CUSP)</option>
                    <option value="Siaga">SIAGA (URGENT)</option>
                    <option value="Bahaya">BAHAYA (CRITICAL)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-5 bg-brand-red text-white font-black italic uppercase tracking-tighter rounded-2xl shadow-xl hover:scale-[1.02] transition-all"
                >
                  Simpan Data Sensor
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* WEATHER UPSTREAM MODAL */}
        {showWeatherModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWeatherModal(false)}
              className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[3rem] border-8 border-slate-900 shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-slate-900 p-5 md:p-8 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <CloudRain className="w-5 h-5 text-brand-red" />
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter">
                    Update Cuaca Hulu
                  </h3>
                </div>
                <button
                  onClick={() => setShowWeatherModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSaveWeather} className="p-8 space-y-6 overflow-y-auto w-full">
                <div className="flex justify-center -mt-4 mb-4">
                  <button
                    type="button"
                    onClick={handleFetchAiWeather}
                    disabled={isFetchingAiWeather}
                    className="bg-brand-red text-white px-6 py-2 rounded-full text-[10px] font-black uppercase italic tracking-widest shadow-lg flex items-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isFetchingAiWeather ? (
                      <>
                        <CloudLightning className="w-4 h-4 animate-spin" />{" "}
                        Sedang Menarik Data Satelit...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> Tarik Data Otomatis (Satelit Open-Meteo)
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Kondisi Cuaca
                  </label>
                  <input
                    required
                    value={weatherForm.condition}
                    onChange={(e) =>
                      setWeatherForm({
                        ...weatherForm,
                        condition: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                    placeholder="Cerah / Hujan Ringan..."
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Curah Hujan (mm)
                    </label>
                    <input
                      required
                      type="number"
                      value={weatherForm.rainfall}
                      onChange={(e) =>
                        setWeatherForm({
                          ...weatherForm,
                          rainfall: parseInt(e.target.value),
                        })
                      }
                      className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Potensi Luapan
                    </label>
                    <select
                      value={weatherForm.overflowPotential}
                      onChange={(e) =>
                        setWeatherForm({
                          ...weatherForm,
                          overflowPotential: e.target.value as any,
                        })
                      }
                      className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                    >
                      <option>Rendah</option>
                      <option>Sedang</option>
                      <option>Tinggi</option>
                      <option>Sangat Tinggi</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Kesimpulan Data (Satelit Open-Meteo)
                  </label>
                  <textarea
                    required
                    value={weatherForm.summary}
                    onChange={(e) =>
                      setWeatherForm({
                        ...weatherForm,
                        summary: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red h-20 resize-none"
                    placeholder="Hasil analisa AI..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Rekomendasi (Instruksi)
                  </label>
                  <textarea
                    required
                    value={weatherForm.recommendation}
                    onChange={(e) =>
                      setWeatherForm({
                        ...weatherForm,
                        recommendation: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red h-24 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-5 bg-slate-900 text-white font-black italic uppercase tracking-tighter rounded-2xl shadow-xl hover:scale-[1.02] transition-all"
                >
                  Publish Update Cuaca
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* GALLER MODAL */}
        {showGalleryModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGalleryModal(false)}
              className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[3rem] border-8 border-slate-900 shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-slate-900 p-5 md:p-8 text-white flex justify-between items-center shrink-0">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">
                  Unggah Media Baru
                </h3>
                <button
                  onClick={() => setShowGalleryModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSaveGallery} className="p-8 space-y-6 overflow-y-auto w-full">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Judul Media
                  </label>
                  <input
                    required
                    value={galleryForm.title}
                    onChange={(e) =>
                      setGalleryForm({ ...galleryForm, title: e.target.value })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                    placeholder="Contoh: Pemadaman di Pasar..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Kategori
                  </label>
                  <select
                    value={galleryForm.category}
                    onChange={(e) =>
                      setGalleryForm({
                        ...galleryForm,
                        category: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                  >
                    <option>OPERASIONAL</option>
                    <option>KEGIATAN</option>
                    <option>PELATIHAN</option>
                    <option>ALUTSISTA</option>
                  </select>
                </div>
                <FileUpload
                  label="Unggah Dokumentasi Media"
                  allowedTypes={["image/*", "video/*"]}
                  initialUrl={galleryForm.imageUrl}
                  onUploadSuccess={(url) =>
                    setGalleryForm({ ...galleryForm, imageUrl: url })
                  }
                />
                {galleryForm.imageUrl && (
                  <div className="mt-4 rounded-xl overflow-hidden border-2 border-slate-100 aspect-video">
                    <img
                      src={galleryForm.imageUrl}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Deskripsi Media
                  </label>
                  <textarea
                    value={galleryForm.description}
                    onChange={(e) =>
                      setGalleryForm({
                        ...galleryForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red min-h-[120px]"
                    placeholder="Berikan keterangan singkat mengenai foto dokumentasi ini..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-5 bg-brand-red text-white font-black italic uppercase tracking-tighter rounded-2xl shadow-xl hover:scale-[1.02] transition-all"
                >
                  Selesai Unggah
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* EDUCATION MODAL */}
        {showEduModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEduModal(false)}
              className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] border-8 border-slate-900 shadow-2xl relative z-10 overflow-hidden text-slate-900 flex flex-col max-h-[90vh]"
            >
              <div className="bg-slate-900 p-5 md:p-8 text-white flex justify-between items-center shrink-0">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">
                  {editingItem
                    ? "Edit Materi Edukasi"
                    : "Tambah Materi Edukasi"}
                </h3>
                <button
                  onClick={() => setShowEduModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSaveEdu} className="p-8 space-y-6 overflow-y-auto w-full">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Judul Materi
                  </label>
                  <input
                    required
                    value={eduForm.title}
                    onChange={(e) =>
                      setEduForm({ ...eduForm, title: e.target.value })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Kategori
                    </label>
                    <select
                      value={eduForm.category}
                      onChange={(e) =>
                        setEduForm({ ...eduForm, category: e.target.value })
                      }
                      className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                    >
                      <option>PENCEGAHAN</option>
                      <option>EVAKUASI</option>
                      <option>PERTOLONGAN</option>
                      <option>INFO UMUM</option>
                      <option>ALAT PEMADAM</option>
                      <option>PERTOLONGAN PERTAMA</option>
                    </select>
                  </div>
                  <FileUpload
                    label="Upload Materi (Maks 1MB)"
                    allowedTypes={["application/pdf", "image/*", "video/*"]}
                    maxSize={1.5}
                    initialUrl={eduForm.imageUrl}
                    onUploadSuccess={(url) =>
                      setEduForm({ ...eduForm, imageUrl: url })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Isi Artikel / Konten
                  </label>
                  <textarea
                    required
                    value={eduForm.content}
                    onChange={(e) =>
                      setEduForm({ ...eduForm, content: e.target.value })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red resize-none h-48"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-5 bg-brand-red text-white font-black italic uppercase tracking-tighter rounded-2xl shadow-xl hover:scale-[1.02] transition-all"
                >
                  Simpan Materi
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* PROFILE MODAL */}
        {showProfileModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfileModal(false)}
              className="absolute inset-0 bg-brand-dark/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-4xl rounded-[3rem] border-8 border-slate-900 shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] text-slate-900"
            >
              <div className="bg-slate-900 p-5 md:p-8 text-white flex justify-between items-center shrink-0">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">
                  {editingItem ? "Edit Konten Profil" : "Tambah Konten Profil"}
                </h3>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
              <form
                onSubmit={handleSaveProfile}
                className="p-10 space-y-8 overflow-y-auto"
              >
                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Judul Menu
                      </label>
                      <input
                        required
                        value={profileForm.title}
                        onChange={(e) => {
                          const newSlug = e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/(^-|-$)/g, "");
                          setProfileForm({
                            ...profileForm,
                            title: e.target.value,
                            slug: editingItem ? profileForm.slug : newSlug,
                          });
                        }}
                        className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                        placeholder="Contoh: Visi & Misi"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Slug URL (URL Friendly)
                      </label>
                      <input
                        required
                        value={profileForm.slug}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            slug: e.target.value,
                          })
                        }
                        className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                        placeholder="visi-misi"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Urutan Tampil
                        </label>
                        <input
                          type="number"
                          value={profileForm.order}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              order: parseInt(e.target.value),
                            })
                          }
                          className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Status
                        </label>
                        <select
                          value={profileForm.isActive ? "true" : "false"}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              isActive: e.target.value === "true",
                            })
                          }
                          className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                        >
                          <option value="true">AKTIF</option>
                          <option value="false">NON-AKTIF</option>
                        </select>
                      </div>
                    </div>
                    <FileUpload
                      label="Upload Gambar Header Profil (Opsional)"
                      allowedTypes={["image/*"]}
                      initialUrl={profileForm.imageUrl}
                      onUploadSuccess={(url) =>
                        setProfileForm({ ...profileForm, imageUrl: url })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Konten Detail (Markdown)
                    </label>
                    <textarea
                      required
                      value={profileForm.content}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          content: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red h-[400px] resize-none font-sans"
                      placeholder="Tulis rincian profil di sini... Dukungan format Markdown."
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-6 bg-brand-red text-white font-black italic uppercase tracking-tighter rounded-2xl shadow-xl hover:scale-[1.01] transition-all"
                >
                  Simpan Konten Profil
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* REPORT DETAIL MODAL */}
        {showDetailModal && selectedReportDetail && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailModal(false)}
              className="absolute inset-0 bg-brand-dark/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-50 w-full max-w-5xl rounded-[3rem] border-8 border-slate-900 shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-slate-900 p-5 md:p-8 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-red rounded-xl flex items-center justify-center shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none">
                      Detail Riwayat Laporan
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      ID: {selectedReportDetail.id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingItem(selectedReportDetail);
                      setReportForm({
                        type: selectedReportDetail.type,
                        location: selectedReportDetail.location || {
                          address: "",
                          lat: 3.58,
                          lng: 116.63,
                        },
                        reporterName: selectedReportDetail.reporterName,
                        reporterPhone: selectedReportDetail.phoneNumber || "",
                        description: selectedReportDetail.description,
                        level: selectedReportDetail.level || "normal",
                        photos: selectedReportDetail.photos || [],
                      });
                      setShowReportModal(true);
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-brand-red flex items-center gap-2 font-black italic uppercase text-[10px] tracking-widest bg-white/5 px-4"
                  >
                    <Edit className="w-4 h-4" /> Edit Laporan
                  </button>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <CloseIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-10 overflow-y-auto space-y-10">
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="bg-white p-5 md:p-8 rounded-3xl border-2 border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                      Informasi Dasar
                    </p>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">
                          Jenis Kejadian
                        </p>
                        <p className="text-2xl font-black italic uppercase tracking-tighter text-brand-dark">
                          {selectedReportDetail.type}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">
                          Status Akhir
                        </p>
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-[9px] font-black uppercase rounded-lg border border-green-200">
                          {selectedReportDetail.status}
                        </span>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">
                          Waktu Masuk
                        </p>
                        <p className="text-sm font-bold text-slate-900 italic">
                          {new Date(
                            selectedReportDetail.createdAt,
                          ).toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-5 md:p-8 rounded-3xl border-2 border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                      Pelapor & Lokasi
                    </p>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">
                          Nama Pelapor
                        </p>
                        <p className="text-lg font-black italic uppercase tracking-tighter text-brand-dark">
                          {selectedReportDetail.reporterName}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">
                          Nomor Kontak
                        </p>
                        <p className="text-lg font-black italic uppercase tracking-tighter text-brand-dark">
                          {selectedReportDetail.phoneNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">
                          Alamat Lokasi
                        </p>
                        <p className="text-sm font-bold text-slate-900 italic">
                          <MapPin className="w-3 h-3 inline text-brand-red mr-1" />{" "}
                          {selectedReportDetail.location?.address || "Malinau"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-brand-dark p-5 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                        Uraian Awal
                      </p>
                      <p className="text-sm italic leading-relaxed font-medium">
                        "{selectedReportDetail.description}"
                      </p>
                      {selectedReportDetail.photos &&
                        selectedReportDetail.photos.length > 0 && (
                          <div className="mt-4 grid grid-cols-3 gap-2">
                            {selectedReportDetail.photos.map(
                              (p: string, i: number) => (
                                <img
                                  key={i}
                                  src={p}
                                  className="w-full aspect-square object-cover rounded-lg border-2 border-white/20"
                                  referrerPolicy="no-referrer"
                                />
                              ),
                            )}
                          </div>
                        )}
                    </div>
                    <AlertTriangle className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5" />
                  </div>
                </div>

                {selectedReportDetail.documentation ? (
                  <div className="space-y-8">
                    <div className="flex items-center gap-4 border-b-4 border-slate-200 pb-4">
                      <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="text-2xl font-black italic uppercase tracking-tighter">
                        Dokumentasi Operasional
                      </h4>
                    </div>

                    <div className="grid md:grid-cols-12 gap-10">
                      <div className="md:col-span-12 bg-white p-5 md:p-8 rounded-3xl border-2 border-slate-100 shadow-sm space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Kronologi & Tindakan
                        </p>
                        <div className="text-slate-700 font-medium leading-relaxed italic border-l-8 border-brand-red pl-8 py-2">
                          {selectedReportDetail.documentation.chronology}
                        </div>
                        <div className="mt-6 p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 italic">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            Tindakan Petugas
                          </p>
                          <p className="text-sm font-bold text-slate-800">
                            {selectedReportDetail.documentation.actions}
                          </p>
                        </div>
                      </div>

                      <div className="md:col-span-8 space-y-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Dokumentasi Foto & Video
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {selectedReportDetail.documentation.photos?.map(
                            (p: string, i: number) => (
                              <img
                                key={i}
                                src={p}
                                className="w-full aspect-[4/3] object-cover rounded-2xl border-4 border-white shadow-lg"
                                referrerPolicy="no-referrer"
                              />
                            ),
                          )}
                          {selectedReportDetail.documentation.videos?.map(
                            (v: string, i: number) => (
                              <div
                                key={i}
                                className="w-full aspect-[4/3] bg-slate-900 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center relative overflow-hidden"
                              >
                                <video
                                  src={v}
                                  className="w-full h-full object-cover opacity-50"
                                />
                                <PlayCircle className="w-12 h-12 text-white relative z-10" />
                              </div>
                            ),
                          )}
                          {!selectedReportDetail.documentation.photos?.length &&
                            !selectedReportDetail.documentation.videos
                              ?.length && (
                              <div className="col-span-full h-40 bg-slate-100 rounded-2xl border-4 border-dashed border-slate-200 flex items-center justify-center text-slate-400 font-bold italic">
                                Tidak ada lampiran media
                              </div>
                            )}
                        </div>
                      </div>

                      <div className="md:col-span-4 space-y-6">
                        <div className="bg-slate-900 text-white p-5 md:p-8 rounded-3xl shadow-xl space-y-6">
                          <p className="text-[10px] font-black text-brand-red uppercase tracking-widest">
                            Statistik Penanganan
                          </p>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center pb-3 border-b border-white/10">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                Personel
                              </span>
                              <span className="text-xl font-black italic">
                                {selectedReportDetail.documentation.personnel}{" "}
                                Orang
                              </span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-white/10">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                Unit
                              </span>
                              <span className="text-xs font-black italic text-right">
                                {Array.isArray(
                                  selectedReportDetail.documentation.units,
                                )
                                  ? selectedReportDetail.documentation.units.join(
                                      ", ",
                                    )
                                  : selectedReportDetail.documentation.units}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-white/10">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                Durasi
                              </span>
                              <span className="text-xl font-black italic">
                                {selectedReportDetail.documentation.duration}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                Korban
                              </span>
                              <span className="text-xl font-black italic text-brand-red">
                                {selectedReportDetail.documentation.victims}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedReport(selectedReportDetail);
                            setDocsForm({
                              chronology:
                                selectedReportDetail.documentation.chronology,
                              photos:
                                selectedReportDetail.documentation.photos || [],
                              videos:
                                selectedReportDetail.documentation.videos || [],
                              personnel:
                                selectedReportDetail.documentation.personnel,
                              units: selectedReportDetail.documentation.units,
                              duration:
                                selectedReportDetail.documentation.duration,
                              victims:
                                selectedReportDetail.documentation.victims,
                              actions:
                                selectedReportDetail.documentation.actions,
                            });
                            setShowDetailModal(false);
                            setShowDocsModal(true);
                          }}
                          className="w-full py-4 bg-brand-red text-white rounded-2xl font-black italic uppercase tracking-tighter hover:bg-brand-dark transition-all shadow-lg flex items-center justify-center gap-3"
                        >
                          <Edit className="w-5 h-5" /> Update Dokumentasi
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-10 md:p-20 rounded-[3rem] border-4 border-dashed border-slate-200 text-center space-y-6">
                    <Clock className="w-16 h-16 text-slate-200 mx-auto" />
                    <div>
                      <h4 className="text-2xl font-black italic uppercase tracking-tighter text-slate-400">
                        Belum Ada Dokumentasi Penanganan
                      </h4>
                      <p className="text-slate-400 font-bold italic mt-2 uppercase text-[10px] tracking-widest">
                        Petugas belum menginput data operasional untuk kejadian
                        ini.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedReport(selectedReportDetail);
                        setDocsForm({
                          chronology: selectedReportDetail.description,
                          photos: [],
                          videos: [],
                          personnel: 5,
                          units: ["Unit Gajah 01"],
                          duration: "1 Jam",
                          victims: "Nihil",
                          actions: "",
                        });
                        setShowDetailModal(false);
                        setShowDocsModal(true);
                      }}
                      className="bg-brand-dark text-white px-10 py-4 rounded-xl font-black italic uppercase tracking-tighter hover:bg-brand-red transition-all shadow-xl inline-flex items-center gap-3"
                    >
                      <Plus className="w-5 h-5" /> Input Dokumentasi Sekarang
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* DOCUMENTATION MODAL */}
        {showDocsModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDocsModal(false)}
              className="absolute inset-0 bg-brand-dark/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-5xl rounded-[3rem] border-8 border-slate-900 shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-slate-900 p-5 md:p-8 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-red rounded-xl flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none">
                      Dokumentasi Penanganan
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      ID: {selectedReport?.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDocsModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
              <form
                onSubmit={handleSaveDocs}
                className="p-10 space-y-8 overflow-y-auto"
              >
                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Kronologi Kejadian (Narasi Lengkap)
                      </label>
                      <textarea
                        required
                        value={docsForm.chronology}
                        onChange={(e) =>
                          setDocsForm({
                            ...docsForm,
                            chronology: e.target.value,
                          })
                        }
                        className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red h-48 resize-none"
                        placeholder="Rincikan kejadian dari awal hingga akhir penanganan..."
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Jumlah Personel
                        </label>
                        <input
                          type="number"
                          required
                          value={docsForm.personnel}
                          onChange={(e) =>
                            setDocsForm({
                              ...docsForm,
                              personnel: parseInt(e.target.value),
                            })
                          }
                          className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Durasi Penanganan
                        </label>
                        <input
                          required
                          value={docsForm.duration}
                          onChange={(e) =>
                            setDocsForm({
                              ...docsForm,
                              duration: e.target.value,
                            })
                          }
                          className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                          placeholder="Contoh: 1 Jam 30 Menit"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Tindakan Yang Diambil
                      </label>
                      <textarea
                        required
                        value={docsForm.actions}
                        onChange={(e) =>
                          setDocsForm({ ...docsForm, actions: e.target.value })
                        }
                        className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red h-24 resize-none"
                        placeholder="Langkah-langkah taktis petugas..."
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 underline decoration-brand-red decoration-2">
                        Dokumentasi Media (Foto & Video)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FileUpload
                          label="Tambahkan Foto"
                          allowedTypes={["image/*"]}
                          onUploadSuccess={(url) =>
                            setDocsForm({
                              ...docsForm,
                              photos: [...docsForm.photos, url],
                            })
                          }
                        />
                        <FileUpload
                          label="Tambahkan Video"
                          allowedTypes={["video/*"]}
                          onUploadSuccess={(url) =>
                            setDocsForm({
                              ...docsForm,
                              videos: [...docsForm.videos, url],
                            })
                          }
                        />
                      </div>
                      {(docsForm.photos?.length > 0 || docsForm.videos?.length > 0) && (
                        <div className="mt-4 space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Media Tersimpan
                          </label>
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                            {docsForm.photos?.map((photo, idx) => (
                              <div key={idx} className="relative group rounded-lg overflow-hidden bg-white border border-slate-200 aspect-square">
                                <img src={photo} alt="docs" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={async() => {
                                    if (confirm("Hapus file media ini?")) {
                                      if (photo) {
                                        try {
                                          if (photo.startsWith('/uploads/')) {
                                            const fname = photo.split('/').pop();
                                            if (fname) await fetch(`/api/files/${fname}`, { method: 'DELETE' });
                                          } else if (photo.includes('supabase.co')) {
                                            const fname = photo.split('/').pop();
                                            if (fname) {
                                              const { error } = await deleteObject(ref(storage, `gallery/${fname}`)).then(() => ({error: null})).catch(e => ({error: e}));
                                              if (error) console.error("Gagal menghapus gambar Supabase:", error.message);
                                            }
                                          }
                                        } catch(e) {}
                                      }
                                      const newPhotos = [...docsForm.photos];
                                      newPhotos.splice(idx, 1);
                                      setDocsForm({ ...docsForm, photos: newPhotos });
                                    }
                                  }}
                                  className="absolute top-1 right-1 bg-white/90 text-brand-red rounded-md p-1.5 opacity-0 group-hover:opacity-100 shadow-sm transition-all hover:bg-red-50"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                            {docsForm.videos?.map((video, idx) => (
                              <div key={idx} className="relative group rounded-lg overflow-hidden bg-white border border-slate-200 aspect-square flex items-center justify-center">
                                <video src={video} className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={async() => {
                                    if (confirm("Hapus file media ini?")) {
                                      if (video) {
                                        try {
                                          if (video.startsWith('/uploads/')) {
                                            const fname = video.split('/').pop();
                                            if (fname) await fetch(`/api/files/${fname}`, { method: 'DELETE' });
                                          } else if (video.includes('supabase.co')) {
                                            const fname = video.split('/').pop();
                                            if (fname) {
                                              const { error } = await deleteObject(ref(storage, `gallery/${fname}`)).then(() => ({error: null})).catch(e => ({error: e}));
                                              if (error) console.error("Gagal menghapus gambar Supabase:", error.message);
                                            }
                                          }
                                        } catch(e) {}
                                      }
                                      const newVideos = [...docsForm.videos];
                                      newVideos.splice(idx, 1);
                                      setDocsForm({ ...docsForm, videos: newVideos });
                                    }
                                  }}
                                  className="absolute top-1 right-1 bg-white/90 text-brand-red rounded-md p-1.5 opacity-0 group-hover:opacity-100 shadow-sm transition-all hover:bg-red-50 z-10"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Unit Terlibat
                        </label>
                        <input
                          required
                          value={docsForm.units.join(", ")}
                          onChange={(e) =>
                            setDocsForm({
                              ...docsForm,
                              units: e.target.value.split(", "),
                            })
                          }
                          className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                          placeholder="Contoh: Unit 01, Unit 05"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Informasi Korban
                        </label>
                        <input
                          required
                          value={docsForm.victims}
                          onChange={(e) =>
                            setDocsForm({
                              ...docsForm,
                              victims: e.target.value,
                            })
                          }
                          className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                        />
                      </div>
                    </div>

                    <div className="p-6 bg-slate-900 rounded-[2rem] border-l-8 border-brand-red text-white flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-brand-red rounded-lg flex items-center justify-center">
                          <Newspaper className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                            Automation Feature
                          </p>
                          <p className="text-sm font-black italic uppercase italic">
                            Generate Berita AI (Auto)
                          </p>
                        </div>
                      </div>
                      <div className="w-4 h-4 bg-green-500 rounded-full animate-ping" />
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t-4 border-slate-50">
                  <button
                    type="submit"
                    className="w-full py-6 bg-brand-red text-white font-black italic uppercase tracking-tighter rounded-2xl shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-4"
                  >
                    <CheckCircle className="w-6 h-6" /> Simpan Dokumentasi &
                    Terbitkan Berita AI
                  </button>
                  <p className="text-center text-[10px] font-bold text-slate-400 mt-4 uppercase italic">
                    Sistem akan secara otomatis membangun narasi berita
                    berdasarkan data di atas.
                  </p>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* BANNER MODAL */}
        {showBannerModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBannerModal(false)}
              className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] border-8 border-slate-900 shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-slate-900 p-5 md:p-8 text-white flex justify-between items-center shrink-0">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">
                  Manajemen Banner
                </h3>
                <button
                  onClick={() => setShowBannerModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
              <form
                onSubmit={handleSaveBanner}
                className="p-10 space-y-6 overflow-y-auto"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Target Page ID
                  </label>
                  <input
                    disabled
                    value={bannerForm.id}
                    className="w-full bg-slate-100 border-2 border-slate-100 p-4 rounded-xl font-bold opacity-60"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Judul Banner (Heading)
                  </label>
                  <input
                    required
                    value={bannerForm.title}
                    onChange={(e) =>
                      setBannerForm({ ...bannerForm, title: e.target.value })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Sub-judul / Slogan
                  </label>
                  <textarea
                    required
                    value={bannerForm.subtitle}
                    onChange={(e) =>
                      setBannerForm({ ...bannerForm, subtitle: e.target.value })
                    }
                    rows={3}
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Teks Tombol (Opsional)
                    </label>
                    <input
                      value={bannerForm.ctaText}
                      onChange={(e) =>
                        setBannerForm({
                          ...bannerForm,
                          ctaText: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Link Tombol (Opsional)
                    </label>
                    <input
                      value={bannerForm.ctaLink}
                      onChange={(e) =>
                        setBannerForm({
                          ...bannerForm,
                          ctaLink: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Warna Latar (Banner)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={bannerForm.backgroundColor}
                        onChange={(e) =>
                          setBannerForm({
                            ...bannerForm,
                            backgroundColor: e.target.value,
                          })
                        }
                        className="w-12 h-12 bg-white rounded-lg border-2 border-slate-100 cursor-pointer"
                      />
                      <input
                        value={bannerForm.backgroundColor}
                        onChange={(e) =>
                          setBannerForm({
                            ...bannerForm,
                            backgroundColor: e.target.value,
                          })
                        }
                        className="flex-1 bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Page ID
                    </label>
                    <div className="bg-slate-100 p-4 rounded-xl text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                      {bannerForm.id}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Tingkat Kegelapan Overlay (Brightness)
                    </label>
                    <span className="text-brand-red font-black">
                      {(bannerForm.overlayOpacity * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={bannerForm.overlayOpacity}
                    onChange={(e) =>
                      setBannerForm({
                        ...bannerForm,
                        overlayOpacity: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-brand-red"
                  />
                  <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Terang (0%)</span>
                    <span>Gelap (100%)</span>
                  </div>
                </div>

                <div className="space-y-4 pt-4 pb-4 border-b border-slate-100">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                    Latar Belakang Seluruh Halaman (Opsional)
                  </label>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <FileUpload
                        label="Upload Background Halaman"
                        allowedTypes={["image/*"]}
                        initialUrl={bannerForm.backgroundImageUrl}
                        onUploadSuccess={(url) =>
                          setBannerForm({
                            ...bannerForm,
                            backgroundImageUrl: url,
                          })
                        }
                      />
                    </div>
                    {bannerForm.backgroundImageUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setBannerForm({
                            ...bannerForm,
                            backgroundImageUrl: "",
                          })
                        }
                        className="p-4 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                      >
                        <CloseIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  {bannerForm.backgroundImageUrl && (
                    <div className="h-20 w-32 rounded-xl border-2 border-slate-100 overflow-hidden">
                      <img
                        src={bannerForm.backgroundImageUrl}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {bannerForm.id === "home" && (
                  <div className="space-y-6 pt-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Statistik Beranda (Detail)
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setBannerForm({
                            ...bannerForm,
                            stats: [
                              ...bannerForm.stats,
                              { label: "Baru", value: "0" },
                            ],
                          })
                        }
                        className="text-[10px] font-black uppercase tracking-widest text-brand-red bg-red-50 px-4 py-2 rounded-lg hover:bg-brand-red hover:text-white transition-all"
                      >
                        + Tambah Stat
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {bannerForm.stats.map((stat, idx) => (
                        <div
                          key={idx}
                          className="flex gap-3 items-end bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 group"
                        >
                          <div className="flex-1 space-y-2">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                              Label
                            </label>
                            <input
                              value={stat.label}
                              onChange={(e) => {
                                const newStats = [...bannerForm.stats];
                                newStats[idx].label = e.target.value;
                                setBannerForm({
                                  ...bannerForm,
                                  stats: newStats,
                                });
                              }}
                              className="w-full bg-white border border-slate-200 p-2 rounded-lg font-bold text-sm"
                            />
                          </div>
                          <div className="flex-1 space-y-2">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                              Nilai
                            </label>
                            <input
                              value={stat.value}
                              onChange={(e) => {
                                const newStats = [...bannerForm.stats];
                                newStats[idx].value = e.target.value;
                                setBannerForm({
                                  ...bannerForm,
                                  stats: newStats,
                                });
                              }}
                              className="w-full bg-white border border-slate-200 p-2 rounded-lg font-bold text-sm"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newStats = bannerForm.stats.filter(
                                (_, i) => i !== idx,
                              );
                              setBannerForm({ ...bannerForm, stats: newStats });
                            }}
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <CloseIcon className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4 pt-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                    Banner Image Background (Preview)
                  </label>
                  <div className="h-64 w-full bg-slate-100 rounded-3xl border-4 border-slate-900 overflow-hidden relative border-dashed group">
                    {bannerForm.imageUrl ? (
                      <>
                        <img
                          src={bannerForm.imageUrl}
                          className="w-full h-full object-cover"
                        />
                        <div
                          className="absolute inset-0 bg-brand-dark transition-opacity duration-300"
                          style={{ opacity: bannerForm.overlayOpacity }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center p-8">
                          <h4 className="text-white text-3xl font-black uppercase italic tracking-tighter text-center">
                            {bannerForm.title || "Contoh Judul"}
                          </h4>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-black italic uppercase tracking-widest">
                        No Image Selected
                      </div>
                    )}
                  </div>
                  <FileUpload
                    label="Update Banner Image"
                    allowedTypes={["image/*"]}
                    initialUrl={bannerForm.imageUrl}
                    onUploadSuccess={(url) =>
                      setBannerForm({ ...bannerForm, imageUrl: url })
                    }
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-5 bg-brand-red text-white rounded-2xl font-black italic uppercase tracking-tighter shadow-2xl hover:bg-brand-dark transition-all mt-4"
                >
                  Simpan Konfigurasi Visual
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* BANK DATA MODAL */}
        {showBankDataModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBankDataModal(false)}
              className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] border-8 border-slate-900 shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-slate-900 p-5 md:p-8 text-white flex justify-between items-center shrink-0">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">
                  {editingItem ? "Edit Data" : "Tambah Data Bank"}
                </h3>
                <button
                  onClick={() => setShowBankDataModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
              <form
                onSubmit={handleSaveBankData}
                className="p-10 space-y-6 overflow-y-auto"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Judul Dokumen / Data
                  </label>
                  <input
                    required
                    value={bankDataForm.title}
                    onChange={(e) =>
                      setBankDataForm({
                        ...bankDataForm,
                        title: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                    placeholder="Contoh: Peraturan Bupati No. 12 Tahun 2024"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Kategori
                    </label>
                    <select
                      value={bankDataForm.category}
                      onChange={(e) =>
                        setBankDataForm({
                          ...bankDataForm,
                          category: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                    >
                      <option>Dokumen Internal</option>
                      <option>Regulasi & Peraturan</option>
                      <option>SOP & Instruksi Kerja</option>
                      <option>Arsip Kepegawaian</option>
                      <option>Aset & Inventaris</option>
                      <option>Laporan Keuangan</option>
                      <option>Lainnya</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Bidang / Seksi
                    </label>
                    <select
                      value={bankDataForm.department}
                      onChange={(e) =>
                        setBankDataForm({
                          ...bankDataForm,
                          department: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                    >
                      <option value="TU">Tata Usaha</option>
                      <option value="OPS">Operasional</option>
                      <option value="SARPRAS">Sarana & Prasarana</option>
                      <option value="PENCEGAHAN">Pencegahan</option>
                      <option value="REDAKSI">Redaksi / Humas</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Tipe File
                    </label>
                    <select
                      value={bankDataForm.fileType}
                      onChange={(e) =>
                        setBankDataForm({
                          ...bankDataForm,
                          fileType: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                    >
                      <option>PDF</option>
                      <option>DOCX / Word</option>
                      <option>XLSX / Excel</option>
                      <option>PPTX / Powerpoint</option>
                      <option>Zip / Rar</option>
                      <option>Gambar</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      File Dokumen
                    </label>
                    <FileUpload
                      label="Upload File"
                      initialUrl={bankDataForm.fileUrl}
                      onUploadSuccess={(url) =>
                        setBankDataForm({ ...bankDataForm, fileUrl: url })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Keterangan Singkat
                  </label>
                  <textarea
                    value={bankDataForm.description}
                    onChange={(e) =>
                      setBankDataForm({
                        ...bankDataForm,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red resize-none"
                    placeholder="Jelaskan isi dokumen..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-5 bg-brand-red text-white rounded-2xl font-black italic uppercase tracking-tighter shadow-2xl hover:bg-brand-dark transition-all mt-4"
                >
                  {editingItem ? "Update Data" : "Simpan ke Bank Data"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
        {/* FILE RENAME MODAL */}
        {fileToRename && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFileToRename(null)}
              className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[3rem] border-8 border-slate-900 shadow-2xl relative z-10 overflow-hidden flex flex-col"
            >
              <div className="bg-slate-900 p-5 md:p-8 text-white flex justify-between items-center shrink-0">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">
                  Ganti Nama Media
                </h3>
                <button
                  onClick={() => setFileToRename(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Nama Baru (dengan Ekstensi)
                  </label>
                  <input
                    required
                    value={renameInput}
                    onChange={(e) => setRenameInput(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                  />
                </div>
                <button
                  onClick={() => {
                    if (renameInput && renameInput !== fileToRename.name) {
                      fetch(`/api/files/${fileToRename.name}/rename`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ newName: renameInput })
                      })
                        .then(r => r.json())
                        .then(json => {
                          if (json.success) {
                            showToast("File diganti namanya");
                            loadMediaFiles();
                            setFileToRename(null);
                          } else {
                            showToast("Gagal: " + json.error, "error");
                          }
                        });
                    }
                  }}
                  className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black italic uppercase tracking-tighter shadow-2xl hover:bg-blue-700 transition-all mt-4"
                >
                  Ganti Nama
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* DELETE FILE MODAL */}
        {fileToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFileToDelete(null)}
              className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[3rem] border-8 border-slate-900 shadow-2xl relative z-10 overflow-hidden flex flex-col p-8 text-center items-center"
            >
               <div className="w-20 h-20 bg-red-100 text-brand-red rounded-full flex items-center justify-center mb-6">
                 <Trash2 className="w-10 h-10" />
               </div>
               <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2 text-slate-900">
                  Hapus File
               </h3>
               <p className="text-slate-500 font-medium mb-8">
                 Apakah Anda yakin ingin menghapus <strong className="text-brand-red">{fileToDelete.name}</strong>? Tindakan ini tidak dapat dibatalkan.
               </p>
               <div className="flex w-full gap-4">
                 <button
                   onClick={() => setFileToDelete(null)}
                   className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold transition-all"
                 >
                   Batal
                 </button>
                 <button
                   onClick={() => {
                      fetch(`/api/files/${fileToDelete.name}`, { method: "DELETE" })
                        .then(r => r.json())
                        .then(json => {
                          if (json.success) {
                            showToast("File dihapus");
                            loadMediaFiles();
                            setFileToDelete(null);
                          } else {
                            showToast("Gagal hapus: " + json.error, "error");
                          }
                        });
                   }}
                   className="flex-1 py-4 bg-brand-red text-white rounded-2xl font-bold shadow-xl shadow-red-900/20 hover:bg-brand-dark transition-all"
                 >
                   Hapus
                 </button>
               </div>
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
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
