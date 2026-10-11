"use client";

import { useTransition } from "react";
import { toast } from "sonner";
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
            const res = await verifyFeeAction(dueId, true);
            if (!res.ok) {
              toast.error(res.error);
              return;
            }
            toast.success("Diverifikasi");
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
            const res = await verifyFeeAction(dueId, false, reason);
            if (!res.ok) {
              toast.error(res.error);
              return;
            }
            toast.message("Ditolak");
          });
        }}
      >
        Reject
      </Button>
    </div>
  );
}
