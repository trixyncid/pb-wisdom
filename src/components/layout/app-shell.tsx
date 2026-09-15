import { BottomNav } from "@/components/layout/bottom-nav";
import { PageTransition } from "@/components/layout/page-transition";
import { TopBar } from "@/components/layout/top-bar";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
        }),
      ])
    : [0, null];

  const nick =
    profile?.nickname ?? session?.user?.name ?? session?.user?.email ?? "Member";

  return (
    <div className="min-h-dvh md:pl-60">
      <BottomNav />
      {isMember && (
        <TopBar
          nick={nick}
          imageUrl={profile?.imageUrl ?? session?.user?.image ?? null}
          isAdmin={session?.user?.role === "ADMIN"}
          unread={unread}
        />
      )}
      <main className="mx-auto max-w-3xl px-4 pb-28 pt-4 md:pb-10 md:pt-6">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
