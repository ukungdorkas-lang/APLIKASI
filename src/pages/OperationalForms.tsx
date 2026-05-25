import React, { useState, useEffect } from "react";
import { db, auth } from '../lib/db';
import {
  collection,
  onSnapshot,
  query,
  addDoc,
  getDocs,
  orderBy,
  doc,
  getDoc,
  updateDoc
} from '@/src/lib/supabase-adapter';
import { Personnel, Squad, Sector, OperationalReport } from "../types";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  Flame,
  ShieldAlert,
  Calendar,
  MapPin,
  Users,
  Truck,
  Clock,
  Camera,
  Plus,
  Save,
  X,
  ChevronRight,
  Info,
} from "lucide-react";
import { cn } from "../lib/utils";
import { LoadingSpinner } from "../components/Loading";
import OperationalSidebar from "../components/OperationalSidebar";
import { FileUpload } from "../components/FileUpload";
import { useNavigate } from "react-router-dom";

export default function OperationalForms() {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState<
    "daily_piket" | "fire" | "rescue"
  >("daily_piket");
  const [loading, setLoading] = useState(true);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);

  const [form, setForm] = useState<Partial<OperationalReport>>({
    type: "daily_piket",
    date: Date.now(),
    piketAction: "datang",
    excludeFromRecap: false,
    sectorId: "",
    squadId: "",
    shift: "pagi",
    officerInChargeId: "",
    chronology: "",
    photos: [],
    location: { address: "", lat: 3.58, lng: 116.63 },
    attendance: [],
    details: {
      personnelCount: 0,
      unitsUsed: ["Unit Gajah 01"],
      victims: { deceased: 0, injured: 0, safe: 0 },
      startTime: Date.now(),
      endTime: Date.now() + 3600000,
      cause: "",
      objectType: "Rumah Tinggal",
      ownerName: "",
      estimatedLoss: 0,
      rescueType: "Animal Rescue",
    },
  });

  useEffect(() => {
    if (form.type === "daily_piket" && (form.squadId || form.sectorId)) {
      const filteredPersonnel = personnel
        .filter((p) => p.sectorId === form.sectorId)
        .filter((p) => !form.squadId || p.squadId === form.squadId);

      const attendanceList = filteredPersonnel.map((p) => ({
        personnelId: p.id,
        name: p.name,
        status: "hadir" as const,
        arrivalTime: form.shift === "pagi" ? "08:00" : "20:00",
        departureTime: form.shift === "pagi" ? "20:00" : "08:00",
        notes: "",
      }));

      setForm((prev) => ({
        ...prev,
        attendance: attendanceList,
        details: {
          ...prev.details!,
          personnelCount: attendanceList.length,
        },
      }));
    }
  }, [form.sectorId, form.squadId, form.type, personnel]);

  const handleAttendanceChange = (
    personnelId: string,
    status?: any,
    notes?: string,
    arrivalTime?: string,
    departureTime?: string,
  ) => {
    setForm((prev) => {
      const newAttendance = prev.attendance?.map((a) =>
        a.personnelId === personnelId
          ? {
              ...a,
              status: status !== undefined ? status : a.status,
              notes: notes !== undefined ? notes : a.notes,
              arrivalTime:
                arrivalTime !== undefined ? arrivalTime : a.arrivalTime,
              departureTime:
                departureTime !== undefined ? departureTime : a.departureTime,
            }
          : a,
      );

      const presentCount =
        newAttendance?.filter((a) => a.status === "hadir").length || 0;

      return {
        ...prev,
        attendance: newAttendance,
        details: {
          ...prev.details!,
          personnelCount: presentCount,
        },
      };
    });
  };

  useEffect(() => {
    async function fetchData() {
      const pSn = await getDocs(collection(db, "personnel"));
      const sSn = await getDocs(collection(db, "squads"));
      const secSn = await getDocs(collection(db, "sectors"));

      setPersonnel(
        pSn.docs.map((d) => ({ ...d.data(), id: d.id }) as Personnel),
      );
      setSquads(sSn.docs.map((d) => ({ ...d.data(), id: d.id }) as Squad));
      setSectors(secSn.docs.map((d) => ({ ...d.data(), id: d.id }) as Sector));
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleAddArmadaPiket = () => {
    setForm((prev) => ({
      ...prev,
      armadaPiket: [
        ...(prev.armadaPiket || []),
        { id: Date.now().toString(), nama: "", plat: "", status: "Siaga", peralatan: [] },
      ],
    }));
  };

  const handleUpdateArmadaPiket = (idx: number, field: string, value: any) => {
    setForm((prev) => {
      const newArmada = [...(prev.armadaPiket || [])];
      newArmada[idx] = { ...newArmada[idx], [field]: value };
      return { ...prev, armadaPiket: newArmada };
    });
  };

  const handleRemoveArmadaPiket = (idx: number) => {
    setForm((prev) => {
      const newArmada = [...(prev.armadaPiket || [])];
      newArmada.splice(idx, 1);
      return { ...prev, armadaPiket: newArmada };
    });
  };

  const handleAddPeralatan = (aIdx: number) => {
    setForm((prev) => {
      const newArmada = [...(prev.armadaPiket || [])];
      const newPeralatan = [...(newArmada[aIdx].peralatan || [])];
      newPeralatan.push({ nama: "", jumlah: 1, kondisi: "Baik" });
      newArmada[aIdx] = { ...newArmada[aIdx], peralatan: newPeralatan };
      return { ...prev, armadaPiket: newArmada };
    });
  };

  const handleUpdatePeralatan = (aIdx: number, pIdx: number, field: string, value: any) => {
    setForm((prev) => {
      const newArmada = [...(prev.armadaPiket || [])];
      const newPeralatan = [...(newArmada[aIdx].peralatan || [])];
      newPeralatan[pIdx] = { ...newPeralatan[pIdx], [field]: value };
      newArmada[aIdx] = { ...newArmada[aIdx], peralatan: newPeralatan };
      return { ...prev, armadaPiket: newArmada };
    });
  };

  const handleRemovePeralatan = (aIdx: number, pIdx: number) => {
    setForm((prev) => {
      const newArmada = [...(prev.armadaPiket || [])];
      const newPeralatan = [...(newArmada[aIdx].peralatan || [])];
      newPeralatan.splice(pIdx, 1);
      newArmada[aIdx] = { ...newArmada[aIdx], peralatan: newPeralatan };
      return { ...prev, armadaPiket: newArmada };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const reportNumber = `OPS-${reportType.toUpperCase()}-${Date.now().toString().slice(-6)}`;
      await addDoc(collection(db, "operational_reports"), {
        ...form,
        reportNumber,
        type: reportType,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // SYNC TO POSKO STATUS IF THIS IS PIKET DATANG
      if (reportType === "daily_piket" && form.piketAction === "datang" && form.sectorId) {
        const sector = sectors.find(s => s.id === form.sectorId);
        if (sector) {
          const docRef = doc(db, "settings", "status_posko");
          const snap = await getDoc(docRef);
          if (snap.exists()) {
             const data = snap.data().data || [];
             // Find index by posko name matching sector name roughly, or ID if matched.
             // We'll try to find by sector.name in namaPosko, or we add/update.
             let pIdx = data.findIndex((p: any) => p.namaPosko.toLowerCase().includes(sector.name.toLowerCase()) || (p.sectorId && p.sectorId === form.sectorId));
             
             const officer = personnel.find(p => p.name === form.officerInChargeId) || { name: form.officerInChargeId, rank: "" };
             const officerName = officer.rank ? `${officer.rank} ${officer.name}` : officer.name;
             
             const personilBertugas = form.attendance?.filter(a => a.status === "hadir").map(a => {
                const psnd = personnel.find(px => px.id === a.personnelId);
                let mappedPeran = "Anggota";
                if (psnd) {
                   if (psnd.role === "officer" || psnd.rank?.toUpperCase().includes("DANRU")) mappedPeran = "Danru";
                   else if (psnd.rank?.toUpperCase().includes("RESCUE")) mappedPeran = "Rescue";
                   else if (psnd.rank?.toUpperCase().includes("DRIVER")) mappedPeran = "Driver";
                }

                return {
                   id: a.personnelId,
                   nama: a.name,
                   peran: mappedPeran,
                   foto: psnd?.photoUrl || ""
                };
             }) || [];

             const armadaUpdate = form.armadaPiket?.map(a => ({
                 id: a.id,
                 nama: a.nama,
                 plat: a.plat,
                 status: a.status,
                 peralatan: a.peralatan || []
             })) || [];

             if (pIdx !== -1) {
                data[pIdx].danruSiaga = officerName;
                data[pIdx].personil = personilBertugas;
                data[pIdx].armada = armadaUpdate;
             } else {
                // If not found, just create a new one for this sector
                data.push({
                   id: "posko-" + form.sectorId,
                   sectorId: form.sectorId,
                   namaPosko: "POSKO " + sector.name.toUpperCase(),
                   danruSiaga: officerName,
                   personil: personilBertugas,
                   armada: armadaUpdate
                });
             }
             await updateDoc(docRef, { data });
          }
        }
      }

      alert("Laporan Operasional Berhasil Disimpan!");
      navigate("/staff/ops");
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  if (loading)
    return (
      <LoadingSpinner fullPage message="Menyiapkan Formulir Operasional..." />
    );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <OperationalSidebar />
      <main className="flex-1 ml-72 p-12">
        <header className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-6">
            <div
              className={cn(
                "w-16 h-16 rounded-[2rem] flex items-center justify-center text-white shadow-2xl",
                reportType === "fire"
                  ? "bg-brand-red"
                  : reportType === "rescue"
                    ? "bg-blue-600"
                    : "bg-slate-900",
              )}
            >
              {reportType === "fire" ? (
                <Flame className="w-8 h-8" />
              ) : reportType === "rescue" ? (
                <ShieldAlert className="w-8 h-8" />
              ) : (
                <Calendar className="w-8 h-8" />
              )}
            </div>
            <div>
              <h1 className="text-4xl font-display font-black text-slate-900 uppercase italic tracking-tighter italic">
                Input Laporan{" "}
                <span className="text-brand-red">Operasional</span>
              </h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2 italic">
                Format:{" "}
                {reportType === "fire"
                  ? "Laporan Kebakaran"
                  : reportType === "rescue"
                    ? "Laporan Penyelamatan"
                    : "Laporan Piket Harian"}
              </p>
            </div>
          </div>
        </header>

        {/* Type Selector */}
        <div className="flex gap-6 mb-12">
          {[
            {
              id: "daily_piket",
              name: "Laporan Piket",
              icon: <Calendar className="w-5 h-5" />,
              color: "bg-slate-900",
            },
            {
              id: "fire",
              name: "Laporan Kebakaran",
              icon: <Flame className="w-5 h-5" />,
              color: "bg-brand-red",
            },
            {
              id: "rescue",
              name: "Laporan Penyelamatan",
              icon: <ShieldAlert className="w-5 h-5" />,
              color: "bg-blue-600",
            },
          ].map((t) => (
            <button
              key={`type-${t.id}`}
              onClick={() => {
                setReportType(t.id as any);
                setForm((prev) => ({ ...prev, type: t.id as any }));
              }}
              className={cn(
                "flex-1 flex flex-col items-center gap-4 p-8 rounded-[2.5rem] border-4 transition-all hover:scale-105",
                reportType === t.id
                  ? `border-slate-900 ${t.color} text-white shadow-2xl`
                  : "bg-white border-slate-100 text-slate-400 hover:border-slate-300",
              )}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center bg-white/20 shadow-inner",
                )}
              >
                {t.icon}
              </div>
              <span className="text-sm font-black italic uppercase tracking-tighter italic">
                {t.name}
              </span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-2 gap-12">
          {/* Section 1: Basic Info */}
          <section className="bg-white p-12 rounded-[3.5rem] border-4 border-slate-900 shadow-2xl space-y-10">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none border-b-8 border-brand-red pb-4 inline-block italic">
              Data <span className="text-brand-red">Utama</span>
            </h3>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Pilih Sektor / Pos
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 w-5 h-5 text-brand-red" />
                  <select
                    required
                    value={form.sectorId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        sectorId: e.target.value,
                        squadId: "",
                        officerInChargeId: "",
                      })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 pl-12 rounded-2xl font-bold outline-none focus:border-brand-red appearance-none"
                  >
                    <option value="">Pilih Pos Siaga</option>
                    {sectors.map((s) => (
                      <option key={`ops-form-sec-${s.id}`} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Regu Siaga
                </label>
                <div className="relative">
                  <Truck className="absolute left-4 top-4 w-5 h-5 text-brand-red" />
                  <select
                    required
                    value={form.squadId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        squadId: e.target.value,
                        officerInChargeId: "",
                      })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 pl-12 rounded-2xl font-bold outline-none focus:border-brand-red appearance-none"
                  >
                    <option value="">Pilih Regu</option>
                    {squads
                      .filter((s) => s.sectorId === form.sectorId)
                      .map((s) => (
                        <option key={`ops-form-sqd-${s.id}`} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Petugas Penginput (NRP)
                </label>
                <div className="relative">
                  <Users className="absolute left-4 top-4 w-5 h-5 text-brand-red" />
                  <select
                    required
                    value={form.officerInChargeId}
                    onChange={(e) =>
                      setForm({ ...form, officerInChargeId: e.target.value })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 pl-12 rounded-2xl font-bold outline-none focus:border-brand-red appearance-none"
                  >
                    <option value="">Pilih Personil</option>
                    {personnel
                      .filter((p) => p.sectorId === form.sectorId)
                      .filter(
                        (p) => !form.squadId || p.squadId === form.squadId,
                      )
                      .map((p) => (
                        <option key={`ops-form-psn-${p.id}`} value={p.name}>
                          {p.name} - {p.rank}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {reportType === "daily_piket" && (
                <>
                  <div className="col-span-2 space-y-4 pt-4 border-t-2 border-slate-50">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Kategori Piket
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {(["datang", "pulang"] as const).map((action) => (
                        <button
                          key={action}
                          type="button"
                          onClick={() => setForm({ ...form, piketAction: action })}
                          className={cn(
                            "py-4 rounded-xl font-black uppercase tracking-tighter italic border-2 transition-all flex flex-col items-center gap-1",
                            form.piketAction === action
                              ? "bg-brand-red border-brand-red text-white shadow-xl"
                              : "bg-white border-slate-100 text-slate-400 hover:border-slate-300 shadow-sm",
                          )}
                        >
                          <span className="text-xs font-black italic">
                            Piket {action === "datang" ? "Datang" : "Pulang"}
                          </span>
                        </button>
                      ))}
                    </div>

                    {form.piketAction === "pulang" && (
                      <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border-2 border-slate-100 mt-2">
                        <input
                          type="checkbox"
                          id="includeInRecap"
                          checked={!form.excludeFromRecap}
                          onChange={(e) =>
                            setForm({ ...form, excludeFromRecap: !e.target.checked })
                          }
                          className="w-5 h-5 accent-brand-red"
                        />
                        <label
                          htmlFor="includeInRecap"
                          className="text-xs font-black uppercase italic tracking-tighter text-slate-600 cursor-pointer"
                        >
                          Masuk Rekapan Absensi
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="col-span-2 space-y-4 pt-4 border-t-2 border-slate-50">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Shift Penugasan
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {(["pagi", "malam"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setForm({ ...form, shift: s })}
                          className={cn(
                            "py-4 rounded-xl font-black uppercase tracking-tighter italic border-2 transition-all flex flex-col items-center gap-1",
                            form.shift === s
                              ? "bg-slate-900 border-slate-900 text-white shadow-xl"
                              : "bg-white border-slate-100 text-slate-400 hover:border-slate-300 shadow-sm",
                          )}
                        >
                          <span className="text-xs font-black italic">
                            Piket {s === "pagi" ? "Pagi" : "Malam"}
                          </span>
                          <span className="text-[9px] opacity-70 font-bold">
                            {s === "pagi" ? "08:00 - 20:00" : "20:00 - 08:00"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {reportType !== "daily_piket" && (
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Lokasi Kejadian
                  </label>
                  <input
                    required
                    value={form.location?.address}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        location: {
                          ...form.location!,
                          address: e.target.value,
                        },
                      })
                    }
                    placeholder="Masukan Alamat Lengkap..."
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold outline-none focus:border-brand-red"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Kronologi Kejadian / Giat
              </label>
              <textarea
                required
                value={form.chronology}
                onChange={(e) =>
                  setForm({ ...form, chronology: e.target.value })
                }
                rows={6}
                className="w-full bg-slate-50 border-2 border-slate-100 p-6 rounded-3xl font-medium italic outline-none focus:border-brand-red resize-none"
                placeholder="Tuliskan urutan kejadian secara mendetail..."
              />
            </div>

            {reportType === "daily_piket" &&
              form.attendance &&
              form.attendance.length > 0 && (
                <div className="space-y-6 pt-10 border-t-8 border-slate-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter italic">
                      Absensi{" "}
                      <span className="text-brand-red">Personil Piket</span>
                    </h3>
                    <div className="flex gap-4">
                      <div className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                        Hadir:{" "}
                        {
                          form.attendance.filter((a) => a.status === "hadir")
                            .length
                        }
                      </div>
                      <div className="px-4 py-2 bg-red-50 text-red-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                        Absen:{" "}
                        {
                          form.attendance.filter((a) => a.status !== "hadir")
                            .length
                        }
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {form.attendance.map((record) => (
                      <div
                        key={`attendance-${record.personnelId}`}
                        className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 flex flex-col gap-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-brand-dark flex items-center justify-center font-black italic text-brand-red text-xs">
                              {record.name[0]}
                            </div>
                            <span className="font-black uppercase italic tracking-tighter text-slate-900">
                              {record.name}
                            </span>
                          </div>
                          <select
                            value={record.status}
                            onChange={(e) =>
                              handleAttendanceChange(
                                record.personnelId,
                                e.target.value,
                              )
                            }
                            className={cn(
                              "text-[10px] font-black uppercase tracking-widest py-2 px-4 rounded-full border-2 outline-none",
                              record.status === "hadir"
                                ? "bg-green-500 text-white border-green-600"
                                : record.status === "alpha"
                                  ? "bg-red-500 text-white border-red-600"
                                  : "bg-amber-500 text-white border-amber-600",
                            )}
                          >
                            <option value="hadir">HADIR</option>
                            <option value="sakit">SAKIT</option>
                            <option value="ijin">IJIN</option>
                            <option value="alpha">ALPHA</option>
                            <option value="cuti">CUTI</option>
                            <option value="terlambat">TERLAMBAT</option>
                            <option value="cepat_pulang">CEPAT PULANG</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                              Jam Datang
                            </label>
                            <input
                              type="time"
                              value={record.arrivalTime}
                              onChange={(e) =>
                                handleAttendanceChange(
                                  record.personnelId,
                                  undefined,
                                  undefined,
                                  e.target.value,
                                )
                              }
                              className="w-full bg-white border-2 border-slate-200 p-2 rounded-xl text-xs font-bold font-italic outline-none focus:border-brand-red"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                              Jam Pulang
                            </label>
                            <input
                              type="time"
                              value={record.departureTime}
                              onChange={(e) =>
                                handleAttendanceChange(
                                  record.personnelId,
                                  undefined,
                                  undefined,
                                  undefined,
                                  e.target.value,
                                )
                              }
                              className="w-full bg-white border-2 border-slate-200 p-2 rounded-xl text-xs font-bold font-italic outline-none focus:border-brand-red"
                            />
                          </div>
                        </div>

                        {record.status !== "hadir" &&
                          record.status !== "ijin" && (
                            <input
                              placeholder="Keterangan / Alasan..."
                              value={record.notes}
                              onChange={(e) =>
                                handleAttendanceChange(
                                  record.personnelId,
                                  record.status,
                                  e.target.value,
                                )
                              }
                              className="w-full bg-white border-2 border-slate-200 p-3 rounded-xl text-xs font-bold font-italic outline-none focus:border-brand-red"
                            />
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Armada & Peralatan Section */}
            {reportType === "daily_piket" && form.piketAction === "datang" && (
                <div className="space-y-6 pt-10 border-t-8 border-slate-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter italic">
                      Armada & <span className="text-brand-red">Peralatan Siaga</span>
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddArmadaPiket}
                      className="text-xs font-black uppercase text-brand-red hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Tambah Armada
                    </button>
                  </div>

                  <div className="space-y-6">
                    {form.armadaPiket?.map((armada, aIdx) => (
                      <div key={armada.id} className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-200 shadow-sm relative">
                        <button
                           type="button"
                           onClick={() => handleRemoveArmadaPiket(aIdx)}
                           className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-brand-red text-white font-bold flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                        >
                           <X className="w-4 h-4" />
                        </button>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                           <div>
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Nama Armada</label>
                              <input type="text" value={armada.nama} onChange={(e) => handleUpdateArmadaPiket(aIdx, "nama", e.target.value)} className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold uppercase outline-none focus:border-brand-red" placeholder="Cth: Unit Gajah 01" />
                           </div>
                           <div>
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Plat Nomor</label>
                              <input type="text" value={armada.plat} onChange={(e) => handleUpdateArmadaPiket(aIdx, "plat", e.target.value)} className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold uppercase outline-none focus:border-brand-red" placeholder="Cth: KU 8000 M" />
                           </div>
                           <div>
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Status Unit</label>
                              <select value={armada.status} onChange={(e) => handleUpdateArmadaPiket(aIdx, "status", e.target.value)} className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold uppercase outline-none focus:border-brand-red">
                                 <option value="Siaga">SIAGA</option>
                                 <option value="Bertugas">BERTUGAS</option>
                                 <option value="Perawatan">PERAWATAN</option>
                              </select>
                           </div>
                        </div>

                        {/* Peralatan List */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                           <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Daftar Peralatan</span>
                              <button type="button" onClick={() => handleAddPeralatan(aIdx)} className="text-[9px] font-bold text-blue-600 hover:underline">+ Tambah Alat</button>
                           </div>
                           {(!armada.peralatan || armada.peralatan.length === 0) && (
                              <p className="text-xs text-slate-400 italic text-center py-2">Belum ada peralatan ditambahkan.</p>
                           )}
                           <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                              {armada.peralatan?.map((alat, pIdx) => (
                                 <div key={pIdx} className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    <div className="flex-1">
                                       <input type="text" value={alat.nama} onChange={(e) => handleUpdatePeralatan(aIdx, pIdx, "nama", e.target.value)} placeholder="Nama Alat..." className="w-full bg-transparent text-xs font-bold font-italic outline-none uppercase" />
                                    </div>
                                    <div className="w-16">
                                       <input type="number" min={1} value={alat.jumlah} onChange={(e) => handleUpdatePeralatan(aIdx, pIdx, "jumlah", parseInt(e.target.value) || 0)} className="w-full bg-white border border-slate-200 px-2 py-1 text-xs text-center rounded outline-none" />
                                    </div>
                                    <div className="w-24">
                                       <select value={alat.kondisi} onChange={(e) => handleUpdatePeralatan(aIdx, pIdx, "kondisi", e.target.value)} className="w-full bg-white border border-slate-200 px-1 py-1 text-[10px] font-bold rounded outline-none uppercase">
                                          <option value="Baik">Baik</option>
                                          <option value="Rusak Ringan">Rusak Ringan</option>
                                          <option value="Rusak Berat">Rusak Berat</option>
                                       </select>
                                    </div>
                                    <button type="button" onClick={() => handleRemovePeralatan(aIdx, pIdx)} className="text-brand-red hover:text-red-700 font-bold px-1">&times;</button>
                                 </div>
                              ))}
                           </div>
                        </div>
                      </div>
                    ))}
                    {(!form.armadaPiket || form.armadaPiket.length === 0) && (
                       <button type="button" onClick={handleAddArmadaPiket} className="w-full py-6 border-2 border-dashed border-slate-300 rounded-[2rem] text-slate-400 font-bold uppercase tracking-widest text-sm hover:border-brand-red hover:text-brand-red transition-colors flex items-center justify-center gap-2">
                          <Truck className="w-5 h-5" /> TAMBAHKAN ARMADA
                       </button>
                    )}
                  </div>
                </div>
            )}
            
          </section>

          {/* Section 2: Technical Details */}
          <section className="bg-white p-12 rounded-[3.5rem] border-4 border-slate-900 shadow-2xl space-y-10">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none border-b-8 border-brand-red pb-4 inline-block italic">
              Data <span className="text-brand-red">Teknis</span>
            </h3>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Jumlah Personil
                </label>
                <input
                  type="number"
                  value={form.details?.personnelCount}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      details: {
                        ...form.details!,
                        personnelCount: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Waktu Mulai Respon
                </label>
                <input
                  type="time"
                  onChange={(e) => {
                    const [h, m] = e.target.value.split(":");
                    const d = new Date(form.date!);
                    d.setHours(parseInt(h), parseInt(m));
                    setForm({
                      ...form,
                      details: { ...form.details!, startTime: d.getTime() },
                    });
                  }}
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                />
              </div>
            </div>

            {reportType === "fire" && (
              <div className="grid grid-cols-2 gap-8 pt-8 border-t-2 border-slate-50">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Penyebab (Dugaan)
                  </label>
                  <input
                    value={form.details?.cause}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        details: { ...form.details!, cause: e.target.value },
                      })
                    }
                    placeholder="e.g. Kosleting Listrik"
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Objek Terbakar
                  </label>
                  <input
                    value={form.details?.objectType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        details: {
                          ...form.details!,
                          objectType: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g. Bangunan Kayu"
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Nama Pemilik
                  </label>
                  <input
                    value={form.details?.ownerName}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        details: {
                          ...form.details!,
                          ownerName: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Taksiran Kerugian (Rp)
                  </label>
                  <input
                    type="number"
                    value={form.details?.estimatedLoss}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        details: {
                          ...form.details!,
                          estimatedLoss: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                  />
                </div>
              </div>
            )}

            {reportType === "rescue" && (
              <div className="space-y-2 pt-8 border-t-2 border-slate-50">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Jenis Penyelamatan
                </label>
                <select
                  value={form.details?.rescueType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      details: { ...form.details!, rescueType: e.target.value },
                    })
                  }
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold outline-none focus:border-brand-red"
                >
                  <option value="Animal Rescue">
                    Animal Rescue (Ular / Tawon)
                  </option>
                  <option value="Evakuasi Korban">Evakuasi Korban / SAR</option>
                  <option value="Alat Berat">Perbantuan Alat Berat</option>
                  <option value="Pohon Tumbang">Pohon Tumbang</option>
                </select>
              </div>
            )}

            <div className="pt-8 border-t-2 border-slate-50 space-y-6">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Dokumentasi Foto Lapangan
              </label>
              <div className="grid grid-cols-2 gap-4">
                <FileUpload
                  label="Unggah Foto (Maks 10)"
                  onUploadSuccess={(url) =>
                    setForm((prev) => ({
                      ...prev,
                      photos: [...prev.photos!, url],
                    }))
                  }
                />
                <div className="flex flex-wrap gap-2">
                  {form.photos?.map((p, i) => (
                    <div
                      key={`ops-form-photo-${i}`}
                      className="w-16 h-16 rounded-lg overflow-hidden border-2 border-slate-200 relative group"
                    >
                      <img src={p} className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setForm((prev) => ({
                            ...prev,
                            photos: prev.photos!.filter((_, idx) => idx !== i),
                          }));
                        }}
                        className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-10">
              <button
                type="submit"
                className="w-full bg-brand-red text-white py-6 rounded-3xl font-black italic uppercase tracking-tighter shadow-2xl shadow-red-200 hover:scale-[1.02] transition-all flex items-center justify-center gap-4"
              >
                <Save className="w-6 h-6" /> Terbitkan Laporan Operasional
              </button>
            </div>
          </section>
        </form>
      </main>
    </div>
  );
}
