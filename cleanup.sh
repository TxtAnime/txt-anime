#!/bin/bash

set -e

NAMESPACE="qmatrix"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Parse command line arguments
CLEANUP_MODE="local"
if [[ "$1" == "k8s" || "$1" == "kubernetes" ]]; then
    CLEANUP_MODE="k8s"
fi

echo -e "${YELLOW}🧹 Cleaning up ${CLEANUP_MODE} resources...${NC}"

# Function to cleanup local deployment
cleanup_local() {
    echo -e "${BLUE}🏠 Cleaning up local deployment...${NC}"
    
    # Kill backend process
    if [[ -f ".backend.pid" ]]; then
        BACKEND_PID=$(cat .backend.pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            echo -e "${YELLOW}🔄 Stopping backend (PID: $BACKEND_PID)${NC}"
            kill $BACKEND_PID 2>/dev/null || true
        fi
        rm -f .backend.pid
    fi
    
    # Kill frontend process
    if [[ -f ".frontend.pid" ]]; then
        FRONTEND_PID=$(cat .frontend.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            echo -e "${YELLOW}🔄 Stopping frontend (PID: $FRONTEND_PID)${NC}"
            kill $FRONTEND_PID 2>/dev/null || true
        fi
        rm -f .frontend.pid
    fi
    
    # Kill any remaining processes on ports
    BACKEND_PORT=8080
    FRONTEND_PORT=3000
    
    for port in $BACKEND_PORT $FRONTEND_PORT; do
        PID=$(lsof -ti:$port 2>/dev/null || true)
        if [[ -n "$PID" ]]; then
            echo -e "${YELLOW}🔄 Killing process on port $port (PID: $PID)${NC}"
            kill -9 $PID 2>/dev/null || true
        fi
    done
    
    # Clean up build artifacts
    echo -e "${YELLOW}🗑️  Cleaning up build artifacts...${NC}"
    rm -f novel2comicd
    rm -f novel-to-anime-frontend/.env
    
    echo -e "${GREEN}✅ Local cleanup completed${NC}"
}

# Function to cleanup Kubernetes deployment
cleanup_k8s() {
    echo -e "${BLUE}☸️  Cleaning up Kubernetes deployment...${NC}"
    
    # Delete ingress
    kubectl delete -f k8s/ingress.yaml --ignore-not-found=true

    # Delete deployments and services
    kubectl delete -f k8s/frontend-deployment.yaml --ignore-not-found=true
    kubectl delete -f k8s/backend-deployment.yaml --ignore-not-found=true
    kubectl delete -f k8s/mock-server-deployment.yaml --ignore-not-found=true

    # Delete ConfigMap
    kubectl delete -f k8s/configmap.yaml --ignore-not-found=true

    echo -e "${GREEN}✅ Kubernetes cleanup completed${NC}"
    echo -e "${YELLOW}📝 Note: Namespace '${NAMESPACE}' was not deleted${NC}"
}

# Main cleanup logic
if [[ "$CLEANUP_MODE" == "k8s" ]]; then
    cleanup_k8s
else
    cleanup_local
fi