import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { LIFE_AREAS } from "@/lib/constants";
import { runDecayForCharacter } from "@/lib/decay";

// GET /api/character — get current user's character + stats + habits
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const character = await prisma.character.findFirst({
    where: { userId },
    include: {
      stats: {
        include: {
          habits: {
            include: {
              checkIns: {
                where: { date: new Date().toISOString().slice(0, 10) },
              },
            },
          },
          consequence: true,
        },
      },
      events: {
        orderBy: { createdAt: "desc" },
        take: 30,
      },
    },
  });

  if (!character) {
    return NextResponse.json({ character: null });
  }

  // Run decay on page load
  await runDecayForCharacter(character.id);

  // Re-fetch after decay
  const updated = await prisma.character.findUnique({
    where: { id: character.id },
    include: {
      stats: {
        include: {
          habits: {
            include: {
              checkIns: {
                where: { date: new Date().toISOString().slice(0, 10) },
              },
            },
          },
          consequence: true,
        },
      },
      events: {
        orderBy: { createdAt: "desc" },
        take: 30,
      },
    },
  });

  return NextResponse.json({ character: updated });
}

// POST /api/character — create character during onboarding
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.character.findFirst({ where: { userId } });
  if (existing) {
    return NextResponse.json({ error: "Character already exists" }, { status: 400 });
  }

  const body = await req.json();
  const { name, characterClass, selectedAreas } = body as {
    name: string;
    characterClass: string;
    selectedAreas: string[]; // LifeArea enum values
  };

  if (!name || !characterClass || !selectedAreas || selectedAreas.length < 3) {
    return NextResponse.json(
      { error: "Name, class, and at least 3 life areas required" },
      { status: 400 }
    );
  }

  // Ensure user record exists
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId },
  });

  const character = await prisma.character.create({
    data: {
      name,
      class: characterClass,
      userId,
      stats: {
        create: selectedAreas.map((areaKey) => {
          const info = LIFE_AREAS.find((a) => a.area === areaKey);
          return {
            area: areaKey as keyof typeof import("@/generated/prisma").LifeArea,
            label: info?.label || areaKey,
            current: 100,
            max: 100,
          };
        }),
      },
    },
    include: {
      stats: true,
    },
  });

  await prisma.event.create({
    data: {
      type: "LEVEL_UP",
      message: `${name} the ${characterClass} begins their journey.`,
      characterId: character.id,
    },
  });

  return NextResponse.json({ character }, { status: 201 });
}
