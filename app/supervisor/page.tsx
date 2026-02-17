import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function SupervisorDashboard() {
  const supabase = await createClient();

  // 1. Cek Login & Role Supervisor
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

  // Proteksi: Hanya Supervisor (atau Admin) yang boleh masuk
  if (roleName !== "supervisor" && roleName !== "admin") {
    return (
      <div className="p-8 text-red-600 font-bold">
        Akses Ditolak. Halaman ini khusus Supervisor.
      </div>
    );
  }

  // 2. Ambil Data Statistik (Contoh Sederhana)
  // Hitung total jadwal aktif
  const { count: totalSchedules } = await supabase
    .from("schedules")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");

  // Hitung kejadian Preemption (Penggeseran) dari Audit Log
  const { count: totalPreemptions } = await supabase
    .from("audit_logs")
    .select("*", { count: "exact", head: true })
    .eq("action", "PREEMPT_SCHEDULE");

  // 3. Ambil Data Audit Log Terbaru
  const { data: logs } = await supabase
    .from("audit_logs")
    .select(
      `
      *,
      profiles (full_name, email)
    `
    )
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Dashboard Supervisor
        </h1>
        <p className="text-gray-500 mb-8">
          Monitoring aktivitas penjadwalan dan efektivitas sistem.
        </p>

        {/* STATISTIK CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
            <h3 className="text-gray-500 text-sm uppercase">
              Total Jadwal Aktif
            </h3>
            <p className="text-3xl font-bold text-gray-800">
              {totalSchedules || 0}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
            <h3 className="text-gray-500 text-sm uppercase">
              Intervensi Sistem (Preemption)
            </h3>
            <p className="text-3xl font-bold text-gray-800">
              {totalPreemptions || 0}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Konflik yang diselesaikan otomatis
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
            <h3 className="text-gray-500 text-sm uppercase">
              Efisiensi Sistem
            </h3>
            <p className="text-3xl font-bold text-gray-800">OK</p>
            <p className="text-xs text-gray-400 mt-1">Sistem berjalan normal</p>
          </div>
        </div>

        {/* TABEL AUDIT LOG */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Audit Logs (Aktivitas Terkini)
            </h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Waktu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Aksi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Detail
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs?.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.created_at).toLocaleString("id-ID")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {log.profiles?.full_name || "Unknown"}
                    <div className="text-xs text-gray-400">
                      {log.profiles?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold 
                      ${
                        log.action === "PREEMPT_SCHEDULE"
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <pre className="text-xs bg-gray-50 p-2 rounded border border-gray-200 overflow-x-auto max-w-xs">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
              {logs?.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Belum ada aktivitas tercatat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
