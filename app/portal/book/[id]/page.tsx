import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import BookingForm from "./booking-form";

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

  const { data: resource } = await supabase
    .from("resources")
    .select("*")
    .eq("id", id)
    .single();
  if (!resource) redirect("/portal");

  const settings = await getSettings(supabase);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const { data: existingSchedules } = await supabase
    .from("schedules")
    // [UPDATE] Tambahkan quantity_borrowed
    .select(
      "id, title, start_time, end_time, priority_level, quantity_borrowed, profiles(full_name)",
    )
    .eq("resource_id", id)
    .eq("status", "approved")
    .gte("start_time", now.toISOString())
    .order("start_time", { ascending: true })
    .limit(50);

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
          existingSchedules={existingSchedules || []}
        />
      </div>
    </div>
  );
}
