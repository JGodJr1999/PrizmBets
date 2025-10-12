#!/bin/bash
echo "========================================"
echo "    Starting PrizmBets Backend Server"
echo "========================================"
echo ""

cd backend

echo "Activating virtual environment..."
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    echo "Installing dependencies..."
    pip install -r requirements.txt
fi

echo ""
echo "Starting Flask server on port 5001..."
echo "Server will be available at: http://localhost:5001"
echo ""
python run.py