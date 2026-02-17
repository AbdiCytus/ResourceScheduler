import { createClient } from "@/utils/supabase/server";
import ResourceManagement from "./resource-management";

export default async function ResourcesPage() {
  const supabase = await createClient();

  // 1. Ambil data: KECUALIKAN yang sudah soft-deleted (deleted_at IS NOT NULL)
  const { data: resources } = await supabase
    .from("resources")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // 2. Logic "Lazy Finalization" (Pembersihan Otomatis)
  // Cek apakah ada resource 'Segera Dihapus' yang waktunya SUDAH LEWAT
  const now = new Date();

  // Cari resource yang harus difinalisasi penghapusannya
  const resourcesToFinalize = resources?.filter(
    (r) =>
      r.scheduled_for_deletion_at && new Date(r.scheduled_for_deletion_at) < now
  );

  if (resourcesToFinalize && resourcesToFinalize.length > 0) {
    const idsToFinalize = resourcesToFinalize.map((r) => r.id);

    // Update DB: Set deleted_at = NOW (Soft Delete Permanen)
    await supabase
      .from("resources")
      .update({
        deleted_at: now.toISOString(),
        scheduled_for_deletion_at: null,
      })
      .in("id", idsToFinalize);
  }

  // 3. Filter data untuk Client Component
  // Kita buang data yang barusan kita hapus agar UI bersih tanpa perlu refresh
  const cleanResources =
    resources?.filter(
      (r) =>
        !r.scheduled_for_deletion_at ||
        new Date(r.scheduled_for_deletion_at) >= now
    ) || [];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Manajemen Sumber Daya
            </h1>
            <p className="text-slate-500 mt-1">
              Kelola ruangan dan peralatan kantor.
            </p>
          </div>
        </div>

        {/* Panggil Client Component */}
        <ResourceManagement initialResources={cleanResources} />
      </div>
    </div>
  );
}
