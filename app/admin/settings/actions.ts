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
    { key: "max_advance_days", value: formData.get("max_advance_days") as string },
    { key: "min_booking_notice", value: formData.get("min_booking_notice") as string },
    { key: "building_open", value: (formData.get("building_open") as string) || "08:00" },
    { key: "building_close", value: (formData.get("building_close") as string) || "18:00" },
    // Field Bobot Role
    {
      key: "role_weight_admin",
      value: (formData.get("role_weight_admin") as string) || "30",
    },
    {
      key: "role_weight_kajur",
      value: (formData.get("role_weight_kajur") as string) || "25",
    },
    {
      key: "role_weight_dosen",
      value: (formData.get("role_weight_dosen") as string) || "22",
    },
    {
      key: "role_weight_mahasiswa",
      value: (formData.get("role_weight_mahasiswa") as string) || "20",
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
    revalidatePath("/supervisor"); // path halaman kajur

    return { success: "Pengaturan sistem berhasil diperbarui!" };
  } catch (error: any) {
    return { error: `Gagal menyimpan pengaturan: ${error.message}` };
  }
}

// --- UPDATE BOBOT TEMPLATE KEGIATAN ---
export async function updateActivityWeight(id: string, weight: number) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tidak terautentikasi." };

  const { error } = await supabase
    .from("activity_templates")
    .update({ weight })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/settings");
  return { success: true };
}

// --- BUAT TEMPLATE KEGIATAN BARU ---
export async function createActivityTemplate(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tidak terautentikasi." };

  const name = (formData.get("name") as string)?.trim();
  const weight = parseInt(formData.get("weight") as string);
  const rolesRaw = formData.getAll("allowed_roles") as string[];

  if (!name) return { error: "Nama kegiatan wajib diisi." };
  if (!weight || weight < 1) return { error: "Bobot minimal 1." };
  if (rolesRaw.length === 0) return { error: "Pilih minimal 1 role." };

  const { error } = await supabase.from("activity_templates").insert({
    name,
    weight,
    allowed_roles: rolesRaw,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/settings");
  return { success: `Template "${name}" berhasil ditambahkan.` };
}

// --- HAPUS TEMPLATE KEGIATAN ---
export async function deleteActivityTemplate(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tidak terautentikasi." };

  const { error } = await supabase.from("activity_templates").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/settings");
  return { success: true };
}

// --- UPDATE TEMPLATE KEGIATAN (nama, bobot, role) ---
export async function updateActivityTemplate(id: string, name: string, weight: number, allowedRoles: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tidak terautentikasi." };

  if (!name?.trim()) return { error: "Nama kegiatan wajib diisi." };
  if (!weight || weight < 1) return { error: "Bobot tidak valid." };
  if (allowedRoles.length === 0) return { error: "Pilih minimal 1 role." };

  const { error } = await supabase
    .from("activity_templates")
    .update({ name: name.trim(), weight, allowed_roles: allowedRoles })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/settings");
  return { success: true };
}
