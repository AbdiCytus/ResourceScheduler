import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import SupervisorClient from "./supervisor-client";

export const dynamic = "force-dynamic";

// --- HEROICONS SVG COMPONENTS ---
const IconCalendar = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-8 h-8"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0V7.5"
    />
  </svg>
);

const IconExclamation = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-8 h-8"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
    />
  </svg>
);

const IconServer = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-8 h-8"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3v3.75a3 3 0 0 1-3 3m-13.5 0a3 3 0 0 0-3 3v3.75a3 3 0 0 0 3 3h13.5a3 3 0 0 0 3-3v-3.75a3 3 0 0 0-3-3m-13.5 0h13.5m-13.5-6h.008v.008H5.25V8.25Zm0 9h.008v.008H5.25v-.008Zm13.5-9h.008v.008h-.008V8.25Zm0 9h.008v.008h-.008v-.008Z"
    />
  </svg>
);

const IconChevronLeft = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-4 h-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 19.5L8.25 12l7.5-7.5"
    />
  </svg>
);

export default async function SupervisorDashboard() {
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
  const roleName = (profile?.roles as any)?.name;

  // Proteksi Halaman
  if (roleName !== "supervisor" && roleName !== "admin") redirect("/portal");

  const now = new Date().toISOString();

  // Ambil Data Statistik & Log secara paralel
  const [active, preempted, settings, { data: rawSchedules, error }] =
    await Promise.all([
      supabase
        .from("schedules")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved")
        .gt("end_time", now),
      supabase
        .from("schedules")
        .select("*", { count: "exact", head: true })
        .eq("status", "cancelled")
        .ilike("description", "%Digeser%"),
      supabase
        .from("system_settings")
        .select("value")
        .eq("key", "is_maintenance")
        .single(),
      supabase
        .from("schedules")
        .select(
          `
        *,
        resources (name, type),
        profiles (full_name, roles(name))
    `,
        )
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

  if (error) console.error("Database error:", error.message);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 text-slate-900">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Monitoring</h1>
            <p className="text-slate-500 font-medium italic">
              Audit log performa sistem & preemption.
            </p>
          </div>
          <Link
            href="/portal"
            className="bg-white border border-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-2xl text-sm hover:bg-slate-50 transition shadow-sm flex items-center gap-2"
          >
            <IconChevronLeft /> Kembali ke Portal
          </Link>
        </div>

        {/* Statistik Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Jadwal Aktif"
            value={active.count || 0}
            icon={<IconCalendar />}
            color="text-indigo-600"
            bg="bg-indigo-50"
          />
          <StatCard
            title="Insiden Preemption"
            value={preempted.count || 0}
            icon={<IconExclamation />}
            color="text-rose-600"
            bg="bg-rose-50"
          />
          <StatCard
            title="Status Sistem"
            value={settings?.value === "true" ? "Maint." : "Online"}
            icon={<IconServer />}
            color="text-emerald-600"
            bg="bg-emerald-50"
          />
        </div>

        {/* Tabel Interaktif (Client) */}
        <SupervisorClient schedules={rawSchedules || []} />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, bg }: any) {
  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-5 transition-transform hover:scale-[1.02]">
      <div
        className={`w-16 h-16 ${bg} ${color} rounded-3xl flex items-center justify-center`}
      >
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
          {title}
        </p>
        <h3 className="text-3xl font-black leading-none mt-1">{value}</h3>
      </div>
    </div>
  );
}
