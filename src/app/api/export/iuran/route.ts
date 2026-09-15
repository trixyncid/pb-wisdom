import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const periodId = req.nextUrl.searchParams.get("periodId");
  if (!periodId) {
    return NextResponse.json({ error: "periodId required" }, { status: 400 });
  }

  const period = await prisma.feePeriod.findUnique({
    where: { id: periodId },
    include: {
      dues: {
        include: { user: { include: { profile: true } } },
        orderBy: { user: { profile: { nickname: "asc" } } },
      },
    },
  });

  if (!period) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rows = [
    ["nickname", "email", "phone", "amount", "status", "submittedAt", "verifiedAt"],
    ...period.dues.map((d) => [
      d.user.profile?.nickname ?? "",
      d.user.email,
      d.user.profile?.phone ?? "",
      String(period.amount),
      d.status,
      d.submittedAt?.toISOString() ?? "",
      d.verifiedAt?.toISOString() ?? "",
    ]),
  ];

  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="iuran-${period.label.replaceAll(" ", "-")}.csv"`,
    },
  });
}
