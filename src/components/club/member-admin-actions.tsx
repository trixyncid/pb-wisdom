"use client";

import { useTransition } from "react";
import { withToast } from "@/lib/with-toast";
import { approveMemberAction, deactivateMemberAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import type { Role, MemberStatus } from "@prisma/client";

export function MemberAdminActions({
  userId,
  role,
  status,
}: {
  userId: string;
  role: Role;
  status: MemberStatus;
}) {
  const [pending, start] = useTransition();

  if (role === "PENDING") {
    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await withToast(approveMemberAction(userId, true), { success: "Member disetujui" });
              if (!res.ok) return;
            })
          }
        >
          Approve
        </Button>
        <Button
          size="sm"
          variant="danger"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await withToast(approveMemberAction(userId, false), { success: "Ditolak" });
              if (!res.ok) return;
            })
          }
        >
          Reject
        </Button>
      </div>
    );
  }

  if (role === "ADMIN") return null;

  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await withToast(deactivateMemberAction(userId, status !== "ACTIVE"), { success: status === "ACTIVE" ? "Dinonaktifkan" : "Diaktifkan" });
          if (!res.ok) return;
        })
      }
    >
      {status === "ACTIVE" ? "Deactivate" : "Activate"}
    </Button>
  );
}
