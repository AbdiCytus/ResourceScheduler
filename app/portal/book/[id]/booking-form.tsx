"use client"; // WAJIB: Menandakan ini Client Component

import { useActionState } from "react"; // Gunakan 'react-dom' jika pakai Next.js 14 lama, 'react' untuk 15
import { submitSchedule } from "../../actions";

// Jika error 'useActionState' tidak ditemukan, ganti import dengan:
// import { useFormState } from "react-dom";
// Lalu ganti useActionState di bawah menjadi useFormState

const initialState = {
  error: "",
};

export default function BookingForm({
  resourceId,
  resourceName,
}: {
  resourceId: string;
  resourceName: string;
}) {
  // state: berisi return value dari server (misal pesan error)
  // formAction: fungsi trigger untuk form
  const [state, formAction, isPending] = useActionState(
    submitSchedule,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="resourceId" value={resourceId} />

      {/* Tampilkan Pesan Error di sini jika ada */}
      {state?.error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm border border-red-200">
          ⚠️ {state.error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Judul Kegiatan
        </label>
        <input
          name="title"
          required
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          placeholder="Rapat Mingguan Tim IT"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tanggal
          </label>
          <input
            name="date"
            type="date"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Jam Mulai
          </label>
          <input
            name="startTime"
            type="time"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Jam Selesai
          </label>
          <input
            name="endTime"
            type="time"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Deskripsi (Opsional)
        </label>
        <textarea
          name="description"
          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          rows={3}
        ></textarea>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 font-bold transition disabled:bg-gray-400"
      >
        {isPending ? "Memproses..." : "Kirim Pengajuan"}
      </button>

      <a
        href="/portal"
        className="block text-center text-sm text-gray-500 mt-4 hover:underline"
      >
        Batal
      </a>
    </form>
  );
}
