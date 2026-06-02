"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

async function getSettings(supabase: any) {
  const { data } = await supabase.from("system_settings").select("*");
  const settings: Record<string, string> = {};
  data?.forEach((item: any) => (settings[item.key] = item.value));
  return settings;
}

async function createNotification(
  supabase: any,
  userId: string,
  title: string,
  message: string,
  type: string = "info",
) {
  await supabase
    .from("notifications")
    .insert({ user_id: userId, title, message, type, is_read: false });
}

// Helper: Cari Alternatif Slot
async function findAlternatives(
  supabase: any,
  resourceId: string,
  durationMs: number,
  searchStart: Date,
  reqQty: number,
  capacity: number,
) {
  const suggestions = [];
  let checkTime = new Date(searchStart);
  checkTime.setMinutes(0, 0, 0);
  checkTime.setHours(checkTime.getHours() + 1);

  let attempts = 0;
  while (suggestions.length < 3 && attempts < 48) {
    const slotStart = new Date(checkTime);
    const slotEnd = new Date(checkTime.getTime() + durationMs);

    const { data: overlaps } = await supabase
      .from("schedules")
      .select("quantity_borrowed")
      .eq("resource_id", resourceId)
      .eq("status", "approved")
      .lt("start_time", slotEnd.toISOString())
      .gt("end_time", slotStart.toISOString());

    const totalBorrowed = overlaps
      ? overlaps.reduce(
          (sum: number, s: any) => sum + (s.quantity_borrowed || 1),
          0,
        )
      : 0;

    if (totalBorrowed + reqQty <= capacity) {
      suggestions.push(
        slotStart.toLocaleString("id-ID", {
          weekday: "short",
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    }

    checkTime.setHours(checkTime.getHours() + 1);
    attempts++;
  }
  return suggestions;
}

export async function createBooking(prevState: any, formData: FormData) {
  const supabase = await createClient();

  const resourceId = formData.get("resourceId") as string;
  const titleRaw = (formData.get("title") as string)?.trim();
  const activityId = formData.get("activity_id") as string;
  const quantity = 1; // Ruangan selalu 1
  const bookingDate = formData.get("booking_date") as string;
  const startTimeRaw = formData.get("start_time") as string;
  const endTimeRaw = formData.get("end_time") as string;

  if (!bookingDate || !startTimeRaw || !endTimeRaw)
    return { error: "Lengkapi tanggal dan waktu." };

  const TIMEZONE_OFFSET = "+08:00";
  const startStr = `${bookingDate}T${startTimeRaw}:00${TIMEZONE_OFFSET}`;
  const endStr = `${bookingDate}T${endTimeRaw}:00${TIMEZONE_OFFSET}`;
  const startDate = new Date(startStr);
  const endDate = new Date(endStr);
  const now = new Date();

  if (startDate >= endDate)
    return { error: "Waktu selesai harus lebih besar dari mulai." };

  // VALIDASI: Hanya Senin-Jumat
  const dayOfWeek = startDate.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6)
    return { error: "⛔ Peminjaman hanya berlaku Senin s/d Jumat." };

  // 1. SETTINGS & SCORE
  const config = await getSettings(supabase);
  if (config["is_maintenance"] === "true")
    return { error: "⛔ Sistem sedang Maintenance." };

  // CEK: Hari tutup gedung
  const bookingDateStr = bookingDate; // format YYYY-MM-DD
  const { data: closure } = await supabase
    .from("building_closures")
    .select("reason")
    .eq("date", bookingDateStr)
    .maybeSingle();
  if (closure)
    return { error: `⛔ Gedung tutup pada ${bookingDateStr}${closure.reason ? `: ${closure.reason}` : ""}.` };

  // CEK: Jam aktif gedung
  const buildingOpen = config["building_open"] || "08:00";
  const buildingClose = config["building_close"] || "18:00";
  const [boH, boM] = buildingOpen.split(":").map(Number);
  const [bcH, bcM] = buildingClose.split(":").map(Number);
  const [reqSH, reqSM] = startTimeRaw.split(":").map(Number);
  const [reqEH, reqEM] = endTimeRaw.split(":").map(Number);
  const openMins = boH * 60 + boM;
  const closeMins = bcH * 60 + bcM;
  const reqStartMins = reqSH * 60 + reqSM;
  const reqEndMins = reqEH * 60 + reqEM;
  if (reqStartMins < openMins || reqEndMins > closeMins)
    return { error: `⛔ Waktu peminjaman harus dalam jam aktif gedung (${buildingOpen}–${buildingClose}).` };


  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Login required." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single();
  const userRole = (profile?.roles as any)?.name || "mahasiswa";
  if (userRole === "kajur") return { error: "Kajur hanya memantau." };

  let roleWeight = parseInt(config["role_weight_mahasiswa"] || "20");
  if (userRole === "admin") roleWeight = parseInt(config["role_weight_admin"] || "30");
  else if (userRole === "kajur") roleWeight = parseInt(config["role_weight_kajur"] || "25");
  else if (userRole === "dosen") roleWeight = parseInt(config["role_weight_dosen"] || "22");

  // Ambil bobot dari activity_template
  const { data: activityTemplate } = await supabase
    .from("activity_templates")
    .select("weight, name")
    .eq("id", activityId)
    .single();

  if (!activityTemplate)
    return { error: "Template kegiatan tidak valid." };

  // Resolve judul: jika template non-kustom, judul = nama template; jika kustom/mengajar, wajib diisi
  const title = titleRaw || activityTemplate.name;
  if (!title) return { error: "Judul kegiatan wajib diisi." };

  const activityWeight = activityTemplate.weight;

  // Skor hanya berdasarkan bobot kegiatan (tidak ada bobot role)
  const newScore = activityWeight;

  // Derive priority_level dari bobot kegiatan (untuk backward compat)
  const priority = activityWeight >= 30 ? "high" : activityWeight >= 20 ? "medium" : "low";

  const { data: resource } = await supabase
    .from("resources")
    .select("capacity, version")
    .eq("id", resourceId)
    .single();
  const capacityLimit = resource?.capacity || 1;
  const currentVersion = resource?.version || 1;

  // CEK: H-Day vs H-1+
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const bookingDateObj = new Date(bookingDate + "T00:00:00");
  const diffDays = Math.floor((bookingDateObj.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
  const isHDay = diffDays === 0;

  // Ambil jadwal mengajar di ruangan & hari ini
  const { data: teachingOnDay } = await supabase
    .from("teaching_schedules")
    .select("id, matakuliah, kelas, start_time, end_time, is_offline")
    .eq("resource_id", resourceId)
    .eq("day_of_week", dayOfWeek);

  const teachingConflicts = (teachingOnDay || []).filter((t) => {
    const [tsH, tsM] = t.start_time.slice(0, 5).split(":").map(Number);
    const [teH, teM] = t.end_time.slice(0, 5).split(":").map(Number);
    const tStart = tsH * 60 + tsM;
    const tEnd = teH * 60 + teM;
    return reqStartMins < tEnd && reqEndMins > tStart;
  });

  if (isHDay) {
    // H-Day: hanya boleh jika semua slot yang overlap adalah is_offline=false (kosong)
    const activeConflicts = teachingConflicts.filter((t) => t.is_offline);
    if (activeConflicts.length > 0)
      return { error: `❌ H-Day: Ruangan sedang digunakan kuliah (${activeConflicts[0].matakuliah} ${activeConflicts[0].start_time.slice(0,5)}–${activeConflicts[0].end_time.slice(0,5)}). Hanya slot kosong yang bisa dipinjam hari ini.` };
  } else {
    // H-1+: jadwal mengajar yang is_offline=true akan ditimpa otomatis (lanjut, tidak error)
    // Tidak ada blokir dari sisi teaching schedule
  }

  // 3. CEK BENTROK booking lain
  const { data: conflicts } = await supabase
    .from("schedules")
    .select(
      `id, title, user_id, priority_level, quantity_borrowed, start_time, end_time, profiles (roles (name))`,
    )
    .eq("resource_id", resourceId)
    .eq("status", "approved")
    .lt("start_time", endStr)
    .gt("end_time", startStr);

  let hasConflict = false;
  let requiredFreed = 0;

  if (conflicts && conflicts.length > 0) {
    // Semua resource sekarang Room (bukan Equipment)
    hasConflict = true;
    requiredFreed = 1;
  }

  // 4. LOGIKA PREEMPTION & FREEZE TIME
  let preemptedVictims: any[] = [];
  if (hasConflict) {
    const conflictsWithScore = conflicts!
      .map((c) => {
        const vRole =
          (Array.isArray(c.profiles) ? c.profiles[0] : c.profiles)?.roles
            ?.name || "mahasiswa";
        let vRoleWeight = parseInt(config["role_weight_mahasiswa"] || "20");
        if (vRole === "admin") vRoleWeight = parseInt(config["role_weight_admin"] || "30");
        else if (vRole === "kajur") vRoleWeight = parseInt(config["role_weight_kajur"] || "25");
        else if (vRole === "dosen") vRoleWeight = parseInt(config["role_weight_dosen"] || "22");
        const vUrgencyWeight =
          c.priority_level === "high" ? 60 : c.priority_level === "medium" ? 30 : 10;
        return { ...c, score: vRoleWeight + vUrgencyWeight };
      })
      .sort((a, b) => a.score - b.score);

    let freedUnits = 0;
    for (const c of conflictsWithScore) {
      if (newScore > c.score) {
        const victimStart = new Date(c.start_time);
        const diffHours =
          (victimStart.getTime() - now.getTime()) / (1000 * 60 * 60);
        const isSameDay = victimStart.toDateString() === now.toDateString();

        let isFrozen = false;
        if (isSameDay && diffHours < 1) isFrozen = true;
        else if (!isSameDay && diffHours < 24) isFrozen = true;

        if (isFrozen) continue;

        preemptedVictims.push(c);
        freedUnits += capacityLimit; // Room selalu 1 slot
        if (freedUnits >= requiredFreed) break;
      }
    }

    if (freedUnits < requiredFreed) {
      const alternatives = await findAlternatives(
        supabase,
        resourceId,
        endDate.getTime() - startDate.getTime(),
        endDate,
        quantity,
        capacityLimit,
      );
      let errorMsg = `❌ Slot penuh. Jadwal tidak bisa digeser (Kalah Skor / Freeze Time).`;
      if (alternatives.length > 0)
        errorMsg += ` Rekomendasi terdekat: ${alternatives.join(", ")}`;
      return { error: errorMsg };
    }
  }

  // =========================================================================
  // 5. IMPLEMENTASI CONCURRENCY CONTROL (OPTIMISTIC LOCKING)
  // =========================================================================

  // Mencoba mengunci resource dengan menaikkan versinya.
  // Jika query ini gagal mengembalikan data (karena versi di database sudah dinaikkan user lain sedetik yang lalu),
  // maka terdeteksi Race Condition!
  const { data: lockData, error: lockError } = await supabase
    .from("resources")
    .update({ version: currentVersion + 1 })
    .eq("id", resourceId)
    .eq("version", currentVersion) // Validasi versi terakhir
    .select();

  if (lockError || !lockData || lockData.length === 0) {
    return {
      error:
        "🚨 Terjadi perebutan data (Race Condition)! Slot pada resource ini baru saja diperbarui oleh pengguna lain di detik yang sama. Silakan muat ulang halaman.",
    };
  }
  // =========================================================================

  // 6. EKSEKUSI PREEMPTION (Jika berhasil melewati Lock)
  if (preemptedVictims.length > 0) {
    for (const v of preemptedVictims) {
      await supabase
        .from("schedules")
        .update({
          status: "cancelled",
          description: `Digeser otomatis oleh sistem (Kalah Prioritas).`,
        })
        .eq("id", v.id);
      await createNotification(
        supabase,
        v.user_id,
        "Jadwal Digeser",
        `Maaf, jadwal "${v.title}" terpaksa digeser karena urgensi sistem.`,
        "warning",
      );
    }
  }

  // 7. INSERT JADWAL BARU
  const { error } = await supabase.from("schedules").insert({
    title,
    description: formData.get("description"),
    start_time: startStr,
    end_time: endStr,
    resource_id: resourceId,
    user_id: user.id,
    priority_level: priority,
    quantity_borrowed: 1,
    status: "approved",
    activity_id: activityId || null,
  });

  if (error) {
    // (Opsional: Jika insert gagal karena alasan lain, biarkan versi resource yang sudah naik, tidak merusak konsistensi data).
    return { error: error.message };
  }

  revalidatePath("/portal");
  if (preemptedVictims.length > 0)
    return {
      success:
        "⚠️ SUKSES PREEMPTION: Jadwal prioritas rendah berhasil digeser.",
    };
  return { success: "Berhasil! Jadwal telah dibuat." };
}
