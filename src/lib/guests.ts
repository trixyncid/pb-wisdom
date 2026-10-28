import type { Prisma } from "@prisma/client";
import { ActionError } from "@/lib/action-result";

type Tx = Prisma.TransactionClient;

export const GUEST_NAME_MAX = 60;

export async function existingGuest(tx: Tx, id: string) {
  const guest = await tx.guest.findUnique({ where: { id }, select: { id: true } });
  if (!guest) throw new ActionError("Tamu tidak ditemukan");
  return guest.id;
}

/** Reuse a saved guest with the same name (any case), so regulars stay one entry. */
export async function guestByName(tx: Tx, rawName: string, createdById: string) {
  const name = rawName.trim().replace(/\s+/g, " ").slice(0, GUEST_NAME_MAX);
  if (name.length < 2) throw new ActionError("Nama tamu minimal 2 huruf");
  const found = await tx.guest.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (found) return found.id;
  return (await tx.guest.create({ data: { name, createdById }, select: { id: true } })).id;
}
