import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Everything the club stores about the signed-in member, as a JSON download
 * (right of access under UU PDP). Photos are left out: they are images, and
 * the profile photo can be saved from the app directly.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const [user, rsvps, attendance, dues, matches, notifications, photos] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        locale: true,
        createdAt: true,
        accounts: { select: { provider: true } },
        profile: { select: { nickname: true, phone: true, skill: true, status: true, joinDate: true } },
      },
    }),
    prisma.eventRsvp.findMany({
      where: { userId },
      select: { status: true, attended: true, paidAt: true, createdAt: true, event: { select: { title: true, startsAt: true, location: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.sessionAttendance.findMany({
      where: { userId },
      select: { status: true, occurrence: { select: { date: true, session: { select: { title: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.feeDue.findMany({
      where: { userId },
      select: { status: true, submittedAt: true, verifiedAt: true, rejectReason: true, period: { select: { label: true, amount: true, dueDate: true } } },
    }),
    prisma.matchPlayer.findMany({
      where: { userId },
      select: {
        team: true,
        won: true,
        match: {
          select: {
            type: true,
            status: true,
            score: true,
            playedAt: true,
            players: { select: { team: true, user: { select: { profile: { select: { nickname: true } } } } } },
          },
        },
      },
    }),
    prisma.notification.findMany({ where: { userId }, select: { type: true, title: true, body: true, createdAt: true }, orderBy: { createdAt: "desc" } }),
    prisma.eventPhoto.count({ where: { uploaderId: userId } }),
  ]);

  const data = {
    exportedAt: new Date().toISOString(),
    account: user && { ...user, loginWith: user.accounts.map((a) => a.provider), accounts: undefined },
    eventRsvps: rsvps,
    trainingAttendance: attendance,
    feeDues: dues,
    matches: matches.map((m) => ({
      ...m.match,
      myTeam: m.team,
      won: m.won,
      players: m.match.players.map((p) => ({ team: p.team, nickname: p.user.profile?.nickname ?? null })),
    })),
    notifications,
    eventPhotosUploaded: photos,
  };

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="pb-wisdom-data-saya.json"`,
      "Cache-Control": "no-store",
    },
  });
}
