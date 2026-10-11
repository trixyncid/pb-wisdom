import { unstable_rethrow } from "next/navigation";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { ActionError } from "@/lib/action-error";

export { ActionError };

export type ActionResult<T extends object = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

/**
 * Runs a server action body and turns failures into `{ ok: false, error }`.
 * A thrown error would otherwise reach the client as a generic message (in
 * production) and crash the page through the nearest error boundary.
 */
export async function runAction<T extends object>(
  fn: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    return { ...(await fn()), ok: true };
  } catch (err) {
    // Redirects and notFound() thrown inside an action must keep propagating.
    unstable_rethrow(err);
    return { ok: false, error: toUserMessage(err) };
  }
}

function toUserMessage(err: unknown) {
  if (err instanceof ActionError) return err.message;
  if (err instanceof ZodError) {
    return err.issues[0]?.message ?? "Data tidak valid";
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") return "Data ini sudah ada";
    if (err.code === "P2025") return "Data tidak ditemukan";
    if (err.code === "P2003") return "Data terkait tidak valid";
  }
  console.error("[action]", err);
  return "Terjadi kesalahan, coba lagi";
}
