-- CreateTable
CREATE TABLE "MemberRaceResult" (
    "id" TEXT NOT NULL,
    "custId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "seriesId" INTEGER NOT NULL,
    "trackId" INTEGER NOT NULL,
    "finishPos" INTEGER NOT NULL,
    "incidents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberRaceResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemberRaceResult_custId_seasonId_idx" ON "MemberRaceResult"("custId", "seasonId");

-- CreateIndex
CREATE INDEX "MemberRaceResult_custId_seriesId_idx" ON "MemberRaceResult"("custId", "seriesId");

-- CreateIndex
CREATE INDEX "MemberRaceResult_custId_trackId_idx" ON "MemberRaceResult"("custId", "trackId");

-- CreateIndex
CREATE INDEX "MemberRaceResult_custId_seasonId_seriesId_trackId_idx" ON "MemberRaceResult"("custId", "seasonId", "seriesId", "trackId");

-- AddForeignKey
ALTER TABLE "MemberRaceResult" ADD CONSTRAINT "MemberRaceResult_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberRaceResult" ADD CONSTRAINT "MemberRaceResult_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberRaceResult" ADD CONSTRAINT "MemberRaceResult_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
