"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// Tambahkan parameter 'prevState' di urutan pertama
export async function submitSchedule(prevState: any, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const resourceId = formData.get("resourceId") as string;
  const date = formData.get("date") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;

  const startDateTime = new Date(`${date}T${startTime}:00`).toISOString();
  const endDateTime = new Date(`${date}T${endTime}:00`).toISOString();

  if (startDateTime >= endDateTime) {
    return { error: "Waktu selesai harus lebih besar dari waktu mulai." };
  }

  const { data: conflict } = await supabase
    .from("schedules")
    .select("id")
    .eq("resource_id", resourceId)
    .eq("status", "approved")
    .or(`and(start_time.lt.${endDateTime},end_time.gt.${startDateTime})`)
    .single();

  if (conflict) {
    return {
      error:
        "Maaf, jadwal bentrok dengan peminjaman lain yang sudah disetujui.",
    };
  }

  const { error } = await supabase.from("schedules").insert({
    user_id: user.id,
    resource_id: resourceId,
    start_time: startDateTime,
    end_time: endDateTime,
    title,
    description,
    status: "approved",
    priority_level: "medium",
    version: 1,
  });

  if (error) {
    console.error(error);
    return { error: "Gagal menyimpan jadwal." };
  }

  revalidatePath("/portal");
  redirect("/portal?success=Jadwal berhasil dibuat!");
}
