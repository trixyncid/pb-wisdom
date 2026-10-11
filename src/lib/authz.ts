import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Server actions are reachable by a direct POST from any page, so the proxy
// never protects them. Every action must call one of these guards itself.

type AuthedSession = Session & { user: NonNullable<Session["user"]> };

/** Any signed-in account that is not rejected (pending users may edit their profile). */
export async function requireUser(): Promise<AuthedSession> {
  const session = await auth();
  if (!session?.user?.id || session.user.role === "REJECTED") {
    throw new Error("Unauthorized");
  }
  return session as AuthedSession;
}

/** An approved member or admin. */
export async function requireMember(): Promise<AuthedSession> {
  const session = await requireUser();
  if (session.user.role !== "MEMBER" && session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return session;
}

export async function requireAdmin(): Promise<AuthedSession> {
  const session = await requireUser();
  if (session.user.role !== "ADMIN") throw new Error("Forbidden");
  return session;
}

/**
 * For admin pages. Called in each page rather than a shared layout: layouts do
 * not re-render on client navigation, so a layout-only check can be skipped.
 */
export async function requireAdminPage(): Promise<AuthedSession> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/");
  return session as AuthedSession;
}
