# PrizmBets Production Deployment Guide

## 🚀 Quick Start

This guide provides step-by-step instructions for deploying PrizmBets to production when the domain `prizmbets.app` propagates.

## 📋 Prerequisites

### Required Accounts & Services
- [ ] Domain registrar access (for DNS configuration)
- [ ] SSL certificate provider (Let's Encrypt recommended)
- [ ] Database hosting (PostgreSQL)
- [ ] Redis hosting (for caching)
- [ ] Email service (SendGrid, AWS SES, or Mailgun)
- [ ] Error monitoring (Sentry)
- [ ] Deployment platform account (Railway, Vercel, or AWS)

### Required Credentials
- [ ] Stripe live API keys
- [ ] The Odds API production key
- [ ] Email service API keys
- [ ] Database connection strings
- [ ] SSL certificates

## 🏗️ Deployment Platforms

### Option 1: Railway (Recommended)
**Best for: Full-stack deployments with database**

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Deploy
cd backend
./deploy/deploy.sh railway production
```

### Option 2: Vercel
**Best for: Serverless deployments**

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy
cd backend
./deploy/deploy.sh vercel production
```

### Option 3: Docker + Cloud Provider
**Best for: Custom infrastructure**

```bash
# 1. Build production image
cd backend
docker build -f Dockerfile.production -t prizmbets-api:production .

# 2. Deploy to your cloud provider
# (AWS ECS, Google Cloud Run, Azure Container Instances, etc.)
```

## ⚙️ Configuration Steps

### 1. Environment Configuration

```bash
# Copy production environment template
cp backend/.env.production.example backend/.env.production

# Configure all required variables (see detailed list below)
nano backend/.env.production
```

### 2. Required Environment Variables

#### Core Configuration
```bash
DOMAIN=prizmbets.app
BASE_URL=https://prizmbets.app
FLASK_ENV=production
SECRET_KEY=your-256-char-secret-key
JWT_SECRET_KEY=your-256-char-jwt-secret
```

#### Database (PostgreSQL)
```bash
DATABASE_URL=postgresql://username:password@host:5432/prizmbets_production
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20
```

#### Email Service
```bash
MAIL_SERVER=smtp.sendgrid.net
MAIL_USERNAME=apikey
MAIL_PASSWORD=your-sendgrid-api-key
MAIL_DEFAULT_SENDER=noreply@prizmbets.app
```

#### Payment Processing
```bash
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET
```

#### Monitoring
```bash
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
LOG_LEVEL=INFO
```

### 3. Database Setup

#### Option A: Managed Database (Recommended)
- Railway PostgreSQL
- AWS RDS
- Google Cloud SQL
- DigitalOcean Managed Database

#### Option B: Self-hosted
```bash
# Run migrations
python3 -c "from app import create_app, db; app = create_app('production'); app.app_context().push(); db.create_all()"

# Initialize with sample data
python3 init_all_db.py
```

### 4. SSL Certificate Setup

#### Let's Encrypt (Free)
```bash
# Install certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d prizmbets.app -d www.prizmbets.app

# Auto-renewal (add to crontab)
0 12 * * * /usr/bin/certbot renew --quiet
```

### 5. DNS Configuration

```bash
# A Records (when domain propagates)
Type: A
Name: @
Value: YOUR_SERVER_IP

Type: A  
Name: www
Value: YOUR_SERVER_IP

Type: A
Name: api
Value: YOUR_SERVER_IP

# CNAME for CDN (optional)
Type: CNAME
Name: cdn
Value: your-cdn-provider.com
```

## 🔒 Security Checklist

### Pre-Deployment Security
- [ ] All secrets stored in environment variables
- [ ] No hardcoded credentials in code
- [ ] SSL/TLS certificates configured
- [ ] Database connections encrypted
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers implemented

### Post-Deployment Security
- [ ] Run security tests: `python3 security_test.py`
- [ ] Verify HTTPS redirects work
- [ ] Test admin access controls
- [ ] Verify email delivery works
- [ ] Check error monitoring is active
- [ ] Test backup procedures

## 📊 Monitoring Setup

### Error Tracking (Sentry)
```python
# Already configured in production settings
# Just add SENTRY_DSN to environment variables
```

### Performance Monitoring
```bash
# Health check endpoint
curl https://prizmbets.app/health

# Admin dashboard (requires admin login)
curl https://prizmbets.app/api/admin/dashboard
```

### Log Analysis
```bash
# View logs (Railway)
railway logs

# View logs (Docker)
docker logs container_name

# View logs (Vercel)
vercel logs
```

## 🔄 Deployment Workflow

### 1. Pre-Deployment
```bash
# Run all tests
cd backend
python3 -m pytest tests/

# Security check
python3 security_test.py

# Email system check
python3 test_email_system.py
```

### 2. Deployment
```bash
# Deploy to staging first
./deploy/deploy.sh railway staging

# Test staging environment
curl https://staging.prizmbets.app/health

# Deploy to production
./deploy/deploy.sh railway production
```

### 3. Post-Deployment
```bash
# Verify health
curl https://prizmbets.app/health

# Test key endpoints
curl https://prizmbets.app/api/tiers
curl https://prizmbets.app/api/demo/parlay-evaluation

# Monitor logs for errors
railway logs --tail
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Errors
```bash
# Check connection string
echo $DATABASE_URL

# Test connection
python3 -c "import psycopg2; psycopg2.connect('$DATABASE_URL')"
```

#### 2. Email Not Sending
```bash
# Check email configuration
python3 test_email_system.py

# Verify SMTP settings
telnet smtp.sendgrid.net 587
```

#### 3. SSL Certificate Issues
```bash
# Check certificate
openssl s_client -connect prizmbets.app:443

# Verify certificate chain
curl -I https://prizmbets.app
```

#### 4. High Response Times
```bash
# Check database connections
# Check Redis cache status
# Review slow query logs
# Monitor resource usage
```

### Getting Help

1. **Check logs first**: Most issues show up in application logs
2. **Review error monitoring**: Sentry will catch application errors
3. **Verify configuration**: Double-check all environment variables
4. **Test components individually**: Database, email, payment processing
5. **Check external services**: The Odds API, Stripe, email provider status

## 📈 Scaling Considerations

### Performance Optimization
- [ ] Enable database connection pooling
- [ ] Configure Redis caching
- [ ] Set up CDN for static assets
- [ ] Implement database query optimization
- [ ] Monitor and tune Gunicorn workers

### High Availability
- [ ] Multiple server instances
- [ ] Load balancer configuration
- [ ] Database replication
- [ ] Redis clustering
- [ ] Automated failover

## 🔄 Maintenance

### Regular Tasks
- [ ] Database backups (daily)
- [ ] Log rotation
- [ ] Security updates
- [ ] SSL certificate renewal
- [ ] Performance monitoring
- [ ] User analytics review

### Emergency Procedures
- [ ] Rollback plan documented
- [ ] Database restore procedures
- [ ] Emergency contact list
- [ ] Incident response plan

## 📱 Mobile App Deployment (Future)

When ready to deploy mobile apps:

### iOS App Store
- [ ] Apple Developer account
- [ ] iOS app build and testing
- [ ] App Store review process

### Google Play Store  
- [ ] Google Play Developer account
- [ ] Android app build and testing
- [ ] Play Store review process

---

## 🎯 Success Metrics

After deployment, monitor these key metrics:

- **Uptime**: > 99.9%
- **Response Time**: < 500ms average
- **Error Rate**: < 0.1%
- **User Registration**: Track conversion rates
- **Email Delivery**: > 95% success rate
- **Payment Processing**: 100% success rate

---

*This deployment guide will be updated as the platform evolves. Last updated: August 2025*