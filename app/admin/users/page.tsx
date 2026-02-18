import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import UserManagementTable from "./user-table"; // Kita buat Client Component terpisah

export default async function AdminUsersPage() {
  const supabase = await createClient();

  // 1. Cek Admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Ambil Data User (Profiles)
  // Kita urutkan: Yang belum diapprove (is_approved = false) paling atas
  const { data: users } = await supabase
    .from("profiles")
    .select("*, roles(name)")
    .order("is_approved", { ascending: true }) // False dulu baru True
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Manajemen User
        </h1>
        <p className="text-slate-500 mb-8">
          Setujui user baru atau kelola user yang sudah ada.
        </p>

        <UserManagementTable initialUsers={users || []} />
      </div>
    </div>
  );
}
