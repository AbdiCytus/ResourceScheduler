import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cancelUserSchedule } from "../actions"; // Import action baru

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

  // Waktu sekarang untuk perbandingan di UI
  const now = new Date();

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Riwayat Peminjaman
            </h1>
            <p className="text-slate-500 mt-1">
              Lacak status pengajuan dan kelola jadwal Anda.
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
                    Status Pengajuan
                  </th>
                  {/* [KOLOM BARU] */}
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schedules?.map((schedule) => {
                  const start = new Date(schedule.start_time);
                  const end = new Date(schedule.end_time);

                  // Logika Status Waktu
                  const hasStarted = now >= start;
                  const hasEnded = now > end;
                  const isActiveStatus =
                    schedule.status === "approved" ||
                    schedule.status === "pending";

                  return (
                    <tr
                      key={schedule.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Kolom Resource */}
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

                      {/* Kolom Kegiatan */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">
                          {schedule.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 max-w-xs truncate">
                          {schedule.description || "-"}
                        </div>
                      </td>

                      {/* Kolom Waktu */}
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

                      {/* Kolom Status (Asli) */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <StatusBadge status={schedule.status} />
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

                      {/* [LOGIKA KOLOM BARU] */}
                      <td className="px-6 py-4 text-center">
                        {/* 1. Jika Status SUDAH Cancel/Reject, tidak perlu tombol aksi */}
                        {!isActiveStatus ? (
                          <span className="text-xs text-slate-400 font-medium">
                            -
                          </span>
                        ) : hasEnded ? (
                          // 2. Jika sudah lewat waktu selesai
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            Telah Berakhir
                          </span>
                        ) : hasStarted ? (
                          // 3. Jika sedang berlangsung (antara start dan end)
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Sedang Berlangsung
                          </span>
                        ) : (
                          // 4. Jika BELUM mulai -> Tampilkan Tombol Batal
                          <form
                            action={async (formData) => {
                              "use server";
                              await cancelUserSchedule(formData);
                            }}
                          >
                            <input
                              type="hidden"
                              name="scheduleId"
                              value={schedule.id}
                            />
                            <button
                              type="submit"
                              className="bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 text-xs font-bold py-1.5 px-4 rounded-lg transition-all shadow-sm active:scale-95"
                              title="Batalkan Jadwal Ini"
                            >
                              Batalkan Jadwal
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {(!schedules || schedules.length === 0) && (
                  <tr>
                    <td
                      colSpan={5}
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
