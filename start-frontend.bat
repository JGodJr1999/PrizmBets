@echo off
echo ========================================
echo    Starting SmartBets Frontend
echo ========================================
echo.

cd frontend

if not exist node_modules (
    echo Installing dependencies...
    npm install
)

echo.
echo Starting React development server...
echo Application will open at: http://localhost:3004
echo.
npm start