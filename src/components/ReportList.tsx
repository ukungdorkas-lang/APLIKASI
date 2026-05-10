import React from 'react';
import { EmergencyReport } from '../types';
import { Clock, MapPin, Loader2, PlayCircle, CheckCircle2, ChevronRight, MessageSquare } from 'lucide-react';
import { formatDate, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  reports: EmergencyReport[];
  onUpdateStatus: (id: string, status: EmergencyReport['status'], notes?: string) => void;
  onGenerateNews: (report: EmergencyReport) => void;
}

export default function ReportList({ reports, onUpdateStatus, onGenerateNews }: Props) {
  const [selectedReport, setSelectedReport] = React.useState<string | null>(null);
  const [notes, setNotes] = React.useState('');

  const getStatusColor = (status: EmergencyReport['status']) => {
    switch(status) {
      case 'Menunggu':
      case 'Menunggu Penanganan': return 'bg-red-100 text-red-600 border-red-200';
      case 'Diproses': return 'bg-blue-100 text-blue-600 border-blue-100';
      case 'Dalam Penanganan': return 'bg-orange-100 text-orange-600 border-orange-100';
      case 'Selesai Ditangani': return 'bg-green-100 text-green-600 border-green-200';
    }
  };

  return (
    <div className="space-y-12">
      {reports.map((report) => (
        <div 
          key={report.id}
          className="bg-white rounded-[2rem] border-4 border-slate-900 p-8 hover:shadow-2xl transition-all relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-2 h-full bg-brand-red opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="flex flex-wrap items-center justify-between gap-6 mb-10 pb-8 border-b-2 border-slate-50">
            <div className="flex items-center gap-6">
              <div className={cn(
                "px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border-4", 
                (report.status === 'Menunggu' || report.status === 'Menunggu Penanganan') ? 'bg-white text-brand-red border-brand-red' : 
                (report.status === 'Diproses' || report.status === 'Dalam Penanganan') ? 'bg-slate-900 text-white border-slate-900' : 
                'bg-slate-100 text-slate-400 border-slate-100'
              )}>
                {report.status}
              </div>
              <div className="flex items-center gap-2 text-slate-400 tag-label">
                <Clock className="w-4 h-4" />
                {formatDate(report.createdAt)}
              </div>
            </div>
            
            <div className="flex gap-4">
              {report.status !== 'Selesai Ditangani' && (
                <button 
                  onClick={() => onUpdateStatus(report.id, (report.status === 'Menunggu' || report.status === 'Menunggu Penanganan') ? 'Diproses' : 'Selesai Ditangani')}
                  className="bg-brand-dark text-white px-8 py-3 rounded-lg text-xs font-black italic uppercase tracking-tighter hover:bg-brand-red transition-all flex items-center gap-3 shadow-xl active:scale-95"
                >
                  {(report.status === 'Menunggu' || report.status === 'Menunggu Penanganan') ? <PlayCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  {(report.status === 'Menunggu' || report.status === 'Menunggu Penanganan') ? 'MULAI RESPONS' : 'TANDAI SELESAI'}
                </button>
              )}
              {report.status === 'Selesai Ditangani' && (
                <button 
                  onClick={() => onGenerateNews(report)}
                  className="emergency-btn py-3 px-8 text-xs italic tracking-tighter"
                >
                  PUBLIKASI BERITA
                </button>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-12 gap-10">
            <div className="md:col-span-8">
              <h3 className="text-4xl heading-bold text-brand-dark mb-4 leading-none">{report.type}</h3>
              <p className="text-lg font-bold text-slate-500 mb-8 leading-relaxed italic">"{report.description}"</p>
              
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <p className="tag-label text-slate-400">Lokasi Kejadian</p>
                  <div className="flex items-center gap-3 text-brand-dark font-black uppercase italic tracking-tighter text-xl">
                    <MapPin className="text-brand-red w-6 h-6" />
                    {report.location.address || 'Malinau'}
                  </div>
                </div>
                <div className="space-y-2 border-l-4 border-slate-100 pl-8">
                  <p className="tag-label text-slate-400">Data Pelapor</p>
                  <div className="flex items-center gap-3 text-brand-dark font-black uppercase italic tracking-tighter text-xl">
                    <MessageSquare className="text-slate-400 w-6 h-6" />
                    {report.reporterName}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-4 flex flex-col gap-6">
              <div className="bg-slate-50 rounded-2xl p-8 border-4 border-slate-100 flex-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-slate-200 rotate-45 transform translate-x-8 -translate-y-8" />
                <p className="tag-label text-slate-400 mb-4 tracking-[0.2em]">Prioritas Satuan</p>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black italic uppercase tracking-tighter text-brand-dark">{report.level}</span>
                  <div className={cn("w-6 h-6 rounded-lg", {
                    'bg-green-500': report.level === 'low',
                    'bg-amber-500': report.level === 'medium',
                    'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]': report.level === 'high',
                    'bg-brand-red animate-pulse shadow-[0_0_20px_rgba(225,29,72,0.7)] border-4 border-white': report.level === 'critical',
                  })} />
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedReport(selectedReport === report.id ? null : report.id)}
                className="w-full py-5 border-4 border-brand-dark rounded-2xl tag-label hover:bg-brand-dark hover:text-white transition-all flex items-center justify-center gap-3 group"
              >
                LOG OPERASI DETAIL
                <ChevronRight className={cn("w-5 h-5 transition-transform group-hover:translate-x-2", selectedReport === report.id && "rotate-90 translate-x-0")} />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {selectedReport === report.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t-8 border-slate-50 mt-10 pt-10"
              >
                <div className="grid md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <h4 className="heading-bold text-xl uppercase italic">Visual Tracking</h4>
                    {report.mediaUrl ? (
                      <div className="relative group">
                        <img src={report.mediaUrl} className="rounded-3xl w-full aspect-video object-cover border-8 border-white shadow-2xl" />
                        <div className="absolute inset-0 bg-brand-red/10 group-hover:bg-transparent transition-colors" />
                      </div>
                    ) : (
                      <div className="bg-slate-100 rounded-3xl border-4 border-dashed border-slate-200 flex flex-col items-center justify-center aspect-video text-slate-400">
                         <MapPin className="w-12 h-12 mb-4 opacity-20" />
                         <p className="tag-label">No Documentation Provided</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-6">
                    <h4 className="heading-bold text-xl uppercase italic">Data Geospasial</h4>
                    <div className="bg-brand-dark p-8 rounded-3xl border-4 border-slate-800 shadow-2xl">
                      <pre className="text-brand-red text-sm font-mono leading-relaxed">
                        {JSON.stringify(report.location, null, 2)}
                      </pre>
                    </div>
                    <div className="p-6 bg-amber-50 border-4 border-amber-200 rounded-2xl">
                       <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2">Instruksi Satuan</p>
                       <p className="text-sm font-bold text-amber-900 italic">"Gunakan jalur alternatif Seluwing untuk menghindari kemacetan pasar pagi. Koordinasi dengan Pos Wilayah II."</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
