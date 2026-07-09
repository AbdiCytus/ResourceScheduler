"use server";

import { createClient } from "@/utils/supabase/server";
// 1. Impor Supabase Admin untuk menembus RLS
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// 2. Inisialisasi Admin Client
const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function batalkanJadwal(scheduleId: string) {
    const supabase = await createClient();

    // --- A. PENGAMANAN ROLE ---
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Sesi tidak ditemukan. Silakan login." };

    const { data: profile } = await supabase
        .from("profiles")
        .select("roles(name)")
        .eq("id", user.id)
        .single();

    const userRole = (profile?.roles as any)?.name;
    if (userRole !== "kajur" && userRole !== "admin") {
        return { error: "Aksi Ditolak: Anda bukan Supervisor/Admin." };
    }
    // ------------------------------------------

    // --- B. PENGECEKAN WAKTU ---
    const { data: schedule } = await supabase
        .from("schedules")
        .select("start_time, user_id, title")
        .eq("id", scheduleId)
        .single();

    if (!schedule) return { error: "Jadwal tidak ditemukan." };

    if (new Date(schedule.start_time) <= new Date()) {
        return { error: "Gagal: Jadwal sudah lewat atau sedang berlangsung." };
    }
    // ------------------------------------------

    // --- C. EKSEKUSI DENGAN ADMIN CLIENT ---
    // Kita gunakan supabaseAdmin di sini agar bisa mengubah data milik orang lain (Bypass RLS)
    const { error } = await supabaseAdmin
        .from("schedules")
        .update({ status: "cancelled", description: "Jadwal dibatalkan oleh Admin/Kajur" })
        .eq("id", scheduleId);

    if (error) return { error: error.message };

    // --- D. KIRIM NOTIFIKASI KE KORBAN ---
    await supabaseAdmin
        .from("notifications")
        .insert({
            user_id: schedule.user_id,
            title: "Jadwal Dibatalkan",
            message: `Jadwal ${schedule.title} dibatalkan oleh Admin/Kajur`,
            type: "error",
            is_read: false
        });

    revalidatePath("/supervisor");
    return { success: true };
}
