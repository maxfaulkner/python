// jobs/weeklyRaceImportJob.js
const schedule = require('node-schedule');
const prisma = require('../prisma');
const f1DataService = require('../services/f1DataService');
const pricingEngine = require('../services/pricingEngine');
const mailer = require('../services/mailer');

/**
 * Main job: Run every Monday morning at 9:00 AM
 * Attempts to import race results with retries, then processes pricing
 */
async function startWeeklyRaceImportJob() {
  // Run every Monday at 9:00 AM
  schedule.scheduleJob('0 9 * * 1', async () => {
    console.log('\n=== Weekly Race Import Job Started ===');
    
    try {
      // Get all active leagues
      const leagues = await prisma.league.findMany();

      for (const league of leagues) {
        await processLeagueRaceImport(league);
      }
    } catch (error) {
      console.error('Fatal error in race import job:', error);
    }
  });

  console.log('✓ Weekly race import job scheduled for Mondays at 9:00 AM');
}

/**
 * Process race import and pricing for a single league
 */
async function processLeagueRaceImport(league) {
  console.log(`\nProcessing league: ${league.name} (Season ${league.season})`);

  // Determine which race we're processing
  // This would be last week's race (today is Monday, race was Sunday)
  const currentDate = new Date();
  const daysSinceRace = (currentDate.getDay() + 6) % 7; // days since Sunday
  
  // For now, we'll need to know the race week from somewhere
  // You might store this in a config or pass it in
  const raceWeek = await getCurrentRaceWeek(league);

  if (!raceWeek) {
    console.log('No pending race to import');
    return;
  }

  // Try to fetch race results with retries
  const results = await f1DataService.fetchRaceResultsWithRetries(
    league.season,
    raceWeek,
    league.adminEmail
  );

  if (!results) {
    console.log('Race import failed after all retries. Admin notified. Waiting for manual entry.');
    return;
  }

  // Process and save results
  const { savedResults, failedResults } = await f1DataService.processRaceResults(
    league.id,
    raceWeek,
    league.season,
    results
  );

  if (failedResults.length > 0) {
    console.warn(`⚠ ${failedResults.length} drivers failed to process:`, failedResults);
  }

  // Update pricing for next week
  console.log('Calculating new driver/constructor prices...');
  await pricingEngine.processPricingAfterRace(league.id, raceWeek);

  // Unlock teams for next week
  console.log('Unlocking teams for next week...');
  const nextWeek = raceWeek + 1;
  await prisma.userWeeklyTeam.updateMany({
    where: {
      leagueId: league.id,
      week: nextWeek,
    },
    data: {
      locked: false,
    },
  });

  // Send emails to all participants
  console.log('Sending team selection reminder emails...');
  const leagueUsers = await prisma.leagueUser.findMany({
    where: { leagueId: league.id },
    include: { user: true },
  });

  for (const leagueUser of leagueUsers) {
    await mailer.sendTeamPickReminder(leagueUser.user.email, {
      leagueName: league.name,
      week: nextWeek,
      budget: 100, // in millions
    });
  }

  console.log(`✓ League ${league.name} processing complete`);
}

/**
 * Determine current race week (would need context on F1 schedule)
 * For now, returns null or a hardcoded value
 * In production, you'd fetch from F1 API or have a schedule in your DB
 */
async function getCurrentRaceWeek(league) {
  // TODO: Implement proper race week detection
  // This could be:
  // 1. Stored in league with "nextRaceWeek" field
  // 2. Calculated from F1 API race schedule
  // 3. Provided via environment variable for manual control
  
  // For now, assume we're processing week 2 (since league starts at race 2)
  const pendingResults = await prisma.raceResult.count({
    where: { leagueId: league.id },
  });

  // If we have 0 results, we need to process race 2 (first race)
  // If we have results, calculate next unprocessed race
  const nextWeek = league.startingRound + pendingResults;
  
  // Check if we've already imported this week
  const existingResults = await prisma.raceResult.count({
    where: {
      leagueId: league.id,
      week: nextWeek,
    },
  });

  return existingResults === 0 ? nextWeek : null;
}

/**
 * Team lock job: Runs 1 hour before each race
 * Locks all team selections
 */
async function startTeamLockJob() {
  // This would require knowing exact race times
  // For now, a placeholder - you'd integrate with F1 race schedule
  
  console.log('✓ Team lock job placeholder registered (needs F1 race schedule integration)');
}

/**
 * Manual trigger for testing/emergency: Process race results immediately
 */
async function triggerRaceImportNow(leagueId) {
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
  });

  if (!league) throw new Error('League not found');

  await processLeagueRaceImport(league);
}

module.exports = {
  startWeeklyRaceImportJob,
  startTeamLockJob,
  triggerRaceImportNow,
};
