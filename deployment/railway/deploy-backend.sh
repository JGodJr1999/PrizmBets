#!/bin/bash
# Railway Backend Deployment Script for PrizmBets

set -e

echo "🚀 Starting Railway deployment for PrizmBets Backend..."

# Configuration
PROJECT_NAME="prizmbets-backend"
ENVIRONMENT=${1:-production}

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    echo "Please login to Railway:"
    railway login
fi

# Create or link project
echo "🔧 Setting up Railway project..."
if [ ! -f "railway.toml" ]; then
    railway init --name "$PROJECT_NAME"
else
    echo "Railway project already initialized"
fi

# Add PostgreSQL service
echo "🗄️  Adding PostgreSQL database..."
railway add --database postgresql

# Add Redis service
echo "🔴 Adding Redis cache..."
railway add --database redis

# Set environment variables
echo "🔧 Setting up environment variables..."

# Core configuration
railway variables set FLASK_ENV="$ENVIRONMENT"
railway variables set PORT=5001
railway variables set PYTHONPATH="/app"

# Security
railway variables set SECRET_KEY="$SECRET_KEY"
railway variables set JWT_SECRET_KEY="$JWT_SECRET_KEY"
railway variables set BCRYPT_LOG_ROUNDS=14

# Database (Railway automatically provides DATABASE_URL)
railway variables set REDIS_URL='${{Redis.REDIS_URL}}'

# CORS and domains
railway variables set ALLOWED_ORIGINS="https://prizmbets.app,https://www.prizmbets.app"
railway variables set FRONTEND_URL="https://prizmbets.app"
railway variables set BACKEND_URL="https://api.prizmbets.app"

# Email configuration
if [ -n "$MAIL_USERNAME" ]; then
    railway variables set MAIL_SERVER="smtp.sendgrid.net"
    railway variables set MAIL_PORT=587
    railway variables set MAIL_USE_TLS=true
    railway variables set MAIL_USERNAME="$MAIL_USERNAME"
    railway variables set MAIL_PASSWORD="$MAIL_PASSWORD"
    railway variables set MAIL_DEFAULT_SENDER="noreply@prizmbets.app"
fi

# Payment configuration
if [ -n "$STRIPE_SECRET_KEY" ]; then
    railway variables set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"
    railway variables set STRIPE_PUBLISHABLE_KEY="$STRIPE_PUBLISHABLE_KEY"
    railway variables set STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET"
fi

# External APIs
if [ -n "$ODDS_API_KEY" ]; then
    railway variables set ODDS_API_KEY="$ODDS_API_KEY"
fi

if [ -n "$SPORTS_API_KEY" ]; then
    railway variables set SPORTS_API_KEY="$SPORTS_API_KEY"
fi

# Monitoring
if [ -n "$SENTRY_DSN" ]; then
    railway variables set SENTRY_DSN="$SENTRY_DSN"
fi

# Performance settings
railway variables set API_RATE_LIMIT=500
railway variables set LOG_LEVEL="INFO"
railway variables set FORCE_HTTPS=true

echo "✅ Environment variables configured"

# Change to backend directory for deployment
cd "$(dirname "$0")/../../backend"

# Deploy the application
echo "🚀 Deploying backend to Railway..."
railway up --detach

# Wait for deployment to complete
echo "⏳ Waiting for deployment to complete..."
sleep 30

# Get deployment URL
RAILWAY_URL=$(railway status --json | jq -r '.deployments[0].url' 2>/dev/null || echo "")

if [ -n "$RAILWAY_URL" ]; then
    echo "✅ Deployment completed successfully!"
    echo "🌐 Railway URL: $RAILWAY_URL"
    
    # Test the deployment
    echo "🔍 Testing deployment..."
    response=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL/health" || echo "000")
    if [ "$response" = "200" ]; then
        echo "✅ Health check passed"
    else
        echo "⚠️  Health check failed (HTTP $response)"
    fi
else
    echo "⚠️  Could not retrieve deployment URL"
fi

# Setup custom domain
echo "🔧 Setting up custom domain..."
railway domain add api.prizmbets.app

echo "🎉 Backend deployment complete!"
echo ""
echo "Next steps:"
echo "1. Verify the API is working at https://api.prizmbets.app"
echo "2. Update DNS records to point api.prizmbets.app to Railway"
echo "3. Test database connectivity"
echo "4. Configure SSL certificate"
echo "5. Test all API endpoints"

echo ""
echo "Railway Dashboard: https://railway.app/dashboard"
echo "To view logs: railway logs"
echo "To check status: railway status"