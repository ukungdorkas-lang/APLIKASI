import React from 'react';

export default function PetaRawanBencana() {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
      
      {/* Bagian Header Peta */}
      <div className="bg-red-700 p-5">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          🗺️ Peta Titik Rawan & Pemantauan Wilayah
        </h2>
        <p className="text-red-100 text-sm mt-1">
          Visualisasi interaktif zona rawan kebakaran, titik kumpul, dan lokasi sumber air di Kabupaten Malinau.
        </p>
      </div>
      
      {/* Bagian Peta (Iframe) */}
      <div className="p-5 bg-gray-50">
        <div className="w-full h-[500px] rounded-xl overflow-hidden border-2 border-gray-200 shadow-inner relative z-0">
          
          {/* GANTI LINK SRC DI BAWAH INI DENGAN LINK GOOGLE MY MAPS ANDA */}
          <iframe 
            src="https://www.google.com/maps/d/edit?mid=1x1lMXDroFqc5RzH_qEELRd-s3ZgEEmI&usp=sharing" 
            width="100%" 
            height="100%" 
            style={{ border: 0 }}
            allowFullScreen={true}
            loading="lazy"
            title="Peta Rawan Kebakaran Malinau"
            className="absolute top-0 left-0"
          ></iframe>

        </div>
        
        {/* Keterangan Peta (Legend) */}
        <div className="mt-5 flex flex-wrap justify-center md:justify-start gap-6 text-sm font-semibold text-gray-700 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-red-600 block shadow-sm"></span> 
            Zona Rawan (Merah)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-yellow-400 block shadow-sm"></span> 
            Waspada (Kuning)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-blue-500 block shadow-sm"></span> 
            Sumber Air / Hydrant
          </div>
        </div>
      </div>

    </div>
  );
}
