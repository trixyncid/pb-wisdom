import { prisma } from "@/lib/db";
import { formatRp } from "@/lib/utils";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { CreateFeePeriodForm } from "@/components/club/create-fee-period-form";
import { VerifyFeeButtons } from "@/components/club/verify-fee-buttons";

export default async function ClubIuranPage() {
  const [periods, queue] = await Promise.all([
    prisma.feePeriod.findMany({
      orderBy: { dueDate: "desc" },
      include: {
        dues: true,
      },
    }),
    prisma.feeDue.findMany({
      where: { status: "SUBMITTED" },
      include: {
        period: true,
        user: { include: { profile: true } },
      },
      orderBy: { submittedAt: "asc" },
    }),
  ]);

  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#0b2a4a]">Iuran Admin</h1>
        <p className="text-sm text-slate-400">Buka periode & verifikasi bukti</p>
      </div>

      <Card className="mb-4">
        <CardTitle className="mb-3">Buka periode baru</CardTitle>
        <CreateFeePeriodForm />
      </Card>

      <section className="mb-5">
        <h2 className="mb-2 text-lg font-bold text-[#0b2a4a]">Antrian bukti</h2>
        <div className="space-y-2">
          {queue.length === 0 && (
            <Card>
              <p className="text-sm text-slate-400">Tidak ada bukti menunggu</p>
            </Card>
          )}
          {queue.map((due) => (
            <Card key={due.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#0b2a4a]">
                    {due.user.profile?.nickname ?? due.user.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {due.period.label} · {formatRp(due.period.amount)}
                  </p>
                </div>
                <Badge className="bg-amber-400/15 text-amber-700">SUBMITTED</Badge>
              </div>
              {due.proofUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={due.proofUrl}
                  alt="Bukti"
                  className="max-h-40 rounded-xl object-contain"
                />
              )}
              <VerifyFeeButtons dueId={due.id} />
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-[#0b2a4a]">Ringkasan periode</h2>
        <div className="space-y-2">
          {periods.map((p) => {
            const verified = p.dues.filter((d) => d.status === "VERIFIED").length;
            const submitted = p.dues.filter((d) => d.status === "SUBMITTED").length;
            const unpaid = p.dues.filter((d) => d.status === "UNPAID" || d.status === "REJECTED").length;
            return (
              <Card key={p.id}>
                <p className="font-semibold text-[#0b2a4a]">{p.label}</p>
                <p className="text-sm text-[#2eb6ea]">{formatRp(p.amount)}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Lunas {verified} · Menunggu {submitted} · Belum {unpaid} · Total{" "}
                  {p.dues.length}
                </p>
              </Card>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
