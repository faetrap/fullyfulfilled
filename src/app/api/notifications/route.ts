import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

// POST /api/notifications — save push subscription
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const character = await prisma.character.findFirst({ where: { userId } });
  if (!character) {
    return NextResponse.json({ error: "No character found" }, { status: 404 });
  }

  const body = await req.json();
  const { endpoint, keys } = body as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: {
      p256dh: keys.p256dh,
      auth: keys.auth,
      characterId: character.id,
    },
    create: {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      characterId: character.id,
    },
  });

  return NextResponse.json({ saved: true });
}

// DELETE /api/notifications — remove push subscription
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { endpoint } = body as { endpoint: string };

  if (!endpoint) {
    return NextResponse.json({ error: "Endpoint required" }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({ where: { endpoint } });

  return NextResponse.json({ removed: true });
}
