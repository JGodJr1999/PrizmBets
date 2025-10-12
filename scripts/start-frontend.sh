#!/bin/bash
echo "========================================"
echo "    Starting PrizmBets Frontend"
echo "========================================"
echo ""

cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo ""
echo "Starting React development server..."
echo "Application will open at: http://localhost:3004"
echo ""
npm start