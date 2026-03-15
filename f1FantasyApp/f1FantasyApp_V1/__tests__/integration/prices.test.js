// __tests__/integration/prices.test.js
// Regression tests for GET /api/leagues/:leagueId/prices/:week
// Bug: PriceWatch.jsx was reading d.currentPrice, d.id, d.name which don't
// exist on the response — the correct fields are d.price, d.driverId, d.driver.name.
// These tests lock in the exact response shape so a backend change that breaks
// the field names will be caught before it reaches production.

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const prisma = require('../../prisma');

const SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';
function auth() {
  return { Authorization: `Bearer ${jwt.sign({ id: 'user1', email: 't@t.com' }, SECRET)}` };
}

describe('GET /api/leagues/:leagueId/prices/:week — response shape', () => {
  beforeEach(() => {
    prisma.driverPrice.findMany.mockResolvedValue([
      {
        driverId: 'driver1',
        week: 1,
        price: 12.5,
        driver: {
          id: 'driver1',
          name: 'Max Verstappen',
          constructor: { id: 'ctor1', name: 'Red Bull' },
        },
      },
      {
        driverId: 'driver2',
        week: 1,
        price: 10.0,
        driver: {
          id: 'driver2',
          name: 'Lando Norris',
          constructor: { id: 'ctor2', name: 'McLaren' },
        },
      },
    ]);
    prisma.constructorPrice.findMany.mockResolvedValue([
      {
        constructorId: 'ctor1',
        week: 1,
        price: 28.0,
        constructor: { id: 'ctor1', name: 'Red Bull', drivers: [] },
      },
    ]);
    // isRoundLocked check
    prisma.userWeeklyTeam.findFirst = jest.fn().mockResolvedValue(null);
  });

  test('200: returns prices for the requested week', async () => {
    const res = await request(app)
      .get('/api/leagues/lg1/prices/1')
      .set(auth());
    expect(res.status).toBe(200);
  });

  test('response top-level shape has drivers, constructors, week, totalBudget', async () => {
    const res = await request(app)
      .get('/api/leagues/lg1/prices/1')
      .set(auth());
    expect(res.body).toHaveProperty('drivers');
    expect(res.body).toHaveProperty('constructors');
    expect(res.body).toHaveProperty('week', 1);
    expect(res.body).toHaveProperty('totalBudget', 100);
    expect(Array.isArray(res.body.drivers)).toBe(true);
    expect(Array.isArray(res.body.constructors)).toBe(true);
  });

  // Regression: PriceWatch.jsx was reading d.id and d.currentPrice which are
  // undefined — the correct fields are driverId and price.
  test('driver entries expose driverId and price (not id / currentPrice)', async () => {
    const res = await request(app)
      .get('/api/leagues/lg1/prices/1')
      .set(auth());
    const driver = res.body.drivers[0];
    // Correct fields
    expect(driver).toHaveProperty('driverId');
    expect(driver).toHaveProperty('price');
    expect(typeof driver.price).toBe('number');
    // Wrong fields must NOT exist (would silently give undefined in the UI)
    expect(driver.currentPrice).toBeUndefined();
    expect(driver.id).toBeUndefined();
  });

  // Regression: PriceWatch.jsx was reading d.name directly — it must come
  // from the nested driver.name field.
  test('driver entries include nested driver.name and driver.constructor.name', async () => {
    const res = await request(app)
      .get('/api/leagues/lg1/prices/1')
      .set(auth());
    const driver = res.body.drivers[0];
    expect(driver.driver).toBeDefined();
    expect(driver.driver.name).toBe('Max Verstappen');
    expect(driver.driver.constructor).toBeDefined();
    expect(driver.driver.constructor.name).toBe('Red Bull');
    // driver.name must NOT exist at the top level
    expect(driver.name).toBeUndefined();
  });

  // Regression: same issue for constructors — PriceWatch read c.id and c.currentPrice.
  test('constructor entries expose constructorId and price (not id / currentPrice)', async () => {
    const res = await request(app)
      .get('/api/leagues/lg1/prices/1')
      .set(auth());
    const ctor = res.body.constructors[0];
    expect(ctor).toHaveProperty('constructorId');
    expect(ctor).toHaveProperty('price');
    expect(typeof ctor.price).toBe('number');
    expect(ctor.currentPrice).toBeUndefined();
    expect(ctor.id).toBeUndefined();
  });

  test('constructor entries include nested constructor.name', async () => {
    const res = await request(app)
      .get('/api/leagues/lg1/prices/1')
      .set(auth());
    const ctor = res.body.constructors[0];
    expect(ctor.constructor).toBeDefined();
    expect(ctor.constructor.name).toBe('Red Bull');
    // Top-level name must NOT exist
    expect(ctor.name).toBeUndefined();
  });

  test('401: requires authentication', async () => {
    const res = await request(app).get('/api/leagues/lg1/prices/1');
    expect(res.status).toBe(401);
  });
});
