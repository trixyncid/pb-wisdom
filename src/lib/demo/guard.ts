import { isDemoMode } from "@/lib/demo/mode";

/** Return early from server actions when DEMO_MODE is on. */
export function demoActionResult<T extends Record<string, unknown> = { ok: true }>(
  extra?: T,
): (T & { ok: true; demo: true; message: string }) | null {
  if (!isDemoMode()) return null;
  return {
    ok: true as const,
    demo: true as const,
    message: "Demo mode — perubahan tidak disimpan",
    ...(extra as T),
  };
}
