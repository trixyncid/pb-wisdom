import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isDemoMode } from "@/lib/demo/mode";

// Used by the Docker healthcheck and uptime monitors: 200 only when the app
// can reach the database.
export async function GET() {
  if (isDemoMode()) return NextResponse.json({ ok: true, demo: true });
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
