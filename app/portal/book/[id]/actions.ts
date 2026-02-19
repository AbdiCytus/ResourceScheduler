"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const SCORE_ROLES: Record<string, number> = {
  admin: 100,
  supervisor: 50,
  user: 10,
};
const SCORE_PRIORITY: Record<string, number> = {
  high: 30,
  medium: 20,
  low: 10,
};

async function getSettings(supabase: any) {
  const { data } = await supabase.from("system_settings").select("*");
  const settings: Record<string, string> = {};
  data?.forEach((item: any) => (settings[item.key] = item.value));
  return settings;
}

function calculateScore(role: string, priority: string) {
  const roleScore = SCORE_ROLES[role] || 10;
  const prioScore = SCORE_PRIORITY[priority] || 10;
  return roleScore + prioScore;
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

// Helper: Cari Alternatif Slot (Diupdate untuk Equipment)
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
      ? overlaps.reduce((sum, s) => sum + (s.quantity_borrowed || 1), 0)
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
  const title = formData.get("title") as string;
  const priority = (formData.get("priority_level") as string) || "medium";
  const description = formData.get("description") as string;
  const quantity = parseInt(
    (formData.get("quantity_borrowed") as string) || "1",
  );

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

  if (startDate >= endDate)
    return { error: "Waktu selesai harus lebih besar dari mulai." };

  // 1. VALIDASI SETTINGS ADMIN
  const config = await getSettings(supabase);
  if (config["is_maintenance"] === "true")
    return { error: "⛔ Sistem sedang Maintenance." };

  const minNoticeMinutes = parseInt(config["min_booking_notice"] || "30");
  const now = new Date();
  if (startDate.getTime() - now.getTime() < minNoticeMinutes * 60 * 1000) {
    return {
      error: `⏳ Pemesanan minimal ${minNoticeMinutes} menit sebelum acara dimulai.`,
    };
  }

  const durationMs = endDate.getTime() - startDate.getTime();
  const maxDur = parseInt(config["max_booking_duration"] || "4");
  if (durationMs / 36e5 > maxDur)
    return { error: `⚠️ Durasi maks ${maxDur} jam.` };

  const [startH, startM] = startTimeRaw.split(":").map(Number);
  const [endH, endM] = endTimeRaw.split(":").map(Number);
  const reqStart = startH + startM / 60;
  const reqEnd = endH + endM / 60;
  const [opStartH, opStartM] = (config["operational_start"] || "08:00")
    .split(":")
    .map(Number);
  const [opEndH, opEndM] = (config["operational_end"] || "17:00")
    .split(":")
    .map(Number);

  if (reqStart < opStartH + opStartM / 60 || reqEnd > opEndH + opEndM / 60) {
    return {
      error: `⚠️ Di luar jam operasional (${config["operational_start"]} - ${config["operational_end"]})`,
    };
  }

  const maxDays = parseInt(config["max_advance_days"] || "3");
  const limitDate = new Date();
  limitDate.setDate(limitDate.getDate() + maxDays);
  limitDate.setHours(23, 59, 59, 999);
  if (startDate > limitDate)
    return { error: `⚠️ Peminjaman maksimal ${maxDays} hari ke depan.` };

  // 2. CEK BENTROK, KAPASITAS & SKOR
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Login required." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single();
  const userRole = (profile?.roles as any)?.name || "user";
  const newScore = calculateScore(userRole, priority);

  const { data: resource } = await supabase
    .from("resources")
    .select("capacity, type")
    .eq("id", resourceId)
    .single();
  const capacityLimit = resource?.capacity || 1;
  const isEquipment = resource?.type === "Equipment";

  if (quantity > capacityLimit)
    return {
      error: `⚠️ Jumlah melebihi kapasitas maksimal (${capacityLimit}).`,
    };

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
    if (isEquipment) {
      // Kalkulasi Peak Overlap (Sweep-line algorithm)
      const events = [];
      conflicts.forEach((c) => {
        events.push({
          time: new Date(c.start_time).getTime(),
          diff: c.quantity_borrowed || 1,
        });
        events.push({
          time: new Date(c.end_time).getTime(),
          diff: -(c.quantity_borrowed || 1),
        });
      });
      events.push({ time: startDate.getTime(), diff: quantity });
      events.push({ time: endDate.getTime(), diff: -quantity });
      events.sort((a, b) =>
        a.time === b.time ? a.diff - b.diff : a.time - b.time,
      );

      let maxConcurrent = 0;
      let currentConcurrent = 0;
      for (const ev of events) {
        currentConcurrent += ev.diff;
        if (currentConcurrent > maxConcurrent)
          maxConcurrent = currentConcurrent;
      }

      if (maxConcurrent > capacityLimit) {
        hasConflict = true;
        requiredFreed = maxConcurrent - capacityLimit;
      }
    } else {
      hasConflict = true;
      requiredFreed = 1;
    }
  }

  // Preemption Logic
  let preemptedVictims = [];
  if (hasConflict) {
    const conflictsWithScore = conflicts!
      .map((c) => ({
        ...c,
        score: calculateScore(
          c.profiles?.roles?.name || "user",
          c.priority_level,
        ),
      }))
      .sort((a, b) => a.score - b.score);

    let freedUnits = 0;
    for (const c of conflictsWithScore) {
      if (newScore > c.score) {
        preemptedVictims.push(c);
        freedUnits += isEquipment ? c.quantity_borrowed || 1 : capacityLimit;
        if (freedUnits >= requiredFreed) break;
      }
    }

    if (freedUnits < requiredFreed) {
      const alternatives = await findAlternatives(
        supabase,
        resourceId,
        durationMs,
        endDate,
        quantity,
        capacityLimit,
      );
      let errorMsg = `❌ Slot penuh / Unit tidak mencukupi, dan Skor Anda kalah tinggi.`;
      if (alternatives.length > 0)
        errorMsg += ` Rekomendasi waktu kosong terdekat: ${alternatives.join(", ")}`;
      return { error: errorMsg };
    } else {
      for (const v of preemptedVictims) {
        await supabase
          .from("schedules")
          .update({
            status: "cancelled",
            description: `Digeser otomatis oleh sistem (Prioritas Tinggi: ${title})`,
          })
          .eq("id", v.id);
        await createNotification(
          supabase,
          v.user_id,
          "Jadwal Digeser",
          `Maaf, jadwal "${v.title}" digeser karena ada peminjaman urgensi tinggi.`,
          "warning",
        );
      }
    }
  }

  // 3. INSERT
  const { error } = await supabase.from("schedules").insert({
    title,
    description,
    start_time: startStr,
    end_time: endStr,
    resource_id: resourceId,
    user_id: user.id,
    priority_level: priority,
    quantity_borrowed: quantity,
    status: "approved",
  });

  if (error) return { error: error.message };
  revalidatePath("/portal");
  if (preemptedVictims.length > 0)
    return {
      success:
        "⚠️ SUKSES (PREEMPTION): Jadwal Anda berhasil memotong jadwal yang urgensinya lebih rendah.",
    };
  return { success: "Berhasil! Jadwal telah dibuat." };
}
