"use client";

import { useState, useTransition } from "react";
import { Plus, UserPlus, UserRound, X } from "lucide-react";
import { addAgendaGuestAction, removeAgendaGuestAction, type AgendaTarget } from "@/actions/guests";
import { withToast } from "@/lib/with-toast";
import { cn } from "@/lib/utils";
import { Sheet } from "@/components/ui/sheet";

export type AgendaGuestRow = { rowId: string; guestId: string; name: string };
export type KnownGuest = { id: string; name: string };

/** Admin: add or remove guests (non-members) on an event or a training date. */
export function AgendaGuests({
  target,
  title,
  guests,
  known,
  className,
}: {
  target: AgendaTarget;
  title: string;
  guests: AgendaGuestRow[];
  /** Guests saved before, offered as one-tap picks. */
  known: KnownGuest[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, start] = useTransition();

  const query = name.trim().replace(/\s+/g, " ");
  const needle = query.toLowerCase();
  const added = new Set(guests.map((g) => g.guestId));
  const suggestions = known.filter((g) => !added.has(g.id) && (!needle || g.name.toLowerCase().includes(needle))).slice(0, 12);

  function add(input: { guestId: string } | { guestName: string }, label: string) {
    start(async () => {
      const res = await withToast(addAgendaGuestAction(target, input), { success: `${label} ditambahkan` });
      if (res.ok) setName("");
    });
  }

  function remove(row: AgendaGuestRow) {
    start(async () => {
      await withToast(removeAgendaGuestAction(target, row.rowId), { success: `${row.name} dihapus` });
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("inline-flex h-9 items-center gap-1.5 rounded-full bg-cream px-3 text-xs font-bold text-navy transition hover:bg-sand", className)}
      >
        <UserPlus className="size-3.5" /> Tamu{guests.length ? ` (${guests.length})` : ""}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Tamu">
        <p className="-mt-2 mb-4 text-sm text-slate-500">
          {title} · tamu bukan member, cukup nama. Tidak masuk ranking.
        </p>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (query.length >= 2) add({ guestName: query }, query);
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            placeholder="Nama tamu"
            aria-label="Nama tamu"
            className="h-11 min-w-0 flex-1 rounded-full bg-cream px-4 text-sm text-navy outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
          <button
            type="submit"
            disabled={pending || query.length < 2}
            className="inline-flex h-11 items-center gap-1 rounded-full bg-accent px-4 text-sm font-bold text-navy disabled:opacity-50"
          >
            <Plus className="size-4" /> Tambah
          </button>
        </form>

        {suggestions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((g) => (
              <button
                key={g.id}
                type="button"
                disabled={pending}
                onClick={() => add({ guestId: g.id }, g.name)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-navy/10 px-3 text-xs font-semibold text-navy transition hover:bg-cream disabled:opacity-50"
              >
                <UserRound className="size-3.5 text-navy/50" /> {g.name}
              </button>
            ))}
          </div>
        )}

        <ul className="mt-5 flex flex-col gap-1.5">
          {guests.length === 0 && <li className="text-sm text-slate-500">Belum ada tamu.</li>}
          {guests.map((g) => (
            <li key={g.rowId} className="flex items-center gap-3 rounded-2xl bg-cream/60 py-1.5 pl-4 pr-1.5">
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-navy">{g.name}</span>
              <button
                type="button"
                disabled={pending}
                onClick={() => remove(g)}
                aria-label={`Hapus ${g.name}`}
                className="flex size-9 items-center justify-center rounded-full text-navy/50 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  );
}
