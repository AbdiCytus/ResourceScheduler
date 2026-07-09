"use client";

import { useState, useEffect } from "react";
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

  type Modal = {
    isOpen: boolean;
    type: "alert" | "confirm" | "danger";
    title: string;
    message: string;
    onConfirm?: () => void;
  }

  // State untuk Alert/Confirm Modals
  const [modal, setModal] = useState<Modal>(
    { isOpen: false, type: "alert", title: "", message: ""}
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

      <UserTable
        users={initialUsers}
        currentUserId={currentUserId}
        onApprove={handleApproveClick}
        onDelete={handleDeleteClick}
        isLoading={isLoading}
      />

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
