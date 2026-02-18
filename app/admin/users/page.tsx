import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import UserManagement from "./user-management";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  // Cek Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Ambil data users & roles
  const { data: users, error } = await supabase
    .from("profiles")
    .select("*, roles(name)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
    return <div className="p-10 text-red-500">Gagal memuat data user.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Render Client Component */}
        <UserManagement initialUsers={users || []} />
      </div>
    </div>
  );
}
