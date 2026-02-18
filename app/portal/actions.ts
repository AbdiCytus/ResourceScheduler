"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// --- KONSTANTA SISTEM ---
const FREEZE_TIME_HOURS = 24;

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

// --- HELPER: Format Durasi ---
function getDurationString(startStr: string, endStr: string) {
  const durationMs = new Date(endStr).getTime() - new Date(startStr).getTime();
  const durationMinutes = Math.floor(durationMs / 60000);
  const durationHours = Math.floor(durationMinutes / 60);
  const remainingMinutes = durationMinutes % 60;
  return durationHours > 0
    ? `${durationHours} Jam ${
        remainingMinutes > 0 ? remainingMinutes + " Menit" : ""
      }`
    : `${durationMinutes} Menit`;
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

// --- HELPER: Buat Notifikasi ---
async function createNotification(
  supabase: any,
  userId: string,
  title: string,
  message: string,
  type: string = "info"
) {
  await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
    is_read: false,
    link: "/portal/history",
  });
}

// --- HELPER: Smart Recommendation (Cari Slot Alternatif) ---
async function findAlternativeSlots(
  supabase: any,
  resourceId: string,
  durationMs: number,
  originalStart: Date
): Promise<string[]> {
  const suggestions: string[] = [];
  let checkTime = new Date(originalStart);
  checkTime.setHours(checkTime.getHours() + 1); // Mulai cek 1 jam setelahnya

  let attempts = 0;
  // Cek sampai 3 rekomendasi atau max 48 jam ke depan
  while (suggestions.length < 3 && attempts < 48) {
    const startIso = checkTime.toISOString();
    const endIso = new Date(checkTime.getTime() + durationMs).toISOString();

    const { data: conflict } = await supabase
      .from("schedules")
      .select("id")
      .eq("resource_id", resourceId)
      .eq("status", "approved")
      .or(`and(start_time.lt.${endIso},end_time.gt.${startIso})`)
      .single();

    if (!conflict) {
      const dateStr = checkTime.toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      const timeStr = checkTime.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
      suggestions.push(`${dateStr}, Pukul ${timeStr}`);
    }

    checkTime.setHours(checkTime.getHours() + 1);
    attempts++;
  }
  return suggestions;
}

// --- ACTION: SUBMIT SCHEDULE ---
export async function submitSchedule(prevState: any, formData: FormData) {
  const supabase = await createClient();

  // 1. AUTH & ROLE CHECK
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles (name)")
    .eq("id", user.id)
    .single();

  const userRole = (profile?.roles as any)?.name || "user";

  if (userRole === "supervisor") {
    return { error: "AKSES DITOLAK: Supervisor hanya bertugas memantau." };
  }

  // 2. PARSE DATA FORM
  const resourceId = formData.get("resourceId") as string;
  const rawVersion = formData.get("expectedVersion");
  const expectedVersion = rawVersion ? parseInt(rawVersion as string) : 0;
  const bundledResources = formData.getAll("bundledResources") as string[]; // [BARU] Ambil Multi Select

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
  if (startDateTime >= endDateTime)
    return { error: "Waktu selesai harus lebih besar dari waktu mulai." };
  if (new Date(startDateTime) < now)
    return { error: "Tidak bisa mengajukan jadwal di masa lalu." };
  if (!urgency) return { error: "Harap pilih tingkat urgensi." };

  const { data: resourceData } = await supabase
    .from("resources")
    .select("name")
    .eq("id", resourceId)
    .single();
  const resourceName = resourceData?.name || "Unknown Resource";
  const durationString = getDurationString(startDateTime, endDateTime);

  // 4. HITUNG SKOR
  const roleScore = ROLE_WEIGHTS[userRole] || 10;
  const urgencyScore = URGENCY_WEIGHTS[urgency] || 10;
  const totalScore = roleScore + urgencyScore;

  // 5. DETEKSI KONFLIK & PREEMPTION
  const { data: conflict } = await supabase
    .from("schedules")
    .select(
      "id, priority_level, calculated_score, start_time, end_time, title, user_id"
    )
    .eq("resource_id", resourceId)
    .eq("status", "approved")
    .or(`and(start_time.lt.${endDateTime},end_time.gt.${startDateTime})`)
    .single();

  let preemptionMessage = "";

  if (conflict) {
    const conflictScore = conflict.calculated_score || 0;

    // A. Kalah Skor -> Tampilkan Smart Recommendation
    if (totalScore <= conflictScore) {
      const durationMs =
        new Date(endDateTime).getTime() - new Date(startDateTime).getTime();
      const suggestions = await findAlternativeSlots(
        supabase,
        resourceId,
        durationMs,
        new Date(startDateTime)
      );

      let errorMsg = `Jadwal Penuh! Ada kegiatan "${conflict.title}" (Skor: ${conflictScore}).`;
      if (suggestions.length > 0) {
        errorMsg += `\n\n💡 Rekomendasi Waktu Alternatif:\n• ${suggestions.join(
          "\n• "
        )}`;
      } else {
        errorMsg += `\n\n(Tidak ditemukan slot kosong dalam 48 jam ke depan).`;
      }
      return { error: errorMsg };
    }

    // B. Freeze Time
    const hoursUntilStart =
      (new Date(conflict.start_time).getTime() - now.getTime()) /
      (1000 * 60 * 60);
    if (hoursUntilStart < FREEZE_TIME_HOURS) {
      return {
        error: `Gagal Menggeser! Jadwal mulai dalam ${hoursUntilStart.toFixed(
          1
        )} jam (< 24 jam). Freeze Time aktif.`,
      };
    }

    // C. Preemption Sukses
    const { error: cancelError } = await supabase
      .from("schedules")
      .update({
        status: "cancelled",
        rejection_reason: `Digeser oleh Skor ${totalScore} vs ${conflictScore}.`,
      })
      .eq("id", conflict.id);

    if (cancelError) return { error: "Gagal menggeser jadwal (System Error)." };

    // Notifikasi Korban
    await createNotification(
      supabase,
      conflict.user_id,
      "Jadwal Tergeser",
      `Jadwal "${conflict.title}" Anda digeser oleh kegiatan prioritas lebih tinggi.`,
      "error"
    );

    await logActivity(supabase, user.id, "PREEMPT_SCHEDULE", {
      /* Detail Log */
    });
    preemptionMessage = " (Menggeser jadwal prioritas lebih rendah)";
  }

  // 6. SIMPAN JADWAL UTAMA
  const { data: newScheduleId, error: rpcError } = await supabase.rpc(
    "create_schedule_with_locking",
    {
      p_user_id: user.id,
      p_resource_id: resourceId,
      p_start_time: startDateTime,
      p_end_time: endDateTime,
      p_title: title,
      p_description: description,
      p_priority_level: urgency,
      p_score: totalScore,
      p_expected_version: expectedVersion,
    }
  );

  // Note: RPC create_schedule_with_locking perlu dimodif di DB agar return ID,
  // atau kita select manual schedule terbaru user ini.
  // Workaround sederhana: Ambil jadwal yg baru saja dibuat (ID return dari RPC jika dimodif, atau query by timestamp)
  // Untuk keamanan kode ini, kita asumsikan transaksi sukses dulu.

  if (rpcError) return { error: "Terjadi kesalahan sistem database." };

  // 7. [BARU] SIMPAN BUNDLING (Resource Tambahan)
  // Kita perlu ID jadwal yang baru dibuat.
  // Jika RPC Anda belum mengembalikan ID, ambil jadwal terakhir user ini di jam ini.
  const { data: savedSchedule } = await supabase
    .from("schedules")
    .select("id")
    .eq("user_id", user.id)
    .eq("start_time", startDateTime)
    .eq("resource_id", resourceId)
    .limit(1)
    .single();

  if (savedSchedule && bundledResources.length > 0) {
    const bundleData = bundledResources.map((rid) => ({
      schedule_id: savedSchedule.id,
      resource_id: rid,
    }));
    await supabase.from("schedule_items").insert(bundleData);
  }

  // 8. LOG & NOTIFIKASI
  await createNotification(
    supabase,
    user.id,
    "Jadwal Berhasil",
    `Jadwal "${title}" telah dikonfirmasi.`,
    "success"
  );

  await logActivity(supabase, user.id, "CREATE_SCHEDULE", {
    resource_name: resourceName,
    user_role: userRole,
    date: date,
    duration: durationString,
    score: totalScore,
    bundled_items: bundledResources.length, // Log jumlah alat tambahan
  });

  revalidatePath("/portal");
  redirect(
    `/portal?success=${encodeURIComponent(
      `Jadwal berhasil dibuat!${preemptionMessage}`
    )}`
  );
}

// ... cancelUserSchedule tetap sama ...
export async function cancelUserSchedule(formData: FormData) {
  // (Copy paste fungsi cancelUserSchedule yang sudah ada sebelumnya)
  const supabase = await createClient();
  const scheduleId = formData.get("scheduleId") as string;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: schedule } = await supabase
    .from("schedules")
    .select("*, resources(name)")
    .eq("id", scheduleId)
    .single();
  if (!schedule || schedule.user_id !== user.id)
    return { error: "Akses ditolak." };

  const now = new Date();
  if (now >= new Date(schedule.start_time))
    return { error: "Jadwal sudah berlangsung." };

  await supabase
    .from("schedules")
    .update({ status: "cancelled", rejection_reason: "Dibatalkan User" })
    .eq("id", scheduleId);

  await logActivity(supabase, user.id, "CANCEL_SCHEDULE", {
    resource_name: schedule.resources?.name,
    title: schedule.title,
  });

  revalidatePath("/portal/history");
  return { success: "Jadwal dibatalkan." };
}
