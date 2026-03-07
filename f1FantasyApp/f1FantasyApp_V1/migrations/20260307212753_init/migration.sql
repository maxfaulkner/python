-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "League" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "startingRound" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "adminEmail" TEXT NOT NULL,

    CONSTRAINT "League_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeagueUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "f1Id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "constructorId" TEXT NOT NULL,
    "isRookie" BOOLEAN NOT NULL DEFAULT false,
    "skillTier" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Constructor" (
    "id" TEXT NOT NULL,
    "f1Id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Constructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverPrice" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructorPrice" (
    "id" TEXT NOT NULL,
    "constructorId" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConstructorPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWeeklyTeam" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "budgetUsed" DOUBLE PRECISION NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserWeeklyTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWeeklyTeamDriver" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "pricePaidPerPoint" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "UserWeeklyTeamDriver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWeeklyTeamConstructor" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "constructorId" TEXT NOT NULL,
    "pricePaidPerPoint" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "UserWeeklyTeamConstructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaceResult" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "driverId" TEXT NOT NULL,
    "finishingPosition" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RaceResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructorRaceResult" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "constructorId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConstructorRaceResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingAuditLog" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "driverId" TEXT,
    "constructorId" TEXT,
    "oldPrice" DOUBLE PRECISION NOT NULL,
    "newPrice" DOUBLE PRECISION NOT NULL,
    "performanceDelta" DOUBLE PRECISION NOT NULL,
    "marketPressure" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueUser_userId_leagueId_key" ON "LeagueUser"("userId", "leagueId");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_f1Id_key" ON "Driver"("f1Id");

-- CreateIndex
CREATE INDEX "Driver_constructorId_idx" ON "Driver"("constructorId");

-- CreateIndex
CREATE UNIQUE INDEX "Constructor_f1Id_key" ON "Constructor"("f1Id");

-- CreateIndex
CREATE INDEX "Constructor_name_idx" ON "Constructor"("name");

-- CreateIndex
CREATE INDEX "DriverPrice_driverId_week_idx" ON "DriverPrice"("driverId", "week");

-- CreateIndex
CREATE UNIQUE INDEX "DriverPrice_driverId_week_key" ON "DriverPrice"("driverId", "week");

-- CreateIndex
CREATE INDEX "ConstructorPrice_constructorId_week_idx" ON "ConstructorPrice"("constructorId", "week");

-- CreateIndex
CREATE UNIQUE INDEX "ConstructorPrice_constructorId_week_key" ON "ConstructorPrice"("constructorId", "week");

-- CreateIndex
CREATE INDEX "UserWeeklyTeam_leagueId_week_idx" ON "UserWeeklyTeam"("leagueId", "week");

-- CreateIndex
CREATE UNIQUE INDEX "UserWeeklyTeam_userId_leagueId_week_key" ON "UserWeeklyTeam"("userId", "leagueId", "week");

-- CreateIndex
CREATE UNIQUE INDEX "UserWeeklyTeamDriver_teamId_driverId_key" ON "UserWeeklyTeamDriver"("teamId", "driverId");

-- CreateIndex
CREATE UNIQUE INDEX "UserWeeklyTeamConstructor_teamId_key" ON "UserWeeklyTeamConstructor"("teamId");

-- CreateIndex
CREATE INDEX "RaceResult_leagueId_week_idx" ON "RaceResult"("leagueId", "week");

-- CreateIndex
CREATE UNIQUE INDEX "RaceResult_leagueId_week_driverId_key" ON "RaceResult"("leagueId", "week", "driverId");

-- CreateIndex
CREATE UNIQUE INDEX "ConstructorRaceResult_leagueId_week_constructorId_key" ON "ConstructorRaceResult"("leagueId", "week", "constructorId");

-- AddForeignKey
ALTER TABLE "LeagueUser" ADD CONSTRAINT "LeagueUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueUser" ADD CONSTRAINT "LeagueUser_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_constructorId_fkey" FOREIGN KEY ("constructorId") REFERENCES "Constructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverPrice" ADD CONSTRAINT "DriverPrice_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructorPrice" ADD CONSTRAINT "ConstructorPrice_constructorId_fkey" FOREIGN KEY ("constructorId") REFERENCES "Constructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWeeklyTeam" ADD CONSTRAINT "UserWeeklyTeam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWeeklyTeam" ADD CONSTRAINT "UserWeeklyTeam_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWeeklyTeamDriver" ADD CONSTRAINT "UserWeeklyTeamDriver_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "UserWeeklyTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWeeklyTeamDriver" ADD CONSTRAINT "UserWeeklyTeamDriver_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWeeklyTeamConstructor" ADD CONSTRAINT "UserWeeklyTeamConstructor_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "UserWeeklyTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWeeklyTeamConstructor" ADD CONSTRAINT "UserWeeklyTeamConstructor_constructorId_fkey" FOREIGN KEY ("constructorId") REFERENCES "Constructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceResult" ADD CONSTRAINT "RaceResult_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceResult" ADD CONSTRAINT "RaceResult_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructorRaceResult" ADD CONSTRAINT "ConstructorRaceResult_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructorRaceResult" ADD CONSTRAINT "ConstructorRaceResult_constructorId_fkey" FOREIGN KEY ("constructorId") REFERENCES "Constructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
