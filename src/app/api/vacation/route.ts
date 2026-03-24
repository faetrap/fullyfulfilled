import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

// POST /api/vacation — toggle vacation mode
export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const character = await prisma.character.findFirst({ where: { userId } });
  if (!character) {
    return NextResponse.json({ error: "No character found" }, { status: 404 });
  }

  const newMode = !character.vacationMode;

  if (newMode) {
    // Turning vacation ON
    await prisma.character.update({
      where: { id: character.id },
      data: {
        vacationMode: true,
        vacationStartedAt: new Date(),
      },
    });
  } else {
    // Turning vacation OFF — reset all decay streaks so user isn't hit with accumulated decay
    await prisma.$transaction(async (tx) => {
      await tx.character.update({
        where: { id: character.id },
        data: {
          vacationMode: false,
          vacationStartedAt: null,
        },
      });

      // Reset all DecayEvent streaks to 0 for this character's stats
      const stats = await tx.stat.findMany({
        where: { characterId: character.id },
        select: { id: true },
      });
      const statIds = stats.map((s) => s.id);

      await tx.decayEvent.updateMany({
        where: { statId: { in: statIds } },
        data: { streak: 0 },
      });
    });
  }

  return NextResponse.json({ vacationMode: newMode });
}
