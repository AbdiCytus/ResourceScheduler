"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/login/actions";

export default function NavbarClient({ user, role }: { user: any; role: any }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  // [BARU] Logika Cek Admin Active (True jika url diawali /admin)
  const isAdminActive = pathname.startsWith("/admin");

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm transition-all">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-110 transition-transform">
              S
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
              SmartScheduler
            </span>
          </Link>

          {/* MENU */}
          <div className="flex items-center gap-6">
            <div className="hidden md:flex space-x-2">
              {user && (
                <>
                  <NavLink href="/portal" activePath={pathname}>
                    Portal
                  </NavLink>

                  {role !== "supervisor" && (
                    <NavLink href="/portal/history" activePath={pathname}>
                      Riwayat
                    </NavLink>
                  )}
                </>
              )}

              {/* [UPDATE] Gunakan isAdminActive untuk override logic aktif */}
              {role === "admin" && (
                <NavLink
                  href="/admin/resources"
                  activePath={pathname}
                  isSpecial
                  forceActive={isAdminActive} // Prop baru
                >
                  Admin Panel
                </NavLink>
              )}

              {role === "supervisor" && (
                <NavLink href="/supervisor" activePath={pathname} isSpecial>
                  Dashboard
                </NavLink>
              )}
            </div>

            {/* User Profile / Login Button */}
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                  <div className="hidden lg:flex flex-col items-end">
                    <span className="text-sm font-semibold text-slate-700">
                      {user.email?.split("@")[0]}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {role}
                    </span>
                  </div>
                  <form action={signOut}>
                    <button className="text-sm text-slate-500 hover:text-red-600 font-medium transition-colors px-3 py-2 hover:bg-red-50 rounded-lg">
                      Sign Out
                    </button>
                  </form>
                </div>
              ) : (
                !isLoginPage && (
                  <Link
                    href="/login"
                    className="btn-primary text-sm shadow-md shadow-indigo-200"
                  >
                    Login
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

// [UPDATE] Tambahkan prop forceActive
function NavLink({
  href,
  children,
  activePath,
  isSpecial,
  forceActive,
}: {
  href: string;
  children: React.ReactNode;
  activePath: string;
  isSpecial?: boolean;
  forceActive?: boolean;
}) {
  // Jika forceActive true, maka anggap aktif. Jika tidak, cek kesamaan URL.
  const isActive =
    forceActive !== undefined ? forceActive : activePath === href;

  const baseClass =
    "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200";

  let activeClass = "";
  if (isActive) {
    activeClass = isSpecial
      ? "text-indigo-700 bg-indigo-100 ring-1 ring-indigo-200"
      : "text-indigo-600 bg-indigo-50 font-bold";
  } else {
    activeClass = isSpecial
      ? "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
      : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50";
  }

  return (
    <Link href={href} className={`${baseClass} ${activeClass}`}>
      {children}
    </Link>
  );
}
