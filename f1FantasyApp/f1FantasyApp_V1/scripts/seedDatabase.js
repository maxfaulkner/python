// scripts/seedDatabase.js
const prisma = require('../prisma');

// 2026 F1 Season — Mercedes dominant with new regulations
// Cadillac joins as 11th team, Audi replaces Sauber
// Budget check: Mercedes ($40M) + Russell ($24M) + Norris ($22M) + Verstappen ($21M) = $107M > $100M
const DRIVERS_2026 = [
  // McLaren
  { f1Id: 'norris',         name: 'Lando Norris',         constructorName: 'McLaren',      skillTier: 1.15, isRookie: false, price: 22.0 },
  { f1Id: 'piastri',        name: 'Oscar Piastri',        constructorName: 'McLaren',      skillTier: 1.10, isRookie: false, price: 20.0 },

  // Red Bull
  { f1Id: 'max_verstappen', name: 'Max Verstappen',       constructorName: 'Red Bull',     skillTier: 1.20, isRookie: false, price: 21.0 },
  { f1Id: 'hadjar',         name: 'Isack Hadjar',         constructorName: 'Red Bull',     skillTier: 1.02, isRookie: false, price: 15.0 },

  // Ferrari
  { f1Id: 'leclerc',        name: 'Charles Leclerc',      constructorName: 'Ferrari',      skillTier: 1.12, isRookie: false, price: 18.0 },
  { f1Id: 'hamilton',       name: 'Lewis Hamilton',       constructorName: 'Ferrari',      skillTier: 1.10, isRookie: false, price: 17.0 },

  // Mercedes
  { f1Id: 'russell',        name: 'George Russell',       constructorName: 'Mercedes',     skillTier: 1.18, isRookie: false, price: 24.0 },
  { f1Id: 'antonelli',      name: 'Andrea Kimi Antonelli',constructorName: 'Mercedes',     skillTier: 1.00, isRookie: false, price: 19.0 },

  // Aston Martin
  { f1Id: 'alonso',         name: 'Fernando Alonso',      constructorName: 'Aston Martin', skillTier: 1.05, isRookie: false, price:  9.0 },
  { f1Id: 'stroll',         name: 'Lance Stroll',         constructorName: 'Aston Martin', skillTier: 0.85, isRookie: false, price:  6.0 },

  // Williams
  { f1Id: 'sainz',          name: 'Carlos Sainz',         constructorName: 'Williams',     skillTier: 1.08, isRookie: false, price: 11.0 },
  { f1Id: 'albon',          name: 'Alexander Albon',      constructorName: 'Williams',     skillTier: 1.05, isRookie: false, price: 10.0 },

  // Alpine
  { f1Id: 'gasly',          name: 'Pierre Gasly',         constructorName: 'Alpine',       skillTier: 1.05, isRookie: false, price:  7.0 },
  { f1Id: 'colapinto',      name: 'Franco Colapinto',     constructorName: 'Alpine',       skillTier: 0.92, isRookie: false, price:  6.0 },

  // Haas
  { f1Id: 'bearman',        name: 'Oliver Bearman',       constructorName: 'Haas',         skillTier: 1.00, isRookie: false, price:  7.0 },
  { f1Id: 'ocon',           name: 'Esteban Ocon',         constructorName: 'Haas',         skillTier: 0.95, isRookie: false, price:  6.0 },

  // RB (Racing Bulls)
  { f1Id: 'lawson',         name: 'Liam Lawson',          constructorName: 'RB',           skillTier: 0.95, isRookie: false, price: 10.0 },
  { f1Id: 'arvid_lindblad', name: 'Arvid Lindblad',       constructorName: 'RB',           skillTier: 0.88, isRookie: true,  price:  8.0 },

  // Audi (formerly Sauber)
  { f1Id: 'bortoleto',      name: 'Gabriel Bortoleto',    constructorName: 'Audi',         skillTier: 0.95, isRookie: false, price: 11.0 },
  { f1Id: 'hulkenberg',     name: 'Nico Hulkenberg',      constructorName: 'Audi',         skillTier: 1.05, isRookie: false, price:  9.0 },

  // Cadillac (new team)
  { f1Id: 'perez',          name: 'Sergio Perez',         constructorName: 'Cadillac',     skillTier: 0.95, isRookie: false, price:  6.0 },
  { f1Id: 'bottas',         name: 'Valtteri Bottas',      constructorName: 'Cadillac',     skillTier: 0.90, isRookie: false, price:  5.0 },
];

const CONSTRUCTORS_2026 = [
  { name: 'Mercedes',      price: 40.0 },
  { name: 'McLaren',       price: 35.0 },
  { name: 'Red Bull',      price: 30.0 },
  { name: 'Ferrari',       price: 28.0 },
  { name: 'Williams',      price: 18.0 },
  { name: 'RB',            price: 15.0 },
  { name: 'Audi',          price: 14.0 },
  { name: 'Aston Martin',  price: 13.0 },
  { name: 'Alpine',        price: 10.0 },
  { name: 'Haas',          price: 10.0 },
  { name: 'Cadillac',      price:  8.0 },
];

async function seedDatabase() {
  console.log('Seeding 2026 season...\n');

  try {
    // Clear all old data first
    console.log('Clearing old data...');
    await prisma.constructorRaceResult.deleteMany();
    await prisma.raceResult.deleteMany();
    await prisma.userWeeklyTeamDriver.deleteMany();
    await prisma.userWeeklyTeamConstructor.deleteMany();
    await prisma.userWeeklyTeam.deleteMany();
    await prisma.driverPrice.deleteMany();
    await prisma.constructorPrice.deleteMany();
    await prisma.driver.deleteMany();
    await prisma.constructor.deleteMany();
    console.log('Done.\n');

    const startingWeek = 1;
    const constructorMap = {};

    console.log('Creating constructors...');
    for (const c of CONSTRUCTORS_2026) {
      const f1Id = c.name.toLowerCase().replace(/\s+/g, '_');
      const constructor = await prisma.constructor.upsert({
        where: { f1Id },
        update: { name: c.name },
        create: { f1Id, name: c.name },
      });
      constructorMap[c.name] = { constructor, price: c.price };
      console.log(`  + ${c.name}`);
    }

    console.log('\nCreating drivers...');
    const driverMap = {};

    for (const d of DRIVERS_2026) {
      const { constructor } = constructorMap[d.constructorName];
      const driver = await prisma.driver.upsert({
        where: { f1Id: d.f1Id },
        update: { name: d.name, constructorId: constructor.id, isRookie: d.isRookie, skillTier: d.skillTier },
        create: { f1Id: d.f1Id, name: d.name, constructorId: constructor.id, isRookie: d.isRookie, skillTier: d.skillTier },
      });
      driverMap[d.f1Id] = driver;
      console.log(`  + ${d.name} (${d.constructorName})`);
    }

    console.log('\nCreating prices...');
    for (const d of DRIVERS_2026) {
      await prisma.driverPrice.upsert({
        where: { driverId_week: { driverId: driverMap[d.f1Id].id, week: startingWeek } },
        update: { price: d.price },
        create: { driverId: driverMap[d.f1Id].id, week: startingWeek, price: d.price },
      });
    }
    for (const c of CONSTRUCTORS_2026) {
      const { constructor } = constructorMap[c.name];
      await prisma.constructorPrice.upsert({
        where: { constructorId_week: { constructorId: constructor.id, week: startingWeek } },
        update: { price: c.price },
        create: { constructorId: constructor.id, week: startingWeek, price: c.price },
      });
    }

    console.log('\nDatabase seeded successfully!');
    console.log(`   - ${CONSTRUCTORS_2026.length} constructors`);
    console.log(`   - ${DRIVERS_2026.length} drivers`);
    console.log(`   - Starting week: ${startingWeek}`);

  } catch (error) {
    console.error('Seed failed:', error);
    throw error;
  }
}

seedDatabase()
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
