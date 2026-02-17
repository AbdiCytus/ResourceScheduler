import { createClient } from "@/utils/supabase/server";
import { createResource, deleteResource } from "./actions";

export default async function ResourcesPage() {
  const supabase = await createClient();

  // Fetch data resources
  const { data: resources } = await supabase
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Manajemen Sumber Daya
      </h1>

      {/* Form Tambah Resource */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Tambah Resource Baru
        </h2>
        <form
          action={createResource}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <input
            name="name"
            placeholder="Nama Ruangan / Alat (e.g., Lab Komputer 1)"
            className="border p-2 rounded"
            required
          />
          <select name="type" className="border p-2 rounded" required>
            <option value="Room">Ruangan</option>
            <option value="Equipment">Peralatan</option>
          </select>
          <input
            name="capacity"
            type="number"
            placeholder="Kapasitas (Orang/Unit)"
            className="border p-2 rounded"
            required
          />
          <input
            name="description"
            placeholder="Deskripsi / Fasilitas"
            className="border p-2 rounded"
          />
          <button
            type="submit"
            className="md:col-span-2 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
          >
            + Tambah Resource
          </button>
        </form>
      </div>

      {/* Tabel List Resource */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipe
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kapasitas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {resources?.map((res) => (
              <tr key={res.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                  {res.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      res.type === "Room"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {res.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {res.capacity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {res.is_active ? "Aktif" : "Non-Aktif"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {/* Form kecil untuk tombol delete */}
                  <form
                    action={deleteResource.bind(null, res.id)}
                    className="inline"
                  >
                    <button className="text-red-600 hover:text-red-900">
                      Hapus
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {resources?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Belum ada data resource.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
