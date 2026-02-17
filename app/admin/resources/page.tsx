import { createClient } from "@/utils/supabase/server";
import { createResource, deleteResource } from "./actions";

export default async function ResourcesPage() {
  const supabase = await createClient();
  const { data: resources } = await supabase
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">
          Manajemen Sumber Daya
        </h1>

        {/* Form Tambah Resource - Modern Card */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 mb-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-10 -mt-10 opacity-50"></div>
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm">
              ＋
            </span>
            Tambah Resource Baru
          </h2>

          <form
            action={createResource}
            className="grid grid-cols-1 md:grid-cols-12 gap-5"
          >
            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                Nama Resource
              </label>
              <input
                name="name"
                placeholder="Contoh: Lab Komputer 1"
                required
                className="w-full rounded-xl border-slate-200 bg-slate-50 p-2.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                Tipe
              </label>
              <select
                name="type"
                required
                className="w-full rounded-xl border-slate-200 bg-slate-50 p-2.5 focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="Room">Ruangan</option>
                <option value="Equipment">Peralatan</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                Kapasitas
              </label>
              <input
                name="capacity"
                type="number"
                placeholder="0"
                required
                className="w-full rounded-xl border-slate-200 bg-slate-50 p-2.5 focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                Deskripsi Singkat
              </label>
              <input
                name="description"
                placeholder="Fasilitas: AC, Proyektor..."
                className="w-full rounded-xl border-slate-200 bg-slate-50 p-2.5 focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div className="md:col-span-12 flex justify-end mt-2">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-indigo-200 transition-all active:scale-95"
              >
                Simpan Resource
              </button>
            </div>
          </form>
        </div>

        {/* Tabel List Resource */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500 font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Nama</th>
                <th className="px-6 py-4">Tipe</th>
                <th className="px-6 py-4">Kapasitas</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resources?.map((res) => (
                <tr
                  key={res.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {res.name}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                        res.type === "Room"
                          ? "bg-indigo-50 text-indigo-700"
                          : "bg-orange-50 text-orange-700"
                      }`}
                    >
                      {res.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {res.capacity} Unit/Org
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`flex items-center gap-1.5 text-xs font-medium ${
                        res.is_active ? "text-emerald-600" : "text-slate-400"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          res.is_active ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      ></span>
                      {res.is_active ? "Aktif" : "Non-Aktif"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <form
                      action={deleteResource.bind(null, res.id)}
                      className="inline"
                    >
                      <button className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                        Hapus
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {resources?.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Belum ada data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
