import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ensureUpcomingOccurrences, sendOverdueFeeReminders } from "@/lib/jobs";
import { isDemoMode } from "@/lib/demo/mode";

function hasValidSecret(header: string | null, secret: string) {
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header ?? "");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Daily job: create upcoming training occurrences, then send fee reminders.
export async function GET(req: NextRequest) {
  if (isDemoMode()) {
    return NextResponse.json({ ok: true, skipped: true, demo: true });
  }

  // Fail closed: without a configured secret this endpoint must not run.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }
  if (!hasValidSecret(req.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureUpcomingOccurrences();
  const reminders = await sendOverdueFeeReminders();
  return NextResponse.json({ ok: true, reminders: reminders.count });
}
