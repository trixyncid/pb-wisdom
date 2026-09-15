import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MemberAdminActions } from "@/components/club/member-admin-actions";

export default async function ClubMembersPage() {
  const users = await prisma.user.findMany({
    where: { role: { in: ["PENDING", "MEMBER", "ADMIN", "REJECTED"] } },
    include: { profile: true },
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
  });

  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#0b2a4a]">Members</h1>
        <p className="text-sm text-slate-400">Approve, deactivate, directory</p>
      </div>
      <div className="space-y-2">
        {users.map((u) => (
          <Card key={u.id} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar>
                <AvatarImage src={u.profile?.imageUrl ?? u.image ?? undefined} />
                <AvatarFallback>
                  {(u.profile?.nickname ?? "?").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium text-[#0b2a4a]">
                  {u.profile?.nickname ?? u.name}
                </p>
                <p className="truncate text-xs text-slate-400">{u.email}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge>{u.role}</Badge>
                  {u.profile && (
                    <Badge className="bg-white/10">{u.profile.status}</Badge>
                  )}
                </div>
              </div>
            </div>
            <MemberAdminActions
              userId={u.id}
              role={u.role}
              status={u.profile?.status ?? "ACTIVE"}
            />
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
