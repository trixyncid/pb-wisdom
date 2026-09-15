"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { setAttendanceAction } from "@/actions/jadwal";
import { Button } from "@/components/ui/button";
import type { AttendanceStatus } from "@prisma/client";

export function AttendanceButtons({
  occurrenceId,
  current,
}: {
  occurrenceId: string;
  current: AttendanceStatus | null;
}) {
  const [pending, start] = useTransition();

  function set(status: AttendanceStatus) {
    start(async () => {
      await setAttendanceAction(occurrenceId, status);
      toast.success("RSVP tersimpan");
    });
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant={current === "GOING" ? "default" : "secondary"}
        disabled={pending}
        onClick={() => set("GOING")}
      >
        Hadir
      </Button>
      <Button
        size="sm"
        variant={current === "MAYBE" ? "default" : "secondary"}
        disabled={pending}
        onClick={() => set("MAYBE")}
      >
        Mungkin
      </Button>
      <Button
        size="sm"
        variant={current === "ABSENT" ? "default" : "secondary"}
        disabled={pending}
        onClick={() => set("ABSENT")}
      >
        Tidak
      </Button>
    </div>
  );
}
