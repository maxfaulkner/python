// services/pricingEngine.js
const prisma = require('../prisma'); // your prisma client

const F1_POINTS = {
  1: 25,
  2: 18,
  3: 15,
  4: 12,
  5: 10,
  6: 8,
  7: 6,
  8: 4,
  9: 2,
  10: 1,
};

/**
 * Get expected finishing position for a driver based on:
 * 1. Constructor's average performance
 * 2. Driver's skill tier relative to teammate
 */
async function getExpectedPosition(driver, leagueId, currentWeek) {
  // Get constructor's average finishing position from previous weeks
  const previousResults = await prisma.raceResult.findMany({
    where: {
      driver: { constructorId: driver.constructorId },
      week: { lt: currentWeek },
      league: { id: leagueId },
    },
  });

  if (previousResults.length === 0) {
    // First week: use baseline skill tier
    return driver.skillTier > 1 ? 8 : 12; // better drivers start higher ranked
  }

  const avgPosition = 
    previousResults.reduce((sum, r) => sum + r.finishingPosition, 0) / 
    previousResults.length;

  // Adjust by driver skill tier
  // skillTier of 1.1 means 10% better, might finish 1-2 positions higher
  const adjustedExpectation = avgPosition / driver.skillTier;

  return Math.round(adjustedExpectation);
}

/**
 * Calculate performance delta for a driver
 * Positive = beat expectation (price goes up)
 * Negative = missed expectation (price goes down)
 */
async function calculatePerformanceDelta(driver, finishingPosition, leagueId, currentWeek) {
  const expectedPosition = await getExpectedPosition(driver, leagueId, currentWeek);
  
  // Delta in positions (negative is better)
  const positionDelta = finishingPosition - expectedPosition;
  
  // Convert to normalized -1 to +1 scale
  // If you beat expectation by 5 positions, that's good
  // If you miss by 5 positions, that's bad
  const normalizedDelta = Math.max(-1, Math.min(1, positionDelta / 5));
  
  return -normalizedDelta; // flip so positive = good performance
}

/**
 * Calculate market pressure based on selection frequency
 * If everyone picked a driver, price goes up
 * If no one picked them, price goes down slightly
 */
async function calculateMarketPressure(driverId, leagueId, currentWeek) {
  // Count how many teams selected this driver in the current week
  const selectionCount = await prisma.userWeeklyTeamDriver.count({
    where: {
      driver: { id: driverId },
      team: {
        league: { id: leagueId },
        week: currentWeek,
      },
    },
  });

  // Count total teams in the league
  const totalTeams = await prisma.userWeeklyTeam.count({
    where: {
      league: { id: leagueId },
      week: currentWeek,
    },
    distinct: ['userId'],
  });

  if (totalTeams === 0) return 0;

  const selectionRate = selectionCount / totalTeams;
  
  // Normalize: 50% selection = 0, 100% = +1, 0% = -0.1
  return (selectionRate - 0.5) * 2;
}

/**
 * Update driver price based on race results
 * Formula: new_price = old_price × (1 + performance_delta × 0.15 + market_pressure × 0.08)
 */
async function updateDriverPrice(driver, finishingPosition, leagueId, currentWeek) {
  const oldPrice = await prisma.driverPrice.findUnique({
    where: {
      driverId_week: {
        driverId: driver.id,
        week: currentWeek,
      },
    },
  });

  if (!oldPrice) {
    throw new Error(`No price found for driver ${driver.id} in week ${currentWeek}`);
  }

  const perfDelta = await calculatePerformanceDelta(driver, finishingPosition, leagueId, currentWeek);
  const marketPressure = await calculateMarketPressure(driver.id, leagueId, currentWeek);

  const multiplier = 1 + (perfDelta * 0.15) + (marketPressure * 0.08);
  const newPrice = Math.max(0.5, oldPrice.price * multiplier); // min price $0.5M

  // Store audit log
  await prisma.pricingAuditLog.create({
    data: {
      leagueId,
      week: currentWeek,
      driverId: driver.id,
      oldPrice: oldPrice.price,
      newPrice,
      performanceDelta: perfDelta,
      marketPressure,
    },
  });

  return newPrice;
}

/**
 * Process all race results for a week and update prices
 * Called after admin enters race results
 */
async function processPricingAfterRace(leagueId, raceWeek) {
  console.log(`Processing pricing for league ${leagueId}, week ${raceWeek}`);

  // Get all drivers in this league
  const drivers = await prisma.driver.findMany({
    include: { constructor: true },
  });

  // Get race results for this week
  const results = await prisma.raceResult.findMany({
    where: {
      leagueId,
      week: raceWeek,
    },
  });

  const resultMap = new Map(results.map(r => [r.driverId, r]));

  // Update each driver's price for NEXT week (week + 1)
  const nextWeek = raceWeek + 1;
  const priceUpdates = [];

  for (const driver of drivers) {
    const result = resultMap.get(driver.id);
    
    if (!result) {
      console.log(`No result for driver ${driver.name}, skipping price update`);
      continue;
    }

    const newPrice = await updateDriverPrice(driver, result.finishingPosition, leagueId, raceWeek);
    
    // Create price for next week
    await prisma.driverPrice.create({
      data: {
        driverId: driver.id,
        week: nextWeek,
        price: newPrice,
      },
    });

    priceUpdates.push({ driverId: driver.id, oldPrice: (await prisma.driverPrice.findUnique({
      where: { driverId_week: { driverId: driver.id, week: raceWeek } }
    })).price, newPrice });
  }

  // Update constructor prices (next week)
  // Constructor price = average of both drivers × 2.5
  for (const constructor of 
    await prisma.constructor.findMany({ include: { drivers: true } })) {
    
    const driverPrices = await Promise.all(
      constructor.drivers.map(d => 
        prisma.driverPrice.findUnique({
          where: { driverId_week: { driverId: d.id, week: nextWeek } }
        })
      )
    );

    if (driverPrices.some(p => !p)) {
      console.log(`Missing driver prices for constructor ${constructor.name}`);
      continue;
    }

    const avgPrice = driverPrices.reduce((sum, p) => sum + p.price, 0) / driverPrices.length;
    const constructorPrice = avgPrice * 2.5;

    await prisma.constructorPrice.create({
      data: {
        constructorId: constructor.id,
        week: nextWeek,
        price: constructorPrice,
      },
    });

    // Also log it
    const oldConstructorPrice = await prisma.constructorPrice.findUnique({
      where: { constructorId_week: { constructorId: constructor.id, week: raceWeek } }
    });

    await prisma.pricingAuditLog.create({
      data: {
        leagueId,
        week: raceWeek,
        constructorId: constructor.id,
        oldPrice: oldConstructorPrice?.price || 0,
        newPrice: constructorPrice,
        performanceDelta: 0,
        marketPressure: 0,
      },
    });
  }

  console.log(`Pricing updated for ${priceUpdates.length} drivers`);
  return priceUpdates;
}

module.exports = {
  processPricingAfterRace,
  updateDriverPrice,
  calculatePerformanceDelta,
  calculateMarketPressure,
  getExpectedPosition,
  F1_POINTS,
};
