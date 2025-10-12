@echo off
echo ========================================
echo      Prizm Bets Firebase Deployment
echo ========================================
echo.

echo [1/4] Building React app...
cd frontend
call npm run build

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed!
    pause
    exit /b %errorlevel%
)

echo.
echo [2/4] Build successful!
cd ..

echo.
echo [3/4] Deploying to Firebase Hosting...
firebase deploy --only hosting

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Deployment failed!
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================
echo    ✅ Deployment Successful!
echo    Your app is live at:
echo    https://smartbets-5c06f.web.app
echo ========================================
echo.
pause