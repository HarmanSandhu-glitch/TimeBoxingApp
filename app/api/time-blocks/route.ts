import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id as string;
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  if (!date) return NextResponse.json({ error: "Date is required" }, { status: 400 });

  const blocks = await prisma.timeBlock.findMany({
    where: { userId, date },
    include: { task: true },
    orderBy: [{ hour: "asc" }, { minute: "asc" }],
  });

  return NextResponse.json(blocks);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id as string;
  const body = await req.json();
  // Support bulk update: { blocks: [{hour, minute, date, taskId?, isCompleted?}] }
  const blocks: Array<{ hour: number; minute: number; date: string; taskId?: string | null; isCompleted?: boolean }> = body.blocks || [body];

  const results = await Promise.all(
    blocks.map((block) =>
      prisma.timeBlock.upsert({
        where: {
          userId_date_hour_minute: {
            userId,
            date: block.date,
            hour: block.hour,
            minute: block.minute,
          },
        },
        create: {
          userId,
          date: block.date,
          hour: block.hour,
          minute: block.minute,
          taskId: block.taskId ?? null,
          isCompleted: block.isCompleted ?? false,
        },
        update: {
          taskId: block.taskId !== undefined ? block.taskId : undefined,
          isCompleted: block.isCompleted !== undefined ? block.isCompleted : undefined,
        },
        include: { task: true },
      })
    )
  );

  return NextResponse.json(results);
}
