import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Maximize2, Minimize2 } from 'lucide-react';

// --- DATA DUMMY PEGAWAI ---
export const defaultOrgData = {
  kepala: { jabatan: "KEPALA DINAS", nama: "Nama Kepala Dinas", foto: "https://via.placeholder.com/150" },
  sekretaris: { jabatan: "SEKRETARIS", nama: "Nama Sekretaris", foto: "https://via.placeholder.com/150" },
  fungsional: { jabatan: "JABATAN FUNGSIONAL", nama: "Nama Pejabat", foto: "https://via.placeholder.com/150" },
  
  // Di bawah Sekretaris
  subbag: [
    { jabatan: "SUBBAGIAN PERENCANAAN DAN KEUANGAN", nama: "Nama Kasubbag", foto: "https://via.placeholder.com/150" },
    { jabatan: "SUBBAGIAN UMUM DAN KEPEGAWAIAN", nama: "Nama Kasubbag", foto: "https://via.placeholder.com/150" },
  ],

  // Bidang 1
  bidangPencegahan: {
    jabatan: "KEPALA BIDANG PENCEGAHAN", nama: "Nama Kabid", foto: "https://via.placeholder.com/150",
    seksi: [
      { jabatan: "SEKSI PENCEGAHAN DAN INSPEKSI", nama: "Nama Kasi", foto: "https://via.placeholder.com/150" },
      { jabatan: "SEKSI PENINGKATAN KAPASITAS APARATUR", nama: "Nama Kasi", foto: "https://via.placeholder.com/150" },
      { jabatan: "SEKSI PEMBERDAYAAN MASY. & DUNIA USAHA", nama: "Nama Kasi", foto: "https://via.placeholder.com/150" },
    ]
  },

  // Bidang 2
  bidangPemadam: {
    jabatan: "KABID PEMADAM, PENYELAMATAN & SARPRAS", nama: "Nama Kabid", foto: "https://via.placeholder.com/150",
    seksi: [
      { jabatan: "SEKSI PENYELAMATAN DAN EVAKUASI", nama: "Nama Kasi", foto: "https://via.placeholder.com/150" },
      { jabatan: "SEKSI SARANA DAN PRASARANA", nama: "Nama Kasi", foto: "https://via.placeholder.com/150" },
      { jabatan: "KELOMPOK JABATAN FUNGSIONAL", nama: "Nama Pejabat", foto: "https://via.placeholder.com/150" },
    ]
  }
};

interface PersonData {
  jabatan: string;
  nama: string;
  foto: string;
}

// --- KOMPONEN KARTU PEGAWAI ---
const PersonCard = ({ data, isTopLevel = false }: { data: PersonData, isTopLevel?: boolean }) => {
  if (!data) return null;
  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      className={`flex flex-col items-center bg-white rounded-xl shadow-md p-4 border-t-4 ${isTopLevel ? 'border-brand-red w-72' : 'border-red-500 w-full md:w-64'} transition-transform hover:shadow-xl`}
    >
      <img src={data.foto || "https://via.placeholder.com/150"} alt={data.nama || "-"} className={`object-cover rounded-full border-4 border-slate-50 shadow-sm ${isTopLevel ? 'w-28 h-28 mb-4' : 'w-20 h-20 mb-3'}`} />
      <h3 className="font-bold text-slate-900 text-center text-sm mb-1 uppercase">{data.nama || "-"}</h3>
      <p className="text-xs font-black text-brand-red text-center leading-tight tracking-widest">{data.jabatan || "-"}</p>
    </motion.div>
  );
};

export default function StrukturOrganisasi() {
  const [orgData, setOrgData] = useState<any>(defaultOrgData);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'org_structure'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().data) {
        setOrgData(docSnap.data().data);
      }
    }, (err) => {
      console.error("Failed to load org structure:", err);
    });
    return () => unsub();
  }, []);

  const content = (
    <div className="max-w-7xl mx-auto w-full">
      <div className="text-center mb-16 relative">
        <h2 className="text-4xl font-display font-black text-slate-900 uppercase italic tracking-tighter mb-4">Peta Jabatan</h2>
        <p className="mt-3 max-w-2xl mx-auto text-lg text-slate-500 font-medium">
          Dinas Pemadam Kebakaran dan Penyelamatan Kabupaten Malinau
        </p>
        <button 
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="absolute right-0 top-0 p-3 bg-slate-100 hover:bg-brand-red hover:text-white rounded-full transition-colors hidden md:block"
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex flex-col items-center space-y-12 overflow-x-auto pb-10">
        
        {/* LEVEL 1: KEPALA DINAS */}
        <div className="relative flex flex-col items-center">
          <PersonCard data={orgData.kepala} isTopLevel={true} />
          {/* Garis vertikal ke bawah */}
          <div className="w-1 bg-slate-200 h-12"></div>
        </div>

        {/* LEVEL 2: SEKRETARIS & FUNGSIONAL */}
        <div className="w-full flex flex-col md:flex-row justify-center md:items-start items-center gap-8 md:gap-24 relative">
            {/* Garis Horizontal Penghubung (Hanya Desktop) */}
          <div className="hidden md:block absolute top-[1px] w-[50%] h-1 bg-slate-200 -z-10"></div>
          
          {/* Jabatan Fungsional (Kiri) */}
          <div className="flex flex-col items-center z-10 relative">
            <div className="hidden md:block w-1 bg-slate-200 h-8 -mt-8"></div>
            <PersonCard data={orgData.fungsional} />
          </div>

          {/* Sekretaris & Subbagian (Kanan) */}
          <div className="flex flex-col items-center bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm z-10 relative">
            <div className="hidden md:block w-1 bg-slate-200 h-[64px] absolute -mt-[96px] top-8"></div>
            <PersonCard data={orgData.sekretaris} />
            <div className="w-1 bg-slate-200 h-8"></div>
            
            {/* Subbagian grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {orgData.subbag.map((item: any, idx: number) => (
                <PersonCard key={idx} data={item} />
              ))}
            </div>
          </div>
        </div>

        {/* LEVEL 3: DUA BIDANG UTAMA */}
        <div className="w-full max-w-6xl mt-12 z-10 relative">
          <div className="w-full flex flex-col lg:flex-row gap-12">
            
            {/* BIDANG PENCEGAHAN */}
            <div className="flex-1 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col items-center">
              <PersonCard data={orgData.bidangPencegahan} />
              <div className="w-1 bg-slate-200 h-8"></div>
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                {orgData.bidangPencegahan.seksi.map((item: any, idx: number) => (
                  <PersonCard key={idx} data={item} />
                ))}
              </div>
            </div>

            {/* BIDANG PEMADAM, PENYELAMATAN & SARPRAS */}
            <div className="flex-1 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col items-center">
              <PersonCard data={orgData.bidangPemadam} />
              <div className="w-1 bg-slate-200 h-8"></div>
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                {orgData.bidangPemadam.seksi.map((item: any, idx: number) => (
                  <PersonCard key={idx} data={item} />
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );

  return (
    <>
      <div className="bg-slate-50 py-16 px-4 md:px-8 rounded-[3rem] my-10 relative z-0">
        {content}
      </div>

      <AnimatePresence>
        {isFullscreen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-slate-50 overflow-y-auto p-4 md:p-8"
          >
            <div className="min-h-screen pt-10 relative">
              <button 
                onClick={() => setIsFullscreen(false)}
                className="absolute right-4 md:right-8 top-4 md:top-8 p-4 bg-white shadow-xl hover:bg-brand-red hover:text-white rounded-full transition-colors z-50 text-slate-900 border border-slate-200 cursor-pointer"
              >
                <Minimize2 className="w-6 h-6" />
              </button>
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
