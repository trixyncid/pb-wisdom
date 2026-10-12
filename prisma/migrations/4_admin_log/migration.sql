CREATE TYPE "AdminLogKind" AS ENUM ('MEMBER', 'IURAN', 'AGENDA', 'MATCH', 'CLUB');

CREATE TABLE "AdminLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "kind" "AdminLogKind" NOT NULL,
    "summary" TEXT NOT NULL,
    "href" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminLog_createdAt_idx" ON "AdminLog"("createdAt");

CREATE INDEX "AdminLog_kind_createdAt_idx" ON "AdminLog"("kind", "createdAt");

ALTER TABLE "AdminLog" ADD CONSTRAINT "AdminLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
