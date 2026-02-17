import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function UserPortal() {
  const supabase = await createClient();

  // 1. Cek Login
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Ambil data Resources yang Aktif
  const { data: resources } = await supabase
    .from("resources")
    .select("*")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Portal Peminjaman
          </h1>
          <form action="/auth/signout" method="post">
            {/* Nanti kita buat tombol logout yang proper, sementara placeholder dulu */}
            <Link href="/" className="text-blue-600 hover:underline">
              Kembali ke Home
            </Link>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources?.map((res) => (
            <div
              key={res.id}
              className="bg-white rounded-lg shadow hover:shadow-md transition p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    res.type === "Room"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {res.type}
                </span>
                <span className="text-sm text-gray-500">
                  Kap: {res.capacity}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {res.name}
              </h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {res.description || "Tidak ada deskripsi."}
              </p>

              <Link
                href={`/portal/book/${res.id}`}
                className="block w-full text-center bg-indigo-600 text-white py-2 rounded-md font-semibold hover:bg-indigo-700 transition"
              >
                Ajukan Jadwal
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
