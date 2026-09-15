"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { regenerateInviteAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function InvitePanel({ code }: { code: string }) {
  const [pending, start] = useTransition();
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/register?code=${code}`
      : `/register?code=${code}`;

  return (
    <div className="space-y-2">
      <p className="rounded-xl bg-[#e8f3fb] px-3 py-2 font-mono text-sm text-[#2eb6ea]">
        {code}
      </p>
      <p className="break-all text-xs text-slate-400">{url}</p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(
              `${window.location.origin}/register?code=${code}`,
            );
            toast.success("Link disalin");
          }}
        >
          Copy link
        </Button>
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await regenerateInviteAction();
              toast.success(`Kode baru: ${res.code}`);
            })
          }
        >
          Regenerate
        </Button>
      </div>
    </div>
  );
}
