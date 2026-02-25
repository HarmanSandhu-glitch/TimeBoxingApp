import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  if (!date) {
    // Return recent entries for weekly report
    const entries = await prisma.journalEntry.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
      take: 30,
    });
    return NextResponse.json(entries);
  }

  const entry = await prisma.journalEntry.findUnique({
    where: { userId_date: { userId: session.user.id, date } },
  });

  return NextResponse.json(entry);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date, content } = await req.json();
  if (!date) return NextResponse.json({ error: "Date is required" }, { status: 400 });

  const entry = await prisma.journalEntry.upsert({
    where: { userId_date: { userId: session.user.id, date } },
    create: { userId: session.user.id, date, content: content || "" },
    update: { content: content || "" },
  });

  return NextResponse.json(entry);
}
