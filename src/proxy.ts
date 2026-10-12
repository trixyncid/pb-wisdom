import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { encode, getToken, type JWT } from "next-auth/jwt";
import { DEMO_ROLE_COOKIE, isDemoMode } from "@/lib/demo/mode";
import { SESSION_MAX_AGE, SESSION_UPDATE_AGE } from "@/lib/session-config";

const alwaysPublic = [
  "/login",
  "/register",
  "/api/auth",
  "/api/cron",
  "/api/health",
  "/avatar",
  "/event-photo",
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

  const secure = usesSecureCookie(req);
  const token = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie: secure });
  const res = route(req, token);
  if (token) await renewSession(res, token, secure);
  return res;
}

/**
 * Rolling session: pages render as Server Components, which cannot set
 * cookies, so the session would otherwise expire 30 days after login however
 * active the member is. Here (once a day at most) the encrypted cookie is
 * re-issued with a fresh expiry and the same claims and flags (HttpOnly,
 * SameSite=Lax, Secure on HTTPS). The role inside is only a routing hint;
 * auth() re-reads the user from the database on every server request.
 */
async function renewSession(res: NextResponse, token: JWT, secure: boolean) {
  const issuedAt = typeof token.iat === "number" ? token.iat : 0;
  if (Date.now() / 1000 - issuedAt < SESSION_UPDATE_AGE) return;
  const name = `${secure ? "__Secure-" : ""}authjs.session-token`;
  // encode() sets fresh iat/exp/jti; drop the old ones.
  const claims: JWT = { ...token };
  delete claims.iat;
  delete claims.exp;
  delete claims.jti;
  const value = await encode({ token: claims, secret: process.env.AUTH_SECRET!, salt: name, maxAge: SESSION_MAX_AGE });
  res.cookies.set(name, value, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: SESSION_MAX_AGE });
}

function route(req: NextRequest, token: JWT | null) {
  const { pathname } = req.nextUrl;
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
