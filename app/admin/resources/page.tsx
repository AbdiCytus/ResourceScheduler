import { createClient } from "@/utils/supabase/server";
import ResourceManagement from "./resource-management";

export default async function ResourcesPage() {
  const supabase = await createClient();

  // 1. Ambil semua data resource
  const { data: resources } = await supabase
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });

  // 2. Logic Lazy Deletion (Pembersihan Otomatis)
  // Cek apakah ada resource yang jadwal penghapusannya sudah LEWAT dari sekarang
  const now = new Date();

  // Filter resource yang: (punya jadwal hapus) DAN (waktunya <= sekarang)
  const resourcesToDelete = resources?.filter(
    (r) =>
      r.scheduled_for_deletion_at &&
      new Date(r.scheduled_for_deletion_at) <= now
  );

  if (resourcesToDelete && resourcesToDelete.length > 0) {
    const idsToDelete = resourcesToDelete.map((r) => r.id);

    // Eksekusi Hapus Permanen di Database
    await supabase.from("resources").delete().in("id", idsToDelete);
  }

  // 3. Filter Data untuk Tampilan UI
  // Jangan tampilkan resource yang baru saja dihapus atau yang memang sudah lewat waktunya
  const cleanResources =
    resources?.filter(
      (r) =>
        !r.scheduled_for_deletion_at ||
        new Date(r.scheduled_for_deletion_at) > now
    ) || [];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <ResourceManagement initialResources={cleanResources} />
      </div>
    </div>
  );
}
