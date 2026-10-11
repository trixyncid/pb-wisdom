import { requireAdminPage } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { proofUrl } from "@/lib/proof";
import { formatRp } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { CreateFeePeriodForm } from "@/components/club/create-fee-period-form";
import { VerifyFeeButtons } from "@/components/club/verify-fee-buttons";

export default async function ClubIuranPage() {
  await requireAdminPage();
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
    <>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-navy">Iuran Admin</h1>
        <p className="text-sm text-slate-400">Buka periode & verifikasi bukti</p>
      </div>

      <Card className="mb-4">
        <CardTitle className="mb-3">Buka periode baru</CardTitle>
        <CreateFeePeriodForm />
      </Card>

      <section className="mb-5">
        <h2 className="mb-2 text-lg font-bold text-navy">Antrian bukti</h2>
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
                  <p className="font-medium text-navy">
                    {due.user.profile?.nickname ?? due.user.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {due.period.label} · {formatRp(due.period.amount)}
                  </p>
                </div>
                <Badge className="bg-amber-400/15 text-amber-700">SUBMITTED</Badge>
              </div>
              {due.submittedAt && (
                <a href={proofUrl(due.id, due.submittedAt)} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={proofUrl(due.id, due.submittedAt)}
                    alt={`Bukti transfer ${due.user.profile?.nickname ?? due.user.name ?? ""}`}
                    loading="lazy"
                    className="max-h-40 rounded-xl object-contain"
                  />
                </a>
              )}
              <VerifyFeeButtons dueId={due.id} />
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-navy">Ringkasan periode</h2>
        <div className="space-y-2">
          {periods.map((p) => {
            const verified = p.dues.filter((d) => d.status === "VERIFIED").length;
            const submitted = p.dues.filter((d) => d.status === "SUBMITTED").length;
            const unpaid = p.dues.filter((d) => d.status === "UNPAID" || d.status === "REJECTED").length;
            return (
              <Card key={p.id}>
                <p className="font-semibold text-navy">{p.label}</p>
                <p className="text-sm text-accent-ink">{formatRp(p.amount)}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Lunas {verified} · Menunggu {submitted} · Belum {unpaid} · Total{" "}
                  {p.dues.length}
                </p>
              </Card>
            );
          })}
        </div>
      </section>
    </>
  );
}
