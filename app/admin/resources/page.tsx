import { createClient } from "@/utils/supabase/server";
import ResourceManagement from "./resource-management";

export default async function ResourcesPage() {
  const supabase = await createClient();

  // 1. Ambil semua data resource, jadwal kuliah, dan dosen
  const [{ data: resources }, { data: teachingSchedules }, { data: profilesWithRoles }] = await Promise.all([
    supabase
      .from("resources")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("teaching_schedules")
      .select("*")
      .order("day_of_week")
      .order("start_time"),
    supabase
      .from("profiles")
      .select("full_name, roles!inner(name)")
      .in("roles.name", ["dosen", "kajur"])
      .order("full_name"),
  ]);

  // Ekstrak nama-nama dosen & kajur
  const dosenList = (profilesWithRoles || [])
    .map((p) => p.full_name)
    .filter(Boolean);

  // 3. Filter Data untuk Tampilan UI (Hanya tampilkan resource yang aktif / belum di-soft delete)
  const now = new Date();
  const cleanResources =
    resources?.filter(
      (r) =>
        !r.scheduled_for_deletion_at ||
        new Date(r.scheduled_for_deletion_at) > now
    ) || [];



  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <ResourceManagement
          initialResources={cleanResources}
          teachingSchedules={teachingSchedules || []}
          dosenList={dosenList}
        />
      </div>
    </div>
  );
}
