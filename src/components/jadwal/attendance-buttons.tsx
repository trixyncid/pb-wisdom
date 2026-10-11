"use client";

import { useTransition } from "react";
import type { AttendanceStatus } from "@prisma/client";
import { setAttendanceAction } from "@/actions/jadwal";
import { withToast } from "@/lib/with-toast";
import { RsvpSegment } from "@/components/jadwal/rsvp-segment";

export function AttendanceButtons({
  occurrenceId,
  current,
}: {
  occurrenceId: string;
  current: AttendanceStatus | null;
}) {
  const [pending, start] = useTransition();
  return (
    <RsvpSegment<AttendanceStatus>
      value={current === "ATTENDED" ? "GOING" : current}
      disabled={pending}
      onChange={(status) =>
        start(async () => {
          await withToast(setAttendanceAction(occurrenceId, status), {
            success: status === "GOING" ? "Kamu ikut latihan ini" : status === "MAYBE" ? "Ditandai mungkin" : "Ditandai tidak ikut",
          });
        })
      }
      options={[
        { value: "GOING", label: "Hadir", activeClass: "bg-accent text-navy shadow-[0_6px_14px_rgba(238,159,72,0.35)]" },
        { value: "MAYBE", label: "Mungkin" },
        { value: "ABSENT", label: "Tidak" },
      ]}
    />
  );
}
