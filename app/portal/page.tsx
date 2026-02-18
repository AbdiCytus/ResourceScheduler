import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import CustomToast from "@/components/custom-toast";
import PortalClient from "./portal-client";

export const dynamic = "force-dynamic";

export default async function UserPortal({
  searchParams,
}: {
  searchParams: Promise<{ success: string; error: string }>;
}) {
  const supabase = await createClient();

  // 1. Auth Check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles (name)")
    .eq("id", user.id)
    .single();
  const roleName = (profile?.roles as any)?.name;
  const isSupervisor = roleName === "supervisor";

  // 2. Fetch Resources
  const { data: allResources } = await supabase
    .from("resources")
    .select("*")
    .order("name");

  // Filter resource yang sudah expired (delete logic)
  const now = new Date();
  const resources =
    allResources?.filter((res) => {
      if (!res.scheduled_for_deletion_at) return true;
      return new Date(res.scheduled_for_deletion_at) > now;
    }) || [];

  // 3. Fetch Schedules (Untuk Kalender & List)
  const { data: allSchedules } = await supabase
    .from("schedules")
    .select(
      `
      id, title, start_time, end_time, resource_id, priority_level, quantity_borrowed,
      resources(name), profiles(full_name)
    `
    )
    .eq("status", "approved")
    // Ambil jadwal 1 tahun ke belakang sampai masa depan (agar kalender tidak kosong saat back month)
    // Atau cukup aktif saja jika traffic tinggi. Disini saya ambil >= awal bulan ini
    .gte(
      "start_time",
      new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    )
    .order("start_time")
    .limit(500); // Limit keamanan

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 flex flex-col">
      <CustomToast />

      {/* Header Halaman (Tetap di Server Component) */}
      <div className="max-w-7xl mx-auto w-full mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Portal Peminjaman</h1>
        <p className="text-slate-500 mt-1">
          {isSupervisor
            ? "Mode Pemantauan Supervisor"
            : "Pilih ruangan atau cek jadwal kegiatan."}
        </p>
      </div>

      {/* Client Component (Tabs, Search, Calendar Logic) */}
      <div className="max-w-7xl mx-auto w-full flex-1">
        <PortalClient
          resources={resources}
          schedules={allSchedules || []}
          isSupervisor={isSupervisor}
        />
      </div>
    </div>
  );
}
