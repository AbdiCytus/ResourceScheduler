import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // 1. Cek apakah user login
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Cek apakah role-nya Admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role_id")
    .eq("id", user.id)
    .single();

  // role_id 1 = admin (sesuai database kita)
  if (!profile || profile.role_id !== 1) {
    return (
      <div className="flex h-screen items-center justify-center">
        <h1 className="text-2xl font-bold text-red-600">403 - Forbidden: Access Denied</h1>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar Sederhana */}
      <aside className="w-64 bg-slate-800 text-white p-6">
        <h2 className="text-2xl font-bold mb-8">Admin Panel</h2>
        <nav className="space-y-4">
          <Link href="/admin/resources" className="block hover:text-blue-300">
            Manajemen Resource
          </Link>
          <Link href="/admin/schedules" className="block hover:text-blue-300">
            Jadwal Masuk (Soon)
          </Link>
          <Link href="/" className="block text-gray-400 mt-8 pt-4 border-t border-gray-700">
            ← Kembali ke Home
          </Link>
        </nav>
      </aside>

      {/* Konten Utama */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}