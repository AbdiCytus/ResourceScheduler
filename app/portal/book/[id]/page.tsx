import { createClient } from "@/utils/supabase/server";
import BookingForm from "./booking-form";
import Link from "next/link";
import { redirect } from "next/navigation";

// [UPDATE] Helper Format DateTime Lebih Pendek
function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return {
    // Ubah 'long' menjadi 'short' agar lebih ringkas (Sen, 20 Feb 2026)
    date: date.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 1. Cek Role Supervisor
  const { data: profile } = await supabase
    .from("profiles")
    .select("roles (name)")
    .eq("id", user.id)
    .single();
  if ((profile?.roles as any)?.name === "supervisor") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold">Akses Dibatasi</h1>
        <p className="mb-4">Supervisor hanya memantau.</p>
        <Link href="/supervisor" className="text-indigo-600 underline">
          Ke Dashboard
        </Link>
      </div>
    );
  }

  // 2. Ambil Resource Utama
  const { data: resource } = await supabase
    .from("resources")
    .select("*, version")
    .eq("id", id)
    .single();
  if (!resource) return <div>Resource tidak ditemukan</div>;

  // 3. Ambil Equipment Tambahan (Bundling)
  const { data: equipmentList } = await supabase
    .from("resources")
    .select("id, name, capacity")
    .eq("type", "Equipment")
    .eq("is_active", true)
    .neq("id", id)
    .order("name");

  // 4. Ambil Jadwal Aktif
  const now = new Date().toISOString();
  const { data: schedules } = await supabase
    .from("schedules")
    .select(
      `id, title, start_time, end_time, priority_level, calculated_score, profiles (full_name)`
    )
    .eq("resource_id", id)
    .eq("status", "approved")
    .gt("end_time", now)
    .order("start_time");

  const unit = resource.type === "Room" ? "Orang" : "Unit";

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 md:px-8 flex flex-col items-center">
      <div className="w-full max-w-5xl space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Form Peminjaman</h1>
          <p className="text-slate-500">
            Resource:{" "}
            <span className="font-bold text-indigo-600">{resource.name}</span> •
            Kapasitas: {resource.capacity} {unit}
          </p>
        </div>

        {/* Form Booking */}
        <BookingForm
          resourceId={id}
          resourceName={resource.name}
          currentVersion={resource.version}
          equipmentList={equipmentList || []}
        />

        {/* Tabel Jadwal Eksisting */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800">
              📅 Jadwal Terkonfirmasi
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500 font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Waktu</th>
                  <th className="px-6 py-4">Kegiatan</th>
                  <th className="px-6 py-4">Peminjam</th>
                  <th className="px-6 py-4">Prioritas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schedules?.map((sch: any) => {
                  const start = formatDateTime(sch.start_time);
                  const end = formatDateTime(sch.end_time);
                  return (
                    <tr key={sch.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        {/* Tanggal Singkat */}
                        <div className="text-sm font-bold text-slate-800">
                          {start.date}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          {start.time} - {end.time}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{sch.title}</td>
                      <td className="px-6 py-4 text-sm">
                        {(Array.isArray(sch.profiles)
                          ? sch.profiles[0]
                          : sch.profiles
                        )?.full_name || "User"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${
                            sch.priority_level === "high" ||
                            sch.priority_level === "critical"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {sch.priority_level}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {(!schedules || schedules.length === 0) && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-8 text-center text-slate-400 text-sm"
                    >
                      Belum ada jadwal.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
