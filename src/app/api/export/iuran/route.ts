import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPhone } from "@/lib/phone";

// Excel/Sheets run cells starting with these as formulas (e.g. a nickname of
// =HYPERLINK(...)); quoting does not stop it, a leading apostrophe does.
function csvCell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

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
      formatPhone(d.user.profile?.phone),
      String(period.amount),
      d.status,
      d.submittedAt?.toISOString() ?? "",
      d.verifiedAt?.toISOString() ?? "",
    ]),
  ];

  const csv = rows
    .map((r) => r.map((c) => csvCell(String(c))).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="iuran-${period.label.replace(/[^A-Za-z0-9_-]+/g, "-")}.csv"`,
    },
  });
}
