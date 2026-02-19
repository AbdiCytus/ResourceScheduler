"use client";

import { useState } from "react";
import { updateSystemSettings } from "./actions";

export default function SettingsForm({
  settings,
}: {
  settings: Record<string, string>;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Default value jika belum ada di DB adalah '30'
  const currentMinNotice = settings["min_booking_notice"] || "30";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMsg(null);

    const formData = new FormData(e.currentTarget);
    const result = await updateSystemSettings(formData);

    setIsLoading(false);
    if (result.error) {
      setMsg({ type: "error", text: result.error });
    } else {
      setMsg({ type: "success", text: result.success! });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
    >
      {msg && (
        <div
          className={`p-4 text-sm font-bold text-center ${msg.type === "success" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}
        >
          {msg.text}
        </div>
      )}

      <div className="p-8 space-y-8">
        {/* SECTION 1: WAKTU OPERASIONAL */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            🕒 Jam Operasional
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Jam Buka
              </label>
              <input
                name="operational_start"
                type="time"
                defaultValue={settings["operational_start"] || "08:00"}
                className="w-full rounded-xl p-3 bg-slate-50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Jam Tutup
              </label>
              <input
                name="operational_end"
                type="time"
                defaultValue={settings["operational_end"] || "17:00"}
                className="w-full rounded-xl p-3 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* SECTION 2: ATURAN PEMINJAMAN */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            ⚙️ Aturan Peminjaman
          </h3>

          {/* [POIN 2] RADIO BUTTON FREEZE TIME */}
          <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-3">
              Waktu Booking Minimal (Freeze Time)
            </label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="min_booking_notice"
                  value="30"
                  defaultChecked={currentMinNotice === "30"}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition">
                  30 Menit Sebelum Acara
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="min_booking_notice"
                  value="60"
                  defaultChecked={currentMinNotice === "60"}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition">
                  1 Jam Sebelum Acara
                </span>
              </label>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Mencegah user memesan ruangan secara mendadak.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Maks. Durasi (Jam)
              </label>
              <div className="relative">
                <input
                  name="max_booking_duration"
                  type="number"
                  min="1"
                  defaultValue={settings["max_booking_duration"] || "4"}
                  className="w-full rounded-xl p-3 bg-slate-50 focus:bg-white"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">
                  Jam
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Booking Jendela (Hari)
              </label>
              <div className="relative">
                <input
                  name="max_advance_days"
                  type="number"
                  min="1"
                  defaultValue={settings["max_advance_days"] || "14"}
                  className="w-full rounded-xl p-3 bg-slate-50 focus:bg-white"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">
                  Hari Kedepan
                </span>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* SECTION 3: SYSTEM CONTROL */}
        <div className="bg-red-50/50 p-5 rounded-xl border border-red-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-red-800 mb-1">
                Maintenance Mode
              </h3>
              <p className="text-xs text-red-600/80">
                Jika aktif, semua aktivitas booking akan dimatikan.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="is_maintenance"
                className="sr-only peer"
                defaultChecked={settings["is_maintenance"] === "true"}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </div>
    </form>
  );
}
