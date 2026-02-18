"use client";

import { useState, useActionState, useEffect } from "react";
import { updateProfile } from "@/app/profile/actions";

type ProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  initialUsername: string;
};

export default function ProfileModal({
  isOpen,
  onClose,
  userEmail,
  initialUsername,
}: ProfileModalProps) {
  const [state, formAction, isPending] = useActionState(updateProfile, null);

  // State untuk Toggle Password Visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Tutup modal jika sukses
  useEffect(() => {
    if (state?.success) {
      // Delay sedikit agar user sempat baca pesan sukses
      setTimeout(() => {
        onClose();
        // Reset state (opsional, krn modal unmount)
        window.location.reload(); // Reload agar data navbar terupdate total
      }, 1000);
    }
  }, [state, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200 relative">
        {/* Tombol Close (X) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h2 className="text-xl font-bold mb-1 text-slate-900">Edit Profil</h2>
        <p className="text-slate-500 text-sm mb-6">
          Perbarui informasi akun Anda.
        </p>

        {/* Notifikasi Sukses/Error */}
        {state?.error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium mb-4 border border-red-200">
            ⚠️ {state.error}
          </div>
        )}
        {state?.success && (
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg text-sm font-medium mb-4 border border-emerald-200">
            ✅ {state.success}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          {/* Email (Readonly) */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Email
            </label>
            <input
              type="email"
              value={userEmail}
              readOnly
              disabled
              className="w-full rounded-xl p-3 bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Username
            </label>
            <input
              type="text"
              name="username"
              defaultValue={initialUsername}
              placeholder="Username baru..."
              className="w-full rounded-xl p-3 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <hr className="border-slate-100 my-2" />
          <p className="text-xs text-slate-400 italic">
            Kosongkan password jika tidak ingin mengganti.
          </p>

          {/* Password Baru */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Password Baru
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="******"
                className="w-full rounded-xl p-3 pr-12 focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition"
              >
                {showPassword ? (
                  // Icon Mata Coret (Hide)
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l18 18a.75.75 0 1 0 1.06-1.06l-18-18ZM22.676 12.553a11.249 11.249 0 0 1-2.631 4.31l-3.099-3.099a5.25 5.25 0 0 0-6.71-6.71L7.759 4.577a11.217 11.217 0 0 1 4.242-.827c4.97 0 9.185 3.223 10.675 7.69.105.315.05.73-.134 1.113ZM6.28 16.425a11.246 11.246 0 0 1-3.605-3.308.749.749 0 0 1 .066-1.042C4.198 10.298 7.393 8.356 10.375 7.85l-1.353 1.353a3.75 3.75 0 0 0 4.124 4.124l-1.353 1.353a2.25 2.25 0 0 1-2.738-2.738Z" />
                  </svg>
                ) : (
                  // Icon Mata (Show)
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                    <path
                      fillRule="evenodd"
                      d="M1.323 11.447C2.811 6.976 7.028 3.75 12 3.75s9.188 3.226 10.677 7.697a.75.75 0 0 1 0 .606c-1.489 4.471-5.706 7.697-10.677 7.697S2.811 16.124 1.323 11.653a.75.75 0 0 1 0-.606ZM12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Konfirmasi Password */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Konfirmasi Password
            </label>
            <div className="relative">
              <input
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="******"
                className="w-full rounded-xl p-3 pr-12 focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition"
              >
                {showConfirm ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l18 18a.75.75 0 1 0 1.06-1.06l-18-18ZM22.676 12.553a11.249 11.249 0 0 1-2.631 4.31l-3.099-3.099a5.25 5.25 0 0 0-6.71-6.71L7.759 4.577a11.217 11.217 0 0 1 4.242-.827c4.97 0 9.185 3.223 10.675 7.69.105.315.05.73-.134 1.113ZM6.28 16.425a11.246 11.246 0 0 1-3.605-3.308.749.749 0 0 1 .066-1.042C4.198 10.298 7.393 8.356 10.375 7.85l-1.353 1.353a3.75 3.75 0 0 0 4.124 4.124l-1.353 1.353a2.25 2.25 0 0 1-2.738-2.738Z" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                    <path
                      fillRule="evenodd"
                      d="M1.323 11.447C2.811 6.976 7.028 3.75 12 3.75s9.188 3.226 10.677 7.697a.75.75 0 0 1 0 .606c-1.489 4.471-5.706 7.697-10.677 7.697S2.811 16.124 1.323 11.653a.75.75 0 0 1 0-.606ZM12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Batal
            </button>
            <button type="submit" disabled={isPending} className="btn-primary">
              {isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
