import { NextRequest, NextResponse } from "next/server";
import { ensureUpcomingOccurrences, sendOverdueFeeReminders } from "@/lib/jobs";
import { isDemoMode } from "@/lib/demo/mode";
import { cronGuard } from "@/lib/cron-auth";

// Daily job: create upcoming training occurrences, then send fee reminders.
export async function GET(req: NextRequest) {
  if (isDemoMode()) {
    return NextResponse.json({ ok: true, skipped: true, demo: true });
  }
  const denied = cronGuard(req);
  if (denied) return denied;

  await ensureUpcomingOccurrences();
  const reminders = await sendOverdueFeeReminders();
  return NextResponse.json({ ok: true, reminders: reminders.count });
}
