-- AlterTable
ALTER TABLE "Constructor" ADD COLUMN     "nationality" TEXT;

-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "abbr" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "number" INTEGER;

-- AlterTable
ALTER TABLE "League" ADD COLUMN     "allowTripleCap" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowWildcard" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "budget" DOUBLE PRECISION NOT NULL DEFAULT 100,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "inviteCode" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "leagueType" TEXT NOT NULL DEFAULT 'classic',
ADD COLUMN     "maxPlayers" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "scoringConfig" JSONB,
ADD COLUMN     "transfersPerRound" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "LeagueUser" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'member',
ADD COLUMN     "teamName" TEXT,
ADD COLUMN     "totalPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalWins" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "RaceResult" ADD COLUMN     "gridPosition" INTEGER,
ADD COLUMN     "isSprint" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarColor" TEXT NOT NULL DEFAULT '#e10600',
ADD COLUMN     "bio" TEXT;

-- AlterTable
ALTER TABLE "UserWeeklyTeam" ADD COLUMN     "captainId" TEXT,
ADD COLUMN     "chipUsed" TEXT;

-- CreateTable
CREATE TABLE "Chip" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "usedWeek" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "outDriverId" TEXT,
    "inDriverId" TEXT,
    "outConstructorId" TEXT,
    "inConstructorId" TEXT,
    "pricePaid" DOUBLE PRECISION,
    "type" TEXT NOT NULL DEFAULT 'regular',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BonusPoint" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "driverId" TEXT NOT NULL,
    "raceResultId" TEXT,
    "type" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BonusPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueMessage" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'message',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "replyToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeagueMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageReaction" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leagueId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "data" JSONB,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "H2HMatchup" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "user1Id" TEXT NOT NULL,
    "user2Id" TEXT NOT NULL,
    "user1Points" INTEGER NOT NULL DEFAULT 0,
    "user2Points" INTEGER NOT NULL DEFAULT 0,
    "winnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "H2HMatchup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Chip_userId_leagueId_type_key" ON "Chip"("userId", "leagueId", "type");

-- CreateIndex
CREATE INDEX "Transfer_userId_leagueId_idx" ON "Transfer"("userId", "leagueId");

-- CreateIndex
CREATE INDEX "BonusPoint_leagueId_week_idx" ON "BonusPoint"("leagueId", "week");

-- CreateIndex
CREATE UNIQUE INDEX "BonusPoint_leagueId_week_driverId_type_key" ON "BonusPoint"("leagueId", "week", "driverId", "type");

-- CreateIndex
CREATE INDEX "LeagueMessage_leagueId_createdAt_idx" ON "LeagueMessage"("leagueId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MessageReaction_messageId_userId_emoji_key" ON "MessageReaction"("messageId", "userId", "emoji");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_userId_type_leagueId_key" ON "Achievement"("userId", "type", "leagueId");

-- CreateIndex
CREATE INDEX "H2HMatchup_leagueId_week_idx" ON "H2HMatchup"("leagueId", "week");

-- CreateIndex
CREATE UNIQUE INDEX "H2HMatchup_leagueId_week_user1Id_user2Id_key" ON "H2HMatchup"("leagueId", "week", "user1Id", "user2Id");

-- CreateIndex
CREATE UNIQUE INDEX "League_inviteCode_key" ON "League"("inviteCode");

-- AddForeignKey
ALTER TABLE "Chip" ADD CONSTRAINT "Chip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonusPoint" ADD CONSTRAINT "BonusPoint_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonusPoint" ADD CONSTRAINT "BonusPoint_raceResultId_fkey" FOREIGN KEY ("raceResultId") REFERENCES "RaceResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueMessage" ADD CONSTRAINT "LeagueMessage_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueMessage" ADD CONSTRAINT "LeagueMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueMessage" ADD CONSTRAINT "LeagueMessage_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "LeagueMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "LeagueMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "H2HMatchup" ADD CONSTRAINT "H2HMatchup_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;
