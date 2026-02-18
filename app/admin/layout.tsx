import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // 1. Cek Login
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Cek Role Admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role_id !== 1) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-center p-4">
        <div className="bg-red-50 text-red-600 p-4 rounded-full mb-4">
          <svg
            className="w-10 h-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Akses Dibatasi</h1>
        <p className="text-slate-500 mt-2">
          Halaman ini khusus untuk Administrator.
        </p>
        <Link href="/portal" className="mt-6 text-indigo-600 hover:underline">
          Kembali ke Portal User
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-slate-50">
      {/* SIDEBAR (Desktop) */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col shadow-sm sticky top-16 h-[calc(100vh-64px)]">
        {/* Header Sidebar */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-200">
              A
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Admin Panel</h2>
              <p className="text-xs text-slate-500">Resource Manager</p>
            </div>
          </div>
        </div>

        {/* Menu Navigasi */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <div className="mb-4">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Utama
            </p>
            <AdminNavLink href="/admin/resources" active>
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              Resources & Alat
            </AdminNavLink>

            {/* Placeholder Link untuk fitur masa depan */}
            <AdminNavLink
              href="/admin/users"
              active={/* Logic cek pathname jika mau */ false}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              Manajemen User
            </AdminNavLink>
          </div>

          {/* BAGIAN LINK KE SUPERVISOR DIHAPUS DARI SINI */}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <Link
            href="/portal"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-white hover:text-indigo-600 hover:shadow-sm transition-all"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z"
              />
            </svg>
            Keluar dari Admin
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
        <div className="md:hidden bg-white border-b border-slate-200 p-4 mb-4 flex items-center justify-between sticky top-0 z-10">
          <span className="font-bold text-slate-800">Admin Panel</span>
          <Link
            href="/admin/resources"
            className="text-sm text-indigo-600 font-medium"
          >
            Menu
          </Link>
        </div>
        {children}
      </main>
    </div>
  );
}

function AdminNavLink({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  const baseClass =
    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group";
  const activeClass = active
    ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100"
    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900";

  return (
    <Link href={href} className={`${baseClass} ${activeClass}`}>
      {children}
    </Link>
  );
}
