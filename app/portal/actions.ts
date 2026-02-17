'use server'

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// --- KONSTANTA SISTEM ---
const FREEZE_TIME_HOURS = 24; 

const ROLE_WEIGHTS: Record<string, number> = {
  'admin': 50,
  'supervisor': 30,
  'user': 10
};

const URGENCY_WEIGHTS: Record<string, number> = {
  'critical': 40,
  'high': 30,
  'medium': 20,
  'low': 10
};

// --- HELPER: Format Durasi ---
function getDurationString(startStr: string, endStr: string) {
  const durationMs = new Date(endStr).getTime() - new Date(startStr).getTime();
  const durationMinutes = Math.floor(durationMs / 60000);
  const durationHours = Math.floor(durationMinutes / 60);
  const remainingMinutes = durationMinutes % 60;
  return durationHours > 0 
    ? `${durationHours} Jam ${remainingMinutes > 0 ? remainingMinutes + ' Menit' : ''}` 
    : `${durationMinutes} Menit`;
}

// --- HELPER: Catat Audit Log ---
async function logActivity(supabase: any, userId: string, action: string, details: any) {
  await supabase.from("audit_logs").insert({
    user_id: userId,
    action: action,
    details: details,
    created_at: new Date().toISOString()
  });
}

// --- ACTION: USER MEMBUAT JADWAL ---
export async function submitSchedule(prevState: any, formData: FormData) {
  const supabase = await createClient();

  // 1. AUTH & ROLE CHECK
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles (name), full_name")
    .eq("id", user.id)
    .single();
  
  const userRole = (profile?.roles as any)?.name || 'user';

  if (userRole === 'supervisor') {
    return { error: "AKSES DITOLAK: Supervisor hanya bertugas memantau dan tidak dapat mengajukan jadwal." };
  }

  // 2. PARSE DATA FORM
  const resourceId = formData.get("resourceId") as string;
  const rawVersion = formData.get("expectedVersion");
  const expectedVersion = rawVersion ? parseInt(rawVersion as string) : 0; 

  const date = formData.get("date") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const urgency = formData.get("urgency") as string;

  const startDateTime = new Date(`${date}T${startTime}:00`).toISOString();
  const endDateTime = new Date(`${date}T${endTime}:00`).toISOString();
  const now = new Date();

  // 3. VALIDASI DASAR
  if (startDateTime >= endDateTime) return { error: "Waktu selesai harus lebih besar dari waktu mulai." };
  if (new Date(startDateTime) < now) return { error: "Tidak bisa mengajukan jadwal di masa lalu." };
  if (!urgency) return { error: "Harap pilih tingkat urgensi." };

  // 4. PERSIAPAN DATA LOG
  const { data: resourceData } = await supabase
    .from("resources")
    .select("name")
    .eq("id", resourceId)
    .single();
  const resourceName = resourceData?.name || "Unknown Resource";

  const durationString = getDurationString(startDateTime, endDateTime);

  // 5. HITUNG SKOR
  const roleScore = ROLE_WEIGHTS[userRole] || 10;
  const urgencyScore = URGENCY_WEIGHTS[urgency] || 10;
  const totalScore = roleScore + urgencyScore;

  // 6. DETEKSI KONFLIK & PREEMPTION
  const { data: conflict } = await supabase
    .from("schedules")
    .select("id, priority_level, calculated_score, start_time, end_time, title, user_id") // Ambil end_time juga
    .eq("resource_id", resourceId)
    .eq("status", 'approved') 
    .or(`and(start_time.lt.${endDateTime},end_time.gt.${startDateTime})`)
    .single();

  let preemptionMessage = "";

  if (conflict) {
    const conflictStartTime = new Date(conflict.start_time);
    const hoursUntilStart = (conflictStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const conflictScore = conflict.calculated_score || 0;

    if (totalScore <= conflictScore) {
      return { error: `Jadwal Penuh! Ada kegiatan "${conflict.title}" (Skor: ${conflictScore}). Skor Anda (${totalScore}) tidak cukup.` };
    }

    if (hoursUntilStart < FREEZE_TIME_HOURS) {
      return { error: `Gagal Menggeser! Jadwal mulai dalam ${hoursUntilStart.toFixed(1)} jam (< 24 jam). Freeze Time aktif.` };
    }

    // Preemption Sukses
    const { error: cancelError, data: cancelledData } = await supabase
      .from("schedules")
      .update({ 
        status: 'cancelled', 
        rejection_reason: `Dibatalkan otomatis: Digeser oleh jadwal prioritas lebih tinggi (Skor ${totalScore} vs ${conflictScore}).`
      })
      .eq("id", conflict.id)
      .select();

    if (cancelError || !cancelledData || cancelledData.length === 0) {
      return { error: "Gagal menggeser jadwal (System Error)." };
    }

    // [UPDATE] Log Preemption dengan detail lengkap agar tabel Supervisor rapi
    await logActivity(supabase, conflict.user_id, "PREEMPT_SCHEDULE", {
      resource_name: resourceName,
      user_role: "victim", // Atau role user aslinya jika kita fetch
      date: date, // Tanggal kejadian
      start_time: conflict.start_time,
      end_time: conflict.end_time,
      duration: getDurationString(conflict.start_time, conflict.end_time),
      score: conflictScore,
      title: conflict.title,
      reason: `Digeser oleh Skor ${totalScore}`
    });

    preemptionMessage = " (Menggeser jadwal prioritas lebih rendah)";
  }

  // 7. SIMPAN JADWAL BARU
  const { data: transactionResult, error: rpcError } = await supabase.rpc(
    'create_schedule_with_locking', 
    {
      p_user_id: user.id,
      p_resource_id: resourceId,
      p_start_time: startDateTime,
      p_end_time: endDateTime,
      p_title: title,
      p_description: description,
      p_priority_level: urgency,
      p_score: totalScore,
      p_expected_version: expectedVersion
    }
  );

  if (rpcError || !transactionResult.success) {
    return { error: rpcError ? "Terjadi kesalahan sistem." : transactionResult.message }; 
  }

  // 8. LOG ACTIVITY CREATE
  await logActivity(supabase, user.id, "CREATE_SCHEDULE", {
    resource_name: resourceName,
    user_role: userRole,
    date: date,
    start_time: startTime, // Format Jam:Menit saja untuk display
    end_time: endTime,
    duration: durationString,
    score: totalScore,
    title: title,
    urgency: urgency
  });

  revalidatePath("/portal");
  const finalMessage = `Jadwal berhasil dibuat!${preemptionMessage}`;
  redirect(`/portal?success=${encodeURIComponent(finalMessage)}`);
}

// --- ACTION: USER MEMBATALKAN JADWAL SENDIRI ---
export async function cancelUserSchedule(formData: FormData) {
  const supabase = await createClient();
  const scheduleId = formData.get("scheduleId") as string;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 1. Ambil Role User (Untuk Log)
  const { data: profile } = await supabase
    .from("profiles")
    .select("roles (name)")
    .eq("id", user.id)
    .single();
  const userRole = (profile?.roles as any)?.name || 'user';

  // 2. Ambil Data Jadwal Lengkap (termasuk Resource Name)
  const { data: schedule } = await supabase
    .from("schedules")
    .select(`
      *,
      resources (name)
    `)
    .eq("id", scheduleId)
    .single();

  if (!schedule) return { error: "Jadwal tidak ditemukan." };

  if (schedule.user_id !== user.id) {
    return { error: "Anda tidak memiliki izin membatalkan jadwal ini." };
  }

  const now = new Date();
  const startTime = new Date(schedule.start_time);

  if (now >= startTime) {
    return { error: "Tidak dapat membatalkan jadwal yang sedang atau sudah berlangsung." };
  }

  // 3. Update Status
  const { error } = await supabase
    .from("schedules")
    .update({ 
      status: 'cancelled',
      rejection_reason: 'Dibatalkan oleh pengguna sendiri.' 
    })
    .eq("id", scheduleId);

  if (error) return { error: "Gagal membatalkan jadwal." };

  // 4. [BARU] LOG ACTIVITY CANCEL
  const startDate = new Date(schedule.start_time);
  const endDate = new Date(schedule.end_time);
  const dateStr = startDate.toISOString().split('T')[0];
  const startTimeStr = startDate.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
  const endTimeStr = endDate.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});

  await logActivity(supabase, user.id, "CANCEL_SCHEDULE", {
    resource_name: schedule.resources?.name || "Unknown",
    user_role: userRole,
    date: dateStr,
    start_time: startTimeStr,
    end_time: endTimeStr,
    duration: getDurationString(schedule.start_time, schedule.end_time),
    score: schedule.calculated_score,
    title: schedule.title,
    reason: "Dibatalkan User"
  });

  revalidatePath("/portal/history");
  return { success: "Jadwal berhasil dibatalkan." };
}