import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProfileShortcuts } from "@/components/profile/profile-shortcuts";
import { avatarUrl } from "@/lib/avatar";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) return null;

  const profile = await prisma.memberProfile.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <>
      <div className="mb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent-ink">
          Akun
        </p>
        <h1 className="text-2xl font-black text-navy">Profil</h1>
      </div>

      <div className="mb-4 overflow-hidden rounded-[32px] border border-white/80 bg-gradient-to-b from-accent-soft via-white to-white p-5 shadow-[0_16px_40px_rgba(14,44,60,0.08)]">
        <ProfileForm
          initial={{
            nickname: profile?.nickname ?? "",
            phone: profile?.phone ?? "+62",
            imageUrl: avatarUrl(session.user.id, profile?.updatedAt),
            email: session.user.email,
            role: session.user.role,
          }}
        />
      </div>

      <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
        Lainnya
      </p>
      <ProfileShortcuts />
    </>
  );
}
