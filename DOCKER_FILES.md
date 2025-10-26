# Docker 镜像构建文件说明

## 📁 文件列表

### 必需文件

| 文件 | 用途 | 大小 |
|------|------|------|
| `Dockerfile.simple2` | 后端镜像构建 | 237B |
| `novel-to-anime-frontend/Dockerfile.simple` | 前端镜像构建 | 251B |

### 配置文件

| 文件 | 用途 | 大小 |
|------|------|------|
| `config.json.example` | 配置示例 | 550B |

## 🔨 构建说明

### 后端镜像 (Dockerfile.simple2)

```dockerfile
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY novel2comicd-linux ./novel2comicd
RUN mkdir -p outputs && chmod +x novel2comicd
EXPOSE 8080
CMD ["./novel2comicd", "-config", "/etc/config/config.json"]
```

**构建步骤**:
1. 使用 `alpine:latest` 作为基础镜像
2. 复制本地编译的 Linux 二进制文件
3. 设置执行权限

**为什么这样做**:
- ✅ 避免在构建时拉取 `golang` 镜像
- ✅ 镜像更小（只包含运行时依赖）
- ✅ 适合内网环境（只需要 alpine 基础镜像）

### 前端镜像 (novel-to-anime-frontend/Dockerfile.simple)

```dockerfile
FROM nginx:alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**构建步骤**:
1. 使用 `nginx:alpine` 作为基础镜像
2. 复制已构建的前端 dist 目录
3. 复制 nginx 配置

**为什么这样做**:
- ✅ 避免在构建时安装 Node.js
- ✅ 使用已构建的 dist 文件
- ✅ 镜像更小

## 🚀 自动构建流程

使用 `./deploy.sh k8s` 时的完整流程：

### 后端构建
```bash
# 1. 编译 Go 代码
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o novel2comicd-linux

# 2. 构建 Docker 镜像
docker build -f Dockerfile.simple2 -t backend:latest .

# 3. 推送到内部仓库
docker push aslan-spock-register.qiniu.io/qmatrix/novel2comicd-backend:latest
```

### 前端构建
```bash
# 1. 拉取 amd64 nginx 镜像
docker pull --platform linux/amd64 nginx:alpine

# 2. 构建 Docker 镜像
docker buildx build --platform linux/amd64 \
  -f Dockerfile.simple \
  -t frontend:latest .

# 3. 推送到内部仓库
docker push aslan-spock-register.qiniu.io/qmatrix/novel2comicd-frontend:latest
```

## ⚠️ 重要说明

### 架构一致性
所有镜像必须是 `linux/amd64` 架构：
- ✅ 后端：使用 `GOOS=linux GOARCH=amd64` 交叉编译
- ✅ 前端：使用 `docker buildx --platform linux/amd64`

### 基础镜像
需要提前拉取或在内部仓库中准备：
- `alpine:latest` - 后端基础镜像
- `nginx:alpine` - 前端基础镜像

### 网络环境
- **本地**: 需要能访问 Docker Hub（拉取基础镜像）
- **K8s 集群**: 只能访问内部镜像仓库

## 📝 配置文件说明

### config.json.example

提供了完整的配置示例，包括：
- MongoDB 连接配置
- AI 服务配置
- 七牛云存储配置

使用方法：
```bash
cp config.json.example config.json
# 然后修改 config.json 中的实际配置
```

## 🔄 更新镜像

当代码有更新时：
```bash
# 只需要重新运行部署脚本
./deploy.sh k8s

# 脚本会自动：
# 1. 重新编译代码
# 2. 重新构建镜像
# 3. 推送新镜像
# 4. 更新 K8s 部署
```

## 🗑️ 已删除的文件

以下文件已被删除（不再需要）：
- ❌ `Dockerfile` - 原始多阶段构建（需要网络拉取 golang 镜像）
- ❌ `Dockerfile.simple` - 中间版本（已被 simple2 替代）
- ❌ `deploy.sh.backup` - 备份文件（不需要）

## 📚 相关文档

- [README_DEPLOY.md](README_DEPLOY.md) - 部署指南
- [deploy.sh](deploy.sh) - 自动化部署脚本
- [k8s/](k8s/) - Kubernetes 配置
