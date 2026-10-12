import { notFound } from "next/navigation";
import { id as localeId } from "date-fns/locale";
import { Download, MessageCircle } from "lucide-react";
import type { FeeStatus } from "@prisma/client";
import { requireAdminPage } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { avatarUrl } from "@/lib/avatar";
import { formatClub } from "@/lib/time";
import { waLink } from "@/lib/people";
import { formatRp, cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CopyButton } from "@/components/ui/copy-button";
import { AdminHeader } from "@/components/club/admin-header";
import { DeletePeriodButton, MarkPaidButton } from "@/components/club/due-admin-actions";

const GROUPS: { key: string; title: string; statuses: FeeStatus[]; tone: string }[] = [
  { key: "belum", title: "Belum bayar", statuses: ["UNPAID", "REJECTED"], tone: "text-rose-600" },
  { key: "menunggu", title: "Menunggu verifikasi", statuses: ["SUBMITTED"], tone: "text-accent-ink" },
  { key: "lunas", title: "Lunas", statuses: ["VERIFIED"], tone: "text-emerald-700" },
];

const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

export default async function FeePeriodPage({ params }: { params: Promise<{ periodId: string }> }) {
  await requireAdminPage();
  const { periodId } = await params;
  const period = await prisma.feePeriod.findUnique({
    where: { id: periodId },
    include: {
      dues: {
        select: {
          id: true,
          status: true,
          submittedAt: true,
          verifiedAt: true,
          rejectReason: true,
          user: { select: { id: true, name: true, profile: { select: { nickname: true, phone: true, updatedAt: true } } } },
        },
      },
    },
  });
  if (!period) notFound();

  const name = (d: (typeof period.dues)[number]) => d.user.profile?.nickname ?? d.user.name ?? "Player";
  const dues = [...period.dues].sort((a, b) => name(a).localeCompare(name(b), "id"));
  const paid = dues.filter((d) => d.status === "VERIFIED").length;
  const unpaid = dues.filter((d) => d.status === "UNPAID" || d.status === "REJECTED");
  const dueText = formatClub(period.dueDate, "d MMMM yyyy", { locale: localeId });
  const reminder = (n: string) =>
    `Halo ${n}, pengingat iuran PB Wisdom ${period.label} sebesar ${formatRp(period.amount)} (jatuh tempo ${dueText}).\n${period.paymentInstructions}\nUpload bukti di aplikasi: Profil → Iuran saya. Terima kasih!`;
  let i = 2;

  return (
    <div className="flex flex-col gap-5 pt-2">
      <AdminHeader title={period.label} backHref="/club/iuran" backLabel="Iuran" />

      <section className="rise relative overflow-hidden rounded-[32px] bg-navy p-5 text-white shadow-[0_24px_52px_rgba(14,44,60,0.32)]" style={rise(1)}>
        <div aria-hidden className="absolute -right-16 -top-16 size-56 rounded-full bg-accent/25 blur-3xl" />
        <div className="relative">
          <p className="text-sm font-semibold text-white/60">Terkumpul</p>
          <p className="font-display text-4xl font-extrabold">{formatRp(paid * period.amount)}</p>
          <p className="text-sm text-white/60">
            dari {formatRp(dues.length * period.amount)} · {formatRp(period.amount)}/orang · jatuh tempo {dueText}
          </p>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-accent" style={{ width: `${dues.length ? (paid / dues.length) * 100 : 0}%` }} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={`/api/export/iuran?periodId=${period.id}`} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-bold text-navy">
              <Download className="size-4" /> CSV
            </a>
            {paid === 0 && !dues.some((d) => d.status === "SUBMITTED") && <DeletePeriodButton periodId={period.id} label={period.label} />}
          </div>
        </div>
      </section>

      {unpaid.length > 0 && (
        <div className="rise flex flex-wrap items-center gap-2 rounded-[24px] bg-accent-soft px-4 py-3" style={rise(2)}>
          <p className="min-w-0 flex-1 text-sm text-navy">
            Kirim pengingat satu per satu lewat tombol WA, atau salin daftar untuk grup.
          </p>
          <CopyButton
            label="Salin daftar"
            value={`Iuran ${period.label} (${formatRp(period.amount)}) yang belum masuk:\n${unpaid.map((d, n) => `${n + 1}. ${name(d)}`).join("\n")}\n\n${period.paymentInstructions}`}
          />
        </div>
      )}

      {GROUPS.map((g) => {
        const rows = dues.filter((d) => g.statuses.includes(d.status));
        if (rows.length === 0) return null;
        return (
          <section key={g.key} className="flex flex-col gap-2">
            <h2 className={cn("px-1 text-xs font-bold uppercase tracking-[0.16em]", g.tone)}>
              {g.title} · {rows.length}
            </h2>
            <ul className="flex flex-col gap-2">
              {rows.map((d) => {
                const wa = g.key === "belum" ? waLink(d.user.profile?.phone, reminder(name(d))) : null;
                return (
                  <li key={d.id} className="rise flex flex-wrap items-center gap-3 rounded-[22px] border border-white bg-white/90 p-3 shadow-[0_8px_22px_rgba(14,44,60,0.05)]" style={rise(i++)}>
                    <Avatar className="size-10">
                      <AvatarImage src={avatarUrl(d.user.id, d.user.profile?.updatedAt)} alt="" />
                      <AvatarFallback className="text-navy">{name(d).slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-navy">{name(d)}</p>
                      <p className="truncate text-xs text-slate-500">
                        {d.status === "VERIFIED"
                          ? `${d.submittedAt ? "Transfer" : "Tunai"} · ${d.verifiedAt ? formatClub(d.verifiedAt, "d MMM", { locale: localeId }) : ""}`
                          : d.status === "REJECTED"
                            ? `Bukti ditolak: ${d.rejectReason ?? ""}`
                            : d.status === "SUBMITTED"
                              ? "Cek di antrian bukti"
                              : "Belum ada pembayaran"}
                      </p>
                    </div>
                    {d.status !== "VERIFIED" && (
                      <div className="flex gap-1.5">
                        {wa && (
                          <a href={wa} target="_blank" rel="noreferrer" aria-label={`Ingatkan ${name(d)} via WhatsApp`} className="flex size-9 items-center justify-center rounded-full bg-[#25d366] text-white">
                            <MessageCircle className="size-4" />
                          </a>
                        )}
                        <MarkPaidButton dueId={d.id} name={name(d)} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
