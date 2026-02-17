"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// --- 1. DEFINISI BOBOT (ALGORITMA) ---
const ROLE_WEIGHTS: Record<string, number> = {
  admin: 50,
  supervisor: 30,
  user: 10,
};

const URGENCY_WEIGHTS: Record<string, number> = {
  critical: 40,
  high: 30,
  medium: 20,
  low: 10,
};

export async function submitSchedule(prevState: any, formData: FormData) {
  const supabase = await createClient();

  // 1. Auth Check & Get User Role
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Ambil Role User dari tabel profiles untuk perhitungan bobot
  const { data: profile } = await supabase
    .from("profiles")
    .select("roles (name)") // Join ke tabel roles
    .eq("id", user.id)
    .single();

  // Deteksi nama role (default 'user' jika gagal fetch)
  // Note: Supabase return structure: profile.roles.name (karena join)
  const userRole = (profile?.roles as any)?.name || "user";

  // 2. Parse Data Form
  const resourceId = formData.get("resourceId") as string;
  const date = formData.get("date") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const urgency = formData.get("urgency") as string; // Ambil urgensi

  const startDateTime = new Date(`${date}T${startTime}:00`).toISOString();
  const endDateTime = new Date(`${date}T${endTime}:00`).toISOString();

  if (startDateTime >= endDateTime) {
    return { error: "Waktu selesai harus lebih besar dari waktu mulai." };
  }

  // --- 3. HITUNG SKOR PRIORITY (WEIGHTED PRIORITY ALGORITHM) ---
  const roleScore = ROLE_WEIGHTS[userRole] || 10;
  const urgencyScore = URGENCY_WEIGHTS[urgency] || 10;
  const totalScore = roleScore + urgencyScore;

  // 4. DETEKSI KONFLIK
  const { data: conflict } = await supabase
    .from("schedules")
    .select("id, priority_level, calculated_score")
    .eq("resource_id", resourceId)
    .eq("status", "approved")
    .or(`and(start_time.lt.${endDateTime},end_time.gt.${startDateTime})`)
    .single();

  if (conflict) {
    // --- FITUR LANJUTAN (NANTI): SAFE PREEMPTION ---
    // Di sinilah nanti kita cek:
    // Jika (totalScore > conflict.calculated_score) DAN (bukan Freeze Time)
    // Maka: Batalkan jadwal lama, Masukkan jadwal baru.

    // TAPI UNTUK SEKARANG (STEP 1): Kita tolak dulu, tapi kasih info skor.
    return {
      error: `Jadwal bentrok! Skor Anda (${totalScore}) vs Peminjam Lama (${
        conflict.calculated_score || 0
      }). Fitur penggeseran jadwal otomatis belum aktif.`,
    };
  }

  // 5. SIMPAN KE DB DENGAN SKOR
  const { error } = await supabase.from("schedules").insert({
    user_id: user.id,
    resource_id: resourceId,
    start_time: startDateTime,
    end_time: endDateTime,
    title,
    description,
    status: "approved",
    priority_level: urgency, // Simpan level urgensi text
    calculated_score: totalScore, // Simpan hasil perhitungan
    version: 1,
  });

  if (error) {
    console.error(error);
    return { error: "Gagal menyimpan jadwal." };
  }

  revalidatePath("/portal");
  redirect("/portal?success=Jadwal berhasil dibuat!");
}
