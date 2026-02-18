"use client";

import { useState } from "react";
import { createUser, approveUser, deleteUser } from "./actions";

type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  username: string;
  role_id: number;
  roles: { name: string } | null; // Join relation
  is_approved: boolean;
  created_at: string;
};

export default function UserManagement({
  initialUsers,
}: {
  initialUsers: UserProfile[];
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // State untuk Modal Confirm/Alert (Kita reuse pola sebelumnya)
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: "alert" | "confirm" | "danger";
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ isOpen: false, type: "alert", title: "", message: "" });

  // HANDLER: TAMBAH USER
  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    setIsLoading(true);
    const result = await createUser(formData);
    setIsLoading(false);

    if (result?.error) {
      setModal({
        isOpen: true,
        type: "alert",
        title: "Gagal",
        message: result.error,
      });
    } else {
      setIsModalOpen(false);
      setModal({
        isOpen: true,
        type: "alert",
        title: "Berhasil",
        message: "User baru berhasil ditambahkan.",
      });
    }
  };

  // HANDLER: HAPUS USER
  const handleDeleteClick = (id: string, name: string) => {
    setModal({
      isOpen: true,
      type: "danger",
      title: "Hapus User?",
      message: `Anda yakin ingin menghapus user "${name}"? Data login dan profil akan hilang permanen.`,
      onConfirm: async () => {
        setIsLoading(true);
        const result = await deleteUser(id);
        setIsLoading(false);
        setModal((prev) => ({ ...prev, isOpen: false }));

        if (result?.error) {
          setTimeout(
            () =>
              setModal({
                isOpen: true,
                type: "alert",
                title: "Error",
                message: result.error!,
              }),
            300
          );
        }
      },
    });
  };

  // HANDLER: APPROVE USER
  const handleApproveClick = async (id: string) => {
    setIsLoading(true);
    const result = await approveUser(id);
    setIsLoading(false);
    if (result?.error) alert(result.error);
  };

  return (
    <div>
      {/* HEADER: Judul + Tombol Tambah */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Manajemen User</h1>
          <p className="text-slate-500 mt-1">
            Kelola akses dan persetujuan pengguna.
          </p>
        </div>

        {/* TOMBOL TAMBAH USER (Posisi di sebelah judul/header) */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2 shadow-indigo-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M6.25 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM3.25 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM19.75 7.5a.75.75 0 0 0-1.5 0v2.25H16a.75.75 0 0 0 0 1.5h2.25v2.25a.75.75 0 0 0 1.5 0v-2.25H22a.75.75 0 0 0 0-1.5h-2.25V7.5Z" />
          </svg>
          <span className="font-bold">Tambah User</span>
        </button>
      </div>

      {/* TABEL USER */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500 font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">Nama & Email</th>
              <th className="px-6 py-4">Username</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {initialUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-slate-900">
                    {user.full_name || "Tanpa Nama"}
                  </div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                  @{user.username || "-"}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                      user.role_id === 1
                        ? "bg-red-100 text-red-700"
                        : user.role_id === 3
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {user.roles?.name || "User"}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  {user.is_approved ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">
                      Aktif
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApproveClick(user.id)}
                      disabled={isLoading}
                      className="text-[10px] bg-orange-100 text-orange-700 hover:bg-orange-200 px-3 py-1 rounded-full font-bold border border-orange-200 transition"
                    >
                      {isLoading ? "..." : "Setujui?"}
                    </button>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDeleteClick(user.id, user.full_name)}
                    className="text-red-600 hover:bg-red-50 p-2 rounded transition"
                    title="Hapus User"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MODAL FORM CREATE USER --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 animate-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-6 text-slate-800">
              Tambah User Baru
            </h2>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    placeholder="John Doe"
                    className="w-full rounded-xl p-3"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    required
                    placeholder="johndoe"
                    className="w-full rounded-xl p-3"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="user@company.com"
                  className="w-full rounded-xl p-3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Role
                  </label>
                  <select name="role" className="w-full rounded-xl p-3">
                    <option value="user">User (Staff)</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Password
                  </label>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="******"
                    className="w-full rounded-xl p-3"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary"
                >
                  {isLoading ? "Menyimpan..." : "Buat User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL CONFIRM/ALERT --- */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-2xl">
            <div
              className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl ${
                modal.type === "danger"
                  ? "bg-red-50 text-red-500"
                  : "bg-indigo-50 text-indigo-500"
              }`}
            >
              {modal.type === "danger" ? "⚠️" : "ℹ️"}
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-900">
              {modal.title}
            </h3>
            <p className="text-slate-500 text-sm mb-6">{modal.message}</p>
            <div className="flex justify-center gap-3">
              {(modal.type === "confirm" || modal.type === "danger") && (
                <button
                  onClick={() =>
                    setModal((prev) => ({ ...prev, isOpen: false }))
                  }
                  className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Batal
                </button>
              )}
              {modal.onConfirm ? (
                <button
                  onClick={modal.onConfirm}
                  disabled={isLoading}
                  className={`px-5 py-2.5 text-white rounded-xl font-bold shadow-lg ${
                    modal.type === "danger"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-indigo-600"
                  }`}
                >
                  {isLoading ? "Memproses..." : "Ya, Lanjutkan"}
                </button>
              ) : (
                <button
                  onClick={() =>
                    setModal((prev) => ({ ...prev, isOpen: false }))
                  }
                  className="bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold"
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
