import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatHour } from "@/lib/utils";

// GET /api/export?format=csv&from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const exportFormat = searchParams.get("format") || "csv";
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const userId = session.user.id as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { userId };
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = from;
    if (to) where.date.lte = to;
  }

  const blocks = await prisma.timeBlock.findMany({
    where,
    include: { task: true },
    orderBy: [{ date: "asc" }, { hour: "asc" }, { minute: "asc" }],
  });

  if (exportFormat === "csv") {
    const headers = ["Date", "Time", "Task", "Priority", "Category", "Completed"];
    const rows = blocks.map((b: {
      date: string;
      hour: number;
      minute: number;
      task: { title: string; priority: string; category: string } | null;
      isCompleted: boolean;
    }) => [
      b.date,
      `${formatHour(b.hour)}:${b.minute.toString().padStart(2, "0")}`,
      b.task?.title || "",
      b.task?.priority || "",
      b.task?.category || "",
      b.isCompleted ? "Yes" : "No",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="timebox-export-${from ?? "all"}.csv"`,
      },
    });
  }

  // JSON fallback
  return NextResponse.json(blocks);
}
