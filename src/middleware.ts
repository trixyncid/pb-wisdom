import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { DEMO_ROLE_COOKIE } from "@/lib/demo/mode";

const alwaysPublic = [
  "/login",
  "/register",
  "/api/auth",
  "/api/cron",
];

const softPublic = ["/", "/jadwal"];

function isDemoMode() {
  return (
    process.env.DEMO_MODE === "1" ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "1"
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    alwaysPublic.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/brand") ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/favicon.ico" ||
    pathname === "/sw.js"
  ) {
    return NextResponse.next();
  }

  // Frontend-only Vercel preview: always signed in as demo member/admin
  if (isDemoMode()) {
    const role = req.cookies.get(DEMO_ROLE_COOKIE)?.value ?? "MEMBER";
    if (pathname.startsWith("/club") && role !== "ADMIN") {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("demo", "admin");
      return NextResponse.redirect(url);
    }
    if (
      pathname.startsWith("/login") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/pending")
    ) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  const isSoftPublic = softPublic.some(
    (p) => pathname === p || (p !== "/" && pathname.startsWith(p)),
  );

  if (!token) {
    if (isSoftPublic) return NextResponse.next();

    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("login", "1");
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (token.role === "REJECTED") {
    const url = req.nextUrl.clone();
    url.pathname = "/rejected";
    return NextResponse.redirect(url);
  }

  if (
    token.role === "PENDING" &&
    !pathname.startsWith("/pending") &&
    !pathname.startsWith("/api") &&
    !isSoftPublic
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/pending";
    return NextResponse.redirect(url);
  }

  if (
    (token.role === "MEMBER" || token.role === "ADMIN") &&
    (pathname.startsWith("/pending") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/register"))
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/club") && token.role !== "ADMIN") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Exclude all /_next (incl. HMR websocket) — middleware breaks the WS handshake
  matcher: ["/((?!_next/|icons/|brand/|.*\\..*).*)"],
};
