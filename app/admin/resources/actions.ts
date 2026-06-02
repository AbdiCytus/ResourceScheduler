"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// --- CREATE RESOURCE (Hanya Ruangan) ---
export async function createResource(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const capacity = parseInt(formData.get("capacity") as string) || 1;
  const description = formData.get("description") as string;

  const facilitiesRaw = formData.get("facilities") as string;
  const facilities = facilitiesRaw
    ? facilitiesRaw
        .split(",")
        .map((item) => item.trim())
        .filter((i) => i)
    : [];

  const { error } = await supabase.from("resources").insert({
    name,
    type: "Room", // Selalu Room sekarang
    capacity,
    description,
    is_active: true,
    facilities,
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
  const capacity = parseInt(formData.get("capacity") as string) || 1;
  const description = formData.get("description") as string;
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
    .update({ name, type: "Room", capacity, description, is_active: isActive, facilities })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/resources");
  revalidatePath("/portal");
  return { success: true };
}

// --- DELETE RESOURCE (SMART DELETE) ---
export async function deleteResource(id: string) {
  const supabase = await createClient();

  const { data: lastSchedule } = await supabase
    .from("schedules")
    .select("end_time")
    .eq("resource_id", id)
    .eq("status", "approved")
    .gt("end_time", new Date().toISOString())
    .order("end_time", { ascending: false })
    .limit(1)
    .single();

  if (lastSchedule) {
    await supabase
      .from("resources")
      .update({ scheduled_for_deletion_at: lastSchedule.end_time, is_active: false })
      .eq("id", id);

    const dateStr = new Date(lastSchedule.end_time).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    return {
      warning: true,
      message: `Resource masih digunakan. Akan dihapus otomatis setelah jadwal terakhir selesai pada: ${dateStr}.`,
    };
  }

  const { error } = await supabase.from("resources").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/resources");
  return { success: true };
}

// ============================================================
// TEACHING SCHEDULES (Jadwal Kuliah Tetap)
// ============================================================

// --- TAMBAH JADWAL KULIAH ---
export async function createTeachingSchedule(formData: FormData) {
  const supabase = await createClient();

  const resourceId = formData.get("resource_id") as string;
  const dayOfWeek = parseInt(formData.get("day_of_week") as string);
  const startTime = formData.get("start_time") as string;
  const endTime = formData.get("end_time") as string;
  const dosenPengampu = formData.get("dosen_pengampu") as string;
  const matakuliah = formData.get("matakuliah") as string;
  const kelas = formData.get("kelas") as string;

  if (!resourceId || !dayOfWeek || !startTime || !endTime || !dosenPengampu || !matakuliah || !kelas) {
    return { error: "Semua field jadwal kuliah wajib diisi." };
  }

  if (startTime >= endTime) {
    return { error: "Jam selesai harus lebih besar dari jam mulai." };
  }

  // Validasi overlap: cek apakah ada jadwal lain di hari & ruangan yang sama yang bertabrakan
  const { data: existing } = await supabase
    .from("teaching_schedules")
    .select("start_time, end_time, matakuliah")
    .eq("resource_id", resourceId)
    .eq("day_of_week", dayOfWeek);

  if (existing && existing.length > 0) {
    for (const ex of existing) {
      const exStart = ex.start_time.slice(0, 5);
      const exEnd = ex.end_time.slice(0, 5);
      // Overlap jika: newStart < exEnd DAN newEnd > exStart
      if (startTime < exEnd && endTime > exStart) {
        return {
          error: `❌ Waktu bentrok dengan jadwal "${ex.matakuliah}" (${exStart}–${exEnd}). Pilih jam yang tidak bertabrakan.`,
        };
      }
    }
  }

  const { error } = await supabase.from("teaching_schedules").insert({
    resource_id: resourceId,
    day_of_week: dayOfWeek,
    start_time: startTime,
    end_time: endTime,
    dosen_pengampu: dosenPengampu,
    matakuliah,
    kelas,
    is_offline: true,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/resources");
  return { success: true };
}

// --- TOGGLE STATUS ONLINE/OFFLINE JADWAL KULIAH ---
export async function toggleTeachingScheduleStatus(scheduleId: string, isOffline: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("teaching_schedules")
    .update({ is_offline: isOffline })
    .eq("id", scheduleId);

  if (error) return { error: error.message };
  revalidatePath("/admin/resources");
  return { success: true };
}

// --- HAPUS JADWAL KULIAH ---
export async function deleteTeachingSchedule(scheduleId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("teaching_schedules")
    .delete()
    .eq("id", scheduleId);

  if (error) return { error: error.message };
  revalidatePath("/admin/resources");
  return { success: true };
}

// --- UPDATE JADWAL KULIAH ---
export async function updateTeachingSchedule(formData: FormData) {
  const supabase = await createClient();

  const scheduleId = formData.get("schedule_id") as string;
  const dayOfWeek = parseInt(formData.get("day_of_week") as string);
  const startTime = formData.get("start_time") as string;
  const endTime = formData.get("end_time") as string;
  const matakuliah = formData.get("matakuliah") as string;
  const kelas = formData.get("kelas") as string;
  const dosenPengampu = formData.get("dosen_pengampu") as string;

  if (!startTime || !endTime || startTime >= endTime)
    return { error: "Jam selesai harus lebih dari jam mulai." };

  // Cek overlap dengan jadwal lain di ruangan yang sama (kecuali jadwal ini sendiri)
  const { data: current } = await supabase
    .from("teaching_schedules")
    .select("resource_id")
    .eq("id", scheduleId)
    .single();

  if (!current) return { error: "Jadwal tidak ditemukan." };

  const { data: existing } = await supabase
    .from("teaching_schedules")
    .select("start_time, end_time, matakuliah")
    .eq("resource_id", current.resource_id)
    .eq("day_of_week", dayOfWeek)
    .neq("id", scheduleId);

  if (existing) {
    for (const ex of existing) {
      const exStart = ex.start_time.slice(0, 5);
      const exEnd = ex.end_time.slice(0, 5);
      if (startTime < exEnd && endTime > exStart) {
        return {
          error: `❌ Waktu bentrok dengan jadwal "${ex.matakuliah}" (${exStart}–${exEnd}).`,
        };
      }
    }
  }

  const { error } = await supabase
    .from("teaching_schedules")
    .update({ day_of_week: dayOfWeek, start_time: startTime, end_time: endTime, matakuliah, kelas, dosen_pengampu: dosenPengampu })
    .eq("id", scheduleId);

  if (error) return { error: error.message };
  revalidatePath("/admin/resources");
  return { success: true };
}
