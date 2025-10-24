# Kubernetes Deployment Guide

This directory contains Kubernetes manifests for deploying the Novel-to-Anime application to the `qmatrix` namespace.

## Prerequisites

- Docker installed and configured
- kubectl configured to access your Kubernetes cluster
- Access to the registry: `aslan-spock-register.qiniu.io`

## Architecture

The deployment consists of:

- **Frontend**: React application served by Nginx
- **Mock Server**: Node.js API server
- **Ingress**: Routes traffic to appropriate services
- **ConfigMap**: Environment configuration

## Quick Deployment

Run the deployment script:

```bash
./deploy.sh
```

## Manual Deployment

1. **Build and push Docker images:**

```bash
# Frontend
cd novel-to-anime-frontend
docker build -t aslan-spock-register.qiniu.io/qmatrix/novel-to-anime-frontend:latest .
docker push aslan-spock-register.qiniu.io/qmatrix/novel-to-anime-frontend:latest

# Mock Server
cd ../mock-server
docker build -t aslan-spock-register.qiniu.io/qmatrix/mock-server:latest .
docker push aslan-spock-register.qiniu.io/qmatrix/mock-server:latest
```

2. **Deploy to Kubernetes:**

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/mock-server-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

## Accessing the Application

Once deployed, the application will be available at:
- **Frontend**: `http://novel-to-anime.qmatrix.local`
- **API**: `http://novel-to-anime.qmatrix.local/api`

## Monitoring

Check deployment status:

```bash
# View pods
kubectl get pods -n qmatrix

# View services
kubectl get services -n qmatrix

# View ingress
kubectl get ingress -n qmatrix

# Watch pod status
kubectl get pods -n qmatrix -w

# View logs
kubectl logs -f deployment/novel-to-anime-frontend -n qmatrix
kubectl logs -f deployment/mock-server -n qmatrix
```

## Scaling

Scale deployments:

```bash
# Scale frontend
kubectl scale deployment novel-to-anime-frontend --replicas=5 -n qmatrix

# Scale mock server
kubectl scale deployment mock-server --replicas=3 -n qmatrix
```

## Cleanup

Remove all resources:

```bash
./cleanup.sh
```

Or manually:

```bash
kubectl delete -f k8s/ingress.yaml
kubectl delete -f k8s/frontend-deployment.yaml
kubectl delete -f k8s/mock-server-deployment.yaml
kubectl delete -f k8s/configmap.yaml
```

## Configuration

Environment variables are managed through the ConfigMap in `configmap.yaml`. Update the ConfigMap and restart deployments to apply changes:

```bash
kubectl apply -f k8s/configmap.yaml
kubectl rollout restart deployment/novel-to-anime-frontend -n qmatrix
kubectl rollout restart deployment/mock-server -n qmatrix
```

## Troubleshooting

### Common Issues

1. **Image pull errors**: Ensure you're authenticated with the registry
2. **Ingress not working**: Check if nginx-ingress controller is installed
3. **Pods not starting**: Check resource limits and node capacity

### Debug Commands

```bash
# Describe pod for detailed info
kubectl describe pod <pod-name> -n qmatrix

# Get events
kubectl get events -n qmatrix --sort-by='.lastTimestamp'

# Port forward for local testing
kubectl port-forward service/frontend-service 8080:80 -n qmatrix
kubectl port-forward service/mock-server-service 3001:3001 -n qmatrix
```