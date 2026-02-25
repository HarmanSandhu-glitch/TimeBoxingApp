import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { getTodayString, getWeekDates } from "@/lib/utils";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { message } = await req.json();
    // mode: "chat" | "analyze" | "plan"

    const today = getTodayString();
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Gather context
    const [todayBlocks, todayTasks, recentJournals] = await Promise.all([
      prisma.timeBlock.findMany({
        where: { userId: session.user.id as string, date: today },
        include: { task: true },
      }),
      prisma.task.findMany({ where: { userId: session.user.id as string, date: today } }),
      prisma.journalEntry.findMany({
        where: { userId: session.user.id as string },
        orderBy: { date: "desc" },
        take: 7,
      }),
    ]);

    const weekDates = getWeekDates();
    const weeklyBlocks = await Promise.all(
      weekDates.map((d) =>
        prisma.timeBlock.findMany({
          where: { userId: session.user!.id as string, date: d },
          include: { task: true },
        })
      )
    );

    // Build context summary
    const assignedToday = (todayBlocks as Array<{taskId: string | null; isCompleted: boolean; task?: {title: string; priority: string} | null}>)
      .filter((b) => b.taskId).length;
    const completedToday = (todayBlocks as Array<{isCompleted: boolean}>)
      .filter((b) => b.isCompleted).length;
    const completionRate = assignedToday > 0 ? Math.round((completedToday / assignedToday) * 100) : 0;

    const weeklyStats = weekDates.map((d, i) => {
      const blocks = weeklyBlocks[i] as Array<{taskId: string | null; isCompleted: boolean}>;
      const assigned = blocks.filter((b) => b.taskId).length;
      const completed = blocks.filter((b) => b.isCompleted).length;
      return `${d}: ${completed}/${assigned} blocks completed (${assigned > 0 ? Math.round((completed / assigned) * 100) : 0}%)`;
    });

    const journalSummary = (recentJournals as Array<{date: string; content: string}>)
      .map((j) => `[${j.date}]: ${j.content.substring(0, 200)}`)
      .join("\n");

    const contextPrompt = `
You are a productivity coach assistant for a time boxing app called TimeBox.

User's productivity context:
- Today (${today}): ${completedToday}/${assignedToday} time blocks completed (${completionRate}% completion rate)
- Today's tasks: ${(todayTasks as Array<{title: string; priority: string}>).map((t) => `"${t.title}" (${t.priority})`).join(", ") || "None"}
- Weekly stats:
${weeklyStats.join("\n")}

Recent journal entries (what was off track):
${journalSummary || "No journal entries yet."}

User message: ${message}

Please provide a helpful, specific, and actionable response. Be concise but thorough. Format your response using markdown for better readability.
`;

    const result = await model.generateContent(contextPrompt);
    const response = result.response.text();

    return NextResponse.json({ response });
  } catch (error) {
    console.error("AI error:", error);
    return NextResponse.json({ error: "Failed to get AI response" }, { status: 500 });
  }
}
