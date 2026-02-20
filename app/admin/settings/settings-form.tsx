"use client";

import { useActionState } from "react";
import { updateSettings } from "./actions";

export default function SettingsForm({
  initialSettings,
}: {
  initialSettings: Record<string, string>;
}) {
  const [state, formAction, isPending] = useActionState(updateSettings, null);

  return (
    <form
      action={formAction}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
    >
      {state?.success && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 m-6 mb-0 rounded-r-lg flex items-center gap-3">
          <span className="text-emerald-600">✅</span>
          <p className="text-sm font-bold text-emerald-800">{state.success}</p>
        </div>
      )}

      {state?.error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 m-6 mb-0 rounded-r-lg flex items-center gap-3">
          <span className="text-red-600">⚠️</span>
          <p className="text-sm font-bold text-red-800">{state.error}</p>
        </div>
      )}

      <div className="p-6 md:p-8 space-y-8">
        {/* --- SECTION 1: JAM OPERASIONAL --- */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">
            Jam Operasional
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Jam Buka
              </label>
              <input
                type="time"
                name="operational_start"
                defaultValue={initialSettings["operational_start"] || "08:00"}
                className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Jam Tutup
              </label>
              <input
                type="time"
                name="operational_end"
                defaultValue={initialSettings["operational_end"] || "17:00"}
                className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>
        </div>

        {/* --- SECTION 2: ATURAN BOOKING --- */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">
            Aturan Peminjaman
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Maksimal Durasi (Jam)
              </label>
              <input
                type="number"
                name="max_booking_duration"
                defaultValue={initialSettings["max_booking_duration"] || "4"}
                className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Maks H- Hari Booking
              </label>
              <input
                type="number"
                name="max_advance_days"
                defaultValue={initialSettings["max_advance_days"] || "14"}
                className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Min. Waktu Pengajuan (Menit)
              </label>
              <input
                type="number"
                name="min_booking_notice"
                defaultValue={initialSettings["min_booking_notice"] || "30"}
                className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>
        </div>

        {/* --- SECTION 3: SKOR PRIORITAS (BARU) --- */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
            🏆 Bobot & Skor Prioritas
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Skor menentukan siapa yang menang saat terjadi perebutan jadwal
            (Preemption).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Input Bobot Role */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <h4 className="text-sm font-bold text-slate-700 mb-3">
                Bobot Role Pengguna
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500">
                    Admin
                  </label>
                  <input
                    type="number"
                    name="role_weight_admin"
                    defaultValue={initialSettings["role_weight_admin"] || "30"}
                    className="w-24 rounded-lg border-slate-200 p-2 text-sm text-center font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500">
                    Supervisor
                  </label>
                  <input
                    type="number"
                    name="role_weight_supervisor"
                    defaultValue={
                      initialSettings["role_weight_supervisor"] || "25"
                    }
                    className="w-24 rounded-lg border-slate-200 p-2 text-sm text-center font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500">
                    User
                  </label>
                  <input
                    type="number"
                    name="role_weight_user"
                    defaultValue={initialSettings["role_weight_user"] || "20"}
                    className="w-24 rounded-lg border-slate-200 p-2 text-sm text-center font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Read-only Urgensi */}
            <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
              <h4 className="text-sm font-bold text-indigo-900 mb-3">
                Bobot Tingkat Urgensi (Sistem)
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white px-4 py-2 rounded-lg border border-indigo-50">
                  <span className="text-xs font-bold text-slate-500">
                    Low (Biasa)
                  </span>
                  <span className="text-xs font-black text-slate-400">
                    10 PTS
                  </span>
                </div>
                <div className="flex items-center justify-between bg-white px-4 py-2 rounded-lg border border-indigo-50">
                  <span className="text-xs font-bold text-amber-600">
                    Medium (Penting)
                  </span>
                  <span className="text-xs font-black text-amber-500">
                    30 PTS
                  </span>
                </div>
                <div className="flex items-center justify-between bg-white px-4 py-2 rounded-lg border border-indigo-50">
                  <span className="text-xs font-bold text-red-600">
                    High (Mendesak)
                  </span>
                  <span className="text-xs font-black text-red-500">
                    60 PTS
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-indigo-500 mt-3 font-medium">
                *Skor akhir adalah gabungan Role + Urgensi.
              </p>
            </div>
          </div>
        </div>

        {/* --- SECTION 4: MAINTENANCE --- */}
        <div>
          <h3 className="text-lg font-bold text-red-600 mb-4 border-b border-red-100 pb-2">
            Zona Berbahaya
          </h3>
          <div className="bg-red-50 border border-red-100 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <h4 className="font-bold text-red-800 text-sm">
                Mode Maintenance
              </h4>
              <p className="text-xs text-red-600 mt-1">
                Jika diaktifkan, user tidak bisa melakukan booking sama sekali.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="is_maintenance"
                defaultChecked={initialSettings["is_maintenance"] === "true"}
                value="true"
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-red-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
        <button
          disabled={isPending}
          type="submit"
          className="bg-slate-900 text-white font-bold py-3 px-8 rounded-xl hover:bg-slate-800 transition shadow-sm disabled:opacity-50"
        >
          {isPending ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </div>
    </form>
  );
}
