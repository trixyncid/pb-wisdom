-- Ends all sessions of a user when bumped (password change/reset, "log out everywhere").
ALTER TABLE "User" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;
