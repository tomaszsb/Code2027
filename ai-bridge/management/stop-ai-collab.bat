@echo off
title Stop AI Collaboration Server
color 0C
echo ========================================
echo   Stopping AI Collaboration System
echo ========================================
echo.

wsl -d Ubuntu -e bash /mnt/d/unravel/current_game/code2027/stop-ai-collab.sh

echo.
echo ========================================
echo Services stopped
echo ========================================
echo.
pause
