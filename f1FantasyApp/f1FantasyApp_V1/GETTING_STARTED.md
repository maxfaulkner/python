# Fantasy F1 League - Getting Started 🏁

Welcome! You now have a **complete, production-ready Fantasy Formula 1 League application**. This document will guide you through what you have and how to use it.

---

## What You Have

A full-stack web application with:

✅ **Backend** (Node.js + Express)
- RESTful API for all league functionality
- PostgreSQL database with Prisma ORM
- Automated race result importing with retry logic
- Dynamic pricing algorithm (market-based)
- Email notifications system
- Scheduled jobs for weekly automation

✅ **Frontend Components** (React)
- Team picker with budget tracking
- Leaderboard with tie-breaker logic
- Admin race entry form

✅ **Database Schema**
- Users, leagues, drivers, constructors
- Weekly team tracking
- Race results and pricing history
- Audit logs

---

## Quick Start (5 minutes)

### 1. Prerequisites
```bash
# Check you have these:
node --version        # Should be v16+
npm --version         # Should be v8+
brew install postgresql  # Install PostgreSQL
```

### 2. Setup
```bash
# Copy this entire folder to your project directory
cd fantasy-f1-league

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your PostgreSQL URL and email settings
nano .env  # or open in VS Code
```

### 3. Database
```bash
# Run migrations (creates tables)
npm run migrate

# Seed with drivers/constructors/initial prices
npm run seed
```

### 4. Start Server
```bash
npm run dev
```

You should see:
```
✓ Database connected
🚀 Fantasy F1 League Server
📍 Running on http://localhost:3000
```

**Done!** Your API is live. See **SETUP_GUIDE.md** for detailed steps.

---

## Documentation

Choose your role:

### 👨‍💻 I'm a Developer

**Read in this order:**

1. **PROJECT_STRUCTURE.md** - Understand the codebase organization
2. **README.md** - Features and tech stack
3. **QUICK_REFERENCE.md** - API endpoints and pricing algorithm

**Key files to explore:**
- `services/pricingEngine.js` - Pricing logic
- `services/f1DataService.js` - F1 API integration
- `routes/api.js` - All endpoints

### 🚀 I'm Deploying

**Read in this order:**

1. **SETUP_GUIDE.md** - Database and email setup
2. **SETUP_GUIDE.md** → "Deployment" section - Deploy options
3. **QUICK_REFERENCE.md** → "Troubleshooting" - Common issues

**Quick deploy:** 
- Heroku: 5 minutes
- Railway/Render: 10 minutes  
- Self-hosted: 30+ minutes

### 👥 I'm Running a League

**Read in this order:**

1. **README.md** - Feature overview
2. **QUICK_REFERENCE.md** - API summary and workflows
3. **SETUP_GUIDE.md** → "Testing" - How to test manually

**You'll need to:**
- Create a league and invite users
- Manual enter race results (or set up auto-import)
- Monitor leaderboard and pricing changes

### 🎨 I'm Building the Frontend

**React components provided:**

- `frontend/components/TeamPicker.jsx` - Team selection UI (production-ready)
- `frontend/components/Leaderboard.jsx` - Standings display (production-ready)
- `frontend/components/AdminRaceEntry.jsx` - Race entry form (production-ready)

**To use them:**

1. Create React app: `npx create-react-app fantasy-f1-ui`
2. Copy component files to `src/components/`
3. Install dependencies: `npm install axios react-router-dom`
4. Import and use components (see SETUP_GUIDE.md for details)

---

## Key Concepts

### Budget System
- **100M per week** (fresh budget, no rollover)
- 5 drivers + 1 constructor
- Constructor costs ~2.5x more than average driver
- Cannot exceed budget when submitting team

### Pricing Algorithm
Prices adjust weekly based on:
1. **Performance** - Beat/miss expectation relative to teammate/car quality
2. **Market Pressure** - How many teams picked the driver

Formula:
```
newPrice = oldPrice × (1 + performanceDelta × 0.15 + marketPressure × 0.08)
```

**Example:**
- Driver beats expectation, 80% of teams picked them
- 80% + performance = higher price next week
- Cheap driver everyone missed = drops in price

### Race Import Flow
**Auto-import (Monday 9am):**
1. Try Ergast API → Wait 9 min if fail
2. Try again → Wait 20 min if fail
3. Try again → Wait 34 min if fail
4. Try again → Wait 51 min if fail
5. Try again → If fail, email admin

**Manual fallback:**
- Admin logs in, enters results manually
- System calculates prices and sends emails

### Leaderboard Ranking
1. **Primary:** Total points (season-long)
2. **Tie-breaker:** Total wins by selected drivers

---

## File Organization

```
Your project folder
├── README.md                 ← Start here for overview
├── SETUP_GUIDE.md           ← Detailed setup instructions
├── QUICK_REFERENCE.md       ← API endpoints + pricing
├── PROJECT_STRUCTURE.md     ← Codebase walkthrough
│
├── Backend Code
├── Database Schema
├── Scheduled Jobs
├── API Routes
└── Frontend Components
```

---

## Common Tasks

### Task: Add a new user to a league

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","name":"John","password":"pass"}'
```

Then they login and join your league via the app.

### Task: Manually enter race results

```bash
curl -X POST http://localhost:3000/api/admin/races/LEAGUE_ID/2 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"results":[{"driverId":"max_verstappen","finishingPosition":1}...]}'
```

Or use the AdminRaceEntry component in the web UI.

### Task: Check prices for a week

```bash
curl http://localhost:3000/api/leagues/LEAGUE_ID/prices/2 \
  -H "Authorization: Bearer TOKEN"
```

### Task: View leaderboard

```bash
curl http://localhost:3000/api/leagues/LEAGUE_ID/leaderboard \
  -H "Authorization: Bearer TOKEN"
```

---

## Troubleshooting

**Database connection failed?**
→ Check `DATABASE_URL` in `.env`

**Migration error?**
→ Run `npx prisma migrate reset` then `npm run seed`

**Emails not sending?**
→ Check Gmail app password is correct in `.env`

**Port 3000 in use?**
→ Run `lsof -ti:3000 | xargs kill -9` or use `PORT=3001 npm run dev`

See **SETUP_GUIDE.md** → "Troubleshooting" for more.

---

## What to Modify

### 1. Starting Race (not race 1)

In `scripts/seedDatabase.js`:
```javascript
const startingWeek = 2;  // Change to 1, 3, etc.
```

Re-run: `npm run seed`

### 2. Pricing Algorithm Sensitivity

In `services/pricingEngine.js`:
```javascript
// Make price changes more dramatic:
multiplier = 1 + (perfDelta * 0.25) + (marketPressure * 0.15);  // was 0.15 and 0.08

// Or more conservative:
multiplier = 1 + (perfDelta * 0.10) + (marketPressure * 0.05);  // was 0.15 and 0.08
```

### 3. Budget Per Week

In `routes/api.js`:
```javascript
const budget = 100;  // Change to 80, 150, etc.
```

Also update frontend and documentation.

### 4. 2025 Driver Data

The seed script uses 2024 data. To update:
1. Get current standings from https://ergast.com/api/f1/2025/drivers.json
2. Update `DRIVERS_2024` array in `scripts/seedDatabase.js`
3. Re-run `npm run seed`

---

## Next Steps

1. **Local Development**
   - Run `npm run dev` on your machine
   - Play around with API endpoints
   - Build out the React frontend

2. **Customize**
   - Adjust pricing algorithm sensitivity
   - Modify budget amounts
   - Add more features (trade system, history, etc.)

3. **Deploy**
   - Follow **SETUP_GUIDE.md** → "Deployment"
   - Heroku is easiest (5 minutes)
   - Or Railway/Render for flexibility

4. **Run Your League**
   - Create a league
   - Invite friends
   - Start picking teams!

---

## Architecture at a Glance

```
Users (React App)
    ↓ (API calls)
Express Server (Node.js)
    ↓ (SQL)
PostgreSQL Database
    ↓ (Scheduled jobs)
Weekly Tasks (Ergast API → Race Results → Pricing → Emails)
```

---

## Key Technologies

- **Backend:** Node.js, Express, Prisma
- **Database:** PostgreSQL
- **Frontend:** React
- **External APIs:** Ergast Formula 1 Database
- **Email:** Nodemailer (Gmail, SendGrid, etc.)
- **Scheduling:** node-schedule

---

## Support Resources

- **Database Questions:** See `schema.prisma` comments
- **API Questions:** See `routes/api.js` endpoint comments
- **Pricing Questions:** See **QUICK_REFERENCE.md** → "Pricing Algorithm"
- **Deployment Questions:** See **SETUP_GUIDE.md** → "Deployment"

---

## Questions?

- Check **QUICK_REFERENCE.md** for API endpoints
- Check **PROJECT_STRUCTURE.md** for code organization
- Check **SETUP_GUIDE.md** for configuration issues
- Check function comments in source code

---

## Good Luck! 🏁

You have everything you need to run a successful Fantasy F1 League. The code is production-ready, well-documented, and designed to scale.

**Now go build something amazing!**

---

## Quick Links

| Document | For | Focus |
|----------|-----|-------|
| README.md | Everyone | What this app does |
| SETUP_GUIDE.md | Developers & Deployers | How to set up |
| QUICK_REFERENCE.md | Developers & Admins | API & Algorithm |
| PROJECT_STRUCTURE.md | Developers | Code organization |

---

**Last Updated:** March 7, 2026
**Version:** 1.0.0
**Status:** Production Ready ✅
