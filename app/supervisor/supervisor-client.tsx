"use client";

import { useState, useMemo } from "react";

// --- HEROICONS ---
const IconSearch = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-4 h-4 text-slate-400"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
    />
  </svg>
);

const IconTray = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
    />
  </svg>
);

const IconEmpty = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1}
    stroke="currentColor"
    className="w-16 h-16 mx-auto text-slate-200"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-2.24-1.8-4.082-4.039-4.342a49.393 49.393 0 0 0-11.422 0C4.05 9.818 2.25 11.66 2.25 13.9z"
    />
  </svg>
);

const IconFunnel = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-4 h-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z"
    />
  </svg>
);

// --- HELPERS ---
const SCORE_ROLES: Record<string, number> = {
  admin: 100,
  supervisor: 50,
  user: 10,
};
const SCORE_PRIORITY: Record<string, number> = {
  high: 30,
  medium: 20,
  low: 10,
};
function calculateScore(role: string, priority: string) {
  return (SCORE_ROLES[role] || 10) + (SCORE_PRIORITY[priority] || 10);
}
function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SupervisorClient({
  schedules = [],
}: {
  schedules: any[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = useMemo(() => {
    // Safety Check: Jika schedules bukan array, return array kosong
    if (!Array.isArray(schedules)) return [];

    return schedules.filter((s) => {
      if (!s) return false;
      const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
      const uName = (profile?.full_name || "").toLowerCase();
      const rName = (s.resources?.name || "").toLowerCase();

      const matchSearch =
        uName.includes(searchTerm.toLowerCase()) ||
        rName.includes(searchTerm.toLowerCase());

      const isPreempted =
        s.status === "cancelled" && s.description?.includes("Digeser");
      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "preempted"
          ? isPreempted
          : s.status === filterStatus);

      return matchSearch && matchStatus;
    });
  }, [schedules, searchTerm, filterStatus]);

  const handleExport = () => {
    const headers = "ID,Waktu,User,Role,Resource,Status,Skor,Keterangan\n";
    const csv = filtered
      .map((s) => {
        const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
        return `${s.id},${s.created_at},"${profile?.full_name}","${profile?.roles?.name}","${s.resources?.name}",${s.status},${calculateScore(profile?.roles?.name, s.priority_level)},"${s.description || "-"}"`;
      })
      .join("\n");

    const blob = new Blob([headers + csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <span className="absolute left-4 top-1/2 -translate-y-1/2">
            <IconSearch />
          </span>
          <input
            type="text"
            placeholder="Cari user atau alat..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border-none text-sm focus:ring-2 focus:ring-indigo-500 transition outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto bg-slate-50 px-4 rounded-2xl">
          <IconFunnel />
          <select
            className="flex-1 md:w-48 py-3 bg-transparent border-none text-sm cursor-pointer outline-none focus:ring-0"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Semua Status</option>
            <option value="preempted">Digeser (Preempted)</option>
            <option value="approved">Approved</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
        </div>
        <button
          onClick={handleExport}
          className="w-full md:w-auto bg-slate-900 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition active:scale-95"
        >
          <IconTray /> Export CSV
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100 font-black text-slate-400 text-[10px] uppercase tracking-[0.15em]">
              <tr>
                <th className="py-5 px-8">Identitas User</th>
                <th className="py-5 px-8">Resource</th>
                <th className="py-5 px-8">Waktu</th>
                <th className="py-5 px-8 text-center">Power</th>
                <th className="py-5 px-8">Audit Status</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-50">
              {filtered.length > 0 ? (
                filtered.map((s) => {
                  const profile = Array.isArray(s.profiles)
                    ? s.profiles[0]
                    : s.profiles;
                  const uName = profile?.full_name || "User";
                  const uRole = profile?.roles?.name || "user";
                  const isPre =
                    s.status === "cancelled" &&
                    s.description?.includes("Digeser");
                  const score = calculateScore(uRole, s.priority_level);

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="py-5 px-8">
                        <p className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                          {uName}
                        </p>
                        <p className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">
                          {uRole}
                        </p>
                      </td>
                      <td className="py-5 px-8 font-medium text-slate-600">
                        {s.resources?.name}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {s.resources?.type}
                        </span>
                      </td>
                      <td className="py-5 px-8">
                        <p className="text-xs font-bold text-slate-700">
                          {formatDateTime(s.start_time).split(",")[0]}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {new Date(s.start_time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          -{" "}
                          {new Date(s.end_time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </td>
                      <td className="py-5 px-8 text-center">
                        <span
                          className={`px-2 py-1 rounded-lg text-[10px] font-black border ${score > 50 ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-slate-50 text-slate-400 border-slate-100"}`}
                        >
                          {score} PTS
                        </span>
                      </td>
                      <td className="py-5 px-8">
                        {isPre ? (
                          <div className="flex items-center gap-1.5 text-rose-600 font-black text-[10px] uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />{" "}
                            Preempted
                          </div>
                        ) : (
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider ${s.status === "approved" ? "text-emerald-500" : "text-slate-300"}`}
                          >
                            {s.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <IconEmpty />
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-4">
                      Data Log Kosong
                    </p>
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
