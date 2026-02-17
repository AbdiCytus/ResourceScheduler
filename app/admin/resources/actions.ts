"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function createResource(formData: FormData) {
  const supabase = await createClient();

  // Ambil data user untuk cek authorization (security layer)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Ambil input form
  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const capacity = formData.get("capacity") as string;
  const description = formData.get("description") as string;

  // Insert ke database
  const { error } = await supabase.from("resources").insert({
    name,
    type,
    capacity: parseInt(capacity),
    description,
    is_active: true,
  });

  if (error) {
    console.error("Error creating resource:", error);
    // Dalam real app, kita bisa return error state
    return;
  }

  // Refresh halaman agar data baru muncul
  revalidatePath("/admin/resources");
}

export async function deleteResource(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("resources").delete().eq("id", id);

  if (error) {
    console.error("Error deleting resource:", error);
  }

  revalidatePath("/admin/resources");
}
