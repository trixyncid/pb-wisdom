import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { DEMO_ROLE_COOKIE, isDemoMode } from "@/lib/demo/mode";

const alwaysPublic = [
  "/login",
  "/register",
  "/api/auth",
  "/api/cron",
];

const softPublic = ["/", "/jadwal"];

// Auth.js names the session cookie "__Secure-authjs.session-token" on HTTPS
// and "authjs.session-token" otherwise. getToken() defaults to the plain name,
// so mirror Auth.js's own rule: AUTH_URL's protocol, else X-Forwarded-Proto.
function usesSecureCookie(req: NextRequest) {
  const authUrl = process.env.AUTH_URL;
  if (authUrl) return authUrl.startsWith("https:");
  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol;
  return proto.replace(/:$/, "") === "https";
}

export async function proxy(req: NextRequest) {
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
    secureCookie: usesSecureCookie(req),
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

  if (token.role === "REJECTED" && pathname !== "/rejected") {
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
  // Exclude all /_next (incl. HMR websocket) — the proxy breaks the WS handshake
  matcher: ["/((?!_next/|icons/|brand/|.*\\..*).*)"],
};
