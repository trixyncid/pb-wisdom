-- Guests (non-members) in matches, events and training; per-match leaderboard opt-out.

-- AlterTable
ALTER TABLE "SessionAttendance" ADD COLUMN     "guestId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "EventRsvp" ADD COLUMN     "guestId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "ranked" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "MatchPlayer" ADD COLUMN     "guestId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Guest_name_idx" ON "Guest"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SessionAttendance_occurrenceId_guestId_key" ON "SessionAttendance"("occurrenceId", "guestId");

-- CreateIndex
CREATE UNIQUE INDEX "EventRsvp_eventId_guestId_key" ON "EventRsvp"("eventId", "guestId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchPlayer_matchId_guestId_key" ON "MatchPlayer"("matchId", "guestId");

-- AddForeignKey
ALTER TABLE "SessionAttendance" ADD CONSTRAINT "SessionAttendance_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRsvp" ADD CONSTRAINT "EventRsvp_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Each row is either a member or a guest, never both or neither.
ALTER TABLE "SessionAttendance" ADD CONSTRAINT "SessionAttendance_member_or_guest" CHECK (("userId" IS NULL) <> ("guestId" IS NULL));
ALTER TABLE "EventRsvp" ADD CONSTRAINT "EventRsvp_member_or_guest" CHECK (("userId" IS NULL) <> ("guestId" IS NULL));
ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_member_or_guest" CHECK (("userId" IS NULL) <> ("guestId" IS NULL));
