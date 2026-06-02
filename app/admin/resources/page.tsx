import { createClient } from "@/utils/supabase/server";
import ResourceManagement from "./resource-management";

export default async function ResourcesPage() {
  const supabase = await createClient();

  // 1. Ambil semua data resource, jadwal kuliah, dan dosen
  const [{ data: resources }, { data: teachingSchedules }, { data: dosenProfiles }] = await Promise.all([
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
      .select("id, full_name")
      .eq("role", "dosen")
      .order("full_name"),
  ]);

  // 2. Logic Lazy Deletion
  const now = new Date();
  const resourcesToDelete = resources?.filter(
    (r) =>
      r.scheduled_for_deletion_at &&
      new Date(r.scheduled_for_deletion_at) <= now
  );

  if (resourcesToDelete && resourcesToDelete.length > 0) {
    const idsToDelete = resourcesToDelete.map((r) => r.id);
    await supabase.from("resources").delete().in("id", idsToDelete);
  }

  // 3. Filter Data untuk Tampilan UI
  const cleanResources =
    resources?.filter(
      (r) =>
        !r.scheduled_for_deletion_at ||
        new Date(r.scheduled_for_deletion_at) > now
    ) || [];

  const dosenList = (dosenProfiles || []).map((p) => p.full_name).filter(Boolean);

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
