import "./globals.css";
import RateLimitProvider from "@/components/RateLimitProvider";
import GlobalButtonGuard from "@/components/GlobalButtonGuard";

export const metadata = {
  title: "Tokiva — Kasir Cerdas untuk UMKM Modern",
  description: "Sistem POS UMKM dengan deteksi produk otomatis berbasis Computer Vision",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <RateLimitProvider><GlobalButtonGuard />{children}</RateLimitProvider>
      </body>
    </html>
  );
}
