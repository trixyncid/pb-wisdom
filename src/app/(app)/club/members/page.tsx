import { id as localeId } from "date-fns/locale";
import { requireAdminPage } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { avatarUrl } from "@/lib/avatar";
import { formatClub } from "@/lib/time";
import { AdminHeader } from "@/components/club/admin-header";
import { MemberManager } from "@/components/club/member-manager";

export default async function ClubMembersPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await requireAdminPage();
  const { tab } = await searchParams;
  const users = await prisma.user.findMany({
    // Deleted accounts are anonymised rows; nothing to manage there.
    where: { NOT: { email: { endsWith: "@deleted.invalid" } } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      profile: { select: { nickname: true, phone: true, status: true, skill: true, joinDate: true, updatedAt: true } },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return (
    <div className="flex flex-col gap-4 pt-2">
      <AdminHeader title="Members" desc="Setujui pendaftar, atur admin dan status member." />
      <MemberManager
        currentUserId={session.user.id}
        initialTab={tab}
        members={users
          .map((u) => ({
            id: u.id,
            nickname: u.profile?.nickname ?? u.name ?? "Player",
            email: u.email,
            phone: u.profile?.phone ?? null,
            role: u.role,
            status: u.profile?.status ?? "ACTIVE",
            skill: u.profile?.skill ?? "BEGINNER",
            avatar: avatarUrl(u.id, u.profile?.updatedAt),
            joined: formatClub(u.profile?.joinDate ?? u.createdAt, "d MMM yyyy", { locale: localeId }),
          }))
          .sort((a, b) => a.nickname.localeCompare(b.nickname, "id"))}
      />
    </div>
  );
}
