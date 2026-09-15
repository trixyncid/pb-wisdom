import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { DirectoryBrowser } from "@/components/directory/directory-browser";

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;

  const params = await searchParams;
  const members = await prisma.user.findMany({
    where: {
      role: { in: ["MEMBER", "ADMIN"] },
      profile: { isNot: null },
    },
    include: { profile: true },
    orderBy: { profile: { nickname: "asc" } },
  });

  return (
    <AppShell>
      <div className="mb-5 flex items-center gap-3 pr-14">
        <Link
          href="/profile"
          className="rounded-full bg-white p-2 text-[#0b2a4a] shadow-sm"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2eb6ea]">
            Members
          </p>
          <h1 className="flex items-center gap-2 text-2xl font-black text-[#0b2a4a]">
            <Users className="h-6 w-6 text-[#2eb6ea]" />
            Directory
          </h1>
        </div>
      </div>

      <Suspense fallback={<p className="text-sm text-slate-500">Memuat…</p>}>
        <DirectoryBrowser
          initialQ={params.q ?? ""}
          initialPage={Number(params.page || "1") || 1}
          members={members.map((m) => ({
            id: m.id,
            role: m.role,
            email: m.email,
            name: m.name,
            image: m.image,
            nickname: m.profile?.nickname ?? m.name ?? "Player",
            phone: m.profile?.phone ?? null,
            imageUrl: m.profile?.imageUrl ?? null,
          }))}
        />
      </Suspense>
    </AppShell>
  );
}
