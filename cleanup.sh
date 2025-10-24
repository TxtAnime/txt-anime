#!/bin/bash

set -e

NAMESPACE="qmatrix"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🧹 Cleaning up Kubernetes resources...${NC}"

# Delete ingress
kubectl delete -f k8s/ingress.yaml --ignore-not-found=true

# Delete deployments and services
kubectl delete -f k8s/frontend-deployment.yaml --ignore-not-found=true
kubectl delete -f k8s/mock-server-deployment.yaml --ignore-not-found=true

# Delete ConfigMap
kubectl delete -f k8s/configmap.yaml --ignore-not-found=true

echo -e "${GREEN}✅ Cleanup completed${NC}"
echo -e "${YELLOW}📝 Note: Namespace '${NAMESPACE}' was not deleted${NC}"