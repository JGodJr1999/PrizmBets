#!/bin/bash
# Health check script for PrizmBets backend

set -e

# Configuration
HOST="localhost"
PORT="5001"
TIMEOUT=10

# Health check endpoint
HEALTH_URL="http://${HOST}:${PORT}/health"

# Perform health check
response=$(curl -s -w "%{http_code}" -o /dev/null --max-time $TIMEOUT "$HEALTH_URL" || echo "000")

if [ "$response" = "200" ]; then
    echo "Health check passed"
    exit 0
else
    echo "Health check failed with status: $response"
    exit 1
fi