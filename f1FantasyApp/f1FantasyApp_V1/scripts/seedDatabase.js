// scripts/seedDatabase.js
const prisma = require('../prisma');
const fetch = require('node-fetch');

// 2024 F1 Drivers and Constructors (you can fetch from Ergast or hardcode)
const DRIVERS_2024 = [
  // Mercedes
  { f1Id: 'hamilton', name: 'Lewis Hamilton', constructorName: 'Mercedes', skillTier: 1.15, isRookie: false, champsPoints: 245 },
  { f1Id: 'russell', name: 'George Russell', constructorName: 'Mercedes', skillTier: 1.05, isRookie: false, champsPoints: 192 },

  // Ferrari
  { f1Id: 'leclerc', name: 'Charles Leclerc', constructorName: 'Ferrari', skillTier: 1.12, isRookie: false, champsPoints: 222 },
  { f1Id: 'sainz', name: 'Carlos Sainz', constructorName: 'Ferrari', skillTier: 1.08, isRookie: false, champsPoints: 180 },

  // Red Bull
  { f1Id: 'max_verstappen', name: 'Max Verstappen', constructorName: 'Red Bull Racing', skillTier: 1.20, isRookie: false, champsPoints: 404 },
  { f1Id: 'perez', name: 'Sergio Pérez', constructorName: 'Red Bull Racing', skillTier: 0.90, isRookie: false, champsPoints: 152 },

  // McLaren
  { f1Id: 'norris', name: 'Lando Norris', constructorName: 'McLaren', skillTier: 1.10, isRookie: false, champsPoints: 287 },
  { f1Id: 'piastri', name: 'Oscar Piastri', constructorName: 'McLaren', skillTier: 1.08, isRookie: false, champsPoints: 197 },

  // Aston Martin
  { f1Id: 'alonso', name: 'Fernando Alonso', constructorName: 'Aston Martin', skillTier: 1.05, isRookie: false, champsPoints: 62 },
  { f1Id: 'stroll', name: 'Lance Stroll', constructorName: 'Aston Martin', skillTier: 0.85, isRookie: false, champsPoints: 24 },

  // Alpine
  { f1Id: 'gasly', name: 'Pierre Gasly', constructorName: 'Alpine', skillTier: 1.00, isRookie: false, champsPoints: 40 },
  { f1Id: 'ocon', name: 'Esteban Ocon', constructorName: 'Alpine', skillTier: 0.95, isRookie: false, champsPoints: 26 },

  // Haas
  { f1Id: 'magnussen', name: 'Kevin Magnussen', constructorName: 'Haas', skillTier: 0.95, isRookie: false, champsPoints: 16 },
  { f1Id: 'hulkenberg', name: 'Nico Hulkenberg', constructorName: 'Haas', skillTier: 0.98, isRookie: false, champsPoints: 27 },

  // RB
  { f1Id: 'tsunoda', name: 'Yuki Tsunoda', constructorName: 'RB', skillTier: 0.92, isRookie: false, champsPoints: 22 },
  { f1Id: 'lawson', name: 'Liam Lawson', constructorName: 'RB', skillTier: 0.85, isRookie: true, champsPoints: 8 },

  // Williams
  { f1Id: 'albon', name: 'Alexander Albon', constructorName: 'Williams', skillTier: 1.00, isRookie: false, champsPoints: 34 },
  { f1Id: 'sargeant', name: 'Logan Sargeant', constructorName: 'Williams', skillTier: 0.80, isRookie: true, champsPoints: 0 },

  // Sauber
  { f1Id: 'bottas', name: 'Valtteri Bottas', constructorName: 'Sauber', skillTier: 0.90, isRookie: false, champsPoints: 4 },
  { f1Id: 'zhou', name: 'Guanyu Zhou', constructorName: 'Sauber', skillTier: 0.85, isRookie: false, champsPoints: 0 },
];

const CONSTRUCTORS_2024 = [
  'Mercedes',
  'Ferrari',
  'Red Bull Racing',
  'McLaren',
  'Aston Martin',
  'Alpine',
  'Haas',
  'RB',
  'Williams',
  'Sauber',
];

/**
 * Calculate initial driver price based on championship points
 * Higher points = higher price
 * Max points (Verstappen): 404
 * Formula: Base price scaled by points
 */
function calculateInitialDriverPrice(champsPoints, isRookie) {
  const maxPoints = 404;
  const minPrice = 2;
  const maxPrice = 15;
  
  const normalized = champsPoints / maxPoints;
  const basePrice = minPrice + (normalized * (maxPrice - minPrice));
  
  // Rookies are 10% cheaper
  return isRookie ? basePrice * 0.9 : basePrice;
}

async function seedDatabase() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Create constructors
    console.log('Creating constructors...');
    const constructorMap = {};

    for (const constructorName of CONSTRUCTORS_2024) {
      const constructor = await prisma.constructor.upsert({
        where: { f1Id: constructorName.toLowerCase().replace(/\s+/g, '_') },
        update: {},
        create: {
          f1Id: constructorName.toLowerCase().replace(/\s+/g, '_'),
          name: constructorName,
        },
      });
      constructorMap[constructorName] = constructor;
      console.log(`  ✓ ${constructorName}`);
    }

    // Create drivers
    console.log('\nCreating drivers...');
    const driverMap = {};
    const driversByConstructor = {};

    for (const driverData of DRIVERS_2024) {
      const constructor = constructorMap[driverData.constructorName];
      
      const driver = await prisma.driver.upsert({
        where: { f1Id: driverData.f1Id },
        update: {},
        create: {
          f1Id: driverData.f1Id,
          name: driverData.name,
          constructorId: constructor.id,
          isRookie: driverData.isRookie,
          skillTier: driverData.skillTier,
        },
      });

      driverMap[driverData.f1Id] = driver;
      
      if (!driversByConstructor[constructor.id]) {
        driversByConstructor[constructor.id] = [];
      }
      driversByConstructor[constructor.id].push({
        driver,
        champsPoints: driverData.champsPoints,
        isRookie: driverData.isRookie,
      });

      console.log(`  ✓ ${driverData.name} (${driverData.constructorName})`);
    }

    // Create initial prices for week 1 (or starting race)
    console.log('\nCreating initial driver prices...');
    const startingWeek = 2; // Starting from race 2

    for (const driverData of DRIVERS_2024) {
      const driver = driverMap[driverData.f1Id];
      const price = calculateInitialDriverPrice(driverData.champsPoints, driverData.isRookie);

      await prisma.driverPrice.create({
        data: {
          driverId: driver.id,
          week: startingWeek,
          price: parseFloat(price.toFixed(2)),
        },
      });

      console.log(`  ✓ ${driverData.name}: $${price.toFixed(2)}M`);
    }

    // Create initial constructor prices (avg of drivers × 2.5)
    console.log('\nCreating initial constructor prices...');

    for (const [constructorId, drivers] of Object.entries(driversByConstructor)) {
      const avgPrice = drivers.reduce((sum, d) => {
        return sum + calculateInitialDriverPrice(d.champsPoints, d.isRookie);
      }, 0) / drivers.length;

      const constructorPrice = avgPrice * 2.5;

      const constructor = await prisma.constructor.findUnique({
        where: { id: constructorId },
      });

      await prisma.constructorPrice.create({
        data: {
          constructorId,
          week: startingWeek,
          price: parseFloat(constructorPrice.toFixed(2)),
        },
      });

      console.log(`  ✓ ${constructor.name}: $${constructorPrice.toFixed(2)}M`);
    }

    console.log('\n✅ Database seeded successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - ${CONSTRUCTORS_2024.length} constructors`);
    console.log(`   - ${DRIVERS_2024.length} drivers`);
    console.log(`   - Starting week: ${startingWeek}`);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

// Run seed
seedDatabase()
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
