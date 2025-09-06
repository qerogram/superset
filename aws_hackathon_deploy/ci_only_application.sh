#!/bin/bash
set -e

# Configuration
AWS_REGION="us-east-1"
AWS_PROFILE="hackathon"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --profile ${AWS_PROFILE} --query Account --output text)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
ECR_REPO="superset-superset"

echo "================================="
echo "Building Fixed Superset Image"
echo "================================="
echo "- Frontend build: ENABLED (DEV_MODE=false)"
echo "- PostgreSQL driver: INCLUDED"
echo "- Target: lean (production)"
echo ""

echo "🔨 Building production image with fixes..."
docker build \
    --platform linux/arm64 \
    --target lean \
    --build-arg DEV_MODE="false" \
    --build-arg BUILD_TRANSLATIONS="false" \
    -t ${ECR_REPO}:latest \
    --progress=plain \
    ..

echo ""
echo "🏷️ Tagging image for ECR..."
docker tag ${ECR_REPO}:latest ${ECR_REGISTRY}/${ECR_REPO}:latest

echo ""
echo "🔑 Logging into ECR..."
aws ecr get-login-password --region ${AWS_REGION} --profile ${AWS_PROFILE} | \
    docker login --username AWS --password-stdin ${ECR_REGISTRY}

echo ""
echo "⬆️ Pushing image to ECR..."
docker push ${ECR_REGISTRY}/${ECR_REPO}:latest

echo ""
echo "✅ Successfully pushed fixed image to ECR!"
echo "   Repository: ${ECR_REGISTRY}/${ECR_REPO}:latest"
echo ""
echo "   Fixes included:"
echo "   ✓ Frontend assets built (DEV_MODE=false)"
echo "   ✓ PostgreSQL driver installed (psycopg2-binary)"
echo "   ✓ MySQL driver installed (pymysql)"
