"use client";

import { useActionState, useEffect, useState, useMemo } from "react";
import { createBooking } from "./actions";
import { useRouter } from "next/navigation";

// --- HELPERS ---
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDurationAndStatus(startStr: string, endStr: string) {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const now = new Date();

  const diffMs = end.getTime() - start.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  let durationText = "";
  if (hours > 0) durationText += `${hours}j `;
  if (minutes > 0) durationText += `${minutes}m`;

  let statusTime = "";
  let statusColor = "";
  if (now >= start && now <= end) {
    statusTime = "Sedang Berlangsung";
    statusColor = "bg-green-100 text-green-700 border-green-200 animate-pulse";
  } else if (now < start) {
    const diffToStart = start.getTime() - now.getTime();
    const daysToStart = Math.floor(diffToStart / (1000 * 60 * 60 * 24));
    if (daysToStart === 0) {
      const hoursToStart = Math.floor(diffToStart / (1000 * 60 * 60));
      statusTime = hoursToStart === 0 ? "Segera" : `Dalam ${hoursToStart} Jam`;
      statusColor = "bg-blue-100 text-blue-700 border-blue-200";
    } else {
      statusTime = `${daysToStart} Hari Lagi`;
      statusColor = "bg-slate-100 text-slate-600 border-slate-200";
    }
  } else {
    statusTime = "Selesai";
    statusColor = "bg-gray-100 text-gray-500 border-gray-200";
  }
  return { durationText, statusTime, statusColor };
}

function isSameDate(isoString: string, inputDate: string) {
  if (!inputDate) return false;
  const d = new Date(isoString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}` === inputDate;
}

function calculateFreeSlots(
  schedulesOnDate: any[],
  opStart: string,
  opEnd: string,
  capacity: number,
  resourceType: string,
) {
  const [startH, startM] = opStart.split(":").map(Number);
  const [endH, endM] = opEnd.split(":").map(Number);

  const startOfDay = startH * 60 + startM;
  const endOfDay = endH * 60 + endM;

  const events: { time: number; diff: number }[] = [];

  schedulesOnDate.forEach((s) => {
    const dStart = new Date(s.start_time);
    const dEnd = new Date(s.end_time);
    const sMins = dStart.getHours() * 60 + dStart.getMinutes();
    const eMins = dEnd.getHours() * 60 + dEnd.getMinutes();

    const effStart = Math.max(sMins, startOfDay);
    const effEnd = Math.min(eMins, endOfDay);

    if (effStart < effEnd) {
      const qty =
        resourceType === "Equipment" ? s.quantity_borrowed || 1 : capacity;
      events.push({ time: effStart, diff: qty });
      events.push({ time: effEnd, diff: -qty });
    }
  });

  events.sort((a, b) =>
    a.time === b.time ? a.diff - b.diff : a.time - b.time,
  );

  let currentUsed = 0;
  let currentPointer = startOfDay;
  const segments = [];

  for (const ev of events) {
    if (ev.time > currentPointer) {
      segments.push({
        start: currentPointer,
        end: ev.time,
        available: capacity - currentUsed,
      });
    }
    currentUsed += ev.diff;
    currentPointer = ev.time;
  }

  if (currentPointer < endOfDay) {
    segments.push({
      start: currentPointer,
      end: endOfDay,
      available: capacity - currentUsed,
    });
  }

  const merged = [];
  for (const seg of segments) {
    if (seg.available > 0) {
      if (
        merged.length > 0 &&
        merged[merged.length - 1].available === seg.available &&
        merged[merged.length - 1].end === seg.start
      ) {
        merged[merged.length - 1].end = seg.end;
      } else {
        merged.push(seg);
      }
    }
  }

  return merged.map((slot) => {
    const sH = Math.floor(slot.start / 60)
      .toString()
      .padStart(2, "0");
    const sM = (slot.start % 60).toString().padStart(2, "0");
    const eH = Math.floor(slot.end / 60)
      .toString()
      .padStart(2, "0");
    const eM = (slot.end % 60).toString().padStart(2, "0");

    if (resourceType === "Equipment" && slot.available < capacity) {
      return `${sH}:${sM} - ${eH}:${eM} (Sisa ${slot.available} Unit)`;
    }
    return `${sH}:${sM} - ${eH}:${eM}`;
  });
}

interface BookingFormProps {
  resourceId: string;
  resourceName: string;
  resourceType: string;
  capacity: number;
  facilities?: string[] | null;
  minNotice: string;
  existingSchedules: any[];
  opStart: string;
  opEnd: string;
  userRoleWeight: number;
}

export default function BookingForm({
  resourceId,
  resourceName,
  resourceType,
  capacity,
  facilities,
  minNotice,
  existingSchedules,
  opStart,
  opEnd,
  userRoleWeight,
}: BookingFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createBooking, null);
  const [urgency, setUrgency] = useState("medium");
  const [selectedDate, setSelectedDate] = useState("");

  // [BARU] State untuk expand/collapse panel skor
  const [showScore, setShowScore] = useState(false);

  useEffect(() => {
    if (state?.success)
      router.push(`/portal?success=${encodeURIComponent(state.success)}`);
  }, [state, router]);

  const displayedSchedules = useMemo(() => {
    if (!selectedDate) return existingSchedules;
    return existingSchedules.filter((sch) =>
      isSameDate(sch.start_time, selectedDate),
    );
  }, [selectedDate, existingSchedules]);

  const freeSlots = useMemo(() => {
    if (!selectedDate) return [];
    return calculateFreeSlots(
      displayedSchedules,
      opStart,
      opEnd,
      capacity,
      resourceType,
    );
  }, [
    selectedDate,
    displayedSchedules,
    opStart,
    opEnd,
    capacity,
    resourceType,
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* --- KOLOM KIRI: TABEL JADWAL --- */}
      <div className="lg:col-span-5 order-2 lg:order-1">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[600px]">
          <div className="p-6 border-b border-slate-100">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  📅{" "}
                  {selectedDate
                    ? `Jadwal: ${formatDate(selectedDate)}`
                    : "Jadwal Mendatang"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedDate
                    ? "Menampilkan slot kosong & terisi."
                    : "Pilih tanggal pada form untuk lihat slot kosong."}
                </p>
              </div>
            </div>
          </div>

          {selectedDate && (
            <div className="mx-6 mt-6 mb-2 p-4 bg-emerald-50 rounded-xl border border-emerald-100 animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                  ✅ Waktu Kosong Tersedia
                </h3>
                <span className="text-[10px] text-emerald-600 font-mono bg-white px-2 py-0.5 rounded border border-emerald-200">
                  Ops: {opStart} - {opEnd}
                </span>
              </div>

              {freeSlots.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {freeSlots.map((slot, idx) => (
                    <span
                      key={idx}
                      className="bg-white text-emerald-700 text-xs font-mono font-bold px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm"
                    >
                      {slot}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-600 italic">
                  Jadwal penuh atau di luar jam operasional.
                </p>
              )}
            </div>
          )}

          <div className="p-6 pt-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 pl-1">
              Daftar Terisi (Booked)
            </h4>

            {displayedSchedules.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/80">
                    <tr className="border-b border-slate-200 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-3">Waktu</th>
                      <th className="py-3 px-3">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-slate-600 bg-white">
                    {displayedSchedules.map((sch) => {
                      const { durationText, statusTime, statusColor } =
                        getDurationAndStatus(sch.start_time, sch.end_time);

                      return (
                        <tr
                          key={sch.id}
                          className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors last:border-b-0"
                        >
                          <td className="py-3 px-3 whitespace-nowrap align-top">
                            <div className="mb-1">
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}
                              >
                                {statusTime}
                              </span>
                            </div>
                            <div className="font-bold text-slate-700">
                              {formatDate(sch.start_time)}
                            </div>
                            <div className="font-mono text-slate-500 text-[10px]">
                              {formatTime(sch.start_time)} -{" "}
                              {formatTime(sch.end_time)}
                            </div>
                            <div className="text-[10px] font-bold text-indigo-600 mt-1">
                              {durationText}
                            </div>
                          </td>

                          <td className="py-3 px-3 align-top">
                            {/* Menampilkan Ikon Gembok dengan Tooltip Anti-Potong */}
                            <div className="font-bold text-slate-800 line-clamp-2 mb-1 flex items-center">
                              {sch.isFrozen && (
                                <div className="group relative inline-flex items-center mr-1.5 cursor-help">
                                  <span className="text-amber-500">🔒</span>
                                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all duration-200 z-[99] flex items-center">
                                    <div className="w-0 h-0 border-t-[4px] border-b-[4px] border-r-[4px] border-t-transparent border-b-transparent border-r-slate-800"></div>
                                    <div className="bg-slate-800 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-md shadow-lg whitespace-nowrap">
                                      Freeze Time
                                    </div>
                                  </div>
                                </div>
                              )}
                              <span className="line-clamp-1">{sch.title}</span>
                            </div>

                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border ${
                                  sch.priority_level === "high"
                                    ? "bg-orange-100 text-orange-700 border-orange-200"
                                    : sch.priority_level === "medium"
                                      ? "bg-amber-100 text-amber-700 border-amber-200"
                                      : "bg-slate-100 text-slate-600 border-slate-200"
                                }`}
                              >
                                {sch.priority_level || "medium"}
                              </span>

                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border bg-indigo-50 text-indigo-700 border-indigo-200">
                                {sch.score} PTS
                              </span>

                              {resourceType === "Equipment" && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-slate-50 text-slate-600 border-slate-200 flex items-center gap-1">
                                  📦 {sch.quantity_borrowed || 1} Unit
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              {(Array.isArray(sch.profiles)
                                ? sch.profiles[0]
                                : sch.profiles
                              )?.full_name || "User"}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <div className="text-2xl mb-2 grayscale opacity-50">🗓️</div>
                <p className="text-sm font-bold text-slate-600">Kosong</p>
                <p className="text-xs text-slate-400">
                  Tidak ada jadwal{" "}
                  {selectedDate ? "terisi pada tanggal ini" : "mendatang"}.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- KOLOM KANAN: FORM --- */}
      <div className="lg:col-span-7 space-y-6 lg:sticky lg:top-24 order-1 lg:order-2">
        <form
          action={formAction}
          className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
        >
          <input type="hidden" name="resourceId" value={resourceId} />

          {state?.error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 m-6 mb-0 rounded-r-lg flex items-center gap-3">
              <span className="text-red-600">⚠️</span>
              <p className="text-sm font-bold text-red-800 leading-relaxed">
                {state.error}
              </p>
            </div>
          )}

          <div className="p-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-1">
                Form Pengajuan
              </h2>
              <p className="text-sm text-slate-500">
                Resource:{" "}
                <span className="font-bold text-indigo-600">
                  {resourceName}
                </span>
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3">
              <span className="text-lg">💡</span>
              <div className="text-xs text-amber-900 leading-relaxed">
                <p className="font-bold mb-0.5">Aturan Penting:</p>
                <p>
                  Booking wajib dilakukan minimal{" "}
                  <span className="font-bold underline text-amber-700">
                    {minNotice} menit
                  </span>{" "}
                  sebelum acara. Pesanan dadakan akan ditolak.
                </p>
              </div>
            </div>

            {resourceType === "Room" && facilities && facilities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {facilities.map((fac, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded border border-indigo-100"
                  >
                    {fac}
                  </span>
                ))}
              </div>
            )}

            <hr className="border-slate-100" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                  Judul Kegiatan
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="Cth: Rapat"
                  className="w-full rounded-lg border-slate-300 bg-slate-50 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                  Tanggal
                </label>
                <input
                  name="booking_date"
                  type="date"
                  required
                  className="w-full rounded-lg border-slate-300 bg-slate-50 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-6 md:col-span-4">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                  Mulai
                </label>
                <input
                  name="start_time"
                  type="time"
                  required
                  className="w-full rounded-lg border-slate-300 bg-slate-50 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="col-span-6 md:col-span-4">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                  Selesai
                </label>
                <input
                  name="end_time"
                  type="time"
                  required
                  className="w-full rounded-lg border-slate-300 bg-slate-50 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="col-span-12 md:col-span-4">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                  Urgensi
                </label>
                <div className="relative">
                  <select
                    name="priority_level"
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                    className="w-full rounded-lg border-slate-300 bg-slate-50 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                  >
                    <option value="low">Low (10 PTS)</option>
                    <option value="medium">Medium (30 PTS)</option>
                    <option value="high">High (60 PTS)</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">
                    ▼
                  </div>
                </div>
              </div>
            </div>

            {/* [UPDATE] PANEL SKOR DENGAN TOGGLE COLLAPSE */}
            <div className="border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowScore(!showScore)}
                className="w-full flex items-center justify-between text-left py-2 px-1 text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors focus:outline-none group"
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg group-hover:scale-110 transition-transform">
                    🏆
                  </span>
                  {showScore ? "Sembunyikan Skor" : "Tampilkan Skor"}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className={`w-4 h-4 transition-transform duration-200 ${showScore ? "rotate-180" : ""}`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </button>

              {showScore && (
                <div className="mt-3 bg-slate-800 text-white rounded-xl p-4 shadow-inner animate-in fade-in slide-in-from-top-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-700 pb-3 mb-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Power Skor Anda
                      </p>
                      <div className="text-sm font-medium text-slate-300 mt-1">
                        Role ({userRoleWeight}) + Urgensi (
                        {urgency === "high"
                          ? 60
                          : urgency === "medium"
                            ? 30
                            : 10}
                        )
                      </div>
                    </div>
                    <div className="text-3xl font-black text-emerald-400 tracking-tight">
                      {userRoleWeight +
                        (urgency === "high"
                          ? 60
                          : urgency === "medium"
                            ? 30
                            : 10)}{" "}
                      <span className="text-lg text-slate-500">PTS</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                    <span className="text-amber-400 font-bold">
                      💡 Info Aturan:
                    </span>{" "}
                    Skor yang lebih tinggi dapat melakukan preemption
                    (menggeser) jadwal ber-skor rendah yang sudah ter-booking.{" "}
                    <span className="text-slate-300 font-bold">
                      Aturan ini batal
                    </span>{" "}
                    jika jadwal target sudah kebal karena memasuki{" "}
                    <span className="font-bold text-amber-500">
                      Freeze Time 🔒
                    </span>
                    .
                  </p>
                </div>
              )}
            </div>

            {resourceType === "Equipment" && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                  Jumlah Unit (Max: {capacity})
                </label>
                <input
                  name="quantity_borrowed"
                  type="number"
                  min="1"
                  max={capacity}
                  defaultValue="1"
                  className="w-full rounded-lg border-slate-300 bg-slate-50 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                Deskripsi Tambahan
              </label>
              <textarea
                name="description"
                rows={2}
                className="w-full rounded-lg border-slate-300 bg-slate-50 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isPending ? "Memproses..." : "Ajukan Peminjaman"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
