import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { LogoutButton } from "@/components/auth/logout-button";

export default async function PendingPage() {
  const session = await auth();

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <Card className="w-full max-w-md space-y-4 p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl">
          ⏳
        </div>
        <h1 className="text-xl font-black text-[#0b2a4a]">Menunggu persetujuan</h1>
        <p className="text-sm text-slate-500">
          Halo {session?.user?.name ?? "player"}. Admin masih meninjau
          permintaanmu. Kamu akan bisa masuk setelah disetujui.
        </p>
        <LogoutButton className="w-full" />
      </Card>
    </main>
  );
}
