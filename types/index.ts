export type Role = "admin" | "mahasiswa" | "kajur" | "dosen";

export type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  username: string;
  role_id: number;
  kelas?: string;
  roles: { name: string } | null;
  is_approved: boolean;
  created_at: string;
  nim?: string;
  prodi?: string;
};
