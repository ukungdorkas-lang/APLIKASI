import React, { useState, useEffect } from "react";
import { useNotifications } from "../hooks/useNotifications";
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, onSnapshot, setDoc } from 'firebase/firestore';
import {
  Plus,
  Trash2,
  Edit,
  Bell,
  MessageSquare,
  Mail,
  Smartphone,
  CheckCircle,
  XCircle,
  Loader2,
  Filter,
  History,
  Phone,
  Settings2,
  Power,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { IncidentType, NotificationRecipient, AppConfig } from "../types";

export default function NotificationManagement() {
  const {
    recipients,
    logs,
    loading,
    addRecipient,
    updateRecipient,
    deleteRecipient,
  } = useNotifications();
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"recipients" | "logs">(
    "recipients",
  );

  const [isNotifEnabled, setIsNotifEnabled] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "app"), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as AppConfig;
        setIsNotifEnabled(data.notificationsEnabled !== false);
      }
    });
    return () => unsub();
  }, []);

  const toggleGlobalNotification = async () => {
    const docRef = doc(db, "settings", "app");
    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await updateDoc(docRef, { notificationsEnabled: !isNotifEnabled });
      } else {
        await setDoc(docRef, { notificationsEnabled: !isNotifEnabled });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const [newRecipient, setNewRecipient] = useState<
    Omit<NotificationRecipient, "id" | "createdAt">
  >({
    name: "",
    phoneNumber: "",
    email: "",
    divisi: "Operator",
    isActive: true,
    categories: ["Kebakaran"],
    channels: ["whatsapp", "sms"],
  });

  const incidentTypes: IncidentType[] = [
    "Kebakaran",
    "Evakuasi",
    "Penyelamatan",
    "Pohon Tumbang",
    "Hewan Berbahaya",
    "Banjir",
    "Lainnya",
  ];
  const channels = ["whatsapp", "sms", "push", "email"] as const;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addRecipient(newRecipient);
    setShowAddModal(false);
    setNewRecipient({
      name: "",
      phoneNumber: "",
      email: "",
      divisi: "Operator",
      isActive: true,
      categories: ["Kebakaran"],
      channels: ["whatsapp", "sms"],
    });
  };

  const toggleCategory = (cat: IncidentType) => {
    setNewRecipient((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const toggleChannel = (ch: (typeof channels)[number]) => {
    setNewRecipient((prev) => ({
      ...prev,
      channels: prev.channels.includes(ch)
        ? prev.channels.filter((c) => c !== ch)
        : [...prev.channels, ch],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Sub Navigation */}
      <div className="flex gap-4">
        <button
          onClick={() => setActiveSubTab("recipients")}
          className={cn(
            "px-8 py-3 rounded-xl tag-label transition-all flex items-center gap-2",
            activeSubTab === "recipients"
              ? "bg-slate-900 text-white shadow-xl shadow-slate-200"
              : "bg-white text-slate-400",
          )}
        >
          <UsersIcon className="w-4 h-4" /> Daftar Penerima
        </button>
        <button
          onClick={() => setActiveSubTab("logs")}
          className={cn(
            "px-8 py-3 rounded-xl tag-label transition-all flex items-center gap-2",
            activeSubTab === "logs"
              ? "bg-slate-900 text-white shadow-xl shadow-slate-200"
              : "bg-white text-slate-400",
          )}
        >
          <History className="w-4 h-4" /> Riwayat Notifikasi
        </button>
      </div>

      {activeSubTab === "recipients" ? (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-3xl heading-bold text-brand-dark">
                Penerima <span className="text-brand-red">Terdaftar</span>
              </h3>
              <p className="tag-label text-slate-400">
                Pemberitahuan otomatis akan dikirim ke nomor ini
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleGlobalNotification}
                className={cn(
                  "px-6 py-4 rounded-xl heading-bold text-sm shadow-xl transition-all flex items-center gap-3",
                  isNotifEnabled
                    ? "bg-emerald-500 text-white shadow-emerald-200"
                    : "bg-slate-300 text-slate-600 shadow-slate-200",
                )}
              >
                <Power className="w-5 h-5" />
                {isNotifEnabled ? "NOTIFIKASI AKTIF" : "NOTIFIKASI NONAKTIF"}
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-4 bg-brand-red text-white flex items-center gap-3 rounded-xl heading-bold text-sm shadow-xl shadow-rose-200 hover:scale-105 transition-all"
              >
                <Plus className="w-5 h-5" /> TAMBAH NOMOR
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recipients.map((recipient) => (
              <motion.div
                layout
                key={recipient.id}
                className="bg-white p-8 rounded-[2rem] border-4 border-slate-900 shadow-2xl relative group overflow-hidden"
              >
                {!recipient.isActive && (
                  <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-[2px] z-10 flex items-center justify-center">
                    <span className="px-6 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                      NONAKTIF
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-start mb-6 relative z-20">
                  <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center font-black text-white italic text-xl shadow-lg">
                    {recipient.name?.[0] || "?"}
                  </div>
                  <div className="flex gap-2 bg-white/50 p-1 rounded-xl backdrop-blur-sm">
                    <button
                      onClick={() =>
                        updateRecipient(recipient.id, {
                          isActive: !recipient.isActive,
                        })
                      }
                      className={cn(
                        "px-4 py-2 rounded-lg transition-all font-bold text-xs flex items-center gap-2",
                        recipient.isActive
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-slate-800 text-white hover:bg-slate-700",
                      )}
                    >
                      <Power className="w-4 h-4" />
                      {recipient.isActive ? "AKTIF" : "NONAKTIF"}
                    </button>
                    <button
                      onClick={() => deleteRecipient(recipient.id)}
                      className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-all bg-white"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-xl heading-bold leading-none mb-1">
                  {recipient.name}
                </h4>
                <p className="text-[10px] font-black text-brand-red uppercase tracking-widest mb-4 italic">
                  {recipient.divisi}
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-slate-500">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm font-bold">
                      {recipient.phoneNumber}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {recipient.channels.map((ch) => (
                      <span
                        key={ch}
                        className="w-8 h-8 rounded-lg bg-slate-50 border-2 border-slate-100 flex items-center justify-center text-slate-400"
                      >
                        {ch === "whatsapp" && (
                          <MessageSquare className="w-4 h-4" />
                        )}
                        {ch === "sms" && <Smartphone className="w-4 h-4" />}
                        {ch === "push" && <Bell className="w-4 h-4" />}
                        {ch === "email" && <Mail className="w-4 h-4" />}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-6 border-t-2 border-slate-50">
                  {recipient.categories.map((cat) => (
                    <span
                      key={cat}
                      className="text-[8px] font-black uppercase tracking-widest bg-slate-900 text-white px-2 py-1 rounded"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border-4 border-slate-900 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b-4 border-slate-100">
                <tr>
                  <th className="p-8 tag-label text-slate-400">Waktu</th>
                  <th className="p-8 tag-label text-slate-400">Penerima</th>
                  <th className="p-8 tag-label text-slate-400">Channel</th>
                  <th className="p-8 tag-label text-slate-400">Status</th>
                  <th className="p-8 tag-label text-slate-400">Pesan</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-50">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-8 text-xs font-bold text-slate-400">
                      {new Date(log.timestamp).toLocaleString("id-ID")}
                    </td>
                    <td className="p-8">
                      <p className="font-black italic uppercase tracking-tighter">
                        {log.recipientName}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400">
                        {log.phoneNumber}
                      </p>
                    </td>
                    <td className="p-8">
                      <span className="flex items-center gap-2 tag-label text-[10px]">
                        {log.channel === "whatsapp" && (
                          <MessageSquare className="w-3 h-3 text-green-500" />
                        )}
                        {log.channel === "sms" && (
                          <Smartphone className="w-3 h-3 text-blue-500" />
                        )}
                        {log.channel.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-8">
                      {log.status === "sent" || log.status === "delivered" ? (
                        <span className="flex items-center gap-1 text-green-500 font-black text-[10px] uppercase">
                          <CheckCircle className="w-3 h-3" /> Berhasil
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-500 font-black text-[10px] uppercase">
                          <XCircle className="w-3 h-3" /> Gagal
                        </span>
                      )}
                    </td>
                    <td className="p-8 max-w-xs">
                      <p className="text-[10px] font-bold text-slate-500 line-clamp-1 italic">
                        "{log.messageContent}"
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {logs.length === 0 && (
            <div className="p-20 text-center text-slate-300 font-black italic uppercase tracking-[0.3em]">
              TIDAK ADA RIWAYAT PENGIRIMAN
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pb-20">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] border-8 border-slate-900 shadow-2xl relative z-60 overflow-hidden"
            >
              <form onSubmit={handleSubmit} className="p-12 space-y-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-brand-red rounded-xl flex items-center justify-center">
                    <Plus className="text-white w-6 h-6" />
                  </div>
                  <h3 className="text-3xl heading-bold text-brand-dark uppercase tracking-tighter italic">
                    Penerima Baru
                  </h3>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="tag-label text-slate-500 mb-2 block">
                        Nama Lengkap
                      </label>
                      <input
                        required
                        className="w-full bg-slate-50 border-4 border-slate-100 rounded-2xl p-4 font-black outline-none focus:border-brand-red"
                        value={newRecipient.name}
                        onChange={(e) =>
                          setNewRecipient({
                            ...newRecipient,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="tag-label text-slate-500 mb-2 block">
                        Nomor HP / WhatsApp
                      </label>
                      <input
                        required
                        type="tel"
                        className="w-full bg-slate-50 border-4 border-slate-100 rounded-2xl p-4 font-black outline-none focus:border-brand-red"
                        value={newRecipient.phoneNumber}
                        onChange={(e) =>
                          setNewRecipient({
                            ...newRecipient,
                            phoneNumber: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="tag-label text-slate-500 mb-2 block">
                        Divisi / Jabatan
                      </label>
                      <select
                        className="w-full bg-slate-50 border-4 border-slate-100 rounded-2xl p-4 font-black outline-none focus:border-brand-red"
                        value={newRecipient.divisi}
                        onChange={(e) =>
                          setNewRecipient({
                            ...newRecipient,
                            divisi: e.target.value,
                          })
                        }
                      >
                        <option>Kepala Dinas</option>
                        <option>Komandan Regu</option>
                        <option>Operator</option>
                        <option>Petugas Lapangan</option>
                        <option>Relawan</option>
                        <option>Instansi Luar (PLN/RS/POLRI)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="tag-label text-slate-500 mb-2 block">
                        Channel Notifikasi
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {channels.map((ch) => (
                          <button
                            key={ch}
                            type="button"
                            onClick={() => toggleChannel(ch)}
                            className={cn(
                              "px-4 py-2 rounded-lg tag-label text-[10px] border-2 transition-all",
                              newRecipient.channels.includes(ch)
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-white text-slate-400 border-slate-100",
                            )}
                          >
                            {ch.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="tag-label text-slate-500 mb-2 block">
                        Kategori Kejadian
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {incidentTypes.map((it) => (
                          <button
                            key={it}
                            type="button"
                            onClick={() => toggleCategory(it)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border-2 transition-all",
                              newRecipient.categories.includes(it)
                                ? "bg-brand-red text-white border-brand-red"
                                : "bg-white text-slate-400 border-slate-100",
                            )}
                          >
                            {it}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-4 bg-slate-100 rounded-2xl heading-bold text-slate-400 hover:bg-slate-200 transition-all uppercase"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-brand-red text-white rounded-2xl heading-bold shadow-xl shadow-rose-200 hover:scale-105 transition-all uppercase"
                  >
                    Simpan Penerima
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
