import { AsYouType, type CountryCode } from "libphonenumber-js";

// Shared by the phone field (client) and the profile action (server), so the
// same number is always stored as +<dial><national digits>.

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

// Longest dial code first so "+61" is not mistaken for "+6…" prefixes of others.
export const BY_DIAL_LENGTH = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);

/**
 * National digits without the trunk prefix: after a country code the leading
 * 0 of local notation (0812… in Indonesia) must be dropped, or the number is
 * stored as +620812… which is not dialable.
 */
export function nationalDigits(raw: string) {
  return raw.replace(/\D/g, "").replace(/^0+/, "");
}

export function parseStoredPhone(phone: string) {
  const trimmed = phone.trim();
  if (!trimmed) return { country: "ID" as CountryCode, national: "" };
  const match = BY_DIAL_LENGTH.find((c) => trimmed.startsWith(c.dial));
  if (match) {
    return { country: match.code, national: nationalDigits(trimmed.slice(match.dial.length)) };
  }
  return { country: "ID" as CountryCode, national: nationalDigits(trimmed) };
}

/** "+620812…" or "0812…" -> "+62812…" (dial code + national digits). */
export function normalizePhone(phone: string) {
  const { country, national } = parseStoredPhone(phone);
  const dial = PHONE_COUNTRIES.find((c) => c.code === country)?.dial ?? "+62";
  return national ? `${dial}${national}` : "";
}

/** "+62819…" -> "+62 819-3968-1818" for display; raw input if unparseable. */
export function formatPhone(phone: string | null | undefined) {
  if (!phone) return "";
  const normalized = normalizePhone(phone);
  return normalized ? new AsYouType().input(normalized) : phone;
}
