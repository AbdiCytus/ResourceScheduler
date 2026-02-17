"use client";

import { useActionState } from "react";
import { submitSchedule } from "../../actions";

const initialState = {
  error: "",
};

export default function BookingForm({
  resourceId,
  resourceName,
  currentVersion,
}: {
  resourceId: string;
  resourceName: string;
  currentVersion: number;
}) {
  const [state, formAction, isPending] = useActionState(
    submitSchedule,
    initialState
  );

  // Class styling input yang dipertegas bordernya
  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm placeholder:text-slate-400";

  return (
    <form
      action={formAction}
      className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
    >
      <input type="hidden" name="resourceId" value={resourceId} />
      <input type="hidden" name="expectedVersion" value={currentVersion || 1} />

      {state?.error && (
        <div className="bg-red-50 text-red-700 px-6 py-4 text-sm border-b border-red-100 flex items-start gap-3 animate-pulse">
          <span className="text-lg">⚠️</span>
          <p>{state.error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* KOLOM KIRI */}
        <div className="p-6 lg:p-8 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-1">
            Detail Kegiatan
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            Informasi dasar mengenai peminjaman.
          </p>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Judul Kegiatan
              </label>
              {/* Tambahkan inputClass disini */}
              <input
                name="title"
                required
                placeholder="Contoh: Rapat Mingguan Tim IT"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Tingkat Urgensi
              </label>
              <div className="relative">
                {/* Tambahkan inputClass disini */}
                <select
                  name="urgency"
                  className={`${inputClass} appearance-none`}
                >
                  <option value="low">☕ Low (Rutin/Biasa)</option>
                  <option value="medium">🚩 Medium (Penting)</option>
                  <option value="high">🔥 High (Mendesak)</option>
                  <option value="critical">🚨 Critical (Darurat/VIP)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                  ▼
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">
                *Semakin tinggi urgensi, semakin besar skor prioritas.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Deskripsi Tambahan
              </label>
              {/* Tambahkan inputClass disini */}
              <textarea
                name="description"
                rows={4}
                className={inputClass}
                placeholder="Catatan tambahan..."
              ></textarea>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN */}
        <div className="p-6 lg:p-8 flex flex-col justify-between h-full bg-white">
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">
              Waktu Peminjaman
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              Tentukan jadwal pelaksanaan.
            </p>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Tanggal
                </label>
                {/* Tambahkan inputClass disini */}
                <input
                  name="date"
                  type="date"
                  required
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Jam Mulai
                  </label>
                  {/* Tambahkan inputClass disini */}
                  <input
                    name="startTime"
                    type="time"
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Jam Selesai
                  </label>
                  {/* Tambahkan inputClass disini */}
                  <input
                    name="endTime"
                    type="time"
                    required
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 lg:mt-0 pt-8 border-t border-slate-100">
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isPending ? "Memproses..." : "Kirim Pengajuan Jadwal"}
            </button>
            <a
              href="/portal"
              className="block text-center text-sm text-slate-400 mt-4 hover:text-slate-600 transition-colors"
            >
              Batal
            </a>
          </div>
        </div>
      </div>
    </form>
  );
}
