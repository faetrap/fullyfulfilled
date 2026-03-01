import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { RECOVERY_PER_CHECKIN } from "@/lib/decay";
import { todayKey } from "@/lib/constants";

// POST /api/checkin — toggle a habit check-in for today
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const character = await prisma.character.findFirst({ where: { userId } });
  if (!character) {
    return NextResponse.json({ error: "No character found" }, { status: 404 });
  }

  const body = await req.json();
  const { habitId } = body as { habitId: string };

  if (!habitId) {
    return NextResponse.json({ error: "habitId required" }, { status: 400 });
  }

  const habit = await prisma.habit.findFirst({
    where: { id: habitId, characterId: character.id },
    include: { stat: true },
  });
  if (!habit) {
    return NextResponse.json({ error: "Habit not found" }, { status: 404 });
  }

  const today = todayKey();

  const existing = await prisma.checkIn.findUnique({
    where: { habitId_date: { habitId, date: today } },
  });

  if (existing) {
    // Undo check-in
    await prisma.$transaction(async (tx) => {
      await tx.checkIn.delete({ where: { id: existing.id } });

      // Reverse the stat recovery
      await tx.stat.update({
        where: { id: habit.statId },
        data: {
          current: { decrement: Math.min(RECOVERY_PER_CHECKIN, habit.stat.current) },
        },
      });

      await tx.event.create({
        data: {
          type: "HABIT_MISSED",
          message: `Undid "${habit.name}" (-${RECOVERY_PER_CHECKIN} ${habit.stat.label})`,
          characterId: character.id,
        },
      });
    });

    return NextResponse.json({ checked: false });
  } else {
    // Check in
    await prisma.$transaction(async (tx) => {
      await tx.checkIn.create({
        data: { habitId, date: today },
      });

      const headroom = habit.stat.max - habit.stat.current;
      const heal = Math.min(RECOVERY_PER_CHECKIN, headroom);

      await tx.stat.update({
        where: { id: habit.statId },
        data: { current: { increment: heal } },
      });

      await tx.event.create({
        data: {
          type: "HABIT_COMPLETE",
          message: `Completed "${habit.name}" (+${heal} ${habit.stat.label})`,
          characterId: character.id,
        },
      });

      // Resolve consequence if stat recovers above 0
      if (habit.stat.current === 0 && heal > 0) {
        await tx.consequence.updateMany({
          where: { statId: habit.statId, resolvedAt: null },
          data: { resolvedAt: new Date() },
        });

        await tx.event.create({
          data: {
            type: "CONSEQUENCE_RESOLVED",
            message: `${habit.stat.label} is recovering. The consequence lifts... for now.`,
            characterId: character.id,
          },
        });
      }
    });

    return NextResponse.json({ checked: true });
  }
}
