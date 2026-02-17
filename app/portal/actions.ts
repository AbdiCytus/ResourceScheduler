"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// --- KONSTANTA ---
const FREEZE_TIME_HOURS = 24; // Batas waktu beku (sesuai dokumen)

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

  // 1. Auth & Role Check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Ambil Role User
  const { data: profile } = await supabase
    .from("profiles")
    .select("roles (name)")
    .eq("id", user.id)
    .single();

  // Safe access role name
  const userRole = (profile?.roles as any)?.name || "user";

  // 2. Parse Data
  const resourceId = formData.get("resourceId") as string;
  const date = formData.get("date") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const urgency = formData.get("urgency") as string;

  const startDateTime = new Date(`${date}T${startTime}:00`).toISOString();
  const endDateTime = new Date(`${date}T${endTime}:00`).toISOString();
  const now = new Date();

  // Validasi Waktu
  if (startDateTime >= endDateTime) {
    return { error: "Waktu selesai harus lebih besar dari waktu mulai." };
  }
  if (new Date(startDateTime) < now) {
    return { error: "Tidak bisa mengajukan jadwal di masa lalu." };
  }

  // 3. HITUNG SKOR (NEW REQUEST)
  const roleScore = ROLE_WEIGHTS[userRole] || 10;
  const urgencyScore = URGENCY_WEIGHTS[urgency] || 10;
  const totalScore = roleScore + urgencyScore;

  // 4. DETEKSI KONFLIK & LOGIKA PREEMPTION
  // Cari jadwal 'approved' yang bertabrakan
  const { data: conflict } = await supabase
    .from("schedules")
    .select("id, priority_level, calculated_score, start_time, title, user_id")
    .eq("resource_id", resourceId)
    .eq("status", "approved") // Hanya yang sudah disetujui yang dianggap bentrok
    .or(`and(start_time.lt.${endDateTime},end_time.gt.${startDateTime})`)
    .single();

  if (conflict) {
    // A. HITUNG SELISIH WAKTU (Untuk Freeze Time Rule)
    const conflictStartTime = new Date(conflict.start_time);
    const hoursUntilStart =
      (conflictStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const conflictScore = conflict.calculated_score || 0;

    console.log(
      `KONFLIK DETECTED: New(${totalScore}) vs Old(${conflictScore}). HoursLeft: ${hoursUntilStart.toFixed(
        1
      )}`
    );

    // B. LOGIKA 1: SKOR KALAH ATAU SERI
    if (totalScore <= conflictScore) {
      return {
        error: `Jadwal Penuh! Ada kegiatan "${conflict.title}" dengan skor prioritas ${conflictScore}. Skor Anda (${totalScore}) tidak cukup untuk menggesernya.`,
      };
    }

    // C. LOGIKA 2: SKOR MENANG TAPI KENA FREEZE TIME (< 24 Jam)
    if (hoursUntilStart < FREEZE_TIME_HOURS) {
      return {
        error: `Gagal Menggeser! Meskipun prioritas Anda lebih tinggi, jadwal yang ada akan dimulai dalam ${hoursUntilStart.toFixed(
          1
        )} jam (< 24 jam). Aturan "Freeze Time" mencegah pembatalan mendadak.`,
      };
    }

    // D. LOGIKA 3: SKOR MENANG & AMAN (PREEMPTION SUCCESS)
    // Langkah: Batalkan jadwal lama -> Masukkan jadwal baru

    // 1. Batalkan jadwal lama (Victim)
    // TAMBAHAN: Kita minta return data (.select) untuk memastikan ada baris yang berubah
    const { error: cancelError, data: cancelledData } = await supabase
      .from("schedules")
      .update({
        status: "cancelled",
        rejection_reason: `Dibatalkan otomatis oleh sistem: Digeser oleh jadwal prioritas lebih tinggi (Score ${totalScore} vs ${conflictScore}).`,
      })
      .eq("id", conflict.id)
      .select(); // Penting: Agar kita tahu ada data yang ter-update

    // Cek Error Database
    if (cancelError) {
      console.error("Gagal cancel:", cancelError);
      return {
        error: "Terjadi kesalahan sistem saat mencoba membatalkan jadwal lama.",
      };
    }

    // CEK PENTING: Apakah ada data yang benar-benar berubah?
    // Jika RLS memblokir, cancelledData akan kosong []
    if (!cancelledData || cancelledData.length === 0) {
      return {
        error:
          "Gagal menggeser jadwal! Anda tidak memiliki hak akses (Role Admin diperlukan) untuk membatalkan jadwal orang lain.",
      };
    }

    // Lanjut ke penyimpanan jadwal baru (di bawah)...
    // Kita tambahkan catatan di deskripsi bahwa ini hasil preemption
  }

  // 5. SIMPAN JADWAL BARU
  const { error } = await supabase.from("schedules").insert({
    user_id: user.id,
    resource_id: resourceId,
    start_time: startDateTime,
    end_time: endDateTime,
    title,
    description,
    status: "approved",
    priority_level: urgency,
    calculated_score: totalScore,
    version: 1,
  });

  if (error) {
    console.error(error);
    return { error: "Gagal menyimpan jadwal." };
  }

  revalidatePath("/portal");
  // Redirect dengan pesan sukses berbeda jika ada konflik yang dimenangkan
  const successMessage = conflict
    ? "Jadwal berhasil dibuat! (Menggeser jadwal prioritas lebih rendah)"
    : "Jadwal berhasil dibuat!";

  redirect(`/portal?success=${encodeURIComponent(successMessage)}`);
}
