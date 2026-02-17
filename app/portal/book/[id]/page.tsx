import { createClient } from "@/utils/supabase/server";
import BookingForm from "./booking-form";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 1. Cek Role
  const { data: profile } = await supabase
    .from("profiles")
    .select("roles (name)")
    .eq("id", user.id)
    .single();
  const roleName = (profile?.roles as any)?.name;

  // 2. TENDANG JIKA SUPERVISOR
  if (roleName === "supervisor") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-4xl mb-6 shadow-sm border border-red-200">
          ⛔
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Akses Dibatasi
        </h1>
        <p className="text-slate-500 mt-2 mb-8 max-w-md leading-relaxed">
          Akun <b>Supervisor</b> hanya memiliki hak akses untuk memantau
          dashboard dan audit log, bukan untuk mengajukan peminjaman.
        </p>
        <Link
          href="/supervisor"
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  // 3. Ambil Resource (Untuk User Biasa/Admin)
  const { data: resource } = await supabase
    .from("resources")
    .select("*, version")
    .eq("id", id)
    .single();

  if (!resource)
    return (
      <div className="text-center p-20 text-slate-500">
        Resource tidak ditemukan
      </div>
    );

  const unit = resource.type === "Room" ? "Orang" : "Unit";

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 md:px-8 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Form Peminjaman</h1>
          <p className="text-slate-500">
            Resource:{" "}
            <span className="font-bold text-indigo-600">{resource.name}</span>
            <span className="mx-2">•</span>
            Kapasitas: {resource.capacity} {unit}
          </p>
        </div>

        <BookingForm
          resourceId={id}
          resourceName={resource.name}
          currentVersion={resource.version}
        />
      </div>
    </div>
  );
}
