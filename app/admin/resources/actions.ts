"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

// --- 1. CREATE RESOURCE (Dengan Validasi Role) ---
export async function createResource(formData: FormData) {
  const supabase = await createClient();

  // Validasi Admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const capacity = formData.get("capacity") as string;
  const description = formData.get("description") as string;

  const { error } = await supabase.from("resources").insert({
    name,
    type,
    capacity: parseInt(capacity),
    description,
    is_active: true,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/resources");
  return { success: "Resource berhasil ditambahkan!" };
}

// --- 2. UPDATE RESOURCE (Fitur Baru) ---
export async function updateResource(formData: FormData) {
  const supabase = await createClient();

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const capacity = formData.get("capacity") as string;
  const description = formData.get("description") as string;
  // Checkbox 'is_active' mengembalikan 'on' jika dicentang, null jika tidak
  const isActive = formData.get("is_active") === "on";

  const { error } = await supabase
    .from("resources")
    .update({
      name,
      type,
      capacity: parseInt(capacity),
      description,
      is_active: isActive,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/resources");
  return { success: "Resource berhasil diperbarui!" };
}

// --- 3. SMART SOFT DELETE RESOURCE ---
export async function deleteResource(id: string) {
  const supabase = await createClient();

  // A. Cek jadwal masa depan yang masih aktif
  const now = new Date().toISOString();

  const { data: futureSchedules } = await supabase
    .from("schedules")
    .select("end_time")
    .eq("resource_id", id)
    .eq("status", "approved")
    .gt("end_time", now)
    .order("end_time", { ascending: false })
    .limit(1);

  // SKENARIO 1: Resource sedang dipakai (Masa Tenggang)
  if (futureSchedules && futureSchedules.length > 0) {
    const lastScheduleTime = futureSchedules[0].end_time;

    // Tandai untuk dihapus nanti, tapi JANGAN ubah nama resource
    const { error } = await supabase
      .from("resources")
      .update({
        is_active: false, // Tutup booking baru
        scheduled_for_deletion_at: lastScheduleTime, // Jadwal hapus otomatis
      })
      .eq("id", id);

    if (error) return { error: "Gagal mengatur jadwal penghapusan." };

    revalidatePath("/admin/resources");
    return {
      warning: true,
      message: `Resource masih digunakan! Sistem menjadwalkan penghapusan otomatis pada ${new Date(
        lastScheduleTime
      ).toLocaleString(
        "id-ID"
      )}. Sementara itu, status resource diubah menjadi Non-Aktif.`,
    };
  }

  // SKENARIO 2: Resource aman -> Lakukan SOFT DELETE (Bukan Delete Permanen)
  const { error } = await supabase
    .from("resources")
    .update({
      is_active: false,
      deleted_at: new Date().toISOString(), // Tandai sudah terhapus sekarang
    })
    .eq("id", id);

  if (error) return { error: "Gagal menghapus resource." };

  revalidatePath("/admin/resources");
  return { success: "Resource berhasil dihapus (Soft Delete)." };
}
