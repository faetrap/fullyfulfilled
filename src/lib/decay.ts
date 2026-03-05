import { prisma } from "./db";

/**
 * Decay rules:
 * - 1 day grace period: no decay if only 1 day missed
 * - Accelerating decay: day 2 = -2, day 3 = -4, day 4 = -8, etc.
 *   Formula: amount = 2^(consecutiveMissedDays - 1)
 * - Max decay per event: 25 (caps the exponential)
 * - Recovery: completing a habit heals stat by +3 (slow recovery)
 * - Consequence triggers when stat hits 0
 */

const MAX_DECAY = 25;
const RECOVERY_PER_CHECKIN = 3;

const CONSEQUENCE_MESSAGES: Record<string, string> = {
  HEALTH: "Your body grows weary. Rest and movement both feel far away.",
  DISCIPLINE: "Your routines have scattered. The days blur into one another.",
  KNOWLEDGE: "Your mind feels foggy. The things you knew seem distant now.",
  SOCIAL: "The connections you valued have grown quiet. Reach out.",
  CREATIVITY: "The spark has dimmed. The world feels a little less colorful.",
  FINANCE: "The ledger has tilted. Small choices add up — time to recalibrate.",
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Calculate decay amount based on consecutive missed days.
 * Grace period: 1 day (no decay on first miss).
 * Accelerating: 2^(streak-1), capped at MAX_DECAY.
 */
function decayAmount(consecutiveMissed: number): number {
  if (consecutiveMissed <= 1) return 0; // grace period
  const raw = Math.pow(2, consecutiveMissed - 1);
  return Math.min(raw, MAX_DECAY);
}

/**
 * Run decay check for a character. Called on login / page load.
 * Checks each habit — if it wasn't completed yesterday, increment miss streak.
 * Apply decay to the parent stat.
 */
export async function runDecayForCharacter(characterId: string) {
  const yesterday = yesterdayKey();
  const today = todayKey();

  const habits = await prisma.habit.findMany({
    where: { characterId },
    include: {
      checkIns: {
        where: { date: yesterday },
      },
      stat: {
        include: { decays: { orderBy: { createdAt: "desc" }, take: 1 } },
      },
    },
  });

  for (const habit of habits) {
    // Only check daily habits for now
    if (habit.frequency !== "DAILY") continue;

    const completedYesterday = habit.checkIns.length > 0;

    if (completedYesterday) {
      // Reset miss streak — stat recovers a little
      await prisma.stat.update({
        where: { id: habit.statId },
        data: {
          current: {
            increment: Math.min(
              RECOVERY_PER_CHECKIN,
              habit.stat.max - habit.stat.current
            ),
          },
        },
      });
      continue;
    }

    // Missed yesterday — calculate consecutive streak
    const lastDecay = habit.stat.decays[0];
    const currentStreak =
      lastDecay && lastDecay.date === yesterday
        ? lastDecay.streak
        : lastDecay
          ? lastDecay.streak + 1
          : 1;

    const amount = decayAmount(currentStreak);

    if (amount > 0) {
      const newCurrent = Math.max(0, habit.stat.current - amount);

      await prisma.$transaction(async (tx) => {
        await tx.stat.update({
          where: { id: habit.statId },
          data: { current: newCurrent },
        });

        await tx.decayEvent.create({
          data: {
            statId: habit.statId,
            amount,
            streak: currentStreak,
            date: today,
          },
        });

        await tx.event.create({
          data: {
            type: "DECAY",
            message: `${habit.stat.label} decayed by ${amount} (${currentStreak} days missed)`,
            characterId,
          },
        });

        // Check for consequence
        if (newCurrent === 0) {
          const existing = await tx.consequence.findUnique({
            where: { statId: habit.statId },
          });

          if (!existing || existing.resolvedAt) {
            await tx.consequence.upsert({
              where: { statId: habit.statId },
              update: { resolvedAt: null, triggeredAt: new Date() },
              create: {
                statId: habit.statId,
                message:
                  CONSEQUENCE_MESSAGES[habit.stat.area] ||
                  "Something terrible has happened...",
              },
            });

            await tx.event.create({
              data: {
                type: "CONSEQUENCE_TRIGGERED",
                message: `CONSEQUENCE: ${habit.stat.label} has reached zero!`,
                characterId,
              },
            });
          }
        }
      });
    }
  }
}

export { RECOVERY_PER_CHECKIN };
