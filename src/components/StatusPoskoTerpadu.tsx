import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Truck, Users, Wrench, AlertCircle, CheckCircle, Flame, MapPin, Activity, Radio, X, Maximize2 } from 'lucide-react';
import { doc, onSnapshot, collection, query } from '@/src/lib/supabase-adapter';
import { db } from '../lib/db';
import { cn } from '../lib/utils';

export const defaultPoskoData = [
  {
    id: "posko-induk",
    namaPosko: "POSKO INDUK DAMKAR MALINAU",
    danruSiaga: "Komandan Asep Surahman",
    address: "Jl. Pusat Pemerintahan, Malinau Kota, Kab. Malinau, Kalimantan Utara",
    phone: "081112223334",
    statusPosko: "Siaga 24 Jam",
    coordinates: { lat: 3.571069, lng: 116.6057099, z: 15 },
    armada: [
      { id: "a1", nama: "Unit Pemadam 01 (Ayaxx)", plat: "KU 8001 M", status: "Siaga" },
      { id: "a2", nama: "Mobil Water Supply 02", plat: "KU 8002 M", status: "Bertugas" },
      { id: "a3", nama: "Unit Rescue & Evakuasi", plat: "KU 8003 M", status: "Perawatan" }
    ],
    personil: [
      { id: "p1", nama: "Budi Santoso", peran: "Rescue", foto: "" },
      { id: "p2", nama: "Joko Widodo", peran: "Driver", foto: "" },
      { id: "p3", nama: "Siti Aminah", peran: "Anggota", foto: "" },
      { id: "p4", nama: "Ahmad Yani", peran: "Anggota", foto: "" }
    ]
  }
];

export default function StatusPoskoTerpadu() {
  const [dataPosko, setDataPosko] = useState<any[]>(defaultPoskoData);
  const [selectedPosko, setSelectedPosko] = useState<any | null>(null);

  useEffect(() => {
    // Dynamic realtime synchronization across Sectors (Manajemen Wilayah) and Picket Status
    const unsubSectors = onSnapshot(query(collection(db, "sectors")), (sectorSnap) => {
      const sectorList = sectorSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const unsubPosko = onSnapshot(doc(db, "settings", "status_posko"), (poskoSnap) => {
        const rawPosko = (poskoSnap.exists() && poskoSnap.data().data) ? poskoSnap.data().data : [];

        // Build elegant map merging static Sector setup with live picket rosters
        const merged = sectorList.map(sector => {
          const match = rawPosko.find((p: any) => 
            (p.sectorId && p.sectorId === sector.id) || 
            (p.namaPosko && p.namaPosko.toLowerCase().includes(sector.name.toLowerCase())) ||
            (sector.name && sector.name.toLowerCase().includes(p.namaPosko?.toLowerCase()))
          );

          const isInduk = sector.name.toUpperCase().includes("INDUK") || sector.name.toUpperCase().includes("KOMANDO");

          return {
            id: sector.id,
            sectorId: sector.id,
            namaPosko: isInduk ? "POSKO INDUK DAMKAR MALINAU" : `POSKO SEKTOR ${sector.name.toUpperCase()}`,
            address: sector.address || match?.address || "Kabupaten Malinau, Kalimantan Utara",
            phone: sector.phone || match?.phone || "081112223334",
            coordinates: sector.coordinates || match?.coordinates || { lat: 3.571069, lng: 116.6057099, z: 15 },
            
            // Sync with picket report data: ONLY display armada & personil if piketActive is true (filled "datang" / arrival repoart or manually modified active state)
            statusPosko: match?.piketActive ? (match.statusPosko || "Siaga 24 Jam") : "Piket Belum Datang",
            piketActive: !!match?.piketActive,
            danruSiaga: match?.piketActive ? (match.danruSiaga || "") : "",
            armada: match?.piketActive ? (match.armada || []) : [],
            personil: match?.piketActive ? (match.personil || []) : []
          };
        });

        setDataPosko(merged.length > 0 ? merged : defaultPoskoData);
      }, (err) => console.warn("Live status_posko snapshot failed", err));

      return () => {
        unsubPosko();
      };
    }, (err) => console.warn("Live sectors snapshot failed", err));

    return () => {
      unsubSectors();
    };
  }, []);

  // Update popup detail view dynamic synced state live
  useEffect(() => {
    if (selectedPosko) {
      const updated = dataPosko.find(p => p.id === selectedPosko.id);
      if (updated) {
        setSelectedPosko(updated);
      }
    }
  }, [dataPosko]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Siaga':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-500/10 text-green-500 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]"></span> SIAGA
          </span>
        );
      case 'Bertugas':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-brand-red/10 text-brand-red border border-brand-red/20 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse shadow-[0_0_5px_rgba(220,38,38,0.8)]"></span> BERTUGAS
          </span>
        );
      case 'Perawatan':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.8)]"></span> MAINTAIN
          </span>
        );
      default:
        return null;
    }
  };

  const getPersonilIcon = (peran: string) => {
    switch (peran?.toLowerCase()) {
      case 'driver':
        return <Truck className="w-3.5 h-3.5" />;
      case 'rescue':
        return <Shield className="w-3.5 h-3.5" />;
      case 'anggota':
      default:
        return <Users className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="w-full space-y-12">
      <div className="bg-slate-900 rounded-[3rem] p-8 md:p-12 relative overflow-hidden shadow-2xl border-2 border-slate-800">
         <div className="absolute top-0 right-0 w-96 h-96 bg-brand-red/10 blur-[120px] rounded-full pointer-events-none" />
         <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
         
         <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-2xl">
               <div className="flex items-center gap-3 mb-6">
                 <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                    <Radio className="w-6 h-6 text-brand-red animate-pulse" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-brand-red uppercase tracking-widest leading-none">Command Center</span>
                    <span className="text-white font-bold text-sm">Live Monitoring</span>
                 </div>
               </div>
               <h2 className="text-3xl sm:text-4xl md:text-6xl font-display font-black text-white uppercase italic tracking-tighter leading-tight mb-4">
                  Status <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-orange-500">Posko Terpadu</span>
               </h2>
               <p className="text-slate-400 font-medium text-sm leading-relaxed border-l-2 border-white/20 pl-4">
                  Pemantauan real-time kesiapan armada dan manifest personil piket siaga di seluruh Sektor Pemadam Kebakaran & Penyelamatan Kabupaten Malinau.
               </p>
            </div>
            
            <div className="px-6 py-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-4">
               <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse border-2 border-green-800 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
               <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">System Status</span>
                  <span className="text-white font-bold italic">ONLINE & SYNCED</span>
               </div>
            </div>
         </div>
      </div>

      <div className="flex flex-col gap-10">
        {dataPosko.map((posko, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            key={posko.id || idx} 
            className={cn(
               "group bg-white rounded-[3rem] shadow-2xl border overflow-hidden flex flex-col transition-all duration-500",
               posko.piketActive ? "border-slate-100 hover:border-brand-red/30" : "border-slate-200/60 hover:border-slate-400/30"
            )}
          >
            {/* Header Posko */}
            <div 
               onClick={() => setSelectedPosko(posko)}
               className={cn(
                  "px-8 py-8 md:px-12 md:py-10 border-b-[6px] flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden group/header cursor-pointer hover:bg-slate-850 transition-colors",
                  posko.piketActive ? "bg-slate-900 border-brand-red" : "bg-slate-800 border-slate-500"
               )}
            >
               {posko.piketActive ? (
                 <div className="absolute top-[-50%] right-[-10%] w-[500px] h-[500px] bg-brand-red/10 blur-[100px] rounded-full pointer-events-none" />
               ) : (
                 <div className="absolute top-[-50%] right-[-10%] w-[500px] h-[500px] bg-slate-700/10 blur-[100px] rounded-full pointer-events-none" />
               )}
               <div className="absolute bottom-[-20%] left-[10%] w-[300px] h-[300px] bg-slate-900/30 blur-[80px] rounded-full pointer-events-none" />
               
               <div className="relative z-10 flex items-center gap-6">
                  <div className={cn(
                     "w-20 h-20 rounded-[1.5rem] flex items-center justify-center shadow-xl transform group-hover/header:scale-105 group-hover/header:rotate-3 transition-all duration-500 border",
                     posko.piketActive 
                        ? "bg-gradient-to-br from-brand-red to-red-800 shadow-red-900/40 border-brand-red/50" 
                        : "bg-gradient-to-br from-slate-600 to-slate-800 shadow-slate-900/40 border-slate-600/50"
                  )}>
                     <Flame className={cn("w-10 h-10", posko.piketActive ? "text-white" : "text-slate-400")} />
                  </div>
                  <div>
                     <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/5 mb-3">
                        <MapPin className={cn("w-3.5 h-3.5", posko.piketActive ? "text-brand-red" : "text-slate-450")} />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{posko.namaPosko.includes('INDUK') ? 'Pusat Komando' : 'Sektor Wilayah'}</span>
                     </div>
                     <h3 className={cn(
                        "text-2xl sm:text-3xl md:text-4xl font-display font-black text-white uppercase italic tracking-tighter leading-tight transition-colors",
                        posko.piketActive ? "group-hover/header:text-brand-red" : "group-hover/header:text-slate-400"
                     )}>{posko.namaPosko}</h3>
                  </div>
               </div>
               
               <div className="relative z-10 flex items-center gap-4">
                  <div className={cn(
                     "lg:text-right flex flex-col lg:items-end justify-center px-6 py-4 bg-white/5 backdrop-blur-xl rounded-[1.5rem] border border-white/10 border-l-4",
                     posko.piketActive ? "border-l-brand-red" : "border-l-slate-400"
                  )}>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5 flex items-center gap-2 lg:justify-end">
                        <Shield className={cn("w-3 h-3", posko.piketActive ? "text-brand-red" : "text-slate-400")} />
                        {posko.piketActive ? "Komandan Regu" : "Status Piket"}
                     </p>
                     <p className="font-bold text-white text-lg italic">
                        {posko.piketActive ? (posko.danruSiaga || 'Belum Ditunjuk') : 'STANDBY DARURAT'}
                     </p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedPosko(posko); }} className="w-12 h-12 rounded-[1.25rem] bg-brand-red/10 border border-brand-red/20 flex items-center justify-center text-brand-red opacity-0 group-hover/header:opacity-100 transition-opacity" title="Lihat Detail Posko">
                     <Maximize2 className="w-5 h-5" />
                  </button>
               </div>
            </div>

            {/* Content Split */}
            <div className="flex flex-col xl:flex-row flex-1 divide-y xl:divide-y-0 xl:divide-x divide-slate-100">
               
               {/* ARMADA AREA */}
               <div className="flex-1 xl:flex-[0.4] p-8 md:p-12 bg-slate-50/50 flex flex-col">
                  <div className="flex flex-col sm:flex-row items-baseline gap-4 mb-8 pb-4 border-b-2 border-slate-100">
                     <h4 className="text-xl font-black text-slate-800 uppercase tracking-widest italic flex items-center gap-3">
                        <Truck className="w-5 h-5 text-slate-400" /> Armada <span className="text-brand-red">Siaga</span>
                     </h4>
                     <span className="text-[10px] font-black bg-slate-200/50 text-slate-500 px-3 py-1 rounded-full uppercase tracking-widest">{posko.armada?.length || 0} Unit</span>
                  </div>
                  
                  <div className="space-y-5 flex-1">
                     {posko.armada?.map((armada: any, aIdx: number) => (
                       <div key={aIdx} className="bg-white p-5 rounded-[1.5rem] shadow-sm border-2 border-slate-100 hover:border-slate-300 transition-colors group/armada overflow-hidden relative">
                          <div className={cn("absolute top-0 left-0 w-1.5 h-full", armada.status === 'Siaga' ? 'bg-green-500' : armada.status === 'Bertugas' ? 'bg-brand-red' : 'bg-amber-500')} />
                          
                          <div className="flex justify-between items-start mb-4 pl-3">
                             <div>
                                <p className="font-black text-slate-800 text-lg uppercase italic tracking-tighter">{armada.nama}</p>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mt-0.5">{armada.plat}</p>
                             </div>
                             {getStatusBadge(armada.status)}
                          </div>
                          
                          {armada.peralatan && armada.peralatan.length > 0 && (
                             <div className="pt-4 mt-2 border-t border-slate-100 pl-3">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5" /> Manifest Peralatan</p>
                                <div className="flex flex-wrap gap-2">
                                   {armada.peralatan.map((alat: any, px: number) => (
                                      <span key={px} className={cn(
                                         "text-[10px] px-2.5 py-1.5 rounded-lg font-bold text-xs capitalize border",
                                         alat.kondisi?.includes("Rusak") ? "bg-red-50 text-red-700 border-red-200" : "bg-slate-50 text-slate-600 border-slate-200"
                                      )}>
                                         <span className="font-black text-slate-800">{alat.jumlah}x</span> {alat.nama} {alat.kondisi?.includes("Rusak") && <span className="text-brand-red">({alat.kondisi})</span>}
                                      </span>
                                   ))}
                                </div>
                             </div>
                          )}
                       </div>
                     ))}
                     {(!posko.armada || posko.armada.length === 0) && (
                       <div className="flex-1 min-h-[180px] flex flex-col items-center justify-center bg-slate-100/50 rounded-[2rem] border-2 border-dashed border-slate-200 p-6 text-center">
                          <Truck className="w-8 h-8 text-slate-300 mb-2" />
                          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Tidak Ada Armada Aktif</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-bold italic leading-relaxed max-w-[200px] mx-auto">Regu piket belum mengisi laporan kedatangan untuk shift ini.</p>
                       </div>
                     )}
                  </div>
               </div>

               {/* PERSONIL AREA */}
               <div className="flex-1 xl:flex-[0.6] p-8 md:p-12 flex flex-col bg-white overflow-hidden">
                  <div className="flex flex-col sm:flex-row items-baseline gap-4 mb-8 pb-4 border-b-2 border-slate-100">
                     <h4 className="text-xl font-black text-slate-800 uppercase tracking-widest italic flex items-center gap-3">
                        <Users className="w-5 h-5 text-slate-400" /> Manifest <span className="text-brand-red">Personil</span>
                     </h4>
                     <span className="text-[10px] font-black bg-brand-red/10 text-brand-red px-3 py-1 rounded-full uppercase tracking-widest">{posko.personil?.length || 0} Bertugas</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 gap-5 flex-1 content-start">
                     <AnimatePresence>
                        {posko.personil?.map((personil: any, pIdx: number) => {
                           const isDanru = personil.peran?.toLowerCase() === 'danru' || posko.danruSiaga?.includes(personil.nama);
                           const isRescue = personil.peran?.toLowerCase() === 'rescue';
                           const isDriver = personil.peran?.toLowerCase() === 'driver';
                           
                           return (
                             <motion.div 
                               initial={{ opacity: 0, scale: 0.95 }}
                               animate={{ opacity: 1, scale: 1 }}
                               key={pIdx} 
                               className={cn(
                                  "relative flex items-center gap-4 sm:gap-5 p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border-2 transition-all duration-300 group/personil overflow-hidden",
                                  isDanru ? "border-brand-red/30 bg-gradient-to-br from-red-50/50 to-white hover:border-brand-red hover:shadow-[0_8px_30px_rgb(220,38,38,0.15)] hover:-translate-y-0.5" : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-xl hover:-translate-y-0.5"
                               )}
                             >
                               {isDanru && <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-brand-red to-orange-500" />}
                               
                               <div className="relative z-10 shrink-0">
                                  <div className={cn(
                                     "w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2px] bg-white shadow-sm transition-all duration-300 group-hover/personil:scale-105",
                                     isDanru ? "ring-2 ring-brand-red/40 ring-offset-2" : "border-2 border-slate-100 group-hover/personil:border-slate-200"
                                  )}>
                                     {personil.foto ? (
                                        <img src={personil.foto} alt={personil.nama} className="w-full h-full rounded-full object-cover" />
                                     ) : (
                                        <div className={cn(
                                            "w-full h-full rounded-full flex items-center justify-center",
                                            isDanru ? "bg-red-50 text-brand-red" : "bg-slate-50 text-slate-400 group-hover/personil:bg-slate-100 group-hover/personil:text-slate-500"
                                        )}>
                                           <Users className="w-6 h-6 sm:w-7 sm:h-7" />
                                        </div>
                                     )}
                                  </div>
                                  <div className={cn(
                                     "absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white shadow-md border-[2.5px] border-white transition-transform duration-300 group-hover/personil:rotate-12",
                                     isDanru ? 'bg-gradient-to-br from-brand-red to-red-600' :
                                     isRescue ? 'bg-gradient-to-br from-orange-400 to-orange-600' : 
                                     isDriver ? 'bg-gradient-to-br from-blue-500 to-blue-700' : 'bg-gradient-to-br from-slate-400 to-slate-600'
                                  )}>
                                     {getPersonilIcon(personil.peran)}
                                  </div>
                               </div>
                               
                               <div className="flex-1 min-w-0 space-y-0.5">
                                  {isDanru && (
                                     <div className="mb-2">
                                        <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-black text-brand-red uppercase tracking-widest bg-red-100/80 px-2 py-0.5 rounded-md border border-red-200 pb-px">
                                           <Shield className="w-3 h-3" /> Komandan
                                        </span>
                                     </div>
                                  )}
                                  <p className="font-black text-slate-800 text-[14px] sm:text-[16px] uppercase tracking-tight leading-tight break-words" title={personil.nama}>{personil.nama}</p>
                                  <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 pt-1">
                                    <span className={cn(
                                       "w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5",
                                       isDanru ? "bg-brand-red" :
                                       isRescue ? "bg-orange-500" :
                                       isDriver ? "bg-blue-500" : "bg-slate-400"
                                    )} />
                                    <span className="leading-tight">{personil.peran || "Anggota"}</span>
                                  </p>
                               </div>
                             </motion.div>
                           )
                        })}
                     </AnimatePresence>
                     {(!posko.personil || posko.personil.length === 0) && (
                        <div className="col-span-full h-full min-h-[180px] flex flex-col items-center justify-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200 p-6 text-center">
                           <Users className="w-8 h-8 text-slate-300 mb-2" />
                           <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Tidak Ada Personil Aktif</p>
                           <p className="text-[10px] text-slate-400 mt-1 font-bold italic leading-relaxed max-w-[280px] mx-auto">Sektor ini sedang standby tanpa personil terdaftar aktif. Kontak nomor darurat di bawah untuk respon cepat.</p>
                           <a href={`tel:${posko.phone}`} className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-red hover:shadow-lg transition-all duration-300">
                              Hubungi Posko: {posko.phone}
                           </a>
                        </div>
                     )}
                  </div>
               </div>

            </div>
          </motion.div>
        ))}
        {dataPosko.length === 0 && (
           <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-slate-100 shadow-xl">
              <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4 animate-pulse" />
              <p className="font-bold text-slate-400 uppercase tracking-widest">Syncing Data Posko...</p>
           </div>
        )}
      </div>

      <AnimatePresence>
         {selectedPosko && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 bg-slate-900/60 backdrop-blur-sm"
               onClick={() => setSelectedPosko(null)}
            >
               <motion.div 
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 20 }}
                  className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto"
                  onClick={e => e.stopPropagation()}
               >
                  <div className="bg-slate-900 p-6 md:p-10 border-b-[6px] border-brand-red flex items-center justify-between relative overflow-hidden shrink-0">
                     <div className="absolute top-[-50%] right-[-10%] w-[500px] h-[500px] bg-brand-red/10 blur-[100px] rounded-full pointer-events-none" />
                     <div className="flex items-center gap-6 relative z-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-brand-red to-red-800 rounded-2xl flex items-center justify-center shadow-xl border border-brand-red/50">
                           <Flame className="w-8 h-8 text-white" />
                        </div>
                        <div>
                           <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-brand-red" /> {selectedPosko.namaPosko.includes('INDUK') ? 'Pusat Komando' : 'Sektor Wilayah'}</p>
                           <h3 className="text-2xl sm:text-4xl font-display font-black text-white uppercase italic tracking-tighter leading-none">{selectedPosko.namaPosko}</h3>
                        </div>
                     </div>
                     <button onClick={() => setSelectedPosko(null)} className="relative z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors cursor-pointer border border-white/10">
                        <X className="w-6 h-6" />
                     </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50 relative">
                     <div className="max-w-4xl mx-auto space-y-10">
                        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border-2 border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                           <div>
                              <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2"><Shield className="w-4 h-4 text-brand-red" /> Komandan Regu Siaga</p>
                              <p className="text-2xl font-bold text-slate-800 italic">{selectedPosko.danruSiaga || 'Belum Ditunjuk'}</p>
                           </div>
                           <div className="flex gap-4">
                              <div className="bg-brand-red/10 text-brand-red px-5 py-3 rounded-2xl border border-brand-red/20 text-center">
                                 <p className="text-2xl font-black">{selectedPosko.armada?.length || 0}</p>
                                 <p className="text-[10px] font-bold uppercase tracking-widest">Armada</p>
                              </div>
                              <div className="bg-blue-50 text-blue-600 px-5 py-3 rounded-2xl border border-blue-100 text-center">
                                 <p className="text-2xl font-black">{selectedPosko.personil?.length || 0}</p>
                                 <p className="text-[10px] font-bold uppercase tracking-widest">Personil</p>
                              </div>
                           </div>
                        </div>

                        <div>
                           <h4 className="text-xl font-black text-slate-800 uppercase tracking-widest italic flex items-center gap-3 mb-6">
                              <Truck className="w-6 h-6 text-slate-400" /> Manifest <span className="text-brand-red">Armada Siaga</span>
                           </h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              {selectedPosko.armada?.map((armada: any, aIdx: number) => (
                                 <div key={aIdx} className="bg-white p-6 rounded-[2rem] shadow-sm border-2 border-slate-100 relative overflow-hidden">
                                    <div className={cn("absolute top-0 left-0 w-2 h-full", armada.status === 'Siaga' ? 'bg-green-500' : armada.status === 'Bertugas' ? 'bg-brand-red' : 'bg-amber-500')} />
                                    <div className="flex justify-between items-start mb-4 pl-4">
                                       <div>
                                          <p className="font-black text-slate-800 text-xl uppercase italic tracking-tighter">{armada.nama}</p>
                                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest font-mono mt-1">{armada.plat}</p>
                                       </div>
                                       {getStatusBadge(armada.status)}
                                    </div>
                                    {armada.peralatan && armada.peralatan.length > 0 && (
                                       <div className="pt-4 mt-4 border-t-2 border-slate-50 pl-4">
                                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Wrench className="w-4 h-4" /> Daftar Peralatan</p>
                                          <div className="flex flex-wrap gap-2">
                                             {armada.peralatan.map((alat: any, px: number) => (
                                                <span key={px} className={cn(
                                                   "text-xs px-3 py-1.5 rounded-xl font-bold capitalize border",
                                                   alat.kondisi?.includes("Rusak") ? "bg-red-50 text-red-700 border-red-200" : "bg-slate-50 text-slate-600 border-slate-200"
                                                )}>
                                                   <span className="font-black text-slate-800">{alat.jumlah}x</span> {alat.nama} {alat.kondisi?.includes("Rusak") && <span className="text-brand-red">({alat.kondisi})</span>}
                                                </span>
                                             ))}
                                          </div>
                                       </div>
                                    )}
                                 </div>
                              ))}
                           </div>
                        </div>

                        <div>
                           <h4 className="text-xl font-black text-slate-800 uppercase tracking-widest italic flex items-center gap-3 mb-6">
                              <Users className="w-6 h-6 text-slate-400" /> Manifest <span className="text-brand-red">Personil Piket</span>
                           </h4>
                           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                              {selectedPosko.personil?.map((personil: any, pIdx: number) => {
                                 const isDanru = personil.peran?.toLowerCase() === 'danru' || selectedPosko.danruSiaga?.includes(personil.nama);
                                 const isRescue = personil.peran?.toLowerCase() === 'rescue';
                                 const isDriver = personil.peran?.toLowerCase() === 'driver';
                                 return (
                                    <div key={pIdx} className={cn(
                                       "relative flex items-center gap-5 p-5 rounded-[2rem] border-2 bg-white",
                                       isDanru ? "border-brand-red/30 shadow-md" : "border-slate-100"
                                    )}>
                                       {isDanru && <div className="absolute top-0 left-0 w-2 h-full bg-brand-red" />}
                                       <div className="relative shrink-0">
                                          <div className={cn("w-16 h-16 rounded-full p-[2px]", isDanru ? "ring-2 ring-brand-red/40" : "border-2 border-slate-100")}>
                                             {personil.foto ? (
                                                <img src={personil.foto} alt={personil.nama} className="w-full h-full rounded-full object-cover" />
                                             ) : (
                                                <div className="w-full h-full rounded-full flex items-center justify-center bg-slate-50 text-slate-400">
                                                   <Users className="w-7 h-7" />
                                                </div>
                                             )}
                                          </div>
                                          <div className={cn(
                                             "absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md border-[2.5px] border-white",
                                             isDanru ? 'bg-brand-red' : isRescue ? 'bg-orange-500' : isDriver ? 'bg-blue-600' : 'bg-slate-500'
                                          )}>
                                             {getPersonilIcon(personil.peran)}
                                          </div>
                                       </div>
                                       <div className="flex-1 min-w-0">
                                          {isDanru && <span className="text-[10px] font-black text-brand-red uppercase tracking-widest bg-red-100 px-2 py-0.5 rounded-md border border-red-200 mb-1 inline-block">Danru</span>}
                                          <p className="font-bold text-slate-800 text-[15px] xl:text-[17px] uppercase tracking-tight break-words leading-tight" title={personil.nama}>{personil.nama}</p>
                                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 opacity-80 leading-tight">{personil.peran || "Anggota"}</p>
                                       </div>
                                    </div>
                                 )
                              })}
                           </div>
                        </div>

                     </div>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
}
