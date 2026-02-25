import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const task = await prisma.task.findFirst({ where: { id, userId: session.user.id } });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  // Serialize recurringDays array to JSON string if provided
  const data = { ...body };
  if (Array.isArray(data.recurringDays)) {
    data.recurringDays = JSON.stringify(data.recurringDays);
  }

  const updated = await prisma.task.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const task = await prisma.task.findFirst({ where: { id, userId: session.user.id } });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
