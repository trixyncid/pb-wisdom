import { BottomNav } from "@/components/layout/bottom-nav";
import { TopBar } from "@/components/layout/top-bar";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { avatarUrl } from "@/lib/avatar";

export async function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isMember =
    session?.user?.role === "MEMBER" || session?.user?.role === "ADMIN";

  const [unread, profile] = isMember
    ? await Promise.all([
        prisma.notification.count({
          where: { userId: session.user.id, read: false },
        }),
        prisma.memberProfile.findUnique({
          where: { userId: session.user.id },
          select: { nickname: true, updatedAt: true },
        }),
      ])
    : [0, null];

  const nick =
    profile?.nickname ?? session?.user?.name ?? session?.user?.email ?? "Member";

  return (
    <div className="min-h-dvh md:pl-64">
      <BottomNav role={session?.user?.role ?? null} />
      <TopBar
        loggedIn={Boolean(session?.user)}
        member={
          isMember
            ? {
                nick,
                imageUrl: avatarUrl(session.user.id, profile?.updatedAt),
                isAdmin: session.user.role === "ADMIN",
                unread,
              }
            : null
        }
      />
      <main className="mx-auto max-w-3xl px-4 pb-36 pt-3 md:pb-10 md:pt-4">
        {children}
      </main>
    </div>
  );
}
