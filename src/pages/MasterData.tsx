import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/db';
import { collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc, orderBy, getDocs, getDoc } from '@/src/lib/supabase-adapter';
import { Personnel, Squad, Sector, OperationType } from '../types';
import { handleFirestoreError } from '../lib/errorHandler';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Truck, 
  MapPin, 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  X, 
  Save, 
  ShieldCheck,
  UserPlus,
  Building,
  Database,
  AlertCircle,
  Menu
} from 'lucide-react';
import { cn } from '../lib/utils';
import { LoadingSpinner } from '../components/Loading';
import OperationalSidebar from '../components/OperationalSidebar';
import { FileUpload } from '../components/FileUpload';

type MasterTab = 'personnel' | 'squads' | 'sectors';

export default function MasterData() {
  const [activeTab, setActiveTab] = useState<MasterTab>('personnel');
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);
  const [seedProgress, setSeedProgress] = useState(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Filter states
  const [filterSectorId, setFilterSectorId] = useState<string>('');
  const [filterSquadId, setFilterSquadId] = useState<string>('');

  // Inline creation states
  const [newSectorName, setNewSectorName] = useState('');
  const [newSectorAddress, setNewSectorAddress] = useState('');
  const [newSquadName, setNewSquadName] = useState('');

  // Form states
  const [personnelForm, setPersonnelForm] = useState<Partial<Personnel>>({
    name: '', rank: '', squadId: '', sectorId: '', phoneNumber: '', status: 'active', role: 'field_personnel'
  });
  const [squadForm, setSquadForm] = useState<Partial<Squad>>({
    name: '', commanderId: '', sectorId: ''
  });
  const [sectorForm, setSectorForm] = useState<Partial<Sector>>({
    name: '', address: ''
  });

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        if (user.email === 'ukungdorkas@gmail.com') {
          setIsAdmin(true);
        } else {
          try {
            const adminDoc = await getDocs(query(collection(db, 'admins')));
            const isAdminUser = adminDoc.docs.some(d => d.data().email === user.email);
            setIsAdmin(isAdminUser);
          } catch (e) {
            console.warn('Admin check failed:', e);
            setIsAdmin(false);
          }
        }
      }
    });

    setLoading(true);
    let counts = { personnel: false, squads: false, sectors: false };
    
    const checkAllDone = () => {
      if (counts.personnel && counts.squads && counts.sectors) {
        setLoading(false);
      }
    };

    const unsubPersonnel = onSnapshot(query(collection(db, 'personnel'), orderBy('name', 'asc')), (sn) => {
      const data = sn.docs.map(d => ({ ...d.data(), id: d.id } as Personnel));
      setPersonnel(data);
      counts.personnel = true;
      checkAllDone();
    }, (err) => {
      console.error('Personnel snapshot error:', err);
      counts.personnel = true;
      checkAllDone();
    });

    const unsubSquads = onSnapshot(query(collection(db, 'squads'), orderBy('name', 'asc')), (sn) => {
      const data = sn.docs.map(d => ({ ...d.data(), id: d.id } as Squad));
      setSquads(data);
      counts.squads = true;
      checkAllDone();
    }, (err) => {
      console.error('Squads snapshot error:', err);
      counts.squads = true;
      checkAllDone();
    });

    const unsubSectors = onSnapshot(query(collection(db, 'sectors'), orderBy('name', 'asc')), (sn) => {
      const data = sn.docs.map(d => ({ ...d.data(), id: d.id } as Sector));
      setSectors(data);
      counts.sectors = true;
      checkAllDone();
    }, (err) => {
      console.error('Sectors snapshot error:', err);
      counts.sectors = true;
      checkAllDone();
    });

    // Fallback if snapshots don't fire or hang
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      unsubAuth(); unsubPersonnel(); unsubSquads(); unsubSectors();
      clearTimeout(timeout);
    };
  }, []);

  const handleClearAllData = async () => {
    setShowClearConfirm(false);
    console.log('Clearing all master data started...');
    setLoading(true);
    
    try {
      const collectionsToClear = ['personnel', 'squads', 'sectors', 'operational_reports'];
      let totalDeleted = 0;
      
      for (const colName of collectionsToClear) {
        const querySnapshot = await getDocs(collection(db, colName));
        if (querySnapshot.empty) continue;

        const deletePromises = querySnapshot.docs.map(document => 
          deleteDoc(doc(db, colName, document.id))
        );
        await Promise.all(deletePromises);
        totalDeleted += querySnapshot.size;
        console.log(`Cleared ${querySnapshot.size} docs from ${colName}`);
      }
      
      alert(`Berhasil! ${totalDeleted} item data master dan laporan operasional telah dibersihkan.`);
    } catch (error) {
      console.error('CRITICAL: Clear All Data Error:', error);
      alert('Gagal membersihkan data. Pastikan Anda memiliki otoritas admin.');
      handleFirestoreError(error, OperationType.DELETE, 'bulk_clear_master', auth);
    } finally {
      setLoading(false);
    }
  };

  const resetForms = () => {
    setPersonnelForm({
      name: '', rank: '', squadId: '', sectorId: '', phoneNumber: '', status: 'active', role: 'field_personnel'
    });
    setSquadForm({
      name: '', commanderId: '', sectorId: ''
    });
    setSectorForm({
      name: '', address: ''
    });
    setNewSectorName('');
    setNewSectorAddress('');
    setNewSquadName('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const col = activeTab === 'personnel' ? 'personnel' : activeTab === 'squads' ? 'squads' : 'sectors';
      let form = activeTab === 'personnel' ? personnelForm : activeTab === 'squads' ? squadForm : sectorForm;

      // Inline checks/creations
      if (activeTab === 'personnel') {
        let finalSectorId = personnelForm.sectorId;
        if (personnelForm.sectorId === 'NEW_SECTOR') {
          if (!newSectorName.trim()) {
            alert('Nama Sektor Baru wajib diisi!');
            return;
          }
          const secRef = await addDoc(collection(db, 'sectors'), {
            name: newSectorName.toUpperCase().trim(),
            address: newSectorAddress.trim() || 'Pos Sektor Baru',
            createdAt: Date.now()
          });
          finalSectorId = secRef.id;
        }

        let finalSquadId = personnelForm.squadId;
        if (personnelForm.squadId === 'NEW_SQUAD' || personnelForm.sectorId === 'NEW_SECTOR') {
          if (!newSquadName.trim()) {
            alert('Nama Regu Baru wajib diisi!');
            return;
          }
          const squadRef = await addDoc(collection(db, 'squads'), {
            name: newSquadName.toUpperCase().trim(),
            sectorId: finalSectorId,
            commanderId: '',
            createdAt: Date.now()
          });
          finalSquadId = squadRef.id;
        }

        form = {
          ...personnelForm,
          sectorId: finalSectorId,
          squadId: finalSquadId
        };
      } else if (activeTab === 'squads') {
        let finalSectorId = squadForm.sectorId;
        if (squadForm.sectorId === 'NEW_SECTOR') {
          if (!newSectorName.trim()) {
            alert('Nama Sektor Baru wajib diisi!');
            return;
          }
          const secRef = await addDoc(collection(db, 'sectors'), {
            name: newSectorName.toUpperCase().trim(),
            address: newSectorAddress.trim() || 'Pos Sektor Baru',
            createdAt: Date.now()
          });
          finalSectorId = secRef.id;
        }

        form = {
          ...squadForm,
          sectorId: finalSectorId
        };
      }

      // Sanitize the form payload to remove the 'id' field before storing inside document fields,
      // which avoids Firebase updateDoc/addDoc failures.
      const { id, ...saveForm } = form as any;

      if (editingItem) {
        await updateDoc(doc(db, col, editingItem.id), saveForm);

        // Synchronize edited personnel details with active picket manifests inside settings/status_posko
        if (activeTab === 'personnel') {
          try {
            const poskoDocRef = doc(db, 'settings', 'status_posko');
            const poskoSnap = await getDoc(poskoDocRef);
            if (poskoSnap.exists()) {
              const poskoData = poskoSnap.data()?.data || [];
              let isUpdated = false;

              const updatedPoskoData = poskoData.map((posko: any) => {
                if (posko.personil && Array.isArray(posko.personil)) {
                  const updatedPersonil = posko.personil.map((per: any) => {
                    if (per.id === editingItem.id || (per.nama && per.nama.toLowerCase().trim() === editingItem.name?.toLowerCase().trim())) {
                      isUpdated = true;
                      return {
                        ...per,
                        id: editingItem.id,
                        nama: saveForm.name || per.nama,
                        peran: saveForm.rank || per.peran,
                        foto: saveForm.photoUrl || per.foto || ""
                      };
                    }
                    return per;
                  });
                  return { ...posko, personil: updatedPersonil };
                }
                return posko;
              });

              if (isUpdated) {
                await updateDoc(poskoDocRef, { data: updatedPoskoData });
              }
            }
          } catch (syncErr) {
            console.warn("Failed to synchronize personnel details with settings/status_posko:", syncErr);
          }
        }
      } else {
        await addDoc(collection(db, col), { ...saveForm, createdAt: Date.now() });
      }
      setShowModal(false);
      setEditingItem(null);
      resetForms();
    } catch (error) {
      console.error('Error saving data:', error);
      handleFirestoreError(error, editingItem ? OperationType.UPDATE : OperationType.CREATE, activeTab, auth);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    try {
      const col = activeTab === 'personnel' ? 'personnel' : activeTab === 'squads' ? 'squads' : 'sectors';
      await deleteDoc(doc(db, col, id));
    } catch (error) {
      console.error('Error deleting data:', error);
      handleFirestoreError(error, OperationType.DELETE, activeTab, auth);
    }
  };

  const seedSampleData = async () => {
    setShowSeedConfirm(false);
    setLoading(true);
    setSeedProgress(5);
    console.log('Starting detailed seed process...');
    try {
      const sectorSpecs = [
        { 
          name: 'INDUK', 
          address: 'Pusat Komando Induk', 
          squads: [
            { name: 'REGU 1', count: 10 },
            { name: 'REGU 2', count: 10 },
            { name: 'REGU 3', count: 10 }
          ]
        },
        { 
          name: 'BARAT', 
          address: 'Pos Sektor Barat', 
          squads: [
            { name: 'REGU 4', count: 6 },
            { name: 'REGU 5', count: 6 },
            { name: 'REGU 6', count: 6 }
          ]
        },
        { 
          name: 'UTARA', 
          address: 'Pos Sektor Utara', 
          squads: [
            { name: 'REGU 7', count: 8 },
            { name: 'REGU 8', count: 8 },
            { name: 'REGU 9', count: 8 }
          ]
        },
        { 
          name: 'MENTARANG', 
          address: 'Pos Sektor Mentarang', 
          squads: [
            { name: 'REGU 10', count: 3 },
            { name: 'REGU 11', count: 3 },
            { name: 'REGU 12', count: 4 }
          ]
        }
      ];

      let processed = 0;
      const totalSteps = sectorSpecs.length + 12 + 82; // Sectors + Squads + Personnel

      for (const s of sectorSpecs) {
        // Create Sector
        const secRef = await addDoc(collection(db, 'sectors'), {
          name: s.name,
          address: s.address,
          createdAt: Date.now()
        });
        processed++;
        setSeedProgress(Math.floor((processed / totalSteps) * 100));

        for (const sq of s.squads) {
          // Create Squad
          const squadRef = await addDoc(collection(db, 'squads'), {
            name: sq.name,
            sectorId: secRef.id,
            commanderId: '',
            createdAt: Date.now()
          });
          processed++;
          setSeedProgress(Math.floor((processed / totalSteps) * 100));

          // Create Personnel for this Squad
          for (let i = 1; i <= sq.count; i++) {
            await addDoc(collection(db, 'personnel'), {
              name: `PERSONIL ${sq.name.split(' ')[1]}.${i.toString().padStart(2, '0')}`,
              rank: i === 1 ? 'DANRU' : 'ANGGOTA',
              squadId: squadRef.id,
              sectorId: secRef.id,
              phoneNumber: `08${Math.floor(1000000000 + Math.random() * 9000000000)}`,
              status: 'active',
              role: 'field_personnel',
              createdAt: Date.now()
            });
            processed++;
            setSeedProgress(Math.floor((processed / totalSteps) * 100));
          }
        }
      }

      setSeedProgress(100);
      alert('Data Master Berhasil Distandardisasi! Total 82 Personil telah diinput.');
    } catch (error) {
      console.error('Seed error:', error);
      alert('Gagal standardisasi data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
      setSeedProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <OperationalSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex-1 lg:ml-72 p-4 sm:p-8 lg:p-12 overflow-x-auto w-full">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-16">
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-3.5 bg-white border-2 border-slate-200 text-slate-800 rounded-2xl shadow-sm hover:bg-slate-50 active:scale-95 transition-all shrink-0 animate-fade-in"
              title="Menu Navigasi"
            >
              <Menu className="w-5 h-5 text-slate-700" />
            </button>
            <div className="overflow-hidden">
              <h1 className="text-2xl md:text-4xl font-display font-black text-slate-900 uppercase italic tracking-tighter leading-tight">Manajemen <span className="text-brand-red">Data Master</span></h1>
              <p className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest mt-1 italic truncate">Pengelolaan Relasional Personil & Unit</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 relative z-50">
            {isAdmin && (
              <button 
                id="clear-data-button"
                onClick={() => setShowClearConfirm(true)}
                className={cn(
                  "bg-white text-brand-red py-3 px-5 md:py-4 md:px-6 rounded-2xl font-black italic uppercase tracking-tighter shadow-xl hover:bg-brand-red hover:text-white transition-all flex items-center gap-3 text-[10px] border-2 border-brand-red cursor-pointer active:scale-95",
                  loading && "opacity-50 cursor-wait"
                )}
              >
                <Trash2 className="w-4 h-4 pointer-events-none" /> {loading ? 'Memproses...' : 'Bersihkan Data'}
              </button>
            )}
            <button 
              id="seed-data-button"
              onClick={() => {
                if (loading) return;
                setShowSeedConfirm(true);
              }}
              className={cn(
                "bg-slate-900 text-white py-4 px-6 rounded-2xl font-black italic uppercase tracking-tighter shadow-xl hover:bg-slate-800 transition-all flex items-center gap-3 text-xs cursor-pointer",
                loading && "opacity-50 cursor-not-allowed"
              )}
            >
              <Database className={cn("w-4 h-4 text-brand-red", loading && "animate-spin")} /> 
              {loading ? `Sedang Proses...` : 'Import Sampel'}
            </button>
            <button 
              onClick={() => {
                setEditingItem(null);
                resetForms();
                setShowModal(true);
              }}
              className="bg-brand-red text-white py-4 px-8 rounded-2xl font-black italic uppercase tracking-tighter shadow-xl shadow-red-900/20 hover:scale-105 transition-all flex items-center gap-3 cursor-pointer"
            >
              <Plus className="w-5 h-5" /> Tambah Data
            </button>
          </div>
        </header>

        {/* Tab Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
          <div className="flex gap-4">
            {[
              { id: 'personnel', name: 'Personil', icon: <Users className="w-4 h-4" /> },
              { id: 'squads', name: 'Regu', icon: <Truck className="w-4 h-4" /> },
              { id: 'sectors', name: 'Sektor', icon: <MapPin className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as MasterTab);
                  setFilterSectorId('');
                  setFilterSquadId('');
                }}
                className={cn(
                  "flex items-center gap-3 px-8 py-4 rounded-xl font-black italic uppercase tracking-tighter text-xs transition-all",
                  activeTab === tab.id 
                    ? "bg-slate-900 text-white shadow-xl" 
                    : "bg-white text-slate-400 hover:bg-slate-100"
                )}
              >
                {tab.icon} {tab.name}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            {(activeTab === 'personnel' || activeTab === 'squads') && (
              <div className="relative">
                <select 
                  value={filterSectorId}
                  onChange={(e) => {
                    setFilterSectorId(e.target.value);
                    setFilterSquadId('');
                  }}
                  className="bg-white border-2 border-slate-100 px-6 py-4 rounded-xl font-black italic uppercase tracking-tighter text-[10px] outline-none focus:border-brand-red appearance-none pr-12 min-w-[180px]"
                >
                  <option value="">Semua Sektor</option>
                  {sectors.map((s, idx) => <option key={`filter-sec-${s.id}-${idx}`} value={s.id}>{s.name}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-black tracking-tighter italic">▼</div>
              </div>
            )}
            {activeTab === 'personnel' && (
              <div className="relative">
                <select 
                  value={filterSquadId}
                  onChange={(e) => setFilterSquadId(e.target.value)}
                  className="bg-white border-2 border-slate-100 px-6 py-4 rounded-xl font-black italic uppercase tracking-tighter text-[10px] outline-none focus:border-brand-red appearance-none pr-12 min-w-[180px]"
                >
                  <option value="">Semua Regu</option>
                  {squads
                    .filter(s => !filterSectorId || s.sectorId === filterSectorId)
                    .map((s, idx) => <option key={`filter-sqd-${s.id}-${idx}`} value={s.id}>{s.name}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-black tracking-tighter italic">▼</div>
              </div>
            )}
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-white rounded-[2.5rem] border-4 border-slate-900 shadow-2xl overflow-hidden">
           {loading ? (
             <div className="p-20"><LoadingSpinner message="Sinkronisasi Database..." /></div>
           ) : (
             <div className="overflow-x-auto w-full">
               <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-900 text-white">
                     <tr>
                        {activeTab === 'personnel' && (<>
                          <th className="p-8 text-[10px] font-black uppercase tracking-widest">Nama / NRP</th>
                          <th className="p-8 text-[10px] font-black uppercase tracking-widest">Pangkat</th>
                          <th className="p-8 text-[10px] font-black uppercase tracking-widest">Penempatan</th>
                          <th className="p-8 text-[10px] font-black uppercase tracking-widest">Status</th>
                        </>)}
                        {activeTab === 'squads' && (<>
                          <th className="p-8 text-[10px] font-black uppercase tracking-widest">Nama Regu</th>
                          <th className="p-8 text-[10px] font-black uppercase tracking-widest">Komandan</th>
                          <th className="p-8 text-[10px] font-black uppercase tracking-widest">Sektor</th>
                        </>)}
                        {activeTab === 'sectors' && (<>
                          <th className="p-8 text-[10px] font-black uppercase tracking-widest">Nama Sektor</th>
                          <th className="p-8 text-[10px] font-black uppercase tracking-widest">Alamat Pos</th>
                        </>)}
                        <th className="p-8 text-[10px] font-black uppercase tracking-widest text-right">Aksi</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y-4 divide-slate-50">
                    {activeTab === 'personnel' && personnel
                      .filter(p => !filterSectorId || p.sectorId === filterSectorId)
                      .filter(p => !filterSquadId || p.squadId === filterSquadId)
                      .map((p, idx) => (
                        <tr key={`personnel-${p.id}-${idx}`} className="hover:bg-slate-55 transition-colors">
                          <td className="p-8">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-full border-2 border-slate-100 bg-slate-150 flex items-center justify-center font-black text-brand-red italic overflow-hidden shadow-sm shrink-0">
                                 {p.photoUrl ? (
                                   <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                 ) : (
                                   p.name ? p.name[0] : '?'
                                 )}
                               </div>
                               <div>
                                  <p className="font-black italic uppercase tracking-tighter text-slate-900">{p.name || 'UNKNOWN'}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.phoneNumber}</p>
                                </div>
                            </div>
                          </td>
                          <td className="p-8 font-bold text-slate-500 italic uppercase italic text-sm">{p.rank}</td>
                          <td className="p-8">
                            <p className="text-xs font-black uppercase italic text-slate-900 leading-none mb-1">{squads.find(s => s.id === p.squadId)?.name || 'N/A'}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{sectors.find(s => s.id === p.sectorId)?.name || 'N/A'}</p>
                          </td>
                          <td className="p-8">
                            <span className={cn("px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest", p.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600')}>
                               {p.status}
                            </span>
                          </td>
                          <td className="p-8 text-right">
                             <div className="flex justify-end gap-2">
                               <button onClick={() => { setEditingItem(p); setPersonnelForm(p); setShowModal(true); }} className="p-3 bg-slate-100 rounded-xl hover:bg-slate-900 hover:text-white transition-all"><Edit className="w-4 h-4" /></button>
                               <button onClick={() => handleDelete(p.id)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    {/* Similar mapping for squads and sectors */}
                    {activeTab === 'squads' && squads
                      .filter(s => !filterSectorId || s.sectorId === filterSectorId)
                      .map((s, idx) => (
                         <tr key={`squad-${s.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                            <td className="p-8 font-black italic uppercase tracking-tighter text-slate-900">{s.name}</td>
                            <td className="p-8 font-bold text-slate-500 italic uppercase italic text-sm">{personnel.find(p => p.id === s.commanderId)?.name || 'Belum Ditunjuk'}</td>
                            <td className="p-8 font-bold text-slate-500 italic uppercase italic text-sm">{sectors.find(sec => sec.id === s.sectorId)?.name || 'N/A'}</td>
                            <td className="p-8 text-right">
                               <div className="flex justify-end gap-2">
                                 <button onClick={() => { setEditingItem(s); setSquadForm(s); setShowModal(true); }} className="p-3 bg-slate-100 rounded-xl hover:bg-slate-900 hover:text-white transition-all"><Edit className="w-4 h-4" /></button>
                                 <button onClick={() => handleDelete(s.id)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                               </div>
                            </td>
                         </tr>
                      ))}
                    {activeTab === 'sectors' && sectors.map((sec, idx) => (
                       <tr key={`sector-${sec.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                          <td className="p-8 font-black italic uppercase tracking-tighter text-slate-900">{sec.name}</td>
                          <td className="p-8 font-bold text-slate-500 italic uppercase italic text-sm">{sec.address}</td>
                          <td className="p-8 text-right">
                             <div className="flex justify-end gap-2">
                               <button onClick={() => { setEditingItem(sec); setSectorForm(sec); setShowModal(true); }} className="p-3 bg-slate-100 rounded-xl hover:bg-slate-900 hover:text-white transition-all"><Edit className="w-4 h-4" /></button>
                               <button onClick={() => handleDelete(sec.id)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                             </div>
                          </td>
                       </tr>
                    ))}
                  </tbody>
               </table>
             </div>
           )}
         </div>

        {/* Modal Form */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.9, opacity: 0, y: 20 }} 
                className={cn(
                  "relative bg-white w-full rounded-[3rem] border-8 border-slate-900 shadow-2xl overflow-hidden flex flex-col transition-all duration-300",
                  activeTab === 'personnel' 
                    ? "max-w-4xl h-[92vh] max-h-[92vh]" 
                    : "max-w-2xl max-h-[90vh]"
                )}
              >
                <div className="p-6 md:p-10 border-b-4 border-slate-50 bg-slate-50/50 flex justify-between items-center shrink-0">
                   <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter leading-none">{editingItem ? 'Update' : 'Tambah'} Data {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h3>
                   <button onClick={() => setShowModal(false)} className="p-2 md:p-3 bg-white rounded-xl shadow-lg hover:bg-brand-red hover:text-white transition-all"><X className="w-5 h-5 md:w-6 md:h-6" /></button>
                </div>
                
                <form onSubmit={handleSave} className="p-6 md:p-10 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                   {activeTab === 'personnel' && (
                     <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2 space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Lengkap</label>
                           <input required value={personnelForm.name || ''} onChange={e => setPersonnelForm({...personnelForm, name: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pangkat</label>
                           <input required value={personnelForm.rank || ''} onChange={e => setPersonnelForm({...personnelForm, rank: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kontak Person</label>
                           <input required value={personnelForm.phoneNumber || ''} onChange={e => setPersonnelForm({...personnelForm, phoneNumber: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red" />
                        </div>
                        <div className="col-span-1 md:col-span-2 space-y-2">
                           <FileUpload
                              label="Upload Foto Profil (Opsional)"
                              allowedTypes={["image/*"]}
                              initialUrl={personnelForm.photoUrl}
                              onUploadSuccess={(url) => setPersonnelForm({ ...personnelForm, photoUrl: url })}
                            />
                           <input type="text" value={personnelForm.photoUrl || ''} onChange={e => setPersonnelForm({...personnelForm, photoUrl: e.target.value})} className="hidden" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sektor / Pos</label>
                           <select 
                             required
                             value={personnelForm.sectorId} 
                             onChange={e => {
                               setPersonnelForm({...personnelForm, sectorId: e.target.value, squadId: ''});
                             }} 
                             className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                           >
                              <option value="">Pilih Sektor</option>
                              {sectors.map((s, idx) => <option key={`form-sec-${s.id}-${idx}`} value={s.id}>{s.name}</option>)}
                               <option value="NEW_SECTOR" className="text-brand-red font-black">+ TAMBAH SEKTOR BARU...</option>
                           </select>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Regu Penempatan</label>
                           <select 
                             required={personnelForm.sectorId !== 'NEW_SECTOR'}
                             value={personnelForm.sectorId === 'NEW_SECTOR' ? 'NEW_SQUAD' : personnelForm.squadId} 
                             onChange={e => setPersonnelForm({...personnelForm, squadId: e.target.value})} 
                             disabled={!personnelForm.sectorId || personnelForm.sectorId === 'NEW_SECTOR'}
                             className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red disabled:opacity-50"
                           >
                              <option value="">Pilih Regu</option>
                              {squads
                                .filter(s => s.sectorId === personnelForm.sectorId)
                                .map((s, idx) => <option key={`form-sqd-${s.id}-${idx}`} value={s.id}>{s.name}</option>)}
                                   <option value="NEW_SQUAD" className="text-brand-red font-black font-semibold">+ TAMBAH REGU BARU...</option>
                           </select>
                        </div>
                        <div className="col-span-2 space-y-2">
{/* Form input tambahan jika sektor baru didefinisikan */}
                         {personnelForm.sectorId === 'NEW_SECTOR' && (
                           <div className="col-span-2 p-6 bg-slate-50 border-4 border-slate-900/10 rounded-[2rem] space-y-4">
                             <div className="flex items-center gap-2 text-brand-red font-black uppercase tracking-widest text-xs italic mb-2">
                               <MapPin className="w-4 h-4" /> Informasi Sektor / Pos Baru
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2 col-span-2 sm:col-span-1">
                                 <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Nama Sektor Baru *</label>
                                 <input 
                                   required 
                                   value={newSectorName} 
                                   onChange={e => setNewSectorName(e.target.value)} 
                                   placeholder="Contoh: SELATAN atau MALINAU BARAT"
                                   className="w-full bg-white border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red" 
                                 />
                               </div>
                               <div className="space-y-2 col-span-2 sm:col-span-1">
                                 <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Alamat Pos Sektor *</label>
                                 <input 
                                   required 
                                   value={newSectorAddress} 
                                   onChange={e => setNewSectorAddress(e.target.value)} 
                                   placeholder="Contoh: Jl. Poros Selatan KM 12"
                                   className="w-full bg-white border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red" 
                                 />
                               </div>
                             </div>
                           </div>
                         )}

                         {/* Form input tambahan jika regu baru didefinisikan */}
                         {(personnelForm.squadId === 'NEW_SQUAD' || personnelForm.sectorId === 'NEW_SECTOR') && (
                           <div className="col-span-2 p-6 bg-slate-50 border-4 border-slate-900/10 rounded-[2rem] space-y-4">
                             <div className="flex items-center gap-2 text-brand-red font-black uppercase tracking-widest text-xs italic mb-2">
                               <Truck className="w-4 h-4" /> Informasi Regu Baru
                             </div>
                             <div className="space-y-2">
                               <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Nama Regu Baru *</label>
                               <input 
                                 required 
                                 value={newSquadName} 
                                 onChange={e => setNewSquadName(e.target.value)} 
                                 placeholder="Contoh: REGU 13"
                                 className="w-full bg-white border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red" 
                               />
                             </div>
                           </div>
                         )}

                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jabatan / Role</label>
                           <div className="flex flex-wrap gap-3">
                              {[
                                { id: 'field_personnel', name: 'Anggota Lapangan' },
                                { id: 'officer', name: 'Komandan Regu (Danru)' },
                                { id: 'admin', name: 'Staf Administrasi' }
                              ].map(role => (
                                <button
                                  key={role.id}
                                  type="button"
                                  onClick={() => setPersonnelForm({
                                    ...personnelForm, 
                                    role: role.id as any,
                                    rank: role.id === 'officer' ? 'DANRU' : personnelForm.rank
                                  })}
                                  className={cn(
                                    "flex-1 py-3 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all border-2",
                                    personnelForm.role === role.id 
                                      ? "bg-brand-red border-brand-red text-white shadow-lg" 
                                      : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                                  )}
                                >
                                  {role.name}
                                </button>
                              ))}
                           </div>
                        </div>
                     </div>
                   )}

                   {activeTab === 'squads' && (
                     <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2 space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Regu</label>
                           <input required value={squadForm.name || ''} onChange={e => setSquadForm({...squadForm, name: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Komandan Regu</label>
                           <select value={squadForm.commanderId} onChange={e => setSquadForm({...squadForm, commanderId: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red">
                              <option value="">Pilih Personil</option>
                              {personnel.map((p, idx) => <option key={`form-psn-${p.id}-${idx}`} value={p.id}>{p.name}</option>)}
                           </select>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Penempatan Sektor</label>
                           <select value={squadForm.sectorId} onChange={e => setSquadForm({...squadForm, sectorId: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red">
                              <option value="">Pilih Sektor</option>
                              {sectors.map((s, idx) => <option key={`form-sqd-sec-${s.id}-${idx}`} value={s.id}>{s.name}</option>)}
                               <option value="NEW_SECTOR" className="text-brand-red font-black">+ TAMBAH SEKTOR BARU...</option>
                           </select>
                        </div>

                         {/* Form input tambahan jika sektor baru didefinisikan */}
                         {squadForm.sectorId === 'NEW_SECTOR' && (
                           <div className="col-span-2 p-6 bg-slate-50 border-4 border-slate-900/10 rounded-[2rem] space-y-4">
                             <div className="flex items-center gap-2 text-brand-red font-black uppercase tracking-widest text-xs italic mb-2">
                               <MapPin className="w-4 h-4" /> Informasi Sektor / Pos Baru
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2 col-span-2 sm:col-span-1">
                                 <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Nama Sektor Baru *</label>
                                 <input 
                                   required={activeTab === 'squads' && squadForm.sectorId === 'NEW_SECTOR'}
                                   value={newSectorName} 
                                   onChange={e => setNewSectorName(e.target.value)} 
                                   placeholder="Contoh: SELATAN atau MALINAU BARAT"
                                   className="w-full bg-white border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red" 
                                 />
                               </div>
                               <div className="space-y-2 col-span-2 sm:col-span-1">
                                 <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Alamat Pos Sektor *</label>
                                 <input 
                                   required={activeTab === 'squads' && squadForm.sectorId === 'NEW_SECTOR'}
                                   value={newSectorAddress} 
                                   onChange={e => setNewSectorAddress(e.target.value)} 
                                   placeholder="Contoh: Jl. Poros Selatan KM 12"
                                   className="w-full bg-white border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red" 
                                 />
                               </div>
                             </div>
                           </div>
                         )}
                     </div>
                   )}

                   {activeTab === 'sectors' && (
                     <div className="space-y-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Sektor / Pos</label>
                           <input required value={sectorForm.name || ''} onChange={e => setSectorForm({...sectorForm, name: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Alamat Pos</label>
                           <textarea required value={sectorForm.address} onChange={e => setSectorForm({...sectorForm, address: e.target.value})} rows={3} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red resize-none" />
                        </div>
                     </div>
                   )}

                   <div className="pt-8 flex gap-4">
                      <button type="submit" className="flex-1 bg-brand-red text-white py-5 rounded-2xl font-black italic uppercase tracking-tighter shadow-xl shadow-red-200 hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
                         <Save className="w-6 h-6" /> Simpan Data Master
                      </button>
                      <button type="button" onClick={() => setShowModal(false)} className="px-10 bg-slate-100 text-slate-400 font-black italic uppercase tracking-tighter rounded-2xl hover:bg-slate-200 transition-all">Batal</button>
                   </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Clear Confirmation Modal */}
        <AnimatePresence>
          {showClearConfirm && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowClearConfirm(false)} className="absolute inset-0 bg-red-950/90 backdrop-blur-md" />
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-md rounded-[2.5rem] border-8 border-slate-900 overflow-hidden text-center p-10">
                 <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-10 h-10 text-brand-red" />
                 </div>
                 <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-4 text-slate-900">Konfirmasi Hapus Total?</h3>
                 <p className="text-xs font-bold text-slate-500 mb-8 leading-relaxed uppercase italic">
                   Tindakan ini akan menghapus seluruh data Personil, Regu, Sektor, dan Laporan Operasional. <span className="text-brand-red">Data tidak dapat dipulihkan kembali.</span>
                 </p>
                 <div className="flex flex-col gap-3">
                   <button 
                     onClick={handleClearAllData}
                     className="w-full bg-brand-red text-white py-4 rounded-xl font-black italic uppercase tracking-tighter shadow-xl shadow-red-900/20 hover:bg-brand-dark transition-all"
                   >
                     MENGHAPUS SEMUA DATA
                   </button>
                   <button 
                     onClick={() => setShowClearConfirm(false)}
                     className="w-full bg-slate-100 text-slate-400 py-4 rounded-xl font-black italic uppercase tracking-tighter hover:bg-slate-200 transition-all font-bold"
                   >
                     BATALKAN TINDAKAN
                   </button>
                 </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Seed Confirmation Modal */}
        <AnimatePresence>
          {showSeedConfirm && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSeedConfirm(false)} className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" />
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-md rounded-[2.5rem] border-8 border-slate-900 overflow-hidden text-center p-10">
                 <div className="w-20 h-20 bg-brand-red/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Database className="w-10 h-10 text-brand-red" />
                 </div>
                 <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-4">Import Data Sampel?</h3>
                 <p className="text-sm font-bold text-slate-500 mb-8 leading-relaxed uppercase italic">
                   Ini akan menambahkan sektor induk, barat, utara, dan mentarang beserta regu dan personil sesuai spesifikasi ke database.
                 </p>
                 <div className="flex gap-4">
                   <button 
                     onClick={seedSampleData}
                     className="flex-1 bg-brand-red text-white py-4 rounded-xl font-black italic uppercase tracking-tighter shadow-xl shadow-red-900/20 hover:scale-[1.02] transition-all"
                   >
                     Ya, Import Sekarang
                   </button>
                   <button 
                     onClick={() => setShowSeedConfirm(false)}
                     className="flex-1 bg-slate-100 text-slate-400 py-4 rounded-xl font-black italic uppercase tracking-tighter hover:bg-slate-200"
                   >
                     Batal
                   </button>
                 </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
