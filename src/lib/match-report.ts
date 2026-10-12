/** How long after a match its players may still report a wrong score. */
export const REPORT_WINDOW_DAYS = 7;

/** Can `userId` report this verified match as wrong? (player, once, in time) */
export function canReport(
  m: { status: string; disputeReason: string | null; playedAt: Date; players: { userId?: string; user?: { id: string } }[] },
  userId: string,
) {
  return (
    m.status === "CONFIRMED" &&
    !m.disputeReason &&
    m.playedAt.getTime() >= Date.now() - REPORT_WINDOW_DAYS * 86_400_000 &&
    m.players.some((p) => (p.userId ?? p.user?.id) === userId)
  );
}
