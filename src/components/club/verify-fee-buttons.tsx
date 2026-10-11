"use client";

import { useTransition } from "react";
import { withToast } from "@/lib/with-toast";
import { verifyFeeAction } from "@/actions/iuran";
import { Button } from "@/components/ui/button";

export function VerifyFeeButtons({ dueId }: { dueId: string }) {
  const [pending, start] = useTransition();

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await withToast(verifyFeeAction(dueId, true), { success: "Diverifikasi" });
            if (!res.ok) return;
          })
        }
      >
        Verify
      </Button>
      <Button
        size="sm"
        variant="danger"
        disabled={pending}
        onClick={() => {
          const reason = window.prompt("Alasan penolakan (dikirim ke member):", "Bukti tidak jelas");
          if (reason === null) return;
          start(async () => {
            const res = await withToast(verifyFeeAction(dueId, false, reason), { success: "Ditolak" });
            if (!res.ok) return;
          });
        }}
      >
        Reject
      </Button>
    </div>
  );
}
