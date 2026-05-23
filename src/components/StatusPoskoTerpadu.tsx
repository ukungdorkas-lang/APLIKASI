import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Truck, Users, Wrench, AlertCircle, CheckCircle, Flame, MapPin, Activity, Radio } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';

export const defaultPoskoData = [
  {
    id: "posko-induk",
    namaPosko: "POSKO INDUK DAMKAR MALINAU",
    danruSiaga: "Komandan Asep Surahman",
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

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "status_posko"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().data) {
        setDataPosko(docSnap.data().data);
      }
    });
    return () => unsub();
  }, []);

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
               <h2 className="text-4xl md:text-6xl font-display font-black text-white uppercase italic tracking-tighter leading-none mb-4">
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

      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-10">
        {dataPosko.map((posko, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            key={posko.id || idx} 
            className="group bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col hover:border-brand-red/30 transition-all duration-500"
          >
            {/* Header Posko */}
            <div className="bg-slate-900 px-8 py-8 md:px-12 md:py-10 border-b-[6px] border-brand-red flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
               <div className="absolute top-[-50%] right-[-10%] w-[500px] h-[500px] bg-brand-red/10 blur-[100px] rounded-full pointer-events-none" />
               <div className="absolute bottom-[-20%] left-[10%] w-[300px] h-[300px] bg-slate-800/30 blur-[80px] rounded-full pointer-events-none" />
               
               <div className="relative z-10 flex items-center gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-brand-red to-red-800 rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-red-900/40 transform group-hover:scale-105 group-hover:rotate-3 transition-all duration-500 border border-brand-red/50">
                     <Flame className="w-10 h-10 text-white" />
                  </div>
                  <div>
                     <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/5 mb-3">
                        <MapPin className="w-3.5 h-3.5 text-brand-red" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{posko.namaPosko.includes('INDUK') ? 'Pusat Komando' : 'Sektor Wilayah'}</span>
                     </div>
                     <h3 className="text-3xl md:text-4xl font-display font-black text-white uppercase italic tracking-tighter leading-none">{posko.namaPosko}</h3>
                  </div>
               </div>
               
               <div className="relative z-10 lg:text-right flex flex-col lg:items-end justify-center px-6 py-4 bg-white/5 backdrop-blur-xl rounded-[1.5rem] border border-white/10 border-l-4 border-l-brand-red">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5 flex items-center gap-2 lg:justify-end">
                     <Shield className="w-3 h-3 text-brand-red" />
                     Komandan Regu
                  </p>
                  <p className="font-bold text-white text-lg italic">{posko.danruSiaga || 'Belum Ditunjuk'}</p>
               </div>
            </div>

            {/* Content Split */}
            <div className="flex flex-col xl:flex-row flex-1 divide-y xl:divide-y-0 xl:divide-x divide-slate-100">
               
               {/* ARMADA AREA */}
               <div className="flex-1 lg:flex-[0.4] p-8 md:p-12 bg-slate-50/50 flex flex-col">
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
                       <div className="h-full min-h-[150px] flex items-center justify-center bg-white/50 rounded-[1.5rem] border-2 border-dashed border-slate-200">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">N/A ARMADA</p>
                       </div>
                     )}
                  </div>
               </div>

               {/* PERSONIL AREA */}
               <div className="flex-1 lg:flex-[0.6] p-8 md:p-12 flex flex-col bg-white">
                  <div className="flex flex-col sm:flex-row items-baseline gap-4 mb-8 pb-4 border-b-2 border-slate-100">
                     <h4 className="text-xl font-black text-slate-800 uppercase tracking-widest italic flex items-center gap-3">
                        <Users className="w-5 h-5 text-slate-400" /> Manifest <span className="text-brand-red">Personil</span>
                     </h4>
                     <span className="text-[10px] font-black bg-brand-red/10 text-brand-red px-3 py-1 rounded-full uppercase tracking-widest">{posko.personil?.length || 0} Bertugas</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 flex-1 content-start">
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
                                  "flex flex-col gap-3 p-4 rounded-[1.5rem] border-2 transition-all group/personil relative overflow-hidden",
                                  isDanru ? "border-brand-red/50 bg-red-50/30 hover:border-brand-red shadow-sm" : "border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                               )}
                             >
                               {isDanru && <div className="absolute top-0 left-0 w-full h-1 bg-brand-red" />}
                               <div className="flex items-center gap-4">
                                  <div className="relative">
                                     <div className={cn(
                                        "w-12 h-12 rounded-full p-[2px] border-2 bg-white",
                                        isDanru ? "border-brand-red" : "border-slate-200 group-hover/personil:border-slate-300"
                                     )}>
                                        {personil.foto ? (
                                           <img src={personil.foto} alt={personil.nama} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                           <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                              <Users className="w-4 h-4" />
                                           </div>
                                        )}
                                     </div>
                                     <div className={cn(
                                        "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md border-2 border-white",
                                        isDanru ? 'bg-brand-red' :
                                        isRescue ? 'bg-orange-500' : 
                                        isDriver ? 'bg-blue-600' : 'bg-slate-500'
                                     )}>
                                        {getPersonilIcon(personil.peran)}
                                     </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                     {isDanru && <span className="text-[8px] font-black text-brand-red uppercase tracking-widest bg-brand-red/10 px-1.5 py-0.5 rounded border border-brand-red/20 mb-1 inline-block">Danru</span>}
                                     <p className="font-bold text-slate-800 text-sm uppercase truncate leading-tight tracking-tight mt-0.5" title={personil.nama}>{personil.nama}</p>
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{personil.peran || "Anggota"}</p>
                                  </div>
                               </div>
                             </motion.div>
                           )
                        })}
                     </AnimatePresence>
                     {(!posko.personil || posko.personil.length === 0) && (
                        <div className="col-span-full h-full min-h-[150px] flex flex-col items-center justify-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                           <Users className="w-8 h-8 text-slate-300 mb-3" />
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">N/A PERSONIL</p>
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
    </div>
  );
}
