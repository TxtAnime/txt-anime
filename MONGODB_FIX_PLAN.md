# MongoDB 连接问题修复方案

## 问题诊断

### 1. 镜像拉取问题
- ❌ Docker Hub 镜像（mongo:5.0, mongo:7.0）无法拉取 - 网络连接超时
- ❌ Node.js 镜像（node:18-alpine）无法拉取 - 网络连接超时  
- ❌ 前端镜像不存在：`aslan-spock-register.qiniu.io/qmatrix/novel2comicd-frontend:latest`
- ✅ 后端镜像存在：`aslan-spock-register.qiniu.io/qmatrix/novel2comicd-backend:latest`

### 2. 当前状态
```
Pod 状态：
- MongoDB: ImagePullBackOff (无法拉取 node:18-alpine)
- Backend: CrashLoopBackOff (无法连接到 MongoDB)
- Frontend: ImagePullBackOff (镜像不存在)
```

### 3. 后端日志
```
2025/10/25 12:21:17 加载配置文件: /etc/config/config.json
2025/10/25 12:21:17 连接 MongoDB: mongodb://mongodb:27017
```
后端可以正确加载配置，但因为 MongoDB 未就绪而无法启动。

## 解决方案

### 方案 1: 构建并推送前端镜像
```bash
cd novel-to-anime-frontend
docker build --platform linux/amd64 -t aslan-spock-register.qiniu.io/qmatrix/novel2comicd-frontend:latest .
docker push aslan-spock-register.qiniu.io/qmatrix/novel2comicd-frontend:latest
```

### 方案 2: 部署内部可访问的 MongoDB
需要使用七牛内部镜像仓库中的 MongoDB 镜像，或者：

#### 选项 A: 使用已有的内部 MongoDB 服务
修改 `k8s/backend.yaml` 中的 MongoDB 连接字符串指向现有的 MongoDB 服务。

#### 选项 B: 构建自定义 MongoDB 镜像
```bash
# 创建简单的 Dockerfile
cat > Dockerfile.mongodb << 'EOF'
FROM aslan-spock-register.qiniu.io/基础镜像
# 安装并配置 MongoDB
EOF

docker build -f Dockerfile.mongodb -t aslan-spock-register.qiniu.io/qmatrix/mongodb:latest .
docker push aslan-spock-register.qiniu.io/qmatrix/mongodb:latest
```

### 方案 3: 修改应用使其不依赖 MongoDB
如果 MongoDB 仅用于任务队列/缓存，可以：
1. 修改后端代码，使 MongoDB 连接失败不阻塞启动
2. 使用内存存储作为备用方案

## 推荐的修复步骤

### 步骤 1: 构建前端镜像
```bash
cd novel-to-anime-frontend
docker build --platform linux/amd64 -t aslan-spock-register.qiniu.io/qmatrix/novel2comicd-frontend:latest .
docker push aslan-spock-register.qiniu.io/qmatrix/novel2comicd-frontend:latest
cd ..
```

### 步骤 2: 检查可用的 MongoDB 镜像
```bash
# 检查内部镜像仓库中是否有 MongoDB
# 或者使用外部 MongoDB 服务（如果有）
```

### 步骤 3: 更新配置并重新部署
```bash
kubectl delete namespace txt-anime
./deploy.sh k8s
```

### 步骤 4: 验证部署
```bash
kubectl get pods -n txt-anime -w
kubectl logs -f -n txt-anime -l app=backend
```

## 已创建的 Kubernetes 资源

### 核心文件（已创建并就绪）
1. ✅ `k8s/namespace.yaml` - txt-anime 命名空间
2. ✅ `k8s/backend.yaml` - 后端部署和服务（ConfigMap + Deployment + Service）
3. ✅ `k8s/frontend.yaml` - 前端部署和服务
4. ✅ `k8s/mongodb.yaml` - MongoDB 模拟服务（需要可用镜像）
5. ✅ `deploy.sh` - 自动化部署脚本

### 配置特点
- 后端：2 副本，健康检查，资源限制
- 前端：3 副本，LoadBalancer 服务
- MongoDB：模拟服务，需要解决镜像问题

## 下一步行动

请选择以下之一：

### 选项 1: 构建所有必要的镜像
```bash
# 构建前端
cd novel-to-anime-frontend
docker build --platform linux/amd64 -t aslan-spock-register.qiniu.io/qmatrix/novel2comicd-frontend:latest .
docker push aslan-spock-register.qiniu.io/qmatrix/novel2comicd-frontend:latest
cd ..

# 如果需要自定义 MongoDB，也需要构建
```

### 选项 2: 使用外部 MongoDB
提供外部 MongoDB 连接信息，我将更新配置：
- MongoDB URI
- 数据库名
- 认证信息（如需要）

### 选项 3: 修改后端使其可选依赖 MongoDB
修改后端代码，使其在 MongoDB 不可用时仍能启动（功能降级）。

请告诉我您想采用哪个方案！
