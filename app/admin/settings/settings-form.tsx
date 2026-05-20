"use client";

import { useState } from "react";
import { useActionState } from "react";
import { updateSettings, updateActivityWeight } from "./actions";

type ActivityTemplate = {
  id: string;
  name: string;
  weight: number;
  allowed_roles: string[];
};

export default function SettingsForm({
  initialSettings,
  activityTemplates,
}: {
  initialSettings: Record<string, string>;
  activityTemplates: ActivityTemplate[];
}) {
  const [state, formAction, isPending] = useActionState(updateSettings, null);
  const [editingWeights, setEditingWeights] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const handleWeightSave = async (id: string) => {
    const newWeight = editingWeights[id];
    if (newWeight === undefined) return;
    setSavingId(id);
    await updateActivityWeight(id, newWeight);
    setSavingId(null);
    setEditingWeights((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

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
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Jam Buka</label>
              <input type="time" name="operational_start"
                defaultValue={initialSettings["operational_start"] || "08:00"}
                className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500"
                required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Jam Tutup</label>
              <input type="time" name="operational_end"
                defaultValue={initialSettings["operational_end"] || "17:00"}
                className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500"
                required />
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
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Maksimal Durasi (Jam)</label>
              <input type="number" name="max_booking_duration"
                defaultValue={initialSettings["max_booking_duration"] || "4"}
                className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500"
                required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Maks H- Hari Booking</label>
              <input type="number" name="max_advance_days"
                defaultValue={initialSettings["max_advance_days"] || "14"}
                className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500"
                required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Min. Waktu Pengajuan (Menit)</label>
              <input type="number" name="min_booking_notice"
                defaultValue={initialSettings["min_booking_notice"] || "30"}
                className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500"
                required />
            </div>
          </div>
        </div>

        {/* --- SECTION 3: BOBOT ROLE --- */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
            🏆 Bobot Role Pengguna
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Skor akhir = Bobot Role + Bobot Template Kegiatan. Skor lebih tinggi menang saat perebutan ruangan.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div className="space-y-4">
                {[
                  { label: "Admin", name: "role_weight_admin", default: "30" },
                  { label: "Kajur", name: "role_weight_kajur", default: "25" },
                  { label: "Dosen", name: "role_weight_dosen", default: "22" },
                  { label: "Mahasiswa", name: "role_weight_mahasiswa", default: "20" },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500">{item.label}</label>
                    <input type="number" name={item.name}
                      defaultValue={initialSettings[item.name] || item.default}
                      className="w-24 rounded-lg border-slate-200 p-2 text-sm text-center font-bold focus:ring-2 focus:ring-indigo-500" />
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 flex flex-col justify-center">
              <h4 className="text-sm font-bold text-indigo-900 mb-2">💡 Cara Kerja Skor</h4>
              <p className="text-xs text-indigo-700 leading-relaxed">
                Skor akhir = <strong>Bobot Role</strong> + <strong>Bobot Template Kegiatan</strong>.
              </p>
              <p className="text-xs text-indigo-600 mt-2 leading-relaxed">
                Pemesanan dengan skor lebih tinggi bisa menggeser yang lebih rendah (sebelum Freeze Time).
              </p>
            </div>
          </div>
        </div>

        {/* --- SECTION 4: TEMPLATE KEGIATAN --- */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
            🏷️ Bobot Template Kegiatan
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Edit angka bobot, lalu klik <strong>Simpan</strong> di baris tersebut.
          </p>
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <tr>
                  <th className="px-4 py-3">Nama Kegiatan</th>
                  <th className="px-4 py-3">Role Diizinkan</th>
                  <th className="px-4 py-3 text-center w-40">Bobot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {activityTemplates.map((t) => {
                  const isEditing = editingWeights[t.id] !== undefined;
                  const currentVal = editingWeights[t.id] ?? t.weight;
                  return (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{t.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {t.allowed_roles.map((r: string) => (
                            <span key={r} className="text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5 py-0.5 rounded-full font-bold uppercase">
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <input
                            type="number" min={1} max={100} value={currentVal}
                            onChange={(e) =>
                              setEditingWeights((prev) => ({ ...prev, [t.id]: parseInt(e.target.value) || 0 }))
                            }
                            className="w-16 text-center text-sm font-bold rounded-lg border border-slate-200 p-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                          {isEditing && (
                            <button type="button" onClick={() => handleWeightSave(t.id)}
                              disabled={savingId === t.id}
                              className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-1.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
                              {savingId === t.id ? "..." : "Simpan"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- SECTION 5: MAINTENANCE --- */}
        <div>
          <h3 className="text-lg font-bold text-red-600 mb-4 border-b border-red-100 pb-2">
            Zona Berbahaya
          </h3>
          <div className="bg-red-50 border border-red-100 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <h4 className="font-bold text-red-800 text-sm">Mode Maintenance</h4>
              <p className="text-xs text-red-600 mt-1">Jika diaktifkan, user tidak bisa melakukan booking.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" name="is_maintenance"
                defaultChecked={initialSettings["is_maintenance"] === "true"}
                value="true" className="sr-only peer" />
              <div className="w-11 h-6 bg-red-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>
        </div>

      </div>

      <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
        <button disabled={isPending} type="submit"
          className="bg-slate-900 text-white font-bold py-3 px-8 rounded-xl hover:bg-slate-800 transition shadow-sm disabled:opacity-50">
          {isPending ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </div>
    </form>
  );
}
