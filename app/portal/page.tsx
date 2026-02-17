import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function UserPortal({
  searchParams,
}: {
  searchParams: Promise<{ success: string; error: string }>;
}) {
  const supabase = await createClient();

  // 1. Cek Login
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Ambil Role User
  const { data: profile } = await supabase
    .from("profiles")
    .select("roles (name)")
    .eq("id", user.id)
    .single();
  const roleName = (profile?.roles as any)?.name;

  const isSupervisor = roleName === "supervisor"; // Flag Cek Supervisor

  const { success, error } = await searchParams;

  // 3. Ambil Resources
  const { data: resources } = await supabase
    .from("resources")
    .select("*")
    .is("deleted_at", null)
    .order("name");

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Portal Peminjaman
            </h1>
            <p className="text-slate-500 mt-1">
              {isSupervisor
                ? "Mode Pemantauan Supervisor"
                : "Pilih ruangan atau alat yang tersedia."}
            </p>
          </div>
          {success && (
            <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-xl text-sm font-bold border border-emerald-200 shadow-sm animate-bounce">
              ✅ {success}
            </div>
          )}
          {error && (
            <div className="bg-red-100 text-red-800 px-4 py-2 rounded-xl text-sm font-bold border border-red-200 shadow-sm animate-pulse">
              ⛔ {error}
            </div>
          )}
        </div>

        {/* Grid Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {resources?.map((res) => {
            const isClosingDown = !!res.scheduled_for_deletion_at;
            const isInactive = !res.is_active;
            const isDisabled = isClosingDown || isInactive;
            const unit = res.type === "Room" ? "Orang" : "Unit";

            return (
              <div
                key={res.id}
                className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-100 transition-all duration-300 flex flex-col justify-between h-full
                  ${
                    isDisabled
                      ? "opacity-60 grayscale cursor-not-allowed bg-slate-50"
                      : "hover:shadow-xl hover:-translate-y-1"
                  }
                `}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${
                        res.type === "Room"
                          ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                          : "bg-orange-50 text-orange-600 border-orange-100"
                      }`}
                    >
                      {res.type === "Room" ? "🏢" : "💻"}
                    </div>

                    {isClosingDown ? (
                      <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-red-200 uppercase tracking-wide">
                        Segera Ditutup
                      </span>
                    ) : isInactive ? (
                      <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-300 uppercase tracking-wide">
                        Non-Aktif
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full border border-slate-200">
                        Kap: {res.capacity} {unit}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {res.name}
                  </h3>
                  <p className="text-slate-500 text-sm line-clamp-2 mb-6 leading-relaxed">
                    {res.description ||
                      "Fasilitas lengkap untuk kebutuhan produktivitas Anda."}
                  </p>
                </div>

                {/* LOGIKA TOMBOL */}
                {isSupervisor ? (
                  // Supervisor tidak bisa booking
                  <button
                    disabled
                    hidden
                    className="w-full block text-center bg-indigo-50 text-indigo-400 font-bold py-3 rounded-xl cursor-default border border-indigo-100 text-sm"
                  >
                    Mode Pantau
                  </button>
                ) : isDisabled ? (
                  // Resource mati
                  <button
                    disabled
                    className="w-full block text-center bg-slate-200 text-slate-400 font-bold py-3 rounded-xl cursor-not-allowed border border-slate-300 text-sm"
                  >
                    Tidak Tersedia
                  </button>
                ) : (
                  // User Normal
                  <Link
                    href={`/portal/book/${res.id}`}
                    className="w-full block text-center bg-white border-2 border-indigo-100 text-indigo-600 font-bold py-3 rounded-xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                  >
                    Ajukan Jadwal →
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
