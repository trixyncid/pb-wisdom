"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { submitFeeProofAction } from "@/actions/iuran";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FeeProofForm({ dueId }: { dueId: string }) {
  const [url, setUrl] = useState("https://placehold.co/400x600/png?text=Bukti");
  const [pending, start] = useTransition();

  return (
    <div className="space-y-2">
      <Input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="URL bukti transfer"
      />
      <Button
        size="sm"
        disabled={pending || !url}
        onClick={() =>
          start(async () => {
            await submitFeeProofAction(dueId, url);
            toast.success("Bukti dikirim");
          })
        }
      >
        Upload bukti
      </Button>
    </div>
  );
}
