"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Trash2 } from "lucide-react";
import { withToast } from "@/lib/with-toast";
import { deleteFeePeriodAction, markDuePaidAction } from "@/actions/admin";

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
