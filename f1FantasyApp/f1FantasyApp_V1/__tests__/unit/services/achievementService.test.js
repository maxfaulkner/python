// __tests__/unit/services/achievementService.test.js
const prisma = require('../../../prisma');
const { unlockAchievement, checkAchievementsAfterRace } = require('../../../services/achievementService');

describe('unlockAchievement', () => {
  test('creates an achievement and notification for a valid type', async () => {
    prisma.achievement.upsert.mockResolvedValue({});
    prisma.notification.create.mockResolvedValue({});

    await unlockAchievement('user1', 'first_win', 'league1');

    expect(prisma.achievement.upsert).toHaveBeenCalledTimes(1);
    const upsertArg = prisma.achievement.upsert.mock.calls[0][0];
    expect(upsertArg.create.userId).toBe('user1');
    expect(upsertArg.create.type).toBe('first_win');
    expect(upsertArg.create.title).toBe('First Win');

    expect(prisma.notification.create).toHaveBeenCalledTimes(1);
    const notifArg = prisma.notification.create.mock.calls[0][0].data;
    expect(notifArg.type).toBe('achievement');
    expect(notifArg.title).toMatch(/first win/i);
  });

  test('does nothing for an unknown achievement type', async () => {
    await unlockAchievement('user1', 'made_up_achievement', 'league1');
    expect(prisma.achievement.upsert).not.toHaveBeenCalled();
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  test('uses empty string as leagueId when none provided', async () => {
    prisma.achievement.upsert.mockResolvedValue({});
    prisma.notification.create.mockResolvedValue({});
    await unlockAchievement('user1', 'veteran');
    const where = prisma.achievement.upsert.mock.calls[0][0].where;
    expect(where.userId_type_leagueId.leagueId).toBe('');
  });

  test('silently ignores P2002 duplicate constraint errors', async () => {
    const dupError = Object.assign(new Error('Unique constraint'), { code: 'P2002' });
    prisma.achievement.upsert.mockRejectedValue(dupError);
    // Should not throw
    await expect(unlockAchievement('user1', 'first_win', 'lg1')).resolves.toBeUndefined();
  });

  test('does NOT silence non-P2002 errors (but still does not throw)', async () => {
    const dbError = Object.assign(new Error('DB error'), { code: 'P5000' });
    prisma.achievement.upsert.mockRejectedValue(dbError);
    // unlockAchievement catches and logs — should not throw
    await expect(unlockAchievement('user1', 'first_win', 'lg1')).resolves.toBeUndefined();
  });
});

describe('checkAchievementsAfterRace', () => {
  function setupBaseLeagueAndTeams() {
    const league = { id: 'lg1', name: 'Test League', startingRound: 1 };
    const team = {
      id: 'team1',
      userId: 'user1',
      captainId: 'driver1',
      chipUsed: null,
      budgetUsed: 90.0,
      drivers: [{ driverId: 'driver1' }],
      constructors: [{ constructorId: 'ctor1' }],
    };
    prisma.league.findUnique.mockResolvedValue(league);
    prisma.userWeeklyTeam.findMany.mockResolvedValue([team]);
    prisma.raceResult.findMany.mockResolvedValue([{ points: 25, finishingPosition: 1 }]);
    prisma.constructorRaceResult.findFirst.mockResolvedValue({ totalPoints: 20 });
    prisma.achievement.count.mockResolvedValue(0);
    prisma.userWeeklyTeam.count.mockResolvedValue(1);
    prisma.raceResult.findFirst.mockResolvedValue({ finishingPosition: 1 });
    prisma.leagueMessage.count.mockResolvedValue(0);
    prisma.achievement.upsert.mockResolvedValue({});
    prisma.notification.create.mockResolvedValue({});
    return { league, team };
  }

  test('returns early if league not found', async () => {
    prisma.league.findUnique.mockResolvedValue(null);
    await checkAchievementsAfterRace('lg1', 1);
    expect(prisma.userWeeklyTeam.findMany).not.toHaveBeenCalled();
  });

  test('awards first_win when rank 1 and no previous wins', async () => {
    setupBaseLeagueAndTeams();
    prisma.achievement.count.mockResolvedValue(0); // no prior wins

    await checkAchievementsAfterRace('lg1', 1);

    const upsertCalls = prisma.achievement.upsert.mock.calls.map(c => c[0].create.type);
    expect(upsertCalls).toContain('first_win');
  });

  test('does NOT award first_win if user already has a win', async () => {
    setupBaseLeagueAndTeams();
    prisma.achievement.count.mockResolvedValue(1); // already has win

    await checkAchievementsAfterRace('lg1', 1);

    const upsertCalls = prisma.achievement.upsert.mock.calls.map(c => c[0].create.type);
    expect(upsertCalls).not.toContain('first_win');
  });

  test('awards podium_finish for rank <= 3', async () => {
    setupBaseLeagueAndTeams();
    await checkAchievementsAfterRace('lg1', 1);
    const types = prisma.achievement.upsert.mock.calls.map(c => c[0].create.type);
    expect(types).toContain('podium_finish');
  });

  test('awards rocket_start when user leads after round 1', async () => {
    setupBaseLeagueAndTeams();
    await checkAchievementsAfterRace('lg1', 1); // week 1 == startingRound
    const types = prisma.achievement.upsert.mock.calls.map(c => c[0].create.type);
    expect(types).toContain('rocket_start');
  });

  test('awards perfect_round when score >= 80', async () => {
    const league = { id: 'lg1', name: 'Test League', startingRound: 1 };
    const team = {
      id: 'team1', userId: 'user1', captainId: 'driver1', chipUsed: null,
      budgetUsed: 90.0,
      drivers: [{ driverId: 'driver1' }],
      constructors: [{ constructorId: 'ctor1' }],
    };
    prisma.league.findUnique.mockResolvedValue(league);
    prisma.userWeeklyTeam.findMany.mockResolvedValue([team]);
    // 60 pts from race + 25 pts from constructor = 85 total → perfect round
    prisma.raceResult.findMany.mockResolvedValue([{ points: 60, finishingPosition: 1 }]);
    prisma.constructorRaceResult.findFirst.mockResolvedValue({ totalPoints: 25 });
    prisma.achievement.count.mockResolvedValue(0);
    prisma.userWeeklyTeam.count.mockResolvedValue(1);
    prisma.raceResult.findFirst.mockResolvedValue(null);
    prisma.leagueMessage.count.mockResolvedValue(0);
    prisma.achievement.upsert.mockResolvedValue({});
    prisma.notification.create.mockResolvedValue({});

    await checkAchievementsAfterRace('lg1', 1);
    const types = prisma.achievement.upsert.mock.calls.map(c => c[0].create.type);
    expect(types).toContain('perfect_round');
  });

  test('awards big_spender when budget >= 99.9', async () => {
    const league = { id: 'lg1', name: 'Test League', startingRound: 1 };
    const team = {
      id: 'team1', userId: 'user1', captainId: null, chipUsed: null,
      budgetUsed: 100.0, // full budget
      drivers: [{ driverId: 'd1' }], constructors: [],
    };
    prisma.league.findUnique.mockResolvedValue(league);
    prisma.userWeeklyTeam.findMany.mockResolvedValue([team]);
    prisma.raceResult.findMany.mockResolvedValue([{ points: 10, finishingPosition: 5 }]);
    prisma.constructorRaceResult.findFirst.mockResolvedValue(null);
    prisma.achievement.count.mockResolvedValue(1);
    prisma.userWeeklyTeam.count.mockResolvedValue(1);
    prisma.raceResult.findFirst.mockResolvedValue(null);
    prisma.leagueMessage.count.mockResolvedValue(0);
    prisma.achievement.upsert.mockResolvedValue({});
    prisma.notification.create.mockResolvedValue({});

    await checkAchievementsAfterRace('lg1', 1);
    const types = prisma.achievement.upsert.mock.calls.map(c => c[0].create.type);
    expect(types).toContain('big_spender');
  });

  test('awards veteran after 10 rounds played', async () => {
    setupBaseLeagueAndTeams();
    prisma.userWeeklyTeam.count.mockResolvedValue(10); // 10 rounds played

    await checkAchievementsAfterRace('lg1', 1);
    const types = prisma.achievement.upsert.mock.calls.map(c => c[0].create.type);
    expect(types).toContain('veteran');
  });

  test('awards captain_call when captain finishes P1', async () => {
    setupBaseLeagueAndTeams();
    // findFirst is the captain P1 check
    prisma.raceResult.findFirst.mockResolvedValue({ finishingPosition: 1 });

    await checkAchievementsAfterRace('lg1', 1);
    const types = prisma.achievement.upsert.mock.calls.map(c => c[0].create.type);
    expect(types).toContain('captain_call');
  });

  test('awards social_butterfly for 10+ chat messages', async () => {
    setupBaseLeagueAndTeams();
    prisma.leagueMessage.count.mockResolvedValue(10);

    await checkAchievementsAfterRace('lg1', 1);
    const types = prisma.achievement.upsert.mock.calls.map(c => c[0].create.type);
    expect(types).toContain('social_butterfly');
  });
});
