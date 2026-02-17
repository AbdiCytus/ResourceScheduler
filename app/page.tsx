import Link from "next/link";

export default function Home() {
  return (
    <div className="relative overflow-hidden bg-slate-50 min-h-screen">
      {/* Background Blobs (Hiasan Latar) */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-3xl py-32 sm:py-48 text-center">
          <div className="mb-8 flex justify-center">
            <span className="relative rounded-full px-3 py-1 text-sm leading-6 text-indigo-600 ring-1 ring-indigo-600/10 hover:ring-indigo-600/20 bg-indigo-50">
              Sistem Skripsi Penjadwalan Cerdas v1.0
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl mb-6">
            Atur Ruangan & Waktu <br/>
            <span className="text-gradient">Tanpa Bentrok.</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600 max-w-2xl mx-auto">
            Menggunakan algoritma <b>Weighted Priority</b> dan <b>Safe Preemption</b>. 
            Jadwal prioritas tinggi otomatis mendapat tempat, sementara jadwal rutin menyesuaikan.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/portal" className="btn-primary text-lg px-8 py-3 shadow-xl shadow-indigo-200">
              Mulai Sekarang
            </Link>
            <Link href="/about" className="text-sm font-semibold leading-6 text-slate-900 hover:text-indigo-600 transition">
              Pelajari Teknisnya <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            title="Weighted Priority"
            desc="Setiap user memiliki skor. Admin mengalahkan User. Urgensi Critical mengalahkan Low."
            icon="⚡"
          />
          <FeatureCard 
            title="Safe Preemption"
            desc="Otomatis menggeser jadwal yang kalah prioritas, namun tetap menghormati aturan Freeze Time."
            icon="🛡️"
          />
           <FeatureCard 
            title="Optimistic Locking"
            desc="Mencegah double-booking milidetik dengan validasi versi data real-time."
            icon="🔒"
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, desc, icon }: { title: string, desc: string, icon: string }) {
  return (
    <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/50 card-hover">
      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-2xl mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}