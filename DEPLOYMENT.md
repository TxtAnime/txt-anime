# Deployment Guide

This guide explains how to deploy both frontend and backend services for the Novel-to-Anime project.

## Quick Start

### Local Development Deployment

```bash
# Deploy both services locally
./deploy.sh

# Test the deployment
./test-deployment.sh

# Stop all services
./cleanup.sh
```

### Kubernetes Deployment

```bash
# Deploy to Kubernetes cluster
./deploy.sh k8s

# Cleanup Kubernetes resources
./cleanup.sh k8s
```

## Local Deployment Details

### What the script does:

1. **Backend Setup:**
   - Builds the Go backend: `go build -o novel2comicd ./cmd/novel2comicd`
   - Starts the server: `./novel2comicd -config config.json`
   - Runs on port 8080

2. **Frontend Setup:**
   - Creates environment file with backend URL
   - Installs dependencies (if needed)
   - Builds the React application
   - Starts development server on port 3000

3. **Integration:**
   - Frontend configured to call backend at `http://localhost:8080`
   - CORS enabled for local development
   - Health checks ensure services are ready

### Service URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8080
- **API Documentation:** http://localhost:8080/swagger/index.html
- **Health Check:** http://localhost:8080/health

### API Endpoints

- `POST /v1/tasks/` - Create new conversion task
- `GET /v1/tasks/` - List all tasks
- `GET /v1/tasks/:id` - Get task details
- `GET /v1/tasks/:id/artifacts` - Get task artifacts
- `GET /artifacts/*` - Download artifact files

## Prerequisites

### For Local Deployment:
- Go 1.19+
- Node.js 18+
- npm or yarn
- MongoDB (configured in config.json)

### For Kubernetes Deployment:
- Docker
- kubectl
- Access to Kubernetes cluster
- Docker registry access

## Configuration

### Backend Configuration (config.json)
```json
{
  "server": {
    "port": 8080
  },
  "mongodb": {
    "uri": "mongodb://localhost:27017",
    "database": "novel2comic",
    "collection": "tasks"
  },
  "ai": {
    "base_url": "https://openai.qiniu.com/v1",
    "api_key": "your-api-key-here",
    "text_model": "deepseek-v3",
    "image_model": "gemini-2.5-flash-image"
  }
}
```

### Frontend Configuration (.env)
```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_DEV_MODE=true
```

## Troubleshooting

### Port Conflicts
If ports 8080 or 3000 are in use:
```bash
# Kill processes on specific ports
lsof -ti:8080 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

### Service Not Starting
1. Check if MongoDB is running
2. Verify config.json exists and is valid
3. Check for missing dependencies:
   ```bash
   go mod tidy
   cd novel-to-anime-frontend && npm install
   ```

### API Connection Issues
1. Verify backend is running: `curl http://localhost:8080/health`
2. Check frontend environment: `cat novel-to-anime-frontend/.env`
3. Look for CORS errors in browser console

## Monitoring

### Check Service Status
```bash
# Check if services are running
ps aux | grep novel2comicd
ps aux | grep vite

# Check ports
lsof -i:8080
lsof -i:3000
```

### View Logs
```bash
# Backend logs (if logging to file)
tail -f ./novel2comicd.log

# Frontend logs are in terminal output
```

## Development Workflow

1. **Start Development:**
   ```bash
   ./deploy.sh
   ```

2. **Make Changes:**
   - Backend: Edit Go files, script will rebuild automatically on next deploy
   - Frontend: Changes are hot-reloaded in development mode

3. **Test Changes:**
   ```bash
   ./test-deployment.sh
   ```

4. **Stop Services:**
   ```bash
   ./cleanup.sh
   ```

## Production Considerations

For production deployment:
- Use `./deploy.sh k8s` for Kubernetes
- Configure proper secrets management
- Set up monitoring and logging
- Use production-grade database
- Configure SSL/TLS certificates
- Set up proper backup strategies