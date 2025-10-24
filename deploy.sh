#!/bin/bash

set -e

# Configuration
REGISTRY="aslan-spock-register.qiniu.io"
NAMESPACE="qmatrix"
PROJECT_NAME="txt-anime"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting deployment of ${PROJECT_NAME} to Kubernetes${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check required tools
echo -e "${YELLOW}📋 Checking required tools...${NC}"
for tool in docker kubectl; do
    if ! command_exists $tool; then
        echo -e "${RED}❌ $tool is not installed${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✅ All required tools are available${NC}"

# Build and push Docker images
echo -e "${YELLOW}🔨 Building Docker images...${NC}"

# Build frontend
echo "Building frontend..."
cd novel-to-anime-frontend
docker build --platform linux/amd64 --no-cache -t ${REGISTRY}/${NAMESPACE}/novel-to-anime-frontend:latest .
docker push ${REGISTRY}/${NAMESPACE}/novel-to-anime-frontend:latest
cd ..

# Build mock server
echo "Building mock server..."
cd mock-server
docker build --platform linux/amd64 --no-cache -t ${REGISTRY}/${NAMESPACE}/mock-server:latest .
docker push ${REGISTRY}/${NAMESPACE}/mock-server:latest
cd ..

echo -e "${GREEN}✅ Docker images built and pushed${NC}"

# Deploy to Kubernetes
echo -e "${YELLOW}☸️  Deploying to Kubernetes...${NC}"

# Apply namespace (if it doesn't exist)
kubectl apply -f k8s/namespace.yaml

# Apply ConfigMap
kubectl apply -f k8s/configmap.yaml

# Apply deployments and services
kubectl apply -f k8s/mock-server-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# Apply ingress
kubectl apply -f k8s/ingress.yaml

# Force restart deployments to pull new images
echo "Restarting deployments to pull new images..."
kubectl rollout restart deployment/mock-server -n ${NAMESPACE}
kubectl rollout restart deployment/novel-to-anime-frontend -n ${NAMESPACE}

echo -e "${GREEN}✅ Kubernetes resources deployed${NC}"

# Wait for deployments to be ready
echo -e "${YELLOW}⏳ Waiting for deployments to be ready...${NC}"
kubectl wait --for=condition=available --timeout=300s deployment/mock-server -n ${NAMESPACE}
kubectl wait --for=condition=available --timeout=300s deployment/novel-to-anime-frontend -n ${NAMESPACE}

echo -e "${GREEN}✅ All deployments are ready${NC}"

# Show deployment status
echo -e "${YELLOW}📊 Deployment Status:${NC}"
kubectl get pods -n ${NAMESPACE}
kubectl get services -n ${NAMESPACE}
kubectl get ingress -n ${NAMESPACE}

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${YELLOW}📝 Access your application at: http://novel-to-anime.qmatrix.local${NC}"
echo -e "${YELLOW}🔍 Monitor with: kubectl get pods -n ${NAMESPACE} -w${NC}"