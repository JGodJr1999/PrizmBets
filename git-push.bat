@echo off
echo ========================================
echo    SmartBets 2.0 - Quick Git Push
echo ========================================
echo.

REM Get current date and time for commit message
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%"
set "YYYY=%dt:~0,4%"
set "MM=%dt:~4,2%"
set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%"
set "Min=%dt:~10,2%"
set "timestamp=%YYYY%-%MM%-%DD% %HH%:%Min%"

REM Check if custom message was provided
if "%~1"=="" (
    set "commit_message=Auto-save: %timestamp%"
) else (
    set commit_message=%*
)

echo Checking Git status...
git status --short

echo.
echo Adding all changes to Git...
git add -A

echo.
echo Creating commit: "%commit_message%"
git commit -m "%commit_message%"

echo.
echo Pushing to GitHub (main branch)...
git push origin main

echo.
echo ========================================
echo    Upload Complete!
echo ========================================
echo.
echo Your changes have been saved to GitHub.
echo Commit: %commit_message%
echo.
pause