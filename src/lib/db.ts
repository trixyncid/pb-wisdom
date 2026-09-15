import { PrismaClient } from "@prisma/client";
import { isDemoMode } from "@/lib/demo/mode";
import { createDemoPrisma } from "@/lib/demo/prisma-mock";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
};

function createClient(): PrismaClient {
  if (isDemoMode()) {
    return createDemoPrisma() as unknown as PrismaClient;
  }
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
