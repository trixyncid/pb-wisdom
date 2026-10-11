// Demo mode swaps Prisma for an in-memory mock and skips real auth, so it must
// never be on for a real deployment. It is read from the server-only DEMO_MODE
// at runtime (never a NEXT_PUBLIC_ var, which would be baked into the build),
// and it refuses to start in production when a real database is configured.
const demoMode = (() => {
  if (process.env.DEMO_MODE !== "1") return false;
  if (process.env.NODE_ENV === "production" && process.env.DATABASE_URL) {
    throw new Error(
      "DEMO_MODE=1 is set alongside DATABASE_URL in production. Demo mode disables authentication; unset DEMO_MODE for a real deployment.",
    );
  }
  return true;
})();

export function isDemoMode() {
  return demoMode;
}

export const DEMO_ROLE_COOKIE = "pbw-demo-role";
export type DemoRole = "MEMBER" | "ADMIN";
