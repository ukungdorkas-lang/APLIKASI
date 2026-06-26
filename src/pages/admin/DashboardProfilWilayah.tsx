import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Users, Shield, Clock, PhoneCall, Search, Edit2, Check, X } from 'lucide-react';
import { motion } from 'motion/react';
import { doc, onSnapshot, collection, query, orderBy, limit, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { defaultPoskoData } from '../../components/StatusPoskoTerpadu';

export default function DashboardProfilWilayah() {
  const baseUrl = "https://www.google.com/maps/d/embed?mid=1x1lMXDroFqc5RzH_qEELRd-s3ZgEEmI&ehbc=2E312F";
  const [mapUrl, setMapUrl] = useState(baseUrl);
  const [activeStation, setActiveStation] = useState<string | null>(null);
  const [stations, setStations] = useState<any[]>(defaultPoskoData);
  const [reports, setReports] = useState<any[]>([]);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [editingAddress, setEditingAddress] = useState<string>("");

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "status_posko"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().data) {
        setStations(docSnap.data().data);
      }
    });

    const qReports = query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(10));
    const unsubReports = onSnapshot(qReports, (snapshot) => {
      const reps: any[] = [];
      snapshot.forEach(doc => {
        reps.push({ id: doc.id, ...doc.data() });
      });
      setReports(reps);
    });

    return () => {
      unsub();
      unsubReports();
    };
  }, []);

  const handleSearchAddress = (addr: string) => {
    const fullAddress = `${addr}, Malinau, Kalimantan Utara`;
    setMapUrl(`https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`);
    setActiveStation(null);
  };

  const saveEditedAddress = async (id: string) => {
    if (!editingAddress.trim()) return;
    try {
      await updateDoc(doc(db, "reports", id), {
        "location.address": editingAddress
      });
      setEditingReportId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStationClick = (station: any) => {
    if (activeStation === station.id) {
      setActiveStation(null);
      setMapUrl(baseUrl);
    } else {
      setActiveStation(station.id);
      const coords = station.coordinates || { lat: 3.571069, lng: 116.6057099, z: 15 };
      setMapUrl(`${baseUrl}&ll=${coords.lat},${coords.lng}&z=${coords.z}`);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 relative">
       {/* Background Pattern */}
       <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

      {/* Header */}
      <div className="px-6 py-8 md:px-10 md:py-10 bg-white border-b border-slate-200 relative z-10 flex flex-col items-center text-center">
        <h1 className="text-3xl md:text-5xl font-black text-slate-800 uppercase tracking-tighter italic flex items-center justify-center gap-4">
           Manajemen <span className="text-brand-red">Wilayah</span>
        </h1>
        <p className="mt-2 text-sm md:text-base font-bold text-slate-500 uppercase tracking-widest">
           Pemetaan Pos Damkar Malinau
        </p>
      </div>

      {/* Main Content Split Layout */}
      <div className="flex-1 p-6 md:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-[600px] max-w-[1600px] mx-auto">
          
          {/* Sisi Kiri: Peta Besar */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col h-full bg-white rounded-2xl shadow-sm border-2 border-slate-100 overflow-hidden relative group"
          >
            <div className="bg-slate-900 p-4 shrink-0 flex items-center gap-3">
               <MapPin className="w-5 h-5 text-brand-red" />
               <h2 className="text-white font-black uppercase tracking-widest text-sm">Peta Rawan & Lokasi Pos</h2>
            </div>
            <div className="flex-1 w-full h-[400px] lg:h-full relative bg-slate-100">
              <iframe
                title="Google My Maps - Damkar Malinau"
                src={mapUrl}
                width="100%"
                height="100%"
                className="absolute inset-0 w-full h-full border-0 transition-opacity duration-500"
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
              {/* Optional Map overlay overlay */}
              <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-slate-900/10 rounded-b-2xl" />
            </div>
          </motion.div>

          {/* Sisi Kanan: Daftar Detail Pos */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col h-full space-y-6 overflow-y-auto pr-2 pb-4"
          >
            <div className="flex items-center gap-3 px-2">
               <Shield className="w-6 h-6 text-slate-400" />
               <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest italic">Info <span className="text-brand-red">Posko</span></h2>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {stations.map((station, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={station.id}
                  onClick={() => handleStationClick(station)}
                  className={cn(
                    "cursor-pointer bg-white rounded-[2rem] p-6 lg:p-8 border-2 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group/card",
                    activeStation === station.id ? "border-brand-red/50 ring-4 ring-brand-red/10 shadow-lg" : "border-slate-100 hover:border-slate-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-0 left-0 w-1.5 h-full",
                    activeStation === station.id ? "bg-brand-red" : "bg-gradient-to-b from-brand-red to-orange-500"
                  )} />
                  
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                    <div>
                      <h3 className={cn(
                        "text-lg md:text-xl font-black uppercase tracking-tight transition-colors",
                        activeStation === station.id ? "text-brand-red" : "text-slate-800 group-hover/card:text-brand-red"
                      )}>
                        {station.namaPosko || "Posko"}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full inline-flex border border-slate-200">
                        <Clock className="w-3.5 h-3.5 text-green-500" />
                        {station.statusPosko || "Siaga 24 Jam"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-2 bg-slate-50 rounded-xl shrink-0">
                         <MapPin className="w-4 h-4 text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-600 leading-relaxed shadow-sm-text">
                        {station.address || "Belum ada alamat"}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-red-50 rounded-xl shrink-0 text-brand-red border border-red-100">
                            <Shield className="w-4 h-4" />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-400 shadow-sm-text uppercase tracking-widest mb-0.5">Komandan</p>
                            <p className="text-sm font-bold text-slate-800">{station.danruSiaga || "Belum ditunjuk"}</p>
                         </div>
                       </div>
                       
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-blue-50 rounded-xl shrink-0 text-blue-600 border border-blue-100">
                            <Users className="w-4 h-4" />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-400 shadow-sm-text uppercase tracking-widest mb-0.5">Personil</p>
                            <p className="text-sm font-bold text-slate-800">{station.personil?.length || 0} Bertugas</p>
                         </div>
                       </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t font-medium border-slate-100">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if(station.phone) window.open(`https://wa.me/${station.phone}`, '_blank');
                      }}
                      className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group/btn"
                    >
                      <PhoneCall className="w-4 h-4 group-hover/btn:animate-pulse" />
                      <span className="text-sm font-bold uppercase tracking-wider">Panggil Cepat</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>

        {/* Pelaporan Masuk - Alamat Pelaporan */}
        <div className="mt-10 max-w-[1600px] mx-auto">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2 mb-6">
              <div className="flex items-center gap-3">
                 <MapPin className="w-6 h-6 text-brand-red" />
                 <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest italic">Alamat <span className="text-brand-red">Pelaporan</span></h2>
              </div>
              
              <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full md:w-96">
                 <input 
                    type="text" 
                    id="manual-search-address"
                    placeholder="Cari lokasi spesifik..."
                    className="flex-1 px-4 py-3 bg-transparent text-sm font-medium focus:outline-none"
                    onKeyDown={(e) => {
                       if (e.key === 'Enter') {
                          handleSearchAddress((e.target as HTMLInputElement).value);
                       }
                    }}
                 />
                 <button 
                    onClick={() => {
                       const val = (document.getElementById('manual-search-address') as HTMLInputElement)?.value;
                       if (val) handleSearchAddress(val);
                    }}
                    className="bg-brand-red text-white px-5 flex items-center justify-center hover:bg-red-700 transition-colors"
                 >
                    <Search className="w-4 h-4" />
                 </button>
              </div>
           </div>
           
           <div className="grid grid-cols-1 gap-4">
              {reports.map((report) => (
                 <motion.div 
                    key={report.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                 >
                    <div className="flex-1">
                       <p className="text-[10px] font-black uppercase tracking-widest text-brand-red mb-1">{report.type || "Laporan"}</p>
                       <p className="font-bold text-slate-800 mb-2 truncate max-w-xl">{report.description || "Tidak ada deskripsi"}</p>
                       
                       {editingReportId === report.id ? (
                          <div className="flex items-center gap-2 mt-2">
                             <input 
                                type="text"
                                value={editingAddress}
                                onChange={(e) => setEditingAddress(e.target.value)}
                                className="flex-1 border-2 border-slate-200 px-3 py-2 rounded-lg bg-slate-50 text-sm font-medium focus:border-brand-red focus:outline-none"
                                placeholder="Edit Alamat..."
                             />
                             <button 
                                onClick={() => saveEditedAddress(report.id)}
                                className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                             >
                                <Check className="w-4 h-4" />
                             </button>
                             <button 
                                onClick={() => setEditingReportId(null)}
                                className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
                             >
                                <X className="w-4 h-4" />
                             </button>
                          </div>
                       ) : (
                          <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                             <MapPin className="w-4 h-4 text-slate-400" />
                             <span className="flex-1">{report.location?.address || "Alamat tidak tersedia"}</span>
                             <button 
                                onClick={() => {
                                   setEditingReportId(report.id);
                                   setEditingAddress(report.location?.address || "");
                                }}
                                className="p-1.5 text-slate-400 hover:text-brand-red bg-slate-50 rounded-md hover:bg-red-50 transition-colors"
                                title="Edit Alamat"
                             >
                                <Edit2 className="w-3.5 h-3.5" />
                             </button>
                          </div>
                       )}
                    </div>

                    <button 
                       onClick={() => handleSearchAddress(report.location?.address || "")}
                       className="shrink-0 flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-md group border border-slate-700"
                    >
                       <Search className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                       Lacak Titik
                    </button>
                 </motion.div>
              ))}
              {reports.length === 0 && (
                 <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Belum ada pelaporan masuk</p>
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
