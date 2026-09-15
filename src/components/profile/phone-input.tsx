"use client";

import { AsYouType, type CountryCode } from "libphonenumber-js";
import { cn } from "@/lib/utils";

export const PHONE_COUNTRIES: {
  code: CountryCode;
  dial: string;
  flag: string;
  label: string;
}[] = [
  { code: "ID", dial: "+62", flag: "🇮🇩", label: "Indonesia" },
  { code: "MY", dial: "+60", flag: "🇲🇾", label: "Malaysia" },
  { code: "SG", dial: "+65", flag: "🇸🇬", label: "Singapore" },
  { code: "US", dial: "+1", flag: "🇺🇸", label: "United States" },
  { code: "AU", dial: "+61", flag: "🇦🇺", label: "Australia" },
  { code: "GB", dial: "+44", flag: "🇬🇧", label: "United Kingdom" },
];

export function parseStoredPhone(phone: string) {
  const trimmed = phone.trim();
  if (!trimmed) {
    return { country: "ID" as CountryCode, national: "" };
  }

  const match = PHONE_COUNTRIES.find((c) => trimmed.startsWith(c.dial));
  if (match) {
    return {
      country: match.code,
      national: trimmed.slice(match.dial.length).replace(/\D/g, ""),
    };
  }

  if (trimmed.startsWith("0")) {
    return { country: "ID" as CountryCode, national: trimmed.replace(/\D/g, "").slice(1) };
  }

  return { country: "ID" as CountryCode, national: trimmed.replace(/\D/g, "") };
}

export function PhoneInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (e164ish: string) => void;
}) {
  const parsed = parseStoredPhone(value);
  const country =
    PHONE_COUNTRIES.find((c) => c.code === parsed.country) ?? PHONE_COUNTRIES[0];

  const formatter = new AsYouType(country.code);
  const formatted = formatter.input(parsed.national);

  function setCountry(code: CountryCode) {
    const next = PHONE_COUNTRIES.find((c) => c.code === code) ?? PHONE_COUNTRIES[0];
    const digits = parsed.national.replace(/\D/g, "");
    onChange(digits ? `${next.dial}${digits}` : next.dial);
  }

  function setNational(raw: string) {
    const digits = raw.replace(/\D/g, "");
    onChange(digits ? `${country.dial}${digits}` : country.dial);
  }

  return (
    <div className="flex gap-2">
      <select
        className={cn(
          "h-11 shrink-0 rounded-2xl border border-[#0b2a4a]/10 bg-white px-2 text-sm font-semibold text-[#0b2a4a] shadow-sm",
        )}
        value={country.code}
        onChange={(e) => setCountry(e.target.value as CountryCode)}
        aria-label="Country code"
      >
        {PHONE_COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.dial}
          </option>
        ))}
      </select>
      <input
        className="flex h-11 w-full rounded-2xl border border-[#0b2a4a]/10 bg-white px-4 text-sm text-[#0b2a4a] placeholder:text-slate-400 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2eb6ea]"
        inputMode="tel"
        placeholder="812 3456 7890"
        value={formatted}
        onChange={(e) => setNational(e.target.value)}
      />
    </div>
  );
}
