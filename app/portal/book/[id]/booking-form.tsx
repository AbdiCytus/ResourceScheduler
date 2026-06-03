"use client";

import { useActionState, useEffect, useState, useMemo } from "react";
import { createBooking } from "./actions";
import { useRouter } from "next/navigation";

// --- HELPERS ---
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}
function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("id-ID", {
    hour: "2-digit", minute: "2-digit",
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
      const h = Math.floor(diffToStart / (1000 * 60 * 60));
      statusTime = h === 0 ? "Segera" : `Dalam ${h} Jam`;
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
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}` === inputDate;
}

function calculateFreeSlots(
  schedulesOnDate: any[],
  teachingOnDay: any[],
  capacity: number,
  buildingOpenStr: string = "08:00",
  buildingCloseStr: string = "18:00",
) {
  const [openH, openM] = buildingOpenStr.split(":").map(Number);
  const [closeH, closeM] = buildingCloseStr.split(":").map(Number);
  const startOfDay = openH * 60 + openM;
  const endOfDay = closeH * 60 + closeM;

  const events: { time: number; diff: number }[] = [];

  schedulesOnDate.forEach((s) => {
    const dStart = new Date(s.start_time);
    const dEnd = new Date(s.end_time);
    const sMins = dStart.getHours() * 60 + dStart.getMinutes();
    const eMins = dEnd.getHours() * 60 + dEnd.getMinutes();
    const effStart = Math.max(sMins, startOfDay);
    const effEnd = Math.min(eMins, endOfDay);
    if (effStart < effEnd) {
      events.push({ time: effStart, diff: capacity });
      events.push({ time: effEnd, diff: -capacity });
    }
  });

  teachingOnDay.forEach((t) => {
    const [sh, sm] = t.start_time.slice(0, 5).split(":").map(Number);
    const [eh, em] = t.end_time.slice(0, 5).split(":").map(Number);
    const sMins = sh * 60 + sm;
    const eMins = eh * 60 + em;
    if (sMins < eMins) {
      events.push({ time: sMins, diff: capacity });
      events.push({ time: eMins, diff: -capacity });
    }
  });

  events.sort((a, b) => a.time === b.time ? a.diff - b.diff : a.time - b.time);

  let currentUsed = 0;
  let currentPointer = startOfDay;
  const segments = [];

  for (const ev of events) {
    if (ev.time > currentPointer) {
      segments.push({ start: currentPointer, end: ev.time, available: capacity - currentUsed });
    }
    currentUsed += ev.diff;
    currentPointer = ev.time;
  }
  if (currentPointer < endOfDay) {
    segments.push({ start: currentPointer, end: endOfDay, available: capacity - currentUsed });
  }

  const merged: any[] = [];
  for (const seg of segments) {
    if (seg.available > 0) {
      if (merged.length > 0 && merged[merged.length - 1].available === seg.available && merged[merged.length - 1].end === seg.start) {
        merged[merged.length - 1].end = seg.end;
      } else {
        merged.push(seg);
      }
    }
  }

  return merged.map((slot) => {
    const sH = Math.floor(slot.start / 60).toString().padStart(2, "0");
    const sM = (slot.start % 60).toString().padStart(2, "0");
    const eH = Math.floor(slot.end / 60).toString().padStart(2, "0");
    const eM = (slot.end % 60).toString().padStart(2, "0");
    return `${sH}:${sM} - ${eH}:${eM}`;
  });
}

const DAY_OF_WEEK = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

interface ActivityTemplate {
  id: string;
  name: string;
  weight: number;
  allowed_roles: string[];
}

interface TeachingSchedule {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  dosen_pengampu: string;
  matakuliah: string;
  kelas: string;
  is_offline: boolean;
}

interface BookingFormProps {
  resourceId: string;
  resourceName: string;
  capacity: number;
  facilities?: string[] | null;
  existingSchedules: any[];
  opStart: string;
  opEnd: string;
  buildingOpen: string;
  buildingClose: string;
  closureDates: string[];
  userRoleWeight: number;
  activityTemplates: ActivityTemplate[];
  teachingSchedules: TeachingSchedule[];
  userRole: string;
}

export default function BookingForm({
  resourceId,
  resourceName,
  capacity,
  facilities,
  existingSchedules,
  opStart,
  opEnd,
  buildingOpen,
  buildingClose,
  closureDates,
  userRoleWeight,
  activityTemplates,
  teachingSchedules,
  userRole,
}: BookingFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createBooking, null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedActivityId, setSelectedActivityId] = useState(
    activityTemplates[0]?.id || ""
  );
  const [showScore, setShowScore] = useState(false);
  const [timeMode, setTimeMode] = useState<"simple" | "custom">("simple");
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);

  useEffect(() => {
    if (state?.success)
      router.push(`/portal?success=${encodeURIComponent(state.success)}`);
  }, [state, router]);

  const selectedActivity = activityTemplates.find((t) => t.id === selectedActivityId);
  const activityWeight = selectedActivity?.weight || 0;
  // Konversi bobot angka ke label teks
  const priorityLevel = activityWeight >= 60 ? "tinggi" : activityWeight >= 30 ? "sedang" : "rendah";
  const PRIORITY_LABEL: Record<string, string> = { tinggi: "Tinggi", sedang: "Sedang", rendah: "Rendah" };
  const PRIORITY_STYLE: Record<string, string> = {
    tinggi: "text-red-600 bg-red-50 border-red-200",
    sedang: "text-amber-600 bg-amber-50 border-amber-200",
    rendah: "text-slate-500 bg-slate-50 border-slate-200",
  };
  const totalScore = activityWeight; // tetap dipakai untuk logika internal

  // Apakah template ini perlu judul kustom?
  // Hanya "mengajar" dan "kustom" yang perlu input judul manual
  const needsCustomTitle = !selectedActivity ||
    selectedActivity.name.toLowerCase().includes("mengajar") ||
    selectedActivity.name.toLowerCase().includes("kustom") ||
    selectedActivity.name.toLowerCase().includes("custom");

  // ── Komputasi berdasarkan tanggal ──
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const isHDay = selectedDate === todayStr;
  const isClosureDay = closureDates.includes(selectedDate);

  const selectedDayOfWeek = useMemo(() => {
    if (!selectedDate) return null;
    const d = new Date(selectedDate + "T00:00:00");
    return d.getDay();
  }, [selectedDate]);

  const isWeekend = selectedDayOfWeek === 0 || selectedDayOfWeek === 6;

  // Semua jadwal kuliah di hari terpilih (untuk mode sederhana)
  const teachingOnDay = useMemo(() => {
    if (!selectedDayOfWeek || isWeekend) return [];
    return teachingSchedules.filter((t) => t.day_of_week === selectedDayOfWeek);
  }, [selectedDayOfWeek, teachingSchedules, isWeekend]);

  // Untuk free slot visualization di panel kiri (hanya is_offline=true yang dianggap blocked)
  const teachingOnDayActive = teachingOnDay.filter((t) => t.is_offline);

  // Template slots: H-day hanya slot kosong (is_offline=false); H-1+ semua slot
  const templateSlots = useMemo(() => {
    if (!selectedDate || isWeekend || isClosureDay) return [];
    if (isHDay) return teachingOnDay.filter((t) => !t.is_offline);
    return teachingOnDay;
  }, [teachingOnDay, isHDay, isWeekend, isClosureDay, selectedDate]);

  const displayedSchedules = useMemo(() => {
    if (!selectedDate) return existingSchedules;
    return existingSchedules.filter((sch) => isSameDate(sch.start_time, selectedDate));
  }, [selectedDate, existingSchedules]);

  const freeSlots = useMemo(() => {
    if (!selectedDate || isWeekend) return [];
    return calculateFreeSlots(displayedSchedules, teachingOnDayActive, capacity, buildingOpen, buildingClose);
  }, [selectedDate, displayedSchedules, teachingOnDayActive, capacity, isWeekend, buildingOpen, buildingClose]);

  // Reset slot saat tanggal/mode berubah
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setSelectedSlot(null); }, [selectedDate, timeMode]);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* --- KOLOM KIRI: JADWAL --- */}
      <div className="lg:col-span-5 order-2 lg:order-1 lg:relative min-h-[600px]">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden lg:absolute lg:inset-0 flex flex-col">
          <div className="p-6 border-b border-slate-100 shrink-0">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              📅{" "}
              {selectedDate ? `Jadwal: ${formatDate(selectedDate)}` : "Jadwal Mendatang"}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {selectedDate ? "Slot kosong & terisi." : "Pilih tanggal untuk lihat slot kosong."}
            </p>
          </div>

          {selectedDate && isWeekend && (
            <div className="mx-6 mt-6 mb-2 p-4 bg-red-50 rounded-xl border border-red-200 shrink-0">
              <p className="text-sm font-bold text-red-700">🚫 Peminjaman Ditutup</p>
              <p className="text-xs text-red-600 mt-1">
                Gedung tidak beroperasi pada Sabtu &amp; Minggu.
              </p>
            </div>
          )}

          {/* Jadwal Kuliah Hari Dipilih — tampil lebih dulu */}
          {selectedDate && teachingOnDay.length > 0 && (
            <div className="mx-6 mt-6 mb-2 shrink-0">
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2">
                🎓 Jadwal Kuliah Tetap ({DAY_OF_WEEK[selectedDayOfWeek ?? 0]})
              </p>
              <div className="grid grid-cols-2 gap-1">
                {teachingOnDay.map((t) => (
                  <div key={t.id} className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                    <div className="min-w-0 mr-1">
                      <p className="text-[10px] font-bold text-amber-800 truncate">{t.matakuliah} – {t.kelas}</p>
                      <p className="text-[9px] text-amber-600 truncate">{t.dosen_pengampu}</p>
                    </div>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                      t.is_offline
                        ? "text-amber-700 bg-white border-amber-200"
                        : "text-emerald-700 bg-emerald-50 border-emerald-200"
                    }`}>
                      {t.start_time.slice(0, 5)}–{t.end_time.slice(0, 5)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Slot Kosong Tersedia — setelah jadwal kuliah */}
          {selectedDate && !isWeekend && (
            <div className="mx-6 mt-3 mb-2 p-4 bg-emerald-50 rounded-xl border border-emerald-100 animate-in fade-in slide-in-from-top-2 shrink-0">
              <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2 mb-3">
                ✅ Slot Kosong Tersedia
              </h3>
              {freeSlots.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {freeSlots.map((slot, idx) => {
                    const [s, e] = slot.split(" - ");
                    const isSelected = selectedSlot?.start === s && selectedSlot?.end === e;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedSlot({ start: s, end: e });
                          setTimeMode("simple");
                        }}
                        className={`text-xs font-mono font-bold px-3 py-1.5 rounded-lg border shadow-sm transition ${
                          isSelected
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-emerald-600 italic">Tidak ada slot kosong tersedia.</p>
              )}
            </div>
          )}

          <div className="p-6 pt-4 flex flex-col flex-1 min-h-0">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 pl-1 shrink-0">
              Daftar Terisi (Booked)
            </h4>
            {displayedSchedules.length > 0 ? (
              <div className="overflow-y-auto overflow-x-auto flex-1 rounded-xl border border-slate-100 relative custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/95 backdrop-blur-sm sticky top-0 z-20 border-b border-slate-200 shadow-sm">
                    <tr className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-3">Waktu</th>
                      <th className="py-3 px-3">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-slate-600 bg-white">
                    {displayedSchedules.map((sch) => {
                      const { durationText, statusTime, statusColor } =
                        getDurationAndStatus(sch.start_time, sch.end_time);
                      return (
                        <tr key={sch.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors last:border-b-0">
                          <td className="py-3 px-3 whitespace-nowrap align-top">
                            <div className="mb-1">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
                                {statusTime}
                              </span>
                            </div>
                            <div className="font-bold text-slate-700">{formatDate(sch.start_time)}</div>
                            <div className="font-mono text-slate-500 text-[10px]">
                              {formatTime(sch.start_time)} – {formatTime(sch.end_time)}
                            </div>
                          </td>
                          <td className="py-3 px-3 align-top">
                            <div className="font-bold text-slate-800 line-clamp-2 mb-1 flex items-center">
                              {sch.isFrozen && (
                                <span className="text-amber-500 mr-1.5" title="Freeze Time">🔒</span>
                              )}
                              <span className="line-clamp-1">{sch.title}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border ${
                                sch.priority_level === "high"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : sch.priority_level === "medium"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-slate-50 text-slate-500 border-slate-200"
                              }`}>
                                {sch.priority_level === "high" ? "Prioritas Tinggi" : sch.priority_level === "medium" ? "Prioritas Sedang" : "Prioritas Rendah"}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              {(Array.isArray(sch.profiles) ? sch.profiles[0] : sch.profiles)?.full_name || "User"}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 flex-1">
                <div className="text-2xl mb-2 grayscale opacity-50">🗓️</div>
                <p className="text-sm font-bold text-slate-600">Kosong</p>
                <p className="text-xs text-slate-400">
                  Tidak ada jadwal {selectedDate ? "terisi pada tanggal ini" : "mendatang"}.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- KOLOM KANAN: FORM --- */}
      <div className="lg:col-span-7 space-y-6 order-1 lg:order-2">
        <form
          action={formAction}
          className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
        >
          <input type="hidden" name="resourceId" value={resourceId} />
          <input type="hidden" name="activity_id" value={selectedActivityId} />

          {state?.error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 m-6 mb-0 rounded-r-lg flex items-center gap-3">
              <span className="text-red-600">⚠️</span>
              <p className="text-sm font-bold text-red-800 leading-relaxed">{state.error}</p>
            </div>
          )}

          <div className="p-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-1">Form Pengajuan</h2>
              <p className="text-sm text-slate-500">
                Ruangan: <span className="font-bold text-indigo-600">{resourceName}</span>
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3">
              <span className="text-lg">💡</span>
              <div className="text-xs text-amber-900 leading-relaxed">
                <p className="font-bold mb-0.5">Aturan Penting:</p>
                <ul className="list-disc pl-3 space-y-0.5">
                  <li>Peminjaman hanya berlaku <strong>Senin–Jumat</strong>.</li>
                  <li>Kegiatan berbobot tinggi wajib diajukan <strong>minimal H-1</strong>.</li>
                </ul>
              </div>
            </div>

            {facilities && facilities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {facilities.map((fac, i) => (
                  <span key={i} className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded border border-indigo-100">
                    {fac}
                  </span>
                ))}
              </div>
            )}

            <hr className="border-slate-100" />

            {/* TEMPLATE KEGIATAN */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                Jenis Kegiatan
              </label>
              {activityTemplates.length === 0 ? (
                <p className="text-sm text-red-500 font-medium">
                  Tidak ada kegiatan yang tersedia untuk role Anda.
                </p>
              ) : (
                <div className="relative">
                  <select
                    name="activity_id_select"
                    value={selectedActivityId}
                    onChange={(e) => setSelectedActivityId(e.target.value)}
                    className="w-full rounded-lg border-slate-300 bg-slate-50 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                  >
                    {activityTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">▼</div>
                </div>
              )}
              {selectedActivity && (
                <p className="text-[10px] text-slate-500 mt-1 ml-1 flex items-center gap-1.5">
                  Prioritas kegiatan ini:
                  <span className={`font-bold px-1.5 py-0.5 rounded border text-[9px] uppercase ${PRIORITY_STYLE[priorityLevel]}`}>
                    {PRIORITY_LABEL[priorityLevel]}
                  </span>
                  {activityWeight >= 30 && (
                    <span className="text-amber-600 font-bold">⚠️ Wajib H-1</span>
                  )}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Field Judul Kegiatan: hanya tampil jika template "mengajar" atau "kustom" */}
              {needsCustomTitle ? (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                    Judul Kegiatan
                  </label>
                  <input
                    type="text" name="title" required
                    placeholder="Cth: Rapat Prodi"
                    className="w-full rounded-lg border-slate-300 bg-slate-50 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              ) : (
                /* Jika template sudah jelas, judul = nama template (hidden) */
                <input type="hidden" name="title" value={selectedActivity?.name || ""} />
              )}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                  Tanggal
                </label>
                <input
                  name="booking_date" type="date" required
                  min={todayStr}
                  className="w-full rounded-lg border-slate-300 bg-slate-50 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
                {isWeekend && (
                  <p className="text-[10px] text-red-500 font-bold mt-1">
                    🚫 Sabtu &amp; Minggu tidak tersedia.
                  </p>
                )}
              </div>
            </div>

            {/* ===== PILIHAN WAKTU (DUAL MODE) ===== */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Waktu Peminjaman</label>
                <div className="flex text-[10px] font-bold rounded-lg overflow-hidden border border-slate-200">
                  <button type="button" onClick={() => setTimeMode("simple")}
                    className={`px-3 py-1.5 transition ${timeMode === "simple" ? "bg-indigo-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>
                    Sederhana
                  </button>
                  <button type="button" onClick={() => setTimeMode("custom")}
                    className={`px-3 py-1.5 transition ${timeMode === "custom" ? "bg-indigo-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>
                    Kustom
                  </button>
                </div>
              </div>

              {timeMode === "simple" ? (
                <div className="space-y-2">
                  {!selectedDate ? (
                    <p className="text-xs text-slate-400 italic py-2">Pilih tanggal terlebih dahulu untuk melihat slot waktu.</p>
                  ) : isClosureDay ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs font-bold text-red-700">🚫 Gedung tutup pada tanggal ini.</div>
                  ) : isWeekend ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs font-bold text-red-700">🚫 Gedung tidak beroperasi hari Sabtu &amp; Minggu.</div>
                  ) : templateSlots.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 font-medium">
                      {isHDay
                        ? "⚠️ Tidak ada slot kosong hari ini. Semua jadwal kuliah sedang berlangsung."
                        : "ℹ️ Tidak ada jadwal kuliah di hari ini. Gunakan mode Kustom untuk isi waktu manual."}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {isHDay && (
                        <p className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded font-bold">
                          ⚡ H-Day: Hanya slot kosong (dosen tidak hadir) yang tersedia.
                        </p>
                      )}
                      {!isHDay && (
                        <p className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-1 rounded font-bold">
                          📌 H-1+: Jadwal mengajar akan ditimpa jika skor Anda cukup.
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {templateSlots.map((t) => {
                          const s = t.start_time.slice(0, 5);
                          const e = t.end_time.slice(0, 5);
                          const isActive = selectedSlot?.start === s && selectedSlot?.end === e;
                          return (
                            <button key={t.id} type="button"
                              onClick={() => setSelectedSlot({ start: s, end: e })}
                              className={`text-xs font-mono font-bold px-3 py-1.5 rounded-lg border shadow-sm transition ${
                                isActive
                                  ? "bg-indigo-600 text-white border-indigo-600"
                                  : !t.is_offline
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-indigo-50 hover:border-indigo-300"
                              }`}>
                              {s} – {e}
                              {!t.is_offline && <span className={`ml-1 text-[9px] ${isActive ? "text-emerald-300" : "text-emerald-500"}`}>●</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {selectedSlot && (
                    <>
                      <input type="hidden" name="start_time" value={selectedSlot.start} />
                      <input type="hidden" name="end_time" value={selectedSlot.end} />
                      <p className="text-[10px] text-indigo-600 font-bold mt-1">✅ Dipilih: {selectedSlot.start} – {selectedSlot.end}</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Mulai</label>
                      <input name="start_time" type="time" required
                        min={buildingOpen} max={buildingClose}
                        className="w-full rounded-lg border-slate-300 bg-slate-50 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Selesai</label>
                      <input name="end_time" type="time" required
                        min={buildingOpen} max={buildingClose}
                        className="w-full rounded-lg border-slate-300 bg-slate-50 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                    🕐 Jam aktif gedung: <strong>{buildingOpen} – {buildingClose}</strong>. Booking di luar jam ini akan ditolak. Jika waktu yang dipilih overlap dengan jadwal mengajar aktif, booking juga akan ditolak.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                Deskripsi Tambahan
              </label>
              <textarea name="description" rows={2}
                className="w-full rounded-lg border-slate-300 bg-slate-50 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            {/* PANEL SKOR */}
            <div className="border-t border-slate-100">
              <button type="button" onClick={() => setShowScore(!showScore)}
                className="w-full flex items-center justify-between text-left py-2 px-1 text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors focus:outline-none group">
                <span className="flex items-center gap-2">
                  <span className="text-lg group-hover:scale-110 transition-transform">🏆</span>
                  {showScore ? "Sembunyikan Skor" : "Tampilkan Skor"}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                  className={`w-4 h-4 transition-transform duration-200 ${showScore ? "rotate-180" : ""}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {showScore && (
                <div className="mt-3 bg-slate-800 text-white rounded-xl p-4 shadow-inner animate-in fade-in slide-in-from-top-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-700 pb-3 mb-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prioritas Booking Anda</p>
                      <div className="text-sm font-medium text-slate-300 mt-1">
                        Kegiatan: {selectedActivity?.name || "-"}
                      </div>
                    </div>
                    <div className={`text-lg font-black px-4 py-1.5 rounded-full border-2 ${
                      priorityLevel === "tinggi" ? "text-red-400 border-red-500/50 bg-red-500/10" :
                      priorityLevel === "sedang" ? "text-amber-400 border-amber-500/50 bg-amber-500/10" :
                      "text-slate-300 border-slate-500/50 bg-slate-500/10"
                    }`}>
                      {PRIORITY_LABEL[priorityLevel]}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                    <span className="text-amber-400 font-bold">💡 Info:</span>{" "}
                    Prioritas lebih tinggi dapat menggeser booking prioritas rendah (sebelum Freeze Time 🔒).
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button type="submit" disabled={isPending || isWeekend || activityTemplates.length === 0}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2">
                {isPending ? "Memproses..." : "Ajukan Peminjaman"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
