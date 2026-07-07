#!/bin/bash
echo "Stopping existing servers..."

# Use PowerShell to kill any process on these ports (most reliable on Windows)
powershell -Command "
  @(3000, 5173, 5174, 5175) | ForEach-Object {
    \$port = \$_
    \$pid = (Get-NetTCPConnection -LocalPort \$port -State Listen -ErrorAction SilentlyContinue).OwningProcess
    if (\$pid) { Stop-Process -Id \$pid -Force -ErrorAction SilentlyContinue; Write-Host \"Killed port \$port\" }
  }
"

sleep 2

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Starting backend (port 3000)..."
cd "$SCRIPT_DIR/f1FantasyApp_V1"
npm start &

sleep 4

echo "Starting frontend (port 5173)..."
cd "$SCRIPT_DIR/f1FantasyApp_V1/frontend"
npm run dev &

echo ""
echo "Backend:  http://localhost:3000"
echo "Frontend: http://localhost:5173"
