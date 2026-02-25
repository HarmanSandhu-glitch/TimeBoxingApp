import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

// GET /api/recurring-tasks?date=YYYY-MM-DD
// Returns recurring tasks that should appear on the given date
// and auto-creates tasks for that date if not already present
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date is required" }, { status: 400 });

  const userId = session.user.id as string;
  const dayOfWeek = new Date(date).getDay(); // 0=Sun, 1=Mon, ... 6=Sat

  // Find all recurring tasks for this user
  const recurringTasks = await prisma.task.findMany({
    where: { userId, isRecurring: true },
  });

  const applied: unknown[] = [];

  for (const rt of recurringTasks) {
    const days: number[] = rt.recurringDays ? JSON.parse(rt.recurringDays) : [];
    if (days.length === 0 || days.includes(dayOfWeek)) {
      // Check if a task with same title already exists for this date
      const existing = await prisma.task.findFirst({
        where: { userId, title: rt.title, date },
      });

      if (!existing) {
        const created = await prisma.task.create({
          data: {
            title: rt.title,
            priority: rt.priority,
            date,
            color: rt.color,
            category: rt.category,
            isRecurring: false, // instance is not recurring itself
            userId,
          },
        });
        applied.push(created);
      }
    }
  }

  return NextResponse.json({ applied, count: applied.length });
}

// POST /api/recurring-tasks — create a recurring task template
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, priority, color, category, recurringDays } = await req.json();
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const userId = session.user.id as string;
  // Use a sentinel date for the template
  const templateDate = format(new Date(), "yyyy-MM-dd");

  const task = await prisma.task.create({
    data: {
      title,
      priority: priority || "medium",
      date: templateDate,
      color: color || "#6366f1",
      category: category || "work",
      isRecurring: true,
      recurringDays: recurringDays ? JSON.stringify(recurringDays) : JSON.stringify([1, 2, 3, 4, 5]),
      userId,
    },
  });

  return NextResponse.json(task, { status: 201 });
}
