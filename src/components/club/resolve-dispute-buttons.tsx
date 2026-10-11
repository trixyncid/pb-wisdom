"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { resolveDisputeAction } from "@/actions/matches";
import { Button } from "@/components/ui/button";

export function ResolveDisputeButtons({ matchId }: { matchId: string }) {
  const [pending, start] = useTransition();

  function resolve(decision: "CONFIRM" | "DELETE") {
    if (decision === "DELETE" && !window.confirm("Hapus match ini? Tidak bisa dibatalkan.")) return;
    start(async () => {
      const res = await resolveDisputeAction(matchId, decision);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(decision === "CONFIRM" ? "Hasil disahkan" : "Match dihapus");
    });
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={pending} onClick={() => resolve("CONFIRM")}>
        Sahkan skor
      </Button>
      <Button size="sm" variant="danger" disabled={pending} onClick={() => resolve("DELETE")}>
        Hapus match
      </Button>
    </div>
  );
}
