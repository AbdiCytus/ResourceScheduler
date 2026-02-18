import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

// Helper Format Hari & Tanggal (Lebih Ringkas)
function formatDayDate(dateString: string) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    weekday: "short", // Sen
    day: "numeric", // 20
    month: "short", // Feb
    year: "numeric", // 2024
  });
}

// Helper Format Waktu Log (Agar aman dari Hydration Error)
function formatLogTime(dateString: string) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function SupervisorDashboard() {
  const supabase = await createClient();

  // 1. Cek Login & Role
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
  if (roleName !== "supervisor") {
    redirect("/portal?error=Akses ditolak. Halaman ini khusus Supervisor.");
  }

  const now = new Date().toISOString();

  // 2. Statistik Jadwal Aktif
  const { count: totalActiveSchedules } = await supabase
    .from("schedules")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved")
    .gt("end_time", now);

  const { count: totalPreemptions } = await supabase
    .from("audit_logs")
    .select("*", { count: "exact", head: true })
    .eq("action", "PREEMPT_SCHEDULE");

  // 3. Ambil Data Audit Log
  const { data: logs } = await supabase
    .from("audit_logs")
    .select(`*, profiles (full_name, email)`)
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">
          Dashboard Monitoring
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard
            title="Jadwal Aktif"
            value={totalActiveSchedules || 0}
            subtext="Sedang & Akan Berjalan"
            color="indigo"
            icon="📅"
          />
          <StatCard
            title="Total Preemption"
            value={totalPreemptions || 0}
            subtext="Konflik Teratasi Otomatis"
            color="purple"
            icon="⚡"
          />
          <StatCard
            title="Status Sistem"
            value="Optimal"
            color="emerald"
            icon="✅"
          />
        </div>

        {/* Tabel Log Aktivitas */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-semibold text-slate-800">
              Riwayat Aktivitas & Status
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-bold tracking-wider text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4">Waktu Log</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Resource</th>
                  <th className="px-6 py-4">Hari</th>
                  <th className="px-6 py-4">Jam</th>
                  <th className="px-6 py-4">Durasi</th>
                  <th className="px-6 py-4 text-center">Skor</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs?.map((log) => {
                  const details: any = log.details || {};

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Waktu Log */}
                      <td className="px-6 py-4 text-xs text-slate-400 font-mono whitespace-nowrap">
                        {formatLogTime(log.created_at)}
                      </td>

                      {/* User */}
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {log.profiles?.full_name || "Unknown"}
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            details.user_role === "admin"
                              ? "bg-red-100 text-red-700"
                              : details.user_role === "supervisor"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {details.user_role || "-"}
                        </span>
                      </td>

                      {/* Resource */}
                      <td className="px-6 py-4 text-sm text-indigo-600 font-medium">
                        {details.resource_name || "-"}
                      </td>

                      {/* Hari */}
                      <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                        {details.date ? formatDayDate(details.date) : "-"}
                      </td>

                      {/* Jam */}
                      <td className="px-6 py-4 text-sm text-slate-600 font-mono whitespace-nowrap">
                        {details.start_time && details.end_time
                          ? `${details.start_time} - ${details.end_time}`
                          : "-"}
                      </td>

                      {/* Durasi */}
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {details.duration || "-"}
                      </td>

                      {/* Skor */}
                      <td className="px-6 py-4 text-center">
                        {details.score ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
                            {details.score}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4 text-center">
                        {log.action === "CREATE_SCHEDULE" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            APPROVED
                          </span>
                        ) : log.action === "CANCEL_SCHEDULE" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            CANCELLED
                          </span>
                        ) : log.action === "PREEMPT_SCHEDULE" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                            PREEMPTED
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">
                            {log.action}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {(!logs || logs.length === 0) && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      Belum ada aktivitas.
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

function StatCard({ title, value, subtext, color, icon }: any) {
  const colors: any = {
    indigo: "bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-200",
    purple: "bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-200",
    emerald:
      "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-200",
  };

  return (
    <div
      className={`${colors[color]} rounded-2xl p-6 text-white shadow-lg relative overflow-hidden card-hover`}
    >
      <div className="relative z-10">
        <p className="text-indigo-100 text-sm font-medium uppercase tracking-wider mb-1 opacity-80">
          {title}
        </p>
        <h3 className="text-4xl font-bold">{value}</h3>
        {subtext && (
          <p className="text-xs text-indigo-100 mt-2 opacity-90">{subtext}</p>
        )}
      </div>
      <div className="absolute top-4 right-4 text-4xl opacity-20 filter blur-sm">
        {icon}
      </div>
    </div>
  );
}
