import type { AdminLogKind } from "@prisma/client";
import { prisma } from "@/lib/db";

// Our client (with its global `omit`) or a transaction on it.
type Db = Pick<typeof prisma, "adminLog" | "user">;

/**
 * Record an admin action for the activity log. Pass the transaction client
 * when there is one, so the entry only exists if the change does.
 */
export function logAdmin(db: Db, actorId: string, kind: AdminLogKind, summary: string, href?: string) {
  return db.adminLog.create({ data: { actorId, kind, summary: summary.slice(0, 300), href }, select: { id: true } });
}

/** A member's display name for log lines ("Budi"), or a fallback. */
export async function memberName(userId: string, db: Db = prisma) {
  const u = await db.user.findUnique({ where: { id: userId }, select: { name: true, profile: { select: { nickname: true } } } });
  return u?.profile?.nickname ?? u?.name ?? "member";
}
