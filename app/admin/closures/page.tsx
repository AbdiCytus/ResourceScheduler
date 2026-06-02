import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ClosuresClient from "./closures-client";
import { getBuildingClosures } from "./actions";

export const dynamic = "force-dynamic";

export default async function BuildingClosuresPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("roles(name)").eq("id", user.id).single();
  if ((profile?.roles as any)?.name !== "admin") redirect("/portal");

  const closures = await getBuildingClosures();

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <ClosuresClient initialClosures={closures} />
      </div>
    </div>
  );
}
