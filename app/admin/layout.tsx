import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminSidebar from "./admin-sidebar" // Import komponen sidebar

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
      {/* Panggil Sidebar Komponen */}
      <AdminSidebar />

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile Header (Hanya muncul di mobile untuk akses menu) */}
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
