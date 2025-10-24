#!/bin/bash

NAMESPACE="qmatrix"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🏥 Health Check for Novel-to-Anime Application${NC}"
echo "=================================================="

# Check if namespace exists
if ! kubectl get namespace $NAMESPACE >/dev/null 2>&1; then
    echo -e "${RED}❌ Namespace '$NAMESPACE' not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Namespace '$NAMESPACE' exists${NC}"

# Check deployments
echo -e "\n${YELLOW}📊 Deployment Status:${NC}"
kubectl get deployments -n $NAMESPACE

# Check pods
echo -e "\n${YELLOW}🔍 Pod Status:${NC}"
kubectl get pods -n $NAMESPACE

# Check services
echo -e "\n${YELLOW}🌐 Service Status:${NC}"
kubectl get services -n $NAMESPACE

# Check ingress
echo -e "\n${YELLOW}🚪 Ingress Status:${NC}"
kubectl get ingress -n $NAMESPACE

# Test health endpoints
echo -e "\n${YELLOW}🏥 Testing Health Endpoints:${NC}"

# Port forward to test mock server health
kubectl port-forward service/mock-server-service 3001:3001 -n $NAMESPACE >/dev/null 2>&1 &
PF_PID=$!
sleep 2

if curl -s http://localhost:3001/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Mock Server health check passed${NC}"
else
    echo -e "${RED}❌ Mock Server health check failed${NC}"
fi

# Clean up port forward
kill $PF_PID >/dev/null 2>&1

echo -e "\n${GREEN}🎉 Health check completed${NC}"