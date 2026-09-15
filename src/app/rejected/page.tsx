import { Card } from "@/components/ui/card";
import { LogoutButton } from "@/components/auth/logout-button";

export default function RejectedPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <Card className="w-full max-w-md space-y-4 p-6 text-center">
        <h1 className="text-xl font-black text-[#0b2a4a]">Akses ditolak</h1>
        <p className="text-sm text-slate-500">
          Akunmu tidak diizinkan masuk. Hubungi admin PB Wisdom.
        </p>
        <LogoutButton className="w-full" />
      </Card>
    </main>
  );
}
