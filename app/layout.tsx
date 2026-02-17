import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar"; // Import Navbar

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smart Scheduler System",
  description: "Skripsi Sistem Penjadwalan Cerdas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Pasang Navbar di sini agar muncul di semua halaman */}
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
