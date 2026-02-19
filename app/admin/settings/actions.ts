"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getSystemSettings() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("system_settings").select("*");

  if (error) console.error(error);

  const settings: Record<string, string> = {};
  data?.forEach((item) => {
    settings[item.key] = item.value;
  });

  return settings;
}

export async function updateSystemSettings(formData: FormData) {
  const supabase = await createClient();

  const updates = [
    {
      key: "operational_start",
      value: formData.get("operational_start") as string,
    },
    {
      key: "operational_end",
      value: formData.get("operational_end") as string,
    },
    {
      key: "max_booking_duration",
      value: formData.get("max_booking_duration") as string,
    },
    {
      key: "max_advance_days",
      value: formData.get("max_advance_days") as string,
    },
    {
      key: "is_maintenance",
      value: formData.get("is_maintenance") === "on" ? "true" : "false",
    },
    // [POIN 2] Simpan Setting Waktu Booking Minimal (Freeze Time)
    {
      key: "min_booking_notice",
      value: formData.get("min_booking_notice") as string,
    },
  ];

  const { error } = await supabase.from("system_settings").upsert(updates);

  if (error) return { error: "Gagal menyimpan pengaturan: " + error.message };

  revalidatePath("/admin/settings");
  revalidatePath("/portal"); // Refresh portal agar user langsung kena efeknya
  return { success: "Pengaturan sistem berhasil diperbarui!" };
}
