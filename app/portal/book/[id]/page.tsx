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

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single();
  const roleName = (profile?.roles as any)?.name || "user";

  const { data: resource } = await supabase
    .from("resources")
    .select("*")
    .eq("id", id)
    .single();
  if (!resource) redirect("/portal");

  const settings = await getSettings(supabase);

  // Bobot dari Pengaturan Admin
  const wAdmin = parseInt(settings["role_weight_admin"] || "30");
  const wSuper = parseInt(settings["role_weight_supervisor"] || "25");
  const wUser = parseInt(settings["role_weight_user"] || "20");

  // Kalkulasi Role Weight untuk User yang Login
  let userRoleWeight = wUser;
  if (roleName === "admin") userRoleWeight = wAdmin;
  else if (roleName === "supervisor") userRoleWeight = wSuper;

  const actualNow = new Date();
  const startOfDay = new Date(actualNow);
  startOfDay.setHours(0, 0, 0, 0);

  // Ambil Jadwal beserta Role-nya
  const { data: rawSchedules } = await supabase
    .from("schedules")
    .select(
      "id, title, start_time, end_time, priority_level, quantity_borrowed, profiles(full_name, roles(name))",
    )
    .eq("resource_id", id)
    .eq("status", "approved")
    .gte("start_time", startOfDay.toISOString())
    .order("start_time", { ascending: true })
    .limit(50);

  // Kalkulasi Skor dan Freeze Time untuk Jadwal Eksisting
  const existingSchedules = (rawSchedules || []).map((sch) => {
    // 1. Hitung Skor
    const vRole =
      (Array.isArray(sch.profiles) ? sch.profiles[0] : sch.profiles)?.roles
        ?.name || "user";
    let vRoleWeight = wUser;
    if (vRole === "admin") vRoleWeight = wAdmin;
    else if (vRole === "supervisor") vRoleWeight = wSuper;

    const vUrgWeight =
      sch.priority_level === "high"
        ? 60
        : sch.priority_level === "medium"
          ? 30
          : 10;
    const score = vRoleWeight + vUrgWeight;

    // 2. Cek Freeze Time
    const victimStart = new Date(sch.start_time);
    const diffHours =
      (victimStart.getTime() - actualNow.getTime()) / (1000 * 60 * 60);
    const isSameDay = victimStart.toDateString() === actualNow.toDateString();

    let isFrozen = false;
    if (isSameDay && diffHours < 1)
      isFrozen = true; // 1 Jam hari H
    else if (!isSameDay && diffHours < 24) isFrozen = true; // 24 Jam H-

    // Tambahkan properti baru
    return { ...sch, score, isFrozen };
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Peminjaman Resource
          </h1>
          <p className="text-slate-500">
            Silakan isi formulir di bawah untuk mengajukan peminjaman.
          </p>
        </div>

        <BookingForm
          resourceId={resource.id}
          resourceName={resource.name}
          resourceType={resource.type}
          capacity={resource.capacity}
          facilities={resource.facilities}
          minNotice={settings["min_booking_notice"] || "30"}
          opStart={settings["operational_start"] || "08:00"}
          opEnd={settings["operational_end"] || "17:00"}
          existingSchedules={existingSchedules}
          userRoleWeight={userRoleWeight}
        />
      </div>
    </div>
  );
}
