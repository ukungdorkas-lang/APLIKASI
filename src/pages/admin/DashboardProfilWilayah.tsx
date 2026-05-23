import React from 'react';
import { MapPin, Phone, Users, Shield, Clock, PhoneCall } from 'lucide-react';
import { motion } from 'motion/react';

const stations = [
  {
    id: 1,
    name: "Posko Induk Damkar Malinau",
    address: "Jl. Pusat Pemerintahan, Malinau Kota, Kab. Malinau, Kalimantan Utara",
    commander: "Komandan Asep",
    personnel: 24,
    phone: "081112223334",
    status: "Siaga 24 Jam"
  },
  {
    id: 2,
    name: "Sektor Wilayah Barat",
    address: "Jl. Lintas Barat, Kec. Malinau Barat, Kab. Malinau",
    commander: "Danru Budi",
    personnel: 12,
    phone: "082223334445",
    status: "Siaga 24 Jam"
  },
  {
    id: 3,
    name: "Sektor Wilayah Utara",
    address: "Jl. Poros Utara, Kec. Malinau Utara, Kab. Malinau",
    commander: "Danru Cecep",
    personnel: 10,
    phone: "083334445556",
    status: "Siaga 24 Jam"
  },
  {
    id: 4,
    name: "Sektor Mentarang",
    address: "Jl. Desa Mentarang, Kec. Mentarang, Kab. Malinau",
    commander: "Danru Dodi",
    personnel: 8,
    phone: "084445556667",
    status: "Siaga 24 Jam"
  }
];

export default function DashboardProfilWilayah() {
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
                <iframe src="https://www.google.com/maps/d/embed?mid=1x1lMXDroFqc5RzH_qEELRd-s3ZgEEmI&ehbc=2E312F" width="640" height="480"></iframe>
                width="100%"
                height="100%"
                className="absolute inset-0 w-full h-full border-0"
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
                  className="bg-white rounded-[2rem] p-6 lg:p-8 border-2 border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-slate-200 transition-all duration-300 relative overflow-hidden group/card"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-brand-red to-orange-500" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                    <div>
                      <h3 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tight group-hover/card:text-brand-red transition-colors">
                        {station.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full inline-flex border border-slate-200">
                        <Clock className="w-3.5 h-3.5 text-green-500" />
                        {station.status}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-2 bg-slate-50 rounded-xl shrink-0">
                         <MapPin className="w-4 h-4 text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-600 leading-relaxed shadow-sm-text">
                        {station.address}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-red-50 rounded-xl shrink-0 text-brand-red border border-red-100">
                            <Shield className="w-4 h-4" />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-400 shadow-sm-text uppercase tracking-widest mb-0.5">Komandan</p>
                            <p className="text-sm font-bold text-slate-800">{station.commander}</p>
                         </div>
                       </div>
                       
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-blue-50 rounded-xl shrink-0 text-blue-600 border border-blue-100">
                            <Users className="w-4 h-4" />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-400 shadow-sm-text uppercase tracking-widest mb-0.5">Personil</p>
                            <p className="text-sm font-bold text-slate-800">{station.personnel} Bertugas</p>
                         </div>
                       </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t font-medium border-slate-100">
                    <button 
                      onClick={() => window.open(`https://wa.me/${station.phone}`, '_blank')}
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
      </div>
    </div>
  );
}
