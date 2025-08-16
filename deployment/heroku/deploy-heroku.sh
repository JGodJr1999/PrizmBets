#!/bin/bash
# Heroku Deployment Script for PrizmBets Backend

set -e

echo "🚀 Starting Heroku deployment for PrizmBets Backend..."

# Configuration
APP_NAME=${1:-prizmbets-backend}
ENVIRONMENT=${2:-production}

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI not found. Please install it first:"
    echo "https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Login to Heroku (if not already logged in)
echo "🔐 Checking Heroku authentication..."
if ! heroku whoami &> /dev/null; then
    echo "Please login to Heroku:"
    heroku login
fi

# Change to backend directory
cd "$(dirname "$0")/../../backend"

# Create Heroku app if it doesn't exist
echo "🔧 Setting up Heroku application..."
if ! heroku apps:info "$APP_NAME" &> /dev/null; then
    echo "Creating new Heroku app: $APP_NAME"
    heroku create "$APP_NAME" --region us
else
    echo "Using existing Heroku app: $APP_NAME"
fi

# Add git remote if not exists
if ! git remote get-url heroku &> /dev/null; then
    heroku git:remote -a "$APP_NAME"
fi

# Add required addons
echo "🔧 Adding Heroku addons..."

# PostgreSQL
if ! heroku addons --app "$APP_NAME" | grep -q "heroku-postgresql"; then
    if [ "$ENVIRONMENT" = "production" ]; then
        heroku addons:create heroku-postgresql:standard-0 --app "$APP_NAME"
    else
        heroku addons:create heroku-postgresql:hobby-dev --app "$APP_NAME"
    fi
fi

# Redis
if ! heroku addons --app "$APP_NAME" | grep -q "heroku-redis"; then
    if [ "$ENVIRONMENT" = "production" ]; then
        heroku addons:create heroku-redis:premium-0 --app "$APP_NAME"
    else
        heroku addons:create heroku-redis:hobby-dev --app "$APP_NAME"
    fi
fi

# SendGrid for email
if ! heroku addons --app "$APP_NAME" | grep -q "sendgrid"; then
    heroku addons:create sendgrid:starter --app "$APP_NAME"
fi

# Papertrail for logging
if ! heroku addons --app "$APP_NAME" | grep -q "papertrail"; then
    heroku addons:create papertrail:choklad --app "$APP_NAME"
fi

# Scheduler for background tasks
if ! heroku addons --app "$APP_NAME" | grep -q "scheduler"; then
    heroku addons:create scheduler:standard --app "$APP_NAME"
fi

echo "✅ Addons configured"

# Set environment variables
echo "🔧 Setting up environment variables..."

# Core configuration
heroku config:set FLASK_ENV="$ENVIRONMENT" --app "$APP_NAME"
heroku config:set PYTHONPATH="/app" --app "$APP_NAME"

# Security
if [ -n "$SECRET_KEY" ]; then
    heroku config:set SECRET_KEY="$SECRET_KEY" --app "$APP_NAME"
else
    heroku config:set SECRET_KEY="$(openssl rand -hex 32)" --app "$APP_NAME"
fi

if [ -n "$JWT_SECRET_KEY" ]; then
    heroku config:set JWT_SECRET_KEY="$JWT_SECRET_KEY" --app "$APP_NAME"
else
    heroku config:set JWT_SECRET_KEY="$(openssl rand -hex 32)" --app "$APP_NAME"
fi

# CORS and domains
heroku config:set ALLOWED_ORIGINS="https://prizmbets.app,https://www.prizmbets.app" --app "$APP_NAME"
heroku config:set FRONTEND_URL="https://prizmbets.app" --app "$APP_NAME"
heroku config:set FORCE_HTTPS="true" --app "$APP_NAME"

# Performance settings
heroku config:set API_RATE_LIMIT="500" --app "$APP_NAME"
heroku config:set LOG_LEVEL="INFO" --app "$APP_NAME"

# Optional configurations
if [ -n "$STRIPE_SECRET_KEY" ]; then
    heroku config:set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" --app "$APP_NAME"
    heroku config:set STRIPE_PUBLISHABLE_KEY="$STRIPE_PUBLISHABLE_KEY" --app "$APP_NAME"
    heroku config:set STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" --app "$APP_NAME"
fi

if [ -n "$ODDS_API_KEY" ]; then
    heroku config:set ODDS_API_KEY="$ODDS_API_KEY" --app "$APP_NAME"
fi

if [ -n "$SPORTS_API_KEY" ]; then
    heroku config:set SPORTS_API_KEY="$SPORTS_API_KEY" --app "$APP_NAME"
fi

if [ -n "$SENTRY_DSN" ]; then
    heroku config:set SENTRY_DSN="$SENTRY_DSN" --app "$APP_NAME"
fi

echo "✅ Environment variables configured"

# Copy Procfile to backend directory
cp "../deployment/heroku/Procfile" ./

# Deploy the application
echo "🚀 Deploying to Heroku..."
git add .
git commit -m "Deploy to Heroku" || true
git push heroku main

# Run database migrations
echo "🗄️  Running database migrations..."
heroku run python -c "
from app import create_app
from database_production import init_production_database
app = create_app()
with app.app_context():
    db_manager = init_production_database(app)
    db_manager.setup_production_database()
    print('Database setup complete')
" --app "$APP_NAME"

# Scale dynos
echo "⚡ Scaling dynos..."
if [ "$ENVIRONMENT" = "production" ]; then
    heroku ps:scale web=2 worker=1 --app "$APP_NAME"
else
    heroku ps:scale web=1 worker=1 --app "$APP_NAME"
fi

# Get app URL
APP_URL=$(heroku apps:info "$APP_NAME" --json | jq -r '.app.web_url')

echo "✅ Deployment completed successfully!"
echo "🌐 Application URL: $APP_URL"

# Test the deployment
echo "🔍 Testing deployment..."
response=$(curl -s -o /dev/null -w "%{http_code}" "${APP_URL}health" || echo "000")
if [ "$response" = "200" ]; then
    echo "✅ Health check passed"
else
    echo "⚠️  Health check failed (HTTP $response)"
    echo "Check logs with: heroku logs --tail --app $APP_NAME"
fi

# Setup custom domain
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🔧 Setting up custom domain..."
    heroku domains:add api.prizmbets.app --app "$APP_NAME"
    
    echo "📋 DNS Configuration Required:"
    heroku domains --app "$APP_NAME"
fi

echo "🎉 Heroku deployment complete!"
echo ""
echo "Next steps:"
echo "1. Configure DNS to point api.prizmbets.app to Heroku"
echo "2. Add SSL certificate: heroku certs:auto:enable --app $APP_NAME"
echo "3. Test all API endpoints"
echo "4. Monitor application performance"
echo ""
echo "Useful commands:"
echo "- View logs: heroku logs --tail --app $APP_NAME"
echo "- Open app: heroku open --app $APP_NAME"
echo "- Check status: heroku ps --app $APP_NAME"
echo "- Run console: heroku run python --app $APP_NAME"