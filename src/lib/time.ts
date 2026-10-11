import { format, type FormatOptions } from "date-fns";
import { TZDate, tz } from "@date-fns/tz";
import { ActionError } from "@/lib/action-error";

// All club times are Medan wall-clock time (WIB). Never rely on the server's
// time zone: Vercel and Docker run in UTC, a dev laptop runs in WIB, and the
// same code must store and show the same instants everywhere.
export const CLUB_TZ = "Asia/Jakarta";
const inClubTz = tz(CLUB_TZ);

/** date-fns `format`, rendered in club time regardless of the server's zone. */
export function formatClub(date: Date, pattern: string, options?: FormatOptions) {
  return format(date, pattern, { ...options, in: inClubTz });
}

/** Parses a `<input type="datetime-local">` value ("2026-10-10T19:00") as club time. */
export function parseClubDateTime(value: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!m) throw new ActionError("Format tanggal/jam tidak valid");
  const [, y, mo, d, h, mi] = m.map(Number);
  return new Date(new TZDate(y, mo - 1, d, h, mi, CLUB_TZ).getTime());
}

/** Parses a `<input type="date">` value as the last moment of that club day. */
export function parseClubDateEndOfDay(value: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) throw new ActionError("Format tanggal tidak valid");
  const [, y, mo, d] = m.map(Number);
  return new Date(new TZDate(y, mo - 1, d, 23, 59, 59, 999, CLUB_TZ).getTime());
}

/**
 * Training occurrences are keyed by calendar day, stored as 12:00 UTC on the
 * club date. That is TZ-independent and matches rows created by the previous
 * code on Vercel (server-local noon in UTC), so no duplicates appear.
 */
function clubDayKey(daysFromToday = 0, hourUtc = 12) {
  const now = new TZDate(Date.now(), CLUB_TZ);
  return new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + daysFromToday, hourUtc),
  );
}

/** Lower bound for "today or later" queries on TrainingOccurrence.date. */
export function startOfClubTodayKey() {
  return clubDayKey(0, 0);
}

/** The next occurrence date for a weekday (0 = Sunday), including today. */
export function nextDateForWeekday(weekday: number) {
  const today = new TZDate(Date.now(), CLUB_TZ).getDay();
  return clubDayKey((weekday - today + 7) % 7);
}
