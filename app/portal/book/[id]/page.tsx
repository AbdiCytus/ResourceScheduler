import { createClient } from "@/utils/supabase/server";
import BookingForm from "./booking-form"; // Pastikan import ini benar sesuai file yang kita buat sebelumnya

// 1. Ubah tipe props 'params' menjadi Promise
export default async function BookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();

  // 2. Lakukan 'await' pada params sebelum mengambil id
  const { id } = await params;

  // Ambil detail resource untuk ditampilkan judulnya
  const { data: resource } = await supabase
    .from("resources")
    .select("*, version")
    .eq("id", id)
    .single();

  if (!resource) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Resource Tidak Ditemukan
          </h1>
          <p className="text-gray-500">ID Resource: {id}</p>
          <a
            href="/portal"
            className="text-blue-600 hover:underline mt-4 block"
          >
            Kembali ke Portal
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Ajukan Peminjaman
        </h1>
        <p className="text-gray-500 mb-6">
          Resource:{" "}
          <span className="font-semibold text-blue-600">{resource.name}</span>
        </p>

        {/* Panggil Client Component Form */}
        <BookingForm
          resourceId={id}
          resourceName={resource.name}
          currentVersion={resource.version}
        />
      </div>
    </div>
  );
}
