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
