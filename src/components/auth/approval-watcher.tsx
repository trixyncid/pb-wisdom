"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "next-auth/react";

// The proxy reads the role from the session cookie, which only changes when
// /api/auth/session re-issues it. Poll that while waiting so an approved
// member is let in without having to log out and back in.
export function ApprovalWatcher() {
  const router = useRouter();

  useEffect(() => {
    let stopped = false;
    async function check() {
      const session = await getSession();
      if (!stopped && session?.user?.role && session.user.role !== "PENDING") {
        router.replace("/");
        router.refresh();
      }
    }
    check();
    const id = setInterval(check, 30_000);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [router]);

  return null;
}
