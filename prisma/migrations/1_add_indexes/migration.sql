-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "TrainingOccurrence_date_idx" ON "TrainingOccurrence"("date");

-- CreateIndex
CREATE INDEX "SessionAttendance_userId_idx" ON "SessionAttendance"("userId");

-- CreateIndex
CREATE INDEX "FeeDue_userId_idx" ON "FeeDue"("userId");

-- CreateIndex
CREATE INDEX "FeeDue_status_idx" ON "FeeDue"("status");

-- CreateIndex
CREATE INDEX "Event_startsAt_idx" ON "Event"("startsAt");

-- CreateIndex
CREATE INDEX "EventRsvp_userId_idx" ON "EventRsvp"("userId");

-- CreateIndex
CREATE INDEX "EventPhoto_eventId_createdAt_idx" ON "EventPhoto"("eventId", "createdAt");

-- CreateIndex
CREATE INDEX "EventPhoto_createdAt_idx" ON "EventPhoto"("createdAt");

-- CreateIndex
CREATE INDEX "Match_status_playedAt_idx" ON "Match"("status", "playedAt");

-- CreateIndex
CREATE INDEX "MatchPlayer_userId_idx" ON "MatchPlayer"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Announcement_createdAt_idx" ON "Announcement"("createdAt");

