import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: schedules } = await supabase
    .from("schedules")
    .select(`*, resources (name, type)`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Riwayat Peminjaman
            </h1>
            <p className="text-slate-500 mt-1">
              Lacak status pengajuan dan skor prioritas Anda.
            </p>
          </div>
          <Link href="/portal" className="btn-primary shadow-indigo-200">
            + Ajukan Baru
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Kegiatan
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Waktu
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Skor & Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schedules?.map((schedule) => (
                  <tr
                    key={schedule.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {schedule.resources?.name || "Resource Dihapus"}
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium mt-1 ${
                          schedule.resources?.type === "Room"
                            ? "bg-indigo-50 text-indigo-700"
                            : "bg-orange-50 text-orange-700"
                        }`}
                      >
                        {schedule.resources?.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">
                        {schedule.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 max-w-xs truncate">
                        {schedule.description || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-slate-100 px-1.5 rounded">
                          Mulai
                        </span>
                        {formatDate(schedule.start_time)}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono bg-slate-100 px-1.5 rounded">
                          Selesai
                        </span>
                        {formatDate(schedule.end_time)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <StatusBadge status={schedule.status} />
                        {/* Priority Score Indicator */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 w-fit">
                          <span>
                            ⚡ Score:{" "}
                            <b className="text-slate-700">
                              {schedule.calculated_score}
                            </b>
                          </span>
                        </div>
                        {schedule.rejection_reason && (
                          <p className="text-[10px] text-red-500 bg-red-50 p-1.5 rounded border border-red-100 max-w-[150px] leading-tight">
                            {schedule.rejection_reason}
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {(!schedules || schedules.length === 0) && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-slate-400"
                    >
                      Belum ada riwayat. Mulai ajukan peminjaman sekarang!
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

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
    cancelled:
      "bg-slate-100 text-slate-600 border-slate-200 line-through decoration-slate-400",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
  };

  return (
    <span
      className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
        styles[status] || styles.pending
      } uppercase tracking-wide w-fit`}
    >
      {status}
    </span>
  );
}
