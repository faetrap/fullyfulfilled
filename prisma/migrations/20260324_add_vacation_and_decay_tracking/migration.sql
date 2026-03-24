-- AlterEnum
BEGIN;
CREATE TYPE "EventType_new" AS ENUM ('HABIT_COMPLETE', 'HABIT_MISSED', 'DECAY', 'CONSEQUENCE_TRIGGERED', 'CONSEQUENCE_RESOLVED', 'STAT_RECOVERED');
ALTER TABLE "Event" ALTER COLUMN "type" TYPE "EventType_new" USING ("type"::text::"EventType_new");
ALTER TYPE "EventType" RENAME TO "EventType_old";
ALTER TYPE "EventType_new" RENAME TO "EventType";
DROP TYPE "public"."EventType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "LifeArea_new" AS ENUM ('HEALTH', 'KNOWLEDGE', 'SOCIAL', 'CREATIVITY', 'FINANCE');
ALTER TABLE "Stat" ALTER COLUMN "area" TYPE "LifeArea_new" USING ("area"::text::"LifeArea_new");
ALTER TYPE "LifeArea" RENAME TO "LifeArea_old";
ALTER TYPE "LifeArea_new" RENAME TO "LifeArea";
DROP TYPE "public"."LifeArea_old";
COMMIT;

-- AlterTable
ALTER TABLE "Character" DROP COLUMN "class",
DROP COLUMN "gender",
ADD COLUMN     "lastDecayDate" TEXT,
ADD COLUMN     "vacationMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vacationStartedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Habit" DROP COLUMN "missedStreak",
DROP COLUMN "xpReward";

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
