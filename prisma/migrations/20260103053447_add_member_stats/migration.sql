-- CreateTable
CREATE TABLE "MemberTrackStat" (
    "id" TEXT NOT NULL,
    "custId" INTEGER NOT NULL,
    "trackId" INTEGER NOT NULL,
    "starts" INTEGER NOT NULL,
    "avgFinishPos" DOUBLE PRECISION NOT NULL,
    "incidentsPerRace" DOUBLE PRECISION NOT NULL,
    "lastRaceAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberTrackStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberSeriesStat" (
    "id" TEXT NOT NULL,
    "custId" INTEGER NOT NULL,
    "seriesId" INTEGER NOT NULL,
    "starts" INTEGER NOT NULL,
    "avgFinishPos" DOUBLE PRECISION NOT NULL,
    "incidentsPerRace" DOUBLE PRECISION NOT NULL,
    "lastRaceAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberSeriesStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MemberTrackStat_custId_trackId_key" ON "MemberTrackStat"("custId", "trackId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberSeriesStat_custId_seriesId_key" ON "MemberSeriesStat"("custId", "seriesId");

-- AddForeignKey
ALTER TABLE "MemberTrackStat" ADD CONSTRAINT "MemberTrackStat_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberSeriesStat" ADD CONSTRAINT "MemberSeriesStat_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
