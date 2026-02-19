"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function CustomToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Ref untuk melacak apakah toast sudah tampil untuk URL params saat ini
  const toastShownRef = useRef(false);

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    // Hanya tampilkan jika ada param DAN belum ditampilkan sebelumnya
    if ((success || error) && !toastShownRef.current) {
      if (success) toast.success(success, { duration: 5000 });
      if (error) toast.error(error, { duration: 5000 });

      // Tandai sudah tampil agar tidak double firing
      toastShownRef.current = true;

      // Bersihkan URL dari query params tanpa refresh halaman
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("success");
      newParams.delete("error");

      router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
    }

    // Reset ref jika params sudah bersih (persiapan untuk notifikasi berikutnya)
    if (!success && !error) {
      toastShownRef.current = false;
    }
  }, [searchParams, router, pathname]);

  // [POIN 4] Posisi Tengah Atas
  return <Toaster position="top-center" />;
}
