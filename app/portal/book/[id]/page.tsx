import { createClient } from "@/utils/supabase/server";
import BookingForm from "./booking-form";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: resource } = await supabase
    .from("resources")
    .select("*, version")
    .eq("id", id)
    .single();

  if (!resource)
    return (
      <div className="text-center p-20 text-slate-500">
        Resource tidak ditemukan
      </div>
    );

  // Logika Satuan
  const unit = resource.type === "Room" ? "Orang" : "Unit";

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 md:px-8 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Form Peminjaman</h1>
          <p className="text-slate-500">
            Resource:{" "}
            <span className="font-bold text-indigo-600">{resource.name}</span>
            <span className="mx-2">•</span>
            Kapasitas: {resource.capacity} {unit}
          </p>
        </div>

        {/* Form Component */}
        <BookingForm
          resourceId={id}
          resourceName={resource.name}
          currentVersion={resource.version}
        />
      </div>
    </div>
  );
}
