"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { confirmMatchAction } from "@/actions/matches";
import { Button } from "@/components/ui/button";

export function ConfirmMatchButtons({ matchId }: { matchId: string }) {
  const [pending, start] = useTransition();

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await confirmMatchAction(matchId, true);
            if (!res.ok) {
              toast.error(res.error);
              return;
            }
            toast.success("Match dikonfirmasi");
          })
        }
      >
        Konfirmasi
      </Button>
      <Button
        size="sm"
        variant="danger"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await confirmMatchAction(matchId, false);
            if (!res.ok) {
              toast.error(res.error);
              return;
            }
            toast.message("Match ditandai disputed");
          })
        }
      >
        Tolak
      </Button>
    </div>
  );
}
