#!/bin/bash
echo "========================================"
echo "    Starting PrizmBets Full Stack"
echo "========================================"
echo ""

echo "Starting Backend Server..."
osascript -e 'tell app "Terminal" to do script "cd \"'$(pwd)'\" && ./start-backend.sh"' > /dev/null 2>&1

sleep 5

echo "Starting Frontend Application..."
osascript -e 'tell app "Terminal" to do script "cd \"'$(pwd)'\" && ./start-frontend.sh"' > /dev/null 2>&1

echo ""
echo "========================================"
echo "    Both servers are starting..."
echo "========================================"
echo ""
echo "Backend: http://localhost:5001"
echo "Frontend: http://localhost:3004"
echo ""
echo "Check the new Terminal windows for server status."
echo "Press Ctrl+C to exit this script."