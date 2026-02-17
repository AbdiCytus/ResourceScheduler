import { createClient } from "@/utils/supabase/server";
import BookingForm from "./booking-form";
import Link from "next/link";
import { redirect } from "next/navigation";

// Helper untuk format tanggal & waktu
function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
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

  // 1. Cek Role & Blokir Supervisor
  const { data: profile } = await supabase
    .from("profiles")
    .select("roles (name)")
    .eq("id", user.id)
    .single();
  const roleName = (profile?.roles as any)?.name;

  if (roleName === "supervisor") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-4xl mb-6 shadow-sm border border-red-200">
          ⛔
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Akses Dibatasi
        </h1>
        <p className="text-slate-500 mt-2 mb-8 max-w-md leading-relaxed">
          Akun <b>Supervisor</b> hanya memiliki hak akses untuk memantau
          dashboard, bukan mengajukan peminjaman.
        </p>
        <Link
          href="/supervisor"
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  // 2. Ambil Data Resource
  const { data: resource } = await supabase
    .from("resources")
    .select("*, version")
    .eq("id", id)
    .single();

  if (!resource)
    return (
      <div className="text-center p-20 text-slate-500">
        Resource tidak ditemukan
      </div>
    );
  const unit = resource.type === "Room" ? "Orang" : "Unit";

  // 3. Ambil Daftar Jadwal Aktif (Approved)
  const now = new Date();
  const nowISO = now.toISOString();

  const { data: schedules } = await supabase
    .from("schedules")
    .select(
      `
      id, 
      title, 
      start_time, 
      end_time, 
      priority_level, 
      calculated_score,
      profiles (full_name, email)
    `
    )
    .eq("resource_id", id)
    .eq("status", "approved")
    .gt("end_time", nowISO) // Hanya jadwal yang belum selesai
    .order("start_time", { ascending: true });

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 md:px-8 flex flex-col items-center">
      <div className="w-full max-w-5xl space-y-8">
        {/* Header Section */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Form Peminjaman</h1>
          <p className="text-slate-500">
            Resource:{" "}
            <span className="font-bold text-indigo-600">{resource.name}</span>
            <span className="mx-2">•</span>
            Kapasitas: {resource.capacity} {unit}
          </p>
        </div>

        {/* Form Booking */}
        <BookingForm
          resourceId={id}
          resourceName={resource.name}
          currentVersion={resource.version}
        />

        {/* Section Daftar Jadwal Pengguna Lain */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              📅 Jadwal Terkonfirmasi
            </h3>
            <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-1 rounded-md">
              {schedules?.length || 0} Kegiatan Mendatang
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500 font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Waktu</th>
                  <th className="px-6 py-4">Status</th> {/* Kolom Baru */}
                  <th className="px-6 py-4">Kegiatan</th>
                  <th className="px-6 py-4">Peminjam</th>
                  <th className="px-6 py-4 text-center">Prioritas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schedules?.map((sch: any) => {
                  const startObj = new Date(sch.start_time);
                  const start = formatDateTime(sch.start_time);
                  const end = formatDateTime(sch.end_time);

                  // --- LOGIKA STATUS ---
                  const isRunning = now >= startObj; // Karena sudah difilter end_time > now, maka jika start < now pasti sedang jalan
                  let statusBadge;

                  if (isRunning) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Sedang Berlangsung
                      </span>
                    );
                  } else {
                    // Hitung selisih waktu
                    const diffMs = startObj.getTime() - now.getTime();
                    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                    const diffMins = Math.floor(
                      (diffMs % (1000 * 60 * 60)) / (1000 * 60)
                    );
                    const diffDays = Math.floor(diffHrs / 24);

                    let timeText = "";
                    let colorClass = "bg-blue-50 text-blue-600 border-blue-100";

                    if (diffDays > 0) {
                      timeText = `${diffDays} hari lagi`;
                      colorClass =
                        "bg-slate-100 text-slate-500 border-slate-200"; // Warna abu untuk jadwal jauh
                    } else if (diffHrs > 0) {
                      timeText = `${diffHrs} jam lagi`;
                    } else {
                      timeText = `${diffMins} menit lagi`;
                      colorClass =
                        "bg-amber-50 text-amber-600 border-amber-100"; // Warna oranye untuk jadwal dekat
                    }

                    statusBadge = (
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${colorClass}`}
                      >
                        ⏳ {timeText}
                      </span>
                    );
                  }

                  // Style badge urgensi
                  const urgencyColors: Record<string, string> = {
                    low: "bg-slate-100 text-slate-600",
                    medium: "bg-blue-100 text-blue-700",
                    high: "bg-orange-100 text-orange-700",
                    critical: "bg-red-100 text-red-700 border-red-200",
                  };

                  return (
                    <tr
                      key={sch.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {/* Kolom Waktu */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-800">
                          {start.date}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-1">
                          {start.time} - {end.time}
                        </div>
                      </td>

                      {/* Kolom Status (BARU) */}
                      <td className="px-6 py-4">{statusBadge}</td>

                      {/* Kolom Kegiatan */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">
                          {sch.title}
                        </div>
                      </td>

                      {/* Kolom Peminjam */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold border border-indigo-200">
                            {(Array.isArray(sch.profiles) ? sch.profiles[0]?.full_name : sch.profiles?.full_name)?.charAt(0) || "U"}
                          </div>
                          <div className="text-sm text-slate-600">
                            {(Array.isArray(sch.profiles) ? sch.profiles[0]?.full_name : sch.profiles?.full_name) || "User"}
                          </div>
                        </div>
                      </td>

                      {/* Kolom Skor/Prioritas */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border border-transparent ${
                              urgencyColors[sch.priority_level] ||
                              urgencyColors.low
                            }`}
                          >
                            {sch.priority_level}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Score: {sch.calculated_score}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* State Kosong */}
                {(!schedules || schedules.length === 0) && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <span className="text-4xl mb-3 opacity-50">✨</span>
                        <p className="text-sm font-medium">
                          Belum ada jadwal mendatang.
                        </p>
                        <p className="text-xs mt-1">
                          Jadilah yang pertama melakukan booking!
                        </p>
                      </div>
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
