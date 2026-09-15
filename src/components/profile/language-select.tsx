"use client";

const LOCALES = [
  { value: "id", flag: "🇮🇩", label: "Bahasa Indonesia" },
  { value: "en", flag: "🇬🇧", label: "English" },
] as const;

export function LanguageSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (locale: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {LOCALES.map((loc) => {
        const active = value === loc.value;
        return (
          <button
            key={loc.value}
            type="button"
            onClick={() => onChange(loc.value)}
            className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-left text-sm font-bold transition ${
              active
                ? "border-[#2eb6ea] bg-[#e8f3fb] text-[#0b2a4a] ring-2 ring-[#2eb6ea]/30"
                : "border-[#0b2a4a]/10 bg-white text-slate-500"
            }`}
          >
            <span className="text-xl leading-none">{loc.flag}</span>
            <span>{loc.label}</span>
          </button>
        );
      })}
    </div>
  );
}
