import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import CalendarView from "@/components/calendar-view";
import CustomToast from "@/components/custom-toast";

// [FIX 1] Paksa halaman ini selalu render ulang (no-cache) agar data sinkron dengan Admin
export const dynamic = "force-dynamic";

export default async function UserPortal({
  searchParams,
}: {
  searchParams: Promise<{ success: string; error: string }>;
}) {
  const supabase = await createClient();

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

  // [FIX 2] Hapus filter .is("deleted_at", null) karena kita pakai scheduled_for_deletion_at
  // Ambil semua resource terlebih dahulu
  const { data: allResources } = await supabase
    .from("resources")
    .select("*")
    .order("name");

  // [FIX 3] Filter Manual: Sembunyikan resource yang waktu hapusnya SUDAH LEWAT
  // Ini menangani kasus jika Admin belum visit dashboard (DB belum delete), tapi di Portal harusnya sudah hilang.
  const now = new Date();
  const resources = allResources?.filter((res) => {
    // Jika tidak ada jadwal hapus, tampilkan
    if (!res.scheduled_for_deletion_at) return true;

    // Jika ada jadwal hapus, cek apakah MASIH di masa depan?
    // Jika waktu hapus > sekarang, berarti belum waktunya dihapus (Masih tampil sebagai "Segera Dihapus")
    // Jika waktu hapus < sekarang, berarti sudah expired (Sembunyikan)
    return new Date(res.scheduled_for_deletion_at) > now;
  });

  const { data: allSchedules } = await supabase
    .from("schedules")
    .select(
      `
      id, title, start_time, end_time, resource_id, priority_level, 
      resources(name), profiles(full_name)
    `
    )
    .eq("status", "approved")
    .gte("start_time", new Date().toISOString())
    .order("start_time")
    .limit(100);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <CustomToast />

      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Portal Peminjaman
            </h1>
            <p className="text-slate-500 mt-1">
              {isSupervisor
                ? "Mode Pemantauan Supervisor"
                : "Pilih ruangan atau alat yang tersedia."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              📂 Daftar Resource
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {resources?.map((res) => {
                const isClosingDown = !!res.scheduled_for_deletion_at;
                const isInactive = !res.is_active;
                const isDisabled = isClosingDown || isInactive;
                const unit = res.type === "Room" ? "Orang" : "Unit";

                return (
                  <div
                    key={res.id}
                    className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between ${
                      isDisabled ? "opacity-70 bg-slate-50" : "hover:shadow-md"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl border ${
                            res.type === "Room"
                              ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                              : "bg-orange-50 text-orange-600 border-orange-100"
                          }`}
                        >
                          {res.type === "Room" ? "🏢" : "💻"}
                        </div>

                        {isClosingDown ? (
                          <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full border border-red-200 animate-pulse">
                            SEGERA DIHAPUS
                          </span>
                        ) : isInactive ? (
                          <span className="bg-slate-200 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full border border-slate-300">
                            NON-AKTIF
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-full">
                            {res.capacity} {unit}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 mb-1">
                        {res.name}
                      </h3>

                      {res.type === "Room" &&
                        res.facilities &&
                        res.facilities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {res.facilities
                              .slice(0, 3)
                              .map((fac: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="bg-indigo-50 text-indigo-600 text-[9px] font-bold px-1.5 py-0.5 rounded border border-indigo-100"
                                >
                                  {fac}
                                </span>
                              ))}
                            {res.facilities.length > 3 && (
                              <span className="text-[9px] text-slate-400">
                                +{res.facilities.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                      <p className="text-slate-500 text-xs line-clamp-2 mb-4">
                        {res.description || "Fasilitas tersedia."}
                      </p>
                    </div>

                    {/* Tombol Aksi */}
                    {isSupervisor ? (
                      <button
                        disabled
                        className="w-full bg-slate-50 text-slate-400 font-bold py-2 rounded-lg text-xs border border-slate-200"
                      >
                        Mode Pantau
                      </button>
                    ) : isDisabled ? (
                      <Link
                        href={`/portal/book/${res.id}`}
                        className="block text-center bg-slate-100 border border-slate-200 text-slate-400 font-bold py-2 rounded-lg text-xs hover:bg-slate-200 transition"
                      >
                        {isClosingDown ? "Lihat (Terbatas)" : "Tidak Tersedia"}
                      </Link>
                    ) : (
                      <Link
                        href={`/portal/book/${res.id}`}
                        className="block text-center bg-white border border-indigo-200 text-indigo-600 font-bold py-2 rounded-lg text-xs hover:bg-indigo-600 hover:text-white transition"
                      >
                        {res.type === "Room"
                          ? "Pilih Ruangan →"
                          : "Pilih Alat →"}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              🗓️ Kalender Kegiatan
            </h2>
            <CalendarView schedules={allSchedules || []} />

            <div className="mt-6 bg-indigo-900 rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="font-bold text-lg mb-1">Butuh Bantuan?</h3>
                <p className="text-indigo-200 text-xs mb-4">
                  Lihat panduan penggunaan sistem penjadwalan.
                </p>
                <button className="bg-white text-indigo-900 text-xs font-bold px-4 py-2 rounded-lg">
                  Baca Panduan
                </button>
              </div>
              <div className="absolute top-0 right-0 opacity-10 text-9xl">
                ?
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
