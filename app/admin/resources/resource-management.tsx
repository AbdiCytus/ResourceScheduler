"use client";

import { useState, useEffect } from "react";
import { createResource, updateResource, deleteResource, forceDeleteResource, toggleTeachingScheduleStatus } from "./actions";
import TeachingScheduleModal, { type TeachingSchedule } from "./teaching-schedule-modal";

const DAY_NAMES: Record<number, string> = {
  1: "Sen", 2: "Sel", 3: "Rab", 4: "Kam", 5: "Jum",
};

// Badge waktu per jadwal dengan toggle is_offline
function ScheduleBadge({ schedule }: { schedule: TeachingSchedule }) {
  const [isOffline, setIsOffline] = useState(schedule.is_offline);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    const newVal = !isOffline;
    const res = await toggleTeachingScheduleStatus(schedule.id, newVal);
    if (!res?.error) setIsOffline(newVal);
    setLoading(false);
  };

  return (
    <div
      title={`${schedule.matakuliah} – ${schedule.kelas}\n${isOffline ? "Kelas Aktif" : "Dosen tidak hadir (Kosong)"}`}
      className={`group flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-mono font-bold cursor-default transition ${
        isOffline
          ? "bg-rose-50 border-rose-200 text-rose-700"
          : "bg-emerald-50 border-emerald-200 text-emerald-700"
      }`}
    >
      <span>{schedule.start_time.slice(0, 5)}–{schedule.end_time.slice(0, 5)}</span>
      <button
        onClick={handleToggle}
        disabled={loading}
        title={isOffline ? "Tandai Kosong" : "Tandai Aktif"}
        className={`w-3.5 h-3.5 rounded-full border transition opacity-60 group-hover:opacity-100 ${
          isOffline ? "bg-rose-400 border-rose-500" : "bg-emerald-400 border-emerald-500"
        } disabled:opacity-30 flex items-center justify-center`}
      >
        <span className="sr-only">toggle</span>
      </button>
    </div>
  );
}

// Kolom jadwal: grouped by day, compact
function ScheduleColumn({
  schedules,
  onManage,
}: {
  schedules: TeachingSchedule[];
  onManage: () => void;
}) {
  if (schedules.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 italic">Belum ada jadwal</span>
        <button onClick={onManage} className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-50 transition">
          + Tambah
        </button>
      </div>
    );
  }

  const grouped = [1, 2, 3, 4, 5].reduce<Record<number, TeachingSchedule[]>>((acc, d) => {
    const day = schedules.filter((s) => s.day_of_week === d);
    if (day.length > 0) acc[d] = day;
    return acc;
  }, {});

  return (
    <div className="space-y-1.5">
      {/* Per day groups — badge Aktif/Kosong inline di samping nama hari */}
      {Object.entries(grouped).map(([dayStr, daySchedules]) => {
        const dayActive = (daySchedules as TeachingSchedule[]).filter((s) => s.is_offline).length;
        const dayEmpty = (daySchedules as TeachingSchedule[]).filter((s) => !s.is_offline).length;
        return (
          <div key={dayStr} className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold text-slate-400 w-6 shrink-0 pt-0.5">{DAY_NAMES[Number(dayStr)]}</span>
            <div className="flex flex-wrap gap-1 flex-1">
              {(daySchedules as TeachingSchedule[]).map((s) => <ScheduleBadge key={s.id} schedule={s} />)}
            </div>
            {/* Mini summary inline */}
            <div className="flex gap-0.5 shrink-0">
              {dayActive > 0 && (
                <span className="text-[8px] font-bold bg-rose-50 text-rose-500 border border-rose-100 px-1 py-0.5 rounded-full">{dayActive}A</span>
              )}
              {dayEmpty > 0 && (
                <span className="text-[8px] font-bold bg-emerald-50 text-emerald-500 border border-emerald-100 px-1 py-0.5 rounded-full">{dayEmpty}K</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}


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

type ModalConfig = {
  isOpen: boolean;
  type: "confirm" | "alert" | "danger";
  title: string;
  message: string;
  onConfirm?: () => void;
};

export default function ResourceManagement({
  initialResources,
  teachingSchedules,
  dosenList,
}: {
  initialResources: Resource[];
  teachingSchedules: TeachingSchedule[];
  dosenList: string[];
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // State untuk modal jadwal kuliah
  const [scheduleModal, setScheduleModal] = useState<{
    isOpen: boolean;
    resourceId: string;
    resourceName: string;
  }>({ isOpen: false, resourceId: "", resourceName: "" });

  const [modal, setModal] = useState<ModalConfig>({
    isOpen: false, type: "alert", title: "", message: "",
  });

  // Lock scroll saat modal apapun terbuka
  const anyModalOpen = isFormOpen || scheduleModal.isOpen || modal.isOpen;
  useEffect(() => {
    document.body.style.overflow = anyModalOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [anyModalOpen]);

  const openCreateForm = () => {
    setFormMode("create");
    setSelectedResource(null);
    setIsFormOpen(true);
  };

  const openEditForm = (res: Resource) => {
    setFormMode("edit");
    setSelectedResource(res);
    setIsFormOpen(true);
  };

  const handleSaveClick = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setModal({
      isOpen: true, type: "confirm",
      title: formMode === "create" ? "Tambah Ruangan?" : "Simpan Perubahan?",
      message: "Pastikan data yang Anda masukkan sudah benar.",
      onConfirm: async () => {
        setIsLoading(true);
        const result = formMode === "create"
          ? await createResource(formData)
          : await updateResource(formData);
        setIsLoading(false);
        setModal((prev) => ({ ...prev, isOpen: false }));
        if (result?.error) {
          setTimeout(() => setModal({ isOpen: true, type: "alert", title: "Gagal", message: result.error! }), 300);
        } else {
          setIsFormOpen(false);
        }
      },
    });
  };

  const handleDeleteClick = (id: string) => {
    setModal({
      isOpen: true, type: "danger",
      title: "Hapus Ruangan?",
      message: "Jika ada jadwal aktif, ruangan akan antri penghapusan hingga jadwal selesai.",
      onConfirm: async () => {
        setIsLoading(true);
        const result = await deleteResource(id);
        setIsLoading(false);
        setModal((prev) => ({ ...prev, isOpen: false }));
        if (result?.warning) {
          setTimeout(() => setModal({ isOpen: true, type: "alert", title: "Info", message: (result as any).message }), 300);
        } else if (result?.error) {
          setTimeout(() => setModal({ isOpen: true, type: "alert", title: "Gagal", message: result.error! }), 300);
        }
      },
    });
  };

  const handleForceDeleteClick = (id: string) => {
    setModal({
      isOpen: true, type: "danger",
      title: "Paksa Hapus Ruangan?",
      message: "Ini akan MENGHAPUS ruangan secara permanen dan MEMBATALKAN semua jadwal yang masih tersisa secara paksa. Lanjutkan?",
      onConfirm: async () => {
        setIsLoading(true);
        const result = await forceDeleteResource(id);
        setIsLoading(false);
        setModal((prev) => ({ ...prev, isOpen: false }));
        if (result?.error) {
          setTimeout(() => setModal({ isOpen: true, type: "alert", title: "Gagal", message: result.error! }), 300);
        } else {
          setTimeout(() => setModal({ isOpen: true, type: "alert", title: "Berhasil", message: "Ruangan dan jadwal terkait telah dihapus." }), 300);
        }
      },
    });
  };

  return (
    <div>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Manajemen Ruangan</h1>
          <p className="text-slate-500 mt-1">Kelola ruangan kelas Gedung H beserta jadwal kuliahnya.</p>
        </div>
        <button onClick={openCreateForm} className="btn-primary flex items-center gap-2 shadow-indigo-200">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
          </svg>
          <span className="font-bold">Tambah Ruangan</span>
        </button>
      </div>

      {/* TABEL */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500 font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">Nama Ruangan</th>
              <th className="px-6 py-4">Kapasitas</th>
              <th className="px-6 py-4">Fasilitas</th>
              <th className="px-6 py-4">Jadwal Kuliah</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {initialResources.length === 0 && (
              <tr>
                <td colSpan={5} className="py-16 text-center text-slate-400 text-sm">
                  Belum ada ruangan. Klik "Tambah Ruangan" untuk memulai.
                </td>
              </tr>
            )}
            {initialResources.map((res) => {
              const isPendingDelete = !!res.scheduled_for_deletion_at;
              const roomSchedules = teachingSchedules.filter((s) => s.resource_id === res.id);
              return (
                <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">{res.name}</p>
                    {res.description && <p className="text-xs text-slate-400 mt-0.5">{res.description}</p>}
                    {isPendingDelete && (
                      <span className="text-[10px] text-red-500 font-bold animate-pulse">⏳ SEGERA DIHAPUS</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm">{res.capacity} Org</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {res.facilities?.map((f, i) => (
                        <span key={i} className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">{f}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <ScheduleColumn
                      schedules={roomSchedules}
                      onManage={() => setScheduleModal({ isOpen: true, resourceId: res.id, resourceName: res.name })}
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      {/* Kelola Jadwal Kuliah */}
                      <button
                        onClick={() => setScheduleModal({ isOpen: true, resourceId: res.id, resourceName: res.name })}
                        disabled={isPendingDelete}
                        title="Kelola Jadwal Kuliah"
                        className="text-indigo-500 p-2 hover:bg-indigo-50 rounded-lg transition disabled:opacity-30"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                        </svg>
                      </button>
                      {/* Edit Ruangan */}
                      <button onClick={() => openEditForm(res)} disabled={isPendingDelete}
                        className="text-slate-500 p-2 hover:bg-slate-100 rounded-lg transition disabled:opacity-30" title="Edit Ruangan">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                      </button>
                      {/* Hapus Ruangan */}
                      {!isPendingDelete ? (
                        <button onClick={() => handleDeleteClick(res.id)}
                          className="text-red-500 p-2 hover:bg-red-50 rounded-lg transition" title="Hapus Ruangan">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      ) : (
                        <button onClick={() => handleForceDeleteClick(res.id)}
                          className="text-white bg-red-600 p-2 hover:bg-red-700 rounded-lg transition shadow-md shadow-red-200" title="Paksa Hapus Ruangan (Batalkan semua jadwal)">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
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

      {/* MODAL FORM RUANGAN */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <h2 className="text-xl font-bold mb-6 text-slate-800">
              {formMode === "create" ? "Tambah Ruangan" : "Edit Ruangan"}
            </h2>
            <form onSubmit={handleSaveClick} className="space-y-4">
              {formMode === "edit" && <input type="hidden" name="id" value={selectedResource?.id} />}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Ruangan</label>
                <input type="text" name="name" required defaultValue={selectedResource?.name}
                  placeholder="Contoh: H-101" className="w-full rounded-xl p-3 border border-slate-200 text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kapasitas (Orang)</label>
                <input type="number" name="capacity" required defaultValue={selectedResource?.capacity || 30}
                  min={1} className="w-full rounded-xl p-3 border border-slate-200 text-sm" />
              </div>

              <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                <label className="block text-xs font-bold text-indigo-700 uppercase mb-1">Fasilitas (Tag)</label>
                <textarea name="facilities" rows={2}
                  defaultValue={selectedResource?.facilities?.join(", ") || ""}
                  placeholder="Contoh: AC, Proyektor, Whiteboard"
                  className="w-full rounded-lg bg-white border-indigo-200 p-3 text-sm" />
                <p className="text-[10px] text-indigo-500 mt-1">Pisahkan dengan tanda koma (,).</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Deskripsi</label>
                <input type="text" name="description" defaultValue={selectedResource?.description || ""}
                  className="w-full rounded-xl p-3 border border-slate-200 text-sm" />
              </div>

              {formMode === "edit" && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="is_active" id="is_active"
                    defaultChecked={selectedResource?.is_active} className="w-4 h-4 text-indigo-600 rounded" />
                  <label htmlFor="is_active" className="text-sm font-medium text-slate-700">Set Aktif</label>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition text-sm">Batal</button>
                <button type="submit" disabled={isLoading} className="btn-primary text-sm">
                  {isLoading ? "Menyimpan..." : formMode === "create" ? "Buat Ruangan" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL JADWAL KULIAH */}
      {scheduleModal.isOpen && (
        <TeachingScheduleModal
          resourceId={scheduleModal.resourceId}
          resourceName={scheduleModal.resourceName}
          schedules={teachingSchedules.filter((s) => s.resource_id === scheduleModal.resourceId)}
          dosenList={dosenList}
          onClose={() => setScheduleModal({ isOpen: false, resourceId: "", resourceName: "" })}
        />
      )}

      {/* MODAL KONFIRMASI & ALERT */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-2xl">
            <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl ${
              modal.type === "danger" || modal.title.includes("Gagal") ? "bg-red-50" : "bg-indigo-50"
            }`}>
              {modal.type === "danger" || modal.title.includes("Gagal") ? "⚠️" : "ℹ️"}
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-900">{modal.title}</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">{modal.message}</p>
            <div className="flex justify-center gap-3">
              {(modal.type === "confirm" || modal.type === "danger") && (
                <>
                  <button onClick={() => setModal((p) => ({ ...p, isOpen: false }))}
                    className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition">Batal</button>
                  <button onClick={modal.onConfirm} disabled={isLoading}
                    className={`px-5 py-2.5 text-white rounded-xl font-bold transition ${
                      modal.type === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"
                    }`}>
                    {isLoading ? "Memproses..." : "Ya, Lanjutkan"}
                  </button>
                </>
              )}
              {modal.type === "alert" && (
                <button onClick={() => setModal((p) => ({ ...p, isOpen: false }))}
                  className="bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-900 transition">Mengerti</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
