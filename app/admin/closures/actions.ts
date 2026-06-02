"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getBuildingClosures() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("building_closures")
    .select("*")
    .order("date", { ascending: true });
  return data || [];
}

export async function addBuildingClosure(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tidak terautentikasi." };

  const date = formData.get("date") as string;
  const reason = (formData.get("reason") as string)?.trim() || null;

  if (!date) return { error: "Tanggal wajib diisi." };

  const { error } = await supabase.from("building_closures").insert({
    date,
    reason,
    created_by: user.id,
  });

  if (error) {
    if (error.code === "23505") return { error: `Tanggal ${date} sudah terdaftar sebagai hari tutup.` };
    return { error: error.message };
  }

  revalidatePath("/admin/closures");
  revalidatePath("/portal");

  // Auto-cancel semua booking yang sudah approved di tanggal ini
  const cancelled = await cancelBookingsOnClosedDay(date);
  const cancelledMsg = cancelled.cancelled > 0
    ? ` ${cancelled.cancelled} booking yang ada di tanggal ini telah dibatalkan otomatis.`
    : "";

  return { success: `Tanggal ${date} berhasil ditambahkan sebagai hari tutup gedung.${cancelledMsg}` };
}

export async function deleteBuildingClosure(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tidak terautentikasi." };

  const { error } = await supabase.from("building_closures").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/closures");
  revalidatePath("/portal");
  return { success: true };
}

// Auto-cancel bookings on closed days (called server-side)
export async function cancelBookingsOnClosedDay(date: string) {
  const supabase = await createClient();

  const startOfDay = `${date}T00:00:00+08:00`;
  const endOfDay = `${date}T23:59:59+08:00`;

  const { data: bookings } = await supabase
    .from("schedules")
    .select("id, title, user_id")
    .eq("status", "approved")
    .gte("start_time", startOfDay)
    .lte("start_time", endOfDay);

  if (!bookings || bookings.length === 0) return { cancelled: 0 };

  for (const b of bookings) {
    await supabase
      .from("schedules")
      .update({ status: "cancelled", description: "Dibatalkan otomatis: gedung tutup pada tanggal ini." })
      .eq("id", b.id);

    await supabase.from("notifications").insert({
      user_id: b.user_id,
      title: "Booking Dibatalkan",
      message: `Jadwal "${b.title}" dibatalkan otomatis karena gedung tutup pada ${date}.`,
      type: "warning",
      is_read: false,
    });
  }

  return { cancelled: bookings.length };
}
