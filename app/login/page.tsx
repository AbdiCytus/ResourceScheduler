"use client";

import { useState } from "react";
import { login, signup } from "./actions";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  // State untuk toggle Login/Register
  const [isRegister, setIsRegister] = useState(false);

  return (
    <div className="flex min-h-screen bg-white">
      {/* Kiri: Form Section */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 py-12">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
            {isRegister ? "Buat Akun Baru" : "Selamat Datang"}
          </h2>
          <p className="text-slate-500 mb-8">
            {isRegister
              ? "Lengkapi data diri Anda."
              : "Masuk untuk mengelola jadwal Anda."}
          </p>

          {message && (
            <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-700 text-sm rounded-r-md animate-pulse">
              {message}
            </div>
          )}

          <form className="space-y-5">
            {/* Field Tambahan untuk Register */}
            {isRegister && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    name="fullName"
                    type="text"
                    required
                    className="form-input w-full rounded-xl border-slate-300 p-3 bg-slate-50"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Username
                  </label>
                  <input
                    name="username"
                    type="text"
                    required
                    className="form-input w-full rounded-xl border-slate-300 p-3 bg-slate-50"
                    placeholder="johndoe123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Daftar Sebagai
                  </label>
                  <div className="relative">
                    <select
                      name="role"
                      required
                      className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-500 p-3 bg-slate-50 appearance-none"
                    >
                      <option value="user">User (Peminjam)</option>
                      <option value="supervisor">Supervisor (Pemantau)</option>
                      {/* Opsional: Izinkan daftar jadi Admin, atau sembunyikan jika berbahaya */}
                      <option value="admin">Admin (Pengelola)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                      ▼
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Role akan aktif setelah disetujui Admin.
                  </p>
                </div>
              </>
            )}

            {/* Field Login (Email/Username) vs Register (Email Only) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {isRegister ? "Email Address" : "Email atau Username"}
              </label>
              <input
                name={isRegister ? "email" : "identity"}
                type={isRegister ? "email" : "text"}
                required
                className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-500 p-3 bg-slate-50 transition-all"
                placeholder={
                  isRegister ? "nama@email.com" : "user@example.com / username"
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-500 p-3 bg-slate-50 transition-all"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-4 space-y-3">
              {isRegister ? (
                <button
                  formAction={signup}
                  className="w-full btn-primary justify-center shadow-lg shadow-indigo-200"
                >
                  Daftar Sekarang
                </button>
              ) : (
                <button
                  formAction={login}
                  className="w-full btn-primary justify-center shadow-lg shadow-indigo-200"
                >
                  Masuk
                </button>
              )}

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase">
                  Atau
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="w-full bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 font-medium py-2.5 rounded-xl transition-all"
              >
                {isRegister
                  ? "Sudah punya akun? Login"
                  : "Belum punya akun? Daftar"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Kanan: Visual Section */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 relative overflow-hidden items-center justify-center text-white p-12">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="relative z-10 max-w-lg text-center">
          <h1 className="text-4xl font-bold mb-6">
            {isRegister ? "Bergabung Bersama Kami" : "Smart Scheduling System"}
          </h1>
          <p className="text-indigo-100 text-lg">
            {isRegister
              ? "Daftarkan diri Anda untuk mulai mengatur jadwal penggunaan ruangan dan alat dengan mudah dan efisien."
              : '"Sistem yang tidak hanya mencatat jadwal, tapi berpikir untuk Anda. Prioritaskan yang penting, atur yang rutin."'}
          </p>
        </div>
      </div>
    </div>
  );
}
