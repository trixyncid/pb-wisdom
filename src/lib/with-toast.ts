"use client";

import { toast } from "sonner";
import type { ActionResult } from "@/lib/action-result";

type Success<T> = Extract<T, { ok: true }>;

/**
 * Runs a server action with a toast that tracks it: "in progress" right away,
 * then the same toast turns into success or error. Network failures (no
 * response at all) become an error toast instead of crashing the page.
 */
export async function withToast<T extends ActionResult<object>>(
  action: Promise<T>,
  messages: {
    loading?: string;
    success: string | ((result: Success<T>) => string);
  },
): Promise<T> {
  const id = toast.loading(messages.loading ?? "Menyimpan…");
  try {
    const result = await action;
    if (result.ok) {
      const text =
        typeof messages.success === "function"
          ? messages.success(result as Success<T>)
          : messages.success;
      toast.success(text, { id });
    } else {
      toast.error(result.error, { id });
    }
    return result;
  } catch {
    toast.error("Koneksi bermasalah, coba lagi", { id });
    return { ok: false, error: "Koneksi bermasalah" } as T;
  }
}
