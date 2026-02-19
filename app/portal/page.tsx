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

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles (name)")
    .eq("id", user.id)
    .single();
  const roleName = (profile?.roles as any)?.name;
  const isSupervisor = roleName === "supervisor";

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
    // [PERBAIKAN DISINI] Tambahkan 'type' pada resources(name, type)
    .select(
      `id, title, start_time, end_time, resource_id, priority_level, quantity_borrowed, status, resources(name, type), profiles(full_name)`,
    )
    .gte(
      "start_time",
      new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    )
    .order("start_time")
    .limit(500);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 flex flex-col">
      <CustomToast />

      <div className="max-w-7xl mx-auto w-full mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Portal Peminjaman</h1>
        <p className="text-slate-500 mt-1">
          {isSupervisor
            ? "Mode Pemantauan Supervisor"
            : "Pilih ruangan atau cek jadwal kegiatan."}
        </p>
      </div>

      <div className="max-w-7xl mx-auto w-full flex-1">
        <PortalClient
          resources={resources}
          schedules={allSchedules || []}
          isSupervisor={isSupervisor}
          settings={settings}
        />
      </div>
    </div>
  );
}
