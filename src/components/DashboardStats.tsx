import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { EmergencyReport } from '../types';
import { Shield, Clock, CheckCircle, Activity, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function DashboardStats({ reports }: { reports: EmergencyReport[] }) {
  const stats = [
    { label: 'Total Laporan', value: reports.length, icon: Shield, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Menunggu', value: reports.filter(r => r.status === 'Menunggu' || r.status === 'Menunggu Penanganan').length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Penanganan', value: reports.filter(r => r.status === 'Diproses' || r.status === 'Dalam Penanganan').length, icon: Activity, color: 'text-brand-red', bg: 'bg-brand-red/10' },
    { label: 'Selesai', value: reports.filter(r => r.status === 'Selesai Ditangani').length, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
  ];

  const typeData = reports.reduce((acc: any[], report) => {
    const existing = acc.find(a => a.name === report.type);
    if (existing) existing.value++;
    else acc.push({ name: report.type, value: 1 });
    return acc;
  }, []);

  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#6366f1', '#8b5cf6'];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <motion.div 
            key={s.label} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-5 md:p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group"
          >
            <div className={cn("absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-20 transition-opacity group-hover:opacity-40", s.bg)} />
            <div className="flex items-center justify-between mb-4">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", s.bg)}>
                <s.icon className={cn("w-6 h-6", s.color)} />
              </div>
              <div className="flex items-center gap-1 text-green-500 text-[10px] font-bold">
                 <TrendingUp className="w-3 h-3" />
                 <span>+12%</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-display font-black tracking-tighter text-slate-900">{s.value}</p>
                <div className="h-1 flex-1 bg-slate-50 rounded-full overflow-hidden">
                   <div className={cn("h-full", s.color.replace('text-', 'bg-'))} style={{ width: '65%' }} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-lg font-display font-black text-slate-900 uppercase tracking-tighter">Sebaran <span className="text-brand-red">Insiden</span></h3>
            <select className="bg-slate-50 border-none rounded-lg px-4 py-2 text-[10px] font-bold uppercase text-slate-500 outline-none">
               <option>30 Hari Terakhir</option>
               <option>7 Hari Terakhir</option>
            </select>
          </div>
          <div className="h-[350px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData.length > 0 ? typeData : [{ name: 'None', value: 0 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={100}
                  outerRadius={135}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '1.5rem', 
                    border: 'none', 
                    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    fontSize: '10px',
                    padding: '1rem'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-display font-black tracking-tighter text-slate-900">{reports.length}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Kasus</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-lg font-display font-black text-slate-900 uppercase tracking-tighter">Analisis <span className="text-brand-red">Respon</span></h3>
            <div className="flex gap-2">
               <div className="w-2 h-2 rounded-full bg-brand-red" />
               <div className="w-2 h-2 rounded-full bg-slate-100" />
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  fontSize={10} 
                  axisLine={false} 
                  tickLine={false} 
                  fontWeight="bold"
                  tick={{ fill: '#64748b' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  fontSize={10} 
                  fontWeight="bold"
                  tick={{ fill: '#64748b' }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ 
                    borderRadius: '1rem', 
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    fontSize: '10px'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#c1121f" 
                  radius={[6, 6, 0, 0]} 
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export { DashboardStats };
