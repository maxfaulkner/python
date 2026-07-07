// __tests__/integration/teams.test.js
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const prisma = require('../../prisma');

const SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';

function makeToken(id = 'user1', email = 'test@example.com') {
  return jwt.sign({ id, email }, SECRET, { expiresIn: '1h' });
}

const AUTH = (id = 'user1') => ({ Authorization: `Bearer ${makeToken(id)}` });

const VALID_DRIVERS = ['d1', 'd2', 'd3', 'd4', 'd5'];
const CONSTRUCTOR_ID = 'ctor1';

describe('POST /api/leagues/:leagueId/team/:week (submit team)', () => {
  test('401: requires authentication', async () => {
    const res = await request(app).post('/api/leagues/lg1/team/1').send({});
    expect(res.status).toBe(401);
  });

  test('400: rejects fewer than 5 drivers', async () => {
    const res = await request(app)
      .post('/api/leagues/lg1/team/1')
      .set(AUTH())
      .send({ drivers: ['d1', 'd2'], constructorId: CONSTRUCTOR_ID });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/5 drivers/i);
  });

  test('400: rejects more than 5 drivers', async () => {
    const res = await request(app)
      .post('/api/leagues/lg1/team/1')
      .set(AUTH())
      .send({ drivers: ['d1', 'd2', 'd3', 'd4', 'd5', 'd6'], constructorId: CONSTRUCTOR_ID });
    expect(res.status).toBe(400);
  });

  test('400: rejects missing constructor', async () => {
    const res = await request(app)
      .post('/api/leagues/lg1/team/1')
      .set(AUTH())
      .send({ drivers: VALID_DRIVERS });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/constructor/i);
  });

  test('400: rejects captain not in driver list', async () => {
    const res = await request(app)
      .post('/api/leagues/lg1/team/1')
      .set(AUTH())
      .send({ drivers: VALID_DRIVERS, constructorId: CONSTRUCTOR_ID, captainId: 'not-in-list' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/captain must be one of/i);
  });

  test('400: rejects locked team submission', async () => {
    prisma.userWeeklyTeam.findUnique.mockResolvedValue({ locked: true });
    const res = await request(app)
      .post('/api/leagues/lg1/team/1')
      .set(AUTH())
      .send({ drivers: VALID_DRIVERS, constructorId: CONSTRUCTOR_ID });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/locked/i);
  });

  test('400: rejects when team exceeds budget', async () => {
    prisma.userWeeklyTeam.findUnique.mockResolvedValue(null); // not locked
    prisma.driverPrice.findMany.mockResolvedValue([
      { price: 20 }, { price: 20 }, { price: 20 }, { price: 20 }, { price: 20 },
    ]); // 100M drivers
    prisma.constructorPrice.findUnique.mockResolvedValue({ price: 20 }); // 20M constructor
    // Total = 120M > 100M budget

    const res = await request(app)
      .post('/api/leagues/lg1/team/1')
      .set(AUTH())
      .send({ drivers: VALID_DRIVERS, constructorId: CONSTRUCTOR_ID });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/budget/i);
  });

  test('200: submits valid team within budget', async () => {
    prisma.userWeeklyTeam.findUnique.mockResolvedValue(null);
    // Include driverId so the route's find(p => p.driverId === driverId) resolves
    prisma.driverPrice.findMany.mockResolvedValue([
      { driverId: 'd1', price: 10 }, { driverId: 'd2', price: 10 },
      { driverId: 'd3', price: 10 }, { driverId: 'd4', price: 10 },
      { driverId: 'd5', price: 10 },
    ]); // 50M drivers
    prisma.constructorPrice.findUnique.mockResolvedValue({ price: 20 }); // 20M ctor
    // Total = 70M < 100M

    const savedTeam = {
      id: 'team1', userId: 'user1', leagueId: 'lg1', week: 1,
      budgetUsed: 70, captainId: 'd1', chipUsed: null,
    };
    prisma.userWeeklyTeam.upsert.mockResolvedValue(savedTeam);
    prisma.userWeeklyTeamDriver.deleteMany.mockResolvedValue({});
    prisma.userWeeklyTeamConstructor.deleteMany.mockResolvedValue({});
    // Route uses individual create() calls per driver, not createMany
    prisma.userWeeklyTeamDriver.create.mockResolvedValue({});
    prisma.userWeeklyTeamConstructor.create.mockResolvedValue({});

    const res = await request(app)
      .post('/api/leagues/lg1/team/1')
      .set(AUTH())
      .send({ drivers: VALID_DRIVERS, constructorId: CONSTRUCTOR_ID, captainId: 'd1' });

    expect(res.status).toBe(200);
    // Route returns { message, team: { budgetUsed, ... } }
    expect(res.body.team.budgetUsed).toBe(70);
  });

  test('400: rejects already-used chip', async () => {
    prisma.userWeeklyTeam.findUnique.mockResolvedValue(null);
    prisma.driverPrice.findMany.mockResolvedValue([
      { price: 10 }, { price: 10 }, { price: 10 }, { price: 10 }, { price: 10 },
    ]);
    prisma.constructorPrice.findUnique.mockResolvedValue({ price: 10 });
    prisma.chip.findUnique.mockResolvedValue({ id: 'chip1', usedWeek: 2 }); // already used in week 2

    const res = await request(app)
      .post('/api/leagues/lg1/team/1')
      .set(AUTH())
      .send({ drivers: VALID_DRIVERS, constructorId: CONSTRUCTOR_ID, chipUsed: 'wildcard' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/chip.*already used/i);
  });
});

describe('GET /api/leagues/:leagueId/team/:week (get team)', () => {
  test('401: requires authentication', async () => {
    const res = await request(app).get('/api/leagues/lg1/team/1');
    expect(res.status).toBe(401);
  });

  test('404: team not found for the week', async () => {
    prisma.userWeeklyTeam.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .get('/api/leagues/lg1/team/1')
      .set(AUTH());
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/team not found/i);
  });

  test('200: returns team with round points enrichment', async () => {
    const team = {
      id: 'team1', userId: 'user1', leagueId: 'lg1', week: 1,
      captainId: 'd1', chipUsed: null,
      drivers: [
        { driverId: 'd1', driver: { id: 'd1', name: 'Driver 1', constructor: { name: 'Ferrari' } } },
      ],
      constructors: [
        { constructorId: 'ctor1', constructor: { id: 'ctor1', name: 'Ferrari' } },
      ],
    };
    prisma.userWeeklyTeam.findUnique.mockResolvedValue(team);
    prisma.raceResult.findMany.mockResolvedValue([{ points: 25 }]);
    prisma.constructorRaceResult.findMany.mockResolvedValue([{ totalPoints: 40 }]);

    const res = await request(app)
      .get('/api/leagues/lg1/team/1')
      .set(AUTH());

    expect(res.status).toBe(200);
    // d1 is captain → 25 pts × 2 = 50
    expect(res.body.drivers[0].roundPoints).toBe(50);
    // Constructor gets 40
    expect(res.body.constructors[0].roundPoints).toBe(40);
    // Total = 50 + 40 = 90
    expect(res.body.totalRoundPoints).toBe(90);
  });

  test('200: triple_captain chip multiplies by 3', async () => {
    const team = {
      id: 'team1', userId: 'user1', leagueId: 'lg1', week: 1,
      captainId: 'd1', chipUsed: 'triple_captain',
      drivers: [
        { driverId: 'd1', driver: { id: 'd1', name: 'Driver 1', constructor: { name: 'McLaren' } } },
      ],
      constructors: [],
    };
    prisma.userWeeklyTeam.findUnique.mockResolvedValue(team);
    prisma.raceResult.findMany.mockResolvedValue([{ points: 25 }]);
    prisma.constructorRaceResult.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/leagues/lg1/team/1')
      .set(AUTH());

    expect(res.status).toBe(200);
    expect(res.body.drivers[0].roundPoints).toBe(75); // 25 × 3
  });
});
