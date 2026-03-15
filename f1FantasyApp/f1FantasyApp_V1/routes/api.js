// routes/api.js
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const rateLimit = require('express-rate-limit');
const prisma = require('../prisma');
const f1DataService = require('../services/f1DataService');
const pricingEngine = require('../services/pricingEngine');
const authMiddleware = require('../middleware/auth');
const { isRoundLocked } = require('../jobs/weeklyRaceImportJob');

const checkResultsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { error: 'Too many requests, please wait a minute before checking again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============ LEAGUE MANAGEMENT ============

/**
 * POST /api/leagues
 * Create a new league (creator is automatically joined as member)
 * Body: { name, season, startingRound, adminEmail }
 */
router.post('/leagues', authMiddleware, async (req, res) => {
  try {
    const { name, season, startingRound, adminEmail } = req.body;
    const userId = req.user.id;

    if (!name || !season || !startingRound) {
      return res.status(400).json({ error: 'name, season, and startingRound are required' });
    }

    const league = await prisma.league.create({
      data: {
        name,
        season: parseInt(season),
        startingRound: parseInt(startingRound),
        adminEmail: adminEmail || req.user.email,
        users: {
          create: { userId },
        },
      },
      include: { users: true },
    });

    res.status(201).json(league);
  } catch (error) {
    console.error('Error creating league:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/leagues
 * List all leagues the authenticated user belongs to
 */
router.get('/leagues', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const leagueUsers = await prisma.leagueUser.findMany({
      where: { userId },
      include: {
        league: {
          include: {
            _count: { select: { users: true } },
          },
        },
      },
    });

    res.json(leagueUsers.map(lu => ({
      ...lu.league,
      memberCount: lu.league._count.users,
    })));
  } catch (error) {
    console.error('Error listing leagues:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/leagues/:leagueId
 * Get a single league's details and members
 */
router.get('/leagues/:leagueId', authMiddleware, async (req, res) => {
  try {
    const { leagueId } = req.params;

    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        users: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }

    res.json(league);
  } catch (error) {
    console.error('Error fetching league:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/leagues/:leagueId/join
 * Join an existing league
 */
router.post('/leagues/:leagueId/join', authMiddleware, async (req, res) => {
  try {
    const { leagueId } = req.params;
    const userId = req.user.id;

    const league = await prisma.league.findUnique({ where: { id: leagueId } });
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }

    const existing = await prisma.leagueUser.findUnique({
      where: { userId_leagueId: { userId, leagueId } },
    });
    if (existing) {
      return res.status(400).json({ error: 'Already a member of this league' });
    }

    await prisma.leagueUser.create({ data: { userId, leagueId } });

    res.json({ message: 'Joined league successfully', leagueId, leagueName: league.name });
  } catch (error) {
    console.error('Error joining league:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ TEAM SELECTION ============

/**
 * GET /api/leagues/:leagueId/team/:week
 * Get current team for user in a specific week
 */
router.get(
  '/leagues/:leagueId/team/:week',
  authMiddleware,
  async (req, res) => {
    try {
      const { leagueId, week } = req.params;
      const userId = req.user.id;

      const team = await prisma.userWeeklyTeam.findUnique({
        where: {
          userId_leagueId_week: {
            userId,
            leagueId,
            week: parseInt(week),
          },
        },
        include: {
          drivers: {
            include: {
              driver: true,
            },
          },
          constructors: {
            include: {
              constructor: true,
            },
          },
        },
      });

      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }

      res.json(team);
    } catch (error) {
      console.error('Error fetching team:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * POST /api/leagues/:leagueId/team/:week
 * Submit team for a week (5 drivers + 1 constructor)
 * Body: { drivers: [driverId], constructorId }
 */
router.post(
  '/leagues/:leagueId/team/:week',
  authMiddleware,
  async (req, res) => {
    try {
      const { leagueId, week } = req.params;
      const { drivers, constructorId } = req.body;
      const userId = req.user.id;
      const weekNum = parseInt(week);

      // Validation
      if (!drivers || drivers.length !== 5) {
        return res.status(400).json({ error: 'Must select exactly 5 drivers' });
      }
      if (!constructorId) {
        return res.status(400).json({ error: 'Must select 1 constructor' });
      }

      // Check if team is locked
      const existingTeam = await prisma.userWeeklyTeam.findUnique({
        where: {
          userId_leagueId_week: {
            userId,
            leagueId,
            week: weekNum,
          },
        },
      });

      if (existingTeam?.locked) {
        return res.status(400).json({ error: 'Team is locked for this week' });
      }

      // Get current prices
      const driverPrices = await prisma.driverPrice.findMany({
        where: {
          driverId: { in: drivers },
          week: weekNum,
        },
      });

      const constructorPrice = await prisma.constructorPrice.findUnique({
        where: {
          constructorId_week: {
            constructorId,
            week: weekNum,
          },
        },
      });

      // Calculate total cost
      const driverCost = driverPrices.reduce((sum, p) => sum + p.price, 0);
      const totalCost = driverCost + constructorPrice.price;
      const budget = 100; // millions

      if (totalCost > budget) {
        return res.status(400).json({
          error: `Team costs ${totalCost.toFixed(2)}M but budget is ${budget}M`,
          budgetUsed: totalCost,
        });
      }

      // Upsert team
      const team = await prisma.userWeeklyTeam.upsert({
        where: {
          userId_leagueId_week: {
            userId,
            leagueId,
            week: weekNum,
          },
        },
        create: {
          userId,
          leagueId,
          week: weekNum,
          budgetUsed: totalCost,
        },
        update: {
          budgetUsed: totalCost,
        },
      });

      // Delete old driver selections
      await prisma.userWeeklyTeamDriver.deleteMany({
        where: { teamId: team.id },
      });

      // Add new driver selections
      for (const driverId of drivers) {
        const price = driverPrices.find(p => p.driverId === driverId);
        await prisma.userWeeklyTeamDriver.create({
          data: {
            teamId: team.id,
            driverId,
            pricePaidPerPoint: price.price,
          },
        });
      }

      // Delete old constructor selection
      await prisma.userWeeklyTeamConstructor.deleteMany({
        where: { teamId: team.id },
      });

      // Add new constructor selection
      await prisma.userWeeklyTeamConstructor.create({
        data: {
          teamId: team.id,
          constructorId,
          pricePaidPerPoint: constructorPrice.price,
        },
      });

      res.json({
        message: 'Team submitted successfully',
        team: {
          id: team.id,
          week: weekNum,
          budgetUsed: totalCost,
          budgetRemaining: budget - totalCost,
        },
      });
    } catch (error) {
      console.error('Error submitting team:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/leagues/:leagueId/team/:week/:userId
 * View any player's team for a given week
 */
router.get('/leagues/:leagueId/team/:week/:userId', authMiddleware, async (req, res) => {
  try {
    const { leagueId, week, userId } = req.params;

    const team = await prisma.userWeeklyTeam.findUnique({
      where: { userId_leagueId_week: { userId, leagueId, week: parseInt(week) } },
      include: {
        user: { select: { name: true } },
        drivers: { include: { driver: { include: { constructor: true } } } },
        constructors: { include: { constructor: true } },
      },
    });

    if (!team) return res.status(404).json({ error: 'No team found for this player' });

    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ PRICING ============

/**
 * GET /api/leagues/:leagueId/prices/:week
 * Get all driver and constructor prices for a week
 */
router.get('/leagues/:leagueId/prices/:week', authMiddleware, async (req, res) => {
  try {
    const { leagueId, week } = req.params;
    const weekNum = parseInt(week);

    const drivers = await prisma.driverPrice.findMany({
      where: {
        week: weekNum,
      },
      include: {
        driver: {
          include: { constructor: true },
        },
      },
    });

    const constructors = await prisma.constructorPrice.findMany({
      where: {
        week: weekNum,
      },
      include: {
        constructor: {
          include: { drivers: true },
        },
      },
    });

    res.json({
      week: weekNum,
      drivers,
      constructors,
      totalBudget: 100,
      locked: await isRoundLocked(weekNum),
    });
  } catch (error) {
    console.error('Error fetching prices:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ DRIVER FORM & PRICE HISTORY ============

/**
 * GET /api/leagues/:leagueId/driver-form/:week
 * Returns last 3 finishing positions and price history for all drivers (for the team picker)
 */
router.get('/leagues/:leagueId/driver-form/:week', authMiddleware, async (req, res) => {
  try {
    const { leagueId } = req.params;
    const weekNum = parseInt(req.params.week);

    // Last 3 race results per driver
    const results = await prisma.raceResult.findMany({
      where: { leagueId, week: { lt: weekNum } },
      orderBy: { week: 'desc' },
    });

    // Group by driverId, keep last 3 per driver
    const formMap = {};
    for (const r of results) {
      if (!formMap[r.driverId]) formMap[r.driverId] = [];
      if (formMap[r.driverId].length < 3) {
        formMap[r.driverId].push({ week: r.week, position: r.finishingPosition, points: r.points });
      }
    }

    // Price history for all drivers (up to current week)
    const prices = await prisma.driverPrice.findMany({
      where: { week: { lte: weekNum } },
      orderBy: { week: 'asc' },
    });
    const priceMap = {};
    for (const p of prices) {
      if (!priceMap[p.driverId]) priceMap[p.driverId] = [];
      priceMap[p.driverId].push({ week: p.week, price: p.price });
    }

    res.json({ form: formMap, prices: priceMap });
  } catch (error) {
    console.error('Error fetching driver form:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ LEADERBOARD ============

/**
 * GET /api/leagues/:leagueId/leaderboard
 * Get season leaderboard with points and tie-breaker
 */
router.get('/leagues/:leagueId/leaderboard', async (req, res) => {
  try {
    const { leagueId } = req.params;

    // Get all users in league
    const leagueUsers = await prisma.leagueUser.findMany({
      where: { leagueId },
      include: {
        user: {
          include: {
            weeklyTeams: {
              where: { leagueId },
              include: {
                drivers: true,
                constructors: true,
              },
            },
          },
        },
      },
    });

    // Calculate points for each user
    const standings = [];

    for (const leagueUser of leagueUsers) {
      let totalPoints = 0;
      let totalWins = 0;

      for (const team of leagueUser.user.weeklyTeams) {
        // Get points for drivers in team
        for (const teamDriver of team.drivers) {
          const results = await prisma.raceResult.findMany({
            where: {
              driverId: teamDriver.driverId,
              leagueId,
            },
          });

          for (const result of results) {
            totalPoints += result.points;
            if (result.finishingPosition === 1) {
              totalWins++;
            }
          }
        }

        // Get constructor points
        const constructor = team.constructors[0];
        if (constructor) {
          const constructorResults = await prisma.constructorRaceResult.findMany({
            where: {
              constructorId: constructor.constructorId,
              leagueId,
            },
          });

          for (const result of constructorResults) {
            totalPoints += result.totalPoints;
          }
        }
      }

      standings.push({
        userId: leagueUser.userId,
        userName: leagueUser.user.name,
        email: leagueUser.user.email,
        totalPoints,
        totalWins, // tie-breaker
      });
    }

    // Sort by points (desc), then by wins (desc)
    standings.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return b.totalWins - a.totalWins;
    });
    standings.forEach((u, i) => { u.rank = i + 1; });

    // Compute previous-round ranks to show movement arrows
    const latestWeek = await prisma.raceResult.findFirst({
      where: { leagueId },
      orderBy: { week: 'desc' },
      select: { week: true },
    });

    if (latestWeek) {
      // Re-tally excluding the latest round
      const prevTotals = {};
      for (const s of standings) prevTotals[s.userId] = { pts: 0, wins: 0 };

      for (const leagueUser of leagueUsers) {
        for (const team of leagueUser.user.weeklyTeams) {
          for (const td of team.drivers) {
            const results = await prisma.raceResult.findMany({
              where: { driverId: td.driverId, leagueId, week: { lt: latestWeek.week } },
            });
            for (const r of results) {
              prevTotals[leagueUser.userId].pts += r.points;
              if (r.finishingPosition === 1) prevTotals[leagueUser.userId].wins++;
            }
          }
          const ctor = team.constructors[0];
          if (ctor) {
            const cResults = await prisma.constructorRaceResult.findMany({
              where: { constructorId: ctor.constructorId, leagueId, week: { lt: latestWeek.week } },
            });
            for (const r of cResults) prevTotals[leagueUser.userId].pts += r.totalPoints;
          }
        }
      }

      const prevRanked = Object.entries(prevTotals)
        .sort(([, a], [, b]) => b.pts !== a.pts ? b.pts - a.pts : b.wins - a.wins)
        .map(([userId], i) => ({ userId, rank: i + 1 }));
      const prevRankMap = Object.fromEntries(prevRanked.map(r => [r.userId, r.rank]));

      for (const s of standings) {
        const prev = prevRankMap[s.userId];
        s.rankDelta = prev != null ? prev - s.rank : 0; // positive = moved up
      }
    } else {
      standings.forEach(s => { s.rankDelta = 0; });
    }

    res.json(standings);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ ADMIN: MANUAL RACE ENTRY ============

/**
 * POST /api/admin/races/:leagueId/:week
 * Admin submits race results manually
 * Body: { results: [{ driverId, finishingPosition }] }
 */
router.post('/admin/races/:leagueId/:week', authMiddleware, async (req, res) => {
  try {
    const { leagueId, week } = req.params;
    const { results } = req.body;
    const weekNum = parseInt(week);

    // TODO: Verify user is admin of this league

    // Validate each result
    for (const result of results) {
      if (!result.driverId || result.finishingPosition === undefined) {
        return res.status(400).json({
          error: 'Each result must have driverId and finishingPosition',
        });
      }
    }

    // Delete any existing results for this week (to allow re-entry)
    await prisma.raceResult.deleteMany({
      where: { leagueId, week: weekNum },
    });

    // Process results
    const { savedResults, failedResults } =
      await f1DataService.processRaceResults(
        leagueId,
        weekNum,
        new Date().getFullYear(),
        results
      );

    // Update pricing
    await pricingEngine.processPricingAfterRace(leagueId, weekNum);

    // Unlock teams for next week
    await prisma.userWeeklyTeam.updateMany({
      where: {
        leagueId,
        week: weekNum + 1,
      },
      data: {
        locked: false,
      },
    });

    res.json({
      message: 'Race results processed',
      savedCount: savedResults.length,
      failedCount: failedResults.length,
      failures: failedResults,
    });
  } catch (error) {
    console.error('Error processing race results:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ MANUAL RESULT CHECK ============

/**
 * POST /api/admin/check-results
 * Check Jolpica for the most recent completed race and import if not already in DB
 */
router.post('/admin/check-results', checkResultsLimiter, authMiddleware, async (_req, res) => {
  try {
    const season = new Date().getFullYear();
    const now = new Date();

    // Fetch the F1 schedule to find the latest completed race
    const scheduleRes = await fetch(`https://api.jolpi.ca/ergast/f1/${season}.json`);
    const scheduleData = await scheduleRes.json();
    const races = scheduleData.MRData.RaceTable.Races;

    // Find completed main races (race start time in the past)
    const completedRaces = races.filter(r => new Date(`${r.date}T${r.time || '14:00:00Z'}`) < now);

    // Also find sprint-only events: sprint finished but main race hasn't started yet
    const sprintCompleted = races.filter(r => {
      if (!r.Sprint) return false;
      const sprintTime = new Date(`${r.Sprint.date}T${r.Sprint.time || '14:00:00Z'}`);
      const raceTime = new Date(`${r.date}T${r.time || '14:00:00Z'}`);
      return sprintTime < now && raceTime >= now;
    });

    // Determine the most recent completed event and whether it's a sprint
    let latest = null;
    let isSprintImport = false;

    if (completedRaces.length > 0 && sprintCompleted.length > 0) {
      const lastRace = completedRaces[completedRaces.length - 1];
      const lastSprint = sprintCompleted[sprintCompleted.length - 1];
      const lastRaceTime = new Date(`${lastRace.date}T${lastRace.time || '14:00:00Z'}`);
      const lastSprintTime = new Date(`${lastSprint.Sprint.date}T${lastSprint.Sprint.time || '14:00:00Z'}`);
      if (lastSprintTime > lastRaceTime) {
        latest = lastSprint;
        isSprintImport = true;
      } else {
        latest = lastRace;
      }
    } else if (sprintCompleted.length > 0) {
      latest = sprintCompleted[sprintCompleted.length - 1];
      isSprintImport = true;
    } else if (completedRaces.length > 0) {
      latest = completedRaces[completedRaces.length - 1];
    } else {
      return res.json({ status: 'no_race', message: 'No completed races yet this season.' });
    }

    const round = parseInt(latest.round);

    // Try to fetch results from Jolpica first (before checking leagues)
    let results;
    try {
      results = isSprintImport
        ? await f1DataService.fetchSprintResults(season, round)
        : await f1DataService.fetchRaceResults(season, round);
    } catch {
      const eventLabel = isSprintImport ? 'Sprint results' : 'Results';
      return res.json({ status: 'not_available', message: `${eventLabel} for round ${round} (${latest.raceName}) not available yet. Try again later.`, round });
    }

    // If this is a main race on a sprint weekend, also fetch sprint results to combine points
    let sprintResults = null;
    if (!isSprintImport && latest.Sprint) {
      try {
        sprintResults = await f1DataService.fetchSprintResults(season, round);
      } catch {
        // Sprint fetch failed — import race-only
      }
    }

    const eventLabel = isSprintImport ? `Sprint — Round ${round} (${latest.raceName})` : `Round ${round} (${latest.raceName})`;

    // Process per-league
    const leagues = await prisma.league.findMany();
    let totalSaved = 0;
    let skipped = 0;
    for (const league of leagues) {
      if (round < league.startingRound) continue;
      const existing = await prisma.raceResult.count({ where: { leagueId: league.id, week: round } });

      if (existing > 0) {
        // Main race on a sprint weekend: wipe sprint-only data and re-import with combined points
        if (!isSprintImport && latest.Sprint) {
          await prisma.raceResult.deleteMany({ where: { leagueId: league.id, week: round } });
          await prisma.constructorRaceResult.deleteMany({ where: { leagueId: league.id, week: round } });
        } else {
          skipped++;
          continue;
        }
      }

      const { savedResults } = await f1DataService.processRaceResults(
        league.id, round, season, results, { isSprint: isSprintImport, sprintResults }
      );
      await pricingEngine.processPricingAfterRace(league.id, round);
      await prisma.userWeeklyTeam.updateMany({
        where: { leagueId: league.id, week: round + 1 },
        data: { locked: false },
      });
      totalSaved += savedResults.length;
    }

    if (totalSaved === 0 && skipped > 0) {
      return res.json({ status: 'already_imported', message: `${eventLabel} already imported for all leagues.`, round });
    }

    res.json({ status: 'imported', message: `${eventLabel} imported — ${totalSaved} results saved across ${leagues.length - skipped} league(s).`, round });
  } catch (error) {
    console.error('Error checking results:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
