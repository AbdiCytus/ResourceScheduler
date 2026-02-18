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
      {/* --- [UPDATE] HEADER KALENDER --- */}
      <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
        {/* Tombol Kiri (Prev) */}
        <button
          onClick={handlePrev}
          className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition shadow-sm hover:shadow border border-transparent hover:border-slate-200"
          title="Bulan Sebelumnya"
        >
          ◀
        </button>

        {/* Judul Tengah */}
        <h3 className="font-bold text-slate-800 text-sm select-none">
          {monthNames[currentMonth]}{" "}
          <span className="text-slate-500 font-medium">{currentYear}</span>
        </h3>

        {/* Tombol Kanan (Next) */}
        <button
          onClick={handleNext}
          className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition shadow-sm hover:shadow border border-transparent hover:border-slate-200"
          title="Bulan Selanjutnya"
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
                <div className="flex flex-wrap justify-center gap-0.5 w-full px-0.5">
                  {daySchedules.slice(0, 4).map((s) => (
                    <Link
                      key={s.id}
                      href={`/portal/book/${s.resource_id}`}
                      className="block"
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          s.priority_level === "high" ||
                          s.priority_level === "critical"
                            ? "bg-orange-400"
                            : "bg-indigo-400"
                        } hover:scale-150 transition cursor-pointer`}
                        title={`${new Date(s.start_time).toLocaleTimeString(
                          "id-ID",
                          { hour: "2-digit", minute: "2-digit" }
                        )} - ${s.title}`}
                      ></div>
                    </Link>
                  ))}
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
