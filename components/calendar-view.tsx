"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// Helper
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

interface CalendarViewProps {
  schedules: any[];
  selectedDate?: Date; // [BARU] Tanggal yang dipilih dari luar
  onSelectDate?: (date: Date) => void; // [BARU] Callback saat tanggal diklik
}

export default function CalendarView({
  schedules,
  selectedDate,
  onSelectDate,
}: CalendarViewProps) {
  const now = new Date();

  // State navigasi bulan (Local state)
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());

  // Sinkronisasi: Jika selectedDate berubah, pastikan kalender pindah ke bulan tersebut
  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(selectedDate.getMonth());
      setCurrentYear(selectedDate.getFullYear());
    }
  }, [selectedDate]);

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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
      {/* Header Kalender */}
      <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
        <button
          onClick={handlePrev}
          className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition shadow-sm border border-transparent hover:border-slate-200"
        >
          ◀
        </button>
        <h3 className="font-bold text-slate-800 text-sm select-none">
          {monthNames[currentMonth]}{" "}
          <span className="text-slate-500 font-medium">{currentYear}</span>
        </h3>
        <button
          onClick={handleNext}
          className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition shadow-sm border border-transparent hover:border-slate-200"
        >
          ▶
        </button>
      </div>

      {/* Grid Kalender */}
      <div className="p-4 flex-1">
        <div className="grid grid-cols-7 text-center mb-2">
          {["S", "S", "R", "K", "J", "S", "M"].map((d, i) => (
            <div key={i} className="text-[10px] font-bold text-slate-400">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square"></div>
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateObj = new Date(currentYear, currentMonth, day);

            // Cek Selected Date
            const isSelected =
              selectedDate &&
              dateObj.getDate() === selectedDate.getDate() &&
              dateObj.getMonth() === selectedDate.getMonth() &&
              dateObj.getFullYear() === selectedDate.getFullYear();

            // Cek Hari Ini
            const isToday =
              day === now.getDate() &&
              currentMonth === now.getMonth() &&
              currentYear === now.getFullYear();

            const daySchedules = activeSchedules.filter(
              (s) => new Date(s.start_time).getDate() === day
            );

            return (
              <div
                key={day}
                onClick={() => onSelectDate && onSelectDate(dateObj)}
                className={`aspect-square border rounded-lg p-1 flex flex-col items-center justify-start transition-all relative group cursor-pointer
                  ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200 z-10"
                      : isToday
                      ? "border-slate-300 bg-slate-50"
                      : "border-slate-100 hover:border-indigo-300 hover:bg-slate-50"
                  }
                `}
              >
                <span
                  className={`text-[10px] font-bold mb-1 ${
                    isSelected
                      ? "text-indigo-700"
                      : isToday
                      ? "text-slate-800"
                      : "text-slate-500"
                  }`}
                >
                  {day}
                </span>

                {/* Dots */}
                <div className="flex flex-wrap justify-center gap-0.5 w-full px-0.5">
                  {daySchedules.slice(0, 4).map((s) => {
                    const isHigh =
                      s.priority_level === "high" ||
                      s.priority_level === "critical";
                    return (
                      <div
                        key={s.id}
                        className={`w-1.5 h-1.5 rounded-full ${
                          isHigh ? "bg-orange-400" : "bg-indigo-400"
                        }`}
                      ></div>
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
