"use client";

import { useEffect, useRef } from "react";

type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: "danger" | "warning" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Ya, Lanjutkan",
  confirmVariant = "danger",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Fokus ke tombol batal saat modal terbuka
  useEffect(() => {
    if (isOpen) cancelRef.current?.focus();
  }, [isOpen]);

  // Tutup dengan Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onCancel]);

  // Lock scroll saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const variantClass = {
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-red-200",
    warning: "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200",
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200",
  }[confirmVariant];

  const iconEmoji = {
    danger: "🗑️",
    warning: "⚠️",
    primary: "✅",
  }[confirmVariant];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="text-4xl mb-3">{iconEmoji}</div>
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{message}</p>
        </div>

        {/* Tombol Aksi */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition shadow-lg ${variantClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
