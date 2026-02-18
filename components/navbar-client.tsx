"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
// [BARU] Import Profile Modal
import ProfileModal from "./profile-modal";

export default function NavbarClient({ user, role }: { user: any; role: any }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const isAdminActive = pathname.startsWith("/admin");

  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // [BARU] State untuk Profile Modal & Data Profile Real
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [realUsername, setRealUsername] = useState("");

  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    // Fetch Notifikasi
    const fetchNotif = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_read", false)
        .order("created_at", { ascending: false });

      if (data) {
        setNotifications(data);
        setUnreadCount(data.length);
      }
    };

    // [BARU] Fetch Real Username dari tabel profiles
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      if (data && data.username) {
        setRealUsername(data.username);
      } else {
        // Fallback ke bagian depan email jika username kosong
        setRealUsername(user.email?.split("@")[0] || "");
      }
    };

    fetchNotif();
    fetchProfile();

    const interval = setInterval(fetchNotif, 30000);
    return () => clearInterval(interval);
  }, [user, supabase]);

  const handleReadNotif = async () => {
    setShowNotif(!showNotif);
    if (unreadCount > 0) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id);
      setUnreadCount(0);
    }
  };

  return (
    <>
      {/* [BARU] Modal Profile diletakkan di sini */}
      {user && (
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          userEmail={user.email}
          initialUsername={realUsername}
        />
      )}

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

                {role === "admin" && (
                  <NavLink
                    href="/admin/resources"
                    activePath={pathname}
                    isSpecial
                    forceActive={isAdminActive}
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

              <div className="flex items-center gap-4">
                {/* Lonceng Notifikasi */}
                {user && (
                  <div className="relative">
                    <button
                      onClick={handleReadNotif}
                      className="relative p-2 text-slate-500 hover:text-indigo-600 transition outline-none"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                        />
                      </svg>
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Dropdown Notifikasi */}
                    {showNotif && (
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                        <div className="p-3 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                          <span className="font-bold text-xs text-slate-700">
                            Notifikasi
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Terbaru
                          </span>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {notifications.length > 0 ? (
                            notifications.map((n) => (
                              <div
                                key={n.id}
                                className={`p-3 border-b border-slate-50 transition ${
                                  n.type === "error"
                                    ? "bg-red-50/30"
                                    : "hover:bg-indigo-50/30"
                                }`}
                              >
                                <p
                                  className={`text-xs font-bold mb-0.5 ${
                                    n.type === "error"
                                      ? "text-red-700"
                                      : "text-slate-800"
                                  }`}
                                >
                                  {n.title}
                                </p>
                                <p className="text-[11px] text-slate-500 leading-tight">
                                  {n.message}
                                </p>
                                <p className="text-[9px] text-slate-400 mt-1 text-right">
                                  {new Date(n.created_at).toLocaleTimeString(
                                    "id-ID",
                                    { hour: "2-digit", minute: "2-digit" }
                                  )}
                                </p>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-xs text-slate-400">
                              Tidak ada notifikasi baru
                            </div>
                          )}
                        </div>
                        <Link
                          href="/portal/history"
                          className="block p-2 text-center text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition"
                        >
                          Lihat Riwayat Lengkap
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* [UPDATE] User Profile Section - Sekarang Clickable */}
                {user ? (
                  <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                    {/* BUTTON PROFILE TRIGGER */}
                    <button
                      onClick={() => setIsProfileOpen(true)}
                      className="hidden lg:flex flex-col items-end group cursor-pointer text-right"
                      title="Klik untuk edit profil"
                    >
                      {/* Gunakan Username Real jika ada, fallback ke email */}
                      <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition">
                        {realUsername || user.email?.split("@")[0]}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full group-hover:bg-indigo-100 transition">
                        {role}
                      </span>
                    </button>

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
    </>
  );
}

function NavLink({ href, children, activePath, isSpecial, forceActive }: any) {
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
