@echo off
echo ========================================
echo    Starting SmartBets Backend Server
echo ========================================
echo.

cd backend

echo Activating virtual environment...
if exist venv (
    call venv\Scripts\activate
) else (
    echo Creating virtual environment...
    python -m venv venv
    call venv\Scripts\activate
    echo Installing dependencies...
    pip install -r requirements.txt
)

echo.
echo Starting Flask server on port 5001...
echo Server will be available at: http://localhost:5001
echo.
python run.py