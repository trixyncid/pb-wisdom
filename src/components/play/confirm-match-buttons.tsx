"use client";

import { useTransition } from "react";
import { withToast } from "@/lib/with-toast";
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
            const res = await withToast(confirmMatchAction(matchId, true), { success: "Match dikonfirmasi" });
            if (!res.ok) return;
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
            const res = await withToast(confirmMatchAction(matchId, false), { success: "Match ditandai disputed" });
            if (!res.ok) return;
          })
        }
      >
        Tolak
      </Button>
    </div>
  );
}
