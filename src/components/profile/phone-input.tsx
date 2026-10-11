"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { Check, ChevronDown } from "lucide-react";
import { AsYouType, type CountryCode } from "libphonenumber-js";
import { BY_DIAL_LENGTH, PHONE_COUNTRIES, nationalDigits, parseStoredPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";

export function PhoneInput({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (e164ish: string) => void;
  id?: string;
}) {
  const parsed = parseStoredPhone(value);
  const country = PHONE_COUNTRIES.find((c) => c.code === parsed.country) ?? PHONE_COUNTRIES[0];
  // Group digits via the international form ("+62 819 3968 1818") and show the
  // part after the dial code; national formatting expects the trunk 0.
  const formatted = parsed.national
    ? new AsYouType().input(`${country.dial}${parsed.national}`).replace(country.dial, "").trim()
    : "";

  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<React.CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  // The list is portalled to <body> (cards clip overflow), fixed to the
  // field's width, and opens upward when there is no room below.
  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const r = rootRef.current?.getBoundingClientRect();
      if (!r) return;
      const below = window.innerHeight - r.bottom - 16;
      const above = r.top - 16;
      const up = below < 220 && above > below;
      setPlace({
        position: "fixed",
        left: r.left,
        width: r.width,
        maxHeight: Math.min(288, (up ? above : below) - 8),
        ...(up ? { bottom: window.innerHeight - r.top + 8 } : { top: r.bottom + 8 }),
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  // Close on outside tap / Escape; focus the selected option when opening.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!rootRef.current?.contains(t) && !listRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    requestAnimationFrame(() =>
      listRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus(),
    );
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function emit(dial: string, digits: string) {
    onChange(digits ? `${dial}${digits}` : dial);
  }

  function setCountry(code: CountryCode) {
    const next = PHONE_COUNTRIES.find((c) => c.code === code) ?? PHONE_COUNTRIES[0];
    emit(next.dial, parsed.national);
    setOpen(false);
  }

  function setNational(raw: string) {
    // A pasted international number ("+62 812…") switches the country.
    const compact = raw.replace(/[\s().-]/g, "");
    if (compact.startsWith("+")) {
      const match = BY_DIAL_LENGTH.find((c) => compact.startsWith(c.dial));
      if (match) return emit(match.dial, nationalDigits(compact.slice(match.dial.length)));
    }
    emit(country.dial, nationalDigits(raw));
  }

  function onListKey(e: React.KeyboardEvent<HTMLUListElement>) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = [...(listRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? [])];
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = e.key === "ArrowDown" ? Math.min(items.length - 1, i + 1) : Math.max(0, i - 1);
    items[next]?.focus();
  }

  return (
    <div ref={rootRef} className="relative flex gap-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`Kode negara: ${country.label} ${country.dial}`}
        className="flex h-11 shrink-0 items-center gap-1.5 rounded-2xl border border-navy/10 bg-white pl-3 pr-2 text-sm font-semibold text-navy shadow-sm transition hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span className="text-base leading-none">{country.flag}</span>
        {country.dial}
        <ChevronDown className={cn("size-4 text-navy/50 transition-transform", open && "rotate-180")} />
      </button>
      <input
        id={id}
        className="h-11 min-w-0 flex-1 rounded-2xl border border-navy/10 bg-white px-4 text-sm text-navy shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="812 3456 7890"
        value={formatted}
        onChange={(e) => setNational(e.target.value)}
      />

      {/* Rendered only while open (always closed on the server), so server and
          client output match. */}
      {open &&
        createPortal(
          <motion.ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label="Pilih kode negara"
            onKeyDown={onListKey}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.16 }}
            style={place}
            className="z-[90] overflow-y-auto rounded-2xl border border-navy/10 bg-white p-1.5 shadow-[0_18px_40px_rgba(14,44,60,0.16)]"
          >
            {PHONE_COUNTRIES.map((c) => {
              const selected = c.code === country.code;
              return (
                <li key={c.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => setCountry(c.code)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-navy outline-none transition hover:bg-cream focus-visible:bg-cream",
                      selected && "bg-accent-soft font-semibold",
                    )}
                  >
                    <span className="text-lg leading-none">{c.flag}</span>
                    <span className="min-w-0 flex-1 truncate">{c.label}</span>
                    <span className="tabular-nums text-navy/60">{c.dial}</span>
                    <Check className={cn("size-4 text-accent-ink", !selected && "invisible")} />
                  </button>
                </li>
              );
            })}
          </motion.ul>,
          document.body,
        )}
    </div>
  );
}
