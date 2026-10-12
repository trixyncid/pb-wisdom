"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { withToast } from "@/lib/with-toast";
import { createFeePeriodAction } from "@/actions/iuran";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";

/** Open a new fee period; every active member gets a due and a notification. */
export function CreateFeePeriodForm({ lastAmount, lastInstructions }: { lastAmount?: number; lastInstructions?: string }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(() =>
    new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date()),
  );
  const [amount, setAmount] = useState(String(lastAmount ?? 150000));
  const [dueDate, setDueDate] = useState("");
  const [instructions, setInstructions] = useState(lastInstructions ?? "");
  const [pending, start] = useTransition();

  return (
    <section className="rise overflow-hidden rounded-[28px] border border-white bg-white/90 shadow-[0_10px_28px_rgba(14,44,60,0.06)]" style={{ "--i": 1 } as React.CSSProperties}>
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-cream">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-navy text-accent">
          <Plus className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold text-navy">Buka periode baru</span>
          <span className="block text-xs text-slate-500">Tagihan dibuat untuk semua member aktif</span>
        </span>
        <ChevronDown className={cn("size-4 text-slate-400 transition", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
            onSubmit={(e) => {
              e.preventDefault();
              start(async () => {
                const res = await withToast(
                  createFeePeriodAction({ label, amount: Number(amount.replace(/\D/g, "")), dueDate, paymentInstructions: instructions }),
                  { success: "Periode iuran dibuka, member sudah diberi tahu" },
                );
                if (!res.ok) return;
                setDueDate("");
                setOpen(false);
              });
            }}
          >
            <div className="flex flex-col gap-3 px-4 pb-4">
              <div className="space-y-1.5">
                <Label htmlFor="fee-label">Nama periode</Label>
                <Input id="fee-label" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fee-amount">Nominal (Rp)</Label>
                  <Input id="fee-amount" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fee-due">Jatuh tempo</Label>
                  <DatePicker id="fee-due" value={dueDate} onChange={setDueDate} placeholder="Pilih" required fromDate={new Date()} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fee-instructions">Cara bayar</Label>
                <textarea
                  id="fee-instructions"
                  className="min-h-20 w-full rounded-2xl border border-navy/10 bg-cream px-3 py-2 text-sm text-navy outline-none focus:ring-2 focus:ring-accent"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Contoh: BCA 1234567890 a.n. PB Wisdom"
                  maxLength={2000}
                  required
                />
              </div>
              <Button type="submit" disabled={pending}>
                {pending ? "Membuka…" : "Buka periode & kirim tagihan"}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </section>
  );
}
