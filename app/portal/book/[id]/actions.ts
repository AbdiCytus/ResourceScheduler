'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

async function getSettings(supabase: any) {
  const { data } = await supabase.from('system_settings').select('*');
  const settings: Record<string, string> = {};
  data?.forEach((item: any) => settings[item.key] = item.value);
  return settings;
}

async function createNotification(supabase: any, userId: string, title: string, message: string, type: string = 'info') {
  await supabase.from('notifications').insert({ user_id: userId, title, message, type, is_read: false });
}

// Helper: Cari Alternatif Slot (Diupdate untuk Equipment)
async function findAlternatives(supabase: any, resourceId: string, durationMs: number, searchStart: Date, reqQty: number, capacity: number) {
  const suggestions = [];
  let checkTime = new Date(searchStart);
  checkTime.setMinutes(0, 0, 0); 
  checkTime.setHours(checkTime.getHours() + 1); 

  let attempts = 0;
  while (suggestions.length < 3 && attempts < 48) {
    const slotStart = new Date(checkTime);
    const slotEnd = new Date(checkTime.getTime() + durationMs);
    
    const { data: overlaps } = await supabase
      .from('schedules')
      .select('quantity_borrowed')
      .eq('resource_id', resourceId)
      .eq('status', 'approved')
      .lt('start_time', slotEnd.toISOString())
      .gt('end_time', slotStart.toISOString());

    const totalBorrowed = overlaps ? overlaps.reduce((sum: number, s: any) => sum + (s.quantity_borrowed || 1), 0) : 0;

    if (totalBorrowed + reqQty <= capacity) {
      suggestions.push(slotStart.toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }));
    }

    checkTime.setHours(checkTime.getHours() + 1);
    attempts++;
  }
  return suggestions;
}

export async function createBooking(prevState: any, formData: FormData) {
  const supabase = await createClient();

  const resourceId = formData.get("resourceId") as string;
  const title = formData.get("title") as string;
  const priority = formData.get("priority_level") as string || 'medium';
  const quantity = parseInt(formData.get("quantity_borrowed") as string || '1');
  const bookingDate = formData.get("booking_date") as string;
  const startTimeRaw = formData.get("start_time") as string;
  const endTimeRaw = formData.get("end_time") as string;

  if (!bookingDate || !startTimeRaw || !endTimeRaw) return { error: "Lengkapi tanggal dan waktu." };

  const TIMEZONE_OFFSET = "+08:00"; 
  const startStr = `${bookingDate}T${startTimeRaw}:00${TIMEZONE_OFFSET}`;
  const endStr = `${bookingDate}T${endTimeRaw}:00${TIMEZONE_OFFSET}`;
  const startDate = new Date(startStr);
  const endDate = new Date(endStr);
  const now = new Date();

  if (startDate >= endDate) return { error: "Waktu selesai harus lebih besar dari mulai." };

  // 1. SETTINGS & SCORE
  const config = await getSettings(supabase);
  if (config['is_maintenance'] === 'true') return { error: "⛔ Sistem sedang Maintenance." };

  const minNoticeMinutes = parseInt(config['min_booking_notice'] || '30');
  if (startDate.getTime() - now.getTime() < minNoticeMinutes * 60 * 1000) {
    return { error: `⏳ Pemesanan minimal ${minNoticeMinutes} menit sebelum acara dimulai.` };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Login required." };
  
  const { data: profile } = await supabase.from('profiles').select('roles(name)').eq('id', user.id).single();
  const userRole = (profile?.roles as any)?.name || 'user';

  // Kalkulasi Skor Dinamis
  let roleWeight = parseInt(config['role_weight_user'] || '20');
  if (userRole === 'admin') roleWeight = parseInt(config['role_weight_admin'] || '30');
  else if (userRole === 'supervisor') roleWeight = parseInt(config['role_weight_supervisor'] || '25');
  
  const urgencyWeight = priority === 'high' ? 60 : priority === 'medium' ? 30 : 10;
  const newScore = roleWeight + urgencyWeight;

  // 2. CEK BENTROK
  const { data: resource } = await supabase.from('resources').select('capacity, type').eq('id', resourceId).single();
  const capacityLimit = resource?.capacity || 1;
  const isEquipment = resource?.type === 'Equipment';

  if (quantity > capacityLimit) return { error: `⚠️ Jumlah melebihi kapasitas maksimal (${capacityLimit}).` };

  const { data: conflicts } = await supabase.from('schedules').select(`id, title, user_id, priority_level, quantity_borrowed, start_time, end_time, profiles (roles (name))`)
    .eq('resource_id', resourceId).eq('status', 'approved').lt('start_time', endStr).gt('end_time', startStr);

  let hasConflict = false;
  let requiredFreed = 0;

  // Hitung jumlah unit konflik
  if (conflicts && conflicts.length > 0) {
     if (isEquipment) {
        const events: { time: number, diff: number }[] = [];
        conflicts.forEach(c => {
           events.push({ time: new Date(c.start_time).getTime(), diff: c.quantity_borrowed || 1 });
           events.push({ time: new Date(c.end_time).getTime(), diff: -(c.quantity_borrowed || 1) });
        });
        events.push({ time: startDate.getTime(), diff: quantity });
        events.push({ time: endDate.getTime(), diff: -quantity });
        events.sort((a, b) => a.time === b.time ? a.diff - b.diff : a.time - b.time);

        let maxConcurrent = 0, currentConcurrent = 0;
        for (const ev of events) {
            currentConcurrent += ev.diff;
            if (currentConcurrent > maxConcurrent) maxConcurrent = currentConcurrent;
        }
        if (maxConcurrent > capacityLimit) {
            hasConflict = true;
            requiredFreed = maxConcurrent - capacityLimit;
        }
     } else {
        hasConflict = true;
        requiredFreed = 1; 
     }
  }

  // 3. LOGIKA PREEMPTION & FREEZE TIME
  let preemptedVictims: any[] = [];
  if (hasConflict) {
      // Hitung skor korban
      const conflictsWithScore = conflicts!.map(c => {
          const vRole = (Array.isArray(c.profiles) ? c.profiles[0] : c.profiles)?.roles?.name || 'user';
          let vRoleWeight = parseInt(config['role_weight_user'] || '20');
          if (vRole === 'admin') vRoleWeight = parseInt(config['role_weight_admin'] || '30');
          else if (vRole === 'supervisor') vRoleWeight = parseInt(config['role_weight_supervisor'] || '25');
          const vUrgencyWeight = c.priority_level === 'high' ? 60 : c.priority_level === 'medium' ? 30 : 10;
          
          return { ...c, score: vRoleWeight + vUrgencyWeight };
      }).sort((a, b) => a.score - b.score);

      let freedUnits = 0;
      for (const c of conflictsWithScore) {
          if (newScore > c.score) {
              
              // [IMPLEMENTASI PRIORITAS 1: FREEZE TIME]
              const victimStart = new Date(c.start_time);
              const diffHours = (victimStart.getTime() - now.getTime()) / (1000 * 60 * 60);
              const isSameDay = victimStart.toDateString() === now.toDateString();

              let isFrozen = false;
              if (isSameDay) {
                  if (diffHours < 1) isFrozen = true; // Hari yang sama: Beku 1 Jam sebelum mulai
              } else {
                  if (diffHours < 24) isFrozen = true; // Hari kedepan: Beku 24 Jam (H-1) sebelum mulai
              }

              if (isFrozen) {
                  // Jadwal korban dilindungi oleh Freeze Time, lewati korban ini!
                  continue; 
              }

              preemptedVictims.push(c);
              freedUnits += isEquipment ? (c.quantity_borrowed || 1) : capacityLimit;
              if (freedUnits >= requiredFreed) break;
          }
      }

      if (freedUnits < requiredFreed) {
          // Jika tidak bisa menggusur (karena skor kalah atau korban terlindungi freeze time)
          const alternatives = await findAlternatives(supabase, resourceId, endDate.getTime() - startDate.getTime(), endDate, quantity, capacityLimit);
          let errorMsg = `❌ Slot penuh / Unit tidak mencukupi, dan jadwal eksisting terlindungi oleh kebijakan Freeze Time / Skor lebih tinggi.`;
          if (alternatives.length > 0) errorMsg += ` Rekomendasi terdekat: ${alternatives.join(', ')}`;
          return { error: errorMsg };
      } else {
          // Eksekusi Gusur
          for (const v of preemptedVictims) {
              await supabase.from('schedules').update({ 
                status: 'cancelled', description: `Digeser otomatis oleh sistem (Kalah Prioritas).` 
              }).eq('id', v.id);
              await createNotification(supabase, v.user_id, "Jadwal Digeser", `Maaf, jadwal "${v.title}" terpaksa digeser karena urgensi sistem.`, "warning");
          }
      }
  }

  // 4. INSERT JADWAL BARU
  const { error } = await supabase.from("schedules").insert({
    title, description: formData.get("description"), start_time: startStr, end_time: endStr,
    resource_id: resourceId, user_id: user.id, priority_level: priority, quantity_borrowed: quantity, status: 'approved'
  });

  if (error) return { error: error.message };
  revalidatePath("/portal");
  if (preemptedVictims.length > 0) return { success: "⚠️ SUKSES PREEMPTION: Jadwal prioritas rendah berhasil digeser." };
  return { success: "Berhasil! Jadwal telah dibuat." };
}