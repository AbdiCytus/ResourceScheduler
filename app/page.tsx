import { createClient } from '@/utils/supabase/server';

export default async function Home() {
  // 1. Inisialisasi client Supabase di Server
  const supabase = await createClient();

  // 2. Query ke database (Ambil data roles)
  const { data: roles, error } = await supabase.from('roles').select('*');

  // 3. Tampilkan Error jika ada
  if (error) {
    return <pre>Error: {JSON.stringify(error, null, 2)}</pre>;
  }

  // 4. Tampilkan Data
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Scheduler TA</h1>
      <div className="bg-gray-100 p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Cek Koneksi Database:</h2>
        <ul className="space-y-2">
          {roles?.map((role) => (
            <li key={role.id} className="p-3 bg-white rounded border border-gray-200 text-gray-700">
              <span className="font-bold uppercase text-blue-600">{role.name}</span>
              <p className="text-sm text-gray-500">{role.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}