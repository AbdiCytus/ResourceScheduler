"use client";

import { useState } from "react";
import { createResource, updateResource, deleteResource } from "./actions";

// Tipe Data
type Resource = {
  id: string;
  name: string;
  type: string;
  capacity: number;
  description: string | null;
  is_active: boolean;
  scheduled_for_deletion_at: string | null;
};

export default function ResourceManagement({
  initialResources,
}: {
  initialResources: Resource[];
}) {
  // State Modal Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedResource, setSelectedResource] = useState<Resource | null>(
    null
  );

  // State untuk Dynamic Label (Room -> Orang, Equipment -> Unit)
  const [formType, setFormType] = useState<string>("Room");

  // State Loading & Confirm Delete
  const [isLoading, setIsLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // --- HANDLERS ---

  const handleOpenCreate = () => {
    setModalMode("create");
    setSelectedResource(null);
    setFormType("Room"); // Default Room
    setIsModalOpen(true);
  };

  const handleOpenEdit = (res: Resource) => {
    setModalMode("edit");
    setSelectedResource(res);
    setFormType(res.type); // Set tipe sesuai data yang diedit
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Konfirmasi Simpan
    const message =
      modalMode === "create"
        ? "Konfirmasi: Tambahkan resource baru ini?"
        : "Konfirmasi: Simpan perubahan data?";
    if (!confirm(message)) return;

    setIsLoading(true);
    const formData = new FormData(e.currentTarget);

    const result =
      modalMode === "create"
        ? await createResource(formData)
        : await updateResource(formData);

    setIsLoading(false);

    if (result?.error) {
      alert("❌ Error: " + result.error);
    } else {
      setIsModalOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsLoading(true);

    const result = await deleteResource(deleteTarget);

    setIsLoading(false);
    setDeleteTarget(null);

    if (result?.warning) {
      alert("⚠️ PERHATIAN: " + result.message);
    } else if (result?.error) {
      alert("❌ Error: " + result.error);
    }
  };

  return (
    <div>
      {/* Tombol Tambah */}
      <div className="flex justify-end mb-6">
        <button
          onClick={handleOpenCreate}
          className="btn-primary flex items-center gap-2 shadow-indigo-200"
        >
          <span className="text-lg font-bold">＋</span> Tambah Resource
        </button>
      </div>

      {/* Tabel Resources */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500 font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">Nama Resource</th>
              <th className="px-6 py-4">Tipe</th>
              <th className="px-6 py-4">Kapasitas</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {initialResources.map((res) => {
              const isPendingDelete = !!res.scheduled_for_deletion_at;
              const unit = res.type === "Room" ? "Orang" : "Unit";

              return (
                <tr
                  key={res.id}
                  className="hover:bg-slate-50 transition-colors group"
                >
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {res.name}

                    {/* Badge Masa Tenggang */}
                    {isPendingDelete && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full border border-red-200 font-bold animate-pulse">
                          ⏳ SEGERA DIHAPUS
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(
                            res.scheduled_for_deletion_at!
                          ).toLocaleDateString("id-ID")}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                        res.type === "Room"
                          ? "bg-indigo-50 text-indigo-700"
                          : "bg-orange-50 text-orange-700"
                      }`}
                    >
                      {res.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-mono text-sm">
                    {res.capacity} {unit}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`flex items-center gap-1.5 text-xs font-medium ${
                        res.is_active ? "text-emerald-600" : "text-slate-400"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          res.is_active ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      ></span>
                      {res.is_active ? "Aktif" : "Non-Aktif"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(res)}
                        className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                        disabled={isPendingDelete}
                        title="Edit Resource"
                      >
                        ✏️
                      </button>

                      {!isPendingDelete && (
                        <button
                          onClick={() => setDeleteTarget(res.id)}
                          className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                          title="Hapus Resource"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {initialResources.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-slate-400">
                  Belum ada data resource.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODAL FORM CREATE / EDIT --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-all">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 lg:p-8 animate-in fade-in zoom-in duration-200 border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {modalMode === "create"
                  ? "Tambah Resource Baru"
                  : "Edit Resource"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {modalMode === "edit" && (
                <input type="hidden" name="id" value={selectedResource?.id} />
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Nama Resource
                </label>
                <input
                  name="name"
                  defaultValue={selectedResource?.name}
                  required
                  placeholder="Contoh: Ruang Rapat A"
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Tipe
                  </label>
                  <select
                    name="type"
                    defaultValue={selectedResource?.type || "Room"}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Room">Ruangan</option>
                    <option value="Equipment">Peralatan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Kapasitas ({formType === "Room" ? "Orang" : "Unit"})
                  </label>
                  <input
                    name="capacity"
                    type="number"
                    defaultValue={selectedResource?.capacity}
                    required
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Deskripsi (Opsional)
                </label>
                <input
                  name="description"
                  defaultValue={selectedResource?.description || ""}
                  placeholder="Fasilitas atau detail..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {modalMode === "edit" && (
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 mt-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    id="is_active"
                    defaultChecked={selectedResource?.is_active}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="is_active"
                    className="text-sm font-medium text-slate-700 cursor-pointer select-none"
                  >
                    Set Status Aktif
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary text-sm"
                >
                  {isLoading ? "Menyimpan..." : "Simpan Resource"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- POPUP KONFIRMASI DELETE --- */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center border border-slate-100">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 text-3xl mb-6 mx-auto border border-red-100">
              🗑️
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Hapus Resource Ini?
            </h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              Sistem akan mengecek jadwal terlebih dahulu. <br />
              Jika masih ada jadwal aktif, resource akan masuk status{" "}
              <b>"Segera Dihapus"</b> sampai semua jadwal selesai.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-95"
              >
                {isLoading ? "Mengecek..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
