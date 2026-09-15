"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setDemoRoleAction } from "@/actions/demo";

export function DemoBanner({ role }: { role: "MEMBER" | "ADMIN" }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function switchRole(next: "MEMBER" | "ADMIN") {
    start(async () => {
      await setDemoRoleAction(next);
      router.refresh();
    });
  }

  return (
    <div className="sticky top-0 z-[60] border-b border-amber-200/80 bg-amber-50 px-3 py-2 text-center text-[11px] font-semibold text-amber-950 md:pl-60">
      <span className="mr-2">
        Demo UI · mock data · no backend · viewing as{" "}
        <strong>{role === "ADMIN" ? "Admin" : "Member"}</strong>
      </span>
      <button
        type="button"
        disabled={pending || role === "MEMBER"}
        onClick={() => switchRole("MEMBER")}
        className="mx-0.5 rounded-full bg-white px-2.5 py-0.5 font-bold text-[#0b2a4a] shadow-sm disabled:opacity-40"
      >
        Member
      </button>
      <button
        type="button"
        disabled={pending || role === "ADMIN"}
        onClick={() => switchRole("ADMIN")}
        className="mx-0.5 rounded-full bg-[#0b2a4a] px-2.5 py-0.5 font-bold text-white shadow-sm disabled:opacity-40"
      >
        Admin
      </button>
    </div>
  );
}
