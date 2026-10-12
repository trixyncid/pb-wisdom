import { NextRequest, NextResponse } from "next/server";
import { processOutbox } from "@/lib/email/outbox";
import { isDemoMode } from "@/lib/demo/mode";
import { cronGuard } from "@/lib/cron-auth";

// Every few minutes: send queued email that is due (retries after failures).
export async function GET(req: NextRequest) {
  if (isDemoMode()) return NextResponse.json({ ok: true, skipped: true, demo: true });
  const denied = cronGuard(req);
  if (denied) return denied;
  return NextResponse.json({ ok: true, ...(await processOutbox(100)) });
}
