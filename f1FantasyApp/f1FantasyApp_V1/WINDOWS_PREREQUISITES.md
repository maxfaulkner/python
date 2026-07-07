# Fantasy F1 League - Windows Prerequisites Setup Guide

This guide walks you through installing all required software on Windows to run the Fantasy F1 League application.

---

## Table of Contents

1. [Node.js & npm](#nodejs--npm)
2. [PostgreSQL Database](#postgresql-database)
3. [Git (Optional but Recommended)](#git-optional-but-recommended)
4. [Code Editor](#code-editor)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)

---

## Node.js & npm

Node.js includes npm (Node Package Manager) which you'll need for the project.

### Step 1: Download Node.js

1. Go to https://nodejs.org/
2. You'll see two versions:
   - **LTS (Long Term Support)** - Recommended, currently v20.x
   - **Current** - Latest features, v21.x

   **We recommend LTS (v20 or higher)**

3. Click the LTS button to download the Windows installer (.msi file)

### Step 2: Install Node.js

1. Open the downloaded `.msi` file
2. Click "Next" to start the installer
3. **Accept the license agreement** and click "Next"
4. **Keep the default installation path** (usually `C:\Program Files\nodejs`)
5. **IMPORTANT:** On the "Custom Setup" screen, make sure these are checked:
   - ✅ `nodejs runtime` (checked by default)
   - ✅ `npm package manager` (checked by default)
   - ✅ `Add to PATH` (checked by default - this is crucial!)
6. Click "Next" then "Install"
7. If prompted by User Account Control, click "Yes" to allow changes
8. Click "Finish" when installation completes

### Step 3: Verify Node.js Installation

1. Open Command Prompt (press `Win + R`, type `cmd`, press Enter)
2. Run these commands:

```bash
node --version
npm --version
```

You should see output like:
```
v20.x.x
10.x.x
```

If you see "command not found" errors, see **Troubleshooting** section.

---

## PostgreSQL Database

PostgreSQL is the database system for this project. You have two options: install locally or use Docker.

### Option A: Local Installation (Recommended for Beginners)

#### Step 1: Download PostgreSQL

1. Go to https://www.postgresql.org/download/windows/
2. Click on the **"Interactive installer by EDB"** link
3. Download the latest version (currently v16.x)
4. Choose the Windows x86-64 version

#### Step 2: Install PostgreSQL

1. Open the downloaded `.exe` file
2. Click "Next" on the welcome screen
3. **Installation directory**: Keep default (`C:\Program Files\PostgreSQL\16`)
4. **Components to install**: Make sure all are checked:
   - ✅ PostgreSQL Server
   - ✅ pgAdmin 4
   - ✅ Stack Builder
   - ✅ Command Line Tools

5. Click "Next"
6. **Data Directory**: Keep default (`C:\Program Files\PostgreSQL\16\data`)
7. Click "Next"
8. **Password**: Set a password for the `postgres` user
   - **IMPORTANT:** Write this down! You'll need it later
   - Example: `PostgresPassword123!`
9. Click "Next"
10. **Port**: Keep as `5432` (default)
11. Click "Next"
12. **Locale**: Keep as default or select your locale
13. Click "Next" and then "Install"
14. If prompted by User Account Control, click "Yes"
15. Wait for installation to complete (may take 2-3 minutes)
16. **Uncheck "Launch Stack Builder"** if you don't need it
17. Click "Finish"

#### Step 3: Verify PostgreSQL Installation

1. Open Command Prompt
2. Run:

```bash
psql --version
```

You should see output like:
```
psql (PostgreSQL) 16.x
```

### Option B: Docker Installation (Advanced, but Easier)

If you prefer Docker, here's the quick way:

1. Install Docker Desktop from https://www.docker.com/products/docker-desktop
2. After installing Docker, open PowerShell and run:

```powershell
docker run --name fantasy-f1-db `
  -e POSTGRES_PASSWORD=password `
  -e POSTGRES_DB=fantasy_f1 `
  -p 5432:5432 `
  -d postgres:15
```

This creates a PostgreSQL container that will run in the background.

---

## Git (Optional but Recommended)

Git helps you version control your code and is useful for deployment.

### Step 1: Download Git

1. Go to https://git-scm.com/download/win
2. Click on the largest file (usually around 50MB) to download the installer
3. Or use the portable version if you prefer

### Step 2: Install Git

1. Open the downloaded `.exe` file
2. Click "Next" through the screens, keeping defaults
3. **Important screens:**
   - "Choose the default editor": Keep as "Vim" or change to "Notepad" if you prefer
   - "Adjusting your PATH environment": Select "Git from the command line and also from 3rd-party software"
   - Everything else: Keep defaults
4. Click "Install" and wait for completion
5. Click "Finish"

### Step 3: Verify Git Installation

1. Open Command Prompt
2. Run:

```bash
git --version
```

You should see output like:
```
git version 2.42.x.windows.1
```

---

## Code Editor

You'll need a text editor to edit code. Here are your options:

### Option 1: Visual Studio Code (Recommended)

**Download:**
1. Go to https://code.visualstudio.com/
2. Click "Download for Windows"
3. Open the installer and click through, keeping defaults
4. During installation, check:
   - ✅ "Add to PATH" (for command line access)
5. Launch VS Code when done

**Install Extensions:**
1. Open VS Code
2. Click the Extensions icon (left sidebar, looks like 4 squares)
3. Search for and install:
   - "Prisma" (for database schema)
   - "ES7+ React/Redux" (for frontend)
   - "REST Client" (for testing API)

### Option 2: Other Editors

- **Notepad++**: https://notepad-plus-plus.org/ (lightweight)
- **Sublime Text**: https://www.sublimetext.com/ (powerful)
- **WebStorm**: https://www.jetbrains.com/webstorm/ (paid, professional)

---

## Verification

Let's verify everything is installed correctly:

### Step 1: Create a Test Directory

1. Open Command Prompt
2. Run:

```bash
# Create a test folder
mkdir C:\test-fantasy-f1
cd C:\test-fantasy-f1

# Initialize a Node project
npm init -y

# Install a test package
npm install express
```

You should see packages downloading and installing.

### Step 2: Test PostgreSQL Connection

1. Open Command Prompt
2. Run:

```bash
psql -U postgres
```

3. You'll be prompted for the password (the one you set during installation)
4. Type your password (it won't show characters, that's normal)
5. If successful, you'll see:

```
psql (16.x)
Type "help" for help.

postgres=#
```

6. Type `\q` and press Enter to exit

### Step 3: Clean Up

```bash
# Remove the test folder
cd C:\
rmdir /s test-fantasy-f1
```

---

## Setting Environment Variables

PostgreSQL requires you to create a database user and connection. Here's how:

### Step 1: Create a Database User

1. Open Command Prompt
2. Connect to PostgreSQL:

```bash
psql -U postgres
```

3. Enter your postgres password
4. Create a new user:

```sql
CREATE USER fantasy_f1_user WITH PASSWORD 'YourSecurePassword123!';
```

5. Grant privileges:

```sql
ALTER ROLE fantasy_f1_user CREATEDB;
```

6. Exit:

```sql
\q
```

### Step 2: Create the Database

```bash
createdb -U postgres -h localhost fantasy_f1
```

Enter your postgres password when prompted.

### Step 3: Test the Connection

```bash
psql -h localhost -U fantasy_f1_user -d fantasy_f1
```

You should be able to connect. Type `\q` to exit.

---

## Complete Prerequisites Checklist

After following all steps above, verify you have:

- [ ] **Node.js v16+** (check: `node --version`)
- [ ] **npm v8+** (check: `npm --version`)
- [ ] **PostgreSQL 12+** (check: `psql --version`)
- [ ] **Git** (check: `git --version`) - optional
- [ ] **Code Editor** installed (VS Code recommended)
- [ ] **PostgreSQL running** (background service on Windows)
- [ ] **Database user created** (`fantasy_f1_user`)
- [ ] **Database created** (`fantasy_f1`)

---

## Creating Your .env File

Now that everything is installed, create your `.env` file:

### Step 1: Get Your PostgreSQL Connection String

The format is:
```
postgresql://username:password@host:port/database
```

For local setup:
```
postgresql://fantasy_f1_user:YourSecurePassword123!@localhost:5432/fantasy_f1
```

### Step 2: Create the .env File

1. Open VS Code or your editor
2. Create a new file
3. Paste this content (update with your actual password):

```env
# Database
DATABASE_URL="postgresql://fantasy_f1_user:YourSecurePassword123!@localhost:5432/fantasy_f1"

# Server
PORT=3000
NODE_ENV=development
BASE_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:3001"

# JWT
JWT_SECRET="change-this-to-a-long-random-string-in-production-use-a-password-generator"

# Email (Gmail example)
EMAIL_SERVICE="gmail"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-specific-password"
EMAIL_FROM="noreply@fantasy-f1.com"

# Admin
ADMIN_EMAIL="your-admin-email@gmail.com"
```

4. Save as `.env` in your project root folder (NOT `.env.txt`)

---

## Troubleshooting

### "node: command not found"

**Solution:**
1. Close Command Prompt completely
2. Open a NEW Command Prompt (this refreshes PATH)
3. Try `node --version` again

If still not working:
1. Right-click Start menu → "System"
2. Click "Advanced system settings"
3. Click "Environment Variables"
4. Under "System variables", find "Path"
5. Click "Edit" and check if `C:\Program Files\nodejs` is there
6. If not, click "New" and add it
7. Click OK and restart Command Prompt

### "psql: command not found"

**Solution:**
1. PostgreSQL should be installed but PATH not updated
2. Use the full path: `"C:\Program Files\PostgreSQL\16\bin\psql" -U postgres`
3. Or add to PATH like the Node.js solution above

### "password authentication failed for user"

**Solution:**
1. You entered the wrong password
2. On Windows, you can reset PostgreSQL password:
   - Open "Services" (search in Start menu)
   - Right-click "postgresql-x64-16"
   - Go to "Log On" tab
   - Update the password

Or reinstall PostgreSQL and remember the password this time.

### "port 5432 already in use"

**Solution:**
1. Another PostgreSQL is running
2. Check Services (search in Start menu for "Services")
3. Find "postgresql-x64-16" and verify it's running
4. If you have multiple versions, uninstall extras

Or use a different port in your `.env`:
```
postgresql://user:password@localhost:5433/fantasy_f1
```

### npm install fails

**Solution:**
1. Clear npm cache:
```bash
npm cache clean --force
```

2. Delete `node_modules` folder and `package-lock.json`
3. Try `npm install` again

### PostgreSQL won't start after restart

**Solution:**
1. Open Services (search in Start menu)
2. Find "postgresql-x64-16"
3. Right-click → "Start"
4. Or set it to "Automatic" to auto-start

---

## Next Steps

Once all prerequisites are installed:

1. **Copy the Fantasy F1 League files** to a folder
2. **Open Command Prompt** in that folder
3. **Run:**
   ```bash
   npm install
   npm run migrate
   npm run seed
   npm run dev
   ```

4. **Open browser** to `http://localhost:3000`

---

## Video Tutorials (Windows)

If you prefer videos, here are some helpful resources:

- **Node.js Install**: https://www.youtube.com/results?search_query=install+nodejs+windows
- **PostgreSQL Install**: https://www.youtube.com/results?search_query=install+postgresql+windows
- **VS Code Setup**: https://www.youtube.com/results?search_query=vs+code+setup+windows

---

## System Requirements

**Minimum:**
- Windows 10 or newer
- 4GB RAM
- 2GB free disk space

**Recommended:**
- Windows 10/11 Pro or newer
- 8GB RAM
- 5GB free disk space
- SSD (faster)

---

## Still Having Issues?

1. **Check each installation:**
   - `node --version`
   - `npm --version`
   - `psql --version`
   - `git --version`

2. **Google the error message** - usually someone else has had it
3. **Check the relevant guide**:
   - Node/npm issues → Node.js docs
   - PostgreSQL issues → PostgreSQL docs
   - Code issues → Check SETUP_GUIDE.md

---

## Common Windows-Specific Issues

### Issue: PowerShell vs Command Prompt

Some commands work differently in PowerShell vs Command Prompt (cmd).

**Solution:** 
- Use **Command Prompt (cmd)** for this project
- Press `Win + R`, type `cmd`, press Enter
- Avoid PowerShell unless you know what you're doing

### Issue: Windows Defender Blocking Installation

**Solution:**
- Click "More info" → "Run anyway"
- Or temporarily disable Windows Defender (not recommended)
- Or add an exclusion for the installation folder

### Issue: npm ERR! EACCES: permission denied

**Solution:** 
- Don't use `sudo` on Windows
- Run Command Prompt as Administrator (right-click → Run as administrator)

### Issue: Slow npm installs

**Solution:**
- Close other applications
- Use wired internet if possible
- Run: `npm install --no-optional`

---

## PostgreSQL Service Management

### Start PostgreSQL Service

```bash
# Via Command Prompt (as Administrator)
net start postgresql-x64-16
```

### Stop PostgreSQL Service

```bash
net stop postgresql-x64-16
```

### Check if Running

1. Search for "Services" in Start menu
2. Look for "postgresql-x64-16"
3. If status is "Running", it's active

---

## Uninstalling (If Needed)

### Uninstall Node.js

1. Go to Control Panel → Programs → Programs and Features
2. Find "Node.js"
3. Click → Uninstall
4. Follow prompts

### Uninstall PostgreSQL

1. Go to Control Panel → Programs → Programs and Features
2. Find "PostgreSQL"
3. Click → Uninstall
4. Follow prompts (will ask about data directory)

### Uninstall Git

1. Go to Control Panel → Programs → Programs and Features
2. Find "Git"
3. Click → Uninstall
4. Follow prompts

---

## Quick Start After Prerequisites

Once everything is installed:

```bash
# Navigate to your project folder
cd C:\Users\YourUsername\Documents\fantasy-f1-league

# Install dependencies
npm install

# Run database setup
npm run migrate
npm run seed

# Start the server
npm run dev
```

Server will run on `http://localhost:3000`

---

## Support Resources

- **Node.js**: https://nodejs.org/docs/
- **npm**: https://docs.npmjs.com/
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Git**: https://git-scm.com/doc
- **VS Code**: https://code.visualstudio.com/docs

---

## Summary

You now have:

✅ Node.js for running JavaScript
✅ npm for managing packages
✅ PostgreSQL for database
✅ A code editor
✅ Everything needed to run Fantasy F1 League

**Next:** Follow `SETUP_GUIDE.md` to set up the application.

---

**Created:** March 7, 2026  
**Platform:** Windows 10/11  
**Status:** Ready to Go 🚀
