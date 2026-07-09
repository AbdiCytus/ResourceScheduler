import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CancelBookingButton } from "./cancel-button";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  pending: "bg-amber-100 text-amber-700 border border-amber-200",
  rejected: "bg-red-100 text-red-700 border border-red-200",
  cancelled: "bg-slate-200 text-slate-500 border border-slate-300",
};

const STATUS_LABEL: Record<string, string> = {
  approved: "Disetujui",
  pending: "Menunggu",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
};

const WEIGHT_TO_PRIORITY: Record<number, { label: string; cls: string }> = {
  10: { label: "Prioritas Rendah", cls: "bg-slate-100 text-slate-500 border-slate-200" },
  30: { label: "Prioritas Sedang", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  60: { label: "Prioritas Tinggi", cls: "bg-red-50 text-red-600 border-red-200" },
};

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: schedules } = await supabase
    .from("schedules")
    .select(`
      *,
      resources (name),
      activity_templates (name, weight)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const total = schedules?.length || 0;
  const approved = schedules?.filter((s) => s.status === "approved").length || 0;
  const preempted = schedules?.filter(
    (s) => s.status === "cancelled" && s.rejection_reason?.toLowerCase().includes("digeser")
  ).length || 0;

  const now = new Date();

  const { data: userSchedules } = await supabase
    .from("schedules")
    .select("...")
    .eq("user_id", user.id)
    .eq("is_hidden_by_user", false)
    .order("start_time", { ascending: false });


  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Riwayat Peminjaman</h1>
            <p className="text-slate-500 text-sm mt-0.5">Daftar semua pengajuan ruangan Gedung H Anda.</p>
          </div>
          <Link href="/portal" className="text-sm font-bold text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg transition">
            ← Kembali ke Portal
          </Link>
        </div>

        {/* Ringkasan Statistik */}
        {total > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Total Pengajuan", value: total, color: "text-slate-700" },
              { label: "Berhasil", value: approved, color: "text-emerald-600" },
              { label: "Dibatalkan Sistem", value: preempted, color: "text-rose-600" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-sm">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{stat.label}</p>
                <p className={`text-3xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Daftar Riwayat */}
        <div className="space-y-3">
          {schedules && schedules.length > 0 ? (
            schedules.map((item) => {
              const startDate = new Date(item.start_time);
              const endDate = new Date(item.end_time);
              const dateStr = startDate.toLocaleDateString("id-ID", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              });
              const timeStr = `${startDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} – ${endDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
              const statusClass = STATUS_STYLE[item.status] || "bg-slate-100 text-slate-600";
              const isPreempted = item.status === "cancelled" && (item.rejection_reason?.toLowerCase().includes("digeser") || item.rejection_reason?.toLowerCase().includes("ditimpa"));
              const statusLabel = isPreempted ? "Ditimpa Sistem" : (STATUS_LABEL[item.status] || item.status);
              const activityName = item.activity_templates?.name;
              const activityWeight = item.activity_templates?.weight as number | undefined;
              const priority = activityWeight !== undefined ? WEIGHT_TO_PRIORITY[activityWeight] : null;

              // Bisa dibatalkan jika belum mulai, status bukan cancelled/rejected
              const canCancel =
                item.status !== "cancelled" &&
                item.status !== "rejected" &&
                startDate > now;

              return (
                <div
                  key={item.id}
                  className={`bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition flex flex-col md:flex-row gap-5 items-start ${isPreempted ? "border-rose-200 bg-rose-50/30" : "border-slate-200"
                    }`}
                >
                  {/* Ikon */}
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-2xl shrink-0">
                    🏢
                  </div>

                  {/* Info Utama */}
                  <div className="flex-1 min-w-0">
                    {/* Baris 1: Nama Ruangan + Status badge */}
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-slate-900 truncate">
                        🏢 {item.resources?.name || "—"}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </div>

                    {/* Baris 2: Nama Kegiatan (title) */}
                    <p className="text-sm text-slate-500 font-medium mb-2">
                      {item.title}
                    </p>

                    {/* Baris 3: Jadwal & Waktu */}
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500 mb-2">
                      <div className="flex items-center gap-1">📅 {dateStr}</div>
                      <div className="flex items-center gap-1">⏰ {timeStr}</div>
                    </div>

                    {/* Baris 4: Tag Kegiatan & Prioritas */}
                    {activityName && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-full font-bold">
                          🏷️ {activityName}
                        </span>
                        {priority && (
                          <span className={`text-[10px] border px-2.5 py-1 rounded-full font-bold ${priority.cls}`}>
                            {priority.label}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Alert Preempted */}
                    {isPreempted && (
                      <div className="mt-3 bg-rose-50 border border-rose-100 text-rose-700 p-2.5 rounded-xl text-xs flex items-start gap-2">
                        <span className="shrink-0">⚠️</span>
                        <span>{item.rejection_reason}</span>
                      </div>
                    )}
                  </div>

                  {/* Kolom Kanan: Tanggal Diajukan + Tombol Batal */}
                  <div className="text-right shrink-0 ml-auto flex flex-col items-end gap-2">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Diajukan</p>
                      <p className="text-xs font-bold text-slate-600 mt-0.5">
                        {new Date(item.created_at).toLocaleDateString("id-ID", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                    </div>
                    {canCancel && <CancelBookingButton scheduleId={item.id} />}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
              <p className="text-4xl mb-3">📋</p>
              <p className="font-bold text-slate-600">Belum ada riwayat peminjaman.</p>
              <p className="text-slate-400 text-sm mt-1">Ajukan peminjaman ruangan dari Portal.</p>
              <Link href="/portal" className="mt-4 inline-block text-sm font-bold text-indigo-600 hover:underline">
                Ke Portal →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
