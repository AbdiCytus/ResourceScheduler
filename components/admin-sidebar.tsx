"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
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

          {/* MENU 1: Resources */}
          <AdminNavLink
            href="/admin/resources"
            isActive={pathname === "/admin/resources"} // Cek URL
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            Resources & Alat
          </AdminNavLink>

          {/* MENU 2: Users */}
          <AdminNavLink
            href="/admin/users"
            isActive={pathname === "/admin/users"} // Cek URL
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
  );
}

// Komponen Link Kecil
function AdminNavLink({
  href,
  children,
  isActive,
}: {
  href: string;
  children: React.ReactNode;
  isActive: boolean;
}) {
  const baseClass =
    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group";

  // Style Aktif vs Non-Aktif
  const activeClass = isActive
    ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100 font-bold"
    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900";

  return (
    <Link href={href} className={`${baseClass} ${activeClass}`}>
      {children}
    </Link>
  );
}
