"use client";

import * as React from "react";
import { DayPicker, type DayButton } from "react-day-picker";
import { id as localeId } from "react-day-picker/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// shadcn/ui Calendar (react-day-picker v9), restyled: navy selection, orange
// range band and today ring, Indonesian month and day names, week from Monday.
export function Calendar({ className, classNames, showOutsideDays = true, ...props }: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      locale={localeId}
      weekStartsOn={1}
      showOutsideDays={showOutsideDays}
      className={cn("w-fit select-none", className)}
      classNames={{
        months: "relative flex flex-col gap-4 sm:flex-row",
        month: "flex w-full flex-col gap-3",
        nav: "absolute inset-x-0 top-0 z-10 flex items-center justify-between",
        button_previous:
          "flex size-9 items-center justify-center rounded-full bg-cream text-navy transition hover:bg-sand disabled:pointer-events-none disabled:opacity-30",
        button_next:
          "flex size-9 items-center justify-center rounded-full bg-cream text-navy transition hover:bg-sand disabled:pointer-events-none disabled:opacity-30",
        month_caption: "flex h-9 items-center justify-center px-10",
        caption_label: "font-display text-base font-bold capitalize text-navy",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "flex h-8 w-10 items-center justify-center text-[11px] font-bold uppercase tracking-wide text-slate-400",
        week: "mt-1 flex w-full",
        day: "relative size-10 p-0 text-center",
        // The range band sits on the cell; the round button sits on top.
        range_start: "rounded-l-full bg-accent-soft",
        range_middle: "bg-accent-soft",
        range_end: "rounded-r-full bg-accent-soft",
        outside: "text-slate-300",
        disabled: "opacity-30",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: c }) =>
          orientation === "left" ? <ChevronLeft className={cn("size-4", c)} /> : <ChevronRight className={cn("size-4", c)} />,
        DayButton: CalendarDayButton,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({ className, day, modifiers, ...props }: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);
  const edge = modifiers.range_start || modifiers.range_end;
  const single = modifiers.selected && !edge && !modifiers.range_middle;

  return (
    <button
      ref={ref}
      data-day={day.date.toLocaleDateString("id-ID")}
      className={cn(
        "flex size-10 items-center justify-center rounded-full text-sm font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        modifiers.outside ? "text-slate-300" : "text-navy",
        !modifiers.disabled && "hover:bg-sand",
        modifiers.today && !single && !edge && "ring-2 ring-inset ring-accent",
        modifiers.range_middle && "rounded-full text-accent-ink hover:bg-accent/30",
        (single || edge) && "bg-navy text-white shadow-[0_6px_14px_rgba(14,44,60,0.25)] hover:bg-navy",
        className,
      )}
      {...props}
    />
  );
}
