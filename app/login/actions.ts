"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  // Ambil data dari form
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect("/login?message=Gagal login: " + error.message);
  }

  // Jika berhasil, refresh data dan redirect
  revalidatePath("/", "layout");
  redirect("/portal");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string; // Kita butuh nama lengkap

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName, // Ini akan masuk ke user_metadata dan trigger handle_new_user
      },
    },
  });

  if (error) {
    return redirect("/login?message=Gagal daftar: " + error.message);
  }

  revalidatePath("/", "layout");
  redirect("/login?message=Cek email untuk konfirmasi pendaftaran!");
}

export async function signOut() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  // Refresh cache agar layout (Navbar) tahu user sudah logout
  revalidatePath("/", "layout");

  // Redirect ke halaman login
  redirect("/login");
}
