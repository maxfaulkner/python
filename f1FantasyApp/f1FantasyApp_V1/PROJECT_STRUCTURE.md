# Fantasy F1 League - Project Structure

```
fantasy-f1-league/
│
├── 📄 package.json              # Dependencies and scripts
├── 📄 .env.example              # Environment variables template
├── 📄 server.js                 # Express server entry point
├── 📄 prisma.js                 # Prisma client initialization
├── 📄 schema.prisma             # Database schema (Prisma)
│
├── 📄 README.md                 # Project overview and features
├── 📄 SETUP_GUIDE.md            # Complete setup instructions
├── 📄 QUICK_REFERENCE.md        # API and pricing algorithm reference
│
├── 📁 middleware/
│   └── auth.js                  # JWT authentication middleware
│
├── 📁 routes/
│   └── api.js                   # All REST API endpoints
│
├── 📁 services/
│   ├── f1DataService.js         # Ergast API integration + retries
│   ├── pricingEngine.js         # Pricing calculation algorithm
│   └── mailer.js                # Email notifications service
│
├── 📁 jobs/
│   └── weeklyRaceImportJob.js   # Scheduled cron jobs
│
├── 📁 scripts/
│   └── seedDatabase.js          # Initial data seeding (drivers, prices)
│
└── 📁 frontend/
    └── components/
        ├── TeamPicker.jsx       # Team selection UI
        ├── Leaderboard.jsx      # Season standings display
        └── AdminRaceEntry.jsx   # Manual race result entry form
```

---

## Key Files Explained

### Core Application

**`server.js`** (Main Entry Point)
- Initializes Express server
- Sets up middleware (CORS, JSON parsing)
- Starts scheduled jobs
- Handles graceful shutdown
- **Run with:** `npm start` or `npm run dev`

**`schema.prisma`** (Database Schema)
- Defines all 13 database tables
- User, League, Driver, Constructor entities
- Weekly team selection tracking
- Race results and pricing history
- **Commands:** `npm run migrate`, `npm run prisma:generate`

---

### Business Logic

**`services/pricingEngine.js`** (Pricing Algorithm)
- `processPricingAfterRace()` - Main function called after each race
- `updateDriverPrice()` - Calculates new price based on performance + market
- `calculatePerformanceDelta()` - How well did they do vs expectation?
- `calculateMarketPressure()` - How many teams picked them?
- **Key Formula:**
  ```
  newPrice = oldPrice × (1 + performanceDelta × 0.15 + marketPressure × 0.08)
  ```

**`services/f1DataService.js`** (F1 Data Integration)
- `fetchRaceResultsWithRetries()` - 5 attempts with staggered delays
- `fetchRaceResults()` - Calls Ergast API
- `processRaceResults()` - Stores results in database
- `mapF1DriverToLocal()` - Maps F1 API IDs to your database drivers
- **Retry Schedule:** 0m, 9m, 20m, 34m, 51m (not uniform to avoid rate limits)

**`services/mailer.js`** (Email Service)
- `sendAdminNotification()` - Alert admin when race import fails
- `sendTeamPickReminder()` - Weekly "pick your team" emails
- `sendWeeklyRecap()` - (Optional) Post-race stats email
- **Supports:** Gmail, SendGrid, or any SMTP service

---

### Scheduled Tasks

**`jobs/weeklyRaceImportJob.js`** (Cron Jobs)
- `startWeeklyRaceImportJob()` - Runs every Monday 9:00 AM
- `processLeagueRaceImport()` - Processes single league
- `triggerRaceImportNow()` - Manual trigger for testing
- **Flow:** Try API → (fail 5x) → notify admin → wait for manual entry

---

### API Routes

**`routes/api.js`** (REST Endpoints)

**Team Management:**
- `GET /api/leagues/:id/team/:week` - Get user's current team
- `POST /api/leagues/:id/team/:week` - Submit/update team

**Pricing:**
- `GET /api/leagues/:id/prices/:week` - All prices for the week

**Leaderboard:**
- `GET /api/leagues/:id/leaderboard` - Season standings (ranked by points, tie-broken by wins)

**Admin:**
- `POST /api/admin/races/:id/:week` - Manually enter race results

**Authentication:**
- `POST /auth/register` - Create account
- `POST /auth/login` - Get JWT token

---

### Database Initialization

**`scripts/seedDatabase.js`** (Data Seeding)
- Loads all 2024 F1 drivers and constructors
- Calculates initial prices based on championship points
- Applies 10% rookie discount
- Creates week 2 pricing (starting race)
- **Run with:** `npm run seed`
- **Modified Data:** 2024 standings → 2025 season (adjust as needed)

---

### Frontend Components

**`frontend/components/TeamPicker.jsx`**
- User selects 5 drivers + 1 constructor
- Real-time budget tracking
- Search/filter drivers by name
- Price display with visual feedback
- Submit button with validation

**`frontend/components/Leaderboard.jsx`**
- Display all users ranked by points
- Show tie-breaker (wins)
- Medal icons for top 3
- Sort automatically (points desc, then wins desc)

**`frontend/components/AdminRaceEntry.jsx`**
- Form grouped by constructor
- Input fields for finishing positions
- 1-20 position selector
- DNF handled (blank = didn't finish)
- Calculates F1 points automatically on backend

---

## Data Flow

### Team Submission Flow

```
User selects drivers/constructor in TeamPicker.jsx
    ↓
POST /api/leagues/:id/team/:week
    ↓
validate (5 drivers, 1 constructor, budget ≤ 100M)
    ↓
Fetch current prices from database
    ↓
Calculate total cost
    ↓
Create/update UserWeeklyTeam in database
    ↓
Clear old selections, insert new ones
    ↓
Return success + budget summary
    ↓
TeamPicker shows confirmation message
```

### Race Results Flow

```
Admin submits results via AdminRaceEntry.jsx
    ↓
POST /api/admin/races/:id/:week
    ↓
Validate each result (driverId, position)
    ↓
Delete any existing results (allow re-entry)
    ↓
processRaceResults():
  - Calculate F1 points (25 for 1st, 18 for 2nd, etc.)
  - Store in RaceResult table
  - Calculate constructor points (sum of drivers)
  - Store in ConstructorRaceResult table
    ↓
processPricingAfterRace():
  - For each driver:
    - Calculate expected position
    - Calculate performance delta
    - Calculate market pressure
    - Derive new price for next week
    - Log to audit table
  - For each constructor:
    - Average driver prices × 2.5
    - Create price for next week
    ↓
Unlock teams for next week
    ↓
Send team-pick reminder emails to all users
    ↓
Return success summary
```

### Weekly Pricing Recalculation

```
Monday 9:00 AM (weeklyRaceImportJob)
    ↓
For each league:
  ├─ Try Ergast API (attempt 1)
  ├─ Wait 9 min
  ├─ Try again (attempt 2)
  ├─ Wait 20 min
  ├─ Try again (attempt 3)
  ├─ ... (up to 5 attempts)
  ├─ If success: processRaceResults() + processPricingAfterRace()
  └─ If all fail: Send email to admin, wait for manual entry
```

---

## Configuration & Environment

**Critical Environment Variables:**

```env
DATABASE_URL          # PostgreSQL connection string
JWT_SECRET           # Long random string for token signing
EMAIL_USER           # Sender's email address
EMAIL_PASSWORD       # App-specific password (not real password!)
ADMIN_EMAIL          # Where to send failure alerts
FRONTEND_URL         # Where frontend is hosted
```

**Optional:**

```env
PORT                 # Server port (default 3000)
NODE_ENV             # development or production
BASE_URL             # Base URL for email links
EMAIL_SERVICE        # gmail, sendgrid, etc.
```

---

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Database migrates successfully
- [ ] Seed script completes
- [ ] Can register new user
- [ ] Can login and get token
- [ ] Can fetch prices for a week
- [ ] Can submit a valid team
- [ ] Pricing recalculates after race entry
- [ ] Leaderboard displays correctly
- [ ] Team locks/unlocks work
- [ ] Emails send (check SMTP logs)

---

## Common Modifications

### Change Starting Race

In `scripts/seedDatabase.js`:
```javascript
const startingWeek = 2;  // Change this to 1, 3, etc.
```

Then re-run: `npm run seed`

### Adjust Pricing Weights

In `services/pricingEngine.js`:
```javascript
// Currently: 0.15 for performance, 0.08 for market
const multiplier = 1 + (perfDelta * 0.15) + (marketPressure * 0.08);

// Change these to experiment:
const multiplier = 1 + (perfDelta * 0.20) + (marketPressure * 0.10);
```

### Modify Budget

Currently: `const budget = 100;` (millions)

Change in:
- `routes/api.js` - validation
- Frontend components - display
- Database schema (optional: make it configurable per league)

### Add More Email Templates

In `services/mailer.js`:
```javascript
async function sendMyNewEmail(userEmail, options) {
  const htmlContent = `...`;
  await transporter.sendMail({...});
}
```

---

## Performance Considerations

**Database Queries:**
- Add indexes on frequently queried fields (already done for most)
- Consider caching prices (Redis) if league grows large

**Email Sending:**
- Currently synchronous; consider queue (Bull, RabbitMQ) for production
- Batch emails if many users

**Pricing Calculation:**
- Currently runs weekly for all drivers; should be efficient enough
- Could be optimized with database batch operations

**API Response Times:**
- Leaderboard calculation is O(n*m) (users × weeks); consider caching

---

## Deployment Checklist

Before going live:

- [ ] Change `NODE_ENV` to `production`
- [ ] Set strong `JWT_SECRET`
- [ ] Enable HTTPS (SSL certificate)
- [ ] Set up production email service
- [ ] Configure CORS for production domain
- [ ] Test race import 5-retry flow
- [ ] Set up monitoring/alerting
- [ ] Backup database regularly
- [ ] Document admin procedures

---

This is your foundation! Build on top of it. 🏁
