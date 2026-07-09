"use client";

import { useState } from "react";
import { createUser } from "./actions";

type CreateUserModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (error: string) => void;
};

export default function CreateUserModal({
  isOpen,
  onClose,
  onSuccess,
  onError,
}: CreateUserModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("mahasiswa");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setIsLoading(true);
    const result = await createUser(formData);
    setIsLoading(false);

    if (result?.error) {
      onError(result.error);
    } else {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 animate-in zoom-in duration-200">
        <h2 className="text-xl font-bold mb-6 text-slate-800">Tambah User Baru</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full rounded-xl p-3 border border-slate-200"
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
                className="w-full rounded-xl p-3 border border-slate-200"
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
              className="w-full rounded-xl p-3 border border-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Role
              </label>
              <select
                name="role"
                className="w-full rounded-xl p-3 border border-slate-200"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="mahasiswa">Mahasiswa</option>
                <option value="dosen">Dosen</option>
                <option value="kajur">Kajur (Ketua Jurusan)</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="Min. 6 karakter"
                  className="w-full rounded-xl p-3 pr-10 border border-slate-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                  tabIndex={-1}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
          </div>

          {selectedRole === "mahasiswa" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  NIM
                </label>
                <input
                  type="text"
                  name="nim"
                  required
                  placeholder="Masukkan NIM"
                  className="w-full rounded-xl p-3 border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Prodi
                </label>
                <select name="prodi" required className="w-full rounded-xl p-3 border border-slate-200">
                  <option>Teknik Informatika</option>
                  <option>SIKC</option>
                  <option>Listrik</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Batal
            </button>
            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? "Menyimpan..." : "Buat User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
