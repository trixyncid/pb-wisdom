import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DirectoryBrowser } from "@/components/directory/directory-browser";
import { avatarUrl } from "@/lib/avatar";

export default async function DirectoryPage() {
  const session = await auth();
  if (!session?.user) return null;

  const members = await prisma.user.findMany({
    where: {
      role: { in: ["MEMBER", "ADMIN"] },
      profile: { status: "ACTIVE" },
    },
    select: {
      id: true,
      role: true,
      name: true,
      profile: { select: { nickname: true, phone: true, skill: true, updatedAt: true } },
    },
    orderBy: { profile: { nickname: "asc" } },
  });

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="rise" style={{ "--i": 0 } as React.CSSProperties}>
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-accent-ink">Anggota klub</p>
        <h1 className="font-display mt-1 text-[2.1rem] font-extrabold leading-[1.05] text-navy">Directory</h1>
      </div>
      <DirectoryBrowser
        currentUserId={session.user.id}
        members={members.map((m) => ({
          id: m.id,
          role: m.role,
          nickname: m.profile?.nickname ?? m.name ?? "Player",
          phone: m.profile?.phone ?? null,
          skill: m.profile?.skill ?? "BEGINNER",
          imageUrl: avatarUrl(m.id, m.profile?.updatedAt),
        }))}
      />
    </div>
  );
}
