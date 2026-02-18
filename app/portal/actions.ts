"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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

// --- HELPER LOG ---
async function logActivity(
  supabase: any,
  userId: string,
  action: string,
  details: any
) {
  await supabase.from("audit_logs").insert({
    user_id: userId,
    action,
    details,
    created_at: new Date().toISOString(),
  });
}

// --- HELPER NOTIFIKASI ---
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

// --- HELPER FIND ALTERNATIVE ---
async function findAlternativeSlots(
  supabase: any,
  resourceId: string,
  durationMs: number,
  originalStart: Date
): Promise<string[]> {
  const suggestions: string[] = [];
  let checkTime = new Date(originalStart);
  checkTime.setHours(checkTime.getHours() + 1);
  let attempts = 0;
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
      suggestions.push(
        `${checkTime.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
        })}, ${checkTime.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        })}`
      );
    }
    checkTime.setHours(checkTime.getHours() + 1);
    attempts++;
  }
  return suggestions;
}

export async function submitSchedule(prevState: any, formData: FormData) {
  const supabase = await createClient();

  // 1. AUTH CHECK
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
  if (userRole === "supervisor") return { error: "Supervisor hanya memantau." };

  // 2. PARSE DATA
  const resourceId = formData.get("resourceId") as string;
  const date = formData.get("date") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const urgency = formData.get("urgency") as string;
  const qtyRaw = formData.get("quantity");
  const requestedQty = qtyRaw ? parseInt(qtyRaw as string) : 1;

  const startDateTime = new Date(`${date}T${startTime}:00`).toISOString();
  const endDateTime = new Date(`${date}T${endTime}:00`).toISOString();
  const now = new Date();

  if (startDateTime >= endDateTime)
    return { error: "Jam selesai harus lebih besar." };
  if (new Date(startDateTime) < now) return { error: "Waktu sudah lewat." };
  if (requestedQty < 1) return { error: "Jumlah minimal 1." };

  // 3. AMBIL INFO RESOURCE
  const { data: resource } = await supabase
    .from("resources")
    .select("name, type, capacity")
    .eq("id", resourceId)
    .single();
  if (!resource) return { error: "Resource tidak valid." };

  if (requestedQty > resource.capacity) {
    return { error: `Permintaan melebihi stok total (${resource.capacity}).` };
  }

  // 4. LOGIKA KONFLIK
  const roleScore = ROLE_WEIGHTS[userRole] || 10;
  const urgencyScore = URGENCY_WEIGHTS[urgency] || 10;
  const totalScore = roleScore + urgencyScore;

  if (resource.type === "Room") {
    const { data: conflict } = await supabase
      .from("schedules")
      .select("id, calculated_score, start_time, title, user_id")
      .eq("resource_id", resourceId)
      .eq("status", "approved")
      .or(`and(start_time.lt.${endDateTime},end_time.gt.${startDateTime})`)
      .single();

    if (conflict) {
      const conflictScore = conflict.calculated_score || 0;
      // Kalah Skor
      if (totalScore <= conflictScore) {
        const durationMs =
          new Date(endDateTime).getTime() - new Date(startDateTime).getTime();
        const suggestions = await findAlternativeSlots(
          supabase,
          resourceId,
          durationMs,
          new Date(startDateTime)
        );
        return {
          error: `Jadwal Penuh! Ada kegiatan "${
            conflict.title
          }".\nAlternatif: ${suggestions.join(", ") || "Tidak ada slot"}`,
        };
      }

      // Preemption (Menang Skor)
      const hoursUntilStart =
        (new Date(conflict.start_time).getTime() - now.getTime()) / 36e5;
      if (hoursUntilStart < FREEZE_TIME_HOURS)
        return { error: "Freeze Time: Tidak bisa menggeser < 24 jam." };

      await supabase
        .from("schedules")
        .update({
          status: "cancelled",
          rejection_reason: `Digeser prioritas tinggi.`,
        })
        .eq("id", conflict.id);

      // NOTIFIKASI KORBAN PREEMPTION
      await createNotification(
        supabase,
        conflict.user_id,
        "Jadwal Digeser Sistem",
        `Jadwal "${conflict.title}" Anda dibatalkan karena ada kegiatan prioritas lebih tinggi (Skor ${totalScore} vs ${conflictScore}).`,
        "error"
      );

      await logActivity(supabase, user.id, "PREEMPT_SCHEDULE", {
        title: conflict.title,
      });
    }
  } else {
    // Equipment Logic
    const { data: overlaps } = await supabase
      .from("schedules")
      .select("quantity_borrowed")
      .eq("resource_id", resourceId)
      .eq("status", "approved")
      .or(`and(start_time.lt.${endDateTime},end_time.gt.${startDateTime})`);

    const currentUsed =
      overlaps?.reduce((sum, item) => sum + (item.quantity_borrowed || 1), 0) ||
      0;
    const available = resource.capacity - currentUsed;
    if (requestedQty > available) {
      return {
        error: `Stok habis di jam ini! Tersedia: ${available} unit. Diminta: ${requestedQty} unit.`,
      };
    }
  }

  // 5. SIMPAN JADWAL
  const { error: insertError } = await supabase.from("schedules").insert({
    user_id: user.id,
    resource_id: resourceId,
    start_time: startDateTime,
    end_time: endDateTime,
    title: title,
    description: description,
    priority_level: urgency,
    calculated_score: totalScore,
    quantity_borrowed: requestedQty,
    status: "approved",
    created_at: new Date().toISOString(),
  });

  if (insertError) return { error: insertError.message };

  // NOTIFIKASI SUKSES (Lonceng) - Tetap Ada
  await createNotification(
    supabase,
    user.id,
    "Jadwal Dikonfirmasi",
    `Jadwal "${title}" pada ${date} berhasil dibuat.`,
    "success"
  );

  await logActivity(supabase, user.id, "CREATE_SCHEDULE", {
    resource: resource.name,
    qty: requestedQty,
  });

  revalidatePath("/portal");

  // [PERUBAHAN DISINI] Hapus parameter success agar Banner tidak muncul
  redirect(`/portal`);
}

export async function cancelUserSchedule(formData: FormData) {
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

  await supabase
    .from("schedules")
    .update({ status: "cancelled", rejection_reason: "Dibatalkan User" })
    .eq("id", scheduleId);

  // NOTIFIKASI PEMBATALAN (Lonceng)
  await createNotification(
    supabase,
    user.id,
    "Jadwal Dibatalkan",
    `Anda telah membatalkan manual jadwal "${schedule.title}" di ${schedule.resources?.name}.`,
    "warning"
  );

  await logActivity(supabase, user.id, "CANCEL_SCHEDULE", {
    title: schedule.title,
  });

  revalidatePath("/portal/history");
  return { success: "Dibatalkan." };
}
