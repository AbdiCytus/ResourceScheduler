import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

// Helper function untuk format tanggal indonesia
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function HistoryPage() {
  const supabase = await createClient();

  // 1. Cek User Login
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Ambil data Jadwal milik user ini
  // Kita join dengan tabel 'resources' untuk dapat nama ruangannya
  const { data: schedules, error } = await supabase
    .from("schedules")
    .select(
      `
      *,
      resources (name, type)
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Riwayat Peminjaman Saya
          </h1>
          <Link
            href="/portal"
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            + Ajukan Baru
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kegiatan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Waktu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schedules?.map((schedule) => (
                <tr key={schedule.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {schedule.resources?.name || "Resource Dihapus"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {schedule.resources?.type}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 font-semibold">
                      {schedule.title}
                    </div>
                    <div className="text-sm text-gray-500 line-clamp-1">
                      {schedule.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>Mulai: {formatDate(schedule.start_time)}</div>
                    <div>Selesai: {formatDate(schedule.end_time)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${
                        schedule.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : schedule.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {schedule.status.toUpperCase()}
                    </span>
                    <div className="mt-2 text-xs text-gray-500">
                      <span className="font-bold">
                        Score: {schedule.calculated_score}
                      </span>
                      <span className="ml-2">({schedule.priority_level})</span>
                    </div>
                    {schedule.rejection_reason && (
                      <p className="text-xs text-red-600 mt-1">
                        Alasan: {schedule.rejection_reason}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
              {(!schedules || schedules.length === 0) && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Belum ada riwayat peminjaman.
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
