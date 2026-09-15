import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isDemoMode, DEMO_ROLE_COOKIE, type DemoRole } from "@/lib/demo/mode";
import { getDemoUserByRole } from "@/lib/demo/data";
import type { Role } from "@prisma/client";
import type { Provider } from "next-auth/providers";
import type { Session } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: Role;
      locale: string;
    };
  }

  interface User {
    role: Role;
    locale: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    locale: string;
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const providers: Provider[] = [
  Credentials({
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (isDemoMode()) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const email = parsed.data.email.toLowerCase();
        const user = (await prisma.user.findUnique({
          where: { email },
        })) as {
          id: string;
          email: string;
          name: string | null;
          image: string | null;
          role: Role;
          locale: string;
        } | null;
        if (!user) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          locale: user.locale,
        };
      }

      const parsed = credentialsSchema.safeParse(credentials);
      if (!parsed.success) return null;

      const user = await prisma.user.findUnique({
        where: { email: parsed.data.email.toLowerCase() },
      });
      if (!user?.passwordHash) return null;

      const valid = await compare(parsed.data.password, user.passwordHash);
      if (!valid) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        locale: user.locale,
      };
    },
  }),
];

if (
  !isDemoMode() &&
  process.env.AUTH_GOOGLE_CLIENT_ID &&
  process.env.AUTH_GOOGLE_CLIENT_SECRET
) {
  providers.unshift(
    Google({
      clientId: process.env.AUTH_GOOGLE_CLIENT_ID,
      clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

const nextAuth = NextAuth({
  adapter: isDemoMode() ? undefined : PrismaAdapter(prisma as never),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (isDemoMode()) return true;
      if (account?.provider === "google" && user.email) {
        const existing = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (existing?.role === "REJECTED") return false;
        if (!existing) {
          await prisma.user
            .update({
              where: { email: user.email },
              data: { role: "PENDING" },
            })
            .catch(async () => {});
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (isDemoMode()) {
        if (user) {
          token.id = user.id!;
          token.role = (user as { role?: Role }).role ?? "MEMBER";
          token.locale = (user as { locale?: string }).locale ?? "id";
        }
        delete token.picture;
        return token;
      }

      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id! },
        });
        token.id = user.id!;
        token.role = dbUser?.role ?? (user as { role?: Role }).role ?? "PENDING";
        token.locale = dbUser?.locale ?? "id";
      } else if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.locale = dbUser.locale;
          token.name = dbUser.name;
        }
      }
      if (trigger === "update" && session?.locale) {
        token.locale = session.locale;
      }
      delete token.picture;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.locale = token.locale;
        session.user.image = null;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (isDemoMode() || !user.id) return;
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "PENDING" },
      });
      if (user.name || user.email) {
        await prisma.memberProfile.create({
          data: {
            userId: user.id,
            nickname:
              user.name?.split(" ")[0] ??
              user.email?.split("@")[0] ??
              "Player",
            imageUrl: user.image,
          },
        });
      }
    },
  },
});

export async function getDemoSession(): Promise<Session> {
  const jar = await cookies();
  const raw = jar.get(DEMO_ROLE_COOKIE)?.value;
  const role: DemoRole = raw === "ADMIN" ? "ADMIN" : "MEMBER";
  const user = getDemoUserByRole(role);
  return {
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
      locale: user.locale,
    },
  };
}

export const handlers = nextAuth.handlers;
export const signIn = nextAuth.signIn;
export const signOut = nextAuth.signOut;

export async function auth(): Promise<Session | null> {
  if (isDemoMode()) {
    return getDemoSession();
  }
  return nextAuth.auth();
}
