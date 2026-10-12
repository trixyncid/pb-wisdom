import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { KeyRound, MessageCircle, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import logoImg from "@/assets/brand/logo.png";

export const metadata = { title: "Lupa password · PB Wisdom" };

// No email is sent by this app: an admin creates a one-time reset link and
// shares it over WhatsApp. Admin phone numbers are not shown on this public page.
export default async function ForgotPasswordPage() {
  // The admin list comes from the database: render per request, not at build.
  await connection();
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, name: true, profile: { select: { nickname: true } } },
    take: 5,
  });
  const names = admins.map((a) => a.profile?.nickname ?? a.name ?? "Admin");

  const steps = [
    { icon: MessageCircle, text: "Kabari admin klub (lewat grup WhatsApp atau langsung) bahwa kamu lupa password." },
    { icon: KeyRound, text: "Admin mengirim link reset ke WhatsApp-mu. Link berlaku 24 jam dan hanya sekali pakai." },
    { icon: ShieldCheck, text: "Buka link, buat password baru, lalu masuk seperti biasa." },
  ];

  return (
    <main className="court-stripes flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6 rounded-[32px] bg-white p-6 shadow-xl">
        <div className="space-y-3 text-center">
          <Image src={logoImg} alt="PB Wisdom" width={140} height={106} className="mx-auto h-auto w-[140px]" />
          <h1 className="font-display text-2xl font-extrabold text-navy">Lupa password?</h1>
          <p className="text-sm text-slate-500">Tenang, admin bisa bantu reset dalam hitungan menit.</p>
        </div>
        <ol className="space-y-3">
          {steps.map(({ icon: Icon, text }, i) => (
            <li key={i} className="flex items-start gap-3 rounded-2xl bg-cream p-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-navy text-accent">
                <Icon className="size-4" />
              </span>
              <p className="pt-1.5 text-sm text-navy">{text}</p>
            </li>
          ))}
        </ol>
        {names.length > 0 && (
          <p className="text-center text-sm text-slate-500">
            Admin klub: <span className="font-semibold text-navy">{names.join(", ")}</span>
          </p>
        )}
        <Link href="/login" className="block text-center text-sm font-bold text-accent-ink">
          Kembali ke halaman masuk
        </Link>
      </div>
    </main>
  );
}
