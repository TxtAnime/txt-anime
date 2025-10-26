#!/bin/bash

set -e

# Configuration
REGISTRY="aslan-spock-register.qiniu.io"
NAMESPACE="qmatrix"
PROJECT_NAME="txt-anime"
BACKEND_PORT=8080
FRONTEND_PORT=3000

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command line arguments
DEPLOY_MODE="local"
if [[ "$1" == "k8s" || "$1" == "kubernetes" ]]; then
    DEPLOY_MODE="k8s"
fi

echo -e "${GREEN}🚀 Starting deployment of ${PROJECT_NAME} in ${DEPLOY_MODE} mode${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1
    else
        return 0
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [[ -n "$pid" ]]; then
        echo -e "${YELLOW}🔄 Killing process on port $port (PID: $pid)${NC}"
        kill -9 $pid 2>/dev/null || true
        sleep 2
    fi
}

# Function for local deployment
deploy_local() {
    echo -e "${BLUE}🏠 Starting local deployment...${NC}"
    
    # Check required tools for local deployment
    echo -e "${YELLOW}📋 Checking required tools...${NC}"
    for tool in go node npm; do
        if ! command_exists $tool; then
            echo -e "${RED}❌ $tool is not installed${NC}"
            exit 1
        fi
    done
    echo -e "${GREEN}✅ All required tools are available${NC}"
    
    # Kill existing processes on ports
    kill_port $BACKEND_PORT
    kill_port $FRONTEND_PORT
    
    # Build backend
    echo -e "${YELLOW}🔨 Building backend...${NC}"
    go build -o novel2comicd ./cmd/novel2comicd
    if [[ $? -ne 0 ]]; then
        echo -e "${RED}❌ Backend build failed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Backend built successfully${NC}"
    
    # Make sure the binary is executable
    chmod +x novel2comicd
    
    # Check if config.json exists
    if [[ ! -f "config.json" ]]; then
        echo -e "${YELLOW}⚠️  config.json not found, copying from example...${NC}"
        cp config.json.example config.json
        echo -e "${YELLOW}📝 Please edit config.json with your actual configuration${NC}"
    fi
    
    # Start backend in background
    echo -e "${YELLOW}🚀 Starting backend server on port $BACKEND_PORT...${NC}"
    ./novel2comicd -config config.json &
    BACKEND_PID=$!
    echo $BACKEND_PID > .backend.pid
    
    # Wait for backend to start
    echo -e "${YELLOW}⏳ Waiting for backend to start...${NC}"
    for i in {1..30}; do
        if curl -s http://localhost:$BACKEND_PORT/health >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Backend is running on http://localhost:$BACKEND_PORT${NC}"
            break
        fi
        if [[ $i -eq 30 ]]; then
            echo -e "${RED}❌ Backend failed to start within 30 seconds${NC}"
            kill $BACKEND_PID 2>/dev/null || true
            exit 1
        fi
        sleep 1
    done
    
    # Setup frontend environment
    echo -e "${YELLOW}🔧 Setting up frontend environment...${NC}"
    cd novel-to-anime-frontend
    
    # Create .env file for frontend
    cat > .env << EOF
VITE_API_BASE_URL=http://localhost:$BACKEND_PORT
VITE_DEV_MODE=true
EOF
    
    # Install frontend dependencies if needed
    if [[ ! -d "node_modules" ]]; then
        echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
        npm install
    fi
    
    # Build frontend
    echo -e "${YELLOW}🔨 Building frontend...${NC}"
    npm run build
    if [[ $? -ne 0 ]]; then
        echo -e "${RED}❌ Frontend build failed${NC}"
        cd ..
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    
    # Start frontend development server
    echo -e "${YELLOW}🚀 Starting frontend server on port $FRONTEND_PORT...${NC}"
    npm run dev -- --port $FRONTEND_PORT --host 0.0.0.0 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../.frontend.pid
    cd ..
    
    # Wait for frontend to start
    echo -e "${YELLOW}⏳ Waiting for frontend to start...${NC}"
    for i in {1..30}; do
        if curl -s http://localhost:$FRONTEND_PORT >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Frontend is running on http://localhost:$FRONTEND_PORT${NC}"
            break
        fi
        if [[ $i -eq 30 ]]; then
            echo -e "${RED}❌ Frontend failed to start within 30 seconds${NC}"
            kill $BACKEND_PID 2>/dev/null || true
            kill $FRONTEND_PID 2>/dev/null || true
            exit 1
        fi
        sleep 1
    done
    
    # Run deployment verification
    echo -e "${YELLOW}🧪 Running deployment verification...${NC}"
    if [[ -f "test-integration.js" ]]; then
        if node test-integration.js; then
            echo -e "${GREEN}✅ Deployment verification passed${NC}"
        else
            echo -e "${YELLOW}⚠️  Deployment verification had issues, but services are running${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Verification script not found, skipping tests${NC}"
    fi
    
    echo -e "${GREEN}🎉 Local deployment completed successfully!${NC}"
    echo -e "${BLUE}📊 Service Status:${NC}"
    echo -e "  Backend:  http://localhost:$BACKEND_PORT"
    echo -e "  Frontend: http://localhost:$FRONTEND_PORT"
    echo -e "  API Docs: http://localhost:$BACKEND_PORT/swagger/index.html"
    echo ""
    echo -e "${YELLOW}📝 To stop services:${NC}"
    echo -e "  Backend PID: $BACKEND_PID (saved in .backend.pid)"
    echo -e "  Frontend PID: $FRONTEND_PID (saved in .frontend.pid)"
    echo -e "  Or run: ./cleanup.sh"
    echo ""
    echo -e "${YELLOW}🔍 Monitor logs:${NC}"
    echo -e "  Backend:  tail -f ./novel2comicd.log"
    echo -e "  Frontend: Check terminal output"
    echo ""
    echo -e "${YELLOW}🧪 Run full verification:${NC}"
    echo -e "  node test-full-deployment.js"
}

# Function for Kubernetes deployment
deploy_k8s() {
    echo -e "${BLUE}☸️  Starting Kubernetes deployment...${NC}"
    
    # Check required tools for k8s deployment
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

    # Build backend
    echo "Building backend..."
    docker build --platform linux/amd64 --no-cache -t ${REGISTRY}/${NAMESPACE}/novel2comicd-backend:latest .
    docker push ${REGISTRY}/${NAMESPACE}/novel2comicd-backend:latest

    # Build frontend
    echo "Building frontend..."
    cd novel-to-anime-frontend
    docker build --platform linux/amd64 --no-cache -t ${REGISTRY}/${NAMESPACE}/novel-to-anime-frontend:latest .
    docker push ${REGISTRY}/${NAMESPACE}/novel-to-anime-frontend:latest
    cd ..

    echo -e "${GREEN}✅ Docker images built and pushed${NC}"

    # Deploy to Kubernetes
    echo -e "${YELLOW}☸️  Deploying to Kubernetes...${NC}"

    # Apply namespace (if it doesn't exist)
    kubectl apply -f k8s/namespace.yaml

    # Apply ConfigMap
    kubectl apply -f k8s/configmap.yaml

    # Apply deployments and services
    kubectl apply -f k8s/backend-deployment.yaml
    kubectl apply -f k8s/frontend-deployment.yaml

    # Apply ingress
    kubectl apply -f k8s/ingress.yaml

    # Force restart deployments to pull new images
    echo "Restarting deployments to pull new images..."
    kubectl rollout restart deployment/novel2comicd-backend -n ${NAMESPACE}
    kubectl rollout restart deployment/novel-to-anime-frontend -n ${NAMESPACE}

    echo -e "${GREEN}✅ Kubernetes resources deployed${NC}"

    # Wait for deployments to be ready
    echo -e "${YELLOW}⏳ Waiting for deployments to be ready...${NC}"
    kubectl wait --for=condition=available --timeout=300s deployment/novel2comicd-backend -n ${NAMESPACE}
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
}

# Main deployment logic
if [[ "$DEPLOY_MODE" == "k8s" ]]; then
    deploy_k8s
else
    deploy_local
fi