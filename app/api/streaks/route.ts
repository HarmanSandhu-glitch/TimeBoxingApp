import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format, subDays, parseISO } from "date-fns";

// Recalculate and upsert streak for the user
async function recalculateStreak(userId: string) {
  // Get all dates with at least one completed block
  const completedBlocks = await prisma.timeBlock.findMany({
    where: { userId, isCompleted: true },
    select: { date: true },
    orderBy: { date: "desc" },
  });

  const datesSet = completedBlocks.map((b: { date: string }) => b.date) as string[];
  const activeDates: string[] = ([...new Set(datesSet)] as string[]).sort().reverse();
  if (activeDates.length === 0) {
    return prisma.userStreak.upsert({
      where: { userId },
      create: { userId, currentStreak: 0, longestStreak: 0, lastActiveDate: null },
      update: { currentStreak: 0, lastActiveDate: null },
    });
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
  const lastActive = activeDates[0];

  // Current streak: count consecutive days back from today or yesterday
  let currentStreak = 0;
  let check = lastActive === today ? today : lastActive === yesterday ? yesterday : null;

  if (check) {
    for (const d of activeDates) {
      if (d === check) {
        currentStreak++;
        const prev = format(subDays(parseISO(check as string), 1), "yyyy-MM-dd");
        check = prev;
      } else {
        break;
      }
    }
  }

  // Longest streak: iterate all active dates sorted ascending
  const sorted: string[] = [...activeDates].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = format(subDays(parseISO(sorted[i]), 1), "yyyy-MM-dd");
    if (sorted[i - 1] === prev) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  return prisma.userStreak.upsert({
    where: { userId },
    create: {
      userId,
      currentStreak,
      longestStreak: Math.max(longest, currentStreak),
      lastActiveDate: lastActive,
    },
    update: {
      currentStreak,
      longestStreak: Math.max(longest, currentStreak),
      lastActiveDate: lastActive,
    },
  });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id as string;

  const streak = await recalculateStreak(userId);

  // Also compute badges based on streak/completion data
  const completedCount = await prisma.timeBlock.count({ where: { userId, isCompleted: true } });
  const tasksCount = await prisma.task.count({ where: { userId } });

  const badges = [];
  if (streak.currentStreak >= 1) badges.push({ id: "first_day", label: "First Day", icon: "🌱", description: "Complete your first productive day" });
  if (streak.currentStreak >= 3) badges.push({ id: "streak_3", label: "3-Day Streak", icon: "🔥", description: "3 days in a row!" });
  if (streak.currentStreak >= 7) badges.push({ id: "streak_7", label: "Week Warrior", icon: "⚡", description: "7-day streak!" });
  if (streak.currentStreak >= 14) badges.push({ id: "streak_14", label: "Fortnight Focus", icon: "💎", description: "14-day streak!" });
  if (streak.longestStreak >= 30) badges.push({ id: "streak_30", label: "Monthly Master", icon: "🏆", description: "30-day streak achieved!" });
  if (completedCount >= 10) badges.push({ id: "blocks_10", label: "Getting Productive", icon: "✅", description: "Completed 10 time blocks" });
  if (completedCount >= 100) badges.push({ id: "blocks_100", label: "Century Club", icon: "💯", description: "Completed 100 time blocks!" });
  if (tasksCount >= 5) badges.push({ id: "tasks_5", label: "Task Creator", icon: "📋", description: "Created 5 tasks" });

  return NextResponse.json({
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastActiveDate: streak.lastActiveDate,
    badges,
    completedBlocksTotal: completedCount,
  });
}

// POST to recalculate (called after completing a block)
export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const streak = await recalculateStreak(session.user.id as string);
  return NextResponse.json(streak);
}
