import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

// --- HELPERS ---
const SCORE_ROLES: Record<string, number> = {
  admin: 100,
  supervisor: 50,
  user: 10,
};
const SCORE_PRIORITY: Record<string, number> = {
  high: 30,
  medium: 20,
  low: 10,
};

function calculateScore(role: string, priority: string) {
  const roleScore = SCORE_ROLES[role] || 10;
  const prioScore = SCORE_PRIORITY[priority] || 10;
  return roleScore + prioScore;
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDuration(start: string, end: string) {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0 && minutes > 0) return `${hours}j ${minutes}m`;
  if (hours > 0) return `${hours} Jam`;
  return `${minutes} Menit`;
}

export default async function SupervisorDashboard() {
  const supabase = await createClient();

  // 1. Autentikasi User
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Ambil Profil & Role
  const { data: profile } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single();

  const roleName = (profile?.roles as any)?.name;

  // =========================================================
  // [PERBAIKAN] IZINKAN AKSES UNTUK SUPERVISOR ATAU ADMIN
  // =========================================================
  if (roleName !== "supervisor" && roleName !== "admin") {
    redirect("/portal");
  }

  const now = new Date().toISOString();

  // Ambil Data Statistik (Parallel Fetching agar cepat)
  const [
    { count: activeCount },
    { count: preemptionCount },
    { data: settings },
    { data: schedules },
  ] = await Promise.all([
    // Statistik 1: Jadwal Aktif (Belum Selesai)
    supabase
      .from("schedules")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved")
      .gt("end_time", now),

    // Statistik 2: Total Preemption (Jadwal Digeser)
    supabase
      .from("schedules")
      .select("*", { count: "exact", head: true })
      .eq("status", "cancelled")
      .ilike("description", "%Digeser%"),

    // Statistik 3: System Status (Maintenance)
    supabase
      .from("system_settings")
      .select("value")
      .eq("key", "is_maintenance")
      .single(),

    // Tabel Riwayat Penjadwalan Masuk
    supabase
      .from("schedules")
      .select(
        `
        id, created_at, start_time, end_time, priority_level, status,
        resources (name),
        profiles (full_name, roles(name))
      `,
      )
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const isMaintenance = settings?.value === "true";

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <span className="text-4xl">👁️</span> Dashboard Monitoring
            </h1>
            <p className="text-slate-500 mt-1">
              Pemantauan aktivitas peminjaman dan preemption sistem.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {roleName === "admin" && (
              <Link
                href="/admin/dashboard"
                className="bg-white border border-slate-200 text-slate-600 font-bold px-4 py-2 rounded-xl text-sm hover:bg-slate-50 transition shadow-sm"
              >
                Kembali ke Admin
              </Link>
            )}
            <Link
              href="/portal"
              className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-indigo-700 transition shadow-sm"
            >
              Buka Portal
            </Link>
          </div>
        </div>

        {/* --- STATISTIK CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl font-bold">
              📅
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500">Jadwal Aktif</p>
              <h3 className="text-2xl font-black text-slate-800">
                {activeCount || 0}
              </h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-xl flex items-center justify-center text-2xl font-bold">
              ⚠️
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500">
                Total Preemption
              </p>
              <h3 className="text-2xl font-black text-slate-800">
                {preemptionCount || 0}
              </h3>
            </div>
          </div>

          <div
            className={`p-6 rounded-2xl border shadow-sm flex items-center gap-4 ${isMaintenance ? "bg-red-50 border-red-200" : "bg-white border-slate-200"}`}
          >
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold ${isMaintenance ? "bg-red-100 text-red-600" : "bg-emerald-50 text-emerald-600"}`}
            >
              {isMaintenance ? "⛔" : "✅"}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500">Status Sistem</p>
              <h3
                className={`text-xl font-black ${isMaintenance ? "text-red-700" : "text-emerald-700"}`}
              >
                {isMaintenance ? "MAINTENANCE" : "ONLINE"}
              </h3>
            </div>
          </div>
        </div>

        {/* --- TABEL AUDIT LOG --- */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800">
              Riwayat Penjadwalan Masuk
            </h2>
            <p className="text-xs text-slate-500">
              Log semua permintaan peminjaman dan nilai skor kalkulasinya.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white">
                <tr className="border-b border-slate-200 text-xs text-slate-400 uppercase tracking-wider font-bold">
                  <th className="py-4 px-6">Waktu Pengajuan</th>
                  <th className="py-4 px-6">Pengguna & Role</th>
                  <th className="py-4 px-6">Resource</th>
                  <th className="py-4 px-6">Waktu Booking</th>
                  <th className="py-4 px-6">Durasi</th>
                  <th className="py-4 px-6 text-center">Skor (Power)</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-600">
                {schedules && schedules.length > 0 ? (
                  schedules.map((log) => {
                    // Ekstrak data relasi
                    const uName =
                      (Array.isArray(log.profiles)
                        ? log.profiles[0]
                        : log.profiles
                      )?.full_name || "User";
                    const uRole =
                      (Array.isArray(log.profiles)
                        ? log.profiles[0]
                        : log.profiles
                      )?.roles?.name || "user";
                    const rName = log.resources?.name || "Unknown";

                    // Hitung Skor
                    const score = calculateScore(uRole, log.priority_level);

                    // Visual Warna Skor
                    let scoreBadge =
                      "bg-slate-100 text-slate-600 border-slate-200";
                    if (score > 60)
                      scoreBadge = "bg-red-100 text-red-700 border-red-200";
                    else if (score > 20)
                      scoreBadge =
                        "bg-amber-100 text-amber-700 border-amber-200";
                    else
                      scoreBadge =
                        "bg-emerald-100 text-emerald-700 border-emerald-200";

                    return (
                      <tr
                        key={log.id}
                        className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                      >
                        {/* Waktu Log */}
                        <td className="py-4 px-6 font-mono text-xs whitespace-nowrap">
                          {formatDateTime(log.created_at)}
                        </td>

                        {/* User & Role */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <p className="font-bold text-slate-800">{uName}</p>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                            {uRole}
                          </span>
                        </td>

                        {/* Resource */}
                        <td className="py-4 px-6 font-medium text-slate-700 whitespace-nowrap">
                          {rName}
                        </td>

                        {/* Waktu Booking */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <p className="text-xs">
                            {formatDateTime(log.start_time).split(",")[0]}
                          </p>
                          <p className="font-mono text-[10px] text-slate-400">
                            {new Date(log.start_time).toLocaleTimeString(
                              "id-ID",
                              { hour: "2-digit", minute: "2-digit" },
                            )}{" "}
                            -{" "}
                            {new Date(log.end_time).toLocaleTimeString(
                              "id-ID",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </p>
                        </td>

                        {/* Durasi */}
                        <td className="py-4 px-6 text-xs font-bold text-slate-500 whitespace-nowrap">
                          {getDuration(log.start_time, log.end_time)}
                        </td>

                        {/* Skor Sistem */}
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-black border ${scoreBadge}`}
                          >
                            {score} PTS
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-slate-400"
                    >
                      Tidak ada aktivitas penjadwalan.
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
