#!/bin/bash
# AWS Deployment Script for PrizmBets

set -e

echo "🚀 Starting AWS deployment for PrizmBets..."

# Configuration
STACK_NAME=${1:-prizmbets-production}
ENVIRONMENT=${2:-production}
REGION=${3:-us-east-1}
DOMAIN_NAME=${4:-prizmbets.app}

# Required parameters
if [ -z "$DB_PASSWORD" ]; then
    echo "❌ DB_PASSWORD environment variable is required"
    exit 1
fi

if [ -z "$SECRET_KEY" ]; then
    echo "❌ SECRET_KEY environment variable is required"
    exit 1
fi

if [ -z "$JWT_SECRET_KEY" ]; then
    echo "❌ JWT_SECRET_KEY environment variable is required"
    exit 1
fi

# Check if AWS CLI is installed and configured
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install and configure it first:"
    echo "https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Verify AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI configured for account: $(aws sts get-caller-identity --query Account --output text)"

# Set AWS region
export AWS_DEFAULT_REGION=$REGION
echo "🌍 Using AWS region: $REGION"

# Create ECR repository if it doesn't exist
ECR_REPO_NAME="prizmbets-backend"
echo "🐳 Setting up ECR repository..."

if ! aws ecr describe-repositories --repository-names "$ECR_REPO_NAME" &> /dev/null; then
    echo "Creating ECR repository: $ECR_REPO_NAME"
    aws ecr create-repository --repository-name "$ECR_REPO_NAME"
else
    echo "ECR repository already exists: $ECR_REPO_NAME"
fi

# Get ECR login token and login
echo "🔐 Logging in to ECR..."
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com"

# Build and push Docker image
echo "🔨 Building and pushing Docker image..."
cd "$(dirname "$0")/../../backend"

ECR_URI="$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com/$ECR_REPO_NAME"

docker build -t "$ECR_REPO_NAME" .
docker tag "$ECR_REPO_NAME:latest" "$ECR_URI:latest"
docker push "$ECR_URI:latest"

echo "✅ Docker image pushed to ECR"

# Deploy CloudFormation stack
echo "☁️  Deploying CloudFormation stack..."
cd "$(dirname "$0")"

aws cloudformation deploy \
    --template-file cloudformation-template.yaml \
    --stack-name "$STACK_NAME" \
    --parameter-overrides \
        Environment="$ENVIRONMENT" \
        DomainName="$DOMAIN_NAME" \
        DBPassword="$DB_PASSWORD" \
        SecretKey="$SECRET_KEY" \
        JWTSecretKey="$JWT_SECRET_KEY" \
    --capabilities CAPABILITY_IAM \
    --region "$REGION" \
    --tags \
        Environment="$ENVIRONMENT" \
        Application="PrizmBets" \
        Owner="$(aws sts get-caller-identity --query Arn --output text)"

if [ $? -eq 0 ]; then
    echo "✅ CloudFormation stack deployed successfully"
else
    echo "❌ CloudFormation deployment failed"
    exit 1
fi

# Get stack outputs
echo "📋 Getting stack outputs..."
ALB_DNS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='LoadBalancerDNS'].OutputValue" --output text)
DB_ENDPOINT=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='DatabaseEndpoint'].OutputValue" --output text)
REDIS_ENDPOINT=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='RedisEndpoint'].OutputValue" --output text)
S3_BUCKET=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='S3BucketName'].OutputValue" --output text)

echo "🌐 Load Balancer DNS: $ALB_DNS"
echo "🗄️  Database Endpoint: $DB_ENDPOINT"
echo "🔴 Redis Endpoint: $REDIS_ENDPOINT"
echo "🪣 S3 Bucket: $S3_BUCKET"

# Wait for services to be healthy
echo "⏳ Waiting for services to become healthy..."
sleep 60

# Test the deployment
echo "🔍 Testing deployment..."
response=$(curl -s -o /dev/null -w "%{http_code}" "http://$ALB_DNS/health" || echo "000")
if [ "$response" = "200" ]; then
    echo "✅ Health check passed"
else
    echo "⚠️  Health check failed (HTTP $response)"
    echo "Check ECS service logs in CloudWatch"
fi

# Setup Route 53 (if domain is managed by Route 53)
echo "🌐 Setting up DNS records..."
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name --dns-name "$DOMAIN_NAME" --query "HostedZones[0].Id" --output text 2>/dev/null || echo "")

if [ -n "$HOSTED_ZONE_ID" ] && [ "$HOSTED_ZONE_ID" != "None" ]; then
    echo "Found hosted zone: $HOSTED_ZONE_ID"
    
    # Create Route 53 record for API subdomain
    cat > /tmp/route53-record.json << EOF
{
    "Changes": [
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "api.$DOMAIN_NAME",
                "Type": "CNAME",
                "TTL": 300,
                "ResourceRecords": [
                    {
                        "Value": "$ALB_DNS"
                    }
                ]
            }
        }
    ]
}
EOF

    aws route53 change-resource-record-sets \
        --hosted-zone-id "$HOSTED_ZONE_ID" \
        --change-batch file:///tmp/route53-record.json

    echo "✅ DNS record created for api.$DOMAIN_NAME"
else
    echo "⚠️  No Route 53 hosted zone found for $DOMAIN_NAME"
    echo "Please manually create a CNAME record:"
    echo "api.$DOMAIN_NAME -> $ALB_DNS"
fi

# Setup SSL certificate with ACM
echo "🔒 Setting up SSL certificate..."
CERT_ARN=$(aws acm request-certificate \
    --domain-name "api.$DOMAIN_NAME" \
    --validation-method DNS \
    --query CertificateArn \
    --output text)

echo "SSL certificate requested: $CERT_ARN"
echo "Please validate the certificate in the ACM console and update the ALB listener to use HTTPS"

# Create deployment summary
echo ""
echo "🎉 AWS deployment completed!"
echo ""
echo "📋 Deployment Summary:"
echo "===================="
echo "Stack Name: $STACK_NAME"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo "Load Balancer: $ALB_DNS"
echo "API Endpoint: http://$ALB_DNS (temporary)"
echo "Future API URL: https://api.$DOMAIN_NAME"
echo "Database: $DB_ENDPOINT"
echo "Redis: $REDIS_ENDPOINT"
echo "S3 Bucket: $S3_BUCKET"
echo "ECR Repository: $ECR_URI"
echo "SSL Certificate: $CERT_ARN"
echo ""
echo "📝 Next Steps:"
echo "1. Validate SSL certificate in ACM console"
echo "2. Update ALB listener to use HTTPS (port 443)"
echo "3. Configure DNS to point api.$DOMAIN_NAME to $ALB_DNS"
echo "4. Deploy frontend to S3/CloudFront or Vercel"
echo "5. Test all API endpoints"
echo "6. Configure monitoring and alerts"
echo ""
echo "🔧 Useful Commands:"
echo "- Check ECS service: aws ecs describe-services --cluster $ENVIRONMENT-prizmbets-cluster --services $ENVIRONMENT-prizmbets-service"
echo "- View logs: aws logs tail /ecs/$ENVIRONMENT-prizmbets --follow"
echo "- Update service: aws ecs update-service --cluster $ENVIRONMENT-prizmbets-cluster --service $ENVIRONMENT-prizmbets-service --force-new-deployment"
echo "- Delete stack: aws cloudformation delete-stack --stack-name $STACK_NAME"