# Fantasy F1 League - Complete Setup Guide

This guide walks you through setting up the Fantasy F1 League application from scratch.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Setup](#backend-setup)
3. [Database Setup](#database-setup)
4. [Email Configuration](#email-configuration)
5. [Frontend Setup](#frontend-setup)
6. [Running the Application](#running-the-application)
7. [Testing](#testing)
8. [Deployment](#deployment)

---

## Prerequisites

Ensure you have installed:

- **Node.js** v16+ and npm
- **PostgreSQL** 12+
- **Git**
- A code editor (VS Code recommended)

### Optional but Recommended

- **Docker** (for easy PostgreSQL setup)
- **Postman** (for API testing)

---

## Backend Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd fantasy-f1-league
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Environment File

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/fantasy_f1"

# Server
PORT=3000
NODE_ENV=development
BASE_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:3001"

# JWT
JWT_SECRET="change-this-to-a-long-random-string-in-production"

# Email (Gmail example)
EMAIL_SERVICE="gmail"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-specific-password"
EMAIL_FROM="noreply@fantasy-f1.com"

# Admin
ADMIN_EMAIL="your-admin-email@gmail.com"
```

---

## Database Setup

### Option A: Local PostgreSQL

#### On Mac (with Homebrew)

```bash
brew install postgresql
brew services start postgresql
createuser -P postgres  # Create user with password
createdb -U postgres fantasy_f1
```

#### On Linux (Ubuntu/Debian)

```bash
sudo apt-get install postgresql
sudo -u postgres createdb fantasy_f1
sudo -u postgres createuser -P fantasy_f1_user
```

#### On Windows

Download and install from https://www.postgresql.org/download/windows/

Then create the database:

```bash
psql -U postgres
CREATE DATABASE fantasy_f1;
CREATE USER fantasy_f1_user WITH PASSWORD 'your-password';
ALTER ROLE fantasy_f1_user SET client_encoding TO 'utf8';
GRANT ALL PRIVILEGES ON DATABASE fantasy_f1 TO fantasy_f1_user;
```

### Option B: Docker (Easiest)

```bash
docker run --name fantasy-f1-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=fantasy_f1 \
  -p 5432:5432 \
  -d postgres:15
```

### 3. Run Database Migrations

```bash
npm run migrate
```

This creates all tables based on `schema.prisma`.

### 4. Seed Initial Data

```bash
npm run seed
```

This populates the database with:
- All 2024 F1 drivers and constructors
- Initial pricing based on 2024 championship standings
- Rookie discounts applied automatically

**Check the seed output:**

```
✅ Database seeded successfully!

📊 Summary:
   - 10 constructors
   - 20 drivers
   - Starting week: 2
```

---

## Email Configuration

The app sends emails for:

1. **Team pick reminders** (weekly to all users)
2. **Admin notifications** (when race import fails)

### Gmail Setup (Recommended)

1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Create an App Password:
   - Go to "App passwords" (under 2-Step Verification)
   - Select "Mail" and "Windows Computer" (or your device)
   - Google generates a 16-character password
4. Paste that password in `.env` as `EMAIL_PASSWORD`

**Note:** Don't use your actual Gmail password in `.env`

### Other Email Services

If using another service (SendGrid, Mailgun, etc.), update the config in `.env`:

```env
EMAIL_SERVICE="sendgrid"  # or your provider
EMAIL_USER="api-key"
EMAIL_PASSWORD="your-api-key"
```

---

## Frontend Setup

### 1. Create React App

```bash
npx create-react-app frontend
cd frontend
```

### 2. Install Dependencies

```bash
npm install axios react-router-dom
```

### 3. Create `.env`

```env
REACT_APP_API_URL="http://localhost:3000"
```

### 4. Copy Components

Copy the components from the project:

```bash
cp ../frontend/components/*.jsx src/components/
```

### 5. Update `src/App.js`

```jsx
import React from 'react';
import TeamPicker from './components/TeamPicker';
import Leaderboard from './components/Leaderboard';
import AdminRaceEntry from './components/AdminRaceEntry';

function App() {
  const token = localStorage.getItem('token');
  const leagueId = 'your-league-id'; // You'll get this from creating a league

  return (
    <div className="App">
      <nav className="bg-red-600 text-white p-4">
        <h1>🏁 Fantasy F1 League</h1>
      </nav>

      <main>
        {/* Render based on current route */}
        <TeamPicker leagueId={leagueId} week={2} token={token} />
      </main>
    </div>
  );
}

export default App;
```

---

## Running the Application

### Terminal 1: Backend Server

```bash
npm run dev
```

You should see:

```
✓ Database connected

🚀 Fantasy F1 League Server
📍 Running on http://localhost:3000
🏁 API: http://localhost:3000/api

⏰ Initializing scheduled jobs...
✓ Weekly race import job scheduled for Mondays at 9:00 AM
```

### Terminal 2: Frontend App

```bash
cd frontend
npm start
```

Opens http://localhost:3001 in your browser.

---

## Testing

### 1. Create a User Account

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "Test User",
    "password": "secure-password"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure-password"
  }'
```

Response:

```json
{
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": { "id": "...", "email": "user@example.com", "name": "Test User" }
}
```

Copy the `token` for subsequent requests.

### 3. Create a League

```bash
curl -X POST http://localhost:3000/api/leagues \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Fantasy League",
    "season": 2025,
    "startingRound": 2,
    "adminEmail": "admin@example.com"
  }'
```

### 4. Join League

Use the returned `leagueId` to join:

```bash
curl -X POST http://localhost:3000/api/leagues/LEAGUE_ID/join \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Get Current Prices

```bash
curl -X GET http://localhost:3000/api/leagues/LEAGUE_ID/prices/2 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6. Pick a Team

```bash
curl -X POST http://localhost:3000/api/leagues/LEAGUE_ID/team/2 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "drivers": ["driver-id-1", "driver-id-2", "driver-id-3", "driver-id-4", "driver-id-5"],
    "constructorId": "constructor-id-1"
  }'
```

### 7. Manual Race Entry (Admin)

After a race completes, you can manually enter results:

```bash
curl -X POST http://localhost:3000/api/admin/races/LEAGUE_ID/2 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "results": [
      {"driverId": "max_verstappen", "finishingPosition": 1},
      {"driverId": "hamilton", "finishingPosition": 2},
      {"driverId": "leclerc", "finishingPosition": 3}
    ]
  }'
```

### 8. View Leaderboard

```bash
curl -X GET http://localhost:3000/api/leagues/LEAGUE_ID/leaderboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Deployment

### Option A: Heroku (Recommended for Quick Start)

#### 1. Install Heroku CLI

```bash
npm install -g heroku
heroku login
```

#### 2. Create Heroku App

```bash
heroku create your-app-name
```

#### 3. Add PostgreSQL

```bash
heroku addons:create heroku-postgresql:hobby-dev
```

#### 4. Set Environment Variables

```bash
heroku config:set JWT_SECRET="your-long-random-secret"
heroku config:set EMAIL_USER="your-email@gmail.com"
heroku config:set EMAIL_PASSWORD="your-app-password"
heroku config:set ADMIN_EMAIL="admin@example.com"
heroku config:set NODE_ENV="production"
```

#### 5. Deploy

```bash
git push heroku main
```

#### 6. Run Migrations

```bash
heroku run npm run migrate
heroku run npm run seed
```

#### 7. View Logs

```bash
heroku logs --tail
```

---

### Option B: Railway, Render, or Digital Ocean

These have similar setups. Key steps:

1. Connect your GitHub repo
2. Create PostgreSQL instance
3. Set environment variables
4. Deploy!

Each provider has detailed guides in their documentation.

---

### Option C: Self-Hosted (Advanced)

Requires your own server (AWS EC2, DigitalOcean, Linode, etc.)

Basic steps:

```bash
# SSH into server
ssh ubuntu@your-server-ip

# Install Node.js, PostgreSQL, etc.
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql

# Clone repo
git clone <repo>
cd fantasy-f1-league

# Setup environment, install, migrate
npm install
npm run migrate
npm run seed

# Use PM2 to keep it running
npm install -g pm2
pm2 start server.js --name "fantasy-f1"
pm2 startup
pm2 save
```

---

## Troubleshooting

### "Cannot find module '@prisma/client'"

```bash
npm install
npm run prisma:generate
```

### "Database connection failed"

Check your `DATABASE_URL` in `.env`:

```bash
psql $DATABASE_URL
```

### "Email not sending"

1. Check Gmail app password is set correctly
2. Enable "Less secure app access" if using regular password
3. Check `ADMIN_EMAIL` is valid

### "Migrations failed"

Reset and re-run:

```bash
npx prisma migrate reset
npm run seed
```

### "Port 3000 already in use"

```bash
# Kill the process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

---

## Next Steps

1. **Build the frontend** - Use the React components provided
2. **Set up team locks** - Implement FP1 session time detection
3. **Add more features**:
   - History/stats pages
   - Weekly recaps
   - Win probability calculator
   - Trade system
4. **Deploy to production**
5. **Create your league and invite friends!**

---

## Support

For issues or questions, check:

- `README.md` for general info
- API documentation in comments
- Database schema in `schema.prisma`

Good luck! 🏁
