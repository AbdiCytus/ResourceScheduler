"use client";

import { useState } from "react";
import { cancelBooking } from "./actions";
import ConfirmModal from "@/components/confirm-modal";

export function CancelBookingButton({ scheduleId }: { scheduleId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleConfirm = async () => {
    setShowConfirm(false);
    setLoading(true);
    const res = await cancelBooking(scheduleId);
    setLoading(false);
    if (res?.error) {
      alert(res.error);
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <span className="text-[10px] font-bold text-slate-400 italic">Dibatalkan</span>
    );
  }

  return (
    <>
      <ConfirmModal
        isOpen={showConfirm}
        title="Batalkan Peminjaman?"
        message="Peminjaman ini akan dibatalkan dan tidak dapat dikembalikan ke status semula."
        confirmLabel="Ya, Batalkan"
        confirmVariant="danger"
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
      />
      <button
        onClick={() => setShowConfirm(true)}
        disabled={loading}
        className="text-[10px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg transition disabled:opacity-50 flex items-center gap-1"
      >
        {loading ? (
          "Membatalkan..."
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
              <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
            </svg>
            Batalkan
          </>
        )}
      </button>
    </>
  );
}
