import { NextRequest, NextResponse } from "next/server";
import { sendOverdueFeeRemindersAction } from "@/actions/ops";
import { isDemoMode } from "@/lib/demo/mode";

export async function GET(req: NextRequest) {
  if (isDemoMode()) {
    return NextResponse.json({ ok: true, skipped: true, demo: true });
  }

  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendOverdueFeeRemindersAction();
  return NextResponse.json(result);
}
