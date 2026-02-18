"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Klien Khusus Admin (Bypass RLS)
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Mapping Role ke ID (Sesuaikan dengan DB Anda)
const ROLE_MAP: Record<string, number> = {
  admin: 1,
  user: 2,
  supervisor: 3,
};

export async function createUser(formData: FormData) {
  // 1. Ambil Data Form
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const username = formData.get("username") as string;
  const roleName = formData.get("role") as string;
  const roleId = ROLE_MAP[roleName] || 2; // Default User

  // 2. Cek Username Unik (Pakai Admin Client agar pasti bisa baca semua)
  const { data: existingUser } = await supabaseAdmin
    .from("profiles")
    .select("username")
    .eq("username", username)
    .single();

  if (existingUser) {
    return { error: `Username '${username}' sudah digunakan.` };
  }

  // 3. Buat User di Supabase Auth
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Langsung verifikasi email
      user_metadata: { full_name: fullName },
    });

  if (authError) return { error: authError.message };
  if (!authData.user) return { error: "Gagal membuat user auth." };

  // 4. Update Profile (Username, Role, Approved)
  // Kita update profile yang otomatis dibuat oleh Trigger (atau insert manual jika trigger belum ada)
  // Tunggu sebentar agar trigger database selesai
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({
      full_name: fullName,
      username: username,
      role_id: roleId,
      is_approved: true, // Admin yang buat, jadi langsung approve
      email: email,
    })
    .eq("id", authData.user.id);

  // Fallback: Jika update gagal (misal trigger lambat), coba Insert manual
  if (profileError) {
    console.error(
      "Update profile gagal, mencoba insert manual...",
      profileError
    );
    await supabaseAdmin.from("profiles").upsert({
      id: authData.user.id,
      full_name: fullName,
      username: username,
      role_id: roleId,
      is_approved: true,
      email: email,
    });
  }

  revalidatePath("/admin/users");
  return { success: true };
}

// ... (Fungsi approveUser dan deleteUser yang lama tetap ada di bawah sini)
export async function approveUser(userId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_approved: true })
    .eq("id", userId);
  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return { success: "User disetujui." };
}

export async function deleteUser(userId: string) {
  // Gunakan Admin Client untuk hapus Auth User juga
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return { success: "User dihapus permanen." };
}
