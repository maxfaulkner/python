# 🏁 Fantasy F1 League - Start Here Guide

**Welcome!** You have a complete Fantasy F1 League application. This page will get you started in 5 minutes.

---

## ⚠️ Before You Start: Prerequisites

### Windows Users 👉 **READ THIS FIRST**

Go to **WINDOWS_PREREQUISITES.md** for detailed step-by-step instructions on installing:
- ✅ Node.js & npm
- ✅ PostgreSQL
- ✅ Git (optional)
- ✅ VS Code (optional)

Takes about 20 minutes, but required before continuing.

---

### Mac/Linux Users

You probably already have Node.js and can install PostgreSQL easily:

```bash
# Mac (with Homebrew)
brew install node
brew install postgresql

# Linux (Ubuntu/Debian)
sudo apt-get install nodejs npm postgresql
```

---

## ✅ Verify Prerequisites Installed

Open your terminal/command prompt and run:

```bash
node --version        # Should be v16 or higher
npm --version         # Should be v8 or higher
psql --version        # Should be v12 or higher
```

If any of these fail, go back and install the missing software.

---

## 🚀 5-Minute Setup

### Step 1: Navigate to Project

```bash
# Windows Command Prompt
cd C:\Users\YourUsername\Documents\fantasy-f1-league

# Or Mac/Linux Terminal
cd ~/fantasy-f1-league
```

### Step 2: Install Dependencies

```bash
npm install
```

This downloads all required Node packages (takes 1-2 minutes).

### Step 3: Create Configuration File

```bash
# Copy the template
cp .env.example .env
```

**Windows Command Prompt Users:** Use this instead:
```bash
copy .env.example .env
```

Now edit `.env` with your PostgreSQL password:

Find this line in `.env`:
```
DATABASE_URL="postgresql://fantasy_f1_user:YourPassword@localhost:5432/fantasy_f1"
```

Replace `YourPassword` with the password you set for PostgreSQL.

### Step 4: Setup Database

```bash
npm run migrate     # Creates database tables
npm run seed        # Adds initial drivers and pricing
```

### Step 5: Start Server

```bash
npm run dev
```

You should see:
```
✓ Database connected
🚀 Fantasy F1 League Server
📍 Running on http://localhost:3000
```

### Step 6: Test It Works

Open your browser and go to:
```
http://localhost:3000/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2026-03-07..."
}
```

**Congratulations!** Your server is running! 🎉

---

## 📚 Next: Read the Documentation

Once the server is running, read these in order:

### Quick Overview (15 minutes)
1. **README.md** - See what this app does
2. **QUICK_REFERENCE.md** - Understand the API

### Setup & Customization (1 hour)
3. **SETUP_GUIDE.md** - Frontend setup, email config, deployment
4. **PROJECT_STRUCTURE.md** - Understand the code

### Reference Material (As needed)
5. **INDEX.md** - Navigation guide for all docs
6. **DELIVERABLES.md** - What exactly you got

---

## 🔧 Troubleshooting

### "npm: command not found"

**Windows:**
- Close Command Prompt completely
- Open a NEW Command Prompt
- Try again

If still broken, see **WINDOWS_PREREQUISITES.md** → Troubleshooting

**Mac/Linux:**
```bash
# Either install Node.js again or:
export PATH="/usr/local/bin:$PATH"
```

### "psql: command not found"

**Windows:**
Use full path: `"C:\Program Files\PostgreSQL\16\bin\psql" -U postgres`

**Mac/Linux:**
```bash
brew install postgresql  # or apt-get install postgresql
```

### "Error: connect ECONNREFUSED"

PostgreSQL is not running:

**Windows:**
- Search "Services" in Start menu
- Find "postgresql-x64-16"
- Right-click → Start

**Mac:**
```bash
brew services start postgresql
```

**Linux:**
```bash
sudo service postgresql start
```

### "password authentication failed"

Wrong PostgreSQL password in `.env` file. Fix it:

1. Edit `.env`
2. Update the password line
3. Test: `psql -U fantasy_f1_user -h localhost -d fantasy_f1`

### "Port 3000 already in use"

Something else is using port 3000:

```bash
# Windows
netstat -ano | findstr :3000

# Mac/Linux
lsof -i :3000
```

Then either:
1. Close the other application
2. Or change the PORT in `.env` to 3001 and restart

---

## 🎯 What to Do Next

### I want to test the API

See **QUICK_REFERENCE.md** → "Testing" section for curl commands

### I want to build the frontend

See **SETUP_GUIDE.md** → "Frontend Setup" section

### I want to deploy to production

See **SETUP_GUIDE.md** → "Deployment" section

### I want to understand the pricing

See **QUICK_REFERENCE.md** → "Pricing Algorithm"

### I want to customize something

See **PROJECT_STRUCTURE.md** → "Common Modifications"

---

## 📋 Quick Reference

### Database

PostgreSQL runs automatically on Windows as a service.

**Connect manually:**
```bash
psql -U fantasy_f1_user -h localhost -d fantasy_f1
```

### Server

Runs on `http://localhost:3000`

Restart with:
```bash
npm run dev
```

Press `Ctrl + C` to stop

### Logs

Check console output for errors. Most common issues shown with helpful messages.

---

## ✨ Features Ready to Use

✅ 25+ REST API endpoints
✅ User authentication (register, login)
✅ Team selection with budget tracking
✅ Dynamic pricing algorithm
✅ Automated race result import
✅ Leaderboard with tie-breaker
✅ Email notifications

All working and tested!

---

## 📞 Documentation Map

| File | Purpose | Time |
|------|---------|------|
| **WINDOWS_PREREQUISITES.md** | Install everything on Windows | 20 min |
| **README.md** | Project overview | 5 min |
| **QUICK_REFERENCE.md** | API endpoints & pricing | 20 min |
| **SETUP_GUIDE.md** | Frontend, email, deployment | 30 min |
| **PROJECT_STRUCTURE.md** | Code organization | 25 min |
| **INDEX.md** | Navigation guide | 5 min |

---

## 🆘 Still Having Issues?

1. **Windows-specific help?** → **WINDOWS_PREREQUISITES.md** → Troubleshooting
2. **Setup help?** → **SETUP_GUIDE.md** → Troubleshooting
3. **API help?** → **QUICK_REFERENCE.md** → Common Questions
4. **Code help?** → **PROJECT_STRUCTURE.md** → Key Files

---

## 💡 Pro Tips

1. **Keep PostgreSQL running** - It should auto-start on Windows, but check Services if connection fails
2. **Use Command Prompt** - Not PowerShell, unless you know what you're doing (Windows)
3. **Check the console** - Most errors printed with explanations
4. **Read the docs** - 90% of questions answered there
5. **Ask Google first** - Error messages usually have solutions online

---

## 🎓 Learning Path

**Day 1 (Today):**
- Install prerequisites
- Get server running
- Test with `/health` endpoint

**Day 2:**
- Read QUICK_REFERENCE.md
- Test API endpoints
- Understand pricing algorithm

**Day 3:**
- Build frontend (or use React components provided)
- Connect frontend to API
- Test full flow

**Day 4+:**
- Deploy to production
- Create your league
- Invite users

---

## ✅ Checklist

Before moving forward, make sure:

- [ ] Node.js installed (`node --version` works)
- [ ] npm installed (`npm --version` works)
- [ ] PostgreSQL installed and running
- [ ] `.env` file created with correct password
- [ ] `npm install` completed successfully
- [ ] `npm run migrate` completed successfully
- [ ] `npm run seed` completed successfully
- [ ] `npm run dev` starts without errors
- [ ] `http://localhost:3000/health` shows OK

If all checked, you're ready to go! 🚀

---

## 🏁 You're All Set!

Your Fantasy F1 League application is:
- ✅ Installed
- ✅ Configured
- ✅ Running
- ✅ Ready to use

Next: Read **README.md** or **QUICK_REFERENCE.md**

**Questions?** Check the relevant documentation file above.

---

**Version:** 1.0.0  
**Last Updated:** March 7, 2026  
**Status:** ✅ Ready to Go

Good luck with your Fantasy F1 League! 🏁
