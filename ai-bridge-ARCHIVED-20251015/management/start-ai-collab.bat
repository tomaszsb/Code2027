@echo off
title AI Collaboration Server
color 0A
echo ========================================
echo   AI Collaboration System
echo ========================================
echo.
echo Starting services...
echo.

wsl -d Ubuntu -e bash /mnt/d/unravel/current_game/code2027/start-ai-collab.sh

echo.
echo ========================================
echo Services are running in the background
echo ========================================
echo.
echo Web UI: http://localhost:3003/index.html
echo.
echo To stop services, run: stop-ai-collab.bat
echo.
pause