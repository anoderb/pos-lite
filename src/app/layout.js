import { Inter } from "next/font/google";
import "./globals.css";
import RateLimitProvider from "@/components/RateLimitProvider";
import PwaRegister from "@/components/PwaRegister";
import ToastProvider from "@/components/ui/ToastProvider";

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
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`h-full antialiased ${inter.variable}`}>
      <body className="min-h-full flex flex-col font-sans">
        {/* Bersihkan atribut yang disuntik tool/ekstensi browser sebelum hydration.
            Observer singkat menangani atribut yang muncul saat HTML sedang diparse. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var isForeign=function(name){return name.indexOf('bis_')===0||name.indexOf('__processed_')===0};var clean=function(el){if(!el||el.nodeType!==1)return;var remove=[];Array.prototype.forEach.call(el.attributes,function(attr){if(isForeign(attr.name))remove.push(attr.name)});remove.forEach(function(name){el.removeAttribute(name)});Array.prototype.forEach.call(el.children,clean)};clean(document.documentElement);var observer=new MutationObserver(function(records){records.forEach(function(record){if(record.type==='attributes')clean(record.target);else Array.prototype.forEach.call(record.addedNodes,function(node){if(node.nodeType===1)clean(node)})})});observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true});setTimeout(function(){observer.disconnect()},10000)}catch(e){}})();`,
          }}
        />
        <PwaRegister />
        <ToastProvider>
          <RateLimitProvider>{children}</RateLimitProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
