import Image from "next/image";
import { Hourglass } from "lucide-react";
import { auth } from "@/lib/auth";
import logoImg from "@/assets/brand/logo.png";
import { LogoutButton } from "@/components/auth/logout-button";
import { ApprovalWatcher } from "@/components/auth/approval-watcher";

export const metadata = { title: "Menunggu persetujuan · PB Wisdom" };

export default async function PendingPage() {
  const session = await auth();
  const name = session?.user?.name?.split(" ")[0] ?? "teman";

  return (
    <main className="court-stripes flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6 rounded-[32px] bg-white p-6 text-center shadow-xl">
        <Image src={logoImg} alt="PB Wisdom" width={140} height={106} className="mx-auto h-auto w-[140px]" />
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
          <Hourglass className="size-7" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-extrabold text-navy">Menunggu persetujuan</h1>
          <p className="text-sm text-slate-500">
            Halo {name}! Pendaftaranmu sudah masuk dan admin sedang meninjaunya. Kamu akan dapat email begitu akunmu disetujui, dan halaman
            ini otomatis terbuka.
          </p>
        </div>
        <p className="rounded-2xl bg-cream px-4 py-3 text-sm text-navy">Biar lebih cepat, kabari admin di grup WhatsApp klub bahwa kamu sudah daftar.</p>
        <LogoutButton className="w-full" />
        <ApprovalWatcher />
      </div>
    </main>
  );
}
