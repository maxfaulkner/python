# Windows Fix: psql Command Not Found - Complete Solution

You can see PostgreSQL is installed, but Windows can't find the `psql` command. This is a **PATH issue** - Windows doesn't know where to look for the psql program.

---

## Quick Fix (Try This First)

### Step 1: Find PostgreSQL Installation Path

1. Search for "PostgreSQL" in Windows Start menu
2. Right-click on the PostgreSQL folder
3. Click "Open file location"
4. You should see a folder like: `C:\Program Files\PostgreSQL\16` (number may vary)
5. **Copy this path** - you'll need it

### Step 2: Use Full Path (Workaround)

Instead of typing:
```bash
psql --version
```

Type the full path. On Windows Command Prompt:

```bash
"C:\Program Files\PostgreSQL\16\bin\psql" --version
```

**Replace 16 with your actual version number if different**

If this works and shows a version number, your PostgreSQL works fine - you just need to fix the PATH (see below).

---

## Permanent Fix: Add PostgreSQL to Windows PATH

This is the proper way to fix it so `psql` works from anywhere.

### Step 1: Open Windows System Settings

1. Press `Win + R` (opens Run dialog)
2. Type: `sysdm.cpl`
3. Press Enter
4. The "System Properties" window opens

### Step 2: Go to Environment Variables

1. Click the "Advanced" tab (at the top)
2. Click "Environment Variables" button (at bottom)
3. A new window opens

### Step 3: Edit PATH Variable

**In the "Environment Variables" window:**

1. In the bottom section labeled "System variables" (NOT user variables)
2. Find and click on the variable named `Path`
3. Click "Edit"
4. A list of paths appears

### Step 4: Add PostgreSQL Path

1. Click "New" button
2. Type the full path to PostgreSQL's bin folder:
   ```
   C:\Program Files\PostgreSQL\16\bin
   ```
   
   **Important:** 
   - Replace `16` with your actual PostgreSQL version
   - Make sure it's exactly: `C:\Program Files\PostgreSQL\16\bin`

3. Click OK

### Step 5: Verify the Path is Added

1. You should see your new path in the list
2. It should show: `C:\Program Files\PostgreSQL\16\bin`
3. Click OK to close the Environment Variables window
4. Click OK to close System Properties

### Step 6: Test It Works

1. **Close Command Prompt completely** (important!)
2. Open a **NEW Command Prompt** (this refreshes PATH)
3. Type:
   ```bash
   psql --version
   ```

It should now show your PostgreSQL version!

---

## Alternative Quick Fix: Batch File

If the PATH fix doesn't work, create a batch file to run psql:

### Step 1: Create a Batch File

1. Open Notepad
2. Paste this:
   ```batch
   @echo off
   "C:\Program Files\PostgreSQL\16\bin\psql" %*
   ```
3. Replace `16` with your version number
4. Save as `psql.bat` in a folder that's in your PATH
   - Easy option: Save to `C:\Windows\System32\`

### Step 2: Use It

Now you can use `psql` from anywhere:
```bash
psql --version
psql -U postgres
```

---

## Finding Your PostgreSQL Version Number

Not sure if you have version 14, 15, or 16?

### Method 1: Check the Folder

1. Open File Explorer
2. Go to: `C:\Program Files\`
3. Look for folder named `PostgreSQL15`, `PostgreSQL16`, etc.
4. That number is your version

### Method 2: Check PostgreSQL Installer

1. Search Windows Start menu for "PostgreSQL"
2. It usually shows the version in the menu (e.g., "PostgreSQL 16")

### Method 3: From pgAdmin

1. Open pgAdmin (search in Start menu)
2. Click on the server connection
3. At the bottom right, hover over the version number

---

## Verify PostgreSQL Installation Folder

If you're not sure where PostgreSQL is installed:

### Method 1: Search for Folder

1. Open File Explorer
2. Click on "This PC" or "My Computer"
3. In the search box (top right), type: `postgresql`
4. Look for the PostgreSQL folder
5. Note the full path

### Method 2: Check in Program Files

1. Open File Explorer
2. Go to: `C:\Program Files\`
3. Look for any folder starting with "PostgreSQL"
4. The path is: `C:\Program Files\[FolderName]\bin\psql`

### Method 3: Check Program Files (x86)

If not in Program Files, it might be in:
```
C:\Program Files (x86)\PostgreSQL\16\bin\psql
```

Try this path if the first one doesn't work.

---

## Common Installation Paths

PostgreSQL might be in one of these locations:

```
C:\Program Files\PostgreSQL\16\bin\psql
C:\Program Files\PostgreSQL\15\bin\psql
C:\Program Files\PostgreSQL\14\bin\psql
C:\Program Files (x86)\PostgreSQL\16\bin\psql
C:\PostgreSQL\16\bin\psql
```

Try each until you find the right one.

---

## Step-by-Step Troubleshooting

### If PATH fix didn't work:

1. **Close Command Prompt** and open a NEW one
   - This is important! Windows doesn't update PATH until you restart the prompt

2. **Check PATH was added correctly:**
   ```bash
   echo %PATH%
   ```
   This shows all paths. Look for your PostgreSQL path in the list.

3. **Make sure you have permission:**
   - Run Command Prompt as Administrator
   - Right-click Command Prompt → "Run as administrator"

4. **Try from System32:**
   ```bash
   C:\Windows\System32>psql --version
   ```
   If this works, your PATH wasn't added correctly. Go back and redo Step 3-4.

### If full path doesn't work:

Your PostgreSQL path is different. Try:

```bash
# Find where psql actually is
dir "C:\Program Files\PostgreSQL"
```

This lists what's in the PostgreSQL folder. Look for a `bin` subfolder.

---

## Working Around It (For Now)

While you fix the PATH, you can still use PostgreSQL:

### Method 1: Full Path Every Time

```bash
"C:\Program Files\PostgreSQL\16\bin\psql" -U postgres
```

### Method 2: Create an Alias

Add this to your `.bash_profile` or `.bashrc` (if using Git Bash):

```bash
alias psql="/c/Program\ Files/PostgreSQL/16/bin/psql"
```

### Method 3: Use pgAdmin

Instead of command line, use pgAdmin (graphical tool):
1. Search "pgAdmin 4" in Windows Start menu
2. Click to open browser-based interface
3. Can manage databases graphically

---

## Verification Checklist

After fixing, verify:

- [ ] Open NEW Command Prompt (close old one first)
- [ ] Run `psql --version`
- [ ] Should show: `psql (PostgreSQL) 16.x` (or your version)
- [ ] Run `psql -U postgres` (connects to database)
- [ ] Type `\q` to exit

If all these work, you're good to go!

---

## For Command Prompt vs PowerShell

If using **Command Prompt (cmd):**
```bash
"C:\Program Files\PostgreSQL\16\bin\psql" --version
```

If using **PowerShell:**
```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql" --version
```

**Recommendation:** Use Command Prompt for this project, not PowerShell.

---

## PostgreSQL Service Check

PostgreSQL also needs to be running as a service:

### Check if Service is Running

1. Press `Win + R`
2. Type: `services.msc`
3. Press Enter
4. Look for "postgresql-x64-16" (or your version)
5. Status should show "Running"

### If Not Running

1. Right-click on the PostgreSQL service
2. Click "Start"
3. Wait a few seconds

Now PostgreSQL is active and psql can connect.

---

## Complete Connection Test

Once `psql` command works:

```bash
# Test connection to postgres user
psql -U postgres

# If prompted for password, enter it (the one you set during installation)

# If successful, you'll see:
# psql (16.x)
# Type "help" for help.
# postgres=#

# Exit with:
# \q
```

---

## Still Not Working?

If you've tried everything:

### Nuclear Option: Reinstall PostgreSQL

1. Go to Control Panel → Programs → Programs and Features
2. Find "PostgreSQL"
3. Click "Uninstall"
4. Check "Delete database directory" if asked
5. Restart computer
6. Download fresh from https://www.postgresql.org/download/windows/
7. Install again, note the installation path
8. Redo the PATH setup with the correct path

---

## Quick Reference

**Your PostgreSQL path:**
```
C:\Program Files\PostgreSQL\16\bin
```

**Your psql command:**
```bash
"C:\Program Files\PostgreSQL\16\bin\psql" --version
```

**To add to PATH:**
1. Right-click Start → System
2. Advanced system settings
3. Environment Variables
4. Edit Path in System variables
5. Add: `C:\Program Files\PostgreSQL\16\bin`

**After adding PATH:**
- Close Command Prompt
- Open NEW Command Prompt
- Test: `psql --version`

---

## Need More Help?

Check these files:
- **WINDOWS_PREREQUISITES.md** - Full setup guide
- **SETUP_GUIDE.md** - Database troubleshooting section
- **READ_ME_FIRST.txt** - Quick navigation

---

**Last Updated:** March 7, 2026
**Platform:** Windows 10/11
**Issue:** psql command not found (PATH issue)
**Status:** Solvable ✅
