import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import BookingForm from "./booking-form";

export const dynamic = "force-dynamic";

async function getSettings(supabase: any) {
  const { data } = await supabase.from("system_settings").select("*");
  const settings: Record<string, string> = {};
  data?.forEach((item: any) => (settings[item.key] = item.value));
  return settings;
}

export default async function BookResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  
  const { data: kajur } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single();

  const isKajur = (kajur?.roles as any)?.name === "kajur";

  if(isKajur) redirect("/portal");

  // Cek apakah hari ini Sabtu (6) atau Minggu (0) → blok akses
  const todayDay = new Date().getDay();
  if (todayDay === 0 || todayDay === 6) redirect("/portal?error=weekend");

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single();
  const roleName = (profile?.roles as any)?.name || "mahasiswa";

  const { data: resource } = await supabase
    .from("resources")
    .select("*")
    .eq("id", id)
    .single();
  if (!resource) redirect("/portal");

  const settings = await getSettings(supabase);

  // Bobot dari Pengaturan Admin
  const wAdmin = parseInt(settings["role_weight_admin"] || "30");
  const wKajur = parseInt(settings["role_weight_kajur"] || "25");
  const wDosen = parseInt(settings["role_weight_dosen"] || "22");
  const wMahasiswa = parseInt(settings["role_weight_mahasiswa"] || "20");

  let userRoleWeight = wMahasiswa;
  if (roleName === "admin") userRoleWeight = wAdmin;
  else if (roleName === "kajur") userRoleWeight = wKajur;
  else if (roleName === "dosen") userRoleWeight = wDosen;

  // Ambil template kegiatan yang sesuai role
  const { data: allTemplates } = await supabase
    .from("activity_templates")
    .select("*")
    .order("weight", { ascending: false });

  // Filter berdasarkan role (allowed_roles mengandung role user atau 'admin' jika admin)
  const activityTemplates = (allTemplates || []).filter((t: any) =>
    t.allowed_roles.includes(roleName) || t.allowed_roles.includes("admin") && roleName === "admin"
  );

  // Ambil jadwal kuliah tetap resource ini + closure dates
  const [{ data: teachingSchedules }, { data: buildingClosures }] = await Promise.all([
    supabase
      .from("teaching_schedules")
      .select("*")
      .eq("resource_id", id),
    supabase
      .from("building_closures")
      .select("date")
      .gte("date", new Date().toISOString().split("T")[0]),
  ]);

  const closureDates = (buildingClosures || []).map((c: any) => c.date);

  const actualNow = new Date();
  const startOfDay = new Date(actualNow);
  startOfDay.setHours(0, 0, 0, 0);

  // Ambil jadwal booking eksisting
  const { data: rawSchedules } = await supabase
    .from("schedules")
    .select(
      "id, title, start_time, end_time, priority_level, quantity_borrowed, profiles(full_name, roles(name)), activity_id",
    )
    .eq("resource_id", id)
    .eq("status", "approved")
    .gte("start_time", startOfDay.toISOString())
    .order("start_time", { ascending: true })
    .limit(50);

  // Kalkulasi Skor dan Freeze Time
  const existingSchedules = (rawSchedules || []).map((sch) => {
    // Skor hanya dari bobot kegiatan (priority level) — konsisten dengan actions.ts
    const score =
      sch.priority_level === "high"
        ? 60
        : sch.priority_level === "medium"
          ? 30
          : 10;

    const victimStart = new Date(sch.start_time);
    const diffHours =
      (victimStart.getTime() - actualNow.getTime()) / (1000 * 60 * 60);
    const isSameDay = victimStart.toDateString() === actualNow.toDateString();

    let isFrozen = false;
    if (isSameDay && diffHours < 1) isFrozen = true;
    else if (!isSameDay && diffHours < 24) isFrozen = true;

    return { ...sch, score, isFrozen };
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Peminjaman Ruangan
          </h1>
          <p className="text-slate-500">
            Silakan isi formulir di bawah untuk mengajukan peminjaman.
          </p>
        </div>

        <BookingForm
          resourceId={resource.id}
          resourceName={resource.name}
          capacity={resource.capacity}
          facilities={resource.facilities}
          existingSchedules={existingSchedules}
          opStart={settings["operational_start"] || "08:00"}
          opEnd={settings["operational_end"] || "17:00"}
          buildingOpen={settings["building_open"] || "08:00"}
          buildingClose={settings["building_close"] || "18:00"}
          userRoleWeight={userRoleWeight}
          activityTemplates={activityTemplates}
          teachingSchedules={teachingSchedules || []}
          closureDates={closureDates}
          userRole={roleName}
        />
      </div>
    </div>
  );
}
