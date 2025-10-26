# Kubernetes 部署指南

## 🚀 一键部署

```bash
./deploy.sh k8s
```

这个命令会自动完成以下步骤：

1. **检查工具** - 验证 docker, go, kubectl 是否已安装
2. **构建后端**
   - 编译 Go 二进制文件 (Linux AMD64)
   - 构建 Docker 镜像
   - 推送到内部镜像仓库
3. **构建前端**
   - 构建前端 Docker 镜像 (使用已有的 dist)
   - 推送到内部镜像仓库
4. **部署到 Kubernetes**
   - 创建 namespace
   - 部署 MongoDB
   - 部署后端服务 (2 副本)
   - 部署前端服务 (3 副本)

## 📋 前置条件

### 必需工具
- `docker` - 用于构建镜像
- `go` - 用于编译后端
- `kubectl` - 用于部署到 Kubernetes

### 镜像仓库
- 内部仓库：`aslan-spock-register.qiniu.io/qmatrix`
- 必须有推送权限（需要先 `docker login`）

## 🔍 部署后验证

### 查看服务状态
```bash
kubectl get all -n txt-anime
```

### 查看日志
```bash
# 后端日志
kubectl logs -f -n txt-anime -l app=backend

# 前端日志
kubectl logs -f -n txt-anime -l app=frontend

# MongoDB 日志
kubectl logs -f -n txt-anime -l app=mongodb
```

### 端口转发访问
```bash
# 前端 (在后台运行)
kubectl port-forward -n txt-anime svc/frontend 3000:80 &

# 后端 (在后台运行)
kubectl port-forward -n txt-anime svc/backend 8080:8080 &

# 访问服务
open http://localhost:3000  # 前端
curl http://localhost:8080/health  # 后端健康检查
```

## 🧹 清理部署

```bash
kubectl delete namespace txt-anime
```

## 📦 镜像说明

部署脚本会自动构建和推送以下镜像：

| 镜像 | 标签 | 说明 |
|------|------|------|
| `novel2comicd-backend` | latest | 后端服务 (Go) |
| `novel2comicd-frontend` | latest | 前端服务 (React + Nginx) |
| `mongodb` | 5.0 | 数据库 (需要手动推送) |

### MongoDB 镜像推送 (首次部署时)

如果 MongoDB 镜像还未推送到内部仓库，需要先执行：

```bash
# 拉取公共镜像
docker pull --platform linux/amd64 mongo:5.0

# 打标签
docker tag mongo:5.0 aslan-spock-register.qiniu.io/qmatrix/mongodb:5.0

# 推送到内部仓库
docker push aslan-spock-register.qiniu.io/qmatrix/mongodb:5.0
```

## ⚠️ 注意事项

1. **前端构建**
   - 部署脚本假设前端已经构建好 (`dist` 目录存在)
   - 如果没有，脚本会自动执行 `npm install` 和 `npm run build`

2. **架构问题**
   - 所有镜像都必须是 `linux/amd64` 架构
   - 前端使用 `docker buildx` 构建以确保正确的架构
   - 后端使用交叉编译 `CGO_ENABLED=0 GOOS=linux GOARCH=amd64`

3. **网络要求**
   - 本地需要能访问 Docker Hub (用于拉取基础镜像)
   - Kubernetes 集群只能访问内部镜像仓库

## 🔄 更新部署

如果代码有更新，重新运行部署命令即可：

```bash
./deploy.sh k8s
```

脚本会自动：
- 重新编译和构建镜像
- 推送新镜像
- 更新 Kubernetes 部署

## 🎯 生产环境建议

1. **使用镜像标签**
   - 不要只用 `latest`
   - 使用版本号或 git commit hash

2. **配置持久化存储**
   - MongoDB 需要配置 PersistentVolume
   - 避免数据丢失

3. **配置资源限制**
   - 已在配置中设置合理的 requests/limits
   - 可根据实际负载调整

4. **启用监控和日志**
   - Prometheus + Grafana 监控
   - ELK Stack 日志收集

## 📚 相关文档

- [DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md) - 部署状态和详细说明
- [k8s/](k8s/) - Kubernetes 配置文件目录
