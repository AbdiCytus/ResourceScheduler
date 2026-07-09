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
  const nim = formData.get("nim") as string | null;
  const prodi = formData.get("prodi") as string | null;

  // Siapkan object data update untuk profil
  const updates: any = {};

  // 2. Update Username (jika berubah)
  if (username && username.trim().length > 0) {
    // Cek unik (kecuali punya sendiri)
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .neq("id", user.id) // Abaikan user sendiri
      .maybeSingle();

    if (existing) {
      return { error: "Username sudah dipakai orang lain." };
    }
    updates.username = username;
  }

  // 2b. Update NIM & Prodi
  if (nim !== null) {
    if (nim.trim().length > 0) {
      const { data: existingNim } = await supabase
        .from("profiles")
        .select("id")
        .eq("nim", nim)
        .neq("id", user.id)
        .maybeSingle();

      if (existingNim) {
        return { error: `NIM '${nim}' sudah digunakan oleh user lain.` };
      }
      updates.nim = nim;
    } else {
      updates.nim = null;
    }
  }

  if (prodi !== null) {
    updates.prodi = prodi;
  }

  // Eksekusi update profile jika ada yang dirubah
  if (Object.keys(updates).length > 0) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update(updates)
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
