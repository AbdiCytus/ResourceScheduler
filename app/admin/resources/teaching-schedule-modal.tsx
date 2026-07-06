"use client";

import { useState, useEffect } from "react";
import ConfirmModal from "@/components/confirm-modal";
import {
  createTeachingSchedule,
  updateTeachingSchedule,
  toggleTeachingScheduleStatus,
  deleteTeachingSchedule,
} from "./actions";

export type TeachingSchedule = {
  id: string;
  resource_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  dosen_pengampu: string;
  matakuliah: string;
  kelas: string;
  is_offline: boolean;
};

const DAY_NAMES = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

// ─── Searchable Dosen Dropdown ───
function SearchableDosenSelect({
  name,
  defaultValue = "",
  dosenList,
  placeholder = "Cari atau ketik nama dosen...",
}: {
  name: string;
  defaultValue?: string;
  dosenList: string[];
  placeholder?: string;
}) {
  const [query, setQuery] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(defaultValue);

  const filtered = dosenList.filter((d) =>
    d.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (name: string) => {
    setSelected(name);
    setQuery(name);
    setOpen(false);
  };

  return (
    <div className="relative">
      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={selected} />
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelected(e.target.value); // allow free-text too
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="w-full rounded-xl p-2.5 text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-44 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400 italic">
              Tidak ada dosen ditemukan. Nilai akan disimpan sebagai teks.
            </div>
          ) : (
            filtered.map((d) => (
              <button
                key={d}
                type="button"
                onMouseDown={() => handleSelect(d)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 transition ${
                  selected === d ? "font-bold text-indigo-700 bg-indigo-50" : "text-slate-700"
                }`}
              >
                {d}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

type Props = {
  resourceId: string;
  resourceName: string;
  schedules: TeachingSchedule[];
  dosenList: string[];
  onClose: () => void;
};

// ─── Row dengan mode edit inline ───
function ScheduleRow({
  s,
  dosenList,
  onToggle,
  onDelete,
  onSaveEdit,
  isLoading,
}: {
  s: TeachingSchedule;
  dosenList: string[];
  onToggle: (id: string, cur: boolean) => void;
  onDelete: (id: string) => void;
  onSaveEdit: (formData: FormData) => Promise<{ error?: string } | undefined>;
  isLoading: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setEditError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("schedule_id", s.id);
    const result = await onSaveEdit(fd);
    setSaving(false);
    if (result?.error) {
      setEditError(result.error);
    } else {
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <form
        onSubmit={handleSave}
        className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3"
      >
        <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
          Edit Jadwal
        </p>
        {editError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700">
            {editError}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Hari</label>
            <select name="day_of_week" defaultValue={s.day_of_week} required className="w-full rounded-xl p-2.5 text-sm border border-slate-200 bg-white">
              <option value="1">Senin</option>
              <option value="2">Selasa</option>
              <option value="3">Rabu</option>
              <option value="4">Kamis</option>
              <option value="5">Jumat</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Kelas</label>
            <input name="kelas" defaultValue={s.kelas} required className="w-full rounded-xl p-2.5 text-sm border border-slate-200 bg-white" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Jam Mulai</label>
            <input name="start_time" type="time" defaultValue={s.start_time.slice(0, 5)} required className="w-full rounded-xl p-2.5 text-sm border border-slate-200 bg-white" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Jam Selesai</label>
            <input name="end_time" type="time" defaultValue={s.end_time.slice(0, 5)} required className="w-full rounded-xl p-2.5 text-sm border border-slate-200 bg-white" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Mata Kuliah</label>
          <input name="matakuliah" defaultValue={s.matakuliah} required className="w-full rounded-xl p-2.5 text-sm border border-slate-200 bg-white" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Dosen Pengampu</label>
          <SearchableDosenSelect
            name="dosen_pengampu"
            defaultValue={s.dosen_pengampu}
            dosenList={dosenList}
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={() => { setEditing(false); setEditError(null); }}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition">
            Batal
          </button>
          <button type="submit" disabled={saving}
            className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:opacity-50">
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
      s.is_offline ? "bg-white border-slate-200" : "bg-slate-50 border-slate-100 opacity-70"
    }`}>
      {/* Hari Badge */}
      <span className="w-14 flex-shrink-0 text-center text-[10px] font-black uppercase bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg">
        {DAY_NAMES[s.day_of_week]}
      </span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 truncate">
          {s.matakuliah}
          <span className="ml-2 text-[10px] font-medium text-slate-500">Kelas {s.kelas}</span>
        </p>
        <p className="text-xs text-slate-500 truncate">
          {s.dosen_pengampu} &bull; {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Toggle Online/Offline */}
        <button
          onClick={() => onToggle(s.id, s.is_offline)}
          disabled={isLoading}
          title={s.is_offline ? "Kelas Offline (Klik → Online)" : "Kelas Online (Klik → Offline)"}
          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition ${
            s.is_offline
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
          }`}
        >
          {s.is_offline ? "Offline" : "Online"}
        </button>

        {/* Edit */}
        <button
          onClick={() => setEditing(true)}
          disabled={isLoading}
          className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition"
          title="Edit jadwal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
          </svg>
        </button>

        {/* Delete */}
        <ConfirmModal
          isOpen={showDeleteConfirm}
          title="Hapus Jadwal Kuliah?"
          message={`Jadwal ${s.matakuliah} – Kelas ${s.kelas} (${DAY_NAMES[s.day_of_week]}) akan dihapus secara permanen.`}
          confirmLabel="Ya, Hapus"
          confirmVariant="danger"
          onConfirm={() => { setShowDeleteConfirm(false); onDelete(s.id); }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
        <button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isLoading}
          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition"
          title="Hapus jadwal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function TeachingScheduleModal({
  resourceId,
  resourceName,
  schedules,
  dosenList,
  onClose,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Lock scroll saat modal terbuka, release saat ditutup
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("resource_id", resourceId);
    const result = await createTeachingSchedule(fd);
    setIsLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setShowAddForm(false);
      (e.target as HTMLFormElement).reset();
    }
  };

  const handleToggle = async (id: string, currentOffline: boolean) => {
    setIsLoading(true);
    await toggleTeachingScheduleStatus(id, !currentOffline);
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    await deleteTeachingSchedule(id);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Jadwal Kuliah Tetap</h2>
            <p className="text-xs text-slate-500 mt-0.5">{resourceName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition">✕</button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-3">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r-lg text-sm text-red-700">{error}</div>
          )}

          {schedules.length === 0 && !showAddForm && (
            <div className="text-center py-10 text-slate-400">
              <p className="text-4xl mb-2">📅</p>
              <p className="text-sm font-medium">Belum ada jadwal kuliah.</p>
              <p className="text-xs mt-1">Klik tombol di bawah untuk menambahkan.</p>
            </div>
          )}

          {/* Form Tambah Jadwal (Pindah ke atas) */}
          {showAddForm && (
            <form onSubmit={handleAdd} className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-3 mb-4">
              <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Tambah Jadwal Baru</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Hari</label>
                  <select name="day_of_week" required className="w-full rounded-xl p-2.5 text-sm border border-slate-200 bg-white">
                    <option value="1">Senin</option>
                    <option value="2">Selasa</option>
                    <option value="3">Rabu</option>
                    <option value="4">Kamis</option>
                    <option value="5">Jumat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Kelas</label>
                  <input name="kelas" required placeholder="cth: TI-3A" className="w-full rounded-xl p-2.5 text-sm border border-slate-200 bg-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Jam Mulai</label>
                  <input name="start_time" type="time" required className="w-full rounded-xl p-2.5 text-sm border border-slate-200 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Jam Selesai</label>
                  <input name="end_time" type="time" required className="w-full rounded-xl p-2.5 text-sm border border-slate-200 bg-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Mata Kuliah</label>
                <input name="matakuliah" required placeholder="cth: Pemrograman Web" className="w-full rounded-xl p-2.5 text-sm border border-slate-200 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Dosen Pengampu</label>
                <SearchableDosenSelect
                  name="dosen_pengampu"
                  dosenList={dosenList}
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => { setShowAddForm(false); setError(null); }}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition">
                  Batal
                </button>
                <button type="submit" disabled={isLoading}
                  className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:opacity-50">
                  {isLoading ? "Menyimpan..." : "Simpan Jadwal"}
                </button>
              </div>
            </form>
          )}

          {/* Daftar Jadwal */}
          {schedules.map((s) => (
            <ScheduleRow
              key={s.id}
              s={s}
              dosenList={dosenList}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onSaveEdit={updateTeachingSchedule}
              isLoading={isLoading}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex-shrink-0 flex justify-between items-center">
          <button
            onClick={() => { setShowAddForm(true); setError(null); }}
            disabled={showAddForm || isLoading}
            className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl transition disabled:opacity-40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            Tambah Jadwal
          </button>
          <button onClick={onClose} className="px-5 py-2 text-sm font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition">
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
