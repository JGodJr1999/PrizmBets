#!/bin/bash
# PrizmBets Production Deployment Script
# Usage: ./deploy.sh [platform] [environment]
# Example: ./deploy.sh railway production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PLATFORM=${1:-railway}
ENVIRONMENT=${2:-production}
PROJECT_NAME="prizmbets-api"

echo -e "${BLUE}🚀 PrizmBets Production Deployment${NC}"
echo -e "Platform: ${GREEN}$PLATFORM${NC}"
echo -e "Environment: ${GREEN}$ENVIRONMENT${NC}"
echo "=================================="

# Validate environment
if [ "$ENVIRONMENT" != "production" ] && [ "$ENVIRONMENT" != "staging" ]; then
    echo -e "${RED}❌ Invalid environment. Use 'production' or 'staging'${NC}"
    exit 1
fi

# Pre-deployment checks
echo -e "${YELLOW}🔍 Running pre-deployment checks...${NC}"

# Check if required files exist
required_files=(
    ".env.$ENVIRONMENT.example"
    "requirements.production.txt"
    "Dockerfile.production"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Required file missing: $file${NC}"
        exit 1
    fi
done

# Check if environment variables are set
if [ ! -f ".env.$ENVIRONMENT" ]; then
    echo -e "${YELLOW}⚠️  .env.$ENVIRONMENT not found. Copy from .env.$ENVIRONMENT.example and configure.${NC}"
    echo "Would you like to create it now? (y/n)"
    read -r response
    if [ "$response" = "y" ]; then
        cp ".env.$ENVIRONMENT.example" ".env.$ENVIRONMENT"
        echo -e "${GREEN}✅ Created .env.$ENVIRONMENT - please configure it before continuing${NC}"
        exit 0
    else
        exit 1
    fi
fi

# Run tests
echo -e "${YELLOW}🧪 Running tests...${NC}"
if command -v python3 &> /dev/null; then
    python3 -m pytest tests/ --tb=short -q || {
        echo -e "${RED}❌ Tests failed! Deployment aborted.${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ All tests passed${NC}"
else
    echo -e "${YELLOW}⚠️  Python3 not found, skipping tests${NC}"
fi

# Security check
echo -e "${YELLOW}🔒 Running security checks...${NC}"
if python3 security_test.py --quiet; then
    echo -e "${GREEN}✅ Security checks passed${NC}"
else
    echo -e "${RED}❌ Security checks failed! Please review.${NC}"
    exit 1
fi

# Platform-specific deployment
case $PLATFORM in
    "railway")
        echo -e "${YELLOW}🚂 Deploying to Railway...${NC}"
        
        # Check if Railway CLI is installed
        if ! command -v railway &> /dev/null; then
            echo -e "${RED}❌ Railway CLI not found. Install it first:${NC}"
            echo "npm install -g @railway/cli"
            exit 1
        fi
        
        # Login check
        if ! railway whoami &> /dev/null; then
            echo -e "${YELLOW}🔑 Please login to Railway:${NC}"
            railway login
        fi
        
        # Deploy
        railway deploy
        ;;
        
    "vercel")
        echo -e "${YELLOW}▲ Deploying to Vercel...${NC}"
        
        if ! command -v vercel &> /dev/null; then
            echo -e "${RED}❌ Vercel CLI not found. Install it first:${NC}"
            echo "npm install -g vercel"
            exit 1
        fi
        
        # Deploy
        vercel --prod
        ;;
        
    "docker")
        echo -e "${YELLOW}🐳 Building Docker image...${NC}"
        
        # Build production image
        docker build -f Dockerfile.production -t "$PROJECT_NAME:$ENVIRONMENT" .
        
        echo -e "${GREEN}✅ Docker image built: $PROJECT_NAME:$ENVIRONMENT${NC}"
        echo "To run: docker run -p 5001:5001 --env-file .env.$ENVIRONMENT $PROJECT_NAME:$ENVIRONMENT"
        ;;
        
    "heroku")
        echo -e "${YELLOW}🟣 Deploying to Heroku...${NC}"
        
        if ! command -v heroku &> /dev/null; then
            echo -e "${RED}❌ Heroku CLI not found. Install it first${NC}"
            exit 1
        fi
        
        # Create Procfile for Heroku
        echo "web: gunicorn --bind 0.0.0.0:\$PORT --workers \$WEB_CONCURRENCY run:app" > Procfile
        
        # Deploy
        git add Procfile
        git commit -m "Add Procfile for Heroku deployment" || true
        git push heroku main
        ;;
        
    *)
        echo -e "${RED}❌ Unsupported platform: $PLATFORM${NC}"
        echo "Supported platforms: railway, vercel, docker, heroku"
        exit 1
        ;;
esac

# Post-deployment checks
echo -e "${YELLOW}🔍 Running post-deployment checks...${NC}"

# Wait a moment for deployment to complete
sleep 10

# Health check (if URL is available)
if [ -n "$HEALTH_CHECK_URL" ]; then
    echo "Checking health endpoint: $HEALTH_CHECK_URL"
    if curl -f "$HEALTH_CHECK_URL/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Health check passed${NC}"
    else
        echo -e "${RED}❌ Health check failed${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo "=================================="
echo -e "Platform: ${GREEN}$PLATFORM${NC}"
echo -e "Environment: ${GREEN}$ENVIRONMENT${NC}"
echo -e "Status: ${GREEN}✅ Live${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Verify all services are running correctly"
echo "2. Run database migrations if needed"
echo "3. Configure monitoring alerts"
echo "4. Update DNS when domain propagates"
echo "5. Set up SSL certificates"