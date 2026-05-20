"use client";

import { useState, useMemo } from "react";

const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);
const IconTray = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);
const IconEmpty = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mx-auto text-slate-200">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-2.24-1.8-4.082-4.039-4.342a49.393 49.393 0 0 0-11.422 0C4.05 9.818 2.25 11.66 2.25 13.9z" />
  </svg>
);
const IconFunnel = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
  </svg>
);

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

const ROLE_BADGE: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  kajur: "bg-purple-100 text-purple-700",
  dosen: "bg-yellow-100 text-yellow-700",
  mahasiswa: "bg-blue-100 text-blue-700",
};

export default function SupervisorClient({ schedules = [] }: { schedules: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRole, setFilterRole] = useState("all");

  const filtered = useMemo(() => {
    if (!Array.isArray(schedules)) return [];
    return schedules.filter((s) => {
      if (!s) return false;
      const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
      const uName = (profile?.full_name || "").toLowerCase();
      const rName = (s.resources?.name || "").toLowerCase();
      const actName = (s.activity_templates?.name || s.title || "").toLowerCase();

      const matchSearch =
        uName.includes(searchTerm.toLowerCase()) ||
        rName.includes(searchTerm.toLowerCase()) ||
        actName.includes(searchTerm.toLowerCase());

      const isPreempted = s.status === "cancelled" && s.description?.includes("Digeser");
      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "preempted" ? isPreempted : s.status === filterStatus);

      const uRole = profile?.roles?.name || "mahasiswa";
      const matchRole = filterRole === "all" || uRole === filterRole;

      return matchSearch && matchStatus && matchRole;
    });
  }, [schedules, searchTerm, filterStatus, filterRole]);

  const handleExport = () => {
    const headers = "ID,Tanggal,User,Role,Ruangan,Kegiatan,Status,Keterangan\n";
    const csv = filtered
      .map((s) => {
        const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
        const activity = s.activity_templates?.name || s.title || "-";
        return `${s.id},${s.start_time},"${profile?.full_name}","${profile?.roles?.name}","${s.resources?.name}","${activity}",${s.status},"${s.description || "-"}"`;
      })
      .join("\n");

    const blob = new Blob([headers + csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-gedung-h-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <span className="absolute left-4 top-1/2 -translate-y-1/2"><IconSearch /></span>
          <input
            type="text"
            placeholder="Cari nama, ruangan, atau kegiatan..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border-none text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Status */}
        <div className="flex items-center gap-2 bg-slate-50 px-4 rounded-2xl shrink-0">
          <IconFunnel />
          <select
            className="py-3 bg-transparent border-none text-sm cursor-pointer outline-none focus:ring-0 w-40"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Semua Status</option>
            <option value="approved">Disetujui</option>
            <option value="preempted">Digeser</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
        </div>

        {/* Filter Role */}
        <div className="flex items-center gap-2 bg-slate-50 px-4 rounded-2xl shrink-0">
          <span className="text-slate-400 text-sm">👤</span>
          <select
            className="py-3 bg-transparent border-none text-sm cursor-pointer outline-none focus:ring-0 w-36"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">Semua Role</option>
            <option value="mahasiswa">Mahasiswa</option>
            <option value="dosen">Dosen</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <button
          onClick={handleExport}
          className="w-full md:w-auto bg-slate-900 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition active:scale-95 shrink-0"
        >
          <IconTray /> Export CSV
        </button>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase text-slate-400 font-black tracking-[0.15em]">
              <tr>
                <th className="py-5 px-6">User</th>
                <th className="py-5 px-6">Ruangan</th>
                <th className="py-5 px-6">Kegiatan</th>
                <th className="py-5 px-6">Waktu</th>
                <th className="py-5 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-50">
              {filtered.length > 0 ? (
                filtered.map((s) => {
                  const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
                  const uName = profile?.full_name || "User";
                  const uRole = profile?.roles?.name || "mahasiswa";
                  const isPre = s.status === "cancelled" && s.description?.includes("Digeser");
                  const activityName = s.activity_templates?.name || s.title || "-";

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-6">
                        <p className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{uName}</p>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${ROLE_BADGE[uRole] || "bg-slate-100 text-slate-500"}`}>
                          {uRole}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-700">
                        🏢 {s.resources?.name || "-"}
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-slate-700 font-medium">{activityName}</p>
                        {s.title && s.title !== activityName && (
                          <p className="text-[10px] text-slate-400 mt-0.5">{s.title}</p>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-xs font-bold text-slate-700">
                          {formatDateTime(s.start_time).split(",")[0]}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {new Date(s.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {" – "}
                          {new Date(s.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        {isPre ? (
                          <div className="flex items-center gap-1.5 text-rose-600 font-black text-[10px] uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                            Preempted
                          </div>
                        ) : (
                          <span className={`text-[10px] font-black uppercase tracking-wider ${
                            s.status === "approved" ? "text-emerald-500" : "text-slate-300"
                          }`}>
                            {s.status}
                          </span>
                        )}
                        {isPre && s.description && (
                          <p className="text-[9px] text-slate-400 mt-1 max-w-[150px] leading-relaxed">{s.description}</p>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <IconEmpty />
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-4">Data Log Kosong</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-400 font-medium">
            Menampilkan {filtered.length} dari {schedules.length} data
          </div>
        )}
      </div>
    </div>
  );
}
