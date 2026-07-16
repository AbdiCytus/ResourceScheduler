"use client";

import { UserProfile } from "@/types";

type UserTableProps = {
  users: UserProfile[];
  currentUserId: string;
  onApprove: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  isLoading: boolean;
};

export default function UserTable({
  users,
  currentUserId,
  onApprove,
  onDelete,
  isLoading,
}: UserTableProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500 font-bold tracking-wider">
          <tr>
            <th className="px-6 py-4">Nama & Email</th>
            <th className="px-6 py-4">Username</th>
            <th className="px-6 py-4">Role</th>
            <th className="px-6 py-4">NIM & Prodi</th>
            <th className="px-6 py-4">Kelas</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((user) => (
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
                    user.roles?.name === "admin"
                      ? "bg-red-100 text-red-700"
                      : user.roles?.name === "kajur"
                      ? "bg-purple-100 text-purple-700"
                      : user.roles?.name === "dosen"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-blue-100 text-blue-700" // mahasiswa
                  }`}
                >
                  {user.roles?.name || "Tidak Terdaftar"}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">
                {user.roles?.name === "mahasiswa" || user.role_id === 2 ? (
                  <div>
                    <div className="font-bold text-slate-900">{user.nim || "-"}</div>
                    <div className="text-xs text-slate-500">{user.prodi || "-"}</div>
                  </div>
                ) : (
                  <span className="text-slate-400 italic">Role tidak menggunakan NIM & Prodi</span>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">
                {user.roles?.name === "mahasiswa" || user.role_id === 2 ? (
                  <div>
                    <div className="font-bold text-slate-900">{user.kelas || "-"}</div>
                  </div>
                ) : (
                  <span className="text-slate-400 italic">Role tidak menggunakan Kelas</span>
                )}
              </td>
              <td className="px-6 py-4 text-center">
                {user.is_approved ? (
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">
                    Aktif
                  </span>
                ) : (
                  <button
                    onClick={() => onApprove(user.id)}
                    disabled={isLoading}
                    className="text-[10px] bg-orange-100 text-orange-700 hover:bg-orange-200 px-3 py-1 rounded-full font-bold border border-orange-200 transition"
                  >
                    Setujui?
                  </button>
                )}
              </td>
              <td className="px-6 py-4 text-right">
                {user.id !== currentUserId && (
                  <button
                    onClick={() => onDelete(user.id, user.full_name)}
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
                )}
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                Tidak ada user ditemukan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
