"use client";

import { useState, useActionState } from "react";
import { addBuildingClosure, deleteBuildingClosure } from "./actions";

type Closure = { id: string; date: string; reason: string | null; created_at: string };

export default function ClosuresClient({ initialClosures }: { initialClosures: Closure[] }) {
  const [closures, setClosures] = useState<Closure[]>(initialClosures);
  const [state, formAction, isPending] = useActionState(addBuildingClosure, null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, date: string) => {
    if (!confirm(`Hapus tanggal tutup ${date}?`)) return;
    setDeletingId(id);
    const res = await deleteBuildingClosure(id);
    setDeletingId(null);
    if (!res?.error) setClosures((prev) => prev.filter((c) => c.id !== id));
    else alert(res.error);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const today = new Date().toISOString().split("T")[0];

  // Pisahkan upcoming vs past
  const upcoming = closures.filter((c) => c.date >= today);
  const past = closures.filter((c) => c.date < today);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Manajemen Hari Tutup Gedung</h1>
        <p className="text-slate-500 mt-1">Daftar tanggal di mana Gedung H tidak beroperasi (libur, cuti bersama, dll.).</p>
      </div>

      {/* Form Tambah */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-bold text-slate-800 mb-4">Tambah Tanggal Tutup</h3>
        {state?.success && (
          <div className="mb-4 bg-emerald-50 border-l-4 border-emerald-500 p-3 rounded-r-lg text-sm font-bold text-emerald-800">✅ {state.success}</div>
        )}
        {state?.error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg text-sm font-bold text-red-800">⚠️ {state.error}</div>
        )}
        <form action={formAction} className="flex flex-col md:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tanggal Tutup</label>
            <input type="date" name="date" required min={today}
              className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Keterangan (opsional)</label>
            <input type="text" name="reason" placeholder="cth: Libur Nasional, Rapat Pimpinan..."
              className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <button type="submit" disabled={isPending}
            className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-indigo-700 transition text-sm disabled:opacity-50 whitespace-nowrap">
            {isPending ? "Menyimpan..." : "+ Tambah"}
          </button>
        </form>
      </div>

      {/* Upcoming Closures */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">🚫 Hari Tutup Mendatang</h3>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            {upcoming.length} tanggal
          </span>
        </div>
        {upcoming.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <p className="text-3xl mb-2">📅</p>
            <p className="text-sm">Belum ada tanggal tutup yang dijadwalkan.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {upcoming.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition">
                <div>
                  <p className="text-sm font-bold text-slate-800">{formatDate(c.date)}</p>
                  {c.reason && <p className="text-xs text-slate-500 mt-0.5">{c.reason}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded-lg">{c.date}</span>
                  <button onClick={() => handleDelete(c.id, c.date)} disabled={deletingId === c.id}
                    className="text-red-500 hover:bg-red-50 hover:text-red-700 p-1.5 rounded-lg transition disabled:opacity-50">
                    {deletingId === c.id ? "..." : "🗑️"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Closures */}
      {past.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden opacity-60">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-600 text-sm">📜 Riwayat Hari Tutup</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {past.slice(-5).reverse().map((c) => (
              <div key={c.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-xs font-bold text-slate-600">{formatDate(c.date)}</p>
                  {c.reason && <p className="text-[10px] text-slate-400">{c.reason}</p>}
                </div>
                <span className="text-[9px] text-slate-400">{c.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
