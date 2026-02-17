import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "@/app/login/actions"; // 1. Pastikan import ini ada

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("roles (name)")
      .eq("id", user.id)
      .single();
    role = (profile?.roles as any)?.name;
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* ... Bagian Logo & Menu Kiri (Sama seperti sebelumnya) ... */}
          <div className="flex">
            <Link href="/" className="shrink-0 flex items-center">
              <span className="text-xl font-bold text-indigo-600">
                SmartScheduler
              </span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {/* ... Link menu Portal, Admin, dll ... */}
              {user && (
                <Link
                  href="/portal"
                  className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
                >
                  Portal
                </Link>
              )}
              {user && (
                <Link
                  href="/portal/history"
                  className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
                >
                  Riwayat
                </Link>
              )}
              {role === "admin" && (
                <Link
                  href="/admin/resources"
                  className="text-red-600 inline-flex items-center px-1 pt-1 text-sm font-medium"
                >
                  Admin
                </Link>
              )}
              {role === "supervisor" && (
                <Link
                  href="/supervisor"
                  className="text-yellow-600 inline-flex items-center px-1 pt-1 text-sm font-medium"
                >
                  Supervisor
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500 hidden md:block">
                  Hai, {user.email?.split("@")[0]}
                </span>

                {/* 2. UPDATE BAGIAN INI: Gunakan action={signOut} */}
                <form action={signOut}>
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-md text-sm font-medium transition">
                    Logout
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
