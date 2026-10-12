import { id as localeId } from "date-fns/locale";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProfileShortcuts } from "@/components/profile/profile-shortcuts";
import { AccountSecurity } from "@/components/account/account-security";
import { avatarUrl } from "@/lib/avatar";
import { getLeaderboard, getMemberWinrate } from "@/lib/stats";
import { formatClub } from "@/lib/time";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) return null;
  const me = session.user.id;

  const [user, winrate, ranking] = await Promise.all([
    prisma.user.findUnique({
      where: { id: me },
      select: { passwordHash: true, createdAt: true, profile: { select: { nickname: true, phone: true, skill: true, joinDate: true, updatedAt: true } } },
    }),
    getMemberWinrate(me),
    getLeaderboard("ALL", 200),
  ]);
  const profile = user?.profile;
  const rank = ranking.findIndex((r) => r.userId === me);

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="rise" style={{ "--i": 0 } as React.CSSProperties}>
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-accent-ink">Akun</p>
        <h1 className="font-display mt-1 text-[2.1rem] font-extrabold leading-[1.05] text-navy">Profil</h1>
      </div>

      <ProfileForm
        initial={{
          userId: me,
          nickname: profile?.nickname ?? session.user.name ?? "",
          phone: profile?.phone ?? "+62",
          imageUrl: avatarUrl(me, profile?.updatedAt),
          email: session.user.email,
          role: session.user.role,
          skill: profile?.skill ?? "BEGINNER",
          memberSince: formatClub(profile?.joinDate ?? user?.createdAt ?? new Date(), "MMM yyyy", { locale: localeId }),
        }}
        stats={{ winrate: winrate.ALL.winrate, wins: winrate.ALL.wins, losses: winrate.ALL.losses, rank: rank >= 0 ? rank + 1 : null }}
      />

      <AccountSecurity hasPassword={Boolean(user?.passwordHash)} />

      <p className="mt-2 px-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Lainnya</p>
      <ProfileShortcuts />
    </div>
  );
}
