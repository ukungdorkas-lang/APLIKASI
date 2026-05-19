import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, getDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { OperationalReport, Personnel, Squad, Sector, OperationType, AttendanceStatus } from '../types';
import { handleFirestoreError } from '../lib/errorHandler';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  Truck, 
  Users, 
  FileText, 
  Flame, 
  ShieldAlert, 
  Calendar, 
  LayoutDashboard,
  MapPin, 
  Clock, 
  Plus,
  ArrowRight,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  FileDown,
  Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { LoadingSpinner } from '../components/Loading';
import OperationalSidebar from '../components/OperationalSidebar';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

export default function OperationalDashboard() {
  const [reports, setReports] = useState<OperationalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    fire: 0,
    rescue: 0,
    daily: 0
  });

  const [attendanceFilter, setAttendanceFilter] = useState<AttendanceStatus | 'all'>('all');
  const [activeRegu, setActiveRegu] = useState<Squad | null>(null);
  const [activeSector, setActiveSector] = useState<Sector | null>(null);

  // Statistics for Recap
  const dailyRecap = reports
    .filter(r => r.type === 'daily_piket' && !r.excludeFromRecap)
    .reduce((acc, r) => {
      const shift = r.shift || 'pagi';
      if (!acc[shift]) acc[shift] = { total: 0, hadir: 0, reports: 0 };
      acc[shift].reports++;
      r.attendance?.forEach(a => {
        acc[shift].total++;
        if (a.status === 'hadir') acc[shift].hadir++;
      });
      return acc;
    }, {} as Record<string, { total: number, hadir: number, reports: number }>);

  // Expanded Absenteesim Recap across all personnel
  const absenteeismRecap = reports
    .filter(r => r.type === 'daily_piket' && !r.excludeFromRecap)
    .reduce((acc, r) => {
      r.attendance?.forEach(a => {
        if (a.status !== 'hadir') {
          acc[a.status] = (acc[a.status] || 0) + 1;
          acc.total++;
        }
      });
      return acc;
    }, { total: 0 } as Record<string, number>);

  // Sync On-Duty Personnel (Personil Siaga) - Only Commanders per Sector
  const onDutyPersonnel = sectors.map(sector => {
    // Find the latest 'datang' report for any squad in this sector
    const latestSectorReport = reports
      .filter(r => r.type === 'daily_piket' && r.sectorId === sector.id && r.piketAction === 'datang')
      .sort((a, b) => b.date - a.date)[0];
      
    if (latestSectorReport) {
      const squad = squads.find(s => s.id === latestSectorReport.squadId);
      if (squad) {
        // Find the commander in the attendance list
        const commanderAttendance = latestSectorReport.attendance?.find(a => a.personnelId === squad.commanderId && a.status === 'hadir');
        if (commanderAttendance) {
          return {
            ...commanderAttendance,
            squadName: squad.name,
            sectorName: sector.name,
            date: latestSectorReport.date,
            reportId: latestSectorReport.id
          };
        }
      }
    }
    return null;
  }).filter((p): p is any => p !== null);

  useEffect(() => {
    // Fetch Sectors and Squads for PDF grouping
    const fetchMetadata = async () => {
      const secSnap = await getDocs(collection(db, 'sectors'));
      const sqSnap = await getDocs(collection(db, 'squads'));
      setSectors(secSnap.docs.map(d => ({ ...d.data(), id: d.id } as Sector)));
      setSquads(sqSnap.docs.map(d => ({ ...d.data(), id: d.id } as Squad)));
    };
    fetchMetadata();

    // Fetch Operational Reports
    const q = query(collection(db, 'operational_reports'), orderBy('date', 'desc'), limit(100));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as OperationalReport));
      setReports(data);
      
      const fireCount = data.filter(r => r.type === 'fire').length;
      const rescueCount = data.filter(r => r.type === 'rescue').length;
      const dailyCount = data.filter(r => r.type === 'daily_piket').length;
      
      setStats({
        total: snapshot.size,
        fire: fireCount,
        rescue: rescueCount,
        daily: dailyCount
      });
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleDeleteReport = async (id: string) => {
    if (!confirm('Hapus laporan operasional ini secara permanen?')) return;
    try {
      await deleteDoc(doc(db, 'operational_reports', id));
    } catch (error) {
      console.error('Delete error:', error);
      handleFirestoreError(error, OperationType.DELETE, 'operational_reports', auth);
    }
  };

  const exportToPDF = async (reportId: string) => {
    const element = document.getElementById(`report-${reportId}`);
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Laporan_Damkar_Malinau_${reportId}.pdf`);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const exportAttendanceRecap = (shiftFilter?: string) => {
    const piketReports = reports.filter(r => r.type === 'daily_piket' && !r.excludeFromRecap && (!shiftFilter || r.shift === shiftFilter));
    
    if (piketReports.length === 0) {
      alert('Tidak ada data piket untuk diunduh.');
      return;
    }

    let csvContent = "Tanggal,Nomor Laporan,Shift,Nama Personil,Status,Jam Datang,Jam Pulang,Catatan\n";

    piketReports.forEach(report => {
      const dateString = new Date(report.date).toLocaleDateString('id-ID');
      const shiftName = report.shift || 'pagi';
      
      report.attendance?.forEach(att => {
        // Remove notes display for 'ijin' as per request
        const finalNotes = att.status === 'ijin' ? '-' : (att.notes || '-');
        
        const row = [
          dateString,
          report.reportNumber,
          shiftName,
          att.name,
          att.status,
          att.arrivalTime || '--:--',
          att.departureTime || '--:--',
          finalNotes
        ].map(val => `"${val}"`).join(",");
        csvContent += row + "\n";
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Rekap_Kehadiran_Piket${shiftFilter ? '_' + shiftFilter : ''}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    if (link.parentNode === document.body) {
      document.body.removeChild(link);
    }
  };

  const exportAttendancePDF = async () => {
    const piketReports = reports.filter(r => r.type === 'daily_piket' && !r.excludeFromRecap);
    
    if (piketReports.length === 0) {
      alert('Tidak ada data piket untuk diunduh.');
      return;
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    const timestamp = new Date().toLocaleString('id-ID');

    // Header
    doc.setFontSize(16);
    doc.text('REKAPITULASI KEHADIRAN PERSONIL DAMKAR', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text('SATPOL PP DAN DAMKAR KABUPATEN MALINAU', 105, 22, { align: 'center' });
    doc.line(15, 25, 195, 25);
    doc.text(`Dicetak pada: ${timestamp}`, 15, 30);

    let currentY = 35;
    const personnelStats: Record<string, Record<string, number>> = {};
    const ALL_STATUSES = ['hadir', 'sakit', 'ijin', 'alpha', 'cuti', 'terlambat', 'cepat_pulang'];

    // Grouping by Sector
    sectors.forEach((sector) => {
      // Check if we need a new page
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      const sectorSquads = squads.filter(s => s.sectorId === sector.id);
      let sectorHasData = false;

      sectorSquads.forEach((squad) => {
        const squadReports = piketReports.filter(r => r.squadId === squad.id);
        if (squadReports.length > 0) {
          if (!sectorHasData) {
            doc.setFontSize(12);
            doc.setTextColor(225, 29, 72); // Brand Red
            doc.text(`SEKTOR: ${sector.name.toUpperCase()}`, 15, currentY);
            doc.setTextColor(0, 0, 0);
            currentY += 8;
            sectorHasData = true;
          }

          doc.setFontSize(10);
          doc.text(`REGU: ${squad.name}`, 20, currentY);
          currentY += 5;

          const tableData: any[][] = [];
          
          squadReports.forEach(report => {
            const dateStr = new Date(report.date).toLocaleDateString('id-ID');
            const shiftAction = `${report.shift?.toUpperCase() || 'PAGI'} - ${report.piketAction?.toUpperCase() || 'DATANG'}${report.excludeFromRecap ? ' (NON-REKAP)' : ''}`;
            report.attendance?.forEach(att => {
              // Update stats
              if (!personnelStats[att.name]) {
                personnelStats[att.name] = {};
                ALL_STATUSES.forEach(s => personnelStats[att.name][s] = 0);
              }
              const currentStatus = att.status as string;
              personnelStats[att.name][currentStatus] = (personnelStats[att.name][currentStatus] || 0) + 1;

              tableData.push([
                dateStr,
                shiftAction,
                att.name,
                att.status.toUpperCase(),
                att.arrivalTime || '--:--',
                att.departureTime || '--:--',
                att.status === 'ijin' ? '-' : (att.notes || '-')
              ]);
            });
          });

          autoTable(doc, {
            startY: currentY,
            head: [['Tanggal', 'Shift', 'Nama Personil', 'Status', 'Datang', 'Pulang', 'Catatan']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8 },
            bodyStyles: { fontSize: 7 },
            margin: { left: 20 },
            styles: { fontStyle: 'italic' }
          });

          // @ts-ignore
          currentY = (doc as any).lastAutoTable.finalY + 10;
        }
      });

      if (sectorHasData) currentY += 5;
    });

    // Summary Page
    if (Object.keys(personnelStats).length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42); // Slate 900
      doc.text('RINGKASAN AKUMULASI KEHADIRAN PERSONIL', 105, 15, { align: 'center' });
      doc.line(15, 18, 195, 18);

      const summaryData = Object.entries(personnelStats)
        .map(([name, stats]) => [
          name, 
          stats['hadir'] || 0,
          stats['ijin'] || 0,
          stats['sakit'] || 0,
          stats['alpha'] || 0,
          stats['cuti'] || 0,
          stats['terlambat'] || 0,
          stats['cepat_pulang'] || 0
        ])
        .sort((a, b) => (b[1] as number) - (a[1] as number)); // Sort by presence (hadir)

      autoTable(doc, {
        startY: 25,
        head: [['Nama Personil', 'Hadir', 'Ijin', 'Sakit', 'Alpha', 'Cuti', 'Lbt', 'C.Plg']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: [225, 29, 72], textColor: 255, fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { cellPadding: 2 }
      });
    }

    doc.save(`Rekap_Kehadiran_Damkar_Detailed_${Date.now()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <OperationalSidebar />
      
      <main className="flex-1 ml-72 p-12">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-16">
          <div>
            <h1 className="text-4xl font-display font-black text-slate-900 uppercase italic tracking-tighter">Monitoring <span className="text-brand-red">Operasional</span></h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2 italic">Unit Reaksi Cepat Damkar Malinau</p>
          </div>
          
          <div className="flex gap-4">
            <button onClick={() => window.location.href = '/operational/new'} className="bg-brand-red text-white py-4 px-8 rounded-2xl font-black italic uppercase tracking-tighter shadow-xl shadow-red-900/20 hover:scale-105 transition-all flex items-center gap-3">
               <Plus className="w-5 h-5" /> Laporan Baru
            </button>
          </div>
        </header>

        {/* Recap Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="bg-white p-8 rounded-[2.5rem] border-4 border-slate-900 shadow-xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-[4rem] -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
            <div className="flex justify-between items-start mb-2 relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Kehadiran: PIKET PAGI</p>
              <button 
                onClick={() => exportAttendanceRecap('pagi')}
                className="p-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                title="Unduh Rekap Pagi"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-5xl font-black text-slate-900 italic tracking-tighter">{dailyRecap.pagi?.hadir || 0}</h3>
              <span className="text-xs font-bold text-slate-400 uppercase italic">/ {dailyRecap.pagi?.total || 0} Men</span>
            </div>
            <div className="mt-6 flex items-center gap-3">
               <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${(dailyRecap.pagi?.hadir / (dailyRecap.pagi?.total || 1)) * 100}%` }} />
               </div>
               <span className="text-[10px] font-black text-amber-600 italic">{Math.round((dailyRecap.pagi?.hadir / (dailyRecap.pagi?.total || 1)) * 100)}%</span>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border-4 border-slate-900 shadow-xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[4rem] -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
            <div className="flex justify-between items-start mb-2 relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Kehadiran: PIKET MALAM</p>
              <button 
                onClick={() => exportAttendanceRecap('malam')}
                className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                title="Unduh Rekap Malam"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-5xl font-black text-slate-900 italic tracking-tighter">{dailyRecap.malam?.hadir || 0}</h3>
              <span className="text-xs font-bold text-slate-400 uppercase italic">/ {dailyRecap.malam?.total || 0} Men</span>
            </div>
            <div className="mt-6 flex items-center gap-3">
               <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-900" style={{ width: `${(dailyRecap.malam?.hadir / (dailyRecap.malam?.total || 1)) * 100}%` }} />
               </div>
               <span className="text-[10px] font-black text-slate-600 italic">{Math.round((dailyRecap.malam?.hadir / (dailyRecap.malam?.total || 1)) * 100)}%</span>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border-4 border-slate-900 shadow-xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-[4rem] -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 italic">Giat Operasional</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-5xl font-black text-brand-red italic tracking-tighter">{stats.fire + stats.rescue}</h3>
              <span className="text-xs font-bold text-slate-400 uppercase italic">Kasus</span>
            </div>
            <div className="mt-6 flex gap-4 text-[9px] font-black uppercase italic">
               <span className={cn("px-2 py-0.5 rounded bg-orange-50 text-orange-600")}>Api: {stats.fire}</span>
               <span className={cn("px-2 py-0.5 rounded bg-blue-50 text-blue-600")}>Rescue: {stats.rescue}</span>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] border-4 border-slate-900 shadow-xl overflow-hidden relative">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 italic">Laporan Today</p>
            <h3 className="text-5xl font-black text-white italic tracking-tighter">{stats.daily}</h3>
            <div className="mt-6 p-4 bg-brand-red/20 rounded-2xl border border-brand-red/30">
               <p className="text-[9px] font-black text-brand-red uppercase tracking-widest italic">Live-Sync Active</p>
            </div>
          </div>
        </div>

        {/* Global Absenteeism Recap */}
        <div className="bg-white p-8 rounded-[2.5rem] border-4 border-slate-900 shadow-2xl mb-16 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 flex gap-3">
              <button 
                onClick={() => exportAttendanceRecap()}
                className="flex items-center gap-2 bg-slate-100 text-slate-900 px-4 py-3 rounded-xl font-black italic uppercase tracking-tighter text-[10px] hover:bg-slate-200 transition-all border-2 border-slate-900 shadow-lg"
              >
                <Download className="w-4 h-4" /> CSV
              </button>
              <button 
                onClick={() => exportAttendancePDF()}
                className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-black italic uppercase tracking-tighter text-[10px] hover:bg-brand-red transition-all shadow-xl"
              >
                <FileDown className="w-4 h-4" /> Unduh Rekap PDF Detailed
              </button>
           </div>
           
           <h3 className="text-xl font-black uppercase italic tracking-tighter mb-8 flex items-center gap-3">
              <Users className="w-6 h-6 text-brand-red" /> Rekap Ketidakhadiran Personil <span className="text-slate-300 ml-2 font-bold opacity-30 tracking-[0.2em]">{absenteeismRecap.total} TOTAL</span>
           </h3>

           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[
                { label: 'Sakit', key: 'sakit', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                { label: 'Ijin', key: 'ijin', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                { label: 'Alpha', key: 'alpha', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
                { label: 'Cuti', key: 'cuti', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                { label: 'Terlambat', key: 'terlambat', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
                { label: 'Cepat Pulang', key: 'cepat_pulang', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100' },
              ].map(item => (
                <div key={item.key} className={cn("p-6 rounded-[2rem] border-2 flex flex-col items-center", item.bg, item.border)}>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 italic">{item.label}</span>
                  <p className={cn("text-3xl font-black italic tracking-tighter", item.color)}>
                     {absenteeismRecap[item.key] || 0}
                  </p>
                </div>
              ))}
           </div>
        </div>

        {/* Main Content Sections */}
        <div className="grid lg:grid-cols-12 gap-12">
          {/* Laporan Terbaru */}
          <div className="lg:col-span-8 space-y-8">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-2xl font-black uppercase italic tracking-tighter">Riwayat <span className="text-brand-red">Operasional</span></h2>
               <div className="flex gap-2">
                  <select 
                    value={attendanceFilter} 
                    onChange={(e) => setAttendanceFilter(e.target.value as any)}
                    className="bg-white border-2 border-slate-200 px-6 py-3 rounded-xl font-black italic uppercase tracking-tighter text-[10px] outline-none focus:border-brand-red appearance-none pr-10"
                  >
                    <option value="all">Status Absensi: SEMUA</option>
                    <option value="hadir">Status: HADIR</option>
                    <option value="sakit">Status: SAKIT</option>
                    <option value="ijin">Status: IJIN</option>
                    <option value="alpha">Status: ALPHA</option>
                    <option value="cuti">Status: CUTI</option>
                    <option value="terlambat">Status: TERLAMBAT</option>
                    <option value="cepat_pulang">Status: CEPAT PULANG</option>
                  </select>
                  <button className="p-3 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-all"><Search className="w-5 h-5 text-slate-400" /></button>
               </div>
            </div>

            <div className="grid gap-6">
              {loading ? (
                <LoadingSpinner message="Menskronisasi Data Operasional..." />
              ) : reports.length === 0 ? (
                <div className="bg-white p-20 rounded-[3rem] border-4 border-dashed border-slate-200 text-center">
                  <p className="text-slate-300 font-black italic uppercase tracking-[0.4em]">Belum ada laporan yang diinput...</p>
                </div>
              ) : (
                reports
                  .filter(r => {
                    if (attendanceFilter === 'all') return true;
                    if (r.type !== 'daily_piket') return false;
                    return r.attendance?.some(a => a.status === attendanceFilter);
                  })
                  .map((report) => (
                  <motion.div 
                    key={`rep-${report.id}`}
                    id={`report-${report.id}`}
                    className="bg-white p-8 rounded-[2.5rem] border-4 border-slate-900 shadow-xl group hover:-translate-y-1 transition-all"
                  >
                    <div className="flex flex-wrap justify-between items-start gap-6">
                      <div className="flex gap-6">
                        <div className={cn(
                          "w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black leading-none shrink-0",
                          report.type === 'fire' ? 'bg-brand-red text-white' : 
                          report.type === 'rescue' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'
                        )}>
                          <span className="text-[15px] italic mb-1 uppercase tracking-tighter">#{report.reportNumber?.split('-').pop()}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                             <h4 className="text-xl font-black italic uppercase tracking-tighter leading-none">
                                {report.type === 'fire' ? 'KEBAKARAN' : report.type === 'rescue' ? 'PENYELAMATAN' : 'PIKET HARIAN'}
                             </h4>
                             {report.type === 'daily_piket' && (
                               <div className="flex gap-2 items-center">
                                 {report.shift && (
                                   <span className={cn(
                                     "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border-2 italic",
                                     report.shift === 'pagi' ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-brand-dark border-slate-800 text-white"
                                   )}>
                                     Piket {report.shift}
                                   </span>
                                 )}
                                 {report.piketAction && (
                                   <span className={cn(
                                     "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border-2 italic",
                                     report.piketAction === 'datang' ? "bg-green-50 border-green-200 text-green-700" : "bg-indigo-50 border-indigo-200 text-indigo-700"
                                   )}>
                                     {report.piketAction}
                                   </span>
                                 )}
                               </div>
                             )}
                             <span className="bg-slate-50 border-2 border-slate-100 text-slate-400 text-[8px] font-black uppercase px-3 py-1 rounded-full italic">
                                {new Date(report.date).toLocaleDateString('id-ID', { dateStyle: 'full' })}
                             </span>
                          </div>
                          <p className="text-slate-400 font-bold italic text-xs flex items-center gap-2 mb-4">
                            <MapPin className="w-3.5 h-3.5 text-brand-red" /> {report.location?.address || 'Malinau'}
                          </p>
                          <div className="text-slate-600 font-medium italic line-clamp-2 max-w-xl text-sm border-l-4 border-slate-100 pl-4 mb-4">
                             {report.chronology}
                          </div>

                          {report.type === 'daily_piket' && report.attendance && report.attendance.length > 0 && (
                            <div className="mt-6 pt-6 border-t-2 border-slate-50">
                               <div className="flex items-center gap-4 mb-4">
                                  <div className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-[8px] font-black uppercase tracking-widest border border-green-100">
                                    HADIR: {report.attendance.filter(a => a.status === 'hadir').length}
                                  </div>
                                  <div className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-[8px] font-black uppercase tracking-widest border border-red-100">
                                    ABSEN: {report.attendance.filter(a => a.status !== 'hadir').length}
                                  </div>
                               </div>
                               <div className="flex flex-wrap gap-2">
                                  {report.attendance.map((att, idx) => (
                                    <div 
                                      key={`att-view-${report.id}-${idx}`}
                                      className={cn(
                                        "px-3 py-2 rounded-xl text-[9px] font-bold border flex items-center gap-2",
                                        att.status === 'hadir' ? "bg-slate-50 border-slate-100 text-slate-500" : "bg-red-50 border-red-100 text-red-600"
                                      )}
                                    >
                                      <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                          <span className="uppercase tracking-tighter">{att.name}</span>
                                          {att.status !== 'hadir' && (
                                            <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[7px] uppercase font-black italic">
                                              {att.status.replace('_', ' ')}
                                            </span>
                                          )}
                                        </div>
                                         {att.status === 'hadir' && (
                                           <div className="flex gap-2 text-[7px] font-black uppercase tracking-widest text-slate-400 italic">
                                              <span>Datang: {att.arrivalTime || '--:--'}</span>
                                              <span>Pulang: {att.departureTime || '--:--'}</span>
                                           </div>
                                         )}
                                         {att.notes && att.status !== 'ijin' && <span className="text-[7px] text-slate-400 italic font-bold">NB: {att.notes}</span>}
                                       </div>
                                    </div>
                                  ))}
                               </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3 self-center">
                         <div className="flex gap-2">
                            <button 
                              onClick={() => exportToPDF(report.id)}
                              className="p-4 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-brand-red transition-all hover:scale-105"
                              title="Download PDF"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                handleDeleteReport(report.id);
                              }}
                              className="p-4 bg-white border-4 border-slate-900 text-brand-red rounded-xl shadow-lg hover:bg-brand-red hover:text-white transition-all hover:scale-105 cursor-pointer relative z-10"
                              title="Hapus Laporan Permanen"
                            >
                               <Trash2 className="w-5 h-5 pointer-events-none" />
                            </button>
                            <button className="p-4 bg-white border-4 border-slate-900 text-slate-900 rounded-xl shadow-lg hover:bg-slate-900 hover:text-white transition-all hover:scale-105">
                               <ArrowRight className="w-5 h-5" />
                            </button>
                         </div>
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">Petugas: {report.officerInChargeId || 'Admin'}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-4 space-y-8">
             <div className="bg-brand-dark p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden border-4 border-slate-800">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-red/10 blur-[60px] rounded-full" />
                <h3 className="text-lg font-black uppercase italic tracking-tighter mb-8 flex items-center gap-3">
                   <Users className="w-6 h-6 text-brand-red" /> Personil Siaga <span className="text-[8px] bg-brand-red px-2 py-0.5 rounded ml-auto">LIVE</span>
                </h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                   {onDutyPersonnel.length === 0 ? (
                     <div className="p-8 text-center border-2 border-dashed border-white/10 rounded-2xl">
                        <p className="text-[10px] font-black uppercase italic text-slate-500">Belum ada regu yang melapor piket jaga...</p>
                     </div>
                   ) : (
                     onDutyPersonnel.map((person, idx) => (
                       <div key={`standby-${idx}`} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-black italic text-brand-red text-xs">
                            {person.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                             <p className="text-xs font-black uppercase italic tracking-tighter">{person.name}</p>
                             <div className="flex gap-2 items-center mt-1">
                                <span className="text-[7px] font-black uppercase text-brand-red italic">Danru {person.squadName}</span>
                                <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">• {person.sectorName}</span>
                             </div>
                          </div>
                       </div>
                     ))
                   )}
                </div>
                <button 
                  onClick={() => window.location.href = '/operational/new'} 
                  className="w-full mt-8 py-4 bg-slate-800 text-white font-black italic uppercase tracking-tighter rounded-xl text-[10px] hover:bg-brand-red transition-all"
                >
                  Lapor Piket Jaga Baru
                </button>
             </div>

             <div className="bg-white p-8 rounded-[2.5rem] border-4 border-slate-900 shadow-2xl">
                <h3 className="text-xl font-black uppercase italic tracking-tighter mb-8 flex items-center gap-3">
                   <Clock className="w-6 h-6 text-brand-red" /> Quick Actions
                </h3>
                <div className="grid grid-cols-1 gap-4">
                   <button className="w-full py-5 bg-brand-red text-white rounded-2xl font-black italic uppercase tracking-tighter shadow-xl shadow-red-200 hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
                      <Plus className="w-6 h-6" /> Buat Laporan Baru
                   </button>
                   <button className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black italic uppercase tracking-tighter shadow-xl shadow-slate-200 hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
                      <FileText className="w-6 h-6 text-brand-red" /> Laporan Harian (Piket)
                   </button>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
