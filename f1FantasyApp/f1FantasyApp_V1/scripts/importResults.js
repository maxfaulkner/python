// scripts/importResults.js
// One-shot script to import completed race results from Jolpica API.
// Usage: node scripts/importResults.js
//        node scripts/importResults.js --rounds 1,2   (import specific rounds)
//        node scripts/importResults.js --round 2      (import a single round)

const prisma = require('../prisma');
const f1DataService = require('../services/f1DataService');
const pricingEngine = require('../services/pricingEngine');

const SEASON = 2026;

// Parse CLI args
const args = process.argv.slice(2);
let forcedRounds = null;
for (let i = 0; i < args.length; i++) {
  if ((args[i] === '--rounds' || args[i] === '--round') && args[i + 1]) {
    forcedRounds = args[i + 1].split(',').map(Number);
  }
}

async function updateLeagueUserCache(leagueId) {
  const teams = await prisma.userWeeklyTeam.findMany({
    where: { leagueId },
    include: {
      drivers: { include: { raceResult: true } },
      constructors: { include: { constructorRaceResult: true } },
    },
  });

  const pointsMap = {};
  const winsMap = {};
  for (const team of teams) {
    let pts = team.drivers.reduce((s, d) => s + (d.raceResult?.points || 0), 0);
    pts += team.constructors.reduce((s, c) => s + (c.constructorRaceResult?.totalPoints || 0), 0);
    if (!pointsMap[team.userId]) { pointsMap[team.userId] = 0; winsMap[team.userId] = 0; }
    pointsMap[team.userId] += pts;
  }

  // Determine weekly winners
  const weekMap = {};
  for (const team of teams) {
    if (!weekMap[team.week]) weekMap[team.week] = [];
    let pts = team.drivers.reduce((s, d) => s + (d.raceResult?.points || 0), 0);
    pts += team.constructors.reduce((s, c) => s + (c.constructorRaceResult?.totalPoints || 0), 0);
    weekMap[team.week].push({ userId: team.userId, pts });
  }
  for (const weekTeams of Object.values(weekMap)) {
    const maxPts = Math.max(...weekTeams.map(t => t.pts));
    if (maxPts > 0) {
      weekTeams.filter(t => t.pts === maxPts).forEach(t => { winsMap[t.userId] = (winsMap[t.userId] || 0) + 1; });
    }
  }

  for (const [userId, totalPoints] of Object.entries(pointsMap)) {
    await prisma.leagueUser.updateMany({
      where: { leagueId, userId },
      data: { totalPoints, totalWins: winsMap[userId] || 0 },
    });
  }
}

async function importRound(round) {
  console.log(`\n── Round ${round} ──────────────────────────────────`);

  let results;
  try {
    results = await f1DataService.fetchRaceResults(SEASON, round);
    console.log(`  Fetched ${results.length} results from Jolpica`);
  } catch (err) {
    console.log(`  ✗ Could not fetch Round ${round}: ${err.message}`);
    return;
  }

  const leagues = await prisma.league.findMany();
  if (leagues.length === 0) {
    console.log('  ✗ No leagues in database — run seedDatabase.js first');
    return;
  }

  for (const league of leagues) {
    if (round < (league.startingRound || 1)) {
      console.log(`  [${league.name}] Skipping — round ${round} is before league start (${league.startingRound})`);
      continue;
    }

    const existing = await prisma.raceResult.count({ where: { leagueId: league.id, week: round } });
    if (existing > 0) {
      console.log(`  [${league.name}] Already imported (${existing} results) — skipping`);
      continue;
    }

    const { savedResults, failedResults } = await f1DataService.processRaceResults(
      league.id, round, SEASON, results
    );
    console.log(`  [${league.name}] Saved ${savedResults.length} driver results`);
    if (failedResults.length > 0) {
      console.log(`    Unmatched drivers: ${failedResults.map(f => `${f.f1Id} (${f.reason})`).join(', ')}`);
    }

    await pricingEngine.processPricingAfterRace(league.id, round);
    console.log(`  [${league.name}] Prices updated for Round ${round + 1}`);

    // Unlock next round's teams
    await prisma.userWeeklyTeam.updateMany({
      where: { leagueId: league.id, week: round + 1 },
      data: { locked: false },
    });

    await updateLeagueUserCache(league.id);
    console.log(`  [${league.name}] Standings cache refreshed`);
  }
}

async function main() {
  console.log(`\nF1 ${SEASON} Results Importer`);
  console.log('================================');

  let roundsToImport;
  if (forcedRounds) {
    roundsToImport = forcedRounds;
    console.log(`Importing specified rounds: ${roundsToImport.join(', ')}`);
  } else {
    // Auto-detect: fetch schedule and find all completed rounds not yet in DB
    console.log('Auto-detecting completed rounds from Jolpica schedule...');
    const schedRes = await fetch(`https://api.jolpi.ca/ergast/f1/${SEASON}.json`);
    const schedData = await schedRes.json();
    const races = schedData.MRData.RaceTable.Races;
    const now = new Date();
    const completed = races
      .filter(r => new Date(`${r.date}T${r.time || '14:00:00Z'}`) < now)
      .map(r => parseInt(r.round));
    if (completed.length === 0) {
      console.log('No completed races found yet this season.');
      await prisma.$disconnect();
      return;
    }
    console.log(`Completed rounds in ${SEASON}: ${completed.join(', ')}`);
    roundsToImport = completed;
  }

  for (const round of roundsToImport) {
    await importRound(round);
  }

  console.log('\n✓ Done.\n');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
