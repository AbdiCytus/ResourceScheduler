import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import SettingsForm from "./settings-form" // Kita pisah client component
import { getSystemSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();

  // 1. Cek Auth & Role Admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles (name)")
    .eq("id", user.id)
    .single();
  const role = (profile?.roles as any)?.name;

  if (role !== "admin") redirect("/portal");

  // 2. Ambil Data Settings
  const settings = await getSystemSettings();

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Pengaturan Sistem
        </h1>
        <p className="text-slate-500 mb-8">
          Konfigurasi aturan penjadwalan dan operasional aplikasi.
        </p>

        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
