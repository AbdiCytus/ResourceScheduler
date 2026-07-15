import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import CustomToast from "@/components/custom-toast";
import PortalClient from "./portal-client";

export const dynamic = "force-dynamic";

async function getSettings(supabase: any) {
  const { data } = await supabase.from("system_settings").select("*");
  const settings: Record<string, string> = {};
  data?.forEach((item: any) => (settings[item.key] = item.value));
  return settings;
}

async function getJadwalMengajar(userId: string, supabase: any) {
  // Cek role user
  const { data: userRole } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", userId)
    .single();

  // Jika bukan dosen, berikan data kosong
  if (userRole?.roles.name !== "dosen") return [];

  // Ambil nama lengkap dosen
  const { data: userFullName } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();

  // Ambil jadwal mengajar dosen
  const { data } = await supabase
    .from("teaching_schedules")
    .select("*, resources(name)")
    .eq("dosen_pengampu", userFullName?.full_name)
    .order("day_of_week")
    .order("start_time");
  
  // Return jadwal mengajar
  return data;
}

export default async function UserPortal({
  searchParams,
}: {
  searchParams: Promise<{ success: string; error: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Ambil jadwal mengajar
  const mengajar = await getJadwalMengajar(user.id, supabase);

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles (name)")
    .eq("id", user.id)
    .single();
  const roleName = (profile?.roles as any)?.name;
  const isKajur = roleName === "kajur";

  const settings = await getSettings(supabase);

  const { data: allResources } = await supabase
    .from("resources")
    .select("*")
    .order("name");
  const now = new Date();
  const resources =
    allResources?.filter((res) => {
      if (!res.scheduled_for_deletion_at) return true;
      return new Date(res.scheduled_for_deletion_at) > now;
    }) || [];

  const { data: allSchedules } = await supabase
    .from("schedules")
    .select(
      `id, title, start_time, end_time, resource_id, priority_level, quantity_borrowed, status, resources(name, type), profiles(full_name)`,
    )
    .gte(
      "start_time",
      new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    )
    .order("start_time")
    .limit(500);

  const { data: allTeachingSchedules } = await supabase
    .from("teaching_schedules")
    .select("id, resource_id, day_of_week, start_time, end_time, matakuliah, kelas, dosen_pengampu, is_offline, resources(name)")
    .order("day_of_week")
    .order("start_time");

  // Fetch building closures (tanggal tutup gedung)
  const { data: buildingClosures } = await supabase
    .from("building_closures")
    .select("date, reason")
    .gte("date", new Date().toISOString().split("T")[0]);

  const closureDates = (buildingClosures || []).map((c: any) => c.date);
  const activeResourceIds = resources.map((res) => res.id);

  const activeSchedules = allSchedules?.filter((schedule) => activeResourceIds.includes(schedule.resource_id)) || [];
  const activeTeachingSchedules = allTeachingSchedules?.filter((schedule) => 
    activeResourceIds.includes(schedule.resource_id)
  ) || [];
  

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <CustomToast />

      {/* INFO BAR — sticky di bawah navbar */}
      <div className="sticky top-16 z-40 w-full shadow-sm">
        {settings["is_maintenance"] === "true" ? (
          <div className="w-full px-6 py-2.5 text-xs font-bold bg-red-600 text-white flex items-center justify-center gap-2 tracking-wider animate-pulse">
            ⚠️ SISTEM SEDANG MAINTENANCE — Peminjaman Ditutup Sementara
          </div>
        ) : (
          <div className="w-full px-6 py-2.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border-indigo-100 flex items-center gap-2">
            📅 Peminjaman tersedia <strong>Senin – Jumat</strong>, di luar hari itu gedung tidak beroperasi.
          </div>
        )}
      </div>

      <div className="p-6 md:p-8 flex flex-col flex-1">
        <div className="max-w-7xl mx-auto w-full mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Portal Peminjaman</h1>
          <p className="text-slate-500 mt-1">
            {isKajur
              ? "Mode Pemantauan Kajur"
              : "Pilih ruangan atau cek jadwal kegiatan."}
          </p>
        </div>

        <div className="max-w-7xl mx-auto w-full flex-1">
          <PortalClient
            mengajar={mengajar}
            resources={resources}
            schedules={activeSchedules || []}
            teachingSchedules={activeTeachingSchedules || []}
            closureDates={closureDates}
            isSupervisor={isKajur}
            settings={settings}
          />
        </div>
      </div>
    </div>
  );
}
