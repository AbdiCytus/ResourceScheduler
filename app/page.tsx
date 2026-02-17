import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Sistem Penjadwalan Cerdas Berbasis Prioritas
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Kelola peminjaman ruang dan alat dengan algoritma Weighted Priority
            & Safe Preemption. Menjamin jadwal yang adil, efisien, dan bebas
            konflik.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/portal"
              className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Mulai Peminjaman
            </Link>
            <Link
              href="/about"
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              Pelajari Cara Kerja <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Section Sederhana */}
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-indigo-600">
              Fitur Utama
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Solusi Konflik Otomatis
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  ⚡ Weighted Priority
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Setiap permintaan dinilai berdasarkan peran pengguna dan
                  urgensi kegiatan. Prioritas tinggi didahulukan.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  🛡️ Safe Preemption
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Jadwal penting dapat menggeser jadwal rutin secara otomatis,
                  namun tetap mematuhi aturan "Freeze Time" 24 jam.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
