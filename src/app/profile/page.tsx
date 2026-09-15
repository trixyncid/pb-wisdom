import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProfileShortcuts } from "@/components/profile/profile-shortcuts";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) return null;

  const profile = await prisma.memberProfile.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <AppShell>
      <div className="mb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#2eb6ea]">
          Akun
        </p>
        <h1 className="text-2xl font-black text-[#0b2a4a]">Profil</h1>
      </div>

      <div className="mb-4 overflow-hidden rounded-[32px] border border-white/80 bg-gradient-to-b from-[#dff3fc] via-white to-white p-5 shadow-[0_16px_40px_rgba(11,42,74,0.08)]">
        <ProfileForm
          initial={{
            nickname: profile?.nickname ?? "",
            phone: profile?.phone ?? "+62",
            imageUrl: profile?.imageUrl ?? session.user.image ?? "",
            locale: session.user.locale ?? "id",
            email: session.user.email,
            role: session.user.role,
          }}
        />
      </div>

      <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
        Lainnya
      </p>
      <ProfileShortcuts />
    </AppShell>
  );
}
