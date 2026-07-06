"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function cancelBooking(scheduleId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tidak terautentikasi." };

  // Ambil data booking — pastikan milik user ini
  const { data: schedule, error: fetchErr } = await supabase
    .from("schedules")
    .select("user_id, start_time, status")
    .eq("id", scheduleId)
    .single();

  if (fetchErr || !schedule) return { error: "Booking tidak ditemukan." };
  if (schedule.user_id !== user.id) return { error: "Tidak diizinkan." };
  if (schedule.status === "cancelled") return { error: "Booking sudah dibatalkan." };

  // Cek waktu: hanya bisa dibatalkan sebelum waktu mulai
  const startTime = new Date(schedule.start_time);
  if (new Date() >= startTime) {
    return { error: "Tidak bisa membatalkan booking yang sudah memasuki waktu pemakaian." };
  }

  const { error } = await supabase
    .from("schedules")
    .update({ status: "cancelled", rejection_reason: "Dibatalkan oleh pengguna." })
    .eq("id", scheduleId);

  if (error) return { error: error.message };

  revalidatePath("/portal/history");
  return { success: true };
}
