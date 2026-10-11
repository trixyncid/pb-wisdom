"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { submitFeeProofAction } from "@/actions/iuran";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FeeProofForm({ dueId }: { dueId: string }) {
  const [url, setUrl] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="space-y-2">
      <Input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://… (link foto bukti transfer)"
        type="url"
      />
      <Button
        size="sm"
        disabled={pending || !url}
        onClick={() =>
          start(async () => {
            const res = await submitFeeProofAction(dueId, url);
            if (!res.ok) {
              toast.error(res.error);
              return;
            }
            toast.success("Bukti dikirim");
          })
        }
      >
        Upload bukti
      </Button>
    </div>
  );
}
