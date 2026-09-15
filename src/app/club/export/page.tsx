import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatRp } from "@/lib/utils";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

export default async function ClubExportPage() {
  const periods = await prisma.feePeriod.findMany({
    orderBy: { dueDate: "desc" },
    include: {
      dues: {
        include: { user: { include: { profile: true } } },
      },
    },
  });

  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#0b2a4a]">Export iuran</h1>
        <p className="text-sm text-slate-400">CSV untuk bendahara</p>
      </div>

      <div className="space-y-3">
        {periods.map((p) => {
          const verified = p.dues.filter((d) => d.status === "VERIFIED").length;
          const total = verified * p.amount;
          return (
            <Card key={p.id} className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>{p.label}</CardTitle>
                <p className="text-xs text-slate-400">
                  {verified}/{p.dues.length} lunas · {formatRp(total)}
                </p>
              </div>
              <a href={`/api/export/iuran?periodId=${p.id}`}>
                <Button size="sm" variant="secondary">
                  Download CSV
                </Button>
              </a>
            </Card>
          );
        })}
      </div>

      <Link href="/club" className="mt-4 inline-block text-sm text-[#2eb6ea]">
        ← Kembali
      </Link>
    </AppShell>
  );
}
