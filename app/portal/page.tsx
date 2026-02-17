import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function UserPortal({
  searchParams,
}: {
  searchParams: Promise<{ success: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { success } = await searchParams;

  const { data: resources } = await supabase
    .from("resources")
    .select("*")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Portal Peminjaman
            </h1>
            <p className="text-slate-500 mt-1">
              Pilih ruangan atau alat yang tersedia.
            </p>
          </div>
          {success && (
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-medium border border-green-200 shadow-sm animate-bounce">
              ✅ {success}
            </div>
          )}
        </div>

        {/* Grid Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {resources?.map((res) => (
            <div
              key={res.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                      res.type === "Room"
                        ? "bg-indigo-50 text-indigo-600"
                        : "bg-orange-50 text-orange-600"
                    }`}
                  >
                    {res.type === "Room" ? "🏢" : "💻"}
                  </div>
                  <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Kap: {res.capacity}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {res.name}
                </h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-6">
                  {res.description ||
                    "Fasilitas lengkap untuk kebutuhan produktivitas Anda."}
                </p>
              </div>

              <Link
                href={`/portal/book/${res.id}`}
                className="w-full block text-center bg-white border-2 border-indigo-100 text-indigo-600 font-bold py-2.5 rounded-xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all"
              >
                Ajukan Jadwal →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
