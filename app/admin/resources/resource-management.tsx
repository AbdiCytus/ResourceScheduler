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
  facilities: string[] | null;
};

// Tipe untuk Modal Konfirmasi/Alert
type ModalConfig = {
  isOpen: boolean;
  type: "confirm" | "alert" | "danger"; // danger untuk hapus
  title: string;
  message: string;
  onConfirm?: () => void; // Hanya untuk tipe confirm/danger
};

export default function ResourceManagement({
  initialResources,
}: {
  initialResources: Resource[];
}) {
  // State Data & Form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedResource, setSelectedResource] = useState<Resource | null>(
    null
  );
  const [resourceType, setResourceType] = useState<string>("Room");
  const [isLoading, setIsLoading] = useState(false);

  // State Modal Global (Konfirmasi & Alert)
  const [modal, setModal] = useState<ModalConfig>({
    isOpen: false,
    type: "alert",
    title: "",
    message: "",
  });

  // --- HANDLERS UTAMA ---

  const openCreateForm = () => {
    setFormMode("create");
    setSelectedResource(null);
    setResourceType("Room");
    setIsFormOpen(true);
  };

  const openEditForm = (res: Resource) => {
    setFormMode("edit");
    setSelectedResource(res);
    setResourceType(res.type);
    setIsFormOpen(true);
  };

  // 1. Handler Klik Simpan (Memicu Modal Konfirmasi)
  const handleSaveClick = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    setModal({
      isOpen: true,
      type: "confirm",
      title: formMode === "create" ? "Tambah Resource?" : "Simpan Perubahan?",
      message:
        "Pastikan data yang Anda masukkan sudah benar sebelum menyimpan.",
      onConfirm: async () => {
        // Eksekusi Server Action
        setIsLoading(true);
        const result =
          formMode === "create"
            ? await createResource(formData)
            : await updateResource(formData);
        setIsLoading(false);

        // Tutup Modal Konfirmasi
        setModal((prev) => ({ ...prev, isOpen: false }));

        if (result?.error) {
          // Tampilkan Modal Error (Pengganti Alert)
          setTimeout(() => {
            setModal({
              isOpen: true,
              type: "alert", // Mode Alert (Merah/Info)
              title: "Gagal Menyimpan",
              message: result.error || "Terjadi kesalahan.",
            });
          }, 300); // Delay sedikit agar transisi smooth
        } else {
          setIsFormOpen(false); // Tutup Form Utama jika sukses
        }
      },
    });
  };

  // 2. Handler Klik Hapus (Memicu Modal Bahaya)
  const handleDeleteClick = (id: string) => {
    setModal({
      isOpen: true,
      type: "danger",
      title: "Hapus Resource?",
      message:
        "Sistem akan mengecek jadwal aktif. Jika ada jadwal yang belum selesai, resource akan masuk antrian penghapusan (Status: Segera Dihapus).",
      onConfirm: async () => {
        setIsLoading(true);
        const result = await deleteResource(id);
        setIsLoading(false);
        setModal((prev) => ({ ...prev, isOpen: false }));

        // Feedback Hasil Hapus
        if (result?.warning) {
          setTimeout(() => {
            setModal({
              isOpen: true,
              type: "alert",
              title: "Info Penghapusan",
              message: result.message!,
            });
          }, 300);
        } else if (result?.error) {
          setTimeout(() => {
            setModal({
              isOpen: true,
              type: "alert",
              title: "Gagal Menghapus",
              message: result.error!,
            });
          }, 300);
        }
      },
    });
  };

  return (
    <div>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Manajemen Sumber Daya
          </h1>
          <p className="text-slate-500 mt-1">
            Kelola ruangan dan peralatan kantor.
          </p>
        </div>
        <button
          onClick={openCreateForm}
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

      {/* TABEL DATA */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500 font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">Nama Resource</th>
              <th className="px-6 py-4">Tipe & Fasilitas</th>
              <th className="px-6 py-4">Kapasitas</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {initialResources.map((res) => {
              const isPendingDelete = !!res.scheduled_for_deletion_at;
              return (
                <tr
                  key={res.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {res.name}
                    {isPendingDelete && (
                      <div className="text-[10px] text-red-500 font-bold mt-1 animate-pulse">
                        ⏳ SEGERA DIHAPUS
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`w-fit px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          res.type === "Room"
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {res.type}
                      </span>
                      {res.type === "Room" && res.facilities && (
                        <div className="flex flex-wrap gap-1">
                          {res.facilities.map((f, i) => (
                            <span
                              key={i}
                              className="text-[9px] text-slate-500 bg-slate-100 px-1 rounded border border-slate-200"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm">
                    {res.capacity} {res.type === "Room" ? "Org" : "Unit"}
                  </td>

                  {/* KOLOM AKSI DENGAN HEROICONS */}
                  <td className="px-6 py-4 text-right gap-2 flex justify-end">
                    <button
                      onClick={() => openEditForm(res)}
                      disabled={isPendingDelete}
                      className="text-indigo-600 p-2 hover:bg-indigo-50 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Edit"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                        />
                      </svg>
                    </button>

                    {!isPendingDelete && (
                      <button
                        onClick={() => handleDeleteClick(res.id)}
                        className="text-red-600 p-2 hover:bg-red-50 rounded-lg transition"
                        title="Hapus"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                          />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* --- FORM MODAL (CREATE / EDIT) --- */}
      {/* [FIX] Ubah z-40 menjadi z-[60] agar di atas navbar (z-50) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 animate-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-6 text-slate-800">
              {formMode === "create" ? "Tambah Resource" : "Edit Resource"}
            </h2>

            <form onSubmit={handleSaveClick} className="space-y-5">
              {formMode === "edit" && (
                <input type="hidden" name="id" value={selectedResource?.id} />
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Nama
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={selectedResource?.name}
                  required
                  placeholder="Contoh: Ruang Meeting A"
                  className="w-full rounded-xl p-3"
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
                    onChange={(e) => setResourceType(e.target.value)}
                    className="w-full rounded-xl p-3"
                  >
                    <option value="Room">Ruangan</option>
                    <option value="Equipment">Peralatan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Kapasitas
                  </label>
                  <input
                    placeholder="0"
                    name="capacity"
                    type="number"
                    defaultValue={selectedResource?.capacity}
                    required
                    className="w-full rounded-xl p-3"
                  />
                </div>
              </div>

              {resourceType === "Room" && (
                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                  <label className="block text-xs font-bold text-indigo-700 uppercase mb-2">
                    Fasilitas (Tag)
                  </label>
                  <textarea
                    name="facilities"
                    rows={2}
                    defaultValue={
                      selectedResource?.facilities?.join(", ") || ""
                    }
                    placeholder="Contoh: AC, Proyektor..."
                    className="w-full rounded-lg bg-white border-indigo-200 p-3 text-sm"
                  />
                  <p className="text-[10px] text-indigo-500 mt-1">
                    Pisahkan dengan tanda koma (,) setiap fasilitas.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Deskripsi
                </label>
                <input
                  type="text"
                  name="description"
                  defaultValue={selectedResource?.description || ""}
                  className="w-full rounded-xl p-3"
                />
              </div>

              {/* Checkbox Aktif (Hanya saat Edit) */}
              {formMode === "edit" && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    id="is_active"
                    defaultChecked={selectedResource?.is_active}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <label
                    htmlFor="is_active"
                    className="text-sm font-medium text-slate-700"
                  >
                    Set Aktif
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary"
                >
                  {formMode === "create" ? "Buat Resource" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL KONFIRMASI & ALERT --- */}
      {/* [FIX] Ubah z-50 menjadi z-[70] agar di atas Form Modal (z-[60]) */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Ikon Modal */}
            <div
              className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl 
              ${
                modal.type === "danger" ||
                (modal.type === "alert" && modal.title.includes("Gagal"))
                  ? "bg-red-50 text-red-500"
                  : "bg-indigo-50 text-indigo-500"
              }
            `}
            >
              {modal.type === "danger" ||
              (modal.type === "alert" && modal.title.includes("Gagal"))
                ? "⚠️"
                : "ℹ️"}
            </div>

            <h3 className="text-xl font-bold mb-2 text-slate-900">
              {modal.title}
            </h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              {modal.message}
            </p>

            <div className="flex justify-center gap-3">
              {/* Tombol untuk Konfirmasi (Ada Batal & Ya) */}
              {(modal.type === "confirm" || modal.type === "danger") && (
                <>
                  <button
                    onClick={() =>
                      setModal((prev) => ({ ...prev, isOpen: false }))
                    }
                    className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition"
                  >
                    Batal
                  </button>
                  <button
                    onClick={modal.onConfirm}
                    disabled={isLoading}
                    className={`px-5 py-2.5 text-white rounded-xl font-bold shadow-lg transition transform active:scale-95 ${
                      modal.type === "danger"
                        ? "bg-red-600 hover:bg-red-700 shadow-red-200"
                        : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
                    }`}
                  >
                    {isLoading ? "Memproses..." : "Ya, Lanjutkan"}
                  </button>
                </>
              )}

              {/* Tombol untuk Alert Biasa (Hanya OK) */}
              {modal.type === "alert" && (
                <button
                  onClick={() =>
                    setModal((prev) => ({ ...prev, isOpen: false }))
                  }
                  className="bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-900 transition"
                >
                  Mengerti
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
