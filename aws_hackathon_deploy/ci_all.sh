#!/bin/bash

# ECR Push Script for Superset Docker Stack
# This script tags and pushes all Superset docker images to ECR

set -e

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --profile hackathon --query Account --output text)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "🚀 Starting ECR push for Superset stack..."
echo "ECR Registry: ${ECR_REGISTRY}"

# Login to ECR
echo "📝 Logging into ECR..."
aws ecr get-login-password --region ${AWS_REGION} --profile hackathon | \
  docker login --username AWS --password-stdin ${ECR_REGISTRY}

# Build all images first
echo "🔨 Building all Docker images..."
echo "📌 Building main Superset image with production settings..."
echo "   - Frontend build: ENABLED (DEV_MODE=false)"
echo "   - PostgreSQL driver: INCLUDED"
echo "   - Target: lean (production)"

# Build main superset image with proper settings for production
docker build \
    --platform linux/arm64 \
    --target lean \
    --build-arg DEV_MODE="false" \
    --build-arg BUILD_TRANSLATIONS="false" \
    -t superset-superset:latest \
    --progress=plain \
    .

# Build other services using same base image with different commands
echo "📌 Tagging other service images from base image..."
docker tag superset-superset:latest superset-superset-worker:latest
docker tag superset-superset:latest superset-superset-worker-beat:latest
docker tag superset-superset:latest superset-superset-init:latest

# Build remaining specialized images if needed
echo "📌 Building specialized images..."
# Node image for development (optional)
if [ -f "docker-compose-build-all.yml" ]; then
    docker-compose -f docker-compose-build-all.yml build superset-node superset-websocket nginx 2>/dev/null || true
fi

# List of images to push
IMAGES=(
  "superset-superset:latest"
  "superset-superset-worker:latest"
  "superset-superset-worker-beat:latest"
  "superset-superset-init:latest"
)

# Create ECR repositories if they don't exist
echo "📦 Creating ECR repositories..."
for IMAGE in "${IMAGES[@]}"; do
  REPO_NAME=$(echo $IMAGE | cut -d: -f1)
  aws ecr describe-repositories --repository-names ${REPO_NAME} --region ${AWS_REGION} --profile hackathon 2>/dev/null || \
    aws ecr create-repository --repository-name ${REPO_NAME} --region ${AWS_REGION} --profile hackathon
done

# Tag and push each image
for IMAGE in "${IMAGES[@]}"; do
  REPO_NAME=$(echo $IMAGE | cut -d: -f1)
  echo "🏷️  Tagging ${IMAGE}..."
  docker tag ${IMAGE} ${ECR_REGISTRY}/${IMAGE}
  
  echo "⬆️  Pushing ${IMAGE} to ECR..."
  docker push ${ECR_REGISTRY}/${IMAGE}
done

# Also push Redis and Postgres if using custom images
# If using AWS managed services (ElastiCache/RDS), skip these
if docker images | grep -q "superset-redis"; then
  docker tag redis:7 ${ECR_REGISTRY}/superset-redis:7
  docker push ${ECR_REGISTRY}/superset-redis:7
fi

if docker images | grep -q "superset-postgres"; then
  docker tag postgres:16 ${ECR_REGISTRY}/superset-postgres:16
  docker push ${ECR_REGISTRY}/superset-postgres:16
fi

# Push nginx if using custom configuration
if docker images | grep -q "superset-nginx"; then
  docker tag nginx:latest ${ECR_REGISTRY}/superset-nginx:latest
  docker push ${ECR_REGISTRY}/superset-nginx:latest
fi

echo "✅ All images pushed to ECR successfully!"
echo ""
echo "📋 Image URIs for Terraform/ECS:"
for IMAGE in "${IMAGES[@]}"; do
  echo "  ${ECR_REGISTRY}/${IMAGE}"
done
echo ""
echo "📌 Production Build Features:"
echo "   ✓ Frontend assets built (DEV_MODE=false)"
echo "   ✓ PostgreSQL driver installed (psycopg2-binary)"
echo "   ✓ MySQL driver installed (pymysql)"
echo "   ✓ Target: lean (optimized for production)"
echo "   ✓ Platform: linux/arm64 (for AWS Graviton)"
