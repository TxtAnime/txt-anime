# Kubernetes 配置文件

本目录包含部署到 Kubernetes 所需的所有配置文件。

## 📁 文件说明

| 文件 | 说明 |
|------|------|
| `namespace.yaml` | 创建 txt-anime 命名空间 |
| `mongodb.yaml` | MongoDB 数据库部署和服务 |
| `backend.yaml` | 后端服务部署、ConfigMap 和 Service |
| `frontend.yaml` | 前端服务部署和 Service (LoadBalancer) |

## 🚀 快速部署

### 使用部署脚本（推荐）
```bash
# 从项目根目录运行
./deploy.sh k8s
```

### 手动部署
```bash
# 1. 创建命名空间
kubectl apply -f namespace.yaml

# 2. 部署 MongoDB
kubectl apply -f mongodb.yaml

# 3. 部署后端
kubectl apply -f backend.yaml

# 4. 部署前端
kubectl apply -f frontend.yaml

# 5. 查看部署状态
kubectl get all -n txt-anime
```

## 📊 部署架构

```
txt-anime namespace
├── MongoDB (1 replica)
│   └── Service: mongodb:27017 (ClusterIP)
├── Backend (2 replicas)
│   └── Service: backend:8080 (ClusterIP)
└── Frontend (3 replicas)
    └── Service: frontend:80 (LoadBalancer)
```

## 🔍 验证部署

```bash
# 查看所有资源
kubectl get all -n txt-anime

# 查看 Pod 状态
kubectl get pods -n txt-anime -w

# 查看服务
kubectl get svc -n txt-anime

# 查看日志
kubectl logs -f -n txt-anime -l app=backend
kubectl logs -f -n txt-anime -l app=frontend
kubectl logs -f -n txt-anime -l app=mongodb
```

## 🌐 访问服务

### 端口转发
```bash
# 前端
kubectl port-forward -n txt-anime svc/frontend 3000:80

# 后端
kubectl port-forward -n txt-anime svc/backend 8080:8080

# 访问
open http://localhost:3000
curl http://localhost:8080/health
```

### 使用 LoadBalancer
```bash
# 查看外部 IP
kubectl get svc frontend -n txt-anime

# 如果有 EXTERNAL-IP，直接访问
# http://<EXTERNAL-IP>
```

## 🔧 配置说明

### Backend ConfigMap
后端配置包含在 `backend.yaml` 中的 ConfigMap，包括：
- MongoDB 连接信息
- AI 服务配置
- 七牛云存储配置

### 资源限制
所有服务都配置了合理的资源请求和限制：

| 服务 | Requests | Limits |
|------|----------|--------|
| Backend | 256Mi / 200m CPU | 512Mi / 500m CPU |
| Frontend | 64Mi / 50m CPU | 128Mi / 100m CPU |
| MongoDB | 256Mi / 200m CPU | 512Mi / 500m CPU |

### 健康检查
- Backend: HTTP `/health` 端点
- Frontend: HTTP `/` 端点
- MongoDB: TCP 27017 端口

## 🧹 清理部署

```bash
# 删除整个命名空间（包括所有资源）
kubectl delete namespace txt-anime

# 或者单独删除资源
kubectl delete -f frontend.yaml
kubectl delete -f backend.yaml
kubectl delete -f mongodb.yaml
kubectl delete -f namespace.yaml
```

## ⚙️ 自定义配置

### 修改副本数
```yaml
# 编辑 backend.yaml 或 frontend.yaml
spec:
  replicas: 3  # 修改为所需数量
```

### 修改资源限制
```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

### 修改后端配置
编辑 `backend.yaml` 中的 ConfigMap 部分。

## 📝 注意事项

1. **镜像仓库**
   - 所有镜像都使用内部仓库：`aslan-spock-register.qiniu.io/qmatrix`
   - 镜像需要提前构建并推送（使用 `./deploy.sh k8s`）

2. **MongoDB 数据持久化**
   - 当前使用容器存储
   - 生产环境建议配置 PersistentVolume

3. **网络**
   - 后端和前端通过 Service 名称互相访问
   - MongoDB 只在集群内部可访问

## 🎯 生产环境优化

- [ ] 配置 PersistentVolume 用于 MongoDB
- [ ] 配置 Ingress 替代 LoadBalancer
- [ ] 启用 MongoDB 认证
- [ ] 配置 TLS/SSL
- [ ] 配置 HPA (Horizontal Pod Autoscaler)
- [ ] 配置 NetworkPolicy
- [ ] 添加监控和告警

## 📚 相关文档

- [../README_DEPLOY.md](../README_DEPLOY.md) - 部署指南
- [../DEPLOYMENT_STATUS.md](../DEPLOYMENT_STATUS.md) - 部署状态
- [../deploy.sh](../deploy.sh) - 自动化部署脚本
