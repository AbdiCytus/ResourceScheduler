"use client";

import { useState, useActionState } from "react";
import {
  updateSettings,
  createActivityTemplate,
  deleteActivityTemplate,
  updateActivityTemplate,
} from "./actions";

type ActivityTemplate = {
  id: string;
  name: string;
  weight: number;
  allowed_roles: string[];
};

const ALL_ROLES = ["mahasiswa", "dosen", "admin"];

// Mapping bobot angka ↔ label teks
const WEIGHT_TO_LEVEL: Record<number, string> = { 10: "rendah", 30: "sedang", 60: "tinggi" };
const LEVEL_TO_WEIGHT: Record<string, number> = { rendah: 10, sedang: 30, tinggi: 60 };
const LEVEL_STYLE: Record<string, string> = {
  rendah: "bg-slate-50 text-slate-600 border-slate-200",
  sedang: "bg-amber-50 text-amber-700 border-amber-200",
  tinggi: "bg-red-50 text-red-700 border-red-200",
};
const LEVEL_LABEL: Record<string, string> = { rendah: "Rendah", sedang: "Sedang", tinggi: "Tinggi" };

// ─── Row edit inline template ───
function TemplateRow({
  t,
  onSave,
  onDelete,
}: {
  t: ActivityTemplate;
  onSave: (id: string, name: string, weight: number, roles: string[]) => Promise<{ error?: string } | undefined>;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Edit state
  const [editName, setEditName] = useState(t.name);
  const [editLevel, setEditLevel] = useState(WEIGHT_TO_LEVEL[t.weight] || "sedang");
  const [editRoles, setEditRoles] = useState<string[]>(t.allowed_roles);

  const toggleRole = (r: string) =>
    setEditRoles((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]);

  const handleSave = async () => {
    setSaving(true);
    setEditError(null);
    const result = await onSave(t.id, editName, LEVEL_TO_WEIGHT[editLevel], editRoles);
    setSaving(false);
    if (result?.error) {
      setEditError(result.error);
    } else {
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <tr className="bg-indigo-50/50">
        <td className="px-6 py-3" colSpan={4}>
          <div className="space-y-3">
            {editError && (
              <p className="text-xs text-red-600 font-bold">{editError}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Kegiatan</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Bobot / Prioritas</label>
                <select
                  value={editLevel}
                  onChange={(e) => setEditLevel(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="rendah">Rendah</option>
                  <option value="sedang">Sedang</option>
                  <option value="tinggi">Tinggi</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Role yang Diizinkan</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {ALL_ROLES.map((r) => (
                    <label key={r} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editRoles.includes(r)}
                        onChange={() => toggleRole(r)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="capitalize font-medium text-slate-700">{r}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1.5 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false); setEditError(null); setEditName(t.name); setEditLevel(WEIGHT_TO_LEVEL[t.weight] || "sedang"); setEditRoles(t.allowed_roles); }}
                className="px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Batal
              </button>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  const level = WEIGHT_TO_LEVEL[t.weight] || "sedang";
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4 font-medium text-slate-800">{t.name}</td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {t.allowed_roles.map((r: string) => (
            <span key={r} className="text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5 py-0.5 rounded-full font-bold uppercase">
              {r}
            </span>
          ))}
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${LEVEL_STYLE[level]}`}>
          {LEVEL_LABEL[level]}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="flex items-center justify-center gap-1">
          {/* Edit */}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition"
            title="Edit template"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
            </svg>
          </button>
          {/* Hapus */}
          <button
            type="button"
            onClick={() => onDelete(t.id)}
            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition"
            title="Hapus template"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function SettingsForm({
  initialSettings,
  activityTemplates: initialTemplates,
}: {
  initialSettings: Record<string, string>;
  activityTemplates: ActivityTemplate[];
}) {
  const [state, formAction, isPending] = useActionState(updateSettings, null);
  const [createState, createAction, isCreating] = useActionState(createActivityTemplate, null);
  const [templates, setTemplates] = useState<ActivityTemplate[]>(initialTemplates);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus template kegiatan ini?")) return;
    setDeletingId(id);
    const res = await deleteActivityTemplate(id);
    setDeletingId(null);
    if (!res?.error) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } else {
      alert(res.error);
    }
  };

  const handleSaveTemplate = async (id: string, name: string, weight: number, roles: string[]) => {
    const res = await updateActivityTemplate(id, name, weight, roles);
    if (!res?.error) {
      setTemplates((prev) =>
        prev.map((t) => t.id === id ? { ...t, name, weight, allowed_roles: roles } : t)
      );
    }
    return res;
  };

  return (
    <div className="space-y-8">
      {/* ===================== FORM UTAMA ===================== */}
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
          {/* --- JAM AKTIF GEDUNG --- */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
              🏛️ Jam Aktif Gedung
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Jam Buka</label>
                <input type="time" name="building_open"
                  defaultValue={initialSettings["building_open"] || "08:00"}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 text-sm focus:ring-2 focus:ring-indigo-500"
                  required />
                <p className="text-[10px] text-slate-400 mt-1">Waktu gedung mulai beroperasi.</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Jam Tutup</label>
                <input type="time" name="building_close"
                  defaultValue={initialSettings["building_close"] || "18:00"}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 p-3 text-sm focus:ring-2 focus:ring-indigo-500"
                  required />
                <p className="text-[10px] text-slate-400 mt-1">Waktu gedung berhenti beroperasi.</p>
              </div>
            </div>
            <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700 font-medium">
              ⚠️ Peminjaman di luar jam ini akan <strong>ditolak otomatis</strong> oleh sistem.
            </div>
          </div>

          {/* --- MAINTENANCE --- */}
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

      {/* ===================== TEMPLATE KEGIATAN ===================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            🏷️ Manajemen Template Kegiatan
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Tambah, edit, atau hapus template kegiatan yang tersedia saat peminjaman.
          </p>
        </div>

        {/* Form Tambah Template Baru */}
        <form action={createAction} className="p-6 bg-slate-50 border-b border-slate-100">
          {createState?.success && (
            <div className="mb-4 bg-emerald-50 border-l-4 border-emerald-500 p-3 rounded-r-lg text-sm font-bold text-emerald-800">
              ✅ {createState.success}
            </div>
          )}
          {createState?.error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg text-sm font-bold text-red-800">
              ⚠️ {createState.error}
            </div>
          )}
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Tambah Template Baru</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Nama Kegiatan</label>
              <input type="text" name="name" required placeholder="cth: Seminar Prodi"
                className="w-full rounded-lg border-slate-200 bg-white p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Bobot / Prioritas</label>
              <select name="weight" required
                className="w-full rounded-lg border-slate-200 bg-white p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">-- Pilih Prioritas --</option>
                <option value="10">Rendah</option>
                <option value="30">Sedang</option>
                <option value="60">Tinggi</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Role yang Diizinkan</label>
              <div className="flex flex-wrap gap-3">
                {ALL_ROLES.map((r) => (
                  <label key={r} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="checkbox" name="allowed_roles" value={r}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="capitalize font-medium text-slate-700">{r}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <button type="submit" disabled={isCreating}
              className="bg-indigo-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-indigo-700 transition text-sm disabled:opacity-50">
              {isCreating ? "Menambahkan..." : "+ Tambah Template"}
            </button>
          </div>
        </form>

        {/* Tabel Template Existing */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Nama Kegiatan</th>
                <th className="px-6 py-3">Role Diizinkan</th>
                <th className="px-6 py-3 text-center w-32">Bobot</th>
                <th className="px-6 py-3 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {templates.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-sm">
                    Belum ada template kegiatan. Tambahkan di atas.
                  </td>
                </tr>
              )}
              {templates.map((t) => (
                <TemplateRow
                  key={t.id}
                  t={t}
                  onSave={handleSaveTemplate}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
