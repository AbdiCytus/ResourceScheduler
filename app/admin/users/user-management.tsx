"use client";

import { useState, useEffect, useMemo } from "react";
import { approveUser, deleteUser } from "./actions";
import { UserProfile } from "@/types";
import ConfirmModal from "@/components/confirm-modal";
import CreateUserModal from "./create-user-modal";
import UserTable from "./user-table";

export default function UserManagement({
  initialUsers,
  currentUserId,
}: {
  initialUsers: UserProfile[];
  currentUserId: string;
}) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // const [searchTerm, setSearchTerm] = useState("");
  // const [roleFilter, setRoleFilter] = useState('all');

  // const filteredUsers = useMemo(() => {
  //   return initialUsers.filter((user) => {
  //     const matchesRole = roleFilter === 'all' || user.roles?.name === roleFilter;
  //     const searchLower = searchTerm.toLowerCase();
  //     const matchesSearch =
  //       (user.full_name?.toLowerCase().includes(searchLower)) ||
  //       (user.email.toLowerCase().includes(searchLower)) ||
  //       (user.username?.toLowerCase().includes(searchLower)) ||
  //       (user.nim?.toLowerCase().includes(searchLower));
  //     return matchesSearch && matchesRole;
  //   });
  // }, [initialUsers, searchTerm, roleFilter]);
  // const [currentPage, setCurrentPage] = useState(1);
  // const ITEMS_PER_PAGE = 10;

  // const sourceData = initialUsers;

  // const totalPages = Math.ceil(sourceData.length / ITEMS_PER_PAGE);
  // const paginatedUsers = useMemo(() => {
  //   const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  //   return sourceData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  // }, [sourceData, currentPage]);

  type Modal = {
    isOpen: boolean;
    type: "alert" | "confirm" | "danger";
    title: string;
    message: string;
    onConfirm?: () => void;
  }

  // State untuk Alert/Confirm Modals
  const [modal, setModal] = useState<Modal>(
    { isOpen: false, type: "alert", title: "", message: "" }
  );

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
                type: "danger", // Gunakan ConfirmModal style
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
    if (result?.error) {
      setModal({
        isOpen: true,
        type: "danger",
        title: "Error",
        message: result.error,
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Manajemen User</h1>
          <p className="text-slate-500 mt-1">
            Kelola akses dan persetujuan pengguna.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
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

      {/* <div className="flex gap-4 mb-6">
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari user..."
          className="border border-slate-300 rounded-lg px-4 py-2 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-4 py-2 w-[12%] max-w-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Semua Role</option>
          <option value="admin">Admin</option>
          <option value="kajur">Kajur</option>
          <option value="dosen">Dosen</option>
          <option value="mahasiswa">Mahasiswa</option>

        </select>
      </div> */}

      <UserTable
        users={initialUsers}
        currentUserId={currentUserId}
        onApprove={handleApproveClick}
        onDelete={handleDeleteClick}
        isLoading={isLoading}
      />

      {/* {totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 font-medium">
            Menampilkan halaman <span className="font-bold text-slate-900">{currentPage}</span> dari {totalPages}
            <span className="ml-2">(Total {sourceData.length} user)</span>
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-bold bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
            >
              ← Sebelumnya
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-bold bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
            >
              Selanjutnya →
            </button>
          </div>
        </div>
      )} */}


      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setModal({
            isOpen: true,
            type: "alert",
            title: "Berhasil",
            message: "User baru berhasil ditambahkan.",
          });
        }}
        onError={(error) => {
          setModal({
            isOpen: true,
            type: "danger",
            title: "Gagal",
            message: error,
          });
        }}
      />

      <ConfirmModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        confirmLabel={modal.type === "alert" ? "Tutup" : "Ya, Lanjutkan"}
        confirmVariant={modal.type === "danger" ? "danger" : "primary"}
        onConfirm={modal.onConfirm || (() => setModal((prev) => ({ ...prev, isOpen: false })))}
        onCancel={() => setModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
