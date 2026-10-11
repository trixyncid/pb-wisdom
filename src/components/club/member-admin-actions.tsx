"use client";

import { useTransition } from "react";
import { toast } from "sonner";
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
              const res = await approveMemberAction(userId, true);
              if (!res.ok) {
                toast.error(res.error);
                return;
              }
              toast.success("Member disetujui");
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
              const res = await approveMemberAction(userId, false);
              if (!res.ok) {
                toast.error(res.error);
                return;
              }
              toast.message("Ditolak");
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
          const res = await deactivateMemberAction(userId, status !== "ACTIVE");
          if (!res.ok) {
            toast.error(res.error);
            return;
          }
          toast.success(status === "ACTIVE" ? "Dinonaktifkan" : "Diaktifkan");
        })
      }
    >
      {status === "ACTIVE" ? "Deactivate" : "Activate"}
    </Button>
  );
}
