import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: schedules } = await supabase
    .from("schedules")
    .select(`*, resources(name, type)`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Riwayat Peminjaman
            </h1>
            <p className="text-slate-500 text-sm">
              Daftar semua pengajuan jadwal Anda.
            </p>
          </div>
          <Link
            href="/portal"
            className="text-sm font-bold text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg transition"
          >
            ← Kembali ke Portal
          </Link>
        </div>

        <div className="space-y-4">
          {schedules && schedules.length > 0 ? (
            schedules.map((item) => {
              const startDate = new Date(item.start_time);
              const endDate = new Date(item.end_time);
              const dateStr = startDate.toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              });
              const timeStr = `${startDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} - ${endDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;

              let statusClass = "bg-slate-100 text-slate-600";
              if (item.status === "approved")
                statusClass =
                  "bg-emerald-100 text-emerald-700 border border-emerald-200";
              if (item.status === "pending")
                statusClass =
                  "bg-amber-100 text-amber-700 border border-amber-200";
              if (item.status === "rejected")
                statusClass = "bg-red-100 text-red-700 border border-red-200";
              if (item.status === "cancelled")
                statusClass =
                  "bg-slate-200 text-slate-500 border border-slate-300";

              return (
                <div
                  key={item.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col md:flex-row gap-5 items-start md:items-center"
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${item.resources.type === "Room" ? "bg-indigo-50 text-indigo-600" : "bg-orange-50 text-orange-600"}`}
                  >
                    {item.resources.type === "Room" ? "🏢" : "💻"}
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-slate-900">
                        {item.title}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${statusClass}`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 font-medium mb-1">
                      {item.resources.name}
                    </p>

                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <span>📅</span> {dateStr}
                      </div>
                      <div className="flex items-center gap-1">
                        <span>⏰</span> {timeStr}
                      </div>
                      {item.quantity_borrowed > 1 && (
                        <div className="flex items-center gap-1">
                          <span>📦</span> {item.quantity_borrowed} Unit
                        </div>
                      )}
                    </div>

                    {(item.status === "cancelled" ||
                      item.status === "rejected") &&
                      item.description &&
                      item.description.includes("Digeser") && (
                        <p className="mt-3 text-xs bg-red-50 text-red-700 p-2 rounded-lg border border-red-100">
                          ⚠️ {item.description}
                        </p>
                      )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-slate-400">Diajukan pada:</p>
                    <p className="text-xs font-medium text-slate-600">
                      {new Date(item.created_at).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
              <p className="text-slate-400">Belum ada riwayat peminjaman.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
