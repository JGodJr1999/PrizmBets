#!/bin/bash

# Deploy Live Sports Scores API Fix
# This script deploys the Firebase configuration and functions to fix the Live Scores API

echo "🚀 Starting Live Sports Scores API Fix Deployment..."

# Check if we're in the right directory
if [ ! -f "firebase.json" ]; then
    echo "❌ Error: firebase.json not found. Please run this script from the project root."
    exit 1
fi

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi
cd ..

# Deploy Firebase Functions and Hosting
echo "🚀 Deploying Firebase Functions and Hosting..."
firebase deploy --only functions,hosting

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "🎯 Live Sports Scores API should now be working at:"
    echo "   https://smartbets-5c06f.web.app/api/live-scores"
    echo ""
    echo "🔍 Test the API directly:"
    echo "   curl https://smartbets-5c06f.web.app/api/live-scores"
    echo ""
    echo "📱 Check your website now - Live Sports Scores should be loading!"
else
    echo "❌ Deployment failed"
    exit 1
fi