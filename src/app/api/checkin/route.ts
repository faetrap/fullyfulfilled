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

  // Proportional recovery for weekly habits
  const recoveryAmount =
    habit.frequency === "WEEKLY"
      ? Math.max(1, Math.round(RECOVERY_PER_CHECKIN / habit.weeklyTarget))
      : RECOVERY_PER_CHECKIN;

  // Wrap entire toggle in a transaction to prevent race conditions
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.checkIn.findUnique({
      where: { habitId_date: { habitId, date: today } },
    });

    if (existing) {
      // Undo check-in
      await tx.checkIn.delete({ where: { id: existing.id } });

      await tx.stat.update({
        where: { id: habit.statId },
        data: {
          current: { decrement: Math.min(recoveryAmount, habit.stat.current) },
        },
      });

      await tx.event.create({
        data: {
          type: "HABIT_MISSED",
          message: `Undid "${habit.name}" (-${recoveryAmount} ${habit.stat.label})`,
          characterId: character.id,
        },
      });

      return { checked: false };
    } else {
      // Check in — handle unique constraint violation (double-click)
      try {
        await tx.checkIn.create({
          data: { habitId, date: today },
        });
      } catch (e: unknown) {
        // Unique constraint violation — treat as no-op
        if (e instanceof Error && e.message.includes("Unique constraint")) {
          return { checked: true };
        }
        throw e;
      }

      const headroom = habit.stat.max - habit.stat.current;
      const heal = Math.min(recoveryAmount, headroom);

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

      return { checked: true };
    }
  });

  return NextResponse.json(result);
}
