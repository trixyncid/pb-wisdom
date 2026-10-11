"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="court-stripes flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-4 rounded-[32px] bg-white p-6 text-center shadow-xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-ink">
          Oops
        </p>
        <h1 className="text-xl font-black text-navy">Terjadi kesalahan</h1>
        <p className="text-sm text-slate-500">
          Halaman ini gagal dimuat. Coba lagi, atau kembali ke beranda.
        </p>
        {error.digest && (
          <p className="font-mono text-[11px] text-slate-400">Kode: {error.digest}</p>
        )}
        <div className="flex justify-center gap-2">
          <Button onClick={() => retry()}>Coba lagi</Button>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Beranda
          </Link>
        </div>
      </div>
    </main>
  );
}
