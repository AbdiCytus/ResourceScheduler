import { createClient } from "@/utils/supabase/server";
import NavbarClient from "./navbar-client"; // Import komponen client baru

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("roles (name)")
      .eq("id", user.id)
      .single();
    role = (profile?.roles as any)?.name;
  }

  // Kirim data user & role ke Client Component
  return <NavbarClient user={user} role={role} />;
}
