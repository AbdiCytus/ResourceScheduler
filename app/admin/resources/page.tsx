import { createClient } from "@/utils/supabase/server";
import ResourceManagement from "./resource-management";

export default async function ResourcesPage() {
  const supabase = await createClient();

  // 1. Ambil data (Filter Soft Delete)
  const { data: resources } = await supabase
    .from("resources")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // 2. Logic Lazy Finalization (Pembersihan Otomatis)
  const now = new Date();
  const resourcesToFinalize = resources?.filter(
    (r) =>
      r.scheduled_for_deletion_at && new Date(r.scheduled_for_deletion_at) < now
  );

  if (resourcesToFinalize && resourcesToFinalize.length > 0) {
    const idsToFinalize = resourcesToFinalize.map((r) => r.id);
    await supabase
      .from("resources")
      .update({
        deleted_at: now.toISOString(),
        scheduled_for_deletion_at: null,
      })
      .in("id", idsToFinalize);
  }

  const cleanResources =
    resources?.filter(
      (r) =>
        !r.scheduled_for_deletion_at ||
        new Date(r.scheduled_for_deletion_at) >= now
    ) || [];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* JUDUL DIHAPUS DARI SINI, PINDAH KE CLIENT COMPONENT */}

        <ResourceManagement initialResources={cleanResources} />
      </div>
    </div>
  );
}
