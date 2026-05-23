import React from 'react';
import StrukturOrganisasi from '../components/StrukturOrganisasi';
import DynamicBanner from '../components/DynamicBanner';

export default function StrukturOrganisasiPage() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <DynamicBanner 
        pageId="struktur"
        defaultTitle="Struktur Organisasi"
        defaultSubtitle="Hierarki struktur organisasi Dinas Pemadam Kebakaran dan Penyelamatan Kabupaten Malinau."
        defaultImage="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=2069"
      />
      
      <div className="-mt-10 px-4 sm:px-6 relative z-10 w-full">
        <StrukturOrganisasi />
      </div>
    </div>
  );
}
