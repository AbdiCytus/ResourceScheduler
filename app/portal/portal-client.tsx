"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CalendarView from "@/components/calendar-view";

// Helper Format Waktu & Durasi
function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function getDuration(start: string, end: string) {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0 && minutes > 0) return `${hours}j ${minutes}m`;
  if (hours > 0) return `${hours} Jam`;
  return `${minutes} Menit`;
}

type Props = {
  resources: any[];
  schedules: any[];
  isSupervisor: boolean;
};

export default function PortalClient({
  resources,
  schedules,
  isSupervisor,
}: Props) {
  // --- STATE TABS ---
  const [activeTab, setActiveTab] = useState<"resources" | "schedule">(
    "resources"
  );

  // --- STATE RESOURCE FILTERING ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "Room" | "Equipment">(
    "all"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // --- STATE SCHEDULE ---
  const [selectedDate, setSelectedDate] = useState(new Date());

  // [BARU] Filter Jadwal Aktif
  const now = new Date();
  const activeSchedules = schedules.filter((s) => new Date(s.end_time) > now);

  // --- LOGIC: FILTER RESOURCES ---
  const filteredResources = resources
    .filter((r) => {
      const matchSearch = r.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchType = filterType === "all" || r.type === filterType;
      return matchSearch && matchType;
    })
    .sort((a, b) => {
      return sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    });

  // --- LOGIC: FILTER SCHEDULES BY DATE ---
  const selectedDateSchedules = activeSchedules.filter((s) => {
    const sDate = new Date(s.start_time);
    return (
      sDate.getDate() === selectedDate.getDate() &&
      sDate.getMonth() === selectedDate.getMonth() &&
      sDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  return (
    <div className="space-y-6">
      {/* --- [UPDATE] TABS NAVIGATION FULL WIDTH --- */}
      <div className="bg-slate-100 p-1.5 rounded-2xl w-full border border-slate-200 grid grid-cols-2 gap-1">
        <button
          onClick={() => setActiveTab("resources")}
          className={`py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === "resources"
              ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200"
              : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-600"
          }`}
        >
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
              d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
            />
          </svg>
          Daftar Resource
        </button>
        <button
          onClick={() => setActiveTab("schedule")}
          className={`py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === "schedule"
              ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200"
              : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-600"
          }`}
        >
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
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
            />
          </svg>
          Kalender Jadwal
        </button>
      </div>

      {/* ======================= TAB 1: RESOURCES ======================= */}
      {activeTab === "resources" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* [UPDATE] SEARCH & FILTER BAR (FILTER PINDAH KIRI) */}
          <div className="flex flex-col md:flex-row gap-3 mb-6 items-center">
            {/* Grup Filter & Sort (Sekarang di Kiri) */}
            <div className="flex gap-2 w-full md:w-auto shrink-0">
              {/* Tombol Filter Tipe */}
              <div className="relative">
                <select
                  className="appearance-none pl-10 pr-8 py-3 rounded-xl border-slate-200 bg-white text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 w-full cursor-pointer hover:bg-slate-50 transition"
                  value={filterType}
                  onChange={(e: any) => setFilterType(e.target.value)}
                >
                  <option value="all">Semua Tipe</option>
                  <option value="Room">Ruangan</option>
                  <option value="Equipment">Peralatan</option>
                </select>
                {/* Icon Filter */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
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
                </div>
              </div>

              {/* Tombol Sort */}
              <button
                onClick={() =>
                  setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                }
                className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-sm font-bold flex items-center gap-2 whitespace-nowrap transition"
              >
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
                    d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
                  />
                </svg>
                {sortOrder === "asc" ? "A-Z" : "Z-A"}
              </button>
            </div>

            {/* Search Bar (Expand mengisi sisa ruang) */}
            <div className="relative w-full">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Cari nama ruangan atau alat..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border-slate-200 bg-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* GRID RESOURCES */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((res) => {
              const isClosingDown = !!res.scheduled_for_deletion_at;
              const isInactive = !res.is_active;
              const isDisabled = isClosingDown || isInactive;
              const unit = res.type === "Room" ? "Orang" : "Unit";

              return (
                <div
                  key={res.id}
                  className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between transition hover:shadow-md ${
                    isDisabled ? "opacity-75 bg-slate-50" : ""
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl border ${
                          res.type === "Room"
                            ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                            : "bg-orange-50 text-orange-600 border-orange-100"
                        }`}
                      >
                        {res.type === "Room" ? "🏢" : "💻"}
                      </div>

                      {isClosingDown ? (
                        <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full border border-red-200">
                          SEGERA DIHAPUS
                        </span>
                      ) : isInactive ? (
                        <span className="bg-slate-200 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full border border-slate-300">
                          NON-AKTIF
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-full">
                          {res.capacity} {unit}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                      {res.name}
                    </h3>

                    {res.type === "Room" &&
                      res.facilities &&
                      res.facilities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {res.facilities
                            .slice(0, 3)
                            .map((fac: string, idx: number) => (
                              <span
                                key={idx}
                                className="bg-indigo-50 text-indigo-600 text-[9px] font-bold px-1.5 py-0.5 rounded border border-indigo-100"
                              >
                                {fac}
                              </span>
                            ))}
                          {res.facilities.length > 3 && (
                            <span className="text-[9px] text-slate-400">
                              +{res.facilities.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                    <p className="text-slate-500 text-xs line-clamp-2 mb-4">
                      {res.description || "Fasilitas tersedia."}
                    </p>
                  </div>

                  {isSupervisor ? (
                    <button
                      disabled
                      className="w-full bg-slate-50 text-slate-400 font-bold py-2 rounded-lg text-xs border border-slate-200"
                    >
                      Mode Pantau
                    </button>
                  ) : isDisabled ? (
                    <Link
                      href={`/portal/book/${res.id}`}
                      className="block text-center bg-slate-100 border border-slate-200 text-slate-400 font-bold py-2 rounded-lg text-xs hover:bg-slate-200 transition"
                    >
                      {isClosingDown ? "Lihat (Terbatas)" : "Tidak Tersedia"}
                    </Link>
                  ) : (
                    <Link
                      href={`/portal/book/${res.id}`}
                      className="block text-center bg-white border border-indigo-200 text-indigo-600 font-bold py-2 rounded-lg text-xs hover:bg-indigo-600 hover:text-white transition"
                    >
                      {res.type === "Room" ? "Pilih Ruangan →" : "Pilih Alat →"}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
          {filteredResources.length === 0 && (
            <div className="text-center py-20 text-slate-400">
              <p>Tidak ada resource yang cocok dengan pencarian.</p>
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 2: SCHEDULE ======================= */}
      {activeTab === "schedule" && (
        <div className="animate-in fade-in slide-in-from-right-2 duration-300">
          {/* CONTAINER UTAMA */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-220px)] min-h-[500px]">
            {/* KOLOM KIRI: KALENDER */}
            <div className="lg:col-span-4 h-full">
              <CalendarView
                schedules={activeSchedules}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
            </div>

            {/* KOLOM KANAN: LIST DETAIL */}
            <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
              {/* Header List */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">
                    Jadwal:{" "}
                    {selectedDate.toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </h3>
                  <p className="text-slate-500 text-xs">
                    {selectedDateSchedules.length} Kegiatan ditemukan.
                  </p>
                </div>
              </div>

              {/* Scrollable List Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selectedDateSchedules.length > 0 ? (
                  selectedDateSchedules.map((sch) => {
                    const isHigh =
                      sch.priority_level === "high" ||
                      sch.priority_level === "critical";
                    const borrower =
                      (Array.isArray(sch.profiles)
                        ? sch.profiles[0]
                        : sch.profiles
                      )?.full_name || "User";

                    return (
                      <div
                        key={sch.id}
                        className="group flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition items-center"
                      >
                        {/* Waktu & Durasi */}
                        <div className="sm:w-24 shrink-0 flex flex-col justify-center sm:text-center border-b sm:border-b-0 sm:border-r border-slate-100 sm:pr-4 pb-2 sm:pb-0 h-full">
                          <span className="text-lg font-bold text-slate-800">
                            {formatTime(sch.start_time)}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            s/d {formatTime(sch.end_time)}
                          </span>
                          <span className="text-[10px] text-indigo-500 font-bold mt-1 bg-indigo-50 rounded px-1 w-fit sm:mx-auto">
                            {getDuration(sch.start_time, sch.end_time)}
                          </span>
                        </div>

                        {/* Detail Info */}
                        <div className="flex-1 w-full">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-slate-900 group-hover:text-indigo-700 transition text-base">
                              {sch.title}
                            </h4>
                          </div>

                          <div className="flex flex-col gap-1 text-xs text-slate-500">
                            <div className="flex items-center gap-2">
                              <span className="w-4 text-center">🏢</span>
                              <span className="font-semibold text-slate-700">
                                {sch.resources?.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-4 text-center">👤</span>
                              <span>{borrower}</span>
                            </div>
                            {sch.quantity_borrowed > 1 && (
                              <div className="flex items-center gap-2">
                                <span className="w-4 text-center">📦</span>
                                <span className="text-orange-600 font-bold">
                                  {sch.quantity_borrowed} Unit
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action: Badge Urgensi DI ATAS Tombol Lihat */}
                        <div className="flex flex-col items-end justify-center gap-2 min-w-[80px]">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase border ${
                              isHigh
                                ? "bg-orange-100 text-orange-700 border-orange-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {sch.priority_level}
                          </span>

                          <Link
                            href={`/portal/book/${sch.resource_id}`}
                            className="text-xs font-bold text-slate-500 hover:text-indigo-600 px-4 py-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition shadow-sm"
                          >
                            Lihat
                          </Link>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 py-10">
                    <div className="text-4xl mb-2">📅</div>
                    <p className="text-sm font-medium">
                      Tidak ada kegiatan aktif pada tanggal ini.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
