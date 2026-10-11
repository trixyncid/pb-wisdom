"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { setTrainingSessionActiveAction } from "@/actions/jadwal";
import { deleteEventAction } from "@/actions/events";
import { withToast } from "@/lib/with-toast";
import { cn } from "@/lib/utils";

/** On/off switch for a weekly session (off = hidden from the agenda). */
export function SessionActiveToggle({ id, active, title }: { id: string; active: boolean; title: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={`${title} aktif`}
      disabled={pending}
      onClick={() =>
        start(async () => {
          await withToast(setTrainingSessionActiveAction(id, !active), {
            success: active ? `${title} dijeda` : `${title} aktif lagi`,
          });
        })
      }
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-60",
        active ? "bg-accent" : "bg-navy/15",
      )}
    >
      <span
        className={cn(
          "absolute top-1 size-5 rounded-full bg-white shadow transition-all duration-200",
          active ? "left-6" : "left-1",
        )}
      />
    </button>
  );
}

export function DeleteEventButton({ id, title }: { id: string; title: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-label={`Hapus ${title}`}
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Hapus "${title}"? RSVP dan foto event ini ikut terhapus.`)) return;
        start(async () => {
          await withToast(deleteEventAction(id), { loading: "Menghapus…", success: "Event dihapus" });
        });
      }}
      className="flex size-10 shrink-0 items-center justify-center rounded-full text-navy/40 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
