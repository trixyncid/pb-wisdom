"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Share2 } from "lucide-react";
import { setEventRsvpAction } from "@/actions/events";
import { Button } from "@/components/ui/button";
import type { RsvpStatus } from "@prisma/client";

export function EventActions({
  eventId,
  current,
  shareUrl,
}: {
  eventId: string;
  current: RsvpStatus | null;
  shareUrl: string;
}) {
  const [pending, start] = useTransition();

  function set(status: RsvpStatus) {
    start(async () => {
      const res = await setEventRsvpAction(eventId, status);
      toast.success(
        res.status === "WAITLIST" ? "Masuk waitlist" : "RSVP tersimpan",
      );
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant={current === "GOING" || current === "WAITLIST" ? "default" : "secondary"}
        disabled={pending}
        onClick={() => set("GOING")}
      >
        Going
      </Button>
      <Button
        size="sm"
        variant={current === "NOT_GOING" ? "default" : "secondary"}
        disabled={pending}
        onClick={() => set("NOT_GOING")}
      >
        Skip
      </Button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`Join event PB Wisdom: ${shareUrl}`)}`}
        target="_blank"
        rel="noreferrer"
        className="ml-auto inline-flex h-9 items-center gap-1 rounded-lg border border-[#0b2a4a]/10 px-3 text-xs text-[#2eb6ea]"
      >
        <Share2 className="h-3.5 w-3.5" /> Share
      </a>
    </div>
  );
}
