import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="court-stripes flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-4 rounded-[32px] bg-white p-6 text-center shadow-xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2eb6ea]">404</p>
        <h1 className="text-xl font-black text-[#0b2a4a]">Halaman tidak ditemukan</h1>
        <p className="text-sm text-slate-500">
          Link ini mungkin salah atau halamannya sudah dihapus.
        </p>
        <Link href="/" className={buttonVariants()}>
          Kembali ke beranda
        </Link>
      </div>
    </main>
  );
}
