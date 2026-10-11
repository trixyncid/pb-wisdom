"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { withToast } from "@/lib/with-toast";
import { regenerateInviteAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function InvitePanel({ code }: { code: string | null }) {
  const [pending, start] = useTransition();
  // A relative path renders identically on server and client; the full URL is
  // built only when copying (reading window during render broke hydration).
  const path = code ? `/register?code=${code}` : null;

  return (
    <div className="space-y-2">
      <p className="rounded-xl bg-sand px-3 py-2 font-mono text-sm text-accent-ink">
        {code ?? "Belum ada kode aktif"}
      </p>
      {path && <p className="break-all text-xs text-slate-400">{path}</p>}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          type="button"
          disabled={!path}
          onClick={async () => {
            if (!path) return;
            await navigator.clipboard.writeText(`${window.location.origin}${path}`);
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
              const res = await withToast(regenerateInviteAction(), { success: (res) => `Kode baru: ${res.code}` });
              if (!res.ok) return;
            })
          }
        >
          Regenerate
        </Button>
      </div>
    </div>
  );
}
