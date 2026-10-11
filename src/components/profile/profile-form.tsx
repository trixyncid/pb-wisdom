"use client";

import { useState, useTransition } from "react";
import { withToast } from "@/lib/with-toast";
import { updateProfileAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SquareImageUpload } from "@/components/profile/square-image-upload";
import { PhoneInput } from "@/components/profile/phone-input";
import { normalizePhone } from "@/lib/phone";

export function ProfileForm({
  initial,
}: {
  initial: {
    nickname: string;
    phone: string;
    imageUrl: string;
    email: string;
    role: string;
  };
}) {
  const [nickname, setNickname] = useState(initial.nickname);
  // Normalized up front so a stored "+620812…" is saved back without the 0.
  const [phone, setPhone] = useState(() => normalizePhone(initial.phone) || "+62");
  const [imageUrl, setImageUrl] = useState(initial.imageUrl);
  const [pending, start] = useTransition();
  const [photoPending, startPhoto] = useTransition();

  function savePhoto(dataUrl: string) {
    setImageUrl(dataUrl);
    startPhoto(async () => {
      const res = await withToast(updateProfileAction({
        nickname,
        phone: phone === "+62" || phone.length <= 3 ? "" : phone,
        imageUrl: dataUrl,
      }), { success: "Foto profil diperbarui" });
      if (!res.ok) return;
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center">
        <SquareImageUpload
          value={imageUrl}
          onChange={savePhoto}
          initials={nickname || "P"}
        />
        {photoPending && (
          <p className="mt-2 text-xs font-semibold text-accent-ink">
            Menyimpan foto…
          </p>
        )}
        <h2 className="mt-4 text-2xl font-black tracking-tight text-navy">
          {nickname || "Player"}
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">{initial.email}</p>
        <div className="mt-2.5">
          <Badge
            className={
              initial.role === "ADMIN"
                ? "bg-navy text-white"
                : undefined
            }
          >
            {initial.role}
          </Badge>
        </div>
      </div>

      <form
        className="space-y-3.5"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await withToast(updateProfileAction({
              nickname,
              phone: phone === "+62" || phone.length <= 3 ? "" : phone,
            }), { success: "Profil disimpan" });
            if (!res.ok) return;
          });
        }}
      >
        <div className="space-y-1.5">
          <Label>Nickname</Label>
          <Input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="profile-phone">WhatsApp / Phone</Label>
          <PhoneInput id="profile-phone" value={phone} onChange={setPhone} />
        </div>

        <Button type="submit" disabled={pending} className="mt-1 w-full">
          {pending ? "Menyimpan…" : "Simpan perubahan"}
        </Button>
      </form>
    </div>
  );
}
