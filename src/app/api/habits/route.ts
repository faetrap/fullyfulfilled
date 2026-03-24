import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

// POST /api/habits — create a new habit
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const character = await prisma.character.findFirst({ where: { userId } });
  if (!character) {
    return NextResponse.json({ error: "No character found" }, { status: 404 });
  }

  const body = await req.json();
  const { name, statId, frequency, weeklyTarget } = body as {
    name: string;
    statId: string;
    frequency?: "DAILY" | "WEEKLY";
    weeklyTarget?: number;
  };

  if (!name || !statId) {
    return NextResponse.json({ error: "Name and statId required" }, { status: 400 });
  }

  // Verify stat belongs to this character
  const stat = await prisma.stat.findFirst({
    where: { id: statId, characterId: character.id },
  });
  if (!stat) {
    return NextResponse.json({ error: "Stat not found" }, { status: 404 });
  }

  const habit = await prisma.habit.create({
    data: {
      name,
      statId,
      characterId: character.id,
      frequency: frequency || "DAILY",
      weeklyTarget: weeklyTarget || 7,
    },
  });

  return NextResponse.json({ habit }, { status: 201 });
}

// PATCH /api/habits — update habit frequency
export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const character = await prisma.character.findFirst({ where: { userId } });
  if (!character) {
    return NextResponse.json({ error: "No character found" }, { status: 404 });
  }

  const body = await req.json();
  const { id, frequency, weeklyTarget } = body as { id: string; frequency?: "DAILY" | "WEEKLY"; weeklyTarget?: number };

  if (!id) {
    return NextResponse.json({ error: "Habit id required" }, { status: 400 });
  }
  if (frequency && !["DAILY", "WEEKLY"].includes(frequency)) {
    return NextResponse.json({ error: "Invalid frequency" }, { status: 400 });
  }

  const habit = await prisma.habit.findFirst({
    where: { id, characterId: character.id },
  });
  if (!habit) {
    return NextResponse.json({ error: "Habit not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (frequency) updateData.frequency = frequency;
  if (weeklyTarget !== undefined) updateData.weeklyTarget = weeklyTarget;

  const updated = await prisma.habit.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ habit: updated });
}

// DELETE /api/habits?id=xxx — delete a habit
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const character = await prisma.character.findFirst({ where: { userId } });
  if (!character) {
    return NextResponse.json({ error: "No character found" }, { status: 404 });
  }

  const habitId = req.nextUrl.searchParams.get("id");
  if (!habitId) {
    return NextResponse.json({ error: "Habit ID required" }, { status: 400 });
  }

  const habit = await prisma.habit.findFirst({
    where: { id: habitId, characterId: character.id },
  });
  if (!habit) {
    return NextResponse.json({ error: "Habit not found" }, { status: 404 });
  }

  await prisma.habit.delete({ where: { id: habitId } });

  return NextResponse.json({ success: true });
}
