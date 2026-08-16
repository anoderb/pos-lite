import { Inter } from "next/font/google";
import "./globals.css";
import RateLimitProvider from "@/components/RateLimitProvider";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "Tokiva — Kelola Toko, Jualan Makin Cerdas",
  description: "Aplikasi kasir & manajemen toko: kelola transaksi, stok, karyawan, dan laporan penjualan dalam satu aplikasi.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`h-full antialiased ${inter.variable}`}>
      <body className="min-h-full flex flex-col font-sans">
        <RateLimitProvider>{children}</RateLimitProvider>
      </body>
    </html>
  );
}
