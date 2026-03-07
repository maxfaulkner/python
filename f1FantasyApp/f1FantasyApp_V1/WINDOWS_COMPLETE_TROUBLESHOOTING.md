# Windows Complete Troubleshooting Guide

Having issues getting Fantasy F1 League running on Windows? This guide covers all common problems and solutions.

---

## Quick Diagnostic

Before troubleshooting, run these commands to see what's installed:

```bash
node --version
npm --version
psql --version
git --version
```

Note which ones fail or show old versions. Then find your issue below.

---

## Issue #1: psql Command Not Found

**Symptom:** `bash: psql: command not found` even though PostgreSQL is installed

**Solution:** See **WINDOWS_FIX_PSQL_NOT_FOUND.md** (detailed guide)

**Quick fix:**
1. Find your PostgreSQL path: `C:\Program Files\PostgreSQL\16\bin`
2. Use full path: `"C:\Program Files\PostgreSQL\16\bin\psql" --version`
3. OR add to Windows PATH (permanent fix)

---

## Issue #2: npm Command Not Found

**Symptom:** `bash: npm: command not found` or `npm: command not found`

**Solution:**

### Step 1: Node.js Installed?
Check: `node --version`
- If works: npm should work too (restart Command Prompt)
- If fails: Node.js not installed

### Step 2: Restart Command Prompt
1. Close Command Prompt completely
2. Open a NEW Command Prompt
3. Try again: `npm --version`

### Step 3: Add Node.js to PATH
If still not working:
1. Right-click Start → System
2. Advanced system settings
3. Environment Variables
4. Edit "Path" in System variables
5. Add: `C:\Program Files\nodejs`
6. Click OK, restart Command Prompt

### Step 4: Reinstall Node.js
If still failing:
1. Uninstall Node.js (Control Panel → Programs)
2. Restart computer
3. Download fresh from https://nodejs.org/
4. Reinstall, make sure "Add to PATH" is checked
5. Restart Command Prompt

---

## Issue #3: PostgreSQL Not Running

**Symptom:** `psql: could not connect to server` or `connection refused`

**Solution:**

### Step 1: Check Service Status
1. Press `Win + R`
2. Type: `services.msc`
3. Find "postgresql-x64-16" (or your version)
4. If Status is not "Running", right-click → Start

### Step 2: Start PostgreSQL
```bash
# If you have admin access
net start postgresql-x64-16
```

### Step 3: Set to Auto-Start
1. Open services.msc
2. Right-click postgresql service
3. Properties → Startup type: Automatic
4. Click OK

### Step 4: Full Restart
1. Restart your Windows computer
2. PostgreSQL will auto-start
3. Try: `psql -U postgres`

---

## Issue #4: Database Connection Failed

**Symptom:** `createdb: error: could not connect to database template1`

**Solution:**

### Step 1: Is PostgreSQL Running?
Check services.msc first (see Issue #3)

### Step 2: Wrong Password?
If you forgot your postgres password:
1. Open services.msc
2. Right-click postgresql service
3. Properties → Log On tab
4. Update the password
5. Restart the service

Or reinstall PostgreSQL and remember the password this time.

### Step 3: Port Conflict?
Another PostgreSQL might be running:
```bash
# Check what's using port 5432
netstat -ano | findstr :5432
```

If something is there, either stop it or use a different port.

---

## Issue #5: Port 3000 Already in Use

**Symptom:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**

### Step 1: Find What's Using Port 3000
```bash
netstat -ano | findstr :3000
```

### Step 2: Kill the Process
Note the PID (last column) from above command:
```bash
taskkill /PID [PID] /F
```

Replace [PID] with the number.

### Step 3: Or Use Different Port
Edit `.env`:
```env
PORT=3001
```

Then start server again.

---

## Issue #6: npm install Fails

**Symptom:** `npm ERR! ` messages during npm install

**Solution:**

### Step 1: Clear Cache
```bash
npm cache clean --force
```

### Step 2: Delete and Retry
```bash
# Remove node_modules and lock file
rmdir /s /q node_modules
del package-lock.json

# Try again
npm install
```

### Step 3: Check Internet
- Close other applications using bandwidth
- Try on a different network if possible
- Use wired connection if available

### Step 4: Run as Administrator
- Right-click Command Prompt
- Select "Run as administrator"
- Try: `npm install`

### Step 5: Reinstall Node.js
```bash
npm cache clean --force
# Uninstall Node.js (Control Panel → Programs)
# Restart computer
# Install fresh from nodejs.org
```

---

## Issue #7: .env File Not Working

**Symptom:** Environment variables don't load or `.env` is treated as text file

**Solution:**

### Step 1: Create Correctly
In Command Prompt (NOT in Notepad):
```bash
copy .env.example .env
```

Or use VS Code:
1. Open VS Code in your project folder
2. Right-click → New File
3. Name it `.env` (exactly)
4. Paste content from `.env.example`
5. Edit with your PostgreSQL password

### Step 2: Make Sure It's Not .env.txt
Check file properties:
1. Right-click the file
2. Properties
3. Under "Type of file", it should say "ENV File" not "Text Document"
4. If it says "Text Document", rename it

From Command Prompt:
```bash
rename .env.txt .env
```

### Step 3: Make Sure It's in Right Place
```bash
# Should be in root of project folder
# Same level as package.json, server.js, etc.
dir /a | find ".env"
```

---

## Issue #8: Migrate or Seed Fails

**Symptom:** `npm run migrate` or `npm run seed` gives errors

**Solution:**

### Step 1: Database Connection
Check .env DATABASE_URL is correct:
```env
DATABASE_URL="postgresql://fantasy_f1_user:YourPassword@localhost:5432/fantasy_f1"
```

Replace `YourPassword` with your actual postgres password.

### Step 2: Database Exists
Connect and check:
```bash
psql -U postgres
\l
# Shows list of databases
# Look for "fantasy_f1"
\q
```

### Step 3: Reset Everything
```bash
# Drop and recreate database (CAREFUL - deletes data!)
psql -U postgres -c "DROP DATABASE IF EXISTS fantasy_f1;"
psql -U postgres -c "CREATE DATABASE fantasy_f1;"

# Now migrate and seed
npm run migrate
npm run seed
```

---

## Issue #9: Server Starts But API Returns Errors

**Symptom:** Server runs but `http://localhost:3000/health` gives errors

**Solution:**

### Step 1: Check the Error Message
Look at console output where you ran `npm run dev`
The error usually explains the problem.

### Step 2: Database Connection Issue
Most common. Check:
- PostgreSQL is running (services.msc)
- .env has correct password
- `psql -U fantasy_f1_user -d fantasy_f1` works

### Step 3: Check Console for Details
```bash
# If you're in Command Prompt where server runs
# You should see error messages
# Look for "Error:" or "failed"
```

### Step 4: Restart Everything
1. Stop server (Ctrl + C)
2. Check PostgreSQL is running
3. Restart server: `npm run dev`

---

## Issue #10: Can't Connect to PostgreSQL in Code

**Symptom:** `error: role "fantasy_f1_user" does not exist`

**Solution:**

### Step 1: Create the User
```bash
psql -U postgres

# In psql:
CREATE USER fantasy_f1_user WITH PASSWORD 'YourPassword';
ALTER ROLE fantasy_f1_user CREATEDB;
\q
```

### Step 2: Create the Database
```bash
createdb -U fantasy_f1_user -h localhost fantasy_f1
```

### Step 3: Update .env
Make sure .env has matching credentials:
```env
DATABASE_URL="postgresql://fantasy_f1_user:YourPassword@localhost:5432/fantasy_f1"
```

---

## Issue #11: Windows Defender Blocking Installation

**Symptom:** Installation fails with security warning

**Solution:**

### Step 1: Allow Installation
Click "More info" → "Run anyway"

### Step 2: Add Exception
1. Open Windows Defender
2. Virus & threat protection
3. Manage settings
4. Add exception for PostgreSQL or Node.js installer folder

### Step 3: Disable Temporarily
Not recommended, but if needed:
1. Search "Windows Security"
2. Virus & threat protection
3. Turn off Real-time protection (temporary)
4. Install
5. Turn Real-time protection back on

---

## Issue #12: Git Bash vs Command Prompt

**Symptom:** Some commands work in Git Bash but not Command Prompt, or vice versa

**Solution:**

Use **Command Prompt (cmd)** for this project:
1. Press `Win + R`
2. Type: `cmd`
3. Press Enter
4. Use Command Prompt, not PowerShell or Git Bash

Reason: PostgreSQL tools work best with Command Prompt on Windows.

---

## Issue #13: Permission Denied Errors

**Symptom:** `EACCES: permission denied` or `Access Denied`

**Solution:**

### Step 1: Run as Administrator
1. Right-click Command Prompt
2. Click "Run as administrator"
3. Try again

### Step 2: Check File Permissions
1. Right-click project folder
2. Properties → Security
3. Your user should have Full Control
4. Click Edit if needed

### Step 3: Disable Antivirus
Temporarily disable antivirus and try again.

---

## Systematic Troubleshooting

If nothing above works, try this systematic approach:

### Step 1: Verify Installation
```bash
node --version       # Should be v16+
npm --version        # Should be v8+
psql --version       # Should show version
git --version        # Should show version
```

Write down what each returns.

### Step 2: Test Each Component
```bash
# Test Node.js
node -e "console.log('Node works')"

# Test npm
npm list --depth=0

# Test PostgreSQL connection
psql -U postgres -c "SELECT 1"

# Test database user
psql -U fantasy_f1_user -c "SELECT 1"
```

Which one fails? That's where the problem is.

### Step 3: Check File Permissions
Make sure your project folder is not read-only:
1. Right-click project folder
2. Properties → General tab
3. Make sure "Read-only" is NOT checked
4. Click Apply

### Step 4: Restart Everything
1. Close Command Prompt
2. Close PostgreSQL (services.msc)
3. Restart Windows
4. Start from beginning

---

## Getting Help

If you're stuck:

1. **Copy the error message** - Exact text is important
2. **Google it** - Most Windows errors have solutions online
3. **Check these guides:**
   - WINDOWS_FIX_PSQL_NOT_FOUND.md (psql issues)
   - WINDOWS_PREREQUISITES.md (installation issues)
   - SETUP_GUIDE.md (setup issues)
   - QUICK_REFERENCE.md (API issues)

---

## Common Error Messages and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `psql: command not found` | PostgreSQL not in PATH | Add to PATH or use full path |
| `npm: command not found` | Node.js not in PATH | Restart Command Prompt or reinstall Node |
| `ECONNREFUSED` | PostgreSQL not running | Start service in services.msc |
| `password authentication failed` | Wrong password in .env | Update .env with correct password |
| `EADDRINUSE` | Port 3000 in use | Use different port or kill process |
| `npm ERR!` | npm cache corrupted | Run `npm cache clean --force` |
| `EACCES: permission denied` | File permissions issue | Run as administrator |
| `role does not exist` | Database user not created | Create user with psql |

---

## Prevention Tips

To avoid issues:

1. **Use Command Prompt** - Not PowerShell
2. **Run as Administrator** - Right-click, "Run as administrator"
3. **Close completely** - Close and reopen Command Prompt after changes
4. **Restart after changes** - After editing .env or PATH
5. **Keep PostgreSQL running** - Check services.msc
6. **Check internet** - For npm install
7. **Use simple passwords** - No special characters in PostgreSQL password
8. **Keep backups** - Before uninstalling anything

---

## When All Else Fails

### Nuclear Option: Clean Reinstall

1. Uninstall everything:
   - Node.js (Control Panel → Programs)
   - PostgreSQL (Control Panel → Programs)
   - Git (Control Panel → Programs)

2. Restart computer

3. Reinstall in order:
   - Node.js (check "Add to PATH")
   - PostgreSQL (remember password!)
   - Git (optional)

4. Restart Command Prompt

5. Follow SETUP_GUIDE.md from scratch

---

## Support Resources

- **PostgreSQL Help:** https://www.postgresql.org/support/
- **Node.js Help:** https://nodejs.org/en/docs/
- **npm Help:** https://docs.npmjs.com/
- **Windows Help:** https://support.microsoft.com/en-us/

---

## Still Stuck?

1. Document the error exactly
2. Check if it's in this guide
3. Search Google with the exact error message
4. Post in dev communities with:
   - Your error message
   - Output of `node --version`, `npm --version`, `psql --version`
   - Your operating system version

---

**Last Updated:** March 7, 2026
**Covers:** Windows 10/11
**Issues:** 13 common problems + solutions
**Status:** Comprehensive ✅
