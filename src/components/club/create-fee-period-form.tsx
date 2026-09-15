"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createFeePeriodAction } from "@/actions/iuran";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateFeePeriodForm() {
  const [label, setLabel] = useState("Oktober 2026");
  const [amount, setAmount] = useState("150000");
  const [dueDate, setDueDate] = useState("2026-10-10");
  const [instructions, setInstructions] = useState(
    "BCA 1234567890 a.n. PB Wisdom\nQRIS: lihat grup WA",
  );
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          await createFeePeriodAction({
            label,
            amount: Number(amount),
            dueDate,
            paymentInstructions: instructions,
          });
          toast.success("Periode iuran dibuka");
        });
      }}
    >
      <div className="space-y-1">
        <Label>Label</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label>Amount (IDR)</Label>
          <Input value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Due date</Label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Payment instructions</Label>
        <textarea
          className="min-h-20 w-full rounded-xl border border-[#0b2a4a]/10 bg-[#f3f8fc] px-3 py-2 text-sm text-[#0b2a4a]"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={pending}>
        Open period
      </Button>
    </form>
  );
}
