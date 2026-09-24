@echo off
title GEO Content Gap Checker
cd /d "%~dp0"

echo ===================================================
echo   Starting GEO Content Gap Checker...
echo   URL: http://localhost:3000
echo ===================================================
echo.

:: Launch browser in background after short delay
start "" powershell -NoProfile -Command "Start-Sleep -Seconds 3; Start-Process 'http://localhost:3000'"

:: Run Next.js server in this window
npm run dev
