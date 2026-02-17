"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// --- KONSTANTA SISTEM ---
const FREEZE_TIME_HOURS = 24; // Batas waktu beku (Safe Preemption Policy)

// Bobot Penilaian (Weighted Priority Algorithm)
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

  // 1. AUTH & ROLE CHECK
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Ambil Role User dari database untuk perhitungan skor
  const { data: profile } = await supabase
    .from("profiles")
    .select("roles (name)")
    .eq("id", user.id)
    .single();

  // Default ke 'user' jika gagal ambil role
  const userRole = (profile?.roles as any)?.name || "user";

  // 2. PARSE DATA FORM
  const resourceId = formData.get("resourceId") as string;
  const rawVersion = formData.get("expectedVersion");
  const expectedVersion = rawVersion ? parseInt(rawVersion as string) : 0;

  const date = formData.get("date") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const urgency = formData.get("urgency") as string;

  const startDateTime = new Date(`${date}T${startTime}:00`).toISOString();
  const endDateTime = new Date(`${date}T${endTime}:00`).toISOString();
  const now = new Date();

  // 3. VALIDASI DASAR
  if (startDateTime >= endDateTime) {
    return { error: "Waktu selesai harus lebih besar dari waktu mulai." };
  }
  if (new Date(startDateTime) < now) {
    return { error: "Tidak bisa mengajukan jadwal di masa lalu." };
  }
  if (!urgency) {
    return { error: "Harap pilih tingkat urgensi." };
  }

  // 4. HITUNG SKOR (WEIGHTED PRIORITY)
  const roleScore = ROLE_WEIGHTS[userRole] || 10;
  const urgencyScore = URGENCY_WEIGHTS[urgency] || 10;
  const totalScore = roleScore + urgencyScore;

  // 5. DETEKSI KONFLIK & PREEMPTION (PENGGESERAN JADWAL)
  // Cek apakah ada jadwal 'approved' yang bertabrakan
  const { data: conflict } = await supabase
    .from("schedules")
    .select("id, priority_level, calculated_score, start_time, title, user_id")
    .eq("resource_id", resourceId)
    .eq("status", "approved")
    .or(`and(start_time.lt.${endDateTime},end_time.gt.${startDateTime})`)
    .single();

  let preemptionMessage = "";

  if (conflict) {
    // A. Hitung Selisih Waktu (Freeze Time Rule)
    const conflictStartTime = new Date(conflict.start_time);
    const hoursUntilStart =
      (conflictStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const conflictScore = conflict.calculated_score || 0;

    console.log(
      `KONFLIK: New(${totalScore}) vs Old(${conflictScore}). Sisa Jam: ${hoursUntilStart.toFixed(
        1
      )}`
    );

    // B. Logika Skor: Apakah kita kalah atau seri?
    if (totalScore <= conflictScore) {
      return {
        error: `Jadwal Penuh! Ada kegiatan "${conflict.title}" (Skor: ${conflictScore}). Skor Anda (${totalScore}) tidak cukup untuk menggesernya.`,
      };
    }

    // C. Logika Freeze Time: Apakah sudah terlalu dekat (< 24 jam)?
    if (hoursUntilStart < FREEZE_TIME_HOURS) {
      return {
        error: `Gagal Menggeser! Jadwal yang ada akan dimulai dalam ${hoursUntilStart.toFixed(
          1
        )} jam (< 24 jam). Aturan "Freeze Time" mencegah pembatalan mendadak.`,
      };
    }

    // D. Logika Preemption Sukses: Batalkan jadwal lama
    const { error: cancelError, data: cancelledData } = await supabase
      .from("schedules")
      .update({
        status: "cancelled",
        rejection_reason: `Dibatalkan otomatis: Digeser oleh jadwal prioritas lebih tinggi (Skor ${totalScore} vs ${conflictScore}).`,
      })
      .eq("id", conflict.id)
      .select();

    if (cancelError) {
      console.error("Gagal cancel:", cancelError);
      return {
        error: "Terjadi kesalahan sistem saat mencoba membatalkan jadwal lama.",
      };
    }

    // Pastikan pembatalan benar-benar terjadi (cek permission RLS)
    if (!cancelledData || cancelledData.length === 0) {
      return {
        error:
          "Gagal menggeser jadwal! RLS Error: Sistem tidak dapat membatalkan jadwal lama.",
      };
    }

    await logActivity(supabase, user.id, "PREEMPT_SCHEDULE", {
      victim_schedule_id: conflict.id,
      victim_title: conflict.title,
      reason: `Skor ${totalScore} mengalahkan ${conflictScore}`,
    });

    preemptionMessage = " (Menggeser jadwal prioritas lebih rendah)";
  }

  // 6. SIMPAN JADWAL BARU DENGAN OPTIMISTIC LOCKING
  // Menggunakan RPC (Database Function) untuk memastikan atomicity & version check
  const { data: transactionResult, error: rpcError } = await supabase.rpc(
    "create_schedule_with_locking",
    {
      p_user_id: user.id,
      p_resource_id: resourceId,
      p_start_time: startDateTime,
      p_end_time: endDateTime,
      p_title: title,
      p_description: description,
      p_priority_level: urgency, // pastikan value sesuai enum ('low', 'medium', etc)
      p_score: totalScore,
      p_expected_version: expectedVersion, // Versi yang dipegang User saat buka form
    }
  );

  if (rpcError) {
    console.error("RPC Error:", rpcError);
    // Handle error spesifik enum jika ada
    if (rpcError.message.includes("invalid input value for enum")) {
      return { error: "Nilai urgensi tidak valid." };
    }
    return { error: "Terjadi kesalahan sistem database (RPC)." };
  }

  // Cek hasil logika dari dalam Function SQL
  if (!transactionResult.success) {
    // Ini return jika Version tidak cocok (Race Condition) atau Insert gagal
    return { error: transactionResult.message };
  }

  await logActivity(supabase, user.id, "CREATE_SCHEDULE", {
    resource_id: resourceId,
    date: date,
    time: `${startTime} - ${endTime}`,
    score: totalScore,
    urgency: urgency,
  });

  // 7. SUKSES & REDIRECT
  revalidatePath("/portal");
  const finalMessage = `Jadwal berhasil dibuat!${preemptionMessage}`;
  redirect(`/portal?success=${encodeURIComponent(finalMessage)}`);
}

// --- HELPER: Catat Audit Log ---
async function logActivity(
  supabase: any,
  userId: string,
  action: string,
  details: any
) {
  await supabase.from("audit_logs").insert({
    user_id: userId,
    action: action,
    details: details,
    created_at: new Date().toISOString(),
  });
}
