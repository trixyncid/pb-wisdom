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
            await verifyFeeAction(dueId, true);
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
        onClick={() =>
          start(async () => {
            await verifyFeeAction(dueId, false, "Bukti tidak jelas");
            toast.message("Ditolak");
          })
        }
      >
        Reject
      </Button>
    </div>
  );
}
