"use client";

import { useState } from "react";
import Link from "next/link";

// Helper generate tanggal
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

export default function CalendarView({ schedules }: { schedules: any[] }) {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const handlePrev = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNext = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const activeSchedules = schedules.filter((s) => {
    const d = new Date(s.start_time);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header Kalender */}
      <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
        <button
          onClick={handlePrev}
          className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition shadow-sm hover:shadow border border-transparent hover:border-slate-200"
        >
          ◀
        </button>

        <h3 className="font-bold text-slate-800 text-sm select-none">
          {monthNames[currentMonth]}{" "}
          <span className="text-slate-500 font-medium">{currentYear}</span>
        </h3>

        <button
          onClick={handleNext}
          className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition shadow-sm hover:shadow border border-transparent hover:border-slate-200"
        >
          ▶
        </button>
      </div>

      {/* Grid Kalender */}
      <div className="p-4">
        {/* Nama Hari */}
        <div className="grid grid-cols-7 text-center mb-2">
          {["S", "S", "R", "K", "J", "S", "M"].map((d, i) => (
            <div key={i} className="text-[10px] font-bold text-slate-400">
              {d}
            </div>
          ))}
        </div>

        {/* Tanggal */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square"></div>
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const today = new Date();
            const isToday =
              day === today.getDate() &&
              currentMonth === today.getMonth() &&
              currentYear === today.getFullYear();

            const daySchedules = activeSchedules.filter(
              (s) => new Date(s.start_time).getDate() === day
            );

            return (
              <div
                key={day}
                className={`aspect-square border rounded-lg p-1 flex flex-col items-center justify-start transition-all relative group ${
                  isToday
                    ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200"
                    : "border-slate-100 hover:border-indigo-300"
                }`}
              >
                <span
                  className={`text-[10px] font-bold ${
                    isToday ? "text-indigo-700" : "text-slate-500"
                  } mb-1`}
                >
                  {day}
                </span>

                {/* Dot Indicators */}
                <div className="flex flex-wrap justify-center gap-0.5 w-full px-0.5 relative">
                  {daySchedules.slice(0, 4).map((s) => {
                    const borrowerName =
                      (Array.isArray(s.profiles) ? s.profiles[0] : s.profiles)
                        ?.full_name || "User";
                    const resourceName = s.resources?.name || "Resource"; // Ambil Nama Resource
                    const startTime = new Date(s.start_time).toLocaleTimeString(
                      "id-ID",
                      { hour: "2-digit", minute: "2-digit" }
                    );
                    const endTime = new Date(s.end_time).toLocaleTimeString(
                      "id-ID",
                      { hour: "2-digit", minute: "2-digit" }
                    );
                    const isHighPriority =
                      s.priority_level === "high" ||
                      s.priority_level === "critical";

                    return (
                      <Link
                        key={s.id}
                        href={`/portal/book/${s.resource_id}`}
                        className="block relative group/dot"
                      >
                        {/* THE DOT */}
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            isHighPriority ? "bg-orange-400" : "bg-indigo-400"
                          } hover:scale-150 transition cursor-pointer`}
                        ></div>

                        {/* CUSTOM TOOLTIP */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-800 text-white text-[10px] rounded-lg p-3 hidden group-hover/dot:block z-50 shadow-xl pointer-events-none opacity-0 group-hover/dot:opacity-100 transition-opacity">
                          {/* Panah Bawah Tooltip */}
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>

                          <div className="relative z-10 space-y-1.5">
                            <div className="font-bold text-indigo-200 border-b border-slate-600 pb-1 mb-1 flex justify-between">
                              <span>
                                {startTime} - {endTime}
                              </span>
                            </div>

                            {/* [BARU] Menampilkan Nama Resource di Tooltip */}
                            <div className="bg-slate-700/50 p-1 rounded border border-slate-600">
                              <span className="text-slate-300 block text-[9px]">
                                Resource:
                              </span>
                              <span className="font-bold text-emerald-300">
                                {resourceName}
                              </span>
                            </div>

                            <div>
                              <span className="text-slate-400">Kegiatan:</span>{" "}
                              <br />
                              <span className="font-medium">{s.title}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Peminjam:</span>{" "}
                              <br />
                              <span className="font-medium">
                                {borrowerName}
                              </span>
                            </div>
                            <div className="pt-1 flex justify-between items-center border-t border-slate-700 mt-1">
                              <span className="text-slate-400">Urgensi:</span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  s.priority_level === "critical"
                                    ? "bg-red-500 text-white"
                                    : s.priority_level === "high"
                                    ? "bg-orange-500 text-white"
                                    : s.priority_level === "medium"
                                    ? "bg-blue-500 text-white"
                                    : "bg-slate-600 text-slate-200"
                                }`}
                              >
                                {s.priority_level}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  {daySchedules.length > 4 && (
                    <span className="text-[6px] text-slate-400 leading-none">
                      +
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
