export function isDemoMode() {
  return (
    process.env.DEMO_MODE === "1" ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "1"
  );
}

export const DEMO_ROLE_COOKIE = "pbw-demo-role";
export type DemoRole = "MEMBER" | "ADMIN";
