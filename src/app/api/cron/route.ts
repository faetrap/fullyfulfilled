import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runDecayForCharacter } from "@/lib/decay";

// GET /api/cron — nightly decay for all characters (Vercel Cron)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const characters = await prisma.character.findMany({
    select: { id: true },
  });

  const results: { id: string; status: string }[] = [];

  for (const char of characters) {
    try {
      await runDecayForCharacter(char.id);
      results.push({ id: char.id, status: "ok" });
    } catch (e) {
      results.push({ id: char.id, status: `error: ${e instanceof Error ? e.message : "unknown"}` });
    }
  }

  return NextResponse.json({
    processed: results.length,
    results,
  });
}
