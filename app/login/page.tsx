import { login, signup } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div className="flex min-h-screen bg-white">
      {/* Kiri: Form Section */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 py-12">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
            Selamat Datang
          </h2>
          <p className="text-slate-500 mb-8">
            Masuk untuk mengelola jadwal Anda.
          </p>

          {message && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-md animate-pulse">
              {message}
            </div>
          )}

          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                required
                className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all p-3 bg-slate-50"
                placeholder="nama@email.com"
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
                className="w-full rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all p-3 bg-slate-50"
                placeholder="••••••••"
              />
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <button
                formAction={login}
                className="w-full btn-primary text-center justify-center"
              >
                Log In
              </button>
              <button
                formAction={signup}
                className="w-full bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 font-medium py-2.5 rounded-xl transition-all"
              >
                Daftar Akun Baru
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Kanan: Visual Section (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 relative overflow-hidden items-center justify-center text-white p-12">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="relative z-10 max-w-lg text-center">
          <h1 className="text-4xl font-bold mb-6">Smart Scheduling System</h1>
          <p className="text-indigo-100 text-lg">
            "Sistem yang tidak hanya mencatat jadwal, tapi berpikir untuk Anda.
            Prioritaskan yang penting, atur yang rutin."
          </p>
        </div>
      </div>
    </div>
  );
}
