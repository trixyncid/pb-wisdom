"use client";

import { useTransition } from "react";
import { Share2 } from "lucide-react";
import type { RsvpStatus } from "@prisma/client";
import { setEventRsvpAction } from "@/actions/events";
import { withToast } from "@/lib/with-toast";
import { RsvpSegment } from "@/components/jadwal/rsvp-segment";

export function EventActions({
  eventId,
  current,
  shareUrl,
}: {
  eventId: string;
  current: RsvpStatus | null;
  /** Shown as a share button when given (the agenda card has its own). */
  shareUrl?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <RsvpSegment<RsvpStatus>
          value={current === "WAITLIST" ? "GOING" : current}
          disabled={pending}
          onChange={(status) =>
            start(async () => {
              await withToast(setEventRsvpAction(eventId, status), {
                success: (res) =>
                  res.status === "WAITLIST" ? "Penuh, kamu masuk waitlist" : res.status === "GOING" ? "Kamu ikut event ini" : "Ditandai tidak ikut",
              });
            })
          }
          options={[
            {
              value: "GOING",
              label: current === "WAITLIST" ? "Waitlist" : "Ikut",
              activeClass: "bg-accent text-navy shadow-[0_6px_14px_rgba(238,159,72,0.35)]",
            },
            { value: "NOT_GOING", label: "Tidak" },
          ]}
        />
      </div>
      {shareUrl && (
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`Join event PB Wisdom: ${shareUrl}`)}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Bagikan ke WhatsApp"
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-cream text-navy transition hover:bg-sand"
        >
          <Share2 className="size-4" />
        </a>
      )}
    </div>
  );
}
