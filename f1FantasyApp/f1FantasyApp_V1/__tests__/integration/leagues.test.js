// __tests__/integration/leagues.test.js
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const prisma = require('../../prisma');

const SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';

function makeToken(payload = { id: 'user1', email: 'test@example.com' }) {
  return jwt.sign(payload, SECRET, { expiresIn: '1h' });
}

const AUTH = () => ({ Authorization: `Bearer ${makeToken()}` });

describe('GET /api/leagues (list my leagues)', () => {
  test('401: requires authentication', async () => {
    const res = await request(app).get('/api/leagues');
    expect(res.status).toBe(401);
  });

  test('200: returns empty array when user has no leagues', async () => {
    prisma.leagueUser.findMany.mockResolvedValue([]);
    const res = await request(app).get('/api/leagues').set(AUTH());
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('200: returns enriched league list with member count and role', async () => {
    prisma.leagueUser.findMany.mockResolvedValue([
      {
        role: 'commissioner',
        teamName: 'Red Rockets',
        totalPoints: 150,
        totalWins: 3,
        league: {
          id: 'lg1',
          name: 'My League',
          season: 2026,
          startingRound: 1,
          leagueType: 'classic',
          _count: { users: 5 },
        },
      },
    ]);

    const res = await request(app).get('/api/leagues').set(AUTH());
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('My League');
    expect(res.body[0].memberCount).toBe(5);
    expect(res.body[0].myRole).toBe('commissioner');
    expect(res.body[0].myTeamName).toBe('Red Rockets');
    expect(res.body[0].myTotalPoints).toBe(150);
  });
});

describe('POST /api/leagues (create league)', () => {
  test('401: requires authentication', async () => {
    const res = await request(app).post('/api/leagues').send({ name: 'Test', season: 2026, startingRound: 1 });
    expect(res.status).toBe(401);
  });

  test('400: rejects missing name', async () => {
    const res = await request(app)
      .post('/api/leagues')
      .set(AUTH())
      .send({ season: 2026, startingRound: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  test('400: rejects missing season', async () => {
    const res = await request(app)
      .post('/api/leagues')
      .set(AUTH())
      .send({ name: 'Test', startingRound: 1 });
    expect(res.status).toBe(400);
  });

  test('201: creates league and returns it', async () => {
    const mockLeague = {
      id: 'lg_new',
      name: 'Champions League',
      season: 2026,
      startingRound: 1,
      leagueType: 'classic',
      isPublic: false,
      inviteCode: 'ABC123',
      users: [{ userId: 'user1', role: 'commissioner' }],
    };
    prisma.league.create.mockResolvedValue(mockLeague);
    prisma.chip.createMany.mockResolvedValue({ count: 4 });

    const res = await request(app)
      .post('/api/leagues')
      .set(AUTH())
      .send({ name: 'Champions League', season: 2026, startingRound: 1 });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('lg_new');
    expect(res.body.name).toBe('Champions League');
    // Verify chips were created for the commissioner
    expect(prisma.chip.createMany).toHaveBeenCalledTimes(1);
  });
});

describe('GET /api/leagues/:leagueId (get single league)', () => {
  test('404: returns error for non-existent league', async () => {
    prisma.league.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .get('/api/leagues/nonexistent')
      .set(AUTH());
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/league not found/i);
  });

  test('200: returns league details with users', async () => {
    prisma.league.findUnique.mockResolvedValue({
      id: 'lg1',
      name: 'Test League',
      season: 2026,
      startingRound: 1,
      users: [{ user: { id: 'user1', name: 'Alice', email: 'alice@x.com' } }],
    });

    const res = await request(app)
      .get('/api/leagues/lg1')
      .set(AUTH());

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Test League');
    expect(res.body.users).toHaveLength(1);
  });
});

describe('POST /api/leagues/:leagueId/join', () => {
  test('401: requires auth', async () => {
    const res = await request(app).post('/api/leagues/lg1/join');
    expect(res.status).toBe(401);
  });

  test('404: league not found', async () => {
    prisma.league.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/leagues/nope/join')
      .set(AUTH());
    expect(res.status).toBe(404);
  });

  test('400: already a member', async () => {
    prisma.league.findUnique.mockResolvedValue({ id: 'lg1', name: 'Test', maxPlayers: 20 });
    prisma.leagueUser.findUnique.mockResolvedValue({ userId: 'user1', leagueId: 'lg1' });
    const res = await request(app)
      .post('/api/leagues/lg1/join')
      .set(AUTH());
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already a member/i);
  });

  test('200: joins league successfully', async () => {
    prisma.league.findUnique.mockResolvedValue({ id: 'lg1', name: 'Test League', maxPlayers: 20 });
    prisma.leagueUser.findUnique.mockResolvedValue(null);
    prisma.leagueUser.create.mockResolvedValue({});
    prisma.chip.createMany.mockResolvedValue({ count: 4 });

    const res = await request(app)
      .post('/api/leagues/lg1/join')
      .set(AUTH());

    expect(res.status).toBe(200);
    expect(res.body.leagueName).toBe('Test League');
    expect(prisma.chip.createMany).toHaveBeenCalledTimes(1);
  });
});

describe('POST /api/leagues/join-code/:code', () => {
  test('404: invalid invite code', async () => {
    prisma.league.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/leagues/join-code/BADCODE')
      .set(AUTH());
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/invalid invite code/i);
  });

  test('400: league is full', async () => {
    prisma.league.findUnique.mockResolvedValue({ id: 'lg1', name: 'Full', maxPlayers: 2 });
    prisma.leagueUser.count.mockResolvedValue(2);
    const res = await request(app)
      .post('/api/leagues/join-code/FULL99')
      .set(AUTH());
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/league is full/i);
  });

  test('200: joins by invite code', async () => {
    prisma.league.findUnique.mockResolvedValue({ id: 'lg1', name: 'Code League', maxPlayers: 20 });
    prisma.leagueUser.count.mockResolvedValue(3);
    prisma.leagueUser.findUnique.mockResolvedValue(null);
    prisma.leagueUser.create.mockResolvedValue({});
    prisma.chip.createMany.mockResolvedValue({ count: 4 });

    const res = await request(app)
      .post('/api/leagues/join-code/XYZ999')
      .set(AUTH());

    expect(res.status).toBe(200);
    expect(res.body.leagueName).toBe('Code League');
  });
});
