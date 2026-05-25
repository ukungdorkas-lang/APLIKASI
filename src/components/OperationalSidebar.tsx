import React from 'react';
import { ShieldAlert, Users, LayoutDashboard, FileText, Settings, Database, LogOut, ChevronRight, BarChart3, AlertCircle, Phone, Flame, Truck, MapPin, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../lib/db';
import { cn } from '../lib/utils';

interface MenuItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  path: string;
  category: 'operational' | 'master' | 'system';
}

export default function OperationalSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

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
    <aside className="w-72 bg-slate-900 flex flex-col fixed h-full z-40 border-r border-white/5 shadow-2xl">
      <div className="p-10">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-red rounded-lg flex items-center justify-center shadow-lg shadow-red-900/40">
            <ShieldAlert className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-black tracking-tighter text-lg leading-none text-white uppercase italic">SI-<span className="text-brand-red">DAMKAR</span></h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">MALINAU PRO</p>
          </div>
        </Link>
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
  );
}
