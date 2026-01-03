const fs = require("node:fs");
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

loadEnvFile(path.join(process.cwd(), ".env.local"));
loadEnvFile(path.join(process.cwd(), ".env"));

const connectionString =
  process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
  throw new Error("Missing DATABASE_URL or POSTGRES_URL");
}

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const [
    scheduleCount,
    licenseCount,
    seriesCount,
    trackCount,
    seasonCount,
    memberTrackCount,
    memberSeriesCount,
  ] = await Promise.all([
    prisma.scheduleEntry.count(),
    prisma.memberLicense.count(),
    prisma.series.count(),
    prisma.track.count(),
    prisma.season.count(),
    prisma.memberTrackStat.count(),
    prisma.memberSeriesStat.count(),
  ]);

  console.log(
    JSON.stringify(
      {
        scheduleCount,
        licenseCount,
        seriesCount,
        trackCount,
        seasonCount,
        memberTrackCount,
        memberSeriesCount,
      },
      null,
      2
    )
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
