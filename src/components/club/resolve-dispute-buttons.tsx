"use client";

import { useTransition } from "react";
import { withToast } from "@/lib/with-toast";
import { resolveDisputeAction } from "@/actions/matches";
import { Button } from "@/components/ui/button";

export function ResolveDisputeButtons({ matchId }: { matchId: string }) {
  const [pending, start] = useTransition();

  function resolve(decision: "CONFIRM" | "DELETE") {
    if (decision === "DELETE" && !window.confirm("Hapus match ini? Tidak bisa dibatalkan.")) return;
    start(async () => {
      const res = await withToast(resolveDisputeAction(matchId, decision), { success: decision === "CONFIRM" ? "Hasil disahkan" : "Match dihapus" });
      if (!res.ok) return;
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
