import React, { useState, useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { EmergencyReport } from '../types';
import { BarChart3, LineChart as LineChartIcon, Activity, CalendarDays, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';

type ChartType = 'bar' | 'line' | 'area';
type Timeframe = 'daily' | 'monthly';

export default function ReportChart({ reports }: { reports: EmergencyReport[] }) {
  const [chartType, setChartType] = useState<ChartType>('area');
  const [timeframe, setTimeframe] = useState<Timeframe>('monthly');

  const chartData = useMemo(() => {
    const data: Record<string, { name: string; kebakaran: number; penyelamatan: number; lainnya: number; timestamp: number }> = {};

    reports.forEach(report => {
      const date = new Date(report.createdAt);
      let key = '';
      let display = '';
      
      if (timeframe === 'monthly') {
        key = `${date.getFullYear()}-${date.getMonth()}`;
        display = date.toLocaleString('id-ID', { month: 'short', year: 'numeric' });
      } else {
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        display = date.toLocaleString('id-ID', { day: 'numeric', month: 'short' });
      }

      if (!data[key]) {
        data[key] = { name: display, kebakaran: 0, penyelamatan: 0, lainnya: 0, timestamp: date.getTime() };
      }

      if (report.type === 'Kebakaran') {
        data[key].kebakaran += 1;
      } else if (report.type === 'Penyelamatan' || report.type === 'Evakuasi') {
        data[key].penyelamatan += 1;
      } else {
        data[key].lainnya += 1;
      }
    });

    return Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
  }, [reports, timeframe]);

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-slate-400 font-bold uppercase italic tracking-widest text-xs">
          Belum ada data laporan
        </div>
      );
    }
    
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
              <Bar dataKey="kebakaran" name="Kebakaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="penyelamatan" name="Penyelamatan/Evakuasi" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
              <Line type="monotone" dataKey="kebakaran" name="Kebakaran" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="penyelamatan" name="Penyelamatan/Evakuasi" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'area':
      default:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorKebakaran" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPenyelamatan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
              <Area type="monotone" dataKey="kebakaran" name="Kebakaran" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorKebakaran)" />
              <Area type="monotone" dataKey="penyelamatan" name="Penyelamatan/Evakuasi" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorPenyelamatan)" />
            </AreaChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-2">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
        <div className="flex gap-2 bg-slate-50 p-1 rounded-xl">
          <button
            onClick={() => setChartType('area')}
            className={cn("p-2 rounded-lg transition-all", chartType === 'area' ? "bg-white shadow-sm text-brand-red" : "text-slate-400 hover:text-slate-600")}
            title="Area Chart"
          >
            <Activity className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={cn("p-2 rounded-lg transition-all", chartType === 'bar' ? "bg-white shadow-sm text-brand-red" : "text-slate-400 hover:text-slate-600")}
            title="Bar Chart"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChartType('line')}
            className={cn("p-2 rounded-lg transition-all", chartType === 'line' ? "bg-white shadow-sm text-brand-red" : "text-slate-400 hover:text-slate-600")}
            title="Line Chart"
          >
            <LineChartIcon className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex gap-2 bg-slate-50 p-1 rounded-xl">
          <button
            onClick={() => setTimeframe('daily')}
            className={cn("px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2", timeframe === 'daily' ? "bg-white shadow-sm text-brand-dark" : "text-slate-400 hover:text-slate-600")}
          >
            <CalendarDays className="w-3 h-3" /> Harian
          </button>
          <button
            onClick={() => setTimeframe('monthly')}
            className={cn("px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2", timeframe === 'monthly' ? "bg-white shadow-sm text-brand-dark" : "text-slate-400 hover:text-slate-600")}
          >
            <Calendar className="w-3 h-3" /> Bulanan
          </button>
        </div>
      </div>
      
      <div className="flex-1 min-h-[300px]">
        {renderChart()}
      </div>
    </div>
  );
}
