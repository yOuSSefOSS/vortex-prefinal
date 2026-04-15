@echo off
echo Starting Vortex Servers...

echo Starting Backend Server...
start "Vortex Backend" cmd /k "cd backend && node server.js"

echo Starting Frontend Development Server...
start "Vortex Frontend" cmd /k "cd frontend && npm run dev"

echo Servers are starting in new windows.
