"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { DEMO_ROLE_COOKIE, type DemoRole, isDemoMode } from "@/lib/demo/mode";

export async function setDemoRoleAction(role: DemoRole) {
  if (!isDemoMode()) return { ok: false as const };
  const jar = await cookies();
  jar.set(DEMO_ROLE_COOKIE, role, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
  return { ok: true as const };
}
