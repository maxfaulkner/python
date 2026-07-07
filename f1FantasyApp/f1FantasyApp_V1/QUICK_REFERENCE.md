# Fantasy F1 League - Quick Reference Guide

## API Endpoints Summary

### Authentication

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | `{email, name, password}` | Create new user account |
| POST | `/auth/login` | `{email, password}` | Get JWT token |

**All other endpoints require:** `Authorization: Bearer {token}` header

---

### Leagues

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/leagues` | `{name, season, startingRound, adminEmail}` | Create a league |
| GET | `/api/leagues/:id` | - | Get league details |
| POST | `/api/leagues/:id/join` | - | Join a league |
| GET | `/api/leagues/:id/members` | - | List league members |

---

### Team Selection

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| GET | `/api/leagues/:id/team/:week` | - | Get your current team for week |
| POST | `/api/leagues/:id/team/:week` | `{drivers: [], constructorId}` | Submit/update team |
| DELETE | `/api/leagues/:id/team/:week` | - | Clear your team selection |

**Team Body Example:**

```json
{
  "drivers": [
    "max_verstappen",
    "hamilton", 
    "leclerc",
    "norris",
    "piastri"
  ],
  "constructorId": "mercedes"
}
```

---

### Pricing

| Method | Endpoint | Returns | Description |
|--------|----------|---------|-------------|
| GET | `/api/leagues/:id/prices/:week` | All drivers & constructors + prices | Get all prices for a week |
| GET | `/api/leagues/:id/drivers` | All drivers with history | Get driver list |
| GET | `/api/leagues/:id/constructors` | All constructors with history | Get constructor list |

---

### Leaderboard

| Method | Endpoint | Returns | Description |
|--------|----------|---------|-------------|
| GET | `/api/leagues/:id/leaderboard` | Ranked standings | Get season standings |
| GET | `/api/leagues/:id/leaderboard/:week` | Weekly standings | Get week-only standings |

**Leaderboard Response:**

```json
[
  {
    "rank": 1,
    "userId": "user-123",
    "userName": "John Doe",
    "email": "john@example.com",
    "totalPoints": 450,
    "totalWins": 3
  },
  ...
]
```

---

### Race Results (Admin)

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| GET | `/admin/races/:id/:week` | - | Get form for manual entry |
| POST | `/api/admin/races/:id/:week` | `{results: []}` | Submit race results |

**Results Body Format:**

```json
{
  "results": [
    {"driverId": "max_verstappen", "finishingPosition": 1},
    {"driverId": "hamilton", "finishingPosition": 2},
    {"driverId": "leclerc", "finishingPosition": 3},
    ...
  ]
}
```

---

## Weekly Workflow

### Sunday Evening (Race Completes)
- Race finishes
- Results available from Ergast API or manual entry

### Monday 9:00 AM
- Auto-import job attempts race results
- 5 attempts with 9, 20, 34, 51 minute delays between retries
- If all fail → admin notified via email

### Monday (Results Posted)
1. Race results stored in database
2. **Pricing calculated for next week**
3. Teams unlocked for next week
4. Email sent to all users: "Time to pick your team!"

### Tuesday - Thursday
- Users log in and select their team
- 5 drivers + 1 constructor for $100M budget

### Friday (Next Race Week)
- First practice starts
- Teams automatically lock
- Users can no longer modify selections

### Sunday
- Cycle repeats

---

## Pricing Algorithm Explained

### Problem
Drivers in top cars (Mercedes, Ferrari) naturally get higher points. How do we account for this?

**Solution:** Prices adjust based on performance relative to expectations.

---

### Step 1: Establish Baseline Expectation

For each driver, calculate expected finishing position:

```
expectedPosition = constructorAveragePosition / driverSkillTier

Example:
- Mercedes average position: 5
- Hamilton skill tier: 1.15 (15% better than teammate)
- Expected position: 5 / 1.15 = 4.3 (round to 4)

If Hamilton finishes 4th: beats expectation ✓
If Hamilton finishes 6th: misses expectation ✗
```

**Skill Tiers (relative to teammate):**
- Max Verstappen: 1.20 (best)
- Lewis Hamilton: 1.15
- Charles Leclerc: 1.12
- ...
- Rookie drivers: -10% (e.g., 0.9)

---

### Step 2: Calculate Performance Delta

```
positionDelta = actualPosition - expectedPosition
normalizedDelta = positionDelta / 5  // scale to [-1, 1]
performanceDelta = -normalizedDelta   // flip so positive = good
```

**Examples:**

```
Driver beats expectation by 3 positions:
  positionDelta = -3
  normalizedDelta = -0.6
  performanceDelta = +0.6 ✓ (good)

Driver misses expectation by 2 positions:
  positionDelta = +2
  normalizedDelta = +0.4
  performanceDelta = -0.4 ✗ (bad)
```

---

### Step 3: Calculate Market Pressure

```
selectionRate = driversSelected / totalTeams

Example: 5 teams selected a driver, 10 teams total
  selectionRate = 5 / 10 = 0.5 (50%)

marketPressure = (selectionRate - 0.5) * 2
  = (0.5 - 0.5) * 2 = 0

If 8/10 teams picked the driver:
  selectionRate = 0.8
  marketPressure = (0.8 - 0.5) * 2 = +0.6 (more popular)

If 2/10 teams picked the driver:
  selectionRate = 0.2
  marketPressure = (0.2 - 0.5) * 2 = -0.6 (less popular)
```

---

### Step 4: Calculate New Price

```
multiplier = 1 + (performanceDelta × 0.15) + (marketPressure × 0.08)
newPrice = oldPrice × multiplier

Minimum price: $0.5M
```

**Examples:**

```
Driver A: Beats expectation (+0.6), 80% selection rate (+0.6)
  multiplier = 1 + (0.6 × 0.15) + (0.6 × 0.08)
             = 1 + 0.09 + 0.048
             = 1.138
  If old price was $10M:
  newPrice = $10M × 1.138 = $11.38M ⬆️

Driver B: Misses expectation (-0.4), 10% selection rate (-0.6)
  multiplier = 1 + (-0.4 × 0.15) + (-0.6 × 0.08)
             = 1 - 0.06 - 0.048
             = 0.892
  If old price was $5M:
  newPrice = $5M × 0.892 = $4.46M ⬇️
```

---

### Constructor Pricing

Constructor price = average of both drivers × 2.5

```
Example:
- Driver 1: $10M
- Driver 2: $8M
- Average: $9M
- Constructor: $9M × 2.5 = $22.5M
```

If drivers' prices change next week, constructor price updates automatically.

---

## Leaderboard Ranking

### Primary: Total Points

Points come directly from F1 race results:
- 1st place: 25 points
- 2nd place: 18 points
- 3rd place: 15 points
- 4th place: 12 points
- ... (down to 1 point for 10th)

Users earn points for:
1. **Selected drivers** - points they score
2. **Selected constructor** - sum of both drivers' points

### Tie-Breaker: Total Wins

If two users have equal points, the one with more **driver wins** ranks higher.

**Wins = count of 1st place finishes by selected drivers**

```
Example:
- User A: 450 points, 3 wins (Hamilton 2, Norris 1)
- User B: 450 points, 2 wins (Leclerc 2)
- User A ranks higher due to tie-breaker
```

---

## Important Notes

### Budget
- **Reset weekly** (no rollover)
- Available budget: 100M per week
- Cannot submit team if cost > 100M

### Team Locks
- Lock: FP1 starts (Friday)
- Unlock: When race results posted + prices updated (Monday)
- Cannot modify team while locked

### Prices
- Only update after race results entered
- Look-ahead preview not available (prevents gaming)
- All players see same prices for same week

### Retries
If Ergast API fails:
- Retry at 0m, 9m, 20m, 34m, 51m
- Total retry window: 51 minutes
- After final failure, admin gets email
- Manual entry required if auto-import fails

---

## Test Data

After running `npm run seed`, you have:

**Drivers:** 20 total
- Max Verstappen: $15.00M (highest)
- Lance Stroll: $2.51M (lowest)
- Logan Lawson (rookie): 10% discount applied

**Constructors:** 10 total
- Mercedes: ~$22M
- Red Bull: ~$24M
- McLaren: ~$20M

**Week:** 2 (starting race)

---

## Common Questions

**Q: Can I change my team after locking?**
A: No. Teams lock when FP1 starts. You must wait until Monday when prices update.

**Q: What if a driver doesn't finish?**
A: They get 0 points. You still paid for them. Prices adjust based on performance.

**Q: Can prices go negative?**
A: No. Minimum price is $0.5M.

**Q: What if everyone picks the same driver?**
A: Price goes up (high market pressure), making them more expensive next week.

**Q: Do points reset each week?**
A: No. Points accumulate season-long. Leaderboard is cumulative.

---

## Troubleshooting API Errors

| Error | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | Missing/invalid token | Login again, copy token |
| 400 Must select exactly 5 drivers | Submitted wrong count | Adjust selections |
| 400 Team costs $120M but budget is $100M | Over budget | Remove expensive driver |
| 404 Team not found | Week doesn't exist yet | Check week number |
| 500 No price found for driver | Data mismatch | Run `npm run seed` |

---

## Files Reference

| File | Purpose |
|------|---------|
| `services/pricingEngine.js` | Pricing calculation logic |
| `services/f1DataService.js` | Ergast API integration + retries |
| `jobs/weeklyRaceImportJob.js` | Scheduled tasks |
| `routes/api.js` | All API endpoints |
| `schema.prisma` | Database schema |

---

Generated: March 7, 2026
Version: 1.0.0
