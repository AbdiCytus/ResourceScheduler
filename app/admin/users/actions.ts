"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function approveUser(userId: string) {
  const supabase = await createClient();

  // Cek apakah user yang melakukan request adalah Admin (Opsional tapi bagus untuk security)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("profiles")
    .update({ is_approved: true })
    .eq("id", userId);

  if (error) {
    console.error("Approval Error:", error);
    return { error: "Gagal approve: " + error.message };
  }

  revalidatePath("/admin/users");
  return { success: "User berhasil disetujui." };
}

export async function deleteUser(userId: string) {
  const supabase = await createClient();

  // Note: Menghapus user di Supabase idealnya via supabase.auth.admin.deleteUser (butuh Service Role)
  // Tapi untuk skripsi, kita bisa set is_active = false atau hapus dari profiles (tergantung FK).
  // Di sini kita coba hapus profiles dulu. Jika Auth user mau dihapus, butuh RPC atau Service Key.
  // Agar simpel: Kita hapus profile saja. User Auth akan jadi "yatim" (tidak masalah utk login krn kita cek profile)

  const { error } = await supabase.from("profiles").delete().eq("id", userId);

  if (error)
    return {
      error: "Gagal menghapus user. Pastikan tidak ada data jadwal terkait.",
    };

  revalidatePath("/admin/users");
  return { success: "User berhasil dihapus." };
}
