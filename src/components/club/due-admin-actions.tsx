"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Pencil, Trash2 } from "lucide-react";
import { withToast } from "@/lib/with-toast";
import { deleteFeePeriodAction, markDuePaidAction } from "@/actions/admin";
import { updateFeePeriodAction } from "@/actions/iuran";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";

/** Admin: record a cash payment for one due. */
export function MarkPaidButton({ dueId, name }: { dueId: string; name: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Catat iuran ${name} sudah lunas (tunai / di luar aplikasi)?`)) return;
        start(async () => {
          await withToast(markDuePaidAction(dueId), { success: `${name} dicatat lunas` });
        });
      }}
      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-emerald-50 px-3 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
    >
      <Banknote className="size-3.5" /> Lunas tunai
    </button>
  );
}

/** Admin: delete a period opened by mistake (only before anyone paid). */
export function DeletePeriodButton({ periodId, label }: { periodId: string; label: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Hapus periode ${label} beserta semua tagihannya?`)) return;
        start(async () => {
          const res = await withToast(deleteFeePeriodAction(periodId), { success: "Periode dihapus" });
          if (res.ok) router.push("/club/iuran");
        });
      }}
      className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white/10 px-4 text-sm font-bold text-white/80 transition hover:bg-rose-500/80 hover:text-white disabled:opacity-50"
    >
      <Trash2 className="size-4" /> Hapus periode
    </button>
  );
}

/** Admin: fix a period's name, amount (until someone paid), due date or payment details. */
export function EditFeePeriodButton({
  periodId,
  initial,
  amountLocked,
}: {
  periodId: string;
  initial: { label: string; amount: number; dueDate: string; paymentInstructions: string };
  amountLocked: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(initial.label);
  const [amount, setAmount] = useState(String(initial.amount));
  const [dueDate, setDueDate] = useState(initial.dueDate);
  const [instructions, setInstructions] = useState(initial.paymentInstructions);
  const [pending, start] = useTransition();
  const uid = useId();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/20"
      >
        <Pencil className="size-4" /> Edit
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Edit periode iuran">
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await withToast(
                updateFeePeriodAction(periodId, { label, amount: Number(amount), dueDate, paymentInstructions: instructions }),
                { loading: "Menyimpan…", success: "Periode diperbarui" },
              );
              if (res.ok) setOpen(false);
            });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor={`${uid}-label`}>Nama periode</Label>
            <Input id={`${uid}-label`} value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor={`${uid}-amount`}>Nominal (Rp)</Label>
              <Input
                id={`${uid}-amount`}
                inputMode="numeric"
                value={amount}
                disabled={amountLocked}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${uid}-due`}>Jatuh tempo</Label>
              <DatePicker id={`${uid}-due`} value={dueDate} onChange={setDueDate} required />
            </div>
          </div>
          {amountLocked && <p className="text-xs text-slate-500">Nominal terkunci karena sudah ada yang bayar atau kirim bukti.</p>}
          <div className="space-y-1.5">
            <Label htmlFor={`${uid}-instructions`}>Cara bayar</Label>
            <textarea
              id={`${uid}-instructions`}
              className="min-h-20 w-full rounded-2xl border border-navy/10 bg-cream px-3 py-2 text-sm text-navy outline-none focus:ring-2 focus:ring-accent"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              maxLength={2000}
              required
            />
          </div>
          <p className="text-xs text-slate-500">Member yang belum bayar diberi tahu kalau nominal atau jatuh tempo berubah.</p>
          <Button type="submit" disabled={pending}>
            {pending ? "Menyimpan…" : "Simpan perubahan"}
          </Button>
        </form>
      </Sheet>
    </>
  );
}
