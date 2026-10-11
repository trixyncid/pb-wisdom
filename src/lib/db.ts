import { PrismaClient } from "@prisma/client";
import { isDemoMode } from "@/lib/demo/mode";
import { createDemoPrisma } from "@/lib/demo/prisma-mock";

// Never load these unless a query asks for them explicitly (`select` or
// `omit: { field: false }`). Avatars are base64 data URLs of ~50-100 KB each
// and used to be pulled into almost every query and page; they are served by
// /avatar/[userId] instead; fee proofs by /proof/[dueId]; event photos by
// /event-photo/[id]. The
// password hash is only needed at login.
const clientOptions = {
  log:
    process.env.NODE_ENV === "development"
      ? (["error", "warn"] as const)
      : (["error"] as const),
  omit: {
    user: { image: true, passwordHash: true },
    memberProfile: { imageUrl: true },
    feeDue: { proofUrl: true },
    eventPhoto: { imageUrl: true },
  },
} as const;

function createRealClient() {
  return new PrismaClient({ ...clientOptions, log: [...clientOptions.log] });
}

type AppPrismaClient = ReturnType<typeof createRealClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: AppPrismaClient;
};

function createClient(): AppPrismaClient {
  if (isDemoMode()) {
    return createDemoPrisma() as unknown as AppPrismaClient;
  }
  return createRealClient();
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
