import { BottomNav } from "@/components/layout/bottom-nav";
import { PageTransition } from "@/components/layout/page-transition";
import { NotificationBell } from "@/components/layout/notification-bell";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const showBell =
    session?.user &&
    (session.user.role === "MEMBER" || session.user.role === "ADMIN");

  const unread = showBell
    ? await prisma.notification.count({
        where: { userId: session.user.id, read: false },
      })
    : 0;

  return (
    <div className="min-h-dvh md:pl-60">
      <BottomNav />
      {showBell && <NotificationBell unread={unread} />}
      <main className="mx-auto max-w-3xl px-4 pb-28 pt-5 md:pb-10 md:pt-8">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
