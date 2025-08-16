#!/bin/bash
# Vercel Frontend Deployment Script for PrizmBets

set -e

echo "🚀 Starting Vercel deployment for PrizmBets Frontend..."

# Configuration
PROJECT_NAME="prizmbets-frontend"
VERCEL_ORG=${VERCEL_ORG:-"your-vercel-org"}

# Change to frontend directory
cd "$(dirname "$0")/../../frontend"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Login to Vercel (if not already logged in)
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "Please login to Vercel:"
    vercel login
fi

# Set environment variables
echo "🔧 Setting up environment variables..."

# Production environment variables
vercel env add REACT_APP_API_URL production <<< "https://api.prizmbets.app"
vercel env add REACT_APP_DOMAIN production <<< "prizmbets.app"
vercel env add REACT_APP_APP_URL production <<< "https://prizmbets.app"
vercel env add REACT_APP_STRIPE_PUBLISHABLE_KEY production <<< "$STRIPE_PUBLISHABLE_KEY"
vercel env add REACT_APP_FIREBASE_API_KEY production <<< "$FIREBASE_API_KEY"
vercel env add REACT_APP_FIREBASE_AUTH_DOMAIN production <<< "$FIREBASE_AUTH_DOMAIN"
vercel env add REACT_APP_FIREBASE_PROJECT_ID production <<< "$FIREBASE_PROJECT_ID"
vercel env add REACT_APP_SENTRY_DSN production <<< "$FRONTEND_SENTRY_DSN"
vercel env add REACT_APP_GOOGLE_ANALYTICS_ID production <<< "$GOOGLE_ANALYTICS_ID"

# Preview environment variables (for staging)
vercel env add REACT_APP_API_URL preview <<< "https://api-staging.prizmbets.app"
vercel env add REACT_APP_DOMAIN preview <<< "staging.prizmbets.app"
vercel env add REACT_APP_APP_URL preview <<< "https://staging.prizmbets.app"

echo "✅ Environment variables configured"

# Deploy to production
echo "🚀 Deploying to production..."
vercel --prod --confirm

# Get deployment URL
DEPLOYMENT_URL=$(vercel ls --scope="$VERCEL_ORG" | grep "$PROJECT_NAME" | head -1 | awk '{print $2}')

echo "✅ Deployment completed successfully!"
echo "🌐 Production URL: https://prizmbets.app"
echo "📋 Vercel Dashboard: https://vercel.com/$VERCEL_ORG/$PROJECT_NAME"

# Setup custom domain if not already configured
echo "🔧 Configuring custom domain..."
vercel domains add prizmbets.app --scope="$VERCEL_ORG"
vercel domains add www.prizmbets.app --scope="$VERCEL_ORG"

# Verify deployment
echo "🔍 Verifying deployment..."
response=$(curl -s -o /dev/null -w "%{http_code}" https://prizmbets.app)
if [ "$response" = "200" ]; then
    echo "✅ Deployment verification successful"
else
    echo "⚠️  Deployment verification failed (HTTP $response)"
fi

echo "🎉 Frontend deployment complete!"
echo ""
echo "Next steps:"
echo "1. Verify the application is working at https://prizmbets.app"
echo "2. Update DNS records to point to Vercel"
echo "3. Configure backend API deployment"
echo "4. Test all functionality"