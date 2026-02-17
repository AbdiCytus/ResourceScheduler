import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function SupervisorDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch Data (Logic sama, hanya UI berubah)
  const { count: totalSchedules } = await supabase
    .from("schedules")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");
  const { count: totalPreemptions } = await supabase
    .from("audit_logs")
    .select("*", { count: "exact", head: true })
    .eq("action", "PREEMPT_SCHEDULE");
  const { data: logs } = await supabase
    .from("audit_logs")
    .select(`*, profiles (full_name, email)`)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">
          Dashboard Monitoring
        </h1>

        {/* Stats Cards dengan Gradient Halus */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard
            title="Jadwal Aktif"
            value={totalSchedules || 0}
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

        {/* Audit Log Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-semibold text-slate-800">Live Audit Logs</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs font-semibold tracking-wide text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4">Waktu</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Aksi</th>
                  <th className="px-6 py-4">Detail JSON</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs?.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                      {new Date(log.created_at).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      <span className="block text-xs text-slate-400">
                        {new Date(log.created_at).toLocaleDateString("id-ID")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-slate-900">
                        {log.profiles?.full_name || "User"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {log.profiles?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          log.action === "PREEMPT_SCHEDULE"
                            ? "bg-red-100 text-red-800"
                            : "bg-indigo-100 text-indigo-800"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-[10px] bg-slate-100 p-1.5 rounded text-slate-600 block max-w-xs truncate font-mono">
                        {JSON.stringify(log.details)}
                      </code>
                    </td>
                  </tr>
                ))}
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
