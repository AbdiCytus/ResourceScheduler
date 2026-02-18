"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(prevState: any, formData: FormData) {
  const supabase = await createClient();

  // 1. Ambil User saat ini
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi habis, silakan login ulang." };

  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // 2. Update Username (jika berubah)
  if (username && username.trim().length > 0) {
    // Cek unik (kecuali punya sendiri)
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .neq("id", user.id) // Abaikan user sendiri
      .single();

    if (existing) {
      return { error: "Username sudah dipakai orang lain." };
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ username })
      .eq("id", user.id);

    if (profileError)
      return { error: "Gagal update profile: " + profileError.message };
  }

  // 3. Update Password (jika diisi)
  if (password) {
    if (password.length < 6) return { error: "Password minimal 6 karakter." };
    if (password !== confirmPassword)
      return { error: "Konfirmasi password tidak cocok." };

    const { error: authError } = await supabase.auth.updateUser({
      password: password,
    });
    if (authError)
      return { error: "Gagal update password: " + authError.message };
  }

  revalidatePath("/", "layout"); // Refresh semua halaman agar username di navbar berubah
  return { success: "Profil berhasil diperbarui!" };
}
