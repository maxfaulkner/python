// scripts/seedTestData.js
// Creates 50 fictional users, 10 public leagues, 5 private leagues,
// distributes users across leagues, and creates weekly teams for
// completed rounds so standings show real computed points.

const prisma = require('../prisma');
const bcrypt = require('bcrypt');

// ── Fictional users ──────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  '#e10600', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7',
  '#ec4899', '#14b8a6', '#f97316', '#64748b', '#06b6d4',
];

const USERS = [
  { name: 'Matteo Rossi',        email: 'matteo.rossi@test.com' },
  { name: 'Sofia Andersson',     email: 'sofia.andersson@test.com' },
  { name: 'Lucas Dupont',        email: 'lucas.dupont@test.com' },
  { name: 'Emma Müller',         email: 'emma.muller@test.com' },
  { name: 'Noah García',         email: 'noah.garcia@test.com' },
  { name: 'Chloe Williams',      email: 'chloe.williams@test.com' },
  { name: 'Liam O\'Brien',       email: 'liam.obrien@test.com' },
  { name: 'Aria Nakamura',       email: 'aria.nakamura@test.com' },
  { name: 'Ethan Scott',         email: 'ethan.scott@test.com' },
  { name: 'Isabella Ferreira',   email: 'isabella.ferreira@test.com' },
  { name: 'Jack Thompson',       email: 'jack.thompson@test.com' },
  { name: 'Zoe Laurent',         email: 'zoe.laurent@test.com' },
  { name: 'Oliver Bauer',        email: 'oliver.bauer@test.com' },
  { name: 'Mia Chen',            email: 'mia.chen@test.com' },
  { name: 'Harry Davies',        email: 'harry.davies@test.com' },
  { name: 'Valentina Cruz',      email: 'valentina.cruz@test.com' },
  { name: 'Sam Mitchell',        email: 'sam.mitchell@test.com' },
  { name: 'Freya Jensen',        email: 'freya.jensen@test.com' },
  { name: 'Carlos Ortega',       email: 'carlos.ortega@test.com' },
  { name: 'Yuki Tanaka',         email: 'yuki.tanaka@test.com' },
  { name: 'Ben Harrison',        email: 'ben.harrison@test.com' },
  { name: 'Layla Ahmad',         email: 'layla.ahmad@test.com' },
  { name: 'Max König',           email: 'max.konig@test.com' },
  { name: 'Isla MacDonald',      email: 'isla.macdonald@test.com' },
  { name: 'Ryan Murphy',         email: 'ryan.murphy@test.com' },
  { name: 'Nora Eriksson',       email: 'nora.eriksson@test.com' },
  { name: 'Diego Morales',       email: 'diego.morales@test.com' },
  { name: 'Amelia Foster',       email: 'amelia.foster@test.com' },
  { name: 'Tom Barker',          email: 'tom.barker@test.com' },
  { name: 'Sakura Yamamoto',     email: 'sakura.yamamoto@test.com' },
  { name: 'Alex Brennan',        email: 'alex.brennan@test.com' },
  { name: 'Camille Leconte',     email: 'camille.leconte@test.com' },
  { name: 'James Reid',          email: 'james.reid@test.com' },
  { name: 'Priya Sharma',        email: 'priya.sharma@test.com' },
  { name: 'Felix Wagner',        email: 'felix.wagner@test.com' },
  { name: 'Hannah Cooper',       email: 'hannah.cooper@test.com' },
  { name: 'Marco Bianchi',       email: 'marco.bianchi@test.com' },
  { name: 'Lily Park',           email: 'lily.park@test.com' },
  { name: 'Daniel Walsh',        email: 'daniel.walsh@test.com' },
  { name: 'Astrid Lindqvist',    email: 'astrid.lindqvist@test.com' },
  { name: 'Joe Bennett',         email: 'joe.bennett@test.com' },
  { name: 'Mei Zhou',            email: 'mei.zhou@test.com' },
  { name: 'Patrick Dubois',      email: 'patrick.dubois@test.com' },
  { name: 'Elena Kozlov',        email: 'elena.kozlov@test.com' },
  { name: 'Will Turner',         email: 'will.turner@test.com' },
  { name: 'Ananya Patel',        email: 'ananya.patel@test.com' },
  { name: 'Finn McAllister',     email: 'finn.mcallister@test.com' },
  { name: 'Rosa Delgado',        email: 'rosa.delgado@test.com' },
  { name: 'Oscar Nilsson',       email: 'oscar.nilsson@test.com' },
  { name: 'Hana Watanabe',       email: 'hana.watanabe@test.com' },
];

// ── League definitions ────────────────────────────────────────────────────────

const PUBLIC_LEAGUES = [
  { name: 'Tifosi Nation',          description: 'For the die-hard Ferrari fans',                leagueType: 'classic', maxPlayers: 20 },
  { name: 'Silver Arrows FC',       description: 'Mercedes supporters league',                   leagueType: 'classic', maxPlayers: 20 },
  { name: 'The Paddock Club',       description: 'Open to all F1 fans — top 3 wins prizes',     leagueType: 'classic', maxPlayers: 30 },
  { name: 'Apex Predators',         description: 'Head-to-head — only the best survive',         leagueType: 'h2h',     maxPlayers: 16 },
  { name: 'Rookie Racers',          description: 'First season? This is your league',            leagueType: 'classic', maxPlayers: 25 },
  { name: 'Bull Market',            description: 'Red Bull fans and value hunters',              leagueType: 'classic', maxPlayers: 20 },
  { name: 'Papaya Power',           description: 'McLaren faithful only',                        leagueType: 'classic', maxPlayers: 20 },
  { name: 'Grid Girls & Guys',      description: 'Mixed open league, all welcome',               leagueType: 'classic', maxPlayers: 50 },
  { name: 'Overtake Artists',       description: 'Points for style — H2H format',               leagueType: 'h2h',     maxPlayers: 16 },
  { name: 'The F1 Draft Masters',   description: 'Snake draft — build your dream team',         leagueType: 'draft',   maxPlayers: 12 },
];

const PRIVATE_LEAGUES = [
  { name: 'Office GP League',       description: 'Strictly for the work crew',                  leagueType: 'classic', maxPlayers: 10 },
  { name: 'Family Pit Stop',        description: 'Brothers, sisters, cousins — family only',    leagueType: 'classic', maxPlayers: 8  },
  { name: 'Uni Racing Club',        description: 'University flatmates season challenge',        leagueType: 'h2h',     maxPlayers: 8  },
  { name: 'The Podium Punters',     description: 'Friends who watched the first race together', leagueType: 'classic', maxPlayers: 6  },
  { name: 'Dark Horse Derby',       description: 'Value picks only — no top-3 constructors',   leagueType: 'classic', maxPlayers: 10 },
];

// ── Team templates: 5 drivers + 1 constructor, all within $100M budget ───────
// Prices are from initial seed (week 1). Each template is ~90-99M.

const TEAM_TEMPLATES = [
  // Russell (24) + Norris (22) + Leclerc (18) + Albon (10) + Colapinto (6) = 80 + Alpine (10) = 90
  { drivers: ['russell', 'norris', 'leclerc', 'albon', 'colapinto'], constructor: 'alpine', captain: 'russell' },
  // Verstappen (21) + Piastri (20) + Hamilton (17) + Sainz (11) + Bearman (7) = 76 + Williams (18) = 94
  { drivers: ['max_verstappen', 'piastri', 'hamilton', 'sainz', 'bearman'], constructor: 'williams', captain: 'max_verstappen' },
  // Russell (24) + Piastri (20) + Leclerc (18) + Albon (10) + Ocon (6) = 78 + Haas (10) = 88
  { drivers: ['russell', 'piastri', 'leclerc', 'albon', 'ocon'], constructor: 'haas', captain: 'piastri' },
  // Norris (22) + Verstappen (21) + Antonelli (19) + Gasly (7) + Stroll (6) = 75 + Red Bull (30) = 105 ✗
  // Norris (22) + Verstappen (21) + Hamilton (17) + Gasly (7) + Stroll (6) = 73 + Aston Martin (13) = 86
  { drivers: ['norris', 'max_verstappen', 'hamilton', 'gasly', 'stroll'], constructor: 'aston_martin', captain: 'norris' },
  // Russell (24) + Leclerc (18) + Antonelli (19) + Hulkenberg (9) + Bottas (5) = 75 + RB (15) = 90
  { drivers: ['russell', 'leclerc', 'antonelli', 'hulkenberg', 'bottas'], constructor: 'rb', captain: 'russell' },
  // Norris (22) + Piastri (20) + Antonelli (19) + Colapinto (6) + Perez (6) = 73 + Audi (14) = 87
  { drivers: ['norris', 'piastri', 'antonelli', 'colapinto', 'perez'], constructor: 'audi', captain: 'norris' },
  // Verstappen (21) + Russell (24) + Hamilton (17) + Hadjar (15) + Ocon (6) = 83 + Alpine (10) = 93 ✗ wait
  // Verstappen (21) + Hamilton (17) + Sainz (11) + Bortoleto (11) + Bearman (7) = 67 + Mercedes (40) = 107 ✗
  // Verstappen (21) + Piastri (20) + Sainz (11) + Bortoleto (11) + Colapinto (6) = 69 + RB (15) = 84
  { drivers: ['max_verstappen', 'piastri', 'sainz', 'bortoleto', 'colapinto'], constructor: 'rb', captain: 'piastri' },
  // Russell (24) + Norris (22) + Hadjar (15) + Gasly (7) + Bottas (5) = 73 + Williams (18) = 91
  { drivers: ['russell', 'norris', 'hadjar', 'gasly', 'bottas'], constructor: 'williams', captain: 'russell' },
  // Hamilton (17) + Piastri (20) + Antonelli (19) + Albon (10) + Bearman (7) = 73 + Haas (10) = 83
  { drivers: ['hamilton', 'piastri', 'antonelli', 'albon', 'bearman'], constructor: 'haas', captain: 'piastri' },
  // Norris (22) + Verstappen (21) + Bortoleto (11) + Albon (10) + Stroll (6) = 70 + Ferrari (28) = 98
  { drivers: ['norris', 'max_verstappen', 'bortoleto', 'albon', 'stroll'], constructor: 'ferrari', captain: 'norris' },
];

function pickTemplate(userIndex, week) {
  // Each user gets a template that shifts by week so picks vary across rounds
  return TEAM_TEMPLATES[(userIndex + week) % TEAM_TEMPLATES.length];
}

function randomBudget(template, drivers, constructors) {
  const driverCost = template.drivers.reduce((sum, f1Id) => {
    const d = drivers.find(x => x.f1Id === f1Id);
    return sum + (d?.priceHistory?.[0]?.price ?? 10);
  }, 0);
  const ctorEntry = constructors.find(c => c.f1Id === template.constructor);
  const ctorCost = ctorEntry?.priceHistory?.[0]?.price ?? 15;
  return +(driverCost + ctorCost).toFixed(1);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🏁 Seeding test data...\n');

  // 1. Fetch existing drivers and constructors
  const drivers = await prisma.driver.findMany({ include: { priceHistory: { orderBy: { week: 'asc' }, take: 1 } } });
  const constructors = await prisma.constructor.findMany({ include: { priceHistory: { orderBy: { week: 'asc' }, take: 1 } } });

  if (drivers.length === 0) {
    console.error('No drivers found — run seedDatabase.js first');
    process.exit(1);
  }

  const driverByF1Id = Object.fromEntries(drivers.map(d => [d.f1Id, d]));
  const ctorByF1Id   = Object.fromEntries(constructors.map(c => [c.f1Id, c]));

  // 2. Find out which rounds have race results (those are the rounds we create teams for)
  const resultRows = await prisma.raceResult.findMany({
    select: { week: true },
    distinct: ['week'],
    orderBy: { week: 'asc' },
  });
  const completedRounds = resultRows.map(r => r.week);
  console.log(`Completed rounds with results: ${completedRounds.join(', ') || 'none'}`);

  // Always include at least round 1 so teams exist even if no results yet
  const teamRounds = completedRounds.length > 0 ? completedRounds : [1];

  // 3. Get or fetch a leagueId to use as admin (we'll use the first league's admin, or create a placeholder)
  // We need one real admin email — use the first test user
  const ADMIN_EMAIL = USERS[0].email;
  const PASSWORD_HASH = await bcrypt.hash('Password123!', 10);

  // 4. Create users
  console.log('\nCreating 50 users...');
  const createdUsers = [];
  for (let i = 0; i < USERS.length; i++) {
    const u = USERS[i];
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name },
      create: {
        email: u.email,
        name: u.name,
        password: PASSWORD_HASH,
        avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
        bio: `F1 fan since ${2005 + (i % 18)}. Team: ${['Ferrari', 'Mercedes', 'Red Bull', 'McLaren', 'Williams'][i % 5]}.`,
      },
    });
    createdUsers.push(user);
    process.stdout.write('.');
  }
  console.log(`\n✓ ${createdUsers.length} users ready`);

  // 5. Create leagues
  console.log('\nCreating leagues...');
  const createdLeagues = [];

  for (const def of PUBLIC_LEAGUES) {
    const league = await prisma.league.upsert({
      where: { inviteCode: `PUB-${def.name.replace(/\s+/g, '').toUpperCase().slice(0, 8)}` },
      update: { name: def.name, description: def.description },
      create: {
        name: def.name,
        description: def.description,
        season: 2026,
        startingRound: 1,
        adminEmail: ADMIN_EMAIL,
        leagueType: def.leagueType,
        isPublic: true,
        inviteCode: `PUB-${def.name.replace(/\s+/g, '').toUpperCase().slice(0, 8)}`,
        maxPlayers: def.maxPlayers,
        budget: 100,
        transfersPerRound: 1,
        allowWildcard: true,
        allowTripleCap: true,
      },
    });
    createdLeagues.push({ ...league, userSlots: def.maxPlayers });
    console.log(`  ✓ [PUBLIC]  ${def.name}`);
  }

  for (const def of PRIVATE_LEAGUES) {
    const code = `PRV-${def.name.replace(/\s+/g, '').toUpperCase().slice(0, 8)}`;
    const league = await prisma.league.upsert({
      where: { inviteCode: code },
      update: { name: def.name, description: def.description },
      create: {
        name: def.name,
        description: def.description,
        season: 2026,
        startingRound: 1,
        adminEmail: ADMIN_EMAIL,
        leagueType: def.leagueType,
        isPublic: false,
        inviteCode: code,
        maxPlayers: def.maxPlayers,
        budget: 100,
        transfersPerRound: 1,
        allowWildcard: true,
        allowTripleCap: true,
      },
    });
    createdLeagues.push({ ...league, userSlots: def.maxPlayers });
    console.log(`  ✓ [PRIVATE] ${def.name} (code: ${code})`);
  }

  // 6. Distribute users across leagues
  console.log('\nAdding users to leagues...');
  let membershipCount = 0;

  for (let li = 0; li < createdLeagues.length; li++) {
    const league = createdLeagues[li];
    // Each league gets a different slice of users, overlapping so users appear in multiple leagues
    const sliceStart = (li * 4) % createdUsers.length;
    const sliceSize  = Math.min(league.maxPlayers, Math.max(4, Math.floor(createdUsers.length / createdLeagues.length) + 3));

    const members = [];
    for (let j = 0; j < sliceSize; j++) {
      members.push(createdUsers[(sliceStart + j) % createdUsers.length]);
    }
    // Deduplicate (can happen with small user pools)
    const seen = new Set();
    const uniqueMembers = members.filter(u => { if (seen.has(u.id)) return false; seen.add(u.id); return true; });

    for (let j = 0; j < uniqueMembers.length; j++) {
      const u = uniqueMembers[j];
      await prisma.leagueUser.upsert({
        where: { userId_leagueId: { userId: u.id, leagueId: league.id } },
        update: {},
        create: {
          userId: u.id,
          leagueId: league.id,
          role: j === 0 ? 'commissioner' : 'member',
          teamName: `${u.name.split(' ')[0]}'s Racing Team`,
        },
      });
      membershipCount++;
    }
    process.stdout.write('.');
  }
  console.log(`\n✓ ${membershipCount} memberships created`);

  // 7. Create weekly teams for each member for each completed round
  if (teamRounds.length === 0) {
    console.log('\nNo completed rounds — skipping team creation');
  } else {
    console.log(`\nCreating weekly teams for rounds: ${teamRounds.join(', ')}...`);
    let teamCount = 0;

    for (const league of createdLeagues) {
      const members = await prisma.leagueUser.findMany({ where: { leagueId: league.id } });

      for (const member of members) {
        const userIdx = createdUsers.findIndex(u => u.id === member.userId);

        for (const week of teamRounds) {
          const tmpl = pickTemplate(userIdx, week);

          // Validate all drivers/constructor exist
          const driverObjs = tmpl.drivers.map(f1Id => driverByF1Id[f1Id]).filter(Boolean);
          const ctorObj     = ctorByF1Id[tmpl.constructor];
          if (driverObjs.length < 5 || !ctorObj) continue;

          const captainDriver = driverByF1Id[tmpl.captain];
          const budgetUsed    = randomBudget(tmpl, drivers, constructors);

          // Upsert the weekly team
          const team = await prisma.userWeeklyTeam.upsert({
            where: { userId_leagueId_week: { userId: member.userId, leagueId: league.id, week } },
            update: {},
            create: {
              userId:    member.userId,
              leagueId:  league.id,
              week,
              budgetUsed,
              locked:    true,
              captainId: captainDriver?.id ?? driverObjs[0].id,
            },
          });

          // Upsert driver selections
          for (const driver of driverObjs) {
            await prisma.userWeeklyTeamDriver.upsert({
              where: { teamId_driverId: { teamId: team.id, driverId: driver.id } },
              update: {},
              create: { teamId: team.id, driverId: driver.id, pricePaidPerPoint: 0 },
            });
          }

          // Upsert constructor selection
          const existingCtor = await prisma.userWeeklyTeamConstructor.findUnique({ where: { teamId: team.id } });
          if (!existingCtor) {
            await prisma.userWeeklyTeamConstructor.create({
              data: { teamId: team.id, constructorId: ctorObj.id, pricePaidPerPoint: 0 },
            });
          }

          teamCount++;
        }
      }
      process.stdout.write('.');
    }
    console.log(`\n✓ ${teamCount} weekly teams created`);
  }

  // 8. Seed chat messages for each league
  const CHAT_MESSAGES = [
    "Anyone else think the stewards got that penalty completely wrong? 🤦",
    "I'm stacking Norris and Piastri this week. McLaren are flying.",
    "Can't believe I forgot to set my captain before lockout 😭",
    "Verstappen is not worth the money this season. Change my mind.",
    "This league is basically just whoever picks Ferrari gets free points",
    "Hamilton looking decent at Ferrari. Bit of a slow start but he'll find it",
    "Who's everyone keeping after the wildcard? I'm tempted to go full reset",
    "Russell absolutely robbed by that SC timing. 30 points gone 🫠",
    "Okay I'll say it — Antonelli is the real deal. Rookie of the year incoming",
    "Does anyone actually understand how the price changes work? Asking for a friend",
    "My captain picked up a penalty and scored nothing. Classic F1 Fantasy 💀",
    "I'm 47 points behind after round 1 and already considering deleting the app",
    "Sainz looking like a bargain at that price. Surprising form from Williams",
    "Triple captain chip — week 2 or save it for Monaco?",
    "Bortoleto has been incredible. Didn't see that coming at all 👏",
    "Tyre strategy decided that race more than pace. Good for fantasy points though",
    "I need to stop panic-transferring after every bad race result",
    "The strategy game here is genuinely more interesting than the actual races",
    "Whoever picked Haas constructor last round is an absolute genius",
    "Is there a way to see previous round team picks? I want to compare strategies",
  ];

  console.log('\nSeeding chat messages...');
  let chatMsgCount = 0;
  for (let li = 0; li < createdLeagues.length; li++) {
    const league = createdLeagues[li];
    // Skip if messages already exist (idempotent re-run)
    const existingMsgs = await prisma.leagueMessage.count({ where: { leagueId: league.id } });
    if (existingMsgs > 0) { process.stdout.write('.'); continue; }

    const leagueMembers = await prisma.leagueUser.findMany({ where: { leagueId: league.id } });
    if (leagueMembers.length === 0) continue;

    const msgCount = 8 + (li % 5); // 8–12 messages per league
    for (let i = 0; i < msgCount; i++) {
      const sender = leagueMembers[i % leagueMembers.length];
      const msgText = CHAT_MESSAGES[(li * 3 + i) % CHAT_MESSAGES.length];
      const hoursAgo = (msgCount - i) * 8; // stagger evenly over past few days
      const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

      await prisma.leagueMessage.create({
        data: {
          leagueId: league.id,
          userId: sender.userId,
          content: msgText,
          createdAt,
        },
      });
      chatMsgCount++;
    }
    process.stdout.write('.');
  }
  console.log(`\n✓ ${chatMsgCount} chat messages seeded`);

  // 9. Summary
  console.log('\n══════════════════════════════════════');
  console.log('  Test data seeded successfully!');
  console.log('══════════════════════════════════════');
  console.log(`  Users:           ${createdUsers.length}`);
  console.log(`  Public leagues:  ${PUBLIC_LEAGUES.length}`);
  console.log(`  Private leagues: ${PRIVATE_LEAGUES.length}`);
  console.log(`  Rounds covered:  ${teamRounds.join(', ')}`);
  console.log(`  Password:        Password123!`);
  console.log('\n  Invite codes for private leagues:');
  for (const def of PRIVATE_LEAGUES) {
    const code = `PRV-${def.name.replace(/\s+/g, '').toUpperCase().slice(0, 8)}`;
    console.log(`    ${def.name.padEnd(25)} → ${code}`);
  }
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
