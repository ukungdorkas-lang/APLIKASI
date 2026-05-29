/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AppTheme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  fontFamily: string;
  isDark: boolean;
  isActive: boolean;
  thumbnailUrl?: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export type UserRole = 'super_admin' | 'admin' | 'operator' | 'field_officer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: number;
  lastLogin: number;
}

export interface EmergencyReport {
  id: string;
  reporterName: string;
  phoneNumber: string;
  type: IncidentType;
  level: 'low' | 'medium' | 'high' | 'critical' | 'normal';
  description: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  mediaUrl?: string;
  media?: { url: string, type: 'image' | 'video' }[];
  status: 'Menunggu' | 'Menunggu Penanganan' | 'Diproses' | 'Dalam Penanganan' | 'Selesai Ditangani';
  reportNumber: string;
  createdAt: number;
  resolvedAt?: number;
  photos?: string[];
  documentation?: {
    chronology: string;
    photos: string[];
    videos: string[];
    personnel: number;
    units: string[];
    duration: string;
    victims: string;
    actions: string;
  };
  officerNotes?: string;
  newsGenerated?: boolean;
}

export type IncidentType = 
  | 'Kebakaran' 
  | 'Evakuasi' 
  | 'Penyelamatan' 
  | 'Pohon Tumbang' 
  | 'Hewan Berbahaya' 
  | 'Banjir' 
  | 'Perbantuan'
  | 'Lainnya';

export interface NewsArticle {
  id: string;
  reportId: string;
  title: string;
  content: string;
  summary?: string;
  date: number;
  location: string;
  type?: string;
  status: 'Draft' | 'Menunggu Publish' | 'Publish Otomatis';
  isAIGenerated: boolean;
  aiPrompt?: string; // Original prompt used for generation
  imageUrl?: string;
  photos: string[];
  videos: string[];
  personnelCount: number;
  unitsUsed: string[];
}

export interface NotificationRecipient {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  divisi: string;
  isActive: boolean;
  categories: IncidentType[];
  channels: ('whatsapp' | 'sms' | 'push' | 'email')[];
  createdAt: number;
}

export interface NotificationLog {
  id: string;
  reportId: string;
  recipientId: string;
  recipientName: string;
  phoneNumber: string;
  channel: string;
  status: 'sent' | 'delivered' | 'failed';
  timestamp: number;
  messageContent: string;
  error?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  type: 'image' | 'video';
  url: string;
  createdAt: number;
  tags: string[];
}

export interface EducationItem {
  id: string;
  title: string;
  content: string;
  category: 'safety' | 'prevent' | 'rescue';
  thumbnail: string;
  createdAt: number;
  views: number;
}

export interface ProfileSection {
  id: string;
  title: string;
  content: string; // Markdown supported
  slug: string;
  order: number;
  isActive: boolean;
  icon?: string;
  imageUrl?: string;
  updatedAt: number;
}

export interface AppConfig {
  agencyName: string;
  slogan: string;
  contact: string;
  emergencyNumber: string;
  logoUrl?: string;
  faviconUrl?: string;
  address?: string;
  email?: string;
  backgroundColor?: string;
  backgroundImageUrl?: string;
  geminiApiKey?: string;
  notificationsEnabled?: boolean;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
  };
  footerText?: string;
  footerCopyright?: string;
  homeDisplay?: {
    showQuickActions: boolean;
    showNews: boolean;
    showRecentCases: boolean;
    showStats: boolean;
    showEducation: boolean;
  };
  homeLayout?: {
    showAnnouncement: boolean;
    announcementText: string;
    announcementColor: string;
    heroVideoUrl?: string;
    showNewsSection: boolean;
    showGallerySection: boolean;
    showEducationSection: boolean;
    quickActions: {
      title: string;
      label: string;
      color: string;
      icon: string;
      enabled: boolean;
    }[];
  };
}

export interface BannerConfig {
  id: string; // The page ID (e.g., 'home', 'news', 'report')
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText?: string;
  ctaLink?: string;
  overlayOpacity?: number; // 0 to 1
  backgroundColor?: string;
  backgroundImageUrl?: string;
  stats?: { label: string; value: string; icon?: string }[];
  updatedAt: number;
}

export interface BankData {
  id: string;
  title: string;
  category: string;
  fileUrl: string;
  fileType: string;
  description: string;
  department: string;
  uploadedBy: string;
  createdAt: number;
  size?: number; // In bytes
}

// SI-DAMKAR Operational Types
export interface Personnel {
  id: string;
  name: string;
  rank: string;
  squadId: string;
  sectorId: string;
  phoneNumber: string;
  status: 'active' | 'on_leave' | 'retired';
  role: 'admin' | 'officer' | 'field_personnel';
  photoUrl?: string;
  foto?: string;
  photo?: string;
}

export interface Squad {
  id: string;
  name: string; // e.g., Regu A, Regu B
  commanderId: string;
  sectorId: string;
}

export interface Sector {
  id: string;
  name: string; // e.g., Sektor Malinau Kota, Sektor Malinau Seberang
  address: string;
}

export type AttendanceStatus = 'hadir' | 'sakit' | 'ijin' | 'alpha' | 'cuti' | 'terlambat' | 'cepat_pulang';
export type Shift = 'pagi' | 'malam';

export interface AttendanceRecord {
  personnelId: string;
  name: string;
  status: AttendanceStatus;
  arrivalTime?: string; // Time string HH:mm
  departureTime?: string; // Time string HH:mm
  notes?: string;
}

export interface OperationalReport {
  id: string;
  reportNumber: string;
  type: 'daily_piket' | 'fire' | 'rescue';
  date: number;
  sectorId: string;
  squadId: string;
  shift?: Shift;
  piketAction?: 'datang' | 'pulang';
  excludeFromRecap?: boolean;
  officerInChargeId: string;
  chronology: string;
  photos: string[];
  location?: {
    address: string;
    lat: number;
    lng: number;
  };
  attendance?: AttendanceRecord[];
  armadaPiket?: {
    id: string;
    nama: string;
    plat: string;
    status: string;
    peralatan: { nama: string; jumlah: number; kondisi: string }[];
  }[];
  details: {
    // For Fire
    cause?: string;
    objectType?: string; // e.g., Rumah, Hutan
    ownerName?: string;
    estimatedLoss?: number;
    
    // For Rescue
    rescueType?: string; // e.g., Animal, Lockout
    
    // Common
    personnelCount: number;
    unitsUsed: string[];
    victims: {
      deceased: number;
      injured: number;
      safe: number;
    };
    startTime: number;
    endTime: number;
  };
  createdAt: number;
  updatedAt: number;
}
