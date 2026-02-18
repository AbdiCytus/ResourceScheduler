"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

// --- LOGIN ACTION ---
export async function login(formData: FormData) {
  const supabase = await createClient();

  const identity = formData.get("identity") as string; // Bisa Email atau Username
  const password = formData.get("password") as string;

  let emailToLogin = identity;

  // 1. Cek apakah input adalah Username (bukan format email)
  const isEmail = identity.includes("@");

  if (!isEmail) {
    // Cari email berdasarkan username di tabel profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email") // Pastikan tabel profiles punya kolom email (atau join auth)
      .eq("username", identity)
      .single();

    if (!profile) {
      return redirect("/login?message=Username tidak ditemukan");
    }

    // Note: Jika tabel profiles Anda tidak menyimpan email, Anda perlu logic lain.
    // Asumsi: Saat register kita simpan email juga di profiles atau kita ambil dari auth via RPC.
    // Agar simpel untuk skripsi: Kita asumsikan user memasukkan email yang benar atau username yang valid.
    // Jika profile tidak simpan email, kita harus fetch dari auth.users (hanya bisa via Service Role).
    // WORKAROUND AMAN: Kita gunakan email yang tersimpan di profile (jika ada).
    // Jika tidak ada kolom email di profile, kita gunakan identity langsung (dan berharap itu email).
    if (profile.email) {
      emailToLogin = profile.email;
    }
  }

  // 2. Proses Sign In
  const { error, data } = await supabase.auth.signInWithPassword({
    email: emailToLogin,
    password,
  });

  if (error) {
    return redirect("/login?message=Password salah atau akun tidak ditemukan");
  }

  // 3. CEK STATUS APPROVAL
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_approved, full_name") // Pastikan select is_approved
    .eq("id", data.user.id)
    .single();

  if (profile && !profile.is_approved) {
    // Jika belum diapprove, langsung logout lagi
    await supabase.auth.signOut();
    return redirect(
      "/login?message=Akun Anda sedang menunggu persetujuan Admin."
    );
  }

  revalidatePath("/", "layout");
  redirect("/portal");
}

// --- SIGNUP ACTION ---
const ROLE_MAP: Record<string, number> = {
  admin: 1,
  user: 2,
  supervisor: 3,
};

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const username = formData.get("username") as string;
  const roleString = formData.get("role") as string;

  // Default ke User (2) jika role tidak valid
  const roleId = ROLE_MAP[roleString] || 2;

  // 1. Cek Username Unik
  const { data: existingUser } = await supabase
    .from("profiles")
    .select("username")
    .eq("username", username)
    .single();

  if (existingUser) {
    return redirect(
      `/login?message=Gagal: Username '${username}' sudah dipakai.`
    );
  }

  // 2. Daftar ke Supabase Auth
  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Simpan data di metadata auth juga sebagai cadangan
      data: {
        full_name: fullName,
        username: username,
        role_id: roleId,
      },
    },
  });

  if (error) {
    return redirect("/login?message=Gagal Auth: " + error.message);
  }

  // 3. FORCE UPDATE PROFILE
  // Kita update tabel profiles secara manual untuk memastikan username & role masuk
  if (data.user) {
    // Tunggu 1 detik agar trigger database 'on_auth_user_created' selesai membuat row kosong
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        username: username,
        role_id: roleId,
        email: email, // Pastikan email juga tersimpan di profiles
        is_approved: false, // Default Pending
      })
      .eq("id", data.user.id);

    if (profileError) {
      console.error("Gagal update profile:", profileError);
      // Jangan return redirect error di sini, karena User Auth sudah terbuat.
      // Biarkan lanjut, nanti Admin bisa edit manual jika perlu.
    }
  }

  return redirect(
    "/login?message=Registrasi berhasil! Silakan tunggu persetujuan Admin."
  );
}

export async function signOut() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  // Refresh cache agar layout (Navbar) tahu user sudah logout
  revalidatePath("/", "layout");

  // Redirect ke halaman login
  redirect("/login");
}
