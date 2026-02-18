"use client";

import { useState } from "react";
import { approveUser, deleteUser } from "./actions";

export default function UserManagementTable({
  initialUsers,
}: {
  initialUsers: any[];
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    if (!confirm("Setujui user ini agar bisa login?")) return;
    setLoadingId(id);
    await approveUser(id);
    setLoadingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus user ini? Data tidak bisa dikembalikan.")) return;
    setLoadingId(id);
    const res = await deleteUser(id);
    if (res.error) alert(res.error);
    setLoadingId(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500 font-bold tracking-wider">
          <tr>
            <th className="px-6 py-4">Nama & Username</th>
            <th className="px-6 py-4">Email</th>
            <th className="px-6 py-4">Role</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {initialUsers.map((u) => (
            <tr key={u.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <div className="font-bold text-slate-900">
                  {u.full_name || "Tanpa Nama"}
                </div>
                <div className="text-xs text-slate-500">
                  @{u.username || "-"}
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">{u.email}</td>
              <td className="px-6 py-4">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    u.roles?.name === "admin"
                      ? "bg-purple-100 text-purple-700"
                      : u.roles?.name === "supervisor"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {u.roles?.name || "User"}
                </span>
              </td>
              <td className="px-6 py-4">
                {u.is_approved ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>{" "}
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>{" "}
                    Pending
                  </span>
                )}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  {!u.is_approved && (
                    <button
                      onClick={() => handleApprove(u.id)}
                      disabled={loadingId === u.id}
                      className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
                    >
                      {loadingId === u.id ? "..." : "✔ Approve"}
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(u.id)}
                    disabled={loadingId === u.id}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition disabled:opacity-30"
                    title="Hapus User"
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
                </div>
              </td>
            </tr>
          ))}
          {initialUsers.length === 0 && (
            <tr>
              <td colSpan={5} className="p-8 text-center text-slate-400">
                Belum ada user terdaftar.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
