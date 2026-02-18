"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// --- CREATE RESOURCE ---
export async function createResource(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const capacity = parseInt(formData.get("capacity") as string);
  const description = formData.get("description") as string;

  // [POIN #4] Default Active = true (Langsung Aktif saat dibuat)
  const isActive = true;

  // Parsing Fasilitas
  const facilitiesRaw = formData.get("facilities") as string;
  const facilities = facilitiesRaw
    ? facilitiesRaw
        .split(",")
        .map((item) => item.trim())
        .filter((i) => i)
    : [];

  const { error } = await supabase.from("resources").insert({
    name,
    type,
    capacity,
    description,
    is_active: isActive,
    facilities: facilities,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/resources");
  revalidatePath("/portal");
  return { success: true };
}

// --- UPDATE RESOURCE ---
export async function updateResource(formData: FormData) {
  const supabase = await createClient();

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const capacity = parseInt(formData.get("capacity") as string);
  const description = formData.get("description") as string;

  // Saat Edit, kita baca checkbox (User bisa menonaktifkan manual)
  const isActive = formData.get("is_active") === "on";

  const facilitiesRaw = formData.get("facilities") as string;
  const facilities = facilitiesRaw
    ? facilitiesRaw
        .split(",")
        .map((item) => item.trim())
        .filter((i) => i)
    : [];

  const { error } = await supabase
    .from("resources")
    .update({
      name,
      type,
      capacity,
      description,
      is_active: isActive,
      facilities: facilities,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/resources");
  revalidatePath("/portal");
  return { success: true };
}

// --- DELETE RESOURCE (SMART DELETE) ---
export async function deleteResource(id: string) {
  const supabase = await createClient();

  // [POIN #1] Cek jadwal terakhir yang masih aktif (masa depan)
  const { data: lastSchedule } = await supabase
    .from("schedules")
    .select("end_time")
    .eq("resource_id", id)
    .eq("status", "approved")
    .gt("end_time", new Date().toISOString()) // Hanya cek jadwal masa depan
    .order("end_time", { ascending: false }) // Ambil yang paling terakhir selesai
    .limit(1)
    .single();

  if (lastSchedule) {
    // KASUS A: Masih ada jadwal aktif.
    // Set waktu penghapusan = Waktu selesainya jadwal terakhir.
    // Set is_active = false (agar tidak bisa dibooking lagi).

    await supabase
      .from("resources")
      .update({
        scheduled_for_deletion_at: lastSchedule.end_time,
        is_active: false,
      })
      .eq("id", id);

    const dateStr = new Date(lastSchedule.end_time).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    return {
      warning: true,
      message: `Resource masih digunakan. Akan dihapus otomatis setelah jadwal terakhir selesai pada: ${dateStr}. Status resource sekarang dinonaktifkan.`,
    };
  }

  // KASUS B: Tidak ada jadwal masa depan. Hapus langsung.
  const { error } = await supabase.from("resources").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/resources");
  return { success: true };
}
