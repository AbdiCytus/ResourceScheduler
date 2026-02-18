import { createClient } from "@/utils/supabase/server";
import BookingForm from "./booking-form";
import Link from "next/link";
import { redirect } from "next/navigation"; // Penting: Import redirect

// --- HELPER FUNCTIONS (Tetap Sama) ---
function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return {
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

function getDuration(start: string, end: string) {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0 && minutes > 0) return `${hours}j ${minutes}m`;
  if (hours > 0) return `${hours} Jam`;
  return `${minutes} Menit`;
}

function getTimeStatus(start: string, end: string) {
  const now = new Date().getTime();
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  if (now > endTime)
    return { text: "Selesai", className: "text-slate-400 font-medium" };
  if (now >= startTime && now <= endTime)
    return {
      text: "Sedang Berlangsung",
      className: "text-emerald-600 font-bold animate-pulse",
    };

  const diff = startTime - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0)
    return { text: `H-${days}`, className: "text-indigo-600 font-medium" };
  if (hours > 0)
    return {
      text: `${hours} Jam lagi`,
      className: "text-indigo-600 font-medium",
    };
  return {
    text: `${minutes} Menit lagi`,
    className: "text-orange-600 font-bold",
  };
}

// --- MAIN COMPONENT ---

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

  // 1. Ambil Resource
  const { data: resource } = await supabase
    .from("resources")
    .select("*, version")
    .eq("id", id)
    .single();

  if (!resource) {
    redirect("/portal?error=Resource tidak ditemukan.");
  }

  // [BARU] LOGIKA REDIRECT JIKA RESOURCE AKAN DIHAPUS / NONAKTIF
  const isClosingDown = !!resource.scheduled_for_deletion_at;
  const isInactive = !resource.is_active;

  if (isClosingDown || isInactive) {
    // Redirect dengan pesan spesifik
    const message =
      "Resource akan segera dihapus/nonaktifkan, penjadwalan tidak dapat diakses";
    redirect(`/portal?error=${encodeURIComponent(message)}`);
  }

  // 2. Ambil Jadwal Aktif
  const now = new Date().toISOString();
  const { data: schedules } = await supabase
    .from("schedules")
    .select(
      `id, title, start_time, end_time, priority_level, quantity_borrowed, profiles (full_name)`
    )
    .eq("resource_id", id)
    .eq("status", "approved")
    .gt("end_time", now)
    .order("start_time");

  const isRoom = resource.type === "Room";

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 md:px-8 flex flex-col items-center">
      <div className="w-full max-w-6xl space-y-8">
        <div className="text-center">
          <div
            className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center text-2xl border ${
              isRoom
                ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                : "bg-orange-50 text-orange-600 border-orange-100"
            }`}
          >
            {isRoom ? "🏢" : "💻"}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{resource.name}</h1>
          <p className="text-slate-500 text-sm">
            Kapasitas Total: <b>{resource.capacity}</b>{" "}
            {isRoom ? "Orang" : "Unit"}
          </p>
        </div>

        {/* Form Booking */}
        <BookingForm
          resourceId={id}
          resourceName={resource.name}
          resourceType={resource.type}
          capacity={resource.capacity}
          facilities={resource.facilities}
        />

        {/* Tabel Jadwal */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">
              📅 Jadwal Terkonfirmasi
            </h3>
            <span className="text-xs text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded-full">
              {schedules?.length || 0} Jadwal Aktif
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500 font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Waktu</th>
                  <th className="px-6 py-4">Kegiatan</th>
                  <th className="px-6 py-4">Peminjam</th>
                  <th className="px-6 py-4">Durasi</th>
                  <th className="px-6 py-4">Urgensi</th>
                  <th className="px-6 py-4">Status</th>
                  {!isRoom && <th className="px-6 py-4 text-center">Qty</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schedules?.map((sch: any) => {
                  const start = formatDateTime(sch.start_time);
                  const end = formatDateTime(sch.end_time);
                  const duration = getDuration(sch.start_time, sch.end_time);
                  const status = getTimeStatus(sch.start_time, sch.end_time);

                  const urgencyColors: any = {
                    low: "bg-slate-100 text-slate-600 border-slate-200",
                    medium: "bg-blue-50 text-blue-600 border-blue-200",
                    high: "bg-orange-50 text-orange-600 border-orange-200",
                    critical:
                      "bg-red-50 text-red-600 border-red-200 animate-pulse",
                  };

                  return (
                    <tr
                      key={sch.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-800">
                          {start.date}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          {start.time} - {end.time}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-700">
                        {sch.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {(Array.isArray(sch.profiles)
                          ? sch.profiles[0]
                          : sch.profiles
                        )?.full_name || "User"}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-500">
                        {duration}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-1 rounded border uppercase ${
                            urgencyColors[sch.priority_level] ||
                            urgencyColors.low
                          }`}
                        >
                          {sch.priority_level}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs ${status.className}`}>
                          {status.text}
                        </span>
                      </td>
                      {!isRoom && (
                        <td className="px-6 py-4 text-sm font-bold text-orange-600 text-center">
                          {sch.quantity_borrowed || 1}
                        </td>
                      )}
                    </tr>
                  );
                })}
                {(!schedules || schedules.length === 0) && (
                  <tr>
                    <td
                      colSpan={isRoom ? 6 : 7}
                      className="p-8 text-center text-slate-400 text-sm"
                    >
                      Belum ada jadwal aktif.
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
