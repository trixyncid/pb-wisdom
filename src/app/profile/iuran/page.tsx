import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatRp } from "@/lib/utils";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FeeProofForm } from "@/components/profile/fee-proof-form";

export default async function IuranPage() {
  const session = await auth();
  if (!session?.user) return null;

  const dues = await prisma.feeDue.findMany({
    where: { userId: session.user.id },
    include: { period: true },
    orderBy: { period: { dueDate: "desc" } },
  });

  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#0b2a4a]">Iuran saya</h1>
        <p className="text-sm text-slate-400">Upload bukti transfer untuk verifikasi admin</p>
      </div>

      <div className="space-y-3">
        {dues.map((due) => (
          <Card key={due.id} className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-[#0b2a4a]">{due.period.label}</p>
                <p className="text-sm text-[#2eb6ea]">
                  {formatRp(due.period.amount)}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-xs text-slate-400">
                  {due.period.paymentInstructions}
                </p>
              </div>
              <Badge
                className={
                  due.status === "VERIFIED"
                    ? "bg-emerald-100 text-emerald-700"
                    : due.status === "SUBMITTED"
                      ? "bg-amber-400/15 text-amber-700"
                      : due.status === "REJECTED"
                        ? "bg-rose-100 text-rose-700"
                        : ""
                }
              >
                {due.status}
              </Badge>
            </div>
            {due.rejectReason && (
              <p className="text-xs text-rose-600">Alasan: {due.rejectReason}</p>
            )}
            {due.proofUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={due.proofUrl}
                alt="Bukti"
                className="max-h-48 rounded-xl border border-[#0b2a4a]/8 object-contain"
              />
            )}
            {(due.status === "UNPAID" || due.status === "REJECTED") && (
              <FeeProofForm dueId={due.id} />
            )}
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
