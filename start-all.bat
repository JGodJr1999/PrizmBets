@echo off
echo ========================================
echo    Starting PrizmBets Full Stack
echo ========================================
echo.

echo Starting Backend Server...
start "PrizmBets Backend" cmd /k start-backend.bat

timeout /t 5 /nobreak > nul

echo Starting Frontend Application...
start "PrizmBets Frontend" cmd /k start-frontend.bat

echo.
echo ========================================
echo    Both servers are starting...
echo ========================================
echo.
echo Backend: http://localhost:5001
echo Frontend: http://localhost:3004
echo.
echo Press any key to exit this window...
pause > nul