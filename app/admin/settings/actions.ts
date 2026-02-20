"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// --- [BARU DITAMBAHKAN KEMBALI] Fungsi untuk mengambil data settings ---
export async function getSystemSettings() {
  const supabase = await createClient();
  const { data } = await supabase.from("system_settings").select("*");

  const settings: Record<string, string> = {};
  data?.forEach((item: any) => {
    settings[item.key] = item.value;
  });

  return settings;
}

// --- Fungsi untuk menyimpan data settings ---
export async function updateSettings(prevState: any, formData: FormData) {
  const supabase = await createClient();

  // Validasi Otorisasi (Hanya Admin yang boleh ubah setting)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Anda harus login." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single();
  if ((profile?.roles as any)?.name !== "admin") {
    return {
      error: "Akses ditolak. Hanya Admin yang dapat mengubah pengaturan.",
    };
  }

  // Ambil semua data dari Form
  const settingsData = [
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
      key: "min_booking_notice",
      value: formData.get("min_booking_notice") as string,
    },
    // Field Bobot Baru
    {
      key: "role_weight_admin",
      value: (formData.get("role_weight_admin") as string) || "30",
    },
    {
      key: "role_weight_supervisor",
      value: (formData.get("role_weight_supervisor") as string) || "25",
    },
    {
      key: "role_weight_user",
      value: (formData.get("role_weight_user") as string) || "20",
    },
    // Field Checkbox Maintenance
    {
      key: "is_maintenance",
      value: formData.get("is_maintenance") === "true" ? "true" : "false",
    },
  ];

  // Simpan ke Database (Tabel system_settings)
  try {
    for (const setting of settingsData) {
      if (setting.value !== null && setting.value !== undefined) {
        const { error } = await supabase
          .from("system_settings")
          .upsert(
            { key: setting.key, value: setting.value },
            { onConflict: "key" },
          );

        if (error) throw new Error(error.message);
      }
    }

    // Refresh cache halaman agar efeknya langsung terasa
    revalidatePath("/admin/settings");
    revalidatePath("/portal");
    revalidatePath("/supervisor");

    return { success: "Pengaturan sistem berhasil diperbarui!" };
  } catch (error: any) {
    return { error: `Gagal menyimpan pengaturan: ${error.message}` };
  }
}
