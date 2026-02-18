"use client";

import { useActionState, useState } from "react";
import { submitSchedule } from "../../actions";

// [BARU] Prop equipmentList
export default function BookingForm({
  resourceId,
  resourceName,
  currentVersion,
  equipmentList,
}: {
  resourceId: string;
  resourceName: string;
  currentVersion: number;
  equipmentList: any[];
}) {
  const [state, formAction, isPending] = useActionState(submitSchedule, null);

  // State untuk kalkulasi jam (Opsional, untuk UX lebih baik bisa ditambah di sini)

  return (
    <form
      action={formAction}
      className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
    >
      {/* Hidden Fields */}
      <input type="hidden" name="resourceId" value={resourceId} />
      <input type="hidden" name="expectedVersion" value={currentVersion} />

      {/* ERROR MESSAGE (Smart Recommendation muncul di sini) */}
      {state?.error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 m-6 mb-0 rounded-r-lg animate-pulse">
          <div className="flex">
            <div className="flex-shrink-0 text-red-500">⚠️</div>
            <div className="ml-3">
              <h3 className="text-sm font-bold text-red-800">Booking Gagal</h3>
              <div className="mt-1 text-sm text-red-700 whitespace-pre-wrap font-medium">
                {state.error}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 md:p-8 space-y-6">
        {/* Row 1: Judul & Urgensi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Nama Kegiatan
            </label>
            <input
              name="title"
              required
              placeholder="Contoh: Rapat Koordinasi Q1"
              className="w-full rounded-xl border-slate-300 bg-slate-50 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Tingkat Urgensi
            </label>
            <select
              name="urgency"
              required
              className="w-full rounded-xl border-slate-300 bg-slate-50 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">-- Pilih Urgensi --</option>
              <option value="low">Low - Rutinitas (Score +10)</option>
              <option value="medium">Medium - Standar (Score +20)</option>
              <option value="high">High - Penting (Score +30)</option>
              <option value="critical">Critical - Darurat (Score +40)</option>
            </select>
            <p className="text-[10px] text-slate-400 mt-1">
              Urgensi menentukan prioritas jika terjadi bentrok.
            </p>
          </div>
        </div>

        {/* Row 2: Waktu */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Tanggal
            </label>
            <input
              name="date"
              type="date"
              required
              className="w-full rounded-xl border-slate-300 bg-slate-50 p-3 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Jam Mulai
            </label>
            <input
              name="startTime"
              type="time"
              required
              className="w-full rounded-xl border-slate-300 bg-slate-50 p-3 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Jam Selesai
            </label>
            <input
              name="endTime"
              type="time"
              required
              className="w-full rounded-xl border-slate-300 bg-slate-50 p-3 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* [BARU] Row 3: Resource Bundling (Tambahan Alat) */}
        {equipmentList && equipmentList.length > 0 && (
          <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
            <label className="block text-xs font-bold text-indigo-700 uppercase mb-3 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
              </svg>
              Tambahkan Alat (Resource Bundling)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {equipmentList.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    name="bundledResources"
                    value={item.id}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-indigo-700 transition-colors">
                    {item.name}{" "}
                    <span className="text-[10px] text-slate-400">
                      ({item.capacity} Unit)
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <p className="text-[10px] text-indigo-400 mt-2">
              *Sistem akan mengecek ketersediaan alat ini pada jam yang sama.
            </p>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
            Deskripsi (Opsional)
          </label>
          <textarea
            name="description"
            rows={3}
            placeholder="Detail tambahan kegiatan..."
            className="w-full rounded-xl border-slate-300 bg-slate-50 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          ></textarea>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isPending ? "Memproses Jadwal..." : "Ajukan Jadwal Sekarang"}
          </button>
        </div>
      </div>
    </form>
  );
}
