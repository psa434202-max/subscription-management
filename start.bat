@echo off
echo ========================================================
echo  Brightloop - Smart Subscription Management System
echo ========================================================
echo.
echo Starting Backend API Server (Port 5000)...
start "Brightloop Backend" cmd /k "cd backend && node src/server.js"
echo.
echo Starting Frontend Client (Port 5173)...
start "Brightloop Frontend" cmd /k "cd frontend && npm run dev"
echo.
echo ========================================================
echo  Both servers launched!
echo  Open your browser at: http://localhost:5173
echo ========================================================

