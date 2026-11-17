@echo off
cd /d "%~dp0"
node scripts\launch.cjs --full-app
if errorlevel 1 pause
