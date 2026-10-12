"use client";

import * as React from "react";
import { format, isSameDay, parse, startOfDay } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarDays, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Values are calendar days as "yyyy-MM-dd" strings (what the server actions
// take), so no time zone ever shifts the chosen day.
const toDate = (v: string | undefined) => (v ? parse(v, "yyyy-MM-dd", new Date()) : undefined);
const toValue = (d: Date) => format(d, "yyyy-MM-dd");
const label = (d: Date, withYear = true) => format(d, withYear ? "EEE, d MMM yyyy" : "EEE, d MMM", { locale: localeId });

const triggerClass =
  "flex h-11 w-full items-center gap-2 rounded-2xl border border-navy/10 bg-white px-4 text-left text-sm text-navy shadow-sm transition hover:border-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent data-[state=open]:border-accent data-[state=open]:ring-2 data-[state=open]:ring-accent/40 disabled:opacity-50";

/**
 * Keeps native form validation (`required`) working for a picker: an
 * invisible input carrying the value that the browser can point at.
 */
function RequiredMirror({ value, required }: { value: string; required?: boolean }) {
  if (!required) return null;
  return <input tabIndex={-1} aria-hidden required value={value} onChange={() => {}} className="pointer-events-none absolute bottom-0 left-4 h-px w-px opacity-0" />;
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Pilih tanggal",
  required,
  disabled,
  fromDate,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  /** Earliest selectable day, e.g. today for things in the future. */
  fromDate?: Date;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = toDate(value);

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button id={id} type="button" disabled={disabled} className={triggerClass}>
            <CalendarDays className="size-4 shrink-0 text-accent-ink" />
            <span className={cn("min-w-0 flex-1 truncate", !selected && "text-slate-400")}>{selected ? label(selected) : placeholder}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent>
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected ?? fromDate}
            disabled={fromDate ? { before: startOfDay(fromDate) } : undefined}
            onSelect={(d) => {
              if (!d) return;
              onChange(toValue(d));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      <RequiredMirror value={value} required={required} />
    </div>
  );
}

export type DayRange = { from: string; to?: string };

/** One day or a span of days (a multi-day tournament). */
export function DateRangePicker({
  id,
  value,
  onChange,
  placeholder = "Pilih tanggal",
  required,
  disabled,
  fromDate,
}: {
  id?: string;
  value: DayRange | null;
  onChange: (value: DayRange | null) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  fromDate?: Date;
}) {
  const [open, setOpen] = React.useState(false);
  const from = toDate(value?.from);
  const to = toDate(value?.to);
  const multi = from && to && !isSameDay(from, to);
  const text = from ? (multi ? `${label(from, from.getFullYear() !== to!.getFullYear())} – ${label(to!)}` : label(from)) : placeholder;

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button id={id} type="button" disabled={disabled} className={triggerClass}>
            <CalendarDays className="size-4 shrink-0 text-accent-ink" />
            <span className={cn("min-w-0 flex-1 truncate", !from && "text-slate-400")}>{text}</span>
            {multi && <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-bold text-accent-ink">{Math.round((to!.getTime() - from.getTime()) / 86_400_000) + 1} hari</span>}
          </button>
        </PopoverTrigger>
        {/* Calendar width (7 × 40 px + padding); the hint wraps under it. */}
        <PopoverContent className="flex w-[304px] max-w-[calc(100vw-24px)] flex-col gap-3">
          <Calendar
            mode="range"
            selected={from ? ({ from, to } as DateRange) : undefined}
            defaultMonth={from ?? fromDate}
            disabled={fromDate ? { before: startOfDay(fromDate) } : undefined}
            onSelect={(r) => {
              if (!r?.from) return onChange(null);
              const next = { from: toValue(r.from), to: r.to ? toValue(r.to) : undefined };
              onChange(next);
              // A finished multi-day range closes; one day needs "Selesai".
              if (r.to && !isSameDay(r.from, r.to)) setOpen(false);
            }}
          />
          <div className="flex items-center justify-between gap-2 border-t border-navy/6 pt-3">
            <p className="text-xs text-slate-500">Satu hari: klik sekali. Beberapa hari: klik awal lalu akhir.</p>
            <div className="flex shrink-0 gap-1.5">
              {from && (
                <button type="button" onClick={() => onChange(null)} aria-label="Hapus tanggal" className="flex size-9 items-center justify-center rounded-full bg-cream text-navy/60 hover:text-navy">
                  <X className="size-4" />
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)} className="h-9 rounded-full bg-navy px-4 text-xs font-bold text-white">
                Selesai
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <RequiredMirror value={value?.from ?? ""} required={required} />
    </div>
  );
}
