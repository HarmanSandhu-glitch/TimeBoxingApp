import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWeekDates } from "@/lib/utils";

interface BlockData {
  isCompleted: boolean;
  taskId: string | null;
  hour: number;
  task?: { priority: string } | null;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id as string;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "daily";
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  if (type === "daily") {
    const [rawBlocks, tasks] = await Promise.all([
      prisma.timeBlock.findMany({
        where: { userId, date },
        include: { task: true },
      }),
      prisma.task.findMany({ where: { userId, date } }),
    ]);
    const blocks = rawBlocks as unknown as BlockData[];

    const totalBlocks = blocks.length;
    const completedBlocks = blocks.filter((b) => b.isCompleted).length;
    const assignedBlocks = blocks.filter((b) => b.taskId).length;
    const completionRate = totalBlocks > 0 ? Math.round((completedBlocks / Math.max(assignedBlocks, 1)) * 100) : 0;

    // Priority breakdown
    const priorityCounts: Record<string, { total: number; completed: number }> = {
      low: { total: 0, completed: 0 },
      medium: { total: 0, completed: 0 },
      high: { total: 0, completed: 0 },
      urgent: { total: 0, completed: 0 },
    };

    for (const block of blocks) {
      if (block.task) {
        const p = block.task.priority;
        if (priorityCounts[p]) {
          priorityCounts[p].total++;
          if (block.isCompleted) priorityCounts[p].completed++;
        }
      }
    }

    // Hourly activity
    const hourlyData: Record<number, { assigned: number; completed: number }> = {};
    for (const block of blocks) {
      if (!hourlyData[block.hour]) hourlyData[block.hour] = { assigned: 0, completed: 0 };
      if (block.taskId) hourlyData[block.hour].assigned++;
      if (block.isCompleted) hourlyData[block.hour].completed++;
    }

    const focusMinutes = completedBlocks * 5;

    return NextResponse.json({
      date,
      totalTasks: (tasks as unknown[]).length,
      totalBlocks,
      assignedBlocks,
      completedBlocks,
      completionRate,
      focusMinutes,
      priorityCounts,
      hourlyData,
    });
  }

  if (type === "weekly") {
    const weekDates = getWeekDates(new Date(date));

    const dailyStats = await Promise.all(
      weekDates.map(async (d) => {
        const [rawBlocks, tasks] = await Promise.all([
          prisma.timeBlock.findMany({ where: { userId, date: d } }),
          prisma.task.findMany({ where: { userId, date: d } }),
        ]);
        const blocks = rawBlocks as unknown as BlockData[];
        const assigned = blocks.filter((b) => b.taskId).length;
        const completed = blocks.filter((b) => b.isCompleted).length;
        return {
          date: d,
          totalTasks: (tasks as unknown[]).length,
          assignedBlocks: assigned,
          completedBlocks: completed,
          completionRate: assigned > 0 ? Math.round((completed / assigned) * 100) : 0,
          focusMinutes: completed * 5,
        };
      })
    );

    return NextResponse.json({ weekDates, dailyStats });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
