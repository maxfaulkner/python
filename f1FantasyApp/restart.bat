@echo off
echo.
echo  Stopping existing servers...
taskkill /F /IM node.exe >nul 2>&1
ping -n 3 127.0.0.1 >nul

echo  Starting backend  ^(port 3000^)...
start "F1 Backend"  /d "%~dp0f1FantasyApp_V1"          cmd /k "npm start"

echo  Starting frontend ^(port 5173^)...
start "F1 Frontend" /d "%~dp0f1FantasyApp_V1\frontend"  cmd /k "npm run dev"

echo.
echo  Backend:  http://localhost:3000
echo  Frontend: http://localhost:5173
echo.
