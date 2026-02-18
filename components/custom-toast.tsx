"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CustomToast() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    // Cek apakah ada parameter success atau error di URL
    const successMsg = searchParams.get("success");
    const errorMsg = searchParams.get("error");

    if (successMsg) {
      setToast({ message: successMsg, type: "success" });
    } else if (errorMsg) {
      setToast({ message: errorMsg, type: "error" });
    }

    // Jika ada pesan, set timer 5 detik untuk menghilang
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setToast(null);
        // Opsional: Bersihkan URL agar notif tidak muncul lagi saat refresh
        // router.replace('/portal', { scroll: false });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  if (!toast) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-5 fade-in duration-300">
      <div
        className={`px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border ${
          toast.type === "success"
            ? "bg-emerald-600 text-white border-emerald-500"
            : "bg-red-600 text-white border-red-500"
        }`}
      >
        {/* Ikon */}
        {toast.type === "success" ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z"
              clipRule="evenodd"
            />
          </svg>
        )}

        <span className="font-bold text-sm">{toast.message}</span>
      </div>
    </div>
  );
}
