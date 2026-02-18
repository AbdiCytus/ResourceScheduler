"use client";

import { useActionState } from "react";
import { submitSchedule } from "../../actions";

export default function BookingForm({
  resourceId,
  resourceName,
  resourceType,
  capacity,
  facilities,
}: {
  resourceId: string;
  resourceName: string;
  resourceType: string;
  capacity: number;
  facilities?: string[];
}) {
  const [state, formAction, isPending] = useActionState(submitSchedule, null);

  return (
    <form
      action={formAction}
      className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
    >
      <input type="hidden" name="resourceId" value={resourceId} />

      {state?.error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 m-6 mb-0 rounded-r-lg">
          <p className="text-sm font-bold text-red-800">{state.error}</p>
        </div>
      )}

      <div className="p-6 md:p-8 space-y-6">
        {/* [TAMPILKAN FASILITAS JIKA ROOM] */}
        {resourceType === "Room" && facilities && facilities.length > 0 && (
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-4">
            <h4 className="text-xs font-bold text-indigo-700 uppercase mb-2 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path d="M10 2a.75.75 0 01.75.75v5.59l2.685-2.685a.75.75 0 111.06 1.06l-4 4a.75.75 0 01-1.06 0l-4-4a.75.75 0 011.06-1.06L9.25 8.34V2.75A.75.75 0 0110 2z" />
              </svg>
              Fasilitas Ruangan:
            </h4>
            <div className="flex flex-wrap gap-2">
              {facilities.map((fac, idx) => (
                <span
                  key={idx}
                  className="bg-white text-indigo-600 px-3 py-1 rounded-full text-xs font-bold border border-indigo-200 shadow-sm"
                >
                  {fac}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Nama Kegiatan
            </label>
            <input
              type="text"
              name="title"
              required
              placeholder="Contoh: Pemakaian Harian"
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
              <option value="low">Low - Rutinitas</option>
              <option value="medium">Medium - Standar</option>
              <option value="high">High - Penting</option>
              <option value="critical">Critical - Darurat</option>
            </select>
          </div>
        </div>

        {/* [INPUT QUANTITY JIKA EQUIPMENT] */}
        {resourceType === "Equipment" && (
          <div className="bg-orange-50 p-5 rounded-xl border border-orange-100 flex flex-col gap-2">
            <label className="block text-xs font-bold text-orange-800 uppercase">
              Jumlah Unit Dipinjam (Stok Total: {capacity})
            </label>
            <div className="flex items-center gap-4">
              <input
                name="quantity"
                type="number"
                min="1"
                max={capacity}
                defaultValue="1"
                required
                className="w-24 rounded-xl border-orange-200 bg-white p-3 text-lg font-bold text-orange-900 focus:ring-2 focus:ring-orange-500 outline-none text-center"
              />
              <p className="text-xs text-orange-700 leading-tight flex-1">
                Anda bisa meminjam sebagian unit, sisa stok bisa dipinjam user
                lain di jam yang sama.
              </p>
            </div>
          </div>
        )}

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

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
            Deskripsi
          </label>
          <textarea
            name="description"
            rows={2}
            className="w-full rounded-xl border-slate-300 bg-slate-50 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          ></textarea>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95"
          >
            {isPending ? "Memproses Pengajuan..." : "Ajukan Jadwal"}
          </button>
        </div>
      </div>
    </form>
  );
}
