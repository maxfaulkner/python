# Fantasy F1 League 🏁

A full-stack web application for running a weekly fantasy Formula 1 league. Participants pick 5 drivers and 1 constructor each week with dynamic pricing based on performance and selection frequency.

## Features

- **Dynamic Pricing**: Driver/constructor prices adjust based on:
  - Performance vs expectation (beat/miss)
  - Market pressure (how many teams picked them)
- **Weekly Budget**: 100M per week (no rollover)
- **Points System**: Straight from F1 race results (25pts for 1st, 18 for 2nd, etc.)
- **Automatic Race Import**: Attempts to fetch results from Ergast API with 5 retries before falling back to manual entry
- **Email Notifications**: Team pick reminders and admin alerts
- **Leaderboard**: Ranked by total points, tie-broken by wins

## Tech Stack

**Backend:**
- Node.js + Express
- PostgreSQL + Prisma ORM
- node-schedule for cron jobs
- Nodemailer for emails

**Frontend:** (To be built)
- React
- Tailwind CSS
- Real-time price updates

## Setup Instructions

### 1. Clone & Install

```bash
git clone <repo>
cd fantasy-f1-league
npm install
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb fantasy_f1

# Copy env template
cp .env.example .env

# Edit .env with your DATABASE_URL
nano .env

# Run migrations
npm run migrate

# Seed with 2024 drivers/constructors
npm run seed
```

### 3. Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/fantasy_f1"
PORT=3000
JWT_SECRET="change-this-in-production"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
ADMIN_EMAIL="admin@fantasy-f1.com"
```

### 4. Start Server

```bash
npm run dev    # Development with nodemon
npm start      # Production
```

Server runs on `http://localhost:3000`

## API Documentation

### Authentication

```bash
# Register
POST /auth/register
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "secure-password"
}

# Login
POST /auth/login
{
  "email": "user@example.com",
  "password": "secure-password"
}
# Returns: { token, user }
```

All subsequent requests need `Authorization: Bearer {token}` header.

### Teams

```bash
# Get current team for week
GET /api/leagues/:leagueId/team/:week

# Submit team (5 drivers + 1 constructor)
POST /api/leagues/:leagueId/team/:week
{
  "drivers": ["driver-id-1", "driver-id-2", "driver-id-3", "driver-id-4", "driver-id-5"],
  "constructorId": "constructor-id"
}
```

### Pricing

```bash
# Get all prices for a week
GET /api/leagues/:leagueId/prices/:week
# Returns: { week, drivers, constructors, totalBudget }
```

### Leaderboard

```bash
# Get season standings
GET /api/leagues/:leagueId/leaderboard
# Returns: { rank, totalPoints, totalWins }
```

### Admin

```bash
# Get race entry form
GET /admin/races/:leagueId/:week

# Submit race results
POST /api/admin/races/:leagueId/:week
{
  "results": [
    { "driverId": "max_verstappen", "finishingPosition": 1 },
    { "driverId": "hamilton", "finishingPosition": 2 },
    ...
  ]
}
```

## Weekly Timeline

**Friday (Race Week)**
- First practice starts → Teams lock for this race

**Sunday Evening**
- Race completes

**Monday Morning**
- 9:00 AM: Auto import starts (5 retries, 9/20/34/51 min delays)
- If success: Prices update, teams unlock, emails sent
- If failed: Admin notified via email to manually enter results

**Tuesday-Thursday**
- Users pick their teams for next week

**Next Friday**
- Cycle repeats

## Database Schema

### Key Tables

- **User** - League participants
- **League** - League configuration
- **Driver** - F1 drivers with skill tiers
- **Constructor** - F1 teams
- **DriverPrice / ConstructorPrice** - Weekly pricing
- **UserWeeklyTeam** - User's selected team for a week
- **RaceResult** - F1 race results and points
- **PricingAuditLog** - Track all price changes

See `schema.prisma` for full schema.

## Pricing Algorithm

### Performance Delta
```
expectedPosition = constructorAvg / driverSkillTier
actualPosition = finishingPosition
delta = -(actualPosition - expectedPosition) / 5  // normalized to [-1, 1]
```

### Market Pressure
```
selectionRate = driversSelected / totalTeams
marketPressure = (selectionRate - 0.5) * 2
```

### New Price
```
newPrice = oldPrice × (1 + performanceDelta × 0.15 + marketPressure × 0.08)
minPrice = $0.5M, maxPrice = unlimited
```

### Constructor Price
```
constructorPrice = avg(driver1Price, driver2Price) × 2.5
```

## Features to Add Later

- [ ] Tie-breaker tracking (wins per driver)
- [ ] Historical pricing/performance charts
- [ ] Week-by-week recap emails
- [ ] Rookie bonus (10% discount on initial prices)
- [ ] Penalty system (missed picks, inactive users)
- [ ] Mobile app
- [ ] Fantasy leagues vs real leagues comparison
- [ ] Multiple leagues per user
- [ ] Live scoring during race weekend

## Development Notes

### Key Files

- `schema.prisma` - Database schema
- `services/pricingEngine.js` - Pricing algorithm
- `services/f1DataService.js` - Ergast API integration
- `jobs/weeklyRaceImportJob.js` - Scheduled tasks
- `routes/api.js` - API endpoints
- `server.js` - Express app setup

### Testing

```bash
# Manual race import (for testing)
curl -X POST http://localhost:3000/api/admin/races/{leagueId}/{week} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "results": [
      {"driverId": "max_verstappen", "finishingPosition": 1},
      {"driverId": "hamilton", "finishingPosition": 2}
    ]
  }'
```

## Troubleshooting

**Race import keeps failing?**
- Check Ergast API is online: https://ergast.com/api/f1/2025/2/results.json
- Check ADMIN_EMAIL is set and mail service configured
- Manually enter results via `/admin/races` endpoint

**Teams won't unlock?**
- Check `userWeeklyTeam.locked` is updated in database
- Verify race results were processed (`raceResults` table populated)

**Prices not updating?**
- Check `driverPrice` table has entries for next week
- Verify `processPricingAfterRace` completed successfully in logs

## License

MIT
