import Image from "next/image";
import Link from "next/link";
import logoImg from "@/assets/brand/logo.png";
import { ResetPasswordForm } from "@/components/account/reset-password-form";

export const metadata = { title: "Reset password · PB Wisdom" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <main className="court-stripes flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6 rounded-[32px] bg-white p-6 shadow-xl">
        <div className="space-y-3 text-center">
          <Image src={logoImg} alt="PB Wisdom" width={140} height={106} className="mx-auto h-auto w-[140px]" />
          <h1 className="font-display text-2xl font-extrabold text-navy">Buat password baru</h1>
          <p className="text-sm text-slate-500">Link ini hanya bisa dipakai sekali dan berlaku 24 jam.</p>
        </div>
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <p className="rounded-2xl bg-cream p-4 text-center text-sm text-navy">
            Link tidak lengkap. Minta link reset baru ke admin klub.
          </p>
        )}
        <p className="text-center text-sm text-slate-500">
          Ingat passwordnya? <Link href="/login" className="font-bold text-accent-ink">Masuk</Link>
        </p>
      </div>
    </main>
  );
}
