import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, LayoutDashboard, FileText, Settings, Database, LogOut, ChevronRight, BarChart3, AlertCircle, Phone, Flame, Truck, MapPin, Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { AppConfig } from '../types';

interface MenuItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  path: string;
  category: 'operational' | 'master' | 'system';
}

interface OperationalSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function OperationalSidebar({ isOpen, onClose }: OperationalSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'app'), (snap) => {
      if (snap.exists()) {
        setConfig(snap.data() as AppConfig);
      }
    });
    return () => unsub();
  }, []);

  const menuItems: MenuItem[] = [
    { id: 'dashboard', name: 'Dashboard Piket', icon: <LayoutDashboard className="w-5 h-5" />, path: '/staff/ops', category: 'operational' },
    { id: 'reports', name: 'Input Laporan', icon: <FileText className="w-5 h-5" />, path: '/staff/reports', category: 'operational' },
    { id: 'personnel', name: 'Data Personil', icon: <Users className="w-5 h-5" />, path: '/staff/master/personnel', category: 'master' },
    { id: 'squads', name: 'Data Regu', icon: <Truck className="w-5 h-5" />, path: '/staff/master/squads', category: 'master' },
    { id: 'sectors', name: 'Data Sektor', icon: <MapPin className="w-5 h-5" />, path: '/staff/master/sectors', category: 'master' },
    { id: 'settings', name: 'Pengaturan', icon: <Settings className="w-5 h-5" />, path: '/staff/settings', category: 'system' },
  ];

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "w-72 bg-slate-900 flex flex-col fixed h-full z-50 border-r border-white/5 shadow-2xl transition-transform duration-300 transform lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-10 relative flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-red rounded-lg flex items-center justify-center shadow-lg shadow-red-900/40 relative overflow-hidden">
              {config?.logoUrl ? (
                <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain p-1 relative z-10" />
              ) : (
                <ShieldAlert className="text-white w-6 h-6 relative z-10" />
              )}
            </div>
            <div>
              <h1 className="font-display font-black tracking-tighter text-lg leading-none text-white uppercase italic">SI-<span className="text-brand-red">DAMKAR</span></h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">MALINAU PRO</p>
            </div>
          </Link>
          
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl transition-all"
              aria-label="Tutup menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

      <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar">
        {/* Public Services Context */}
        <div>
          <p className="px-6 mb-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] italic">Layanan Publik</p>
          <Link 
            to="/admin" 
            className="w-full flex items-center gap-4 px-6 py-4 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-bold text-xs uppercase tracking-widest"
          >
            <BarChart3 className="w-5 h-5 text-slate-500" />
            Admin Panel
          </Link>
        </div>

        {/* Operational Context */}
        <div>
          <p className="px-6 mb-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] italic">Layanan Internal</p>
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={cn(
                  "w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all font-bold text-sm",
                  location.pathname === item.path 
                    ? "bg-brand-red text-white shadow-xl shadow-red-900/20" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <span className={cn(location.pathname === item.path ? "text-white" : "text-slate-500")}>
                  {item.icon}
                </span>
                <span className="uppercase tracking-widest text-[11px] italic leading-none">{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <div className="p-6 border-t border-white/5">
        <div className="bg-white/5 rounded-2xl p-4 mb-4 border border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10">
             <Users className="text-slate-400 w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate italic">{auth.currentUser?.email?.split('@')[0] || 'Petugas'}</p>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em] italic">Personil Siaga</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 py-3 bg-white/5 hover:bg-brand-red hover:text-white text-slate-400 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all italic"
        >
          <LogOut className="w-4 h-4" />
          Logout Sistem
        </button>
      </div>
    </aside>
  </>
  );
}
