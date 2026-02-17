"use client";

import { useState } from "react";
import { createResource, updateResource, deleteResource } from "./actions";

// Tipe Data Resource
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

  // State untuk Label Dinamis (Orang vs Unit)
  const [formType, setFormType] = useState<string>("Room");

  // State Loading & Confirm Delete
  const [isLoading, setIsLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // --- HANDLERS ---

  const handleOpenCreate = () => {
    setModalMode("create");
    setSelectedResource(null);
    setFormType("Room"); // Default
    setIsModalOpen(true);
  };

  const handleOpenEdit = (res: Resource) => {
    setModalMode("edit");
    setSelectedResource(res);
    setFormType(res.type);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
      {/* --- HEADER SECTION (Judul & Tombol Sebaris) --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Manajemen Sumber Daya
          </h1>
          <p className="text-slate-500 mt-1">
            Kelola ruangan dan peralatan kantor.
          </p>
        </div>

        {/* Tombol Tambah dengan Icon Plus */}
        <button
          onClick={handleOpenCreate}
          className="btn-primary flex items-center gap-2 shadow-indigo-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-bold">Tambah Resource</span>
        </button>
      </div>

      {/* --- TABEL RESOURCES --- */}
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
                      {/* Tombol Edit (PencilSquareIcon) */}
                      <button
                        onClick={() => handleOpenEdit(res)}
                        className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                        disabled={isPendingDelete}
                        title="Edit Resource"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-5 h-5"
                        >
                          <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
                        </svg>
                      </button>

                      {/* Tombol Delete (TrashIcon) */}
                      {!isPendingDelete && (
                        <button
                          onClick={() => setDeleteTarget(res.id)}
                          className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                          title="Hapus Resource"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"
                              clipRule="evenodd"
                            />
                          </svg>
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

      {/* --- POPUP DELETE (TrashIcon Besar) --- */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center border border-slate-100">
            {/* Ikon Sampah Besar */}
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6 mx-auto border border-red-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
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
