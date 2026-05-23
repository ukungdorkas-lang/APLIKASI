import React, { useState, useEffect } from 'react';
import { ShieldAlert, Newspaper, Image as ImageIcon, Phone, Menu, X, Moon, Sun, User, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { AppConfig, ProfileSection } from '../types';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(true);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [profileSections, setProfileSections] = useState<ProfileSection[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    // Fetch Config
    const unsubConfig = onSnapshot(doc(db, 'settings', 'app'), (doc) => {
      if (doc.exists()) {
        setConfig(doc.data() as AppConfig);
      }
    }, (err) => {
      console.warn('Navbar config fetch failed:', err);
    });

    // Fetch Profile Sections for dropdown
    const unsubProfiles = onSnapshot(collection(db, 'profile_sections'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProfileSection));
      setProfileSections([{
        id: 'struktur-organisasi', 
        title: 'Struktur Organisasi',
        slug: 'struktur-organisasi',
        isActive: true,
        order: 99,
        content: '',
        createdAt: 0,
        updatedAt: 0
      }, ...data
        .filter(s => s.isActive)
        .sort((a, b) => a.order - b.order)
      ]);
    }, (err) => {
      console.warn('Navbar profiles fetch failed:', err);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsubConfig();
      unsubProfiles();
    };
  }, []);

  const menuItems = [
    { name: 'Beranda', path: '/' },
    { name: 'Cek Tiket', path: '/check-ticket' },
    { name: 'Laporan', path: '/report' },
    { name: 'Berita', path: '/news' },
    { name: 'Dokumentasi', path: '/documentation' },
  ];

  return (
    <nav 
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-700",
        scrolled 
          ? "bg-brand-dark/95 backdrop-blur-xl py-3 shadow-[0_10px_40px_rgba(0,0,0,0.4)] border-b border-brand-red/20" 
          : "bg-transparent py-6"
      )}
    >
      <div className="container mx-auto px-6 lg:px-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-4 group">
          <div className="w-14 h-14 bg-brand-red rounded-2xl flex items-center justify-center shadow-emergency relative overflow-hidden group-hover:rotate-6 transition-transform duration-500">
             {config?.logoUrl ? (
               <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain p-2 relative z-10" />
             ) : (
               <ShieldAlert className="text-white w-8 h-8 relative z-10" />
             )}
             <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-2xl font-display font-black tracking-tighter text-white uppercase italic leading-none flex flex-col">
              <span>{config?.agencyName?.split(' ').slice(0, 1) || 'PEMADAM'}</span>
              <span className="text-brand-red -mt-1">{config?.agencyName?.split(' ').slice(1).join(' ') || 'KEBAKARAN'}</span>
            </h1>
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-10">
          <div className="flex items-center gap-8">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "nav-link text-white/70 hover:text-white font-display uppercase tracking-widest text-xs",
                  location.pathname === item.path && "text-white after:w-full"
                )}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Profil Dropdown */}
            <div 
              className="relative group/profile"
              onMouseEnter={() => setIsProfileOpen(true)}
              onMouseLeave={() => setIsProfileOpen(false)}
            >
              <button className={cn(
                "nav-link text-white/70 hover:text-white font-display uppercase tracking-widest text-xs flex items-center gap-1",
                location.pathname.startsWith('/profile') && "text-white after:w-full"
              )}>
                Profil <ChevronDown className="w-3 h-3" />
              </button>
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-4 w-64 bg-brand-dark border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl"
                  >
                    <div className="space-y-1">
                      {profileSections.map(section => (
                        <Link 
                          key={section.id} 
                          to={`/profile/${section.slug}`}
                          className="block px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all font-display uppercase tracking-wider text-[10px]"
                        >
                          {section.title}
                        </Link>
                      ))}
                      {profileSections.length === 0 && (
                        <p className="text-[10px] text-slate-500 font-bold uppercase italic p-4">Profil menyusul...</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <Link
              to="/contact"
              className={cn(
                "nav-link text-white/70 hover:text-white font-display uppercase tracking-widest text-xs",
                location.pathname === '/contact' && "text-white after:w-full"
              )}
            >
              Kontak
            </Link>
          </div>

          <div className="flex items-center gap-4 pl-8 border-l border-white/10">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-white/50 hover:text-white transition-colors"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link 
              to="/login"
              className="p-2 text-white/50 hover:text-white transition-colors"
            >
              <User className="w-5 h-5" />
            </Link>
            <Link 
              to="/report" 
              className="bg-brand-red hover:bg-red-700 text-white font-black px-6 py-2 rounded-lg text-xs tracking-tighter uppercase transition-all shadow-xl shadow-red-900/20 active:scale-95 flex items-center gap-2"
            >
              <Phone className="w-3 h-3 animate-pulse" /> DARURAT
            </Link>
          </div>
        </div>

        {/* Mobile Toggle */}
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="lg:hidden p-2 text-white bg-white/5 rounded-lg border border-white/10"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute top-full left-0 w-full bg-brand-dark border-b border-white/10 overflow-hidden lg:hidden"
          >
            <div className="p-6 space-y-4">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="block py-4 border-b border-white/5 text-white font-black uppercase tracking-widest text-lg italic hover:text-brand-red transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile Profile Sections */}
              <div className="py-4 border-b border-white/5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Profil Instansi</p>
                <div className="grid grid-cols-1 gap-2">
                  {profileSections.map(section => (
                    <Link 
                      key={section.id} 
                      to={`/profile/${section.slug}`}
                      className="text-white/60 font-display uppercase tracking-widest text-sm py-2"
                      onClick={() => setIsOpen(false)}
                    >
                      {section.title}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-4">
                <Link 
                  to="/report"
                  className="bg-brand-red text-white text-center py-5 rounded-2xl font-black uppercase tracking-tighter text-xl shadow-2xl"
                  onClick={() => setIsOpen(false)}
                >
                  DARURAT 112
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
